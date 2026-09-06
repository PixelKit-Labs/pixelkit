/**
 * @file DashboardScreen.tsx
 * @description Silicon and hardware telemetry HUD. Every value is either read from the device through
 * the PixelNative module / Expo modules or shown as "—". Cards carry a provenance tag (HW / DERIVED /
 * SIMULATED / N/A). Pro-exclusive features that have no public API (HiLight) or no hardware on this
 * device (thermometer) say so. A live observability panel lists the latest hook events.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useDevice } from '../hardware/useDevice';
import { useADPF } from '../hardware/useADPF';
import { useCPU } from '../hardware/useCPU';
import { useGPU } from '../hardware/useGPU';
import { useMemory } from '../hardware/useMemory';
import { useTPU } from '../ai/useTPU';
import { useSensors } from '../hardware/useSensors';
import { useBiometrics } from '../hardware/useBiometrics';
import { useDisplay } from '../hardware/useDisplay';
import { useTorch } from '../hardware/useTorch';
import { useHiLight } from '../hardware/useHiLight';
import { useTemperature } from '../hardware/useTemperature';
import { useUWB } from '../hardware/useUWB';
import { useCapabilities } from '../hardware/useCapabilities';
import { useObservability } from '../core/observability';
import { MetricCard } from '../components/MetricCard';
import { HapticButton } from '../components/HapticButton';
import { Colors, Gradients, Type } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { SectionHeader, OrbitRings, Chip } from '../components/Decor';

const fmt = (v: number | null | undefined, digits = 0) => (v == null ? null : Number(v.toFixed(digits)));
const pct = (v: number | null | undefined) => (v == null ? null : Math.round(v * 100));

export const DashboardScreen: React.FC = () => {
  const caps = useCapabilities();
  const device = useDevice();
  const adpf = useADPF();
  const cpu = useCPU();
  const gpu = useGPU();
  const memory = useMemory();
  const tpu = useTPU();
  const sensors = useSensors(200);
  const biometrics = useBiometrics();
  const display = useDisplay();
  const torch = useTorch();
  const hilight = useHiLight();
  const temp = useTemperature();
  const uwb = useUWB();
  const obs = useObservability();

  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleTestBiometrics = async () => {
    const success = await biometrics.authenticate('Confirm identity with the Pixel biometric prompt');
    setAuthStatus(success ? 'Verified via biometrics' : 'Authentication failed or cancelled');
    setTimeout(() => setAuthStatus(null), 3000);
  };

  const brand = device.brand ? device.brand.charAt(0).toUpperCase() + device.brand.slice(1) : '';
  const recentEvents = obs.events.slice(-8).reverse();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 500); }} tintColor={Colors.dark.primary} />
      }
    >
      {/* Hero */}
      <View style={styles.hero}>
        <LinearGradient colors={[...Gradients.hero]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <OrbitRings size={300} rings={6} style={{ top: -120, right: -110 }} />
        <View style={styles.heroTop}>
          <Chip label={`Android ${device.osVersion} · API ${caps.androidApiLevel ?? '?'}`} color={Colors.dark.secondary} />
          <View style={[styles.onlineBadge]}>
            <View style={[styles.onlineDot, { backgroundColor: device.isConnected ? Colors.dark.success : Colors.dark.error }]} />
            <Text style={styles.onlineText}>{device.networkType}</Text>
          </View>
        </View>
        <Text style={styles.heroEyebrow}>{brand} · {caps.verification === 'device' ? 'device-verified' : 'model table'}</Text>
        <Text style={styles.heroTitle}>{device.modelName}</Text>
        <View style={styles.heroChips}>
          <Chip label={display.refreshRateHz ? `${display.refreshRateHz} Hz${display.hasArrSupport ? ' · ARR' : ''}` : '— Hz'} color={Colors.dark.tertiary} />
          <Chip label={`Gemini Nano ${caps.geminiNanoTier.replace('nano-', '')}`} color={Colors.dark.tensorGlow} />
          <Chip label={adpf.thermalStatus} color={adpf.thermalStatusCode === 0 ? Colors.dark.success : Colors.dark.warning} />
        </View>
      </View>

      {/* CPU */}
      <SectionHeader title="Tensor G6 CPU" />
      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <MetricCard
            title="Cluster utilisation"
            value={cpu.cpuLoadPercent}
            unit="%"
            badge={`${cpu.coreCount || '?'} cores`}
            badgeColor={Colors.dark.primary}
            subtitle="avg current/max frequency"
            source={cpu.cpuLoadPercent == null ? 'unavailable' : 'hardware'}
          />
        </View>
        <View style={styles.gridCol}>
          <MetricCard
            title="This app CPU"
            value={cpu.appCpuPercent}
            unit="%"
            badge={cpu.governorMode}
            badgeColor={Colors.dark.success}
            subtitle="process time / wall time"
            source={cpu.appCpuPercent == null ? 'unavailable' : 'derived'}
          />
        </View>
      </View>
      <MetricCard
        title="Topology"
        value={cpu.coreTopology}
        subtitle={cpu.cores.length ? cpu.cores.map(c => `${c.curMHz ?? '—'}`).join(' · ') + ' MHz now' : 'Reading cpufreq…'}
        badge="/proc/cpuinfo + cpufreq"
        badgeColor={Colors.dark.primary}
        source={cpu.source}
      />
      <HapticButton
        title={cpu.isBenchmarking ? 'Running JS prime sieve…' : `JS single-thread benchmark${cpu.lastBenchmarkDurationMs != null ? ` (${cpu.lastBenchmarkDurationMs} ms)` : ''}`}
        onPress={() => { void cpu.benchmarkCPU(); }}
        disabled={cpu.isBenchmarking}
        variant="secondary"
        style={styles.actionButton}
      />

      {/* Thermal / ADPF */}
      <SectionHeader title="Thermal & ADPF headroom" />
      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <MetricCard
            title="Thermal headroom"
            value={fmt(adpf.thermalHeadroom, 2)}
            badge={adpf.thermalStatus.toUpperCase()}
            badgeColor={adpf.thermalStatusCode === 0 ? Colors.dark.success : adpf.thermalStatusCode < 3 ? Colors.dark.warning : Colors.dark.error}
            subtitle="0 cool → 1 throttling (10 s poll)"
            source={adpf.thermalHeadroom == null ? 'unavailable' : 'hardware'}
          />
        </View>
        <View style={styles.gridCol}>
          <MetricCard
            title="CPU / GPU headroom"
            value={adpf.cpuHeadroom == null ? null : `${pct(adpf.cpuHeadroom)} / ${pct(adpf.gpuHeadroom) ?? '—'}`}
            unit="%"
            badge="SystemHealth"
            badgeColor={Colors.dark.primary}
            subtitle="Android 16+ API"
            source={adpf.cpuHeadroom == null ? 'unavailable' : 'hardware'}
          />
        </View>
      </View>

      {/* GPU & frames */}
      <SectionHeader title="GPU & frame pacing" />
      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <MetricCard
            title="Frame interval"
            value={gpu.frameRenderTimeMs}
            unit="ms"
            badge={`budget ${gpu.targetBudgetMs} ms`}
            badgeColor={gpu.isStuttering ? Colors.dark.warning : Colors.dark.success}
            subtitle={`max ${gpu.maxFrameMs ?? '—'} ms • jank ${gpu.droppedFrameCount}`}
            source={gpu.frameRenderTimeMs == null ? 'unavailable' : 'hardware'}
          />
        </View>
        <View style={styles.gridCol}>
          <MetricCard
            title="Presented FPS"
            value={gpu.measuredFps}
            unit="FPS"
            badge={adpf.targetFps ? `${adpf.targetFps} Hz mode` : '—'}
            badgeColor={Colors.dark.success}
            subtitle="Choreographer, 1 s window"
            source={gpu.measuredFps == null ? 'unavailable' : 'hardware'}
          />
        </View>
      </View>
      <MetricCard
        title="GPU"
        value={gpu.gpuRenderer ?? null}
        badge={gpu.graphicsApi ?? 'EGL'}
        badgeColor={Colors.dark.primary}
        subtitle={gpu.gpuVendor ? `Vendor ${gpu.gpuVendor} • GPU memory not exposed by Android` : 'Querying EGL…'}
        source={gpu.gpuRenderer ? 'hardware' : 'unavailable'}
      />

      {/* Memory */}
      <SectionHeader title="Memory" />
      <MetricCard
        title="System RAM"
        value={memory.usedRAMMB || null}
        unit="MB used"
        badge={memory.isLowMemory ? 'LOW MEMORY' : 'OK'}
        badgeColor={memory.isLowMemory ? Colors.dark.error : Colors.dark.primary}
        subtitle={memory.totalRAMMB ? `Free ${memory.freeRAMMB} of ${memory.totalRAMMB} MB • LMK threshold ${memory.lowMemoryThresholdMB} MB` : 'Reading ActivityManager…'}
        source={memory.source}
      />
      <MetricCard
        title="This app"
        value={memory.appJavaHeapMB || null}
        unit="MB Java heap"
        badge={`native ${memory.appNativeHeapMB} MB`}
        badgeColor={Colors.dark.primary}
        subtitle={`Heap limit ${memory.appJavaHeapMaxMB} MB`}
        source={memory.source}
      />
      <HapticButton title="Request GC and re-read" onPress={memory.purgeCaches} variant="outline" style={styles.actionButton} />

      {/* On-device AI */}
      <SectionHeader title="On-device AI stack" />
      <MetricCard
        title="AICore (Gemini Nano host)"
        value={tpu.aicoreInstalled ? 'Installed' : 'Not installed'}
        badge={caps.geminiNanoTier.toUpperCase()}
        badgeColor={tpu.aicoreInstalled ? Colors.dark.tensorGlow : Colors.dark.warning}
        subtitle={`${tpu.aicoreVersion ?? '—'} • NPU feature ${tpu.hasNpuFeature == null ? '?' : tpu.hasNpuFeature ? 'declared' : 'not declared'} • inference not wired yet`}
        source={tpu.source}
      />

      {/* Pro exclusives */}
      <SectionHeader title="Pixel Pro exclusives" />
      <MetricCard
        title="HiLight camera-bar LED"
        value={hilight.isActive ? 'Illuminated (virtual)' : 'Standby'}
        badge={hilight.availability.toUpperCase()}
        badgeColor={hilight.availability === 'simulated' ? Colors.dark.warning : Colors.dark.error}
        subtitle={hilight.isHardwareSupported ? 'Hardware present; Google exposes no third-party API, state is mirrored on-screen' : 'Not on this device'}
        source={hilight.availability === 'simulated' ? 'simulated' : 'unavailable'}
      />
      {hilight.isHardwareSupported && (
        <View style={styles.rowButtons}>
          <HapticButton title="Gemini pulse" onPress={() => hilight.triggerGeminiPulse(3500)} variant="secondary" style={{ flex: 1, marginRight: 4 }} />
          <HapticButton title="Contact alert" onPress={() => hilight.triggerContactAlert('#81C995', 3500)} variant="secondary" style={{ flex: 1, marginHorizontal: 4 }} />
          <HapticButton title={hilight.isActive ? 'Off' : 'Toggle'} onPress={hilight.toggle} variant="outline" style={{ flex: 1, marginLeft: 4 }} />
        </View>
      )}
      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <MetricCard
            title="IR thermometer"
            value={temp.isHardwareSupported ? temp.reading.celsius : null}
            unit="°C"
            badge={temp.isHardwareSupported ? 'HARDWARE' : 'NO SENSOR'}
            badgeColor={temp.isHardwareSupported ? Colors.dark.success : Colors.dark.error}
            subtitle={temp.isHardwareSupported ? 'Pixel 8-10 Pro thermopile' : 'Removed on Pixel 11 Pro'}
            source={temp.isHardwareSupported ? 'hardware' : 'unavailable'}
          />
        </View>
        <View style={styles.gridCol}>
          <MetricCard
            title="UWB ranging"
            value={caps.hasUWB ? 'Radio present' : 'No radio'}
            badge="SIMULATED"
            badgeColor={Colors.dark.warning}
            subtitle={caps.hasUWB ? 'Android 16 RangingManager not wired yet' : '—'}
            source="simulated"
          />
        </View>
      </View>
      {caps.hasUWB && (
        <HapticButton title={uwb.isRanging ? 'Simulated ranging…' : 'Run simulated UWB ranging'} onPress={uwb.startRanging} disabled={uwb.isRanging} variant="secondary" style={styles.actionButton} />
      )}

      {/* Torch */}
      <SectionHeader title="Rear LED torch" />
      <MetricCard
        title="Flashlight"
        value={torch.isAvailable ? (torch.isTorchOn ? 'ON' : 'OFF') : null}
        badge={torch.isStrobing ? 'STROBING' : torch.maxStrengthLevel ? `${torch.maxStrengthLevel} levels` : 'CameraManager'}
        badgeColor={torch.isTorchOn ? Colors.dark.warning : Colors.dark.primary}
        subtitle={torch.error ?? 'State follows the system torch callback'}
        source={torch.source}
      />
      <View style={styles.rowButtons}>
        <HapticButton
          title={torch.isTorchOn ? 'Torch off' : 'Torch on'}
          onPress={() => { void torch.toggleTorch(); }}
          disabled={!torch.isAvailable}
          variant={torch.isTorchOn ? 'danger' : 'primary'}
          style={{ flex: 1, marginRight: 6 }}
        />
        <HapticButton
          title={torch.isStrobing ? 'Stop strobe' : 'SOS strobe'}
          onPress={torch.isStrobing ? torch.stopStrobe : () => torch.startStrobe(150)}
          disabled={!torch.isAvailable}
          variant="outline"
          style={{ flex: 1, marginLeft: 6 }}
        />
      </View>
      {torch.maxStrengthLevel != null && torch.maxStrengthLevel > 1 && (
        <View style={styles.rowButtons}>
          <HapticButton title="Dim" onPress={() => { void torch.setTorch(true, 1); }} variant="secondary" style={{ flex: 1, marginRight: 4 }} />
          <HapticButton title="Half" onPress={() => { void torch.setTorch(true, Math.ceil((torch.maxStrengthLevel ?? 2) / 2)); }} variant="secondary" style={{ flex: 1, marginHorizontal: 4 }} />
          <HapticButton title="Max" onPress={() => { void torch.setTorch(true, torch.maxStrengthLevel ?? 1); }} variant="secondary" style={{ flex: 1, marginLeft: 4 }} />
        </View>
      )}

      {/* Power & atmosphere */}
      <SectionHeader title="Power & atmosphere" />
      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <MetricCard
            title="Battery"
            value={device.batteryLevel}
            unit="%"
            badge={device.isCharging ? 'CHARGING' : 'DISCHARGING'}
            badgeColor={device.isCharging ? Colors.dark.success : Colors.dark.warning}
            subtitle={device.lowPowerMode ? 'Battery Saver on' : 'Normal power profile'}
            source="hardware"
          />
        </View>
        <View style={styles.gridCol}>
          <MetricCard
            title="Barometer"
            value={sensors.barometer.pressure}
            unit="hPa"
            badge={`${sensors.barometer.relativeAltitude ?? 0} m ISA`}
            badgeColor={Colors.dark.tertiary}
            subtitle="Goermicro SPA18001"
            source="hardware"
          />
        </View>
      </View>

      {/* Security */}
      <SectionHeader title="Security" />
      <MetricCard
        title="Biometrics & keystore"
        value={biometrics.hasHardware ? 'Ready' : 'No hardware'}
        badge={caps.hasStrongBox ? 'STRONGBOX' : caps.hasTitanM3 ? 'TITAN M3' : 'TEE'}
        badgeColor={Colors.dark.accent}
        subtitle={authStatus ?? `StrongBox ${caps.hasStrongBox == null ? '?' : caps.hasStrongBox ? 'present' : 'absent'} • fingerprint + face`}
        source={caps.verification === 'device' ? 'hardware' : 'derived'}
      />
      <HapticButton title="Test biometric prompt" onPress={handleTestBiometrics} variant="outline" style={styles.actionButton} />

      {/* Display wake lock */}
      <View style={styles.displayControlRow}>
        <Text style={styles.controlText}>
          Keep awake: <Text style={{ color: display.isKeepAwake ? Colors.dark.success : Colors.dark.textMuted }}>{display.isKeepAwake ? 'ON' : 'OFF'}</Text>
        </Text>
        <HapticButton title={display.isKeepAwake ? 'Allow sleep' : 'Lock awake'} onPress={display.toggleKeepAwake} variant="secondary" style={{ paddingVertical: 8, paddingHorizontal: 16 }} />
      </View>

      {/* Observability */}
      <SectionHeader title="Observability" />
      <View style={styles.obsCard}>
        <Text style={styles.obsTitle}>Sources by module</Text>
        <View style={styles.chipRow}>
          {Object.entries(obs.sources).map(([mod, srcs]) => (
            <View key={mod} style={[styles.chip, { borderColor: srcs.includes('simulated') ? Colors.dark.warning : srcs.includes('unavailable') && srcs.length === 1 ? Colors.dark.error : Colors.dark.success }]}>
              <Text style={styles.chipText}>{mod.replace(/^use/, '')}: {srcs.join('/')}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.obsTitle, { marginTop: 10 }]}>Recent events (adb logcat -s ReactNativeJS | grep PixelForge)</Text>
        {recentEvents.length === 0 && <Text style={styles.obsLine}>—</Text>}
        {recentEvents.map((e, i) => (
          <Text key={`${e.ts}-${i}`} style={[styles.obsLine, e.level === 'error' && { color: Colors.dark.error }, e.level === 'warn' && { color: Colors.dark.warning }]} numberOfLines={2}>
            {new Date(e.ts).toLocaleTimeString()} {e.module} · {e.event}{e.data ? ' ' + JSON.stringify(e.data).slice(0, 90) : ''}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { padding: 16, paddingBottom: 120 },
  hero: {
    backgroundColor: Colors.dark.card, borderRadius: 28, borderWidth: 1, borderColor: Colors.dark.cardBorder,
    padding: 20, marginBottom: 8, overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  heroEyebrow: { ...Type.label, color: Colors.dark.textMuted, marginBottom: 4 },
  heroTitle: { ...Type.display, color: Colors.dark.text, marginBottom: 14 },
  heroChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surfaceVariant, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  onlineText: { color: Colors.dark.text, fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', marginHorizontal: -6 },
  gridCol: { flex: 1, paddingHorizontal: 6 },
  actionButton: { marginBottom: 16 },
  rowButtons: { flexDirection: 'row', marginBottom: 12 },
  displayControlRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.dark.card, padding: 14, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.dark.cardBorder, marginTop: 8,
  },
  controlText: { color: Colors.dark.text, fontSize: 13, fontWeight: '600' },
  obsCard: { backgroundColor: Colors.dark.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.cardBorder, padding: 14 },
  obsTitle: { color: Colors.dark.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { color: Colors.dark.text, fontSize: 10, fontWeight: '600' },
  obsLine: { color: Colors.dark.textMuted, fontSize: 11, fontVariant: ['tabular-nums'], marginTop: 3 },
});

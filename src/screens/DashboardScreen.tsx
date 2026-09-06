/**
 * @file DashboardScreen.tsx
 * @description Central silicon and hardware diagnostics HUD.
 * Renders real-time compute telemetry: 120Hz LTPO frame pacing, ADPF thermal headroom,
 * multi-core CPU cluster, GPU Vulkan pipeline, LPDDR5X RAM, Google Tensor TPU latency benchmark,
 * rear LED flashlight, infrared thermometer, and Ultra-Wideband (UWB) spatial radar.
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
import { useTemperature } from '../hardware/useTemperature';
import { useUWB } from '../hardware/useUWB';
import { MetricCard } from '../components/MetricCard';
import { HapticButton } from '../components/HapticButton';
import { Colors } from '../theme/colors';

export const DashboardScreen: React.FC = () => {
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
  const temp = useTemperature();
  const uwb = useUWB();

  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleTestBiometrics = async () => {
    const success = await biometrics.authenticate('Test Titan M2 Biometric Enclave');
    setAuthStatus(success ? 'Verified via Biometrics' : 'Authentication Failed/Cancelled');
    setTimeout(() => setAuthStatus(null), 3000);
  };

  const handleRunTpuBenchmark = async () => {
    await tpu.benchmarkTPU();
  };

  const handleRunCpuBenchmark = async () => {
    await cpu.benchmarkCPU();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            setTimeout(() => setRefreshing(false), 500);
          }}
          tintColor={Colors.dark.primary}
        />
      }
    >
      {/* Top Banner */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.brandTitle}>{device.brand} {device.modelName}</Text>
          <Text style={styles.osSubtitle}>{device.osVersion} • 120Hz LTPO OLED</Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>{device.networkType}</Text>
        </View>
      </View>

      {/* Silicon & Compute Cluster */}
      <Text style={styles.sectionHeader}>Tensor Silicon & Multi-Core Cluster</Text>
      
      {/* CPU Cluster */}
      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <MetricCard
            title="CPU Utilization"
            value={cpu.cpuLoadPercent}
            unit="%"
            badge={`${cpu.coreCount} Cores`}
            badgeColor={Colors.dark.primary}
            subtitle={cpu.coreTopology}
          />
        </View>
        <View style={styles.gridCol}>
          <MetricCard
            title="CPU Headroom"
            value={Math.round(adpf.cpuHeadroom * 100)}
            unit="%"
            badge="ADPF Active"
            badgeColor={Colors.dark.success}
            subtitle={`Governor: ${cpu.governorMode.toUpperCase()}`}
          />
        </View>
      </View>

      <HapticButton
        title={cpu.isBenchmarking ? "Running Factorization Benchmark..." : `Benchmark CPU (${cpu.lastBenchmarkDurationMs} ms)`}
        onPress={handleRunCpuBenchmark}
        disabled={cpu.isBenchmarking}
        variant="secondary"
        style={styles.actionButton}
      />

      {/* GPU Graphics Engine */}
      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <MetricCard
            title="GPU Pacing"
            value={gpu.frameRenderTimeMs}
            unit="ms"
            badge="Vulkan 1.3"
            badgeColor={gpu.isStuttering ? Colors.dark.warning : Colors.dark.success}
            subtitle={`Target <= ${gpu.targetBudgetMs}ms • Drops: ${gpu.droppedFrameCount}`}
          />
        </View>
        <View style={styles.gridCol}>
          <MetricCard
            title="Display Rate"
            value={adpf.currentFps}
            unit="FPS"
            badge="120Hz LTPO"
            badgeColor={Colors.dark.success}
            subtitle={`Thermal: ${adpf.thermalStatus.toUpperCase()}`}
          />
        </View>
      </View>

      {/* LPDDR5X System Memory */}
      <MetricCard
        title="LPDDR5X System Memory"
        value={memory.usedRAMMB}
        unit="MB"
        badge={memory.isLowMemory ? "PRESSURE WARNING" : "OPTIMAL"}
        badgeColor={memory.isLowMemory ? Colors.dark.error : Colors.dark.primary}
        subtitle={`Free: ${memory.freeRAMMB} MB of ${memory.totalRAMMB} MB total physical RAM`}
      />
      <HapticButton
        title="Purge App Memory Caches"
        onPress={memory.purgeCaches}
        variant="outline"
        style={styles.actionButton}
      />

      {/* Tensor TPU Neural Accelerator */}
      <Text style={styles.sectionHeader}>On-Device AI Silicon</Text>
      <MetricCard
        title="Tensor TPU Accelerator"
        value={tpu.lastInferenceLatencyMs}
        unit="ms"
        badge={tpu.activeDelegate}
        badgeColor={Colors.dark.tensorGlow}
        subtitle={`Throughput: ~${tpu.throughputTokensPerSec} tokens/sec • Model Footprint: ${tpu.memoryFootprintMB} MB`}
      />
      <HapticButton
        title={tpu.isBenchmarking ? "Running TPU Tensor Benchmark..." : "Benchmark Tensor TPU Silicon"}
        onPress={handleRunTpuBenchmark}
        disabled={tpu.isBenchmarking}
        variant="secondary"
        style={styles.actionButton}
      />

      {/* Pixel Pro Exclusives: Infrared Thermometer & UWB Radar */}
      <Text style={styles.sectionHeader}>Pixel Pro Exclusive Silicon</Text>
      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <MetricCard
            title="IR Thermometer"
            value={temp.reading.celsius}
            unit="°C"
            badge={temp.reading.materialPreset.toUpperCase()}
            badgeColor={Colors.dark.warning}
            subtitle={`${temp.reading.fahrenheit}°F • Non-contact sensor`}
          />
        </View>
        <View style={styles.gridCol}>
          <MetricCard
            title="UWB Spatial Radar"
            value={uwb.activeTargets[0]?.distanceMeters ?? 0}
            unit="m"
            badge="Ultra-Wideband"
            badgeColor={Colors.dark.accent}
            subtitle={`Angle: ${uwb.activeTargets[0]?.azimuthDegrees ?? 0}° • Centimeter ToF`}
          />
        </View>
      </View>

      <View style={styles.proButtonsRow}>
        <HapticButton
          title={temp.isMeasuring ? "Measuring Temp..." : "Measure Object Temp"}
          onPress={() => temp.measureTemperature()}
          disabled={temp.isMeasuring}
          variant="secondary"
          style={{ flex: 1, marginRight: 6 }}
        />
        <HapticButton
          title={uwb.isRanging ? "Ranging Radar..." : "Range UWB Targets"}
          onPress={uwb.startRanging}
          disabled={uwb.isRanging}
          variant="secondary"
          style={{ flex: 1, marginLeft: 6 }}
        />
      </View>

      {/* Hardware Flashlight & Torch */}
      <Text style={styles.sectionHeader}>Hardware LED Torch & Signals</Text>
      <View style={styles.torchRow}>
        <HapticButton
          title={torch.isTorchOn ? "Extinguish Torch" : "Toggle Rear LED Torch"}
          onPress={torch.toggleTorch}
          variant={torch.isTorchOn ? "danger" : "primary"}
          style={{ flex: 1, marginRight: 6 }}
        />
        <HapticButton
          title={torch.isStrobing ? "Stop Strobe" : "SOS Strobe"}
          onPress={torch.isStrobing ? torch.stopStrobe : () => torch.startStrobe(120)}
          variant="outline"
          style={{ flex: 1, marginLeft: 6 }}
        />
      </View>

      {/* Hardware & Atmospheric Telemetry */}
      <Text style={styles.sectionHeader}>Atmosphere & Power</Text>
      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <MetricCard
            title="Battery & Power"
            value={device.batteryLevel}
            unit="%"
            badge={device.isCharging ? "Charging" : "Discharging"}
            badgeColor={device.isCharging ? Colors.dark.success : Colors.dark.warning}
            subtitle={device.lowPowerMode ? "Battery Saver ON" : "Normal Power Profile"}
          />
        </View>
        <View style={styles.gridCol}>
          <MetricCard
            title="Barometer (Altimeter)"
            value={sensors.barometer.relativeAltitude ?? 0}
            unit="m"
            badge={`${sensors.barometer.pressure} hPa`}
            badgeColor={Colors.dark.tertiary}
            subtitle="Atmospheric Air Pressure"
          />
        </View>
      </View>

      {/* Titan M2 & Security */}
      <Text style={styles.sectionHeader}>Titan M2 Security Enclave</Text>
      <MetricCard
        title="Biometric Hardware"
        value={biometrics.hasHardware ? "Secure Ready" : "Simulator Mode"}
        badge={biometrics.supportedTypes.join(' + ') || 'Biometrics'}
        badgeColor={Colors.dark.accent}
        subtitle={authStatus || "Hardware-backed cryptographic storage active"}
      />
      <HapticButton
        title="Test Titan M2 Biometric Prompt"
        onPress={handleTestBiometrics}
        variant="outline"
        style={styles.actionButton}
      />

      {/* Display Wake Lock */}
      <View style={styles.displayControlRow}>
        <Text style={styles.controlText}>
          Display Keep-Awake: <Text style={{ color: display.isKeepAwake ? Colors.dark.success : Colors.dark.textMuted }}>
            {display.isKeepAwake ? 'ENABLED' : 'DISABLED'}
          </Text>
        </Text>
        <HapticButton
          title={display.isKeepAwake ? "Allow Sleep" : "Lock Screen Awake"}
          onPress={display.toggleKeepAwake}
          variant="secondary"
          style={{ paddingVertical: 8, paddingHorizontal: 16 }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    marginBottom: 20,
  },
  brandTitle: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  osSubtitle: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.success,
    marginRight: 6,
  },
  onlineText: {
    color: Colors.dark.text,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeader: {
    color: Colors.dark.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 10,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  gridCol: {
    flex: 1,
    paddingHorizontal: 6,
  },
  actionButton: {
    marginBottom: 16,
  },
  proButtonsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  torchRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  displayControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    marginTop: 8,
  },
  controlText: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '600',
  },
});

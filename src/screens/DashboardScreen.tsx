/**
 * @file DashboardScreen.tsx
 * @description Central silicon and hardware diagnostics HUD.
 * Renders real-time compute telemetry: 120Hz LTPO frame pacing, ADPF thermal headroom,
 * Google Tensor TPU latency benchmark, battery discharge telemetry, and Titan M2 biometric prompts.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useDevice } from '../hardware/useDevice';
import { useADPF } from '../hardware/useADPF';
import { useTPU } from '../ai/useTPU';
import { useSensors } from '../hardware/useSensors';
import { useBiometrics } from '../hardware/useBiometrics';
import { useDisplay } from '../hardware/useDisplay';
import { MetricCard } from '../components/MetricCard';
import { HapticButton } from '../components/HapticButton';
import { Colors } from '../theme/colors';

export const DashboardScreen: React.FC = () => {
  const device = useDevice();
  const adpf = useADPF();
  const tpu = useTPU();
  const sensors = useSensors(200);
  const biometrics = useBiometrics();
  const display = useDisplay();

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
      <Text style={styles.sectionHeader}>Tensor Silicon & Compute</Text>
      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <MetricCard
            title="Display Pacing"
            value={adpf.currentFps}
            unit="FPS"
            badge="120Hz LTPO"
            badgeColor={Colors.dark.success}
            subtitle={`Thermal: ${adpf.thermalStatus.toUpperCase()}`}
          />
        </View>
        <View style={styles.gridCol}>
          <MetricCard
            title="CPU Headroom"
            value={Math.round(adpf.cpuHeadroom * 100)}
            unit="%"
            badge="ADPF Active"
            badgeColor={Colors.dark.primary}
            subtitle={`GPU: ${Math.round(adpf.gpuHeadroom * 100)}% free`}
          />
        </View>
      </View>

      {/* TPU Neural Accelerator */}
      <MetricCard
        title="Tensor TPU Accelerator"
        value={tpu.lastInferenceLatencyMs}
        unit="ms"
        badge={tpu.activeDelegate}
        badgeColor={Colors.dark.tensorGlow}
        subtitle={`Throughput: ~${tpu.throughputTokensPerSec} tokens/sec • Footprint: ${tpu.memoryFootprintMB} MB`}
      />
      <HapticButton
        title={tpu.isBenchmarking ? "Running TPU Benchmark..." : "Benchmark Tensor TPU"}
        onPress={handleRunTpuBenchmark}
        disabled={tpu.isBenchmarking}
        variant="secondary"
        style={styles.actionButton}
      />

      {/* Hardware & Environmental Telemetry */}
      <Text style={styles.sectionHeader}>Hardware & Atmosphere</Text>
      <View style={styles.grid}>
        <View style={styles.gridCol}>
          <MetricCard
            title="Battery & Power"
            value={device.batteryLevel}
            unit="%"
            badge={device.isCharging ? "Charging" : "Discharging"}
            badgeColor={device.isCharging ? Colors.dark.success : Colors.dark.warning}
            subtitle={device.lowPowerMode ? "Battery Saver ON" : "Normal Power Mode"}
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
    marginTop: 14,
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

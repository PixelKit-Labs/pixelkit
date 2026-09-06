/**
 * @file SensorsLabScreen.tsx
 * @description Interactive testing laboratory for physical Pixel hardware.
 * Provides 3 sub-panels:
 * 1. Motion: Real-time 3-axis Accelerometer, Gyroscope, Magnetometer, Barometer altimeter, Light.
 * 2. Haptics: Tactile test pad for LRA mechanical ticks and notification waveforms, plus NFC tag scanner.
 * 3. Audio & Display: Microphone decibel meter and 120Hz LTPO screen wake-lock controls.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSensors } from '../hardware/useSensors';
import { useHaptics } from '../hardware/useHaptics';
import { useAudio } from '../hardware/useAudio';
import { useDisplay } from '../hardware/useDisplay';
import { useNFC } from '../hardware/useNFC';
import { SensorVisualizer } from '../components/SensorVisualizer';
import { MetricCard } from '../components/MetricCard';
import { HapticButton } from '../components/HapticButton';
import { Colors } from '../theme/colors';

export const SensorsLabScreen: React.FC = () => {
  const sensors = useSensors(100);
  const haptics = useHaptics();
  const audio = useAudio();
  const display = useDisplay();
  const nfc = useNFC();

  const [activeTab, setActiveTab] = useState<'motion' | 'haptics' | 'audio'>('motion');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Hardware & Sensor Lab</Text>
        <Text style={styles.subtitle}>Direct interface to physical Pixel 11 Pro silicon & sensors</Text>
      </View>

      {/* Sub-tab navigation */}
      <View style={styles.tabRow}>
        {(['motion', 'haptics', 'audio'] as const).map((tab) => (
          <HapticButton
            key={tab}
            title={tab.toUpperCase()}
            onPress={() => setActiveTab(tab)}
            variant={activeTab === tab ? 'primary' : 'secondary'}
            style={styles.tabButton}
          />
        ))}
      </View>

      {/* MOTION TAB */}
      {activeTab === 'motion' && (
        <View>
          <SensorVisualizer
            label="6-Axis Accelerometer"
            vector={sensors.accelerometer}
            unit="g"
          />

          <SensorVisualizer
            label="6-Axis Gyroscope"
            vector={sensors.gyroscope}
            unit="rad/s"
          />

          <SensorVisualizer
            label="Magnetometer / Compass"
            vector={sensors.magnetometer}
            unit="μT"
          />

          <View style={styles.grid}>
            <View style={styles.gridCol}>
              <MetricCard
                title="Barometer"
                value={sensors.barometer.pressure}
                unit="hPa"
                subtitle={`Alt: ${sensors.barometer.relativeAltitude ?? 0}m`}
                badge="Active"
                badgeColor={Colors.dark.primary}
              />
            </View>
            <View style={styles.gridCol}>
              <MetricCard
                title="Ambient Light"
                value={sensors.lightLux ?? 450}
                unit="lux"
                subtitle="Photodiode sensor"
                badge="Photometry"
                badgeColor={Colors.dark.warning}
              />
            </View>
          </View>
        </View>
      )}

      {/* HAPTICS TAB */}
      {activeTab === 'haptics' && (
        <View>
          <Text style={styles.sectionHeader}>Linear Resonant Actuator Waveforms</Text>
          <Text style={styles.sectionDesc}>
            Tap each button below to trigger distinct mechanical tactile vibrations on your Pixel:
          </Text>

          <View style={styles.hapticGrid}>
            <HapticButton
              title="Selection Tick"
              onPress={haptics.selection}
              hapticType="selection"
              variant="secondary"
              style={styles.hapticBtn}
            />
            <HapticButton
              title="Light Impact"
              onPress={haptics.light}
              hapticType="light"
              variant="secondary"
              style={styles.hapticBtn}
            />
            <HapticButton
              title="Medium Impact"
              onPress={haptics.medium}
              hapticType="medium"
              variant="secondary"
              style={styles.hapticBtn}
            />
            <HapticButton
              title="Heavy Thud"
              onPress={haptics.heavy}
              hapticType="heavy"
              variant="secondary"
              style={styles.hapticBtn}
            />
            <HapticButton
              title="Success Waveform"
              onPress={haptics.success}
              hapticType="success"
              variant="primary"
              style={styles.hapticBtn}
            />
            <HapticButton
              title="Warning Buzz"
              onPress={haptics.warning}
              hapticType="warning"
              variant="outline"
              style={styles.hapticBtn}
            />
            <HapticButton
              title="Error Pulse"
              onPress={haptics.error}
              hapticType="error"
              variant="danger"
              style={styles.hapticBtn}
            />
          </View>

          {/* NFC Card */}
          <Text style={styles.sectionHeader}>NFC Controller</Text>
          <MetricCard
            title="NFC Radio"
            value={nfc.isScanning ? "Scanning..." : (nfc.lastScannedTag ? "Tag Detected" : "Standby")}
            badge="NDEF / RFID"
            subtitle={nfc.lastScannedTag ? `ID: ${nfc.lastScannedTag.id} • ${nfc.lastScannedTag.payload}` : "Tap phone against smart tag"}
          />
          <HapticButton
            title={nfc.isScanning ? "Scanning for Tags..." : "Scan Nearby NFC Tag"}
            onPress={nfc.startScan}
            disabled={nfc.isScanning}
            variant="secondary"
          />
        </View>
      )}

      {/* AUDIO & DISPLAY TAB */}
      {activeTab === 'audio' && (
        <View>
          <Text style={styles.sectionHeader}>Microphone Decibel Meter</Text>
          <MetricCard
            title="Acoustic Level"
            value={audio.meteringDecibels}
            unit="dB"
            badge={audio.isRecording ? "Listening" : "Idle"}
            badgeColor={audio.isRecording ? Colors.dark.error : Colors.dark.textMuted}
            subtitle={audio.isRecording ? "High-definition microphone stream active" : "Press start to measure decibels"}
          />

          <HapticButton
            title={audio.isRecording ? "Stop Metering" : "Start Audio Level Meter"}
            onPress={audio.isRecording ? audio.stopRecording : audio.startRecording}
            variant={audio.isRecording ? "danger" : "primary"}
            style={{ marginBottom: 16 }}
          />

          <Text style={styles.sectionHeader}>Display & Refresh Rate</Text>
          <MetricCard
            title="LTPO Dynamic OLED"
            value={display.refreshRateHz}
            unit="Hz"
            badge="Ultra-smooth"
            badgeColor={Colors.dark.success}
            subtitle={`Brightness: ${Math.round(display.brightness * 100)}% • Screen Wake: ${display.isKeepAwake ? 'LOCKED' : 'AUTO'}`}
          />
          <HapticButton
            title={display.isKeepAwake ? "Disable Wake Lock" : "Enable 100% Screen Wake Lock"}
            onPress={display.toggleKeepAwake}
            variant="secondary"
          />
        </View>
      )}
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
  header: {
    marginBottom: 16,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 8,
  },
  grid: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  gridCol: {
    flex: 1,
    paddingHorizontal: 6,
  },
  sectionHeader: {
    color: Colors.dark.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 14,
    marginBottom: 6,
    marginLeft: 4,
  },
  sectionDesc: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 4,
    lineHeight: 18,
  },
  hapticGrid: {
    marginBottom: 16,
  },
  hapticBtn: {
    marginBottom: 8,
  },
});

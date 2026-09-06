/**
 * @file SensorsLabScreen.tsx
 * @description Interactive testing laboratory for physical Pixel hardware. Every card carries a
 * provenance tag (HW / DERIVED / SIMULATED / N/A) so it is always clear which numbers are real.
 * 1. Motion: real IMU (TDK ICM45631), magnetometer (MEMSIC MMC5616), barometer (SPA18001), light (TMD3743).
 * 2. Haptics: expo-haptics patterns plus Android 16 envelope effects and primitive compositions.
 * 3. Radios: NFC and BLE are still simulated until native modules land; they are labelled as such.
 * 4. Audio & Display: real dBFS metering (expo-audio) and real display mode / ARR / HDR data.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSensors } from '../hardware/useSensors';
import { useHaptics, HapticEnvelopes } from '../hardware/useHaptics';
import { useAudio } from '../hardware/useAudio';
import { useDisplay } from '../hardware/useDisplay';
import { useNFC } from '../hardware/useNFC';
import { useBLE } from '../hardware/useBLE';
import { useCapabilities } from '../hardware/useCapabilities';
import { SensorVisualizer } from '../components/SensorVisualizer';
import { MetricCard } from '../components/MetricCard';
import { HapticButton } from '../components/HapticButton';
import { Colors, Type } from '../theme/colors';
import { SectionHeader } from '../components/Decor';

const HDR_NAMES: Record<number, string> = { 1: 'Dolby Vision', 2: 'HDR10', 3: 'HLG', 4: 'HDR10+' };

export const SensorsLabScreen: React.FC = () => {
  const sensors = useSensors(100);
  const haptics = useHaptics();
  const audio = useAudio();
  const display = useDisplay();
  const nfc = useNFC();
  const ble = useBLE();
  const caps = useCapabilities();

  const [activeTab, setActiveTab] = useState<'motion' | 'haptics' | 'radios' | 'audio'>('motion');
  const [lastEnvelope, setLastEnvelope] = useState<string | null>(null);

  const playEnvelope = (name: keyof typeof HapticEnvelopes) => {
    const ok = haptics.playEnvelope(HapticEnvelopes[name]);
    setLastEnvelope(ok ? `${name} played` : `${name}: envelope effects unsupported`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Hardware & Sensor Lab</Text>
        <Text style={styles.subtitle}>Direct interface to {caps.modelName} sensors and actuators</Text>
      </View>

      <View style={styles.tabRow}>
        {(['motion', 'haptics', 'radios', 'audio'] as const).map((tab) => (
          <HapticButton
            key={tab}
            title={tab.toUpperCase()}
            onPress={() => setActiveTab(tab)}
            hapticType="selection"
            variant={activeTab === tab ? 'primary' : 'secondary'}
            style={styles.tabButton}
            textStyle={{ fontSize: 12 }}
          />
        ))}
      </View>

      {activeTab === 'motion' && (
        <View>
          <SensorVisualizer label="Accelerometer" caption="TDK ICM45631 · 6-axis IMU" vector={sensors.accelerometer} unit="g" range={2} />
          <SensorVisualizer label="Gyroscope" caption="TDK ICM45631" vector={sensors.gyroscope} unit="rad/s" range={5} />
          <SensorVisualizer label="Magnetometer" caption="MEMSIC MMC5616" vector={sensors.magnetometer} unit="μT" range={100} decimals={1} />

          <View style={styles.grid}>
            <View style={styles.gridCol}>
              <MetricCard
                title="Barometer"
                value={sensors.barometer.pressure}
                unit="hPa"
                subtitle={`Pressure altitude ${sensors.barometer.relativeAltitude ?? 0} m (ISA)`}
                badge="SPA18001"
                badgeColor={Colors.dark.primary}
                source="hardware"
              />
            </View>
            <View style={styles.gridCol}>
              <MetricCard
                title="Ambient Light"
                value={sensors.lightLux ?? null}
                unit="lux"
                subtitle={sensors.lightLux == null ? 'Waiting for first sample' : sensors.lightLux < 5 ? 'Dark room' : sensors.lightLux < 200 ? 'Indoor' : 'Bright'}
                badge="TMD3743"
                badgeColor={Colors.dark.warning}
                source={sensors.lightLux == null ? 'unavailable' : 'hardware'}
              />
            </View>
          </View>
        </View>
      )}

      {activeTab === 'haptics' && (
        <View>
          <MetricCard
            title="Vibrator"
            value={haptics.resonantFrequencyHz != null ? haptics.resonantFrequencyHz.toFixed(1) : null}
            unit="Hz resonant"
            badge={haptics.envelopeSupported ? 'ENVELOPES (PWLE v2)' : 'PRIMITIVES ONLY'}
            badgeColor={haptics.envelopeSupported ? Colors.dark.success : Colors.dark.warning}
            subtitle={`Amplitude control: ${haptics.hasAmplitudeControl ?? '?'} • Primitives: ${haptics.supportedPrimitives.join(', ') || '—'}`}
            source={haptics.resonantFrequencyHz == null ? 'unavailable' : 'hardware'}
          />

          <SectionHeader title="Standard patterns (expo-haptics)" />
          <View style={styles.hapticGrid}>
            <HapticButton title="Selection Tick" onPress={haptics.selection} hapticType="selection" variant="secondary" style={styles.hapticBtn} />
            <HapticButton title="Light Impact" onPress={haptics.light} hapticType="light" variant="secondary" style={styles.hapticBtn} />
            <HapticButton title="Medium Impact" onPress={haptics.medium} hapticType="medium" variant="secondary" style={styles.hapticBtn} />
            <HapticButton title="Heavy Thud" onPress={haptics.heavy} hapticType="heavy" variant="secondary" style={styles.hapticBtn} />
            <HapticButton title="Success Waveform" onPress={haptics.success} hapticType="success" variant="primary" style={styles.hapticBtn} />
            <HapticButton title="Warning Buzz" onPress={haptics.warning} hapticType="warning" variant="outline" style={styles.hapticBtn} />
            <HapticButton title="Error Pulse" onPress={haptics.error} hapticType="error" variant="danger" style={styles.hapticBtn} />
          </View>

          <SectionHeader title="Android 16 envelope effects" />
          <Text style={styles.sectionDesc}>
            Intensity and sharpness curves rendered by the LRA driver. {haptics.envelopeSupported ? 'Supported on this device.' : 'Not supported on this device.'}
          </Text>
          <View style={styles.hapticGrid}>
            <HapticButton title="Gemini thinking ramp" onPress={() => playEnvelope('thinkingRamp')} hapticType="selection" variant="secondary" style={styles.hapticBtn} disabled={!haptics.envelopeSupported} />
            <HapticButton title="Double pulse" onPress={() => playEnvelope('doublePulse')} hapticType="selection" variant="secondary" style={styles.hapticBtn} disabled={!haptics.envelopeSupported} />
            <HapticButton title="Bouncing spring" onPress={() => playEnvelope('spring')} hapticType="selection" variant="secondary" style={styles.hapticBtn} disabled={!haptics.envelopeSupported} />
            <HapticButton
              title="Primitive composition: rise → thud"
              onPress={() => haptics.playPrimitives([{ primitive: 'QUICK_RISE', scale: 0.8 }, { primitive: 'THUD', scale: 1, delayMs: 40 }])}
              hapticType="selection"
              variant="outline"
              style={styles.hapticBtn}
            />
          </View>
          {lastEnvelope && <Text style={styles.hint}>{lastEnvelope}</Text>}
        </View>
      )}

      {activeTab === 'radios' && (
        <View>
          <MetricCard
            title="Radio inventory"
            value={caps.verification === 'device' ? 'Verified' : 'Model table'}
            badge={caps.verification === 'device' ? 'PACKAGEMANAGER' : 'INFERRED'}
            badgeColor={caps.verification === 'device' ? Colors.dark.success : Colors.dark.warning}
            subtitle={`NFC ${flag(caps.hasNFC)} • UWB ${flag(caps.hasUWB)} • BLE channel sounding ${flag(caps.hasBleChannelSounding)} • Wi-Fi RTT ${flag(caps.hasWifiRtt)} • Satellite ${flag(caps.hasSatelliteTelephony)}`}
            source={caps.verification === 'device' ? 'hardware' : 'derived'}
          />

          <SectionHeader title="Near Field Communication" />
          <MetricCard
            title="NFC transceiver"
            value={nfc.isScanning ? 'Scanning…' : (nfc.lastScannedTag ? 'Tag detected' : 'Standby')}
            badge="SIMULATED"
            badgeColor={Colors.dark.warning}
            subtitle={nfc.lastScannedTag ? `ID ${nfc.lastScannedTag.id} • ${nfc.lastScannedTag.payload}` : 'Reader/writer not wired to hardware yet (react-native-nfc-manager planned)'}
            source="simulated"
          />
          <HapticButton title={nfc.isScanning ? 'Scanning (simulated)…' : 'Run simulated NFC scan'} onPress={nfc.startScan} disabled={nfc.isScanning} variant="secondary" style={{ marginBottom: 20 }} />

          <SectionHeader title="Bluetooth Low Energy" />
          <HapticButton title={ble.isScanning ? 'Scanning (simulated)…' : 'Run simulated BLE scan'} onPress={ble.startScan} disabled={ble.isScanning} variant="secondary" style={{ marginBottom: 12 }} />
          {ble.peripherals.map((device) => (
            <MetricCard
              key={device.id}
              title={device.name}
              value={`${device.rssi} dBm`}
              badge={`~${device.estimatedDistanceMeters} m`}
              badgeColor={Colors.dark.warning}
              subtitle={`${device.id} • simulated peripheral`}
              source="simulated"
            />
          ))}
        </View>
      )}

      {activeTab === 'audio' && (
        <View>
          <SectionHeader title="Microphone level (expo-audio, voice_recognition source)" />
          <MetricCard
            title="Acoustic level"
            value={audio.isRecording ? audio.meteringDecibels : null}
            unit="dBFS"
            badge={audio.isRecording ? 'LISTENING' : (audio.permissionGranted ? 'IDLE' : 'NO PERMISSION')}
            badgeColor={audio.isRecording ? Colors.dark.error : Colors.dark.textMuted}
            subtitle={audio.isRecording ? '16 kHz mono AAC, 100 ms metering' : 'Start metering to read the microphone'}
            source={audio.isRecording ? 'hardware' : 'unavailable'}
          />
          <HapticButton
            title={audio.isRecording ? 'Stop metering' : 'Start audio level meter'}
            onPress={audio.isRecording ? audio.stopRecording : audio.startRecording}
            variant={audio.isRecording ? 'danger' : 'primary'}
            style={{ marginBottom: 16 }}
          />

          <SectionHeader title="Display" />
          <MetricCard
            title="Active refresh rate"
            value={display.refreshRateHz || null}
            unit="Hz"
            badge={display.hasArrSupport ? 'ARR' : display.hasArrSupport === false ? 'FIXED MODES' : 'UNKNOWN'}
            badgeColor={Colors.dark.success}
            subtitle={`Modes: ${display.supportedRefreshRates.map(r => Math.round(r)).join(' / ') || '—'} Hz`}
            source={display.source}
          />
          <MetricCard
            title="Panel"
            value={display.resolution ? `${display.resolution.width}×${display.resolution.height}` : null}
            badge={display.hdrTypes.length ? display.hdrTypes.map(t => HDR_NAMES[t] ?? t).join(' · ') : 'SDR'}
            badgeColor={Colors.dark.primary}
            subtitle={`${display.resolution?.densityDpi ?? '—'} dpi • HDR max luminance ${display.maxLuminance ?? '—'} nits • Brightness ${Math.round(display.brightness * 100)}%`}
            source={display.source}
          />
          <View style={styles.row}>
            <HapticButton title="Prefer 120 Hz" onPress={() => display.setPreferredRefreshRate(120)} variant="secondary" style={{ flex: 1, marginRight: 6 }} />
            <HapticButton title="Prefer 60 Hz" onPress={() => display.setPreferredRefreshRate(60)} variant="secondary" style={{ flex: 1, marginLeft: 6 }} />
          </View>
          <HapticButton
            title={display.isKeepAwake ? 'Disable wake lock' : 'Enable screen wake lock'}
            onPress={display.toggleKeepAwake}
            variant="outline"
            style={{ marginTop: 12 }}
          />
        </View>
      )}
    </ScrollView>
  );
};

function flag(v: boolean | null): string {
  return v == null ? '?' : v ? '✓' : '✗';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { padding: 16, paddingBottom: 120 },
  header: { marginBottom: 16 },
  title: { ...Type.title, color: Colors.dark.text },
  subtitle: { color: Colors.dark.textMuted, fontSize: 13, marginTop: 2 },
  tabRow: { flexDirection: 'row', marginBottom: 16 },
  tabButton: { flex: 1, marginHorizontal: 2, paddingVertical: 8, paddingHorizontal: 4 },
  grid: { flexDirection: 'row', marginHorizontal: -6 },
  gridCol: { flex: 1, paddingHorizontal: 6 },
  row: { flexDirection: 'row' },
  sectionDesc: { color: Colors.dark.textMuted, fontSize: 13, marginBottom: 12, marginLeft: 4, lineHeight: 18 },
  hapticGrid: { marginBottom: 8 },
  hapticBtn: { marginBottom: 8 },
  hint: { color: Colors.dark.textMuted, fontSize: 12, marginLeft: 4, marginBottom: 8 },
});

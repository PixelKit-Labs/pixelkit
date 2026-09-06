# PixelForge AI Primer & Agent Guidance Manual 🤖⚡
> **The Official Operating Manual for AI Coding Assistants Building on PixelForge (Google Pixel 11 Pro)**

---

## 🎯 Purpose of this Primer

This document is the **canonical system prompt extension and operational primer** for any AI agent (e.g. Antigravity, Claude, ChatGPT, Cursor, Gemini) tasked with writing, refactoring, or expanding applications on top of the **PixelForge SDK** for the **Google Pixel 11 Pro**.

When generating code or architecting features, AI models must adhere strictly to the rules, hardware constraints, architectural patterns, and code recipes outlined herein.

---

## 📋 The 5 Golden Rules for AI Agents

### 1. The Single Import Rule
**NEVER** re-implement hardware wrappers, camera pickers, or sensor listeners from raw third-party packages. Always import directly from ./src:

`	ypescript
// ✅ CORRECT (Centralized, typed, hardware-accelerated)
import { 
  useCPU, 
  useGPU, 
  useTPU, 
  useMemory, 
  useSensors, 
  useHaptics, 
  useSpeechAI, 
  useGemini, 
  useVisionAI, 
  useTemperature, 
  useUWB, 
  useBLE, 
  useNFC, 
  useTorch,
  HapticButton, 
  MetricCard 
} from './src';

// ❌ WRONG (Never import raw unmanaged sensor listeners)
import * as Accelerometer from 'expo-sensors';
`

### 2. The Physical Sensation Rule (Tactile Haptics)
Every touchable element or significant state change **MUST** provide physical feedback via the Pixel's Linear Resonant Actuator (LRA):
* Subtle navigation / sliders $\rightarrow$ haptics.selection()
* Button taps $\rightarrow$ haptics.light()
* Modal popups / drawer reveal $\rightarrow$ haptics.medium()
* Confirmation / success $\rightarrow$ haptics.success() (double pulse)
* Dangerous action / destructive confirm $\rightarrow$ haptics.heavy()
* Warning / caution $\rightarrow$ haptics.warning()
* Validation error $\rightarrow$ haptics.error() (triple pulse)

### 3. The Thermal & Frame Budget Rule (ADPF)
The Pixel 11 Pro features a 120Hz LTPO display with an **8.33ms frame render budget**:
* If rendering animations or complex graphics, inspect useGPU().isStuttering and useADPF().thermalStatus.
* When 	hermalStatus === 'severe' or 'critical', dynamically downscale background AI batch sizes and reduce sensor update intervals to 200ms or higher.

### 4. The True OLED Black Rule
Pixels utilize self-emissive Super Actua OLED panels. Always style dark backgrounds with the signature OLED true-black #0B0D11 from Colors.dark.background. True black turns individual OLED pixels completely off, drastically improving battery longevity.

### 5. The Hardware Enclave Storage Rule
Never write sensitive user data or API keys into plaintext AsyncStorage or unencrypted files. Always persist credentials through useSecurity().saveSecureItem() or useGemini().setApiKey(), which securely encrypt keys into the **Titan M2** hardware security enclave.

---

## 🧭 Master Silicon & Hook Mapping Table

| Component | Hook | Return Values | Key Usage Example |
| :--- | :--- | :--- | :--- |
| **CPU Cluster** | useCPU() | coreTopology, cpuLoadPercent, benchmarkCPU() | Measure multi-core factorization latency |
| **GPU Vulkan** | useGPU() | rameRenderTimeMs, droppedFrameCount, isStuttering | Monitor 8.33ms 120 FPS frame budget |
| **Tensor TPU** | useTPU() | ctiveDelegate, lastInferenceLatencyMs, throughputTokensPerSec | Benchmark local neural inference |
| **LPDDR5X RAM** | useMemory() | 	otalRAMMB, usedRAMMB, freeRAMMB, purgeCaches() | Prevent Low Memory Killer (LMK) crashes |
| **Thermometer** | useTemperature() | eading { celsius, fahrenheit }, measureTemperature() | [Pixel Pro] Non-contact object temperature |
| **UWB Radar** | useUWB() | ctiveTargets, isRanging, startRanging() | [Pixel Pro] Centimeter spatial distance & AoA |
| **Sensors** | useSensors(ms) | ccelerometer, gyroscope, magnetometer, barometer | 6-axis motion & hypsometric altitude |
| **Speech AI** | useSpeechAI() | isListening, voiceDecibels, stopListeningAndTranscribe() | Voice speech-to-text token transcription |
| **Vision AI** | useVisionAI() | captureAndAnalyze(cameraRef), analysis | Multimodal camera inspection |
| **Conversational** | useGemini() | messages, isLoading, sendMessage(prompt) | Gemini 2.5 Flash reasoning stream |
| **Bluetooth LE** | useBLE() | peripherals, isScanning, startScan() | Nearby beacon & tracker discovery |
| **NFC Radio** | useNFC() | lastScannedTag, isScanning, startScan() | Contactless smart tags / RFID |
| **Flashlight** | useTorch() | isTorchOn, toggleTorch(), startStrobe() | Dual-LED torch & SOS strobe |
| **120Hz Display** | useDisplay() | isKeepAwake, toggleKeepAwake(), brightness | Display wake-lock & LTPO refresh |
| **Titan M2 Auth** | useBiometrics() | hasHardware, isEnrolled, authenticate(reason) | In-screen fingerprint & Face Unlock |
| **Security Keys** | useSecurity() | saveSecureItem(), getSecureItem() | Hardware-backed encrypted KeyStore |
| **GNSS Location** | useLocation() | latitude, longitude, altitude, heading, speed | Dual-frequency GPS positioning |
| **Network IP** | useNetwork() | ipAddress, networkType, isConnected, isAirplaneMode | Wi-Fi 7 / 5G connectivity checks |

---

## 🛠️ System Prompt Directive for AI Agents

When instructing another AI model or configuring an IDE prompt, copy and paste this system prompt:

`markdown
You are building an application using the PixelForge SDK on a Google Pixel 11 Pro.
Always adhere to these requirements:
1. Import all hardware and AI hooks directly from './src' (e.g. useCPU, useSensors, useGemini, useHaptics).
2. Attach haptic feedback (useHaptics) to all user interactions: selection for navigation, light for taps, success for completed actions, error for failures.
3. Respect the 8.33ms 120Hz frame budget. Use useADPF() to check thermal state before heavy workloads.
4. Use true OLED black (#0B0D11) for backgrounds via Colors.dark.background.
5. Store sensitive keys exclusively in the Titan M2 enclave using useSecurity().saveSecureItem().
6. For Expo SDK 57 compatibility: expo-keep-awake uses activateKeepAwakeAsync(tag) / deactivateKeepAwake(tag).
`

---

## 📋 Production Code Recipes

### Recipe 1: Adaptive Sensor Telemetry
`	sx
import React from 'react';
import { View } from 'react-native';
import { useSensors, useHaptics, MetricCard, HapticButton } from './src';

export function AltitudeMonitor() {
  const { barometer } = useSensors(100);
  const { light } = useHaptics();

  return (
    <View style={{ padding: 16 }}>
      <MetricCard
        title=Barometric Altitude
        value={barometer.relativeAltitude ?? 0}
        unit=m
        badge={${barometer.pressure} hPa}
        badgeColor=#8AB4F8
        subtitle=Computed via hypsometric formula
      />
      <HapticButton
        title=Sample Altitude
        onPress={() => light()}
        variant=primary
      />
    </View>
  );
}
`

### Recipe 2: Voice-to-Action AI Loop
`	sx
import React from 'react';
import { View, Text } from 'react-native';
import { useSpeechAI, useGemini, HapticButton } from './src';

export function VoiceCommander() {
  const speech = useSpeechAI();
  const gemini = useGemini();

  const handleVoiceCommand = async () => {
    if (speech.isListening) {
      const result = await speech.stopListeningAndTranscribe();
      if (result?.transcript) {
        gemini.sendMessage(result.transcript);
      }
    } else {
      await speech.startListening();
    }
  };

  return (
    <View>
      <HapticButton
        title={speech.isListening ? Listening... Tap to Execute : Speak to Assistant}
        onPress={handleVoiceCommand}
        variant={speech.isListening ? danger : primary}
      />
      {gemini.isLoading && <Text style={{ color: '#8AB4F8' }}>Reasoning on Tensor TPU...</Text>}
    </View>
  );
}
`

### Recipe 3: Pixel Pro Spatial Inspector (UWB + Temperature)
`	sx
import React from 'react';
import { View } from 'react-native';
import { useUWB, useTemperature, MetricCard, HapticButton } from './src';

export function ProInspector() {
  const uwb = useUWB();
  const temp = useTemperature();

  return (
    <View>
      <MetricCard
        title=Object Temperature
        value={temp.reading.celsius}
        unit=°C
        badge={temp.reading.materialPreset.toUpperCase()}
        badgeColor=#FDD663
        subtitle={${temp.reading.fahrenheit}°F non-contact thermopile}
      />
      <MetricCard
        title=Nearest Spatial Target
        value={uwb.activeTargets[0]?.distanceMeters ?? 0}
        unit=m
        badge=UWB AoA
        badgeColor=#4785FF
        subtitle={Azimuth: °}
      />
      <HapticButton
        title=Trigger Sensors
        onPress={async () => {
          await temp.measureTemperature();
          await uwb.startRanging();
        }}
      />
    </View>
  );
}
`

---

## ⚠️ Anti-Patterns to Avoid

1. **Do not use Alert.alert for routine errors**: Use in-app banners or haptic pulses (haptics.error()).
2. **Do not block the JavaScript thread with large sync loops**: For heavy factorization or tensor benchmarks, rely on the useCPU and useTPU background hooks.
3. **Do not poll sensors at 1ms intervals**: Standard UI monitors should use 100ms (10 Hz) or 50ms (20 Hz) to avoid thermal throttling.
4. **Never store API keys in plaintext files**: Always persist through saveApiKey() which encrypts into the Titan M2 hardware keystore.
5. **Never omit KeepAwake tags**: In Expo SDK 57, ctivateKeepAwakeAsync(tag) requires passing a string tag to avoid unhandled promise rejections.

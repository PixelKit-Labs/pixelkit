# PixelKit AI Primer & Agent Guidance Manual 🤖⚡
> **The Official Operating Manual for AI Coding Assistants Building on PixelKit (Google Pixel 11 Pro)**

---

## 🎯 Purpose of this Primer

This document is the **canonical system prompt extension and operational primer** for any AI agent (Antigravity, Claude, ChatGPT, Cursor, Gemini) tasked with writing, refactoring, or expanding applications on top of the **PixelKit SDK** for the **Google Pixel 11 Pro** powered by the **Google Tensor G6 ("Malibu")** processor.

When generating code or architecting features, AI models must adhere strictly to the rules, hardware constraints, architectural patterns, and code recipes outlined herein.

---

## 📋 The 5 Golden Rules for AI Agents

### 1. The Single Import Rule
**NEVER** re-implement hardware wrappers, camera pickers, or sensor listeners from raw third-party packages. Always import directly from `./src`:

```typescript
// ✅ CORRECT (Centralized, typed, hardware-accelerated)
import { 
  useCPU, 
  useGPU, 
  useTPU, 
  useMemory, 
  useSensors, 
  useHaptics, 
  useCamera,
  useHiLight,
  useSpeechAI, 
  useGemini, 
  useVisionAI, 
  useUWB, 
  useSecurity,
  HapticButton, 
  MetricCard 
} from './src';

// ❌ WRONG (Never import raw unmanaged sensor listeners)
import * as Accelerometer from 'expo-sensors';
```

### 2. The Physical Sensation Rule (Tactile Haptics)
Every touchable element or significant state change **MUST** provide physical feedback via the Pixel's Linear Resonant Actuator (LRA):
* Subtle navigation / sliders $\rightarrow$ `haptics.selection()`
* Button taps $\rightarrow$ `haptics.light()`
* Modal popups / drawer reveal $\rightarrow$ `haptics.medium()`
* Confirmation / success $\rightarrow$ `haptics.success()` (double pulse)
* Dangerous action / destructive confirm $\rightarrow$ `haptics.heavy()`
* Warning / caution $\rightarrow$ `haptics.warning()`
* Validation error $\rightarrow$ `haptics.error()` (triple pulse)

### 3. The Thermal & Frame Budget Rule (ADPF)
The Pixel 11 Pro features a 3,600 nits 120Hz LTPO display with an **8.33ms frame render budget**:
* If rendering animations or complex graphics, inspect `useGPU().isStuttering` and `useADPF().thermalStatus`.
* When `thermalStatus === 'severe'` or `'critical'`, dynamically downscale background AI batch sizes and reduce sensor update intervals to 200ms or higher.

### 4. The True OLED Black Rule
Pixels utilize self-emissive Super Actua OLED panels. Always style dark backgrounds with the signature OLED true-black `#0E1119` from `Colors.dark.background`. True black turns individual OLED pixels completely off, saving battery.

### 5. The Secure Storage Rule
Never write sensitive user data or API keys into plaintext AsyncStorage or unencrypted files. Always persist credentials through `useSecurity().saveSecureItem()` or `useGemini().setApiKey()`, which securely encrypt keys into the **Titan M3** hardware security coprocessor with **Post-Quantum Cryptography (PQC)**.

### 6. The Visual Context Rule (React Grab & Android Layout)
When iterating on UI components:
* In Web Browser mode (`npm run web`), use **React Grab**: hold `Ctrl+C` (Windows) / `Cmd+C` (macOS) and click any component to copy its exact source location and component hierarchy for AI agents.
* On Android hardware/emulators, use `android layout` (JSON UI tree) and `android screen` (visual coordinates) from the Google Android CLI.

---

### 7. The Telemetry Provenance Rule (No Mocks)
Every hook exposes `source: 'hardware' | 'derived' | 'simulated' | 'unavailable'` (see `src/core/observability.ts`). Never substitute a plausible default for a value that could not be read: render `null` as "—" and pass `source` to `MetricCard` so the tag is visible. Only NFC, BLE, UWB and HiLight remain `simulated`, and any UI that shows them must say so. Log lifecycle and errors with `logEvent(module, event, data)`; they surface in the Observability panel and in `adb logcat -s ReactNativeJS | grep PixelKit`.

---

## 🧭 Master Silicon & Hook Mapping Table

| Component | Hook | Return Values | Key Usage Example |
| :--- | :--- | :--- | :--- |
| **Tensor G6 CPU** | `useCPU()` | `coreTopology, coreCount (7), cpuLoadPercent, nodeProcess ("TSMC 2nm")` | Monitor 7-core thermal & compute loads |
| **PowerVR GPU** | `useGPU()` | `frameRenderTimeMs, droppedFrameCount, isStuttering` | Monitor 8.33ms 120 FPS frame budget |
| **Tensor TPU** | `useTPU()` | `activeDelegate, lastInferenceLatencyMs, throughputTokensPerSec` | Benchmark local neural inference |
| **LPDDR5X RAM** | `useMemory()` | `totalRAMMB, usedRAMMB, freeRAMMB, purgeCaches()` | Prevent Low Memory Killer (LMK) crashes |
| **HiLight LED Ring**| `useHiLight()` | `availability, connect(), triggerGeminiPulse(), triggerContactAlert()` | [Pixel 11 Pro] Rear LED array; `availability` is `shizuku` (real LEDs) or `simulated` |
| **UWB Radar** | `useUWB()` | `activeTargets, isRanging, startRanging()` | [Pixel Pro] Distance & AoA (ranging simulated until RangingManager) |
| **Camera & Looks** | `useCamera()` | `zoomFactor, maxZoomFactor, selectedLook, setLook()` | expo-camera zoom; Camera Looks are UI state only |
| **Sensors** | `useSensors(ms)` | `accelerometer, gyroscope, magnetometer, barometer` | 6-axis motion & hypsometric altitude |
| **Speech AI** | `useSpeechAI()` | `isListening, voiceDecibels, stopListeningAndTranscribe()` | Voice speech-to-text token transcription |
| **Vision AI** | `useVisionAI()` | `captureAndAnalyze(cameraRef), analysis` | Multimodal camera inspection |
| **Conversational** | `useGemini()` | `messages, isLoading, sendMessage(prompt)` | gemini-3.8-flash chat via ai.chats |
| **On-device Nano** | `useGeminiNano()` | `status, info, messages, partial, sendMessage(prompt), download()` | Gemini Nano through AICore; latency and tok/s measured on device |
| **Bluetooth LE** | `useBLE()` | `peripherals, isScanning, startScan()` | Nearby beacon & tracker discovery |
| **NFC Radio** | `useNFC()` | `lastScannedTag, isScanning, startScan()` | Contactless smart tags / RFID |
| **Flashlight** | `useTorch()` | `isTorchOn, toggleTorch(), startStrobe()` | Dual-LED torch & SOS strobe |
| **120Hz Display** | `useDisplay()` | `isKeepAwake, toggleKeepAwake(), brightness` | Display wake-lock & LTPO refresh |
| **Titan M3 Auth** | `useBiometrics()` | `hasHardware, isEnrolled, authenticate(reason)` | Ultrasonic fingerprint & Face Unlock |
| **Security Keys** | `useSecurity()` | `saveSecureItem(), getSecureItem(), isHardwareBacked` | SecureStore on the Android Keystore (StrongBox) |
| **GNSS Location** | `useLocation()` | `latitude, longitude, altitude, heading, speed` | Dual-band L1/L5 GPS positioning |
| **MediaTek M90** | `useNetwork()` | `ipAddress, networkType, isConnected, isAirplaneMode` | Wi-Fi 7 / 5G & Satellite modem |

---

## 🛠️ System Prompt Directive for AI Agents

When instructing another AI model or configuring an IDE prompt, copy and paste this system prompt:

```markdown
You are building an application using the PixelKit SDK on a Google Pixel 11 Pro (Tensor G6 2nm).
Always adhere to these requirements:
1. Import all hardware and AI hooks directly from './src' (e.g. useCPU, useHiLight, useSensors, useGemini, useHaptics, useCamera).
2. Attach tactile haptic feedback (useHaptics) to all user interactions: selection for navigation, light for taps, success for completed actions, error for failures.
3. When running Gemini AI, trigger the rear HiLight ring via useHiLight().triggerGeminiPulse() for face-down visual signaling.
4. Treat Camera Looks and Super Res Zoom as Pixel Camera app features; useCamera() exposes expo-camera zoom and a Look label only.
5. Respect the 8.33ms 120Hz frame budget. Use useADPF() to check thermal state before heavy workloads.
6. Use true OLED black (#0E1119) for backgrounds via Colors.dark.background.
7. Store sensitive keys exclusively through useSecurity().saveSecureItem() (SecureStore, Android Keystore).
8. For Expo SDK 57 compatibility: expo-keep-awake uses activateKeepAwakeAsync(tag) / deactivateKeepAwake(tag).
```

---

## 📋 Production Code Recipes

### Recipe 1: AI Reasoning with HiLight Visual Feedback
```tsx
import React from 'react';
import { View } from 'react-native';
import { useGemini, useHiLight, useHaptics, HapticButton } from './src';

export function SmartAssistant() {
  const gemini = useGemini();
  const hilight = useHiLight();
  const { light, success } = useHaptics();

  const handleAskAI = async () => {
    await light();
    // Pulse rear camera bar LED ring in signature cyan while AI thinks
    hilight.triggerGeminiPulse(5000);
    await gemini.sendMessage("Analyze current environmental telemetry.");
    await success();
  };

  return (
    <View style={{ padding: 16 }}>
      <HapticButton
        title={gemini.isLoading ? "Reasoning on TPU..." : "Ask Assistant"}
        onPress={handleAskAI}
        variant="primary"
      />
    </View>
  );
}
```

### Recipe 2: Camera Looks & Zoom
```tsx
import React from 'react';
import { View } from 'react-native';
import { useCamera, useHaptics, HapticButton } from './src';

export function ProPhotoView() {
  const camera = useCamera();
  const { selection } = useHaptics();

  return (
    <View style={{ padding: 16 }}>
      <HapticButton
        title={`Look: ${camera.selectedLook}`}
        onPress={() => {
          selection();
          camera.setLook('Editorial');
        }}
        variant="outline"
      />
      <HapticButton
        title="Max zoom"
        onPress={() => {
          selection();
          camera.setZoom(camera.maxZoomFactor);
        }}
        variant="primary"
      />
    </View>
  );
}
```

---

## ⚠️ Anti-Patterns to Avoid

1. **Do not use `Alert.alert` for routine errors**: Use in-app banners or haptic pulses (`haptics.error()`).
2. **Do not block the JavaScript thread with large sync loops**: For heavy factorization or tensor benchmarks, rely on the `useCPU` and `useTPU` background hooks.
3. **Do not poll sensors at 1ms intervals**: Standard UI monitors should use 100ms (10 Hz) or 50ms (20 Hz) to avoid thermal throttling.
4. **Never store API keys in plaintext files**: Always persist through `useSecurity().saveSecureItem()` which encrypts into the Titan M3 hardware keystore.
5. **Never omit KeepAwake tags**: In Expo SDK 57, `activateKeepAwakeAsync(tag)` requires passing a string tag to avoid unhandled promise rejections.

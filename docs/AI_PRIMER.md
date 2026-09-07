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
Every hook exposes `source: 'hardware' | 'derived' | 'simulated' | 'unavailable'` (see `src/core/observability.ts`). Never substitute a plausible default for a value that could not be read: render `null` as "—" and pass `source` to `MetricCard` so the tag is visible. Radio adapter states (NFC antenna, Bluetooth controller, UWB chip) report `source: 'hardware'`; RF scan discoveries remain `simulated` until dedicated background scan services land. HiLight drives physical hardware when the native ADB daemon is running (`npm run hilight:daemon`, `source: 'hardware'`) and acts as an on-screen mirror when untethered (`source: 'simulated'`). Log lifecycle and errors with `logEvent(module, event, data)`; they surface in the Observability panel and in `adb logcat -s ReactNativeJS | grep PixelKit`.

---

## 🧭 Master Silicon & Hook Mapping Table

| Component | Hook | Return Values | Key Usage Example |
| :--- | :--- | :--- | :--- |
| **Tensor G6 CPU** | `useCPU()` | `coreTopology, coreCount (7), cpuLoadPercent, nodeProcess ("TSMC 2nm")` | Monitor 7-core thermal & compute loads |
| **PowerVR GPU** | `useGPU()` | `frameRenderTimeMs, droppedFrameCount, isStuttering` | Monitor 8.33ms 120 FPS frame budget |
| **Tensor TPU** | `useTPU()` | `activeDelegate, lastInferenceLatencyMs, throughputTokensPerSec` | Benchmark local neural inference |
| **LPDDR5X RAM** | `useMemory()` | `totalRAMMB, usedRAMMB, freeRAMMB, purgeCaches()` | Prevent Low Memory Killer (LMK) crashes |
| **HiLight LED Ring**| `useHiLight()` | `availability, isDaemonConnected, triggerGeminiPulse(), triggerContactAlert()` | [Pixel 11 Pro] Rear LED array (`hardware` with ADB daemon, `simulated` when untethered) |
| **UWB Radar** | `useUWB()` | `isEnabled, chipId, activeTargets, isRanging, startRanging()` | [Pixel Pro] Hardware chip state (`hardware`), distance & AoA |
| **Camera & capture** | `useCamera()` | `cameraRef, takePicture(), startRecording(), stopRecording(), zoomFactor (0..1), isTorchOn` | Photo and video capture. Zoom is a 0..1 fraction, not a multiplier. Looks are UI state only |
| **Video playback** | `useVideo()` | `player, positionSeconds, durationSeconds, load(), play(), seekTo()` | Plays back what useCamera recorded; render `<VideoView player={player} />` |
| **Media library** | `useMediaLibrary()` | `save(uri, album?), loadRecent(), recent, hasLimitedAccess` | Keeps a capture; without it cache files are reclaimed |
| **Cellular modem** | `useCellular()` | `generation, is5G, carrierName, mobileCountryCode` | 5G vs LTE and which carrier; `useNetwork` cannot answer this |
| **Sensors** | `useSensors(ms)` | `accelerometer, gyroscope, magnetometer, barometer` | 6-axis motion & hypsometric altitude |
| **Text to speech** | `useSpeech()` | `speak(text), voices, isSpeaking, setRate(), setPitch()` | Output half of voice; awaits the utterance so calls can be sequenced |
| **Speech AI** | `useSpeechAI()` | `isListening, voiceDecibels, interimTranscript, startListening(), stopListeningAndTranscribe()` | Dual-mode: on-device offline ASI and cloud STT |
| **On-Device GenAI** | `useGenAITasks()` | `summarize(), proofread(), rewrite(), describeImage()` | ML Kit on-device GenAI task acceleration via AICore |
| **On-Device NLP** | `useNaturalLanguageAI()` | `identifyLanguage(), translate(), suggestReplies(), extractEntities()` | ML Kit 58-language translation, entity extraction & smart reply |
| **Vision & OCR** | `useVisionAI()` | `recognizeText(), scanBarcodes(), labelImage(), detectFaces(), detectFaceMesh(), detectObjects()` | On-device ML Kit Vision + cloud Gemini multimodal |
| **Conversational** | `useGemini()` | `messages, isLoading, sendMessage(prompt)` | gemini-3.8-flash chat via ai.chats |
| **On-device Nano** | `useGeminiNano()` | `status, info, messages, partial, sendMessage(prompt), download()` | Gemini Nano through AICore; latency and tok/s measured on device |
| **Bluetooth LE** | `useBLE()` | `state, channelSounding, bondedDevices, peripherals, isScanning` | Physical BT adapter, Channel Sounding, bonded devices & scanner |
| **NFC Radio** | `useNFC()` | `antennaState, observeModeSupported, lastScannedTag, isScanning` | Physical NFC antenna, Android 15+ Observe Mode & NDEF tag reader |
| **Hardware Radios** | `useRadios()` | `nfc, bluetooth, uwb, wifiRtt, satellite, source, refresh()` | Unified hardware radio subsystem telemetry |
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
4. Treat Camera Looks and Super Res Zoom as Pixel Camera app features. useCamera() does capture (takePicture, startRecording) and exposes zoom as a 0..1 fraction, never an optical multiplier. Save captures with useMediaLibrary() or the system reclaims them.
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

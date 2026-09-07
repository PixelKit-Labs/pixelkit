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

### 7. The Telemetry Provenance Rule (Nothing Is Simulated)
Every hook exposes `source: 'hardware' | 'derived' | 'unavailable'` (see `src/core/observability.ts`). There is deliberately no `simulated` value: the type makes a fabricated reading unrepresentable. Never substitute a plausible default for a value that could not be read — render `null` as "—" and pass `source` to `MetricCard` so the tag is visible. Radio adapter state (NFC antenna, Bluetooth controller, UWB chip) and live scans both report `hardware`, because both are real reads. HiLight drives the physical LEDs when the native ADB daemon is running (`npm run hilight:daemon`, `source: 'hardware'`); without the daemon its `availability` is `'unavailable'` and the control functions refuse rather than pretending. Log lifecycle and errors with `logEvent(module, event, data)` and `logError(module, event, error)`; both surface in the Observability panel and in `adb logcat -s ReactNativeJS | grep PixelKit`.

---

## 🧭 Master Silicon & Hook Mapping Table

Every hook's full contract — each input with its default and units, each output field with its meaning, and each function with what it takes and returns — is in [`docs/HARDWARE_API.md`](HARDWARE_API.md) and the per-domain pages under [`docs/api/`](api/). This table is the index.

| Component | Hook | Inputs | Key outputs | Functions |
| :--- | :--- | :--- | :--- | :--- |
| **Tensor G6 CPU** | `useCPU()` | none | `coreTopology`, `coreCount` (7), `cpuLoadPercent` (frequency utilisation, not scheduler load), `appCpuPercent`, `cores[]`, `governorMode` | `benchmarkCPU() → Promise<number>` ms |
| **PowerVR GPU** | `useGPU()` | none | `gpuRenderer`, `graphicsApi`, `frameRenderTimeMs`, `measuredFps`, `droppedFrameCount`, `isStuttering`, `gpuMemoryUsageMB` (always `null`) | none |
| **Tensor TPU** | `useTPU()` | none | `aicoreInstalled`, `aicoreVersion`, `hasNpuFeature`, `activeDelegate`; inference metrics are `null` here — see `useGeminiNano` | `benchmarkTPU() → Promise<TPUAcceleration>` (CPU fallback, labelled) |
| **LPDDR5X RAM** | `useMemory()` | none | `totalRAMMB`, `usedRAMMB`, `freeRAMMB`, `isLowMemory`, `appJavaHeapMB` | `purgeCaches() → void` |
| **ADPF thermals** | `useADPF()` | none | `thermalHeadroom` (0 = cool, 1 = the phone is about to slow itself down), `thermalStatus`, `cpuHeadroom`, `gpuHeadroom`, `targetFps`, `currentFps` | `reportWorkDuration(actualMs, targetMs?) → 'WITHIN_BUDGET' \| 'BOOST_REQUESTED'` |
| **HiLight LED ring** | `useHiLight()` | none | `availability` (`hardware` with the ADB daemon, `unavailable` without it), `isDaemonConnected`, `mode`, `currentColor`, `brightness` | `setColor(hex)`, `setMode(mode)`, `setBrightness(0..1)`, `triggerGeminiPulse(ms?)`, `triggerContactAlert(hex, ms?)`, `turnOff()`, `toggle()` |
| **UWB radar** | `useUWB()` | none | `isSupported`, `isEnabled`, `chipId`, `isRanging`, `activeTargets[]`, `sessionInfo` | `startRanging(sessionId?) → Promise<boolean>`, `stopRanging() → void` |
| **Camera & capture** | `useCamera()` | none (attach `cameraRef`) | `cameraRef`, `viewProps`, `zoomFactor` (0..1 fraction, not a multiplier), `lastPhoto`, `lastVideoUri`, `isRecording` | `takePicture({quality?, base64?, exif?}) → Promise<CapturedPhoto \| null>`, `startRecording({maxDurationSeconds?}) → Promise<string \| null>`, `stopRecording()`, `setZoom(0..1)` |
| **Video playback** | `useVideo()` | `initialSource?: VideoSource` | `player`, `positionSeconds`, `durationSeconds`, `status` | `load(source, {autoplay?, loop?, muted?}) → Promise<boolean>`, `play()`, `seekTo(seconds)`, `generateThumbnails(times)` |
| **Media library** | `useMediaLibrary()` | none | `recent[]`, `lastSaved`, `permissionGranted`, `hasLimitedAccess` | `save(localUri, albumName?) → Promise<SavedMedia \| null>`, `loadRecent(limit?)`, `remove(media)` |
| **Cellular modem** | `useCellular()` | none | `generation`, `is5G`, `carrierName` (needs the phone-state permission), `mobileCountryCode`, `mobileNetworkCode` | `refresh()`, `requestPermission() → Promise<boolean>` |
| **Sensors** | `useSensors(updateIntervalMs?)` | `updateIntervalMs` default `100` | `accelerometer` (g), `gyroscope` (rad/s), `magnetometer` (μT), `barometer` (hPa + relative metres), `lightLux`, `hasMotionSample` | none |
| **Text to speech** | `useSpeech()` | none | `voices[]`, `isSpeaking`, `maxInputLength`, `rate`, `pitch` | `speak(text, {language?, voice?, rate?, pitch?, volume?}) → Promise<void>`, `stop()`, `voicesForLanguage(tag)` |
| **Speech recognition** | `useSpeechAI()` | none | `isListening`, `voiceDecibels` (dBFS), `streamingPartial`, `lastTranscript`, `recognitionMode` | `setRecognitionMode('on-device' \| 'cloud')`, `startListening() → Promise<boolean>`, `stopListeningAndTranscribe() → Promise<SpeechTranscriptionResult \| null>` |
| **On-device GenAI** | `useGenAITasks()` | none | `summaryResult`, `proofreadResult`, `rewriteResult`, `imageDescriptionResult`, `isRunning` | `summarize(text, options?)`, `proofread(text)`, `rewrite(text, tone?)`, `describeImage(input, style?)` — each `→ Promise<Result \| null>` |
| **On-device NLP** | `useNaturalLanguageAI()` | none | `languageResult`, `translationResult`, `smartReplyResult`, `entityResult` | `identifyLanguage(text)`, `translate(text, from?, to?)`, `suggestReplies(history)`, `extractEntities(text)` |
| **Vision & OCR** | `useVisionAI()` | none (every call takes a file URI or base64) | `ocrResult`, `barcodeResult`, `labelsResult`, `facesResult`, `objectsResult`, `analysis` | `recognizeText(input)`, `scanBarcodes(input)`, `labelImage(input)`, `detectFaces(input)`, `captureAndAnalyze(useCamera?)` |
| **Conversational** | `useGemini()` | none (setters configure it) | `messages` (`system` role = local errors), `isLoading`, `hasApiKey`, `model`, `availableModels` | `sendMessage(prompt) → Promise<void>`, `clearMessages()`, `setApiKey(key)`, `setTemperature(n)` |
| **On-device Nano** | `useGeminiNano()` | none (setters configure it) | `status`, `info` (token limit, feature flags), `messages`, `partial`, `lastLatencyMs`, `lastFirstTokenMs`, `lastDecodeTokensPerSec` | `sendMessage(prompt)`, `generate(prompt, options?)`, `download()`, `warmup()`, `countTokens(prompt)` |
| **Bluetooth LE** | `useBLE()` | none | `state`, `channelSounding`, `bondedDevices[]`, `peripherals[]` (RSSI + estimated metres), `isScanning` | `startScan(timeoutMs?) → Promise<boolean>`, `stopScan()` |
| **NFC radio** | `useNFC()` | none | `antennaState`, `observeModeSupported`, `lastScannedTag` (decoded NDEF records), `tagCount`, `lastWriteOk` | `startReader() → Promise<boolean>`, `stopReader()`, `writeText(text) → Promise<boolean>` (queues), `clearTag()` |
| **Hardware radios** | `useRadios()` | none | `nfc`, `bluetooth`, `uwb`, `wifiRtt`, `satellite` blocks | `refresh() → void` |
| **Flashlight** | `useTorch()` | none | `isAvailable`, `isTorchOn`, `isStrobing`, `maxStrengthLevel` (21 here) | `setTorch(on, strengthLevel?) → Promise<boolean>`, `toggleTorch()`, `startStrobe(intervalMs?)`, `stopStrobe()` |
| **120 Hz display** | `useDisplay()` | none | `refreshRateHz`, `supportedRefreshRates`, `hdrTypes`, `brightness`, `isKeepAwake` | `setPreferredRefreshRate(hz) → Promise<boolean>`, `toggleKeepAwake()`, `setScreenBrightness(0..1)` |
| **Biometrics** | `useBiometrics()` | none | `hasHardware`, `isEnrolled`, `supportedTypes`, `lastResult` | `authenticate(promptMessage?) → Promise<boolean>`, `refresh()` |
| **Secret storage** | `useSecurity()` | none | `isHardwareBacked`, `securityModule`, `isPostQuantumProtected` (always `false`), `lastOperation` | `saveSecureItem(key, value) → Promise<boolean>`, `getSecureItem(key) → Promise<string \| null>`, `deleteSecureItem(key)` |
| **GNSS location** | `useLocation()` | none | `latitude`, `longitude`, `altitude`, `accuracy` (metres), `hasFix` | `refreshLocation() → Promise<boolean>` |
| **Network** | `useNetwork()` | none | `ipAddress`, `networkType`, `isConnected` (reachable, not merely attached), `isMetered`, `isAirplaneMode` | `refreshNetwork() → Promise<void>` |
| **Capabilities** | `useCapabilities()` | none | `hasHiLight`, `hasUWB`, `hasStrongBox`, `supportsHapticEnvelopes`, `verification` (`device` or `model-table`) | none |
| **Haptics** | `useHaptics()` | none | `envelopeSupported`, `resonantFrequencyHz` (134.4 Hz), `supportedPrimitives[]` | `triggerHaptic(type?)`, `playEnvelope(points, initialSharpness?) → boolean`, `playPrimitives(steps) → boolean`, `cancel()` |
| **Microphone** | `useAudio()` | none | `meteringDecibels` (dBFS), `level` (0..1), `isSilent`, `durationSeconds`, `lastRecordingUri` | `startRecording({quality?, maxDurationSeconds?}) → Promise<boolean>`, `stopRecording() → Promise<string \| null>`, `playLastRecording(uri?)` |

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

# PixelKit Hardware API Reference
> **Hook-by-hook reference for the Google Pixel 11 Pro build**

This document is the consolidated reference for every hook in the PixelKit SDK (React Native, Expo SDK 57) on the **Google Pixel 11 Pro** (Android 17, Google Tensor G6). Device facts are taken from .

---

## 📑 Table of Contents

1. [Architectural Overview](#architectural-overview)
2. [Silicon & Compute Hooks](#silicon--compute-hooks)
   - [useCPU](#usecpu) (Tensor G6 7-core, cpufreq)
   - [useGPU](#usegpu) (PowerVR CXTP-48-1536, Vulkan 1.4)
   - [useTPU](#usetpu) (AICore / Gemini Nano detection)
   - [useMemory](#usememory) (ActivityManager memory)
   - [useADPF](#useadpf) (Android Dynamic Performance Framework)
3. [Pixel Pro Exclusive Silicon](#pixel-pro-exclusive-silicon)
   - [useHiLight](#usehilight) (Camera Bar Notification Ring)
   - [useUWB](#useuwb) (Ultra-Wideband Spatial Radar)
4. [Neural & Intelligence Hooks](#neural--intelligence-hooks)
   - [useGemini](#usegemini) (gemini-3.8-flash chat)
   - [useGeminiNano](#usegemininano) (Gemini Nano on-device via ML Kit GenAI)
   - [useGenAITasks](#usegenaitasks) (Dedicated On-Device GenAI Task Modules)
   - [useNaturalLanguageAI](#usenaturallanguageai) (58-Language Offline NLP Suite)
   - [useSpeechAI](#usespeechai) (ASI Offline & Gemini Audio Speech Recognition)
   - [useSpeech](#usespeech) (Text to speech on the platform engine)
   - [useVisionAI](#usevisionai) (ML Kit On-Device Vision + Multimodal Gemini)
5. [Sensors & Physical Actuators](#sensors--physical-actuators)
   - [useSensors](#usesensors) (6-Axis IMU & Barometer)
   - [useCamera](#usecamera) (photo capture, video recording, zoom, torch)
   - [useTorch](#usetorch) (Dual-LED Flashlight & Strobe)
   - [useHaptics](#usehaptics) (Linear Resonant Actuator)
6. [Radios & Hardware Security](#radios--hardware-security)
   - [useBiometrics](#usebiometrics) (Ultrasonic fingerprint & face unlock)
   - [useSecurity](#usesecurity) (SecureStore on the Android Keystore)
   - [useBLE](#useble) (Bluetooth 5.4 LE)
   - [useNFC](#usenfc) (NDEF Controller)
   - [useRadios](#useradios) (Unified Radio Telemetry)
   - [useLocation](#uselocation) (Dual-Band L1/L5 GNSS)
7. [System & Media Hooks](#system--media-hooks)
   - [useAudio](#useaudio) (expo-audio capture, metering, playback)
   - [useVideo](#usevideo) (expo-video playback, seek, thumbnails)
   - [useMediaLibrary](#usemedialibrary) (save captures to the gallery)
   - [useCellular](#usecellular) (carrier, radio generation, network codes)
   - [useDisplay](#usedisplay) (3,600 nits 120Hz LTPO OLED)
   - [useDevice](#usedevice) (Pixelsnap Qi2.2 25W & Battery)
   - [useNetwork](#usenetwork) (MediaTek M90 Wi-Fi 7 & 5G Modem)

---

## 🏛️ Architectural Overview

PixelKit exposes Pixel 11 Pro hardware to React Native through Expo modules and the local PixelNative module.

```
+-------------------------------------------------------------------------+
|                           REACT NATIVE / EXPO                           |
|                      (Hermes Bytecode Execution)                        |
+-------------------------------------------------------------------------+
                                     |
+-------------------------------------------------------------------------+
|                            PIXELKIT SDK                                 |
|                        (src/index.ts Re-exports)                        |
+-------------------------------------------------------------------------+
        |                  |                    |                  |
+---------------+  +---------------+  +------------------+  +---------------+
|  CPU / GPU    |  |  Tensor TPU   |  | Pro Exclusives   |  | Titan M3      |
|  Tensor G6    |  |  NNAPI/LiteRT |  | HiLight LED Ring |  | StrongBox     |
|  real cpufreq |  |  Gemini 3.8   |  | UWB ranging      |  | Biometrics    |
+---------------+  +---------------+  +------------------+  +---------------+
```

All hardware hooks are exported directly from `./src`:
```typescript
import { 
  useCPU, 
  useGPU, 
  useTPU, 
  useMemory, 
  useADPF, 
  useHiLight,
  useUWB, 
  useSensors, 
  useHaptics, 
  useCamera,
  useSpeechAI, 
  useGemini, 
  useGeminiNano,
  useVisionAI,
  useSecurity
} from './src';
```

---

## 💻 Silicon & Compute Hooks

> **All silicon hooks read real device state through the `PixelNative` module (`modules/pixel-native`). Values that cannot be read are `null` and every hook exposes `source: TelemetrySource` (`hardware | derived | unavailable`). See `docs/api/silicon-compute.md` for full signatures.**

### `useCPU`
* **File Path**: `src/hardware/useCPU.ts`
* **Target Hardware**: Google Tensor G6 7-core cluster. Verified on Pixel 11 Pro from `/proc/cpuinfo` + cpufreq: **1x Arm C1-Ultra @ 4.11 GHz + 4x Arm C1-Pro @ 3.38 GHz + 2x Arm C1-Pro @ 2.65 GHz**, governor `sched_pixel`. (Process node is not exposed by the device and is not claimed.)
* **Description**: Real topology, per-core current/max MHz, kernel governor, cluster frequency utilisation (HW) and this app's CPU share (DERIVED). `benchmarkCPU()` is a real JS single-thread prime sieve.

#### Interface
```typescript
coreTopology: string; coreCount: number;
cpuLoadPercent: number | null;     // cluster frequency utilisation
appCpuPercent: number | null;      // process time / wall time
cores: { index; part; name; curMHz; maxMHz; minMHz }[];
clusters: { part; name; maxMHz; count }[];
governorMode: string;              // read-only
lastBenchmarkDurationMs: number | null; isBenchmarking: boolean;
benchmarkCPU(): Promise<number>; source: TelemetrySource;
```

---

### `useGPU`
* **File Path**: `src/hardware/useGPU.ts`
* **Target Hardware**: Verified via EGL on Pixel 11 Pro: `ANGLE (Imagination Technologies, Vulkan 1.4.317 (PowerVR C-Series CXTP-48-1536 MC1))`, OpenGL ES 3.2.
* **Description**: Renderer/vendor/GL version from an offscreen EGL context, Vulkan version from the system feature, and **Choreographer** frame pacing (presented FPS, avg/max frame interval, jank frames > 1.5× expected). GPU memory is not exposed by Android → `null`.

#### Interface
```typescript
gpuRenderer: string | null; gpuVendor: string | null; graphicsApi: string | null;
frameRenderTimeMs: number | null; maxFrameMs: number | null; measuredFps: number | null;
droppedFrameCount: number; jankFramesLastSecond: number;
targetBudgetMs: number;            // 8.33 @120 Hz
isStuttering: boolean; gpuMemoryUsageMB: null; source: TelemetrySource;
```

---

### `useTPU`
* **File Path**: `src/ai/useTPU.ts`
* **Target Hardware**: Tensor TPU via **AICore** (Gemini Nano host). Verified on Pixel 11 Pro: AICore `0.release.prod_aicore_20260723.00_RC11`, Private Compute Services `1.0.release.962568596`.
* **Description**: Detects the on-device AI stack (needs `<queries>` for package visibility). Real on-device inference metrics (latency, tokens, time-to-first-token) live in `useGeminiNano()` via the `pixel-nano` module; `benchmarkTPU()` runs a real JS matmul labelled **CPU Fallback**.

---

### `useMemory`
* **File Path**: `src/hardware/useMemory.ts`
* **Target Hardware**: 12 GB LPDDR5X on Pixel 11 Pro (reports 11,647 MB total).
* **Description**: `ActivityManager.getMemoryInfo` (total/available/threshold/low-memory), Java and native heaps of this process, polled every 2 s. `purgeCaches()` requests a GC and re-reads.

---

### `useADPF`
* **File Path**: `src/hardware/useADPF.ts`
* **Target Hardware**: Android Dynamic Performance Framework.
* **Description**: `PowerManager.getThermalHeadroom` (10 s poll; 0.55 measured at status NONE), thermal status listener, headroom thresholds, Android 16+ `SystemHealthManager` CPU/GPU headroom (null when unsupported), display-mode `targetFps` and Choreographer `currentFps`.

---

## 🎯 Pixel Pro Exclusive Silicon

### `useHiLight`
* **File Path**: `src/hardware/useHiLight.ts`
* **Target Hardware**: Eight `Light.LIGHT_TYPE_APPLICATION` RGB LEDs around the flash (ids 1-8, 33 ms update period) on Pixel 11 Pro-class devices.
* **Description**: Android restricts `CONTROL_DEVICE_LIGHTS` to signature/system permissions with no public third-party API. `useHiLight` drives the real physical LEDs when the native PixelKit ADB daemon is active (`npm run hilight:daemon`, `availability: 'hardware'`, `source: 'hardware'`) Without the daemon the LEDs cannot be driven and availability is `'unavailable'`.

#### Interface
```typescript
type HiLightMode = 'off' | 'glow' | 'breathing' | 'pulse' | 'gemini_thinking' | 'incoming_call' | 'notification';

interface HiLightState {
  availability: 'hardware' | 'unavailable' | 'unsupported';
  isHardwareSupported: boolean;
  source: 'hardware' | 'unavailable';
  isDaemonConnected: boolean;
  isActive: boolean;
  currentColor: string;
  mode: HiLightMode;
  brightness: number; // 0.0 to 1.0
  isFaceDownMode: boolean;
  refreshDaemonStatus: () => Promise<boolean>;
  setColor: (hexColor: string) => void;
  setMode: (mode: HiLightMode) => void;
  setBrightness: (level: number) => void;
  triggerGeminiPulse: (durationMs?: number) => void;
  triggerContactAlert: (hexColor: string, durationMs?: number) => void;
  turnOff: () => void;
  toggle: () => void;
}
```

#### Example Usage
```tsx
import { useHiLight } from './src';

function NotificationRing() {
  const hilight = useHiLight();

  return (
    <View>
      <Button title="Pulse Gemini Cyan" onPress={() => hilight.triggerGeminiPulse(4000)} />
      <Button title="Alert Contact Green" onPress={() => hilight.triggerContactAlert('#81C995', 3000)} />
    </View>
  );
}
```

---

### `useUWB`
* **File Path**: `src/hardware/useUWB.ts`
* **Target Hardware**: Ultra-Wideband (UWB) Spatial Radar Transceiver (`UwbManager`, chip ID `default`).
* **Description**: Hardware chip state (`default`, `READY`), enabled status, and hardware ranging session management via Android `UwbManager`/`RangingManager` (`source: 'hardware'`). Reports live session status and honest HAL direct vs declared feature status. Targets remain empty until paired UWB responders are attached.

---

## 🧠 Neural & Intelligence Hooks

### `useGemini`
* **File Path**: `src/ai/useGemini.ts`
* **Target Hardware**: Google Gen AI SDK (`@google/genai`) configured for gemini-3.8-flash.
* **Description**: Multi-turn chat over `ai.chats`, API token counts and latency. There is no simulated fallback; without a key every call rejects.

---

### `useGeminiNano`
* **File Path**: `src/ai/useGeminiNano.ts` + `modules/pixel-nano` (Kotlin)
* **Target Hardware**: Gemini Nano on the Tensor G6 TPU through **AICore**, reached with `com.google.mlkit:genai-prompt:1.0.0-beta4`. Verified on Pixel 11 Pro with AICore `0.release.prod_aicore_20260723.00_RC11`.
* **Description**: Status, base model name, token limit and feature flags from `GenerativeModel`; download with progress events; streaming generation with tokens as events; latency and first-token time measured natively; output tokens from the on-device tokenizer. No cloud fallback, no simulated reply.

---

### `useGenAITasks`
* **File Path**: `src/ai/useGenAITasks.ts` + `modules/pixel-nano` (Kotlin)
* **Target Hardware**: Tensor G6 TPU via ML Kit GenAI Task APIs (AICore).
* **Description**: Dedicated on-device task clients for Summarization (article & chat transcripts into bullets), Proofreading (grammar & sentence restructuring), Rewriting (elaborate, emojify, shorten, friendly, professional, rephrase), and Image Description. Features sub-50ms local inference with hardware observability (`source: 'hardware'`).

---

### `useNaturalLanguageAI`
* **File Path**: `src/ai/useNaturalLanguageAI.ts` + `modules/pixel-nano` (Kotlin)
* **Target Hardware**: ML Kit Natural Language Processing Engine.
* **Description**: Offline NLP suite running directly on-device without internet access. Supports 58-language machine translation, fast language identification across 50+ languages with confidence scores, context-aware smart replies, and structured entity extraction (dates, flight numbers, monetary amounts, addresses, tracking numbers).

---

### `useSpeechAI`
* **File Path**: `src/ai/useSpeechAI.ts`
* **Target Hardware**: Microphone (VOICE_RECOGNITION source, 16 kHz mono) + Android System Intelligence (ASI) offline streaming recognizer & Gemini multimodal cloud fallback.
* **Description**: Dual-mode speech recognition providing real-time on-device token streaming with decibel metering (`dBFS`) and zero network transmission, alongside cloud Gemini audio transcription.

---

### `useSpeech`
* **File Path**: `src/ai/useSpeech.ts`
* **Backing Module**: `expo-speech` on the platform speech service.
* **Description**: The output half of voice. `speak` resolves when the engine finishes, so utterances can be sequenced rather than overlapping. Text longer than `maxInputLength` is rejected rather than silently truncated. Voice coverage depends on what the user has installed in system settings, so read `voices` instead of assuming a language. The engine is stopped on unmount.

#### Interface
```typescript
isSpeaking: boolean; isPaused: boolean;
voices: Voice[];                 // { identifier, name, language, quality }
voice: string | null; rate: number; pitch: number;
maxInputLength: number; lastSpokenText: string | null;
error: string | null; source: TelemetrySource;
speak(text, { language?, voice?, rate?, pitch?, volume? }?): Promise<void>;
stop(): Promise<void>; pause(): Promise<void>; resume(): Promise<void>;
checkSpeaking(): Promise<boolean>;
refreshVoices(): Promise<Voice[]>;
voicesForLanguage(tag): Voice[];
setVoice(id | null): void; setRate(n): void; setPitch(n): void;
```

---

### `useVisionAI`
* **File Path**: `src/ai/useVisionAI.ts` + `modules/pixel-nano` (Kotlin)
* **Target Hardware**: CameraX Optical Stack + ML Kit On-Device Vision Subsystem & Multimodal Gemini 3.8.
* **Description**: Full-spectrum visual intelligence suite combining on-device OCR v2 (text recognition), 1D/2D barcode & QR scanning, image concept labeling, face & 468-point 3D mesh detection, object detection & tracking, pose landmarks, selfie/subject segmentation, and cloud Gemini multimodal scene analysis with structured JSON output.

---

## 📡 Sensors & Physical Actuators

### `useSensors`
* **File Path**: `src/hardware/useSensors.ts`
* **Target Hardware**: InvenSense 6-Axis IMU (Accelerometer + Gyroscope), Magnetometer (Compass), Bosch Barometer (Altimeter), and Photodiode Light Sensor.
* **Description**: Real-time multi-sensor telemetry with configurable update intervals. Computes relative altitude via the international hypsometric barometric formula.

---

### `useCamera`
* **File Path**: `src/hardware/useCamera.ts`
* **Backing Module**: `expo-camera`.
* **Description**: Lens selection, zoom, flash, torch and capture. The hook owns a ref to a `CameraView`, so a screen renders the view and attaches `cameraRef` and `handleCameraReady`. `takePicture` resolves with a file on disk plus dimensions and optional base64; `startRecording` resolves with a video file when recording ends, either through `stopRecording` or a duration or size limit. **`zoom` is a 0..1 fraction of the lens range, not an optical multiplier**, so a "5x" figure from the Pixel Camera app does not map onto it. Camera Looks, Super Res Zoom and the low-light video mode belong to the Pixel Camera app and are held as interface state only.

#### Interface
```typescript
cameraRef: RefObject<CameraView | null>;      // attach to your CameraView
viewProps: { facing, zoom, flash, enableTorch, mode };
facing: 'back' | 'front'; zoomFactor: number;  // 0..1
flashMode: 'auto' | 'on' | 'off'; isTorchOn: boolean;
mode: 'picture' | 'video'; isReady: boolean; hasPermission: boolean;
isCapturing: boolean; lastPhoto: CapturedPhoto | null;
isRecording: boolean; recordingSeconds: number; lastVideoUri: string | null;
availableLenses: string[]; availablePictureSizes: string[];
selectedLook: CameraLook;                      // label only
error: string | null; source: TelemetrySource;
handleCameraReady(): Promise<void>;
takePicture({ quality?, base64?, exif?, shutterSound? }?): Promise<CapturedPhoto | null>;
startRecording({ maxDurationSeconds?, maxFileSizeBytes?, mirror? }?): Promise<string | null>;
stopRecording(): void;
toggleFacing(): void; setZoom(fraction): void; setZoomStep(step, total?): void;
setFlash(mode): void; toggleTorch(): void; setMode(mode): void;
pausePreview(): Promise<void>; resumePreview(): Promise<void>;
```

---

### `useTorch`
* **File Path**: `src/hardware/useTorch.ts`
* **Target Hardware**: Rear camera flash LED via `CameraManager.setTorchMode` and Android 13+ `turnOnTorchWithStrengthLevel`. Verified on Pixel 11 Pro: camera id 0, **21 brightness levels**; the camera HAL logs "Torch for camera id 0 turned on".
* **Description**: Real torch control; `isTorchOn` follows the system torch callback (Quick Settings toggles are reflected). Strobe toggles the hardware at ≥120 ms.

#### Interface
```typescript
isAvailable: boolean; isTorchOn: boolean; isStrobing: boolean;
maxStrengthLevel: number | null; error: string | null; source: TelemetrySource;
setTorch(on, strengthLevel?): Promise<boolean>; toggleTorch(): Promise<boolean>;
startStrobe(intervalMs?): void; stopStrobe(): void;
```

---

### `useHaptics`
* **File Path**: `src/hardware/useHaptics.ts`
* **Target Hardware**: LRA via `expo-haptics` plus `PixelNative` vibrator access. Verified on Pixel 11 Pro: resonant **134.4 Hz**, Q 14.5, amplitude control, `CAP_COMPOSE_PWLE_EFFECTS_V2` (Android 16 envelope effects supported), primitives CLICK/TICK/QUICK_RISE/SLOW_RISE/QUICK_FALL/THUD/SPIN/LOW_TICK.
* **Description**: Standard patterns (`selection`, `light`, `medium`, `heavy`, `success`, `warning`, `error`), Android 16 **envelope effects** (`playEnvelope(points)` with presets `HapticEnvelopes.thinkingRamp | doublePulse | spring`), and primitive compositions (`playPrimitives(steps)`).

#### Interface
```typescript
triggerHaptic(type): Promise<void>; selection() … error(): Promise<void>;
playEnvelope(points: { intensity; sharpness; durationMs }[], initialSharpness?): boolean;
playPrimitives(steps: { primitive; scale?; delayMs? }[]): boolean; cancel(): void;
hasAmplitudeControl: boolean | null; envelopeSupported: boolean;
resonantFrequencyHz: number | null; supportedPrimitives: string[]; source: TelemetrySource;
```

---

## 🔐 Radios & Hardware Security

### `useBiometrics`
* **File Path**: `src/hardware/useBiometrics.ts`
* **Target Hardware**: Titan M3 Under-Display Ultrasonic Fingerprint & Class 3 3D Face Unlock.
* **Description**: Hardware-backed biometric authentication.

---

### `useSecurity`
* **File Path**: `src/hardware/useSecurity.ts`
* **Target Hardware**: Android Keystore; StrongBox present on Pixel 11 Pro (`android.hardware.strongbox_keystore`, verified by `useCapabilities`).
* **Description**: Secret storage through `expo-secure-store` (AES keys in the Android Keystore, `WHEN_UNLOCKED_THIS_DEVICE_ONLY`). No post-quantum algorithms are used; `isPostQuantumProtected` is always `false`.

#### Interface
```typescript
interface SecurityState {
  saveSecureItem: (key: string, value: string) => Promise<boolean>;
  getSecureItem: (key: string) => Promise<string | null>;
  deleteSecureItem: (key: string) => Promise<boolean>;
  isHardwareBacked: boolean;
  securityModule: 'Titan M3';
  isPostQuantumProtected: boolean;
}
```

---

### `useBLE`
* **File Path**: `src/hardware/useBLE.ts`
* **Target Hardware**: Bluetooth 5.4 Low Energy Radio (`BluetoothAdapter`, `BluetoothManager`, `BluetoothLeScanner`).
* **Description**: Real hardware adapter status (`ON`/`OFF`), Bluetooth 5.4 Channel Sounding hardware feature verification, real bonded/paired devices, and active physical RF peripheral discovery via Android `BluetoothLeScanner` with RSSI (dBm) and log-distance path loss distance estimation (`source: 'hardware'`).

---

### `useNFC`
* **File Path**: `src/hardware/useNFC.ts`
* **Target Hardware**: Near Field Communication (NFC) Controller (`NfcAdapter`).
* **Description**: Hardware adapter power state, antenna state (`ENABLED`/`DISABLED`), Android 15+ Observe Mode capability, and contactless NDEF smart tag detection.

---

### `useRadios`
* **File Path**: `src/hardware/useRadios.ts`
* **Target Hardware**: Unified radio subsystem (NFC, Bluetooth LE, UWB, Wi-Fi RTT, Satellite Telephony).
* **Description**: Comprehensive hardware radio telemetry directly queried from Android system services (`NfcAdapter`, `BluetoothManager`, `UwbManager`, `WifiRttManager`, `PackageManager`).

---

### `useLocation`
* **File Path**: `src/hardware/useLocation.ts`
* **Target Hardware**: Dual-Band Multi-Constellation GNSS (GPS L1/L5, Galileo, GLONASS, BeiDou).
* **Description**: High-accuracy geographic coordinates, bearing, speed, and geodetic altitude.

---

## 📱 System & Media Hooks

### `useAudio`
* **File Path**: `src/hardware/useAudio.ts`
* **Target Hardware**: Multi-Microphone Array (`VOICE_RECOGNITION` audio source for hardware noise suppression).
* **Backing Module**: `expo-audio` (SDK 57). The legacy `expo-av` dependency has been removed.
* **Description**: Capture with pause and resume and an optional fixed duration; two profiles (`speech` 16 kHz mono via `voice_recognition`, `studio` 48 kHz stereo via `unprocessed`); dBFS metering every 100 ms with a running peak, a 0..1 `level` for meters and a silence flag; microphone enumeration and selection; speaker/earpiece routing; and playback with seek.

#### Interface
```typescript
// capture
isRecording: boolean; isPaused: boolean; canRecord: boolean;
permissionGranted: boolean; durationSeconds: number;
quality: 'speech' | 'studio';
// level
meteringDecibels: number;        // dBFS, -160..0
currentDecibels: number;         // alias
peakDecibels: number; level: number;   // level is 0..1, floored at -60 dBFS
isSilent: boolean; silenceThresholdDbfs: number;
// inputs, routing, playback
inputs: RecordingInput[]; currentInputUid: string | null;
route: 'speaker' | 'earpiece';
lastRecordingUri: string | null; isPlaying: boolean;
playbackPositionSeconds: number; playbackDurationSeconds: number;
source: TelemetrySource; error: string | null;
// actions
startRecording(o?: { maxDurationSeconds?: number; quality?: AudioQuality }): Promise<boolean>;
pauseRecording(): boolean; resumeRecording(): boolean;
stopRecording(): Promise<string | null>;
setQuality(q): void; refreshInputs(): RecordingInput[]; selectInput(uid): boolean;
setRoute(r): Promise<void>;
playLastRecording(uri?): Promise<boolean>; pausePlayback(): void;
stopPlayback(): Promise<void>; seekPlayback(seconds): Promise<void>;
```

---

### `useVideo`
* **File Path**: `src/hardware/useVideo.ts`
* **Backing Module**: `expo-video` (SDK 57 replacement for the removed `expo-av`).
* **Description**: Plays a local file or remote stream. The hook owns the player; a screen renders `<VideoView player={player} />`. Position, duration, buffered position and status are polled four times a second, which is enough for a scrubber without waking the JS thread every frame. Pairs with `useCamera().lastVideoUri`.

#### Interface
```typescript
player: VideoPlayer;             // pass to <VideoView player={player} />
hasSource: boolean; isPlaying: boolean; status: string;
positionSeconds: number; durationSeconds: number; bufferedSeconds: number;
isMuted: boolean; isLooping: boolean; playbackRate: number; volume: number;
error: string | null; source: TelemetrySource;
load(source, { autoplay?, loop?, muted? }?): Promise<boolean>;
play(): void; pause(): void; togglePlay(): void; replay(): void;
seekTo(seconds): void; seekBy(seconds): void;
setMuted(b): void; setLoop(b): void; setPlaybackRate(rate): void; setVolume(v): void;
setKeepScreenOn(b): void;
generateThumbnails(times: number | number[]): Promise<VideoThumbnail[]>;
```

---

### `useMediaLibrary`
* **File Path**: `src/hardware/useMediaLibrary.ts`
* **Backing Module**: `expo-media-library` (SDK 57 class API: `Asset.create`, `Album.create`, `Query`; the `createAssetAsync` helpers now throw).
* **Description**: Promotes a capture out of the app cache, where the system will eventually reclaim it, into the user's media store. Also lists recent items and deletes them. Android 13+ grants read access per media type and the user may share only selected items, which is reported as `hasLimitedAccess`.

#### Interface
```typescript
permissionGranted: boolean; hasLimitedAccess: boolean;
isSaving: boolean; isLoading: boolean;
recent: SavedMedia[];            // { id, uri, filename, width, height, durationSeconds, creationTime }
lastSaved: SavedMedia | null;
error: string | null; source: TelemetrySource;
requestPermission(writeOnly?): Promise<boolean>;
save(localUri, albumName?): Promise<SavedMedia | null>;
loadRecent(limit?): Promise<SavedMedia[]>;
remove(media): Promise<boolean>;
```

---

### `useCellular`
* **File Path**: `src/hardware/useCellular.ts`
* **Backing Module**: `expo-cellular`. Carrier and network codes need `READ_PHONE_STATE`; generation does not.
* **Description**: Answers what `useNetwork` cannot: whether a cellular connection is 5G or something slower, and which carrier is serving it. `generation` follows the live data connection, so it changes as the device moves and reads `unknown` with no cellular data attached, including on Wi-Fi. Match carriers on the MCC/MNC pair rather than the display name.

#### Interface
```typescript
generation: 'unknown' | '2G' | '3G' | '4G' | '5G';
is5G: boolean;
carrierName: string | null;      // null without READ_PHONE_STATE
isoCountryCode: string | null;
mobileCountryCode: string | null; mobileNetworkCode: string | null;
allowsVoip: boolean | null;
permissionGranted: boolean; error: string | null; source: TelemetrySource;
refresh(): Promise<void>;
requestPermission(): Promise<boolean>;
```

---

### `useCapabilities`
* **File Path**: `src/hardware/useCapabilities.ts` (pure resolver in `src/core/capabilities.ts`)
* **Target Hardware**: Device identity via `expo-device`.
* **Description**: Single source of truth for what the current Pixel physically has and which Android platform APIs are available. Every Pro-exclusive hook (`useHiLight`, `useUWB`) and every Android 16/17-gated feature reads from it. Values are memoised for the app lifetime.

#### Interface
```typescript
modelName: string; isPhysicalDevice: boolean; isPixel: boolean;
pixelGeneration: number | null; isProModel: boolean; isFoldable: boolean;
androidApiLevel: number | null;
hasHiLight: boolean;              // Pixel 11 Pro / Pro XL / Pro Fold
hasUWB: boolean;                  // Pro since Pixel 6 Pro, all Folds
hasTitanM3: boolean;              // Pixel 11 family
geminiNanoTier: 'nano-v4' | 'nano-v3' | 'nano-v2' | 'none';
supportsRangingApi: boolean;      // API 36+
supportsHapticEnvelopes: boolean; // API 36+
supportsAppFunctions: boolean;    // API 36+
supportsAndroid17Apis: boolean;   // API 37+
```

---

### `useDisplay`
* **File Path**: `src/hardware/useDisplay.ts`
* **Target Hardware**: 1-120 Hz LTPO Super Actua OLED. Verified on Pixel 11 Pro: active mode 120 Hz, `hasArrSupport = true`, rates 120/60/40/30/24/20/15/10/5/2/1 Hz, HDR10 · HLG · HDR10+, render mode 1080×2410 (panel native 1280×2856), 420 dpi.
* **Description**: Real `Display` mode telemetry polled every 2 s, `setPreferredRefreshRate(hz)` (confirmed as `frameRateOverride` in `dumpsys display`), brightness via expo-brightness, wake lock via expo-keep-awake (tagged).

#### Interface
```typescript
refreshRateHz: number; hasArrSupport: boolean | null; supportedRefreshRates: number[];
resolution: { width; height; densityDpi } | null; hdrTypes: number[]; isHdr: boolean; maxLuminance: number | null;
setPreferredRefreshRate(hz): Promise<boolean>; isKeepAwake: boolean; toggleKeepAwake(): Promise<void>;
brightness: number; setScreenBrightness(v): Promise<void>; source: TelemetrySource;
```

---

### `useDevice`
* **File Path**: `src/hardware/useDevice.ts`
* **Target Hardware**: Android HAL, PMIC, and Pixelsnap Qi2.2 25W magnetic wireless charging.
* **Description**: Battery level, charging state, device thermals, and OS specifications.

---

### `useNetwork`
* **File Path**: `src/hardware/useNetwork.ts`
* **Target Hardware**: MediaTek M90 Modem with Wi-Fi 7 (802.11be), 5G Sub-6/mmWave, and Satellite SOS.
* **Description**: IP address inspection, cellular status, and airplane mode detection.

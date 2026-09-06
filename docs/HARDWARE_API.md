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
   - [useSpeechAI](#usespeechai) (expo-audio → Gemini transcription)
   - [useVisionAI](#usevisionai) (Multimodal Scene Inspection)
5. [Sensors & Physical Actuators](#sensors--physical-actuators)
   - [useSensors](#usesensors) (6-Axis IMU & Barometer)
   - [useCamera](#usecamera) (expo-camera zoom, flash, lens)
   - [useTorch](#usetorch) (Dual-LED Flashlight & Strobe)
   - [useHaptics](#usehaptics) (Linear Resonant Actuator)
6. [Radios & Hardware Security](#radios--hardware-security)
   - [useBiometrics](#usebiometrics) (Ultrasonic fingerprint & face unlock)
   - [useSecurity](#usesecurity) (SecureStore on the Android Keystore)
   - [useBLE](#useble) (Bluetooth 5.4 LE)
   - [useNFC](#usenfc) (NDEF Controller)
   - [useLocation](#uselocation) (Dual-Band L1/L5 GNSS)
7. [System & Media Hooks](#system--media-hooks)
   - [useAudio](#useaudio) (expo-audio dBFS meter)
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
|  real cpufreq |  |  Gemini 3.8   |  | UWB (simulated)  |  | Biometrics    |
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

> **All silicon hooks read real device state through the `PixelNative` module (`modules/pixel-native`). Values that cannot be read are `null` and every hook exposes `source: TelemetrySource` (`hardware | derived | simulated | unavailable`). See `docs/api/silicon-compute.md` for full signatures.**

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
* **Description**: Detects the on-device AI stack (needs `<queries>` for package visibility). Inference metrics stay `null` until the `pixel-nano` ML Kit module lands; `benchmarkTPU()` runs a real JS matmul labelled **CPU Fallback**.

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
* **Target Hardware**: Eight `Light.LIGHT_TYPE_APPLICATION` RGB LEDs around the flash (ids 1-8, 33 ms update period), reached through `android.hardware.lights.ILightsManager`. Verified on Pixel 11 Pro (see `docs/research/HILIGHT_LED_ARRAY.md`).
* **Description**: The LEDs sit behind `CONTROL_DEVICE_LIGHTS` (signature|privileged). With Shizuku installed, running and granted, `connect()` binds `modules/pixel-hilight` `HiLightService` (uid 2000) and the colour methods drive the real LEDs (`availability: 'shizuku'`, `source: 'hardware'`). Without it the state is mirrored on screen (`'simulated'`). The helper caps every request at 60 s, limits lit time to 50 % of any 10-minute window, and runs the stuck-LED clearing sequence on every clear.

#### Interface
```typescript
type HiLightMode = 'off' | 'glow' | 'breathing' | 'pulse' | 'gemini_thinking' | 'incoming_call' | 'notification';

interface HiLightState {
  availability: 'shizuku' | 'simulated' | 'unsupported';
  isHardwareSupported: boolean;
  source: 'hardware' | 'simulated' | 'unavailable';
  shizuku: HiLightStatus | null;   // installed / running / permission / bound, read live
  helper: HiLightInfo | null;      // uid, light ids, duty accounting from the shell helper
  error: string | null;
  isActive: boolean;
  currentColor: string;
  mode: HiLightMode;
  brightness: number; // 0.0 to 1.0, applied by scaling RGB
  isFaceDownMode: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => void;
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
* **Target Hardware**: Ultra-Wideband (UWB) Spatial Radar Transceiver.
* **Description**: Distance, azimuth and elevation to UWB targets. The radio is verified by `useCapabilities`; ranging is simulated until the RangingManager path lands.

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

### `useSpeechAI`
* **File Path**: `src/ai/useSpeechAI.ts`
* **Target Hardware**: Microphone (VOICE_RECOGNITION source, 16 kHz mono) + Gemini audio transcription.
* **Description**: Records voice audio with real-time decibel metering, submits speech packets to AI models, and returns transcribed tokens.

---

### `useVisionAI`
* **File Path**: `src/ai/useVisionAI.ts`
* **Target Hardware**: CameraX Optical Stack + Multimodal Gemini Vision.
* **Description**: Takes raw camera photo buffers, downscales for optimal token economy, and submits multimodal prompts to Gemini for scene analysis.

---

## 📡 Sensors & Physical Actuators

### `useSensors`
* **File Path**: `src/hardware/useSensors.ts`
* **Target Hardware**: InvenSense 6-Axis IMU (Accelerometer + Gyroscope), Magnetometer (Compass), Bosch Barometer (Altimeter), and Photodiode Light Sensor.
* **Description**: Real-time multi-sensor telemetry with configurable update intervals. Computes relative altitude via the international hypsometric barometric formula.

---

### `useCamera`
* **File Path**: `src/hardware/useCamera.ts`
* **Target Hardware**: Triple Camera Array (50MP Wide, 48MP Ultrawide, 48MP Periscope Telephoto).
* **Description**: expo-camera lens switching, zoom, flash and permission state. Camera Looks (*Original, Natural, Shadows, Vanilla, Editorial, Velvet, Classic, Digi, Black Tie, Minimal*), Super Res Zoom and low-light video are Pixel Camera app features; the hook holds a Look label and low-light flag as UI state only.

#### Interface
```typescript
type CameraLook = 'Original' | 'Natural' | 'Shadows' | 'Vanilla' | 'Editorial' | 'Velvet' | 'Classic' | 'Digi' | 'Black Tie' | 'Minimal';

interface CameraState {
  facing: 'back' | 'front';
  zoomFactor: number;
  maxZoomFactor: number; // 120.0x
  flashMode: 'auto' | 'on' | 'off';
  hasPermission: boolean;
  selectedLook: CameraLook;
  isUltraLowLightVideoActive: boolean;
  setLook: (look: CameraLook) => void;
  setZoom: (ratio: number) => void;
  toggleUltraLowLightVideo: () => void;
}
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
* **Target Hardware**: Bluetooth 5.4 Low Energy Radio.
* **Description**: Discovery of nearby BLE peripherals, beacons, and RSSI proximity tracking.

---

### `useNFC`
* **File Path**: `src/hardware/useNFC.ts`
* **Target Hardware**: Near Field Communication (NFC) Controller.
* **Description**: Reads contactless NDEF records and RFID tags.

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
* **Description**: Records mono 16 kHz AAC (the format every Google speech API expects) with 100 ms dBFS metering (-160 silence to 0 clipping).

#### Interface
```typescript
isRecording: boolean;
meteringDecibels: number;        // dBFS, -160..0
currentDecibels: number;         // alias of meteringDecibels
permissionGranted: boolean;
startRecording(): Promise<boolean>;
stopRecording(): Promise<string | null>;  // file URI
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

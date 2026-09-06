# PixelForge Hardware API Reference ⚡
> **Exhaustive Technical Manual for Google Pixel 11 Pro Silicon & Neural Architecture**

This document provides a comprehensive technical reference for every hardware hook and module in the PixelForge SDK. All modules are designed to run in React Native (Expo SDK 57) on the **Google Pixel 11 Pro** powered by the **Google Tensor G6 ("Malibu")** processor fabricated on **TSMC 2nm (N2)**.

---

## 📑 Table of Contents

1. [Architectural Overview](#architectural-overview)
2. [Silicon & Compute Hooks](#silicon--compute-hooks)
   - [useCPU](#usecpu) (Tensor G6 7-Core 2nm)
   - [useGPU](#usegpu) (PowerVR / IMG Vulkan 1.3)
   - [useTPU](#usetpu) (Google Tensor TPU)
   - [useMemory](#usememory) (16GB LPDDR5X RAM)
   - [useADPF](#useadpf) (Android Dynamic Performance Framework)
3. [Pixel Pro Exclusive Silicon](#pixel-pro-exclusive-silicon)
   - [useHiLight](#usehilight) (Camera Bar Notification Ring)
   - [useTemperature](#usetemperature) (IR Thermopile Legacy / Ambient)
   - [useUWB](#useuwb) (Ultra-Wideband Spatial Radar)
4. [Neural & Intelligence Hooks](#neural--intelligence-hooks)
   - [useGemini](#usegemini) (Gemini 2.5 Flash / TPU)
   - [useSpeechAI](#usespeechai) (Beamforming Array Speech-to-Text)
   - [useVisionAI](#usevisionai) (Multimodal Scene Inspection)
5. [Sensors & Physical Actuators](#sensors--physical-actuators)
   - [useSensors](#usesensors) (6-Axis IMU & Barometer)
   - [useCamera](#usecamera) (Camera Looks & 120x AI Zoom)
   - [useTorch](#usetorch) (Dual-LED Flashlight & Strobe)
   - [useHaptics](#usehaptics) (Linear Resonant Actuator)
6. [Radios & Hardware Security](#radios--hardware-security)
   - [useBiometrics](#usebiometrics) (Titan M3 Ultrasonic & Face Unlock)
   - [useSecurity](#usesecurity) (Titan M3 Post-Quantum Cryptography Keystore)
   - [useBLE](#useble) (Bluetooth 5.4 LE)
   - [useNFC](#usenfc) (NDEF Controller)
   - [useLocation](#uselocation) (Dual-Band L1/L5 GNSS)
7. [System & Media Hooks](#system--media-hooks)
   - [useAudio](#useaudio) (Quad-Mic dBFS Sound Meter)
   - [useDisplay](#usedisplay) (3,600 nits 120Hz LTPO OLED)
   - [useDevice](#usedevice) (Pixelsnap Qi2.2 25W & Battery)
   - [useNetwork](#usenetwork) (MediaTek M90 Wi-Fi 7 & 5G Modem)

---

## 🏛️ Architectural Overview

PixelForge connects React Native applications directly to the bare silicon of the Google Pixel 11 Pro.

```
+-------------------------------------------------------------------------+
|                           REACT NATIVE / EXPO                           |
|                      (Hermes Bytecode Execution)                        |
+-------------------------------------------------------------------------+
                                     |
+-------------------------------------------------------------------------+
|                           PIXELFORGE SDK                                |
|                        (src/index.ts Re-exports)                        |
+-------------------------------------------------------------------------+
        |                  |                    |                  |
+---------------+  +---------------+  +------------------+  +---------------+
|  CPU / GPU    |  |  Tensor TPU   |  | Pro Exclusives   |  | Titan M3      |
|  Tensor G6    |  |  NNAPI/LiteRT |  | HiLight LED Ring |  | Quantum Vault |
|  TSMC 2nm N2  |  |  Gemini 2.5   |  | UWB Radar AoA    |  | Biometrics    |
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
  useTemperature, 
  useUWB, 
  useSensors, 
  useHaptics, 
  useCamera,
  useSpeechAI, 
  useGemini, 
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
* **Target Hardware**: Rear Camera Bar Multi-Color Notification & AI Status LED Ring.
* **Description**: Pixel 11 Pro exclusive hardware ring integrated into the camera bar visor. Provides glanceable face-down notifications, favorite contact color pulses, and breathing animations during Gemini AI reasoning.

#### Interface
```typescript
type HiLightMode = 'off' | 'glow' | 'breathing' | 'pulse' | 'gemini_thinking' | 'incoming_call' | 'notification';

interface HiLightState {
  isActive: boolean;
  currentColor: string;
  mode: HiLightMode;
  brightness: number; // 0.0 to 1.0
  isFaceDownMode: boolean;
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

### `useTemperature`
* **File Path**: `src/hardware/useTemperature.ts`
* **Target Hardware**: Infrared Thermopile Sensor (Pixel 8 Pro / 9 Pro / 10 Pro **only**).
* **Description**: Samples thermal radiation from surfaces and liquids without physical contact. The **Pixel 11 Pro, Pro XL and Pro Fold have no thermometer**; the slot now holds the **HiLight** LED array. The hook reads `useCapabilities().hasThermometer` and exposes `isHardwareSupported: boolean` and `availability: 'hardware' | 'estimated'`. When `estimated`, readings are software estimates and UI must label them as such.

#### Interface (additions)
```typescript
isHardwareSupported: boolean;                 // false on Pixel 11 Pro family
availability: 'hardware' | 'estimated';
```

---

### `useUWB`
* **File Path**: `src/hardware/useUWB.ts`
* **Target Hardware**: Ultra-Wideband (UWB) Spatial Radar Transceiver.
* **Description**: Performs centimeter-precision spatial distance ranging and Angle-of-Arrival (AoA) azimuth/elevation tracking for spatial anchors and smart devices.

---

## 🧠 Neural & Intelligence Hooks

### `useGemini`
* **File Path**: `src/ai/useGemini.ts`
* **Target Hardware**: Google Gen AI SDK (`@google/genai`) configured for Gemini 2.5 Flash / Gemini Nano.
* **Description**: Manages multi-turn conversations, token generation metrics, streaming thoughts, tool calls, and offline simulation fallback. Automatically pairs with `useHiLight` for visual feedback.

---

### `useSpeechAI`
* **File Path**: `src/ai/useSpeechAI.ts`
* **Target Hardware**: Multi-Mic Acoustic Beamforming Array + Speech-to-Text Pipeline.
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
* **Description**: Controls CameraX lifecycle, active lens switching, up to **120x Generative AI Super Res Zoom**, **Camera Looks** tone mapping presets (*Original, Natural, Shadows, Vanilla, Editorial, Velvet, Classic, Digi, Black Tie, Minimal*), and **On-Device Ultra Low Light Video** mode (5-10 lux candlelight).

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
* **Target Hardware**: Titan M3 Security Coprocessor with **Post-Quantum Cryptography (PQC)**.
* **Description**: Quantum-resistant encrypted hardware KeyStore storage via `expo-secure-store`.

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
* **Description**: Single source of truth for what the current Pixel physically has and which Android platform APIs are available. Every Pro-exclusive hook (`useTemperature`, `useHiLight`, `useUWB`) and every Android 16/17-gated feature reads from it. Values are memoised for the app lifetime.

#### Interface
```typescript
modelName: string; isPhysicalDevice: boolean; isPixel: boolean;
pixelGeneration: number | null; isProModel: boolean; isFoldable: boolean;
androidApiLevel: number | null;
hasThermometer: boolean;          // Pixel 8-10 Pro only
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

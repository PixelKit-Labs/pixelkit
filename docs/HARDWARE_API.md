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

### `useCPU`
* **File Path**: `src/hardware/useCPU.ts`
* **Target Hardware**: Google Tensor G6 ("Malibu") 7-Core Asymmetrical Cluster fabricated on **TSMC 2nm (N2)**:
  * 1x ARM C1-Ultra Prime Core @ 4.11 GHz
  * 4x ARM C-1 Pro Performance Cores @ 3.38 GHz
  * 2x ARM C-1 Pro Efficiency Cores @ 2.65 GHz
* **Description**: Monitors 7-core topology, dynamic frequency scaling, real-time CPU load estimates, and runs multi-threaded prime factorization benchmarks.

#### Interface
```typescript
interface CPUTelemetry {
  coreTopology: string;
  coreCount: number; // 7 cores
  cpuLoadPercent: number;
  governorMode: 'performance' | 'balanced' | 'powersave';
  lastBenchmarkDurationMs: number;
  nodeProcess?: string; // "TSMC 2nm (N2)"
}
```

---

### `useGPU`
* **File Path**: `src/hardware/useGPU.ts`
* **Target Hardware**: PowerVR / IMG CXTP GPU running Vulkan 1.3 / OpenGL ES 3.2.
* **Description**: Monitors GPU render pacing against the 120Hz LTPO display target (8.33ms budget). Detects dropped frames, stutter conditions, and estimates GPU memory consumption.

#### Interface
```typescript
interface GPUState {
  api: 'Vulkan 1.3' | 'OpenGL ES 3.2';
  targetFPS: 120;
  frameBudgetMs: 8.33;
  frameRenderTimeMs: number;
  droppedFrameCount: number;
  gpuMemoryUsageMB: number;
  isStuttering: boolean;
  renderPacingScore: number;
}
```

---

### `useTPU`
* **File Path**: `src/ai/useTPU.ts`
* **Target Hardware**: Google Tensor Neural Processing Unit (TPU).
* **Description**: Tracks hardware neural acceleration delegates (NNAPI, LiteRT / XNNPACK, GPU Fallback). Benchmarks tensor operations and token generation throughput (up to 50% faster on G6).

---

### `useMemory`
* **File Path**: `src/hardware/useMemory.ts`
* **Target Hardware**: Up to 16 GB LPDDR5X Ultra-High-Speed Unified RAM.
* **Description**: Live telemetry of physical memory, system heap allocation, Low Memory Killer (LMK) protection thresholds, and cache purging methods.

---

### `useADPF`
* **File Path**: `src/hardware/useADPF.ts`
* **Target Hardware**: Android Dynamic Performance Framework (ADPF) Kernel Subsystem.
* **Description**: Queries thermal headroom and GPU/CPU power budgets directly from the Android kernel to prevent thermal throttling.

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
* **Target Hardware**: Infrared Thermopile Sensor (Pixel 8 Pro / 9 Pro / 10 Pro) & Ambient Estimation.
* **Description**: Samples thermal radiation from surfaces and liquids without physical contact. On the Pixel 11 Pro, the physical hardware slot transitioned into the **HiLight** notification ring, with temperature handled via ambient algorithms.

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
* **Target Hardware**: Rear Dual-LED Camera Bar Flash.
* **Description**: Direct hardware flashlight toggle and rhythmic emergency SOS optical strobe.

---

### `useHaptics`
* **File Path**: `src/hardware/useHaptics.ts`
* **Target Hardware**: Linear Resonant Actuator (LRA) Haptic Engine.
* **Description**: High-fidelity tactile patterns matching Pixel mechanical click profiles (`selection`, `light`, `medium`, `heavy`, `success`, `warning`, `error`).

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
* **Target Hardware**: Quad-Microphone Studio Array.
* **Description**: Acoustic recording and real-time peak audio level metering in dBFS.

---

### `useDisplay`
* **File Path**: `src/hardware/useDisplay.ts`
* **Target Hardware**: 3,600 nits 1-120Hz LTPO Super Actua OLED Display.
* **Description**: Display wake-lock management and screen brightness control.

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

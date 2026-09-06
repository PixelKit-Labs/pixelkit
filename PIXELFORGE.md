# PixelForge SDK
> **The Hardware & AI Framework for Google Pixel & Android**  
> *Hardware and AI framework for the Google Pixel 11 Pro.*

---

## 📖 Executive Summary

**PixelForge** is a modular Expo SDK 57 framework that exposes Google Pixel 11 Pro hardware (Tensor G6 CPU, PowerVR GPU, AICore/TPU, Android Keystore, 1-120 Hz LTPO display, HiLight, UWB, IMU and environmental sensors) as typed React hooks, with cloud Gemini for chat, vision and speech.

This document serves as the **canonical API Reference and Blueprint for AI agents (including the future Delta Bot)** and developers building on top of this framework.

---

## 🛠️ Android CLI & Tooling Integration

PixelForge integrates with Google's official **Android CLI** (`android.exe`).

### Installation
* **Windows**: `curl.exe -fsSL https://dl.google.com/android/cli/latest/windows_x86_64/install.cmd -o "%TEMP%\i.cmd" && "%TEMP%\i.cmd"`
* **macOS**: `curl -fsSL https://dl.google.com/android/cli/latest/darwin_arm64/install.sh | bash`
* **Linux**: `curl -fsSL https://dl.google.com/android/cli/latest/linux_x86_64/install.sh | bash`

### Project Describing (`android describe`)
Agents and tools can analyze project structure, build targets, and APK artifact outputs:
```bash
android describe --project_dir=<path>
```
* **Device Inspection**: `android layout` (JSON UI tree) & `android screen` (visual bounds & screenshots).
* **CLI Skills**: Built-in skill instructions available in `.agents/skills/android-cli/` and 26 official Expo skills (`.agents/skills/` via `npx skills add expo/skills` and `skills-lock.json`).

---

## 🏛️ Project Architecture

```text
pixel-delta/ (PixelForge Framework)
├── App.tsx                     # Main App Shell & 4-Tab Navigator (HUD, AI Lab, Sensors, Docs)
├── PIXELFORGE.md               # Canonical AI Reference & SDK Documentation
├── README.md                   # Developer Setup & Prerequisites
├── skills-lock.json            # Deterministic lockfile for installed agent skills
├── app.json                    # Android 15/16 Permissions & 120Hz LTPO Manifest
├── .agents/skills/             # Built-in Agent Skills
│   ├── android-cli/            # Google Android CLI skill (SDK, emulator, device inspection)
│   └── expo/skills             # 26 Expo skills (expo-router, expo-ui, expo-module, eas-*, etc.)
├── src/
│   ├── index.ts                # Master barrel export for all hooks and primitives
│   ├── core/
│   │   └── types.ts            # Strongly-typed telemetry, silicon, and AI models
│   │
│   ├── hardware/               # Physical Silicon & Hardware Abstractions
│   │   ├── useCPU.ts           # /proc/cpuinfo + cpufreq topology, frequencies, governor, load
│   │   ├── useGPU.ts           # PowerVR / Vulkan frame pacing (8.33ms budget) & dropped frames
│   │   ├── useMemory.ts        # LPDDR5X RAM usage, free memory & Low Memory Killer (LMK) protection
│   │   ├── useADPF.ts          # Android Dynamic Performance Framework (CPU/GPU headroom & thermals)
│   │   ├── useSensors.ts       # 6-Axis Motion (Gyro/Accel), Barometer/Altimeter, Compass, Light
│   │   ├── useHaptics.ts       # Linear Resonant Actuator tactile waveforms & mechanical ticks
│   │   ├── useCamera.ts        # Camera Looks tone-mapping, 120x AI Zoom & Ultra Low Light Video
│   │   ├── useHiLight.ts       # [Pixel Pro Exclusive] Rear camera bar notification LED ring
│   │   ├── useTorch.ts         # Hardware LED flashlight & emergency SOS strobe controller
│   │   ├── useDevice.ts        # Pixelsnap Qi2.2 25W charging, battery health & telemetry
│   │   ├── useDisplay.ts       # 3,600 nits 120Hz LTPO OLED display, screen wake lock & brightness
│   │   ├── useBiometrics.ts    # Ultrasonic fingerprint & face unlock (expo-local-authentication)
│   │   ├── useSecurity.ts      # SecureStore on the Android Keystore (StrongBox)
│   │   ├── useLocation.ts      # Multi-band GNSS satellite positioning, altitude & heading
│   │   ├── useNetwork.ts       # MediaTek M90 Wi-Fi 7, 5G Sub-6/mmWave & Satellite SOS
│   │   ├── useCapabilities.ts  # Device capability resolution (thermometer/HiLight/UWB/Nano tier/API level)
│   │   ├── useAudio.ts         # Multi-mic recording (expo-audio) & real-time dBFS metering
│   │   ├── useBLE.ts           # Bluetooth Low Energy scanner & RSSI proximity beacon client
│   │   ├── useNFC.ts           # Contactless NDEF / RFID tag reader & writer controller
│   │   ├── useTemperature.ts   # [Pixel 8-10 Pro] Infrared thermometer; absent on Pixel 11 Pro (estimated)
│   │   └── useUWB.ts           # [Pixel Pro] Ultra-Wideband spatial radar & Angle-of-Arrival
│   │
│   ├── ai/                     # Intelligence & Silicon Acceleration Layer
│   │   ├── useTPU.ts           # AICore / Gemini Nano stack detection (inference not wired yet)
│   │   ├── useSpeechAI.ts      # Voice speech-to-text recording & transcription pipeline
│   │   ├── useGemini.ts        # Multi-turn conversational chat, reasoning & token metrics
│   │   ├── useVisionAI.ts      # Multimodal camera capture & visual scene inspection
│   │   └── geminiClient.ts     # Google Gen AI client factory with encrypted key persistence
│   │
│   ├── theme/
│   │   ├── colors.ts           # Design tokens (Delta-aligned): field, accent, meaning colours, Geist type
│   │   └── mode.ts             # State → colour/label map for the reactor and status chip
│   │
│   ├── components/             # Reusable UI Primitives
│   │   ├── HapticButton.tsx    # Solid / outlined button with haptics
│   │   ├── MetricCard.tsx      # Panel tile with provenance tag
│   │   ├── SensorVisualizer.tsx# Centred 3-axis bars
│   │   └── Decor.tsx           # Scrims, wordmark, reactor, section labels, chips, telemetry rows
│   │
│   └── screens/
│       ├── DashboardScreen.tsx # Silicon & compute HUD (CPU, GPU, TPU, Memory, Temp, UWB)
│       ├── AILabScreen.tsx     # Gemini Chat, Vision Inspector, and Voice Speech-to-Text
│       ├── SensorsLabScreen.tsx# Interactive laboratory: Motion, Haptics, Radios (NFC/BLE), Audio
│       └── DocsScreen.tsx      # Interactive in-app API documentation & AI Primer viewer
```

---

## 🔌 Core Hardware & Silicon APIs

Import any hardware or AI hook from `./src`:
```typescript
import { 
  useCPU,
  useGPU,
  useTPU,
  useMemory,
  useHiLight,
  useCamera,
  useSpeechAI,
  useSensors, 
  useHaptics, 
  useGemini, 
  useVisionAI, 
  useDevice, 
  useADPF, 
  useBiometrics,
  useSecurity,
  useTemperature,
  useUWB,
  useBLE,
  useNFC,
  useNetwork,
  useAudio,
  useDisplay,
  useTorch,
  HapticButton, 
  MetricCard 
} from './src';
```

---

> **No mocks rule.** Every hook reads real device state through Expo modules or the local `PixelNative` module (`modules/pixel-native`). Values that cannot be read are `null` and each hook exposes `source: 'hardware' | 'derived' | 'simulated' | 'unavailable'` (see `src/core/observability.ts`). The only remaining simulations are NFC, BLE, UWB and HiLight, and they are labelled `simulated` in every surface.

### 1. `useCPU()` — Real CPU topology and load
`/proc/cpuinfo` part ids and cpufreq sysfs via PixelNative. On Pixel 11 Pro: `1x Arm C1-Ultra @ 4.11 GHz + 4x Arm C1-Pro @ 3.38 GHz + 2x Arm C1-Pro @ 2.65 GHz`, governor `sched_pixel`.
```typescript
const { coreTopology, cpuLoadPercent, appCpuPercent, cores, benchmarkCPU } = useCPU();
// cpuLoadPercent = cluster frequency utilisation (HW); appCpuPercent = this process (DERIVED); null until read
const ms = await benchmarkCPU(); // real JS single-thread prime sieve
```

---

### 2. `useGPU()` — GPU identity and Choreographer frame pacing
```typescript
const { gpuRenderer, measuredFps, frameRenderTimeMs, targetBudgetMs, isStuttering } = useGPU();
// gpuRenderer on Pixel 11 Pro: "ANGLE (Imagination Technologies, Vulkan 1.4.317 (PowerVR C-Series CXTP-48-1536 MC1)…"
if (isStuttering) console.warn(`avg frame ${frameRenderTimeMs} ms exceeds ${targetBudgetMs} ms`);
```

---

### 3. `useTPU()` — On-device AI stack detection
The TPU is reachable only through AICore (Gemini Nano via ML Kit) or LiteRT. Inference metrics are `null` until the `pixel-nano` module lands.
```typescript
const { aicoreInstalled, aicoreVersion, hasNpuFeature, benchmarkTPU } = useTPU();
// Pixel 11 Pro: AICore 0.release.prod_aicore_20260723.00_RC11
const r = await benchmarkTPU(); // real JS matmul, r.activeDelegate === 'CPU Fallback'
```

---

### 4. `useMemory()` — LPDDR5X System RAM & Low Memory Killer (LMK)
Tracks RAM allocation and provides cache purging utilities:
```typescript
const { totalRAMMB, usedRAMMB, freeRAMMB, isLowMemory, purgeCaches } = useMemory();
if (isLowMemory) {
  purgeCaches(); // Evicts volatile caches before Android LMK terminates the process
}
```

---

### 5. `useSpeechAI()` — Voice Speech-To-Text & Audio Transcription
Records voice input and passes audio directly to Gemini Multimodal Audio or edge speech pipelines:
```typescript
const { isListening, voiceDecibels, startListening, stopListeningAndTranscribe } = useSpeechAI();
await startListening();
// User speaks...
const result = await stopListeningAndTranscribe();
console.log(`Transcribed voice: "${result?.transcript}" (${result?.latencyMs}ms)`);
```

---

### 6. `useTemperature()` — [Pixel Pro Exclusive] Infrared Thermometer
Interfaces with the camera bar infrared thermopile sensor for non-contact object and liquid temperature sensing:
```typescript
const { reading, measureTemperature, setMaterialPreset } = useTemperature();
setMaterialPreset('liquid'); // 'liquid', 'organic', 'metal', 'glass'
const temp = await measureTemperature();
console.log(`Temperature: ${temp.celsius}°C (${temp.fahrenheit}°F)`);
```

---

### 7. `useUWB()` — [Pixel Pro Exclusive] Ultra-Wideband Spatial Radar
Centimeter-level spatial tracking and Angle-of-Arrival (AoA) localization:
```typescript
const { activeTargets, isRanging, startRanging } = useUWB();
await startRanging();
activeTargets.forEach(target => {
  console.log(`${target.deviceId}: ${target.distanceMeters}m at ${target.azimuthDegrees}° azimuth`);
});
```

---

### 8. `useBLE()` — Bluetooth Low Energy Beacon & Peripheral Discovery
Discovers nearby fitness bands, smart home peripherals, and BLE beacons with signal strength distance estimation:
```typescript
const { isScanning, peripherals, startScan } = useBLE();
await startScan();
peripherals.forEach(p => console.log(`${p.name}: ${p.rssi} dBm (~${p.estimatedDistanceMeters}m)`));
```

---

### 9. `useTorch()` — Rear LED Flashlight & SOS Strobe
Direct hardware flashlight control with emergency signaling:
```typescript
const { isTorchOn, toggleTorch, startStrobe, stopStrobe } = useTorch();
await toggleTorch();
startStrobe(100); // 100ms rapid strobe
```

---

### 10. `useSensors()` — 6-Axis IMU & Barometer Altimeter
```typescript
const { accelerometer, gyroscope, barometer } = useSensors(50);
console.log(`Altitude: ${barometer.relativeAltitude}m, Air Pressure: ${barometer.pressure} hPa`);
```

---

### 11. `useHaptics()` — Linear Resonant Actuator Tactile Feedback
```typescript
const { light, medium, heavy, success, warning, error } = useHaptics();
success(); // Dual pulse confirmation waveform
```

---

### 12. `useGemini()` & `useVisionAI()` — Conversational & Vision AI
```typescript
// Conversational AI
const { messages, sendMessage } = useGemini();
await sendMessage("Optimize sensor polling rate for battery longevity.");

// Camera Vision Inspection
const { captureAndAnalyze } = useVisionAI();
const visionResult = await captureAndAnalyze(true);
console.log(`Vision result: ${visionResult?.description}`);
```

---

## 🚀 Running on Your Pixel 11 Pro

1. Start the Expo development server:
   ```bash
   npm start
   ```
2. Open **Expo Go** on your Pixel 11 Pro.
3. Scan the terminal QR code.
4. Test the Silicon HUD, tactile haptics, CPU/GPU pacing, infrared thermometer, UWB radar, and Gemini voice lab live!

---

## 🤖 Instructions for AI Agents Building Apps

When an AI agent (such as Delta) builds an application on top of PixelForge:
1. **Import from `./src`**: Never re-implement hardware wrappers or sensors.
2. **Prioritize Tactile Haptics**: Always call `useHaptics()` on user interactions.
3. **Respect Thermal & Memory Headroom**: Query `useADPF()` and `useMemory()` before intensive workloads.
4. **Use Material 3 Colors**: Always style with `Colors.dark` from `./src/theme/colors` for OLED battery savings and true black contrast.

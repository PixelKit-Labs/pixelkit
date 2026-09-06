# PixelForge SDK ⚡
> **The Hardware & AI Framework for Google Pixel & Android**  
> *Engineered for high-performance mobile applications and AI-driven bots.*

---

## 📖 Executive Summary

**PixelForge** is a production-grade, modular framework and SDK designed to bridge Google Pixel hardware silicon (Multi-core CPU, GPU Vulkan pipeline, Tensor TPU, Titan M2 Security Enclave, 120Hz LTPO display, Infrared Thermometer, UWB Spatial Radar, and 6-axis sensors) with modern Generative AI capabilities (Google Gemini, Vision AI, Speech AI, and LiteRT).

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
* **CLI Skills**: Built-in skill instructions available in `.agents/skills/android-cli/`.

---

## 🏛️ Project Architecture

```text
pixel-delta/ (PixelForge Framework)
├── App.tsx                     # Main App Shell & 4-Tab Navigator (HUD, AI Lab, Sensors, Docs)
├── PIXELFORGE.md               # Canonical AI Reference & SDK Documentation
├── README.md                   # Developer Setup & Prerequisites
├── app.json                    # Android 15/16 Permissions & 120Hz LTPO Manifest
├── src/
│   ├── index.ts                # Master barrel export for all hooks and primitives
│   ├── core/
│   │   └── types.ts            # Strongly-typed telemetry, silicon, and AI models
│   │
│   ├── hardware/               # Physical Silicon & Hardware Abstractions
│   │   ├── useCPU.ts           # Tensor G6 7-Core cluster (4.11GHz C1-Ultra, C-1 Pro) on TSMC 2nm
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
│   │   ├── useBiometrics.ts    # Titan M3 in-display Fingerprint & Face Unlock auth
│   │   ├── useSecurity.ts      # Titan M3 Post-Quantum Cryptography (PQC) KeyStore
│   │   ├── useLocation.ts      # Multi-band GNSS satellite positioning, altitude & heading
│   │   ├── useAudio.ts         # Multi-mic array acoustic recording & real-time dBFS metering
│   │   ├── useBLE.ts           # Bluetooth Low Energy scanner & RSSI proximity beacon client
│   │   ├── useNFC.ts           # Contactless NDEF / RFID tag reader & writer controller
│   │   ├── useTemperature.ts   # [Pixel Pro] Infrared camera bar thermometer (legacy / ambient)
│   │   └── useUWB.ts           # [Pixel Pro] Ultra-Wideband spatial radar & Angle-of-Arrival
│   │
│   ├── ai/                     # Intelligence & Silicon Acceleration Layer
│   │   ├── useTPU.ts           # Google Tensor TPU hardware accelerator & latency benchmarker
│   │   ├── useSpeechAI.ts      # Voice speech-to-text recording & transcription pipeline
│   │   ├── useGemini.ts        # Multi-turn conversational chat, reasoning & token metrics
│   │   ├── useVisionAI.ts      # Multimodal camera capture & visual scene inspection
│   │   └── geminiClient.ts     # Google Gen AI client factory with encrypted key persistence
│   │
│   ├── theme/
│   │   └── colors.ts           # Material 3 Expressive & Pure OLED Black tokens
│   │
│   ├── components/             # Reusable UI Primitives
│   │   ├── HapticButton.tsx    # Tactile touch button with haptic feedback
│   │   ├── MetricCard.tsx      # Real-time hardware telemetry display card
│   │   └── SensorVisualizer.tsx# Live 3-axis motion visualizer
│   │
│   └── screens/
│       ├── DashboardScreen.tsx # Silicon & compute HUD (CPU, GPU, TPU, Memory, Temp, UWB)
│       ├── AILabScreen.tsx     # Gemini Chat, Vision Inspector, and Voice Speech-to-Text
│       └── SensorsLabScreen.tsx# Interactive laboratory: Motion, Haptics, Radios (NFC/BLE), Audio
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
  useSpeechAI,
  useSensors, 
  useHaptics, 
  useGemini, 
  useVisionAI, 
  useDevice, 
  useADPF, 
  useBiometrics,
  useTemperature,
  useUWB,
  useBLE,
  useNFC,
  useTorch,
  HapticButton, 
  MetricCard 
} from './src';
```

---

### 1. `useCPU()` — Multi-Core Cluster Telemetry
Inspects the Google Tensor CPU cluster (Prime, Performance, and Efficiency cores) and runs multi-threaded compute factorization benchmarks:
```typescript
const { coreTopology, coreCount, cpuLoadPercent, benchmarkCPU } = useCPU();
const durationMs = await benchmarkCPU();
console.log(`Factorization benchmark completed in ${durationMs}ms`);
```

---

### 2. `useGPU()` — Vulkan Graphics & 120 FPS Pacing
Monitors frame render times against the **8.33ms (120 FPS)** budget:
```typescript
const { gpuRenderer, frameRenderTimeMs, droppedFrameCount, isStuttering } = useGPU();
if (isStuttering) {
  console.warn(`Frame render took ${frameRenderTimeMs}ms (exceeds 8.33ms budget)`);
}
```

---

### 3. `useTPU()` — Google Tensor Neural Processing Unit
Direct hardware acceleration for on-device machine learning:
```typescript
const { activeDelegate, lastInferenceLatencyMs, throughputTokensPerSec, benchmarkTPU } = useTPU();
await benchmarkTPU();
console.log(`TPU Latency: ${lastInferenceLatencyMs} ms (${throughputTokensPerSec} tokens/sec)`);
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

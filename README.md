# PixelForge SDK ⚡
> **The Hardware & AI Framework for Google Pixel & Android**  
> *Engineered for high-performance mobile applications and AI-driven bots.*

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-black?style=flat-square&logo=expo)](https://docs.expo.dev/versions/v57.0.0/)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![Android Version](https://img.shields.io/badge/Android-15%20%2F%2016-3DDC84?style=flat-square&logo=android)](https://developer.android.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Tensor TPU](https://img.shields.io/badge/Hardware-Tensor%20TPU-00E5FF?style=flat-square)](https://developers.google.com/tensor)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

---

## 📖 Overview

**PixelForge** is a modular framework and developer SDK designed specifically to unlock 100% of the hardware silicon and on-device machine learning capabilities of the **Google Pixel 11 Pro** (and modern Android devices). 

Instead of dealing with fragmented low-level Android APIs or complex native bridges, PixelForge abstracts the phone's physical hardware into typed, reusable **React hooks** with integrated tactile haptics, thermal headroom management, and multimodal Gemini AI intelligence.

It is structured as a foundation for developers and autonomous AI agents (such as the upcoming **Delta Bot**) to build, test, and ship mobile experiences rapidly.

---

## 🚀 Hardware & Silicon Feature Matrix

| Subsystem | Developer Hook | Physical Hardware Mapped |
| :--- | :--- | :--- |
| **Multi-Core CPU** | `useCPU()` | Cortex-X925 Prime, Performance & Efficiency clusters, compute benchmarks, governors |
| **GPU & Vulkan** | `useGPU()` | Vulkan 1.3 / OpenGL ES 3.2, 120 FPS frame pacing (<= 8.33ms budget), dropped frames |
| **Tensor TPU / NPU** | `useTPU()` | Google Tensor TPU silicon, NNAPI delegates, latency benchmarks (ms), token throughput |
| **LPDDR5X RAM** | `useMemory()` | Physical RAM allocation, free memory telemetry, Low Memory Killer (LMK) protection |
| **Dynamic Thermals** | `useADPF()` | Android Dynamic Performance Framework, CPU/GPU thermal headroom, power budgeting |
| **Motion & Atmosphere**| `useSensors()` | 6-Axis IMU (Gyro/Accel), Barometer (hypsometric altimeter), Magnetometer, Light |
| **Tactile Haptics** | `useHaptics()` | Linear Resonant Actuator (LRA) mechanical ticks, impacts, and notification waveforms |
| **Camera & Vision** | `useVisionAI()` | Ultra HDR camera capture, gallery picker, and Gemini Multimodal scene analysis |
| **Voice & Speech** | `useSpeechAI()` | Multi-mic voice recording, decibel metering, and Speech-to-Text transcription |
| **Conversational AI** | `useGemini()` | Multi-turn reasoning, streaming chat, token telemetry, Titan M2 key storage |
| **IR Thermometer** | `useTemperature()` | **[Pixel Pro Exclusive]** Camera bar infrared thermopile non-contact temperature sensor |
| **Spatial Radar** | `useUWB()` | **[Pixel Pro Exclusive]** Ultra-Wideband transceiver for centimeter-level AoA tracking |
| **Contactless NFC** | `useNFC()` | NFC radio controller, NDEF smart tag reader/writer, and simulation runner |
| **Bluetooth Low Energy**| `useBLE()` | BLE beacon & peripheral scanner with RSSI signal strength distance estimation |
| **Flashlight / Torch** | `useTorch()` | Rear dual-LED hardware flashlight toggle and high-frequency SOS strobe |
| **Display & Refresh** | `useDisplay()` | 120Hz LTPO display detection, screen wake-lock persistence, hardware brightness |
| **Biometrics** | `useBiometrics()` | Titan M2-backed under-display Fingerprint and Class 3 Face Unlock authentication |
| **Hardware Keystore** | `useSecurity()` | StrongBox hardware-backed cryptographic key generation and secret persistence |
| **Satellite GNSS** | `useLocation()` | Multi-band dual-frequency GPS receiver, speed, altitude, and compass heading |

---

## 📋 Prerequisites

Ensure your development workstation has:

### 1. Node.js
* Version **20.x** or higher (tested on Node 24).
* Verify: `node -v`

### 2. Official Google Android CLI (`android.exe`)
The official Google Android CLI provides tools to manage SDK components, inspect device layouts, capture screenshots, and generate descriptive project metadata.

#### Installation:
* **Windows (PowerShell / CMD)**:
  ```cmd
  curl.exe -fsSL https://dl.google.com/android/cli/latest/windows_x86_64/install.cmd -o "%TEMP%\i.cmd" && "%TEMP%\i.cmd"
  ```
* **macOS (Apple Silicon)**:
  ```bash
  curl -fsSL https://dl.google.com/android/cli/latest/darwin_arm64/install.sh | bash
  ```
* **Linux (x86_64)**:
  ```bash
  curl -fsSL https://dl.google.com/android/cli/latest/linux_x86_64/install.sh | bash
  ```
* Verify: `android --help`

---

## 🛠️ Android CLI & Project Describing (`android describe`)

PixelForge integrates directly with `android describe`:

```bash
# Analyze project structure and generate JSON metadata for build targets and APK outputs
android describe --project_dir=.
```

### Essential Android CLI Commands:
* `android describe`: Generates descriptive metadata JSON files detailing build targets, APK locations, and artifact outputs.
* `android layout`: Dumps the JSON UI layout tree of a connected Pixel device or emulator.
* `android screen`: Inspects UI elements, bounds, and takes screenshots of connected devices.
* `android sdk list --all`: Lists available and installed Android SDK packages.
* `android emulator`: Manages and launches Android Virtual Devices.
* `android skills`: Manages agent skills (official `android-cli` skill located in `.agents/skills/android-cli/`).

---

## 🏛️ Project Structure

```text
Pixel delta/ (PixelForge Framework)
├── App.tsx                     # Main App Shell & 3-Tab Navigator (HUD, AI Lab, Sensors)
├── PIXELFORGE.md               # Canonical AI Reference & Prompt Manual
├── README.md                   # Complete Developer Reference & Quickstart
├── AGENTS.md                   # Antigravity agent guidelines & Android CLI rules
├── GEMINI.md                   # Agent guidelines mirror
├── app.json                    # Android 15/16 Permissions & 120Hz LTPO Manifest
├── package.json                # Dependencies: Expo 57, React 19, @google/genai
│
├── .agents/skills/             # Built-in Antigravity Agent Skills
│   └── android-cli/            # Google Android CLI skill (SDK, emulator, device inspection)
│
├── src/
│   ├── index.ts                # Master barrel export for all hooks and UI primitives
│   ├── core/
│   │   └── types.ts            # Strongly-typed telemetry, silicon, and AI interfaces
│   │
│   ├── hardware/               # Physical Silicon & Hardware Abstractions
│   │   ├── useCPU.ts           # Multi-core cluster (Prime/Perf/Eff), load & benchmarks
│   │   ├── useGPU.ts           # Vulkan 120 FPS frame pacing (<= 8.33ms budget) & dropped frames
│   │   ├── useMemory.ts        # LPDDR5X RAM usage, free memory & LMK protection
│   │   ├── useADPF.ts          # Android Dynamic Performance Framework (Headroom/Thermal)
│   │   ├── useSensors.ts       # 6-Axis Motion (Gyro/Accel), Barometer/Altimeter, Compass, Light
│   │   ├── useHaptics.ts       # Linear Resonant Actuator tactile waveforms & mechanical ticks
│   │   ├── useTorch.ts         # Rear dual-LED flashlight & emergency SOS strobe
│   │   ├── useDevice.ts        # Battery health, thermals, charging state & model telemetry
│   │   ├── useDisplay.ts       # 120Hz LTPO display, screen wake lock & brightness
│   │   ├── useBiometrics.ts    # Titan M2 in-display Fingerprint & Face Unlock auth
│   │   ├── useSecurity.ts      # Hardware-backed Titan M2 SecureStore key storage
│   │   ├── useLocation.ts      # Multi-band GNSS positioning, altitude & heading
│   │   ├── useAudio.ts         # Multi-mic array recording & real-time dBFS metering
│   │   ├── useBLE.ts           # Bluetooth Low Energy scanner & RSSI proximity client
│   │   ├── useNFC.ts           # Contactless NDEF / RFID tag reader & writer controller
│   │   ├── useTemperature.ts   # [Pixel Pro] Infrared camera bar thermometer sensor
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
│   │   ├── HapticButton.tsx    # Tactile touch button with built-in haptic feedback
│   │   ├── MetricCard.tsx      # Real-time hardware telemetry display card
│   │   └── SensorVisualizer.tsx# Live 3-axis motion visualizer
│   │
│   └── screens/
│       ├── DashboardScreen.tsx # Silicon & compute HUD (CPU, GPU, TPU, Memory, Temp, UWB)
│       ├── AILabScreen.tsx     # Gemini Chat, Vision Inspector, and Voice Speech-to-Text
│       ├── SensorsLabScreen.tsx# Interactive laboratory: Motion, Haptics, Radios (NFC/BLE), Audio
│       └── DocsScreen.tsx      # Interactive in-app API documentation & AI Primer viewer
```

---

## ⚡ Quick Start (Running on Your Pixel 11 Pro)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Verify TypeScript compilation**:
   ```bash
   npx tsc --noEmit
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Launch on your phone**:
   * Install the **Expo Go** app from Google Play on your Pixel 11 Pro.
   * Scan the terminal QR code with your camera.
   * The app will compile and launch on your phone over Wi-Fi with hot reloading!

---

## 💡 How to Build With PixelForge

All hooks and UI components are available from a single import:

```typescript
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
  useTorch,
  HapticButton, 
  MetricCard 
} from './src';

export default function MyPixelTool() {
  const { light, success } = useHaptics();
  const { currentFps } = useGPU();
  const { celsius } = useTemperature().reading;

  return (
    <MetricCard
      title="Surface Temperature"
      value={celsius}
      unit="°C"
      badge={`${currentFps} FPS`}
    />
  );
}
```

---

## 🤖 AI Agent Blueprint & Documentation

If you or an AI assistant is building a new application or feature on PixelForge:
* Read **[docs/AI_PRIMER.md](./docs/AI_PRIMER.md)** for the AI Agent Guidance Primer, 5 Golden Rules, and system prompt directive.
* Consult **[docs/HARDWARE_API.md](./docs/HARDWARE_API.md)** for exhaustive technical specifications across all 22 silicon and AI modules.
* Review **[PIXELFORGE.md](./PIXELFORGE.md)** as your canonical API guide and prompt instructions.
* Consult **[AGENTS.md](./AGENTS.md)** for Android CLI and project describing guidelines.
* Refer to **[`.agents/skills/android-cli/SKILL.md`](./.agents/skills/android-cli/SKILL.md)** for device control and emulator commands.
* Explore the live on-device documentation in the **Docs** tab of the PixelForge app.


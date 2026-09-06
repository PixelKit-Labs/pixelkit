# PixelForge SDK ⚡
> **The Hardware & AI Framework for Google Pixel & Android**  
> *Engineered for high-performance mobile applications and autonomous AI agents.*

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-black?style=flat-square&logo=expo)](https://docs.expo.dev/versions/v57.0.0/)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![Android Version](https://img.shields.io/badge/Android-15%20%2F%2016%20%2F%2017-3DDC84?style=flat-square&logo=android)](https://developer.android.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Tensor TPU](https://img.shields.io/badge/Hardware-Tensor%20TPU-00E5FF?style=flat-square)](https://developers.google.com/tensor)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

---

## 📖 Overview

**PixelForge** is a modular framework and developer SDK designed specifically to unlock 100% of the hardware silicon and on-device machine learning capabilities of the **Google Pixel 11 Pro** (and modern Android devices). 

Instead of dealing with fragmented low-level Android APIs or complex native bridges, PixelForge abstracts the phone's physical hardware into 24 typed, reusable **React hooks** with integrated tactile haptics, thermal headroom management, and multimodal Gemini AI intelligence.

It is structured as an authoritative foundation for developers and autonomous AI coding agents (including the upcoming **Delta Bot**) to build, test, and ship mobile experiences rapidly.

---

## 🚀 Hardware & Silicon Feature Matrix

| Subsystem | Developer Hook | Physical Hardware Mapped |
| :--- | :--- | :--- |
| **Tensor G6 CPU** | `useCPU()` | 7-Core cluster (1x C1-Ultra @ 4.11GHz, 4x C-1 Pro, 2x C-1 Pro) on TSMC 2nm (N2) |
| **PowerVR GPU** | `useGPU()` | Vulkan 1.3 / OpenGL ES 3.2, 120 FPS frame pacing (<= 8.33ms budget), dropped frames |
| **Tensor TPU / NPU** | `useTPU()` | Google Tensor TPU silicon (+50% compute), NNAPI/LiteRT delegates, latency benchmarks |
| **LPDDR5X RAM** | `useMemory()` | Up to 16 GB physical RAM allocation, free memory telemetry, LMK protection |
| **Dynamic Thermals** | `useADPF()` | Android Dynamic Performance Framework, CPU/GPU thermal headroom, power budgeting |
| **HiLight LED Ring** | `useHiLight()` | **[Pixel 11 Pro Exclusive]** Camera bar multi-color notification & Gemini AI status ring |
| **Motion & Atmosphere**| `useSensors()` | 6-Axis IMU (Gyro/Accel), Barometer (hypsometric altimeter), Magnetometer, Light |
| **Tactile Haptics** | `useHaptics()` | Linear Resonant Actuator (LRA) mechanical ticks, impacts, and notification waveforms |
| **Camera & Looks** | `useCamera()` | 120x Generative AI Zoom, Camera Looks tone-mapping & Ultra Low Light Video |
| **Multimodal Vision** | `useVisionAI()` | Ultra HDR camera capture, gallery picker, and Gemini Multimodal scene analysis |
| **Voice & Speech** | `useSpeechAI()` | Multi-mic voice recording, decibel metering, and Speech-to-Text transcription |
| **Conversational AI** | `useGemini()` | Multi-turn reasoning, streaming chat, token telemetry, Titan M3 quantum key vault |
| **Spatial Radar** | `useUWB()` | **[Pixel Pro Exclusive]** Ultra-Wideband transceiver for centimeter-level AoA tracking |
| **IR Thermometer** | `useTemperature()` | **[Pixel Pro Exclusive]** Infrared thermopile sensor (legacy / ambient estimation) |
| **Contactless NFC** | `useNFC()` | NFC radio controller, NDEF smart tag reader/writer, and simulation runner |
| **Bluetooth Low Energy**| `useBLE()` | BLE beacon & peripheral scanner with RSSI signal strength distance estimation |
| **Flashlight / Torch** | `useTorch()` | Rear dual-LED hardware flashlight toggle and high-frequency SOS strobe |
| **Super Actua Display**| `useDisplay()` | 3,600 nits 120Hz LTPO display detection, screen wake-lock persistence, brightness |
| **Biometrics** | `useBiometrics()` | Titan M3-backed under-display Fingerprint and Class 3 Face Unlock authentication |
| **Quantum Keystore** | `useSecurity()` | Titan M3 Post-Quantum Cryptography (PQC) hardware-backed encrypted secret vault |
| **Satellite & Modem** | `useNetwork()` | MediaTek M90 modem, Wi-Fi 7, 5G Sub-6/mmWave, and Satellite SOS connectivity |
| **Satellite GNSS** | `useLocation()` | Multi-band dual-frequency L1/L5 GPS receiver, speed, altitude, and compass heading |
| **Pixelsnap & Power** | `useDevice()` | Pixelsnap Qi2.2 25W magnetic wireless charging, battery health, and PMIC telemetry |
| **Studio Mic Array** | `useAudio()` | Quad-mic beamforming acoustic recording & real-time dBFS sound pressure metering |

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
├── App.tsx                     # Main App Shell & 4-Tab Navigator (HUD, AI Lab, Sensors, Docs)
├── PIXELFORGE.md               # Canonical AI Reference & Prompt Manual
├── README.md                   # Complete Developer Reference & Quickstart
├── AGENTS.md                   # Antigravity agent guidelines & Android CLI rules
├── CLAUDE.md                   # Claude agent guidelines mirror & mandatory doc sync rule
├── GEMINI.md                   # Gemini agent guidelines mirror & mandatory doc sync rule
├── app.json                    # Android 15/16/17 Permissions & 120Hz LTPO Manifest
├── package.json                # Dependencies: Expo 57, React 19, React Native 0.86, @google/genai
│
├── .agents/skills/             # Built-in Agent Skills
│   └── android-cli/            # Google Android CLI skill (SDK, emulator, device inspection)
│
├── docs/                       # Comprehensive Modular Documentation Suite
│   ├── README.md               # Documentation portal & sitemap
│   ├── HARDWARE_API.md         # Consolidated 24-module hardware reference manual
│   ├── AI_PRIMER.md            # Consolidated AI operational manual & 5 Golden Rules
│   ├── getting-started/        # Quickstart & silicon architecture guides
│   ├── api/                    # Modular API references by subsystem (silicon, pro, ai, etc.)
│   ├── ai-guidance/            # AI agent primer and production recipes
│   ├── guides/                 # On-device Gemini Nano, Function Calling, Voice, Diagnostics
│   └── research/               # Ground-truth Pixel 11 Pro hardware research & deep dives
│
├── src/
│   ├── index.ts                # Master barrel export for all hooks and UI primitives
│   ├── core/
│   │   └── types.ts            # Strongly-typed telemetry, silicon, and AI interfaces
│   │
│   ├── hardware/               # Physical Silicon & Hardware Abstractions (15 hooks)
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
│   │   ├── useNetwork.ts       # MediaTek M90 Wi-Fi 7, 5G Sub-6/mmWave & Satellite SOS
│   │   ├── useAudio.ts         # Multi-mic array acoustic recording & real-time dBFS metering
│   │   ├── useBLE.ts           # Bluetooth Low Energy scanner & RSSI proximity beacon client
│   │   ├── useNFC.ts           # Contactless NDEF / RFID tag reader & writer controller
│   │   ├── useTemperature.ts   # [Pixel Pro] Infrared camera bar thermometer (legacy / ambient)
│   │   └── useUWB.ts           # [Pixel Pro] Ultra-Wideband spatial radar & Angle-of-Arrival
│   │
│   ├── ai/                     # Intelligence & Silicon Acceleration Layer (4 hooks + client)
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
│       └── DocsScreen.tsx      # Interactive on-device API documentation & AI Primer viewer
```

---

## ⚡ Quick Start (Running on Your Pixel 11 Pro)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Verify TypeScript compilation**:
   ```bash
   npm run typecheck
   ```
   *Should exit with 0 errors.*

3. **Verify Metro Hermes bytecode export**:
   ```bash
   npx expo export -p android
   ```
   *Compiles all 696 modules to optimized Hermes bytecode (`.hbc`).*

4. **Start the development server**:
   ```bash
   npm start
   ```

5. **Launch on your phone**:
   * Install the **Expo Go** app from Google Play on your Pixel 11 Pro.
   * Scan the terminal QR code with your camera.
   * The app will compile and launch on your phone over Wi-Fi with hot reloading!

---

## 💡 How to Build With PixelForge

All hooks and UI components are available from a single centralized import:

```typescript
import { 
  useCPU,
  useGPU,
  useTPU,
  useMemory,
  useHiLight,
  useCamera,
  useSensors, 
  useHaptics, 
  useSpeechAI,
  useGemini, 
  useVisionAI, 
  useTemperature,
  useUWB,
  useSecurity,
  useDevice,
  HapticButton, 
  MetricCard 
} from './src';

export default function MyPixelTool() {
  const { light, success } = useHaptics();
  const { currentFps } = useGPU();
  const { celsius } = useTemperature().reading;
  const hilight = useHiLight();

  const handleAction = async () => {
    await light();
    hilight.triggerGeminiPulse(3000);
    await success();
  };

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

## 📚 Comprehensive Documentation Suite

PixelForge features an exhaustive, multi-tier documentation system kept in continuous synchronization with the codebase:

### 🧭 [Documentation Hub (docs/README.md)](./docs/README.md)
The central sitemap and entry portal for all developer guides and reference manuals.

### 🚀 Getting Started
* **[Quickstart Guide](./docs/getting-started/quickstart.md)**: Workstation prerequisites, Android CLI setup, and launching on physical Pixel devices.
* **[Silicon Architecture](./docs/getting-started/architecture.md)**: Deep dive into Tensor G6 7-core 2nm, PowerVR GPU, Titan M3 PQC, and Pixelsnap Qi2.2 magnetic charging.

### 📚 API Reference (By Subsystem)
* **[Silicon & Compute](./docs/api/silicon-compute.md)**: `useCPU`, `useGPU`, `useTPU`, `useMemory`, `useADPF`.
* **[Pixel Pro Exclusives](./docs/api/pro-exclusives.md)**: `useHiLight`, `useUWB`, `useTemperature`.
* **[Neural & AI](./docs/api/neural-ai.md)**: `useGemini`, `useSpeechAI`, `useVisionAI`, `geminiClient`.
* **[Sensors & Actuators](./docs/api/sensors-actuators.md)**: `useSensors`, `useCamera`, `useTorch`, `useHaptics`.
* **[Radios & Security](./docs/api/radios-security.md)**: `useBiometrics`, `useSecurity`, `useBLE`, `useNFC`, `useLocation`.
* **[System & Media](./docs/api/system-media.md)**: `useAudio`, `useDisplay`, `useDevice`, `useNetwork`.

### 🤖 AI Agent Guidance & Primers
* **[Agent Operational Primer](./docs/ai-guidance/agent-primer.md)**: Foundational laws for autonomous coding agents, the 5 Golden Rules of PixelForge, and copy-paste system prompts.
* **[Production Recipes](./docs/ai-guidance/recipes.md)**: Copy-pasteable recipes for voice agent loops, multimodal scene reasoning, HiLight visual signaling, and spatial tracking.

### 🛠️ Production Guides & Diagnostics
* **[Built-in AI, Function Calling & Voice Hub](./docs/guides/README.md)**: Hybrid decision tree (Gemini Nano 4 on-device vs Gemini cloud) and build prerequisites.
* **[On-Device AI with Gemini Nano](./docs/guides/on-device-ai-gemini-nano.md)**: ML Kit GenAI Prompt API, local Expo Module, structured output, and thinking mode.
* **[Function Calling & Hardware Tools](./docs/guides/function-calling.md)**: Unified tool registry for cloud Gemini, Gemini Nano, and Android AppFunctions.
* **[Voice: Speech In, Speech Out, Live Agents](./docs/guides/voice.md)**: On-device streaming STT, Gemini Live API bidirectional agents, and audio haptics.
* **[Troubleshooting & Diagnostics](./docs/guides/troubleshooting.md)**: Expo SDK 57 nuances, KeepAwake tags, StatusBar styling, and thermal throttling mitigations.

### 🔬 Research & Deep Dives
* **[Pixel 11 Pro Hardware Research](./docs/research/PIXEL_11_PRO_HARDWARE_RESEARCH.md)**: Ground-truth spec sheet, Android 17 (API 37) surfaces, and SDK gap analysis.
* **[Pixel 11 Pro Deep Dive (Round 2)](./docs/research/PIXEL_11_PRO_DEEP_DIVE.md)**: Corrections, Android 16/17 APIs (`RangingManager`, ADPF headroom, ARR), and store deadlines.

### 📑 Consolidated Single-File Manuals
* **[HARDWARE_API.md](./docs/HARDWARE_API.md)**: Complete 24-module hardware and AI API manual in a single file.
* **[AI_PRIMER.md](./docs/AI_PRIMER.md)**: Complete AI agent operational manual in a single file.

### 📱 In-App Documentation Viewer
Browse live documentation, interactive copyable TypeScript snippets, and AI tips on the device itself via the **Docs** tab (`DocsScreen.tsx`).



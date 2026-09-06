# PixelKit SDK ⚡
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

**PixelKit** is a modular framework and developer SDK designed specifically to unlock 100% of the hardware silicon and on-device machine learning capabilities of the **Google Pixel 11 Pro** (and modern Android devices). 

Instead of dealing with fragmented low-level Android APIs or complex native bridges, PixelKit abstracts the phone's physical hardware into 24 typed, reusable **React hooks** with integrated tactile haptics, thermal headroom management, and multimodal Gemini AI intelligence.

It is structured as an authoritative foundation for developers and autonomous AI coding agents (including the upcoming **Delta Bot**) to build, test, and ship mobile experiences rapidly.

---

## 🚀 Hardware & Silicon Feature Matrix

| Subsystem | Developer Hook | Physical Hardware Mapped |
| :--- | :--- | :--- |
| **Tensor G6 CPU** | `useCPU()` | Real topology from /proc/cpuinfo + cpufreq (1x C1-Ultra 4.11 GHz, 4x C1-Pro 3.38 GHz, 2x C1-Pro 2.65 GHz), per-core MHz, governor, frequency utilisation, app CPU share |
| **PowerVR GPU** | `useGPU()` | EGL renderer string (PowerVR CXTP-48-1536, Vulkan 1.4), Choreographer frame pacing: presented FPS, avg/max frame interval, jank |
| **Tensor TPU / NPU** | `useTPU()` | AICore / Private Compute Services detection (Gemini Nano host), NPU feature flag; inference itself is `useGeminiNano()` |
| **LPDDR5X RAM** | `useMemory()` | ActivityManager total/available/LMK threshold, Java + native heaps, GC request |
| **Dynamic Thermals** | `useADPF()` | PowerManager thermal headroom + status listener, thresholds, Android 16+ SystemHealth CPU/GPU headroom, display target vs measured FPS |
| **HiLight LED Ring** | `useHiLight()` | **[Pixel 11 Pro Exclusive]** Eight-LED camera-bar array; real LEDs via native ADB daemon (`npm run hilight:daemon`), on-screen mirror when untethered |
| **Motion & Atmosphere**| `useSensors()` | 6-Axis IMU (Gyro/Accel), Barometer (hypsometric altimeter), Magnetometer, Light |
| **Tactile Haptics** | `useHaptics()` | LRA patterns plus Android 16 envelope effects (PWLE v2, 134.4 Hz resonance) and primitive compositions |
| **Camera & Looks** | `useCamera()` | expo-camera lens, zoom, flash and permission state; Camera Looks kept as UI state (Pixel Camera app feature) |
| **Multimodal Vision** | `useVisionAI()` | Ultra HDR camera capture, gallery picker, and Gemini Multimodal scene analysis |
| **Voice & Speech** | `useSpeechAI()` | Multi-mic voice recording, decibel metering, and Speech-to-Text transcription |
| **Conversational AI** | `useGemini()` | Multi-turn chat on gemini-3.8-flash via ai.chats, API token counts, key in SecureStore; no simulated replies |
| **On-device Gemini Nano** | `useGeminiNano()` | ML Kit GenAI Prompt API on AICore via `modules/pixel-nano`: status, model name, token limit, streaming tokens, measured latency and decode rate; no cloud fallback |
| **Spatial Radar** | `useUWB()` | **[Pixel Pro Exclusive]** Ultra-Wideband chip status (READY, default) & AoA; hardware verified, ranging simulated until RangingManager |
| **Device Capabilities** | `useCapabilities()` | Resolves what this Pixel physically has (HiLight, UWB, Titan M3, Gemini Nano tier) and which Android 16/17 APIs exist |
| **Contactless NFC** | `useNFC()` | Physical NFC controller, antenna state, Android 15+ Observe Mode, and NDEF smart tag reader |
| **Bluetooth Low Energy**| `useBLE()` | Physical Bluetooth adapter, Channel Sounding verification, paired/bonded devices, and BLE scanner |
| **Hardware Radios** | `useRadios()` | Unified hardware radio subsystem telemetry (NFC, BLE, UWB, Wi-Fi RTT, Satellite) from Android system services |
| **Flashlight / Torch** | `useTorch()` | CameraManager torch with 21 brightness levels (Android 13+), system torch callback, SOS strobe |
| **Super Actua Display**| `useDisplay()` | Live refresh rate + ARR support, 1-120 Hz mode list, HDR types, preferred-rate control, wake lock, brightness |
| **Biometrics** | `useBiometrics()` | Titan M3-backed under-display Fingerprint and Class 3 Face Unlock authentication |
| **Secure Storage** | `useSecurity()` | expo-secure-store on the Android Keystore (StrongBox present on Pixel 11 Pro); classical AES, no post-quantum claims |
| **Satellite & Modem** | `useNetwork()` | MediaTek M90 modem, Wi-Fi 7, 5G Sub-6/mmWave, and Satellite SOS connectivity |
| **Satellite GNSS** | `useLocation()` | Multi-band dual-frequency L1/L5 GPS receiver, speed, altitude, and compass heading |
| **Pixelsnap & Power** | `useDevice()` | Pixelsnap Qi2.2 25W magnetic wireless charging, battery health, and PMIC telemetry |
| **Studio Mic Array** | `useAudio()` | Multi-mic recording via `expo-audio` (16 kHz mono, `voice_recognition` source) & real-time dBFS metering |

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

PixelKit integrates directly with `android describe`:

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
Pixel delta/ (PixelKit Framework)
├── App.tsx                     # Main App Shell & 4-Tab Navigator (HUD, AI Lab, Sensors, Docs)
├── PIXELKIT.md                 # Canonical AI Reference & Prompt Manual
├── README.md                   # Complete Developer Reference & Quickstart
├── AGENTS.md                   # Antigravity agent guidelines & Android CLI rules
├── CLAUDE.md                   # Claude agent guidelines mirror & mandatory doc sync rule
├── GEMINI.md                   # Gemini agent guidelines mirror & mandatory doc sync rule
├── app.json                    # Android 15/16/17 Permissions & 120Hz LTPO Manifest
├── package.json                # Dependencies: Expo 57, React 19, React Native 0.86, @google/genai
├── skills-lock.json            # Deterministic lockfile for installed agent skills
│
├── .agents/skills/             # Built-in Agent Skills
│   ├── android-cli/            # Google Android CLI skill (SDK, emulator, device inspection)
│   └── expo/skills             # 26 Official Expo agent skills (expo-router, expo-ui, eas-*, etc.)
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
├── modules/
│   ├── pixel-native/           # Local Expo Module (Kotlin): CPU, memory, thermal, display, GPU, torch, haptics
│   └── pixel-nano/             # Local Expo Module (Kotlin): Gemini Nano via ML Kit GenAI Prompt API (AICore)
│
├── src/
│   ├── index.ts                # Master barrel export for all hooks and UI primitives
│   ├── core/
│   │   ├── types.ts            # Strongly-typed telemetry, silicon, and AI interfaces
│   │   ├── capabilities.ts     # Pure device capability resolver + PackageManager verification
│   │   └── observability.ts    # Telemetry provenance (hardware/derived/simulated/unavailable), event log
│   │
│   ├── hardware/               # Physical Silicon & Hardware Abstractions (15 hooks)
│   │   ├── useCPU.ts           # Tensor G6 7-Core cluster (4.11GHz C1-Ultra, C-1 Pro) on TSMC 2nm
│   │   ├── useGPU.ts           # PowerVR / Vulkan frame pacing (8.33ms budget) & dropped frames
│   │   ├── useMemory.ts        # LPDDR5X RAM usage, free memory & Low Memory Killer (LMK) protection
│   │   ├── useADPF.ts          # Android Dynamic Performance Framework (CPU/GPU headroom & thermals)
│   │   ├── useSensors.ts       # 6-Axis Motion (Gyro/Accel), Barometer/Altimeter, Compass, Light
│   │   ├── useHaptics.ts       # Linear Resonant Actuator tactile waveforms & mechanical ticks
│   │   ├── useCamera.ts        # expo-camera zoom, flash, lens; Look label as UI state
│   │   ├── useHiLight.ts       # [Pixel Pro Exclusive] Rear camera bar notification LED ring
│   │   ├── useTorch.ts         # Hardware LED flashlight & emergency SOS strobe controller
│   │   ├── useDevice.ts        # Pixelsnap Qi2.2 25W charging, battery health & telemetry
│   │   ├── useDisplay.ts       # 3,600 nits 120Hz LTPO OLED display, screen wake lock & brightness
│   │   ├── useBiometrics.ts    # Titan M3 in-display Fingerprint & Face Unlock auth
│   │   ├── useSecurity.ts      # SecureStore on the Android Keystore (StrongBox)
│   │   ├── useLocation.ts      # Multi-band GNSS satellite positioning, altitude & heading
│   │   ├── useNetwork.ts       # MediaTek M90 Wi-Fi 7, 5G Sub-6/mmWave & Satellite SOS
│   │   ├── useCapabilities.ts  # Device capability resolution (what this Pixel really has)
│   │   ├── useAudio.ts         # Multi-mic recording (expo-audio) & real-time dBFS metering
│   │   ├── useBLE.ts           # Bluetooth Low Energy adapter, channel sounding & bonded devices
│   │   ├── useNFC.ts           # Contactless NFC adapter, antenna state & NDEF tag reader
│   │   ├── useRadios.ts        # Unified hardware radio telemetry (NFC, BLE, UWB, RTT, Satellite)
│   │   └── useUWB.ts           # [Pixel Pro] Ultra-Wideband spatial radar & Angle-of-Arrival
│   │
│   ├── ai/                     # Intelligence & Silicon Acceleration Layer (4 hooks + client)
│   │   ├── useTPU.ts           # Google Tensor TPU hardware accelerator & latency benchmarker
│   │   ├── useSpeechAI.ts      # Voice speech-to-text recording & transcription pipeline
│   │   ├── useGemini.ts        # Multi-turn conversational chat, reasoning & token metrics
│   │   ├── useGeminiNano.ts    # Gemini Nano on-device chat, status, download, measured latency
│   │   ├── useVisionAI.ts      # Multimodal camera capture & visual scene inspection
│   │   └── geminiClient.ts     # Google Gen AI client factory with encrypted key persistence
│   │
│   ├── theme/
│   │   ├── colors.ts           # Design tokens (Delta-aligned): field, accent, meaning colours, Geist type
│   │   └── mode.ts             # State → colour/label map for the reactor and status chip
│   │
│   ├── components/             # Reusable UI Primitives (PixelKit design system)
│   │   ├── HapticButton.tsx    # Gradient / white CTA / glass pill button with haptics
│   │   ├── MetricCard.tsx      # Glass telemetry card with provenance tag
│   │   ├── SensorVisualizer.tsx# Centred 3-axis bars with per-sensor ranges
│   │   └── Decor.tsx           # Glow backdrop, orbit rings, section header, chip
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
   # Or with local AI MCP tools enabled:
   npm run start:mcp
   ```

5. **Test & Edit the UI**:
   * **Physical Device (Fast Refresh)**: Install **Expo Go** from Google Play on your Pixel 11 Pro, scan the terminal QR code, and watch UI edits reflect live in <500ms.
   * **Web Browser Preview & React Grab**: Run `npm run web` (or press `w` in Metro) to preview and inspect layout at `http://localhost:8081`. Hold **`Ctrl+C`** / **`Cmd+C`** and click any visual element to copy its exact source location and component stack for AI agents.
   * **Android Emulator**: Press `a` in Metro to launch on an active Android Virtual Device (AVD).

---

## 📦 Release Build (v1.0.0)

Versioning follows `CHANGELOG.md`: every change bumps the patch version and adds an entry. Current: **1.0.0** (`package.json`, `app.json` `expo.version`, `expo.android.versionCode` 1).

```bash
npm run typecheck
npx expo export -p android                 # Hermes bundle check
cd android && ./gradlew assembleRelease     # release APK (Windows: build from the space-free junction, see docs/getting-started/quickstart.md)
# output: android/app/build/outputs/apk/release/app-release.apk
```

The generated Gradle project signs release builds with the **debug keystore** until a release keystore is configured (`android/app/build.gradle` → `signingConfigs.release`) or the app is built with EAS (`eas build -p android`). Do not upload a debug-signed APK to Google Play.

Release checklist: `CHANGELOG.md` entry, version fields bumped together, `npm run typecheck` clean, `npx expo export` clean, on-device pass recorded in `docs/research/DEVICE_TEST_REPORT_<date>.md`.

---

## 💡 How to Build With PixelKit

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
  useGeminiNano,
  useVisionAI, 
  useUWB,
  useSecurity,
  useDevice,
  HapticButton, 
  MetricCard 
} from './src';

export default function MyPixelTool() {
  const { light, success } = useHaptics();
  const { currentFps } = useGPU();
  const hilight = useHiLight();

  const handleAction = async () => {
    await light();
    hilight.triggerGeminiPulse(3000);
    await success();
  };

  return (
    <MetricCard
      title="Presented FPS"
      value={currentFps}
      unit="FPS"
      badge="Choreographer"
    />
  );
}
```

---

## 📚 Comprehensive Documentation Suite

PixelKit features an exhaustive, multi-tier documentation system kept in continuous synchronization with the codebase:

### 🧭 [Documentation Hub (docs/README.md)](./docs/README.md)
The central sitemap and entry portal for all developer guides and reference manuals.

### 🚀 Getting Started
* **[Quickstart Guide](./docs/getting-started/quickstart.md)**: Workstation prerequisites, Android CLI setup, and launching on physical Pixel devices.
* **[Silicon Architecture](./docs/getting-started/architecture.md)**: Overview of the Tensor G6 7-core CPU, PowerVR GPU, Titan M3 PQC, and Pixelsnap Qi2.2 magnetic charging.

### 📚 API Reference (By Subsystem)
* **[Silicon & Compute](./docs/api/silicon-compute.md)**: `useCPU`, `useGPU`, `useTPU`, `useMemory`, `useADPF`.
* **[Pixel Pro Exclusives](./docs/api/pro-exclusives.md)**: `useHiLight`, `useUWB`.
* **[Neural & AI](./docs/api/neural-ai.md)**: `useGemini`, `useGeminiNano`, `useSpeechAI`, `useVisionAI`, `geminiClient`.
* **[Sensors & Actuators](./docs/api/sensors-actuators.md)**: `useSensors`, `useCamera`, `useTorch`, `useHaptics`.
* **[Radios & Security](./docs/api/radios-security.md)**: `useBiometrics`, `useSecurity`, `useBLE`, `useNFC`, `useLocation`.
* **[System & Media](./docs/api/system-media.md)**: `useAudio`, `useDisplay`, `useDevice`, `useNetwork`.

### 🤖 AI Agent Guidance & Primers
* **[Agent Operational Primer](./docs/ai-guidance/agent-primer.md)**: Foundational laws for autonomous coding agents, the 5 Golden Rules of PixelKit, and copy-paste system prompts.
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

### 📝 Change Log & Agent Guide
* **[CHANGELOG.md](./CHANGELOG.md)**: Release history; every change adds an entry and bumps the patch version.
* **[AGENTS.md](./AGENTS.md)**: Rules for any coding agent (identical to `CLAUDE.md` and `GEMINI.md`).

### 📑 Consolidated Single-File Manuals
* **[HARDWARE_API.md](./docs/HARDWARE_API.md)**: Complete 24-module hardware and AI API manual in a single file.
* **[AI_PRIMER.md](./docs/AI_PRIMER.md)**: Complete AI agent operational manual in a single file.

### 📱 In-App Documentation Viewer
Browse live documentation, interactive copyable TypeScript snippets, and AI tips on the device itself via the **Docs** tab (`DocsScreen.tsx`).



NPU feature flag; inference itself is `useGeminiNano()` |# PixelForge SDK ⚡
NPU feature flag; inference itself is `useGeminiNano()` |> **The Hardware & AI Framework for Google Pixel & Android**  
NPU feature flag; inference itself is `useGeminiNano()` |> *Engineered for high-performance mobile applications and autonomous AI agents.*
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-black?style=flat-square&logo=expo)](https://docs.expo.dev/versions/v57.0.0/)
NPU feature flag; inference itself is `useGeminiNano()` |[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
NPU feature flag; inference itself is `useGeminiNano()` |[![Android Version](https://img.shields.io/badge/Android-15%20%2F%2016%20%2F%2017-3DDC84?style=flat-square&logo=android)](https://developer.android.com/)
NPU feature flag; inference itself is `useGeminiNano()` |[![Google Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
NPU feature flag; inference itself is `useGeminiNano()` |[![Tensor TPU](https://img.shields.io/badge/Hardware-Tensor%20TPU-00E5FF?style=flat-square)](https://developers.google.com/tensor)
NPU feature flag; inference itself is `useGeminiNano()` |[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |---
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |## 📖 Overview
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |**PixelForge** is a modular framework and developer SDK designed specifically to unlock 100% of the hardware silicon and on-device machine learning capabilities of the **Google Pixel 11 Pro** (and modern Android devices). 
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |Instead of dealing with fragmented low-level Android APIs or complex native bridges, PixelForge abstracts the phone's physical hardware into 24 typed, reusable **React hooks** with integrated tactile haptics, thermal headroom management, and multimodal Gemini AI intelligence.
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |It is structured as an authoritative foundation for developers and autonomous AI coding agents (including the upcoming **Delta Bot**) to build, test, and ship mobile experiences rapidly.
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |---
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |## 🚀 Hardware & Silicon Feature Matrix
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` || Subsystem | Developer Hook | Physical Hardware Mapped |
NPU feature flag; inference itself is `useGeminiNano()` || :--- | :--- | :--- |
NPU feature flag; inference itself is `useGeminiNano()` || **Tensor G6 CPU** | `useCPU()` | Real topology from /proc/cpuinfo + cpufreq (1x C1-Ultra 4.11 GHz, 4x C1-Pro 3.38 GHz, 2x C1-Pro 2.65 GHz), per-core MHz, governor, frequency utilisation, app CPU share |
NPU feature flag; inference itself is `useGeminiNano()` || **PowerVR GPU** | `useGPU()` | EGL renderer string (PowerVR CXTP-48-1536, Vulkan 1.4), Choreographer frame pacing: presented FPS, avg/max frame interval, jank |
NPU feature flag; inference itself is `useGeminiNano()` || **Tensor TPU / NPU** | `useTPU()` | AICore / Private Compute Services detection (Gemini Nano host), NPU feature flag; inference metrics null until the pixel-nano module lands |
NPU feature flag; inference itself is `useGeminiNano()` || **LPDDR5X RAM** | `useMemory()` | ActivityManager total/available/LMK threshold, Java + native heaps, GC request |
NPU feature flag; inference itself is `useGeminiNano()` || **Dynamic Thermals** | `useADPF()` | PowerManager thermal headroom + status listener, thresholds, Android 16+ SystemHealth CPU/GPU headroom, display target vs measured FPS |
NPU feature flag; inference itself is `useGeminiNano()` || **HiLight LED Ring** | `useHiLight()` | **[Pixel 11 Pro Exclusive]** Camera bar multi-color notification & Gemini AI status ring |
NPU feature flag; inference itself is `useGeminiNano()` || **Motion & Atmosphere**| `useSensors()` | 6-Axis IMU (Gyro/Accel), Barometer (hypsometric altimeter), Magnetometer, Light |
NPU feature flag; inference itself is `useGeminiNano()` || **Tactile Haptics** | `useHaptics()` | LRA patterns plus Android 16 envelope effects (PWLE v2, 134.4 Hz resonance) and primitive compositions |
NPU feature flag; inference itself is `useGeminiNano()` || **Camera & Looks** | `useCamera()` | expo-camera lens, zoom, flash and permission state; Camera Looks kept as UI state (Pixel Camera app feature) |
NPU feature flag; inference itself is `useGeminiNano()` || **Multimodal Vision** | `useVisionAI()` | Ultra HDR camera capture, gallery picker, and Gemini Multimodal scene analysis |
NPU feature flag; inference itself is `useGeminiNano()` || **Voice & Speech** | `useSpeechAI()` | Multi-mic voice recording, decibel metering, and Speech-to-Text transcription |
NPU feature flag; inference itself is `useGeminiNano()` |$1| **On-device Gemini Nano** | `useGeminiNano()` | ML Kit GenAI Prompt API on AICore via `modules/pixel-nano`: status, model name, token limit, streaming tokens, measured latency and decode rate; no cloud fallback |
NPU feature flag; inference itself is `useGeminiNano()` || **Spatial Radar** | `useUWB()` | **[Pixel Pro Exclusive]** Ultra-Wideband distance & AoA; radio verified, ranging simulated until RangingManager |
NPU feature flag; inference itself is `useGeminiNano()` || **Device Capabilities** | `useCapabilities()` | Resolves what this Pixel physically has (thermometer, HiLight, UWB, Titan M3, Gemini Nano tier) and which Android 16/17 APIs exist |
NPU feature flag; inference itself is `useGeminiNano()` || **IR Thermometer** | `useTemperature()` | **[Pixel 8-10 Pro only]** Infrared thermopile sensor; **absent on Pixel 11 Pro** (reports `availability: 'estimated'`) |
NPU feature flag; inference itself is `useGeminiNano()` || **Contactless NFC** | `useNFC()` | NFC radio controller, NDEF smart tag reader/writer, and simulation runner |
NPU feature flag; inference itself is `useGeminiNano()` || **Bluetooth Low Energy**| `useBLE()` | BLE beacon & peripheral scanner with RSSI signal strength distance estimation |
NPU feature flag; inference itself is `useGeminiNano()` || **Flashlight / Torch** | `useTorch()` | CameraManager torch with 21 brightness levels (Android 13+), system torch callback, SOS strobe |
NPU feature flag; inference itself is `useGeminiNano()` || **Super Actua Display**| `useDisplay()` | Live refresh rate + ARR support, 1-120 Hz mode list, HDR types, preferred-rate control, wake lock, brightness |
NPU feature flag; inference itself is `useGeminiNano()` || **Biometrics** | `useBiometrics()` | Titan M3-backed under-display Fingerprint and Class 3 Face Unlock authentication |
NPU feature flag; inference itself is `useGeminiNano()` || **Secure Storage** | `useSecurity()` | expo-secure-store on the Android Keystore (StrongBox present on Pixel 11 Pro); classical AES, no post-quantum claims |
NPU feature flag; inference itself is `useGeminiNano()` || **Satellite & Modem** | `useNetwork()` | MediaTek M90 modem, Wi-Fi 7, 5G Sub-6/mmWave, and Satellite SOS connectivity |
NPU feature flag; inference itself is `useGeminiNano()` || **Satellite GNSS** | `useLocation()` | Multi-band dual-frequency L1/L5 GPS receiver, speed, altitude, and compass heading |
NPU feature flag; inference itself is `useGeminiNano()` || **Pixelsnap & Power** | `useDevice()` | Pixelsnap Qi2.2 25W magnetic wireless charging, battery health, and PMIC telemetry |
NPU feature flag; inference itself is `useGeminiNano()` || **Studio Mic Array** | `useAudio()` | Multi-mic recording via `expo-audio` (16 kHz mono, `voice_recognition` source) & real-time dBFS metering |
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |---
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |## 📋 Prerequisites
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |Ensure your development workstation has:
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |### 1. Node.js
NPU feature flag; inference itself is `useGeminiNano()` |* Version **20.x** or higher (tested on Node 24).
NPU feature flag; inference itself is `useGeminiNano()` |* Verify: `node -v`
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |### 2. Official Google Android CLI (`android.exe`)
NPU feature flag; inference itself is `useGeminiNano()` |The official Google Android CLI provides tools to manage SDK components, inspect device layouts, capture screenshots, and generate descriptive project metadata.
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |#### Installation:
NPU feature flag; inference itself is `useGeminiNano()` |* **Windows (PowerShell / CMD)**:
NPU feature flag; inference itself is `useGeminiNano()` |  ```cmd
NPU feature flag; inference itself is `useGeminiNano()` |  curl.exe -fsSL https://dl.google.com/android/cli/latest/windows_x86_64/install.cmd -o "%TEMP%\i.cmd" && "%TEMP%\i.cmd"
NPU feature flag; inference itself is `useGeminiNano()` |  ```
NPU feature flag; inference itself is `useGeminiNano()` |* **macOS (Apple Silicon)**:
NPU feature flag; inference itself is `useGeminiNano()` |  ```bash
NPU feature flag; inference itself is `useGeminiNano()` |  curl -fsSL https://dl.google.com/android/cli/latest/darwin_arm64/install.sh | bash
NPU feature flag; inference itself is `useGeminiNano()` |  ```
NPU feature flag; inference itself is `useGeminiNano()` |* **Linux (x86_64)**:
NPU feature flag; inference itself is `useGeminiNano()` |  ```bash
NPU feature flag; inference itself is `useGeminiNano()` |  curl -fsSL https://dl.google.com/android/cli/latest/linux_x86_64/install.sh | bash
NPU feature flag; inference itself is `useGeminiNano()` |  ```
NPU feature flag; inference itself is `useGeminiNano()` |* Verify: `android --help`
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |---
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |## 🛠️ Android CLI & Project Describing (`android describe`)
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |PixelForge integrates directly with `android describe`:
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |```bash
NPU feature flag; inference itself is `useGeminiNano()` |# Analyze project structure and generate JSON metadata for build targets and APK outputs
NPU feature flag; inference itself is `useGeminiNano()` |android describe --project_dir=.
NPU feature flag; inference itself is `useGeminiNano()` |```
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |### Essential Android CLI Commands:
NPU feature flag; inference itself is `useGeminiNano()` |* `android describe`: Generates descriptive metadata JSON files detailing build targets, APK locations, and artifact outputs.
NPU feature flag; inference itself is `useGeminiNano()` |* `android layout`: Dumps the JSON UI layout tree of a connected Pixel device or emulator.
NPU feature flag; inference itself is `useGeminiNano()` |* `android screen`: Inspects UI elements, bounds, and takes screenshots of connected devices.
NPU feature flag; inference itself is `useGeminiNano()` |* `android sdk list --all`: Lists available and installed Android SDK packages.
NPU feature flag; inference itself is `useGeminiNano()` |* `android emulator`: Manages and launches Android Virtual Devices.
NPU feature flag; inference itself is `useGeminiNano()` |* `android skills`: Manages agent skills (official `android-cli` skill located in `.agents/skills/android-cli/`).
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |---
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |## 🏛️ Project Structure
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |```text
NPU feature flag; inference itself is `useGeminiNano()` |Pixel delta/ (PixelForge Framework)
NPU feature flag; inference itself is `useGeminiNano()` |├── App.tsx                     # Main App Shell & 4-Tab Navigator (HUD, AI Lab, Sensors, Docs)
NPU feature flag; inference itself is `useGeminiNano()` |├── PIXELFORGE.md               # Canonical AI Reference & Prompt Manual
NPU feature flag; inference itself is `useGeminiNano()` |├── README.md                   # Complete Developer Reference & Quickstart
NPU feature flag; inference itself is `useGeminiNano()` |├── AGENTS.md                   # Antigravity agent guidelines & Android CLI rules
NPU feature flag; inference itself is `useGeminiNano()` |├── CLAUDE.md                   # Claude agent guidelines mirror & mandatory doc sync rule
NPU feature flag; inference itself is `useGeminiNano()` |├── GEMINI.md                   # Gemini agent guidelines mirror & mandatory doc sync rule
NPU feature flag; inference itself is `useGeminiNano()` |├── app.json                    # Android 15/16/17 Permissions & 120Hz LTPO Manifest
NPU feature flag; inference itself is `useGeminiNano()` |├── package.json                # Dependencies: Expo 57, React 19, React Native 0.86, @google/genai
NPU feature flag; inference itself is `useGeminiNano()` |├── skills-lock.json            # Deterministic lockfile for installed agent skills
NPU feature flag; inference itself is `useGeminiNano()` |│
NPU feature flag; inference itself is `useGeminiNano()` |├── .agents/skills/             # Built-in Agent Skills
NPU feature flag; inference itself is `useGeminiNano()` |│   ├── android-cli/            # Google Android CLI skill (SDK, emulator, device inspection)
NPU feature flag; inference itself is `useGeminiNano()` |│   └── expo/skills             # 26 Official Expo agent skills (expo-router, expo-ui, eas-*, etc.)
NPU feature flag; inference itself is `useGeminiNano()` |│
NPU feature flag; inference itself is `useGeminiNano()` |├── docs/                       # Comprehensive Modular Documentation Suite
NPU feature flag; inference itself is `useGeminiNano()` |│   ├── README.md               # Documentation portal & sitemap
NPU feature flag; inference itself is `useGeminiNano()` |│   ├── HARDWARE_API.md         # Consolidated 24-module hardware reference manual
NPU feature flag; inference itself is `useGeminiNano()` |│   ├── AI_PRIMER.md            # Consolidated AI operational manual & 5 Golden Rules
NPU feature flag; inference itself is `useGeminiNano()` |│   ├── getting-started/        # Quickstart & silicon architecture guides
NPU feature flag; inference itself is `useGeminiNano()` |│   ├── api/                    # Modular API references by subsystem (silicon, pro, ai, etc.)
NPU feature flag; inference itself is `useGeminiNano()` |│   ├── ai-guidance/            # AI agent primer and production recipes
NPU feature flag; inference itself is `useGeminiNano()` |│   ├── guides/                 # On-device Gemini Nano, Function Calling, Voice, Diagnostics
NPU feature flag; inference itself is `useGeminiNano()` |│   └── research/               # Ground-truth Pixel 11 Pro hardware research & deep dives
NPU feature flag; inference itself is `useGeminiNano()` |│
NPU feature flag; inference itself is `useGeminiNano()` |├── modules/
NPU feature flag; inference itself is `useGeminiNano()` |│   ├── pixel-native/           # Local Expo Module (Kotlin): CPU, memory, thermal, display, GPU, torch, haptics
NPU feature flag; inference itself is `useGeminiNano()` |│   └── pixel-nano/             # Local Expo Module (Kotlin): Gemini Nano via ML Kit GenAI Prompt API (AICore)
NPU feature flag; inference itself is `useGeminiNano()` |│
NPU feature flag; inference itself is `useGeminiNano()` |├── src/
NPU feature flag; inference itself is `useGeminiNano()` |│   ├── index.ts                # Master barrel export for all hooks and UI primitives
NPU feature flag; inference itself is `useGeminiNano()` |│   ├── core/
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── types.ts            # Strongly-typed telemetry, silicon, and AI interfaces
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── capabilities.ts     # Pure device capability resolver + PackageManager verification
NPU feature flag; inference itself is `useGeminiNano()` |│   │   └── observability.ts    # Telemetry provenance (hardware/derived/simulated/unavailable), event log
NPU feature flag; inference itself is `useGeminiNano()` |│   │
NPU feature flag; inference itself is `useGeminiNano()` |│   ├── hardware/               # Physical Silicon & Hardware Abstractions (15 hooks)
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useCPU.ts           # Tensor G6 7-Core cluster (4.11GHz C1-Ultra, C-1 Pro) on TSMC 2nm
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useGPU.ts           # PowerVR / Vulkan frame pacing (8.33ms budget) & dropped frames
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useMemory.ts        # LPDDR5X RAM usage, free memory & Low Memory Killer (LMK) protection
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useADPF.ts          # Android Dynamic Performance Framework (CPU/GPU headroom & thermals)
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useSensors.ts       # 6-Axis Motion (Gyro/Accel), Barometer/Altimeter, Compass, Light
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useHaptics.ts       # Linear Resonant Actuator tactile waveforms & mechanical ticks
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useCamera.ts        # expo-camera zoom, flash, lens; Look label as UI state
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useHiLight.ts       # [Pixel Pro Exclusive] Rear camera bar notification LED ring
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useTorch.ts         # Hardware LED flashlight & emergency SOS strobe controller
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useDevice.ts        # Pixelsnap Qi2.2 25W charging, battery health & telemetry
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useDisplay.ts       # 3,600 nits 120Hz LTPO OLED display, screen wake lock & brightness
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useBiometrics.ts    # Titan M3 in-display Fingerprint & Face Unlock auth
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useSecurity.ts      # SecureStore on the Android Keystore (StrongBox)
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useLocation.ts      # Multi-band GNSS satellite positioning, altitude & heading
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useNetwork.ts       # MediaTek M90 Wi-Fi 7, 5G Sub-6/mmWave & Satellite SOS
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useCapabilities.ts  # Device capability resolution (what this Pixel really has)
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useAudio.ts         # Multi-mic recording (expo-audio) & real-time dBFS metering
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useBLE.ts           # Bluetooth Low Energy scanner & RSSI proximity beacon client
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useNFC.ts           # Contactless NDEF / RFID tag reader & writer controller
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useTemperature.ts   # [Pixel 8-10 Pro] Infrared thermometer; absent on Pixel 11 Pro (estimated)
NPU feature flag; inference itself is `useGeminiNano()` |│   │   └── useUWB.ts           # [Pixel Pro] Ultra-Wideband spatial radar & Angle-of-Arrival
NPU feature flag; inference itself is `useGeminiNano()` |│   │
NPU feature flag; inference itself is `useGeminiNano()` |│   ├── ai/                     # Intelligence & Silicon Acceleration Layer (4 hooks + client)
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useTPU.ts           # Google Tensor TPU hardware accelerator & latency benchmarker
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useSpeechAI.ts      # Voice speech-to-text recording & transcription pipeline
NPU feature flag; inference itself is `useGeminiNano()` |$1│   │   ├── useGeminiNano.ts    # Gemini Nano on-device chat, status, download, measured latency
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── useVisionAI.ts      # Multimodal camera capture & visual scene inspection
NPU feature flag; inference itself is `useGeminiNano()` |│   │   └── geminiClient.ts     # Google Gen AI client factory with encrypted key persistence
NPU feature flag; inference itself is `useGeminiNano()` |│   │
NPU feature flag; inference itself is `useGeminiNano()` |│   ├── theme/
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── colors.ts           # Design tokens (Delta-aligned): field, accent, meaning colours, Geist type
NPU feature flag; inference itself is `useGeminiNano()` |│   │   └── mode.ts             # State → colour/label map for the reactor and status chip
NPU feature flag; inference itself is `useGeminiNano()` |│   │
NPU feature flag; inference itself is `useGeminiNano()` |│   ├── components/             # Reusable UI Primitives (PixelForge design system)
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── HapticButton.tsx    # Gradient / white CTA / glass pill button with haptics
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── MetricCard.tsx      # Glass telemetry card with provenance tag
NPU feature flag; inference itself is `useGeminiNano()` |│   │   ├── SensorVisualizer.tsx# Centred 3-axis bars with per-sensor ranges
NPU feature flag; inference itself is `useGeminiNano()` |│   │   └── Decor.tsx           # Glow backdrop, orbit rings, section header, chip
NPU feature flag; inference itself is `useGeminiNano()` |│   │
NPU feature flag; inference itself is `useGeminiNano()` |│   └── screens/
NPU feature flag; inference itself is `useGeminiNano()` |│       ├── DashboardScreen.tsx # Silicon & compute HUD (CPU, GPU, TPU, Memory, Temp, UWB)
NPU feature flag; inference itself is `useGeminiNano()` |│       ├── AILabScreen.tsx     # Gemini Chat, Vision Inspector, and Voice Speech-to-Text
NPU feature flag; inference itself is `useGeminiNano()` |│       ├── SensorsLabScreen.tsx# Interactive laboratory: Motion, Haptics, Radios (NFC/BLE), Audio
NPU feature flag; inference itself is `useGeminiNano()` |│       └── DocsScreen.tsx      # Interactive on-device API documentation & AI Primer viewer
NPU feature flag; inference itself is `useGeminiNano()` |```
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |---
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |## ⚡ Quick Start (Running on Your Pixel 11 Pro)
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |1. **Install dependencies**:
NPU feature flag; inference itself is `useGeminiNano()` |   ```bash
NPU feature flag; inference itself is `useGeminiNano()` |   npm install
NPU feature flag; inference itself is `useGeminiNano()` |   ```
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |2. **Verify TypeScript compilation**:
NPU feature flag; inference itself is `useGeminiNano()` |   ```bash
NPU feature flag; inference itself is `useGeminiNano()` |   npm run typecheck
NPU feature flag; inference itself is `useGeminiNano()` |   ```
NPU feature flag; inference itself is `useGeminiNano()` |   *Should exit with 0 errors.*
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |3. **Verify Metro Hermes bytecode export**:
NPU feature flag; inference itself is `useGeminiNano()` |   ```bash
NPU feature flag; inference itself is `useGeminiNano()` |   npx expo export -p android
NPU feature flag; inference itself is `useGeminiNano()` |   ```
NPU feature flag; inference itself is `useGeminiNano()` |   *Compiles all 696 modules to optimized Hermes bytecode (`.hbc`).*
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |4. **Start the development server**:
NPU feature flag; inference itself is `useGeminiNano()` |   ```bash
NPU feature flag; inference itself is `useGeminiNano()` |   npm start
NPU feature flag; inference itself is `useGeminiNano()` |   # Or with local AI MCP tools enabled:
NPU feature flag; inference itself is `useGeminiNano()` |   npm run start:mcp
NPU feature flag; inference itself is `useGeminiNano()` |   ```
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |5. **Test & Edit the UI**:
NPU feature flag; inference itself is `useGeminiNano()` |   * **Physical Device (Fast Refresh)**: Install **Expo Go** from Google Play on your Pixel 11 Pro, scan the terminal QR code, and watch UI edits reflect live in <500ms.
NPU feature flag; inference itself is `useGeminiNano()` |   * **Web Browser Preview & React Grab**: Run `npm run web` (or press `w` in Metro) to preview and inspect layout at `http://localhost:8081`. Hold **`Ctrl+C`** / **`Cmd+C`** and click any visual element to copy its exact source location and component stack for AI agents.
NPU feature flag; inference itself is `useGeminiNano()` |   * **Android Emulator**: Press `a` in Metro to launch on an active Android Virtual Device (AVD).
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |---
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |## 📦 Release Build (v1.0.0)
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |Versioning follows `CHANGELOG.md`: every change bumps the patch version and adds an entry. Current: **1.0.0** (`package.json`, `app.json` `expo.version`, `expo.android.versionCode` 1).
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |```bash
NPU feature flag; inference itself is `useGeminiNano()` |npm run typecheck
NPU feature flag; inference itself is `useGeminiNano()` |npx expo export -p android                 # Hermes bundle check
NPU feature flag; inference itself is `useGeminiNano()` |cd android && ./gradlew assembleRelease     # release APK (Windows: build from the space-free junction, see docs/getting-started/quickstart.md)
NPU feature flag; inference itself is `useGeminiNano()` |# output: android/app/build/outputs/apk/release/app-release.apk
NPU feature flag; inference itself is `useGeminiNano()` |```
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |The generated Gradle project signs release builds with the **debug keystore** until a release keystore is configured (`android/app/build.gradle` → `signingConfigs.release`) or the app is built with EAS (`eas build -p android`). Do not upload a debug-signed APK to Google Play.
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |Release checklist: `CHANGELOG.md` entry, version fields bumped together, `npm run typecheck` clean, `npx expo export` clean, on-device pass recorded in `docs/research/DEVICE_TEST_REPORT_<date>.md`.
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |---
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |## 💡 How to Build With PixelForge
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |All hooks and UI components are available from a single centralized import:
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |```typescript
NPU feature flag; inference itself is `useGeminiNano()` |import { 
NPU feature flag; inference itself is `useGeminiNano()` |  useCPU,
NPU feature flag; inference itself is `useGeminiNano()` |  useGPU,
NPU feature flag; inference itself is `useGeminiNano()` |  useTPU,
NPU feature flag; inference itself is `useGeminiNano()` |  useMemory,
NPU feature flag; inference itself is `useGeminiNano()` |  useHiLight,
NPU feature flag; inference itself is `useGeminiNano()` |  useCamera,
NPU feature flag; inference itself is `useGeminiNano()` |  useSensors, 
NPU feature flag; inference itself is `useGeminiNano()` |  useHaptics, 
NPU feature flag; inference itself is `useGeminiNano()` |  useSpeechAI,
NPU feature flag; inference itself is `useGeminiNano()` |  useGemini, 
NPU feature flag; inference itself is `useGeminiNano()` |  useGeminiNano,
NPU feature flag; inference itself is `useGeminiNano()` |  useVisionAI, 
NPU feature flag; inference itself is `useGeminiNano()` |  useTemperature,
NPU feature flag; inference itself is `useGeminiNano()` |  useUWB,
NPU feature flag; inference itself is `useGeminiNano()` |  useSecurity,
NPU feature flag; inference itself is `useGeminiNano()` |  useDevice,
NPU feature flag; inference itself is `useGeminiNano()` |  HapticButton, 
NPU feature flag; inference itself is `useGeminiNano()` |  MetricCard 
NPU feature flag; inference itself is `useGeminiNano()` |} from './src';
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |export default function MyPixelTool() {
NPU feature flag; inference itself is `useGeminiNano()` |  const { light, success } = useHaptics();
NPU feature flag; inference itself is `useGeminiNano()` |  const { currentFps } = useGPU();
NPU feature flag; inference itself is `useGeminiNano()` |  const { celsius } = useTemperature().reading;
NPU feature flag; inference itself is `useGeminiNano()` |  const hilight = useHiLight();
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |  const handleAction = async () => {
NPU feature flag; inference itself is `useGeminiNano()` |    await light();
NPU feature flag; inference itself is `useGeminiNano()` |    hilight.triggerGeminiPulse(3000);
NPU feature flag; inference itself is `useGeminiNano()` |    await success();
NPU feature flag; inference itself is `useGeminiNano()` |  };
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |  return (
NPU feature flag; inference itself is `useGeminiNano()` |    <MetricCard
NPU feature flag; inference itself is `useGeminiNano()` |      title="Surface Temperature"
NPU feature flag; inference itself is `useGeminiNano()` |      value={celsius}
NPU feature flag; inference itself is `useGeminiNano()` |      unit="°C"
NPU feature flag; inference itself is `useGeminiNano()` |      badge={`${currentFps} FPS`}
NPU feature flag; inference itself is `useGeminiNano()` |    />
NPU feature flag; inference itself is `useGeminiNano()` |  );
NPU feature flag; inference itself is `useGeminiNano()` |}
NPU feature flag; inference itself is `useGeminiNano()` |```
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |---
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |## 📚 Comprehensive Documentation Suite
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |PixelForge features an exhaustive, multi-tier documentation system kept in continuous synchronization with the codebase:
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |### 🧭 [Documentation Hub (docs/README.md)](./docs/README.md)
NPU feature flag; inference itself is `useGeminiNano()` |The central sitemap and entry portal for all developer guides and reference manuals.
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |### 🚀 Getting Started
NPU feature flag; inference itself is `useGeminiNano()` |* **[Quickstart Guide](./docs/getting-started/quickstart.md)**: Workstation prerequisites, Android CLI setup, and launching on physical Pixel devices.
NPU feature flag; inference itself is `useGeminiNano()` |* **[Silicon Architecture](./docs/getting-started/architecture.md)**: Overview of the Tensor G6 7-core CPU, PowerVR GPU, Titan M3 PQC, and Pixelsnap Qi2.2 magnetic charging.
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |### 📚 API Reference (By Subsystem)
NPU feature flag; inference itself is `useGeminiNano()` |* **[Silicon & Compute](./docs/api/silicon-compute.md)**: `useCPU`, `useGPU`, `useTPU`, `useMemory`, `useADPF`.
NPU feature flag; inference itself is `useGeminiNano()` |* **[Pixel Pro Exclusives](./docs/api/pro-exclusives.md)**: `useHiLight`, `useUWB`, `useTemperature`.
NPU feature flag; inference itself is `useGeminiNano()` |* **[Neural & AI](./docs/api/neural-ai.md)**: `useGemini`, `useGeminiNano`, `useSpeechAI`, `useVisionAI`, `geminiClient`.
NPU feature flag; inference itself is `useGeminiNano()` |* **[Sensors & Actuators](./docs/api/sensors-actuators.md)**: `useSensors`, `useCamera`, `useTorch`, `useHaptics`.
NPU feature flag; inference itself is `useGeminiNano()` |* **[Radios & Security](./docs/api/radios-security.md)**: `useBiometrics`, `useSecurity`, `useBLE`, `useNFC`, `useLocation`.
NPU feature flag; inference itself is `useGeminiNano()` |* **[System & Media](./docs/api/system-media.md)**: `useAudio`, `useDisplay`, `useDevice`, `useNetwork`.
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |### 🤖 AI Agent Guidance & Primers
NPU feature flag; inference itself is `useGeminiNano()` |* **[Agent Operational Primer](./docs/ai-guidance/agent-primer.md)**: Foundational laws for autonomous coding agents, the 5 Golden Rules of PixelForge, and copy-paste system prompts.
NPU feature flag; inference itself is `useGeminiNano()` |* **[Production Recipes](./docs/ai-guidance/recipes.md)**: Copy-pasteable recipes for voice agent loops, multimodal scene reasoning, HiLight visual signaling, and spatial tracking.
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |### 🛠️ Production Guides & Diagnostics
NPU feature flag; inference itself is `useGeminiNano()` |* **[Built-in AI, Function Calling & Voice Hub](./docs/guides/README.md)**: Hybrid decision tree (Gemini Nano 4 on-device vs Gemini cloud) and build prerequisites.
NPU feature flag; inference itself is `useGeminiNano()` |* **[On-Device AI with Gemini Nano](./docs/guides/on-device-ai-gemini-nano.md)**: ML Kit GenAI Prompt API, local Expo Module, structured output, and thinking mode.
NPU feature flag; inference itself is `useGeminiNano()` |* **[Function Calling & Hardware Tools](./docs/guides/function-calling.md)**: Unified tool registry for cloud Gemini, Gemini Nano, and Android AppFunctions.
NPU feature flag; inference itself is `useGeminiNano()` |* **[Voice: Speech In, Speech Out, Live Agents](./docs/guides/voice.md)**: On-device streaming STT, Gemini Live API bidirectional agents, and audio haptics.
NPU feature flag; inference itself is `useGeminiNano()` |* **[Troubleshooting & Diagnostics](./docs/guides/troubleshooting.md)**: Expo SDK 57 nuances, KeepAwake tags, StatusBar styling, and thermal throttling mitigations.
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |### 🔬 Research & Deep Dives
NPU feature flag; inference itself is `useGeminiNano()` |* **[Pixel 11 Pro Hardware Research](./docs/research/PIXEL_11_PRO_HARDWARE_RESEARCH.md)**: Ground-truth spec sheet, Android 17 (API 37) surfaces, and SDK gap analysis.
NPU feature flag; inference itself is `useGeminiNano()` |* **[Pixel 11 Pro Deep Dive (Round 2)](./docs/research/PIXEL_11_PRO_DEEP_DIVE.md)**: Corrections, Android 16/17 APIs (`RangingManager`, ADPF headroom, ARR), and store deadlines.
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |### 📝 Change Log & Agent Guide
NPU feature flag; inference itself is `useGeminiNano()` |* **[CHANGELOG.md](./CHANGELOG.md)**: Release history; every change adds an entry and bumps the patch version.
NPU feature flag; inference itself is `useGeminiNano()` |* **[AGENTS.md](./AGENTS.md)**: Rules for any coding agent (identical to `CLAUDE.md` and `GEMINI.md`).
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |### 📑 Consolidated Single-File Manuals
NPU feature flag; inference itself is `useGeminiNano()` |* **[HARDWARE_API.md](./docs/HARDWARE_API.md)**: Complete 24-module hardware and AI API manual in a single file.
NPU feature flag; inference itself is `useGeminiNano()` |* **[AI_PRIMER.md](./docs/AI_PRIMER.md)**: Complete AI agent operational manual in a single file.
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |### 📱 In-App Documentation Viewer
NPU feature flag; inference itself is `useGeminiNano()` |Browse live documentation, interactive copyable TypeScript snippets, and AI tips on the device itself via the **Docs** tab (`DocsScreen.tsx`).
NPU feature flag; inference itself is `useGeminiNano()` |
NPU feature flag; inference itself is `useGeminiNano()` |

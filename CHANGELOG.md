# Changelog

All notable changes to PixelForge are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

**Rule:** every change to the codebase bumps the patch version by 0.0.1 (`1.0.0 → 1.0.1 → 1.0.2 …`) and adds an entry here in the same commit. Bump `version` in `package.json` and `expo.version` in `app.json` together, and increment `expo.android.versionCode` by 1. Minor and major bumps are decided by the maintainer, not by agents.

## [1.0.1] - 2026-09-06

### Changed
- Web build keeps phone proportions: a centred 520 px column on the same field.
- Dashboard "android" row shows a dash on non-Android platforms instead of browser data.
- Docs, README and comments no longer claim 120x Generative AI Zoom, Ultra Low Light Video control, centimetre UWB ranging, a quad-mic beamforming array, or Gemini 2.5 Flash. Camera Looks and low-light video are described as Pixel Camera app features held as UI state; UWB ranging is described as simulated until RangingManager; the model is `gemini-3.8-flash`.
- `geminiClient`, `useHiLight`, `useUWB`, `useCamera`, `types.ts` and `DocsScreen` headers state what each hook really reads.

## [1.0.0] - 2026-09-06

First release. Target device: Google Pixel 11 Pro (Android 17, Tensor G6). Expo SDK 57, React Native 0.86.

### Added
- `modules/pixel-native`: local Expo Module (Kotlin) exposing real Android platform state: SoC/build identity, `/proc/cpuinfo` + cpufreq CPU topology and load, ActivityManager memory, PowerManager thermal headroom/status with Android 16 SystemHealth headroom, Display modes/ARR/HDR and preferred refresh rate, EGL GPU identity with Choreographer frame stats, CameraManager torch with strength levels, Vibrator capabilities with Android 16 envelope effects and primitive compositions, PackageManager feature and package probes (with `<queries>` for AICore).
- `src/core/observability.ts`: telemetry provenance (`hardware | derived | simulated | unavailable`), event log with `[PixelForge]` console prefix, `useObservability()`.
- `src/core/capabilities.ts` + `useCapabilities`: device capability resolution from the model table, upgraded to PackageManager-verified flags and the AICore version when the native module is present.
- Design system (`src/theme/colors.ts`, `src/theme/mode.ts`, `src/components/Decor.tsx`): Delta-aligned tokens (near-black blue-cast field, cyan accent, meaning colours), Geist / Geist Mono type, panel material (wash + hairline + specular), reactor, wordmark, status chips, section labels, telemetry rows.
- Dashboard observability panel; Sensors Lab envelope haptics and display controls; AI Lab on-device stack card.
- Expo MCP server registration (`.mcp.json`) and `expo-mcp` local capabilities; `npm run start:mcp`.
- Research and guides: `docs/research/` (hardware research, deep dive, adb device profile, device test report) and `docs/guides/` (on-device AI with Gemini Nano, function calling, voice).
- Documentation suite: `docs/api/*`, `docs/HARDWARE_API.md`, `docs/AI_PRIMER.md`, in-app `DocsScreen`.

### Changed
- All silicon hooks (`useCPU`, `useGPU`, `useMemory`, `useADPF`, `useDisplay`, `useTorch`, `useHaptics`, `useTPU`) read real device state; values that cannot be read are `null` and carry `source`.
- AI hooks (`useGemini`, `useVisionAI`, `useSpeechAI`) use `gemini-3.8-flash` with real chat history, structured JSON vision output, and Gemini audio transcription. Simulated fallbacks removed; missing key produces an error message.
- `useAudio` migrated from `expo-av` to `expo-audio` (16 kHz mono, `voice_recognition` source, 100 ms dBFS metering).
- `useTemperature` reports `isHardwareSupported=false` / `availability='estimated'` on the Pixel 11 Pro family (no thermometer). `useHiLight` reports `availability` (`simulated` on Pixel 11 Pro family; no public API).
- `HapticButton`: two weights (solid accent/danger, outlined) plus ghost; 44 dp minimum hit target.
- `MetricCard`: panel material, mono labels, wrap-safe header, provenance tag.
- `SensorVisualizer`: centred bars with per-sensor ranges.
- App shell: safe-area insets, wordmark header, underline navigation.
- Build: `expo-dev-client`, `expo-build-properties` (compileSdk/targetSdk 36, minSdk 26), `react-native-safe-area-context`, `expo-linear-gradient`, `expo-font`.

### Removed
- `expo-av` dependency.
- Fabricated CPU load, GPU frame time, memory, TPU latency, and thermal numbers.
- Lightning-bolt logo.

### Known limitations
- NFC, BLE and UWB hooks are simulated and labelled `SIMULATED` until native paths land (Android 16 `RangingManager`, `react-native-nfc-manager`, a BLE library).
- Gemini Nano on-device inference is not wired yet (`pixel-nano` module planned); `useTPU` reports detection only.
- `compileSdk 37` does not build with Expo 57's AGP 8.12 (Android 17 SDK ships as `android-37.0`); Android 17 APIs are used behind runtime guards.
- SystemHealthManager CPU/GPU headroom returns null on the test device; under investigation.

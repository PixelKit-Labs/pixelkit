# Changelog

All notable changes to PixelKit are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

**Rule:** every change to the codebase bumps the patch version by 0.0.1 (`1.0.0 → 1.0.1 → 1.0.2 …`) and adds an entry here in the same commit. Bump `version` in `package.json` and `expo.version` in `app.json` together, and increment `expo.android.versionCode` by 1. Minor and major bumps are decided by the maintainer, not by agents.

## [1.0.11] - 2026-09-06

### Changed
- Sensors Lab: Stacked Barometer (SPA18001) and Ambient Light (TMD3743) `MetricCard`s vertically into full-width cards, removing the last legacy 2-column grid and completing full-width card layout consistency across all four screens.

## [1.0.10] - 2026-09-06

### Changed
- AI Lab: Stacked Gemini Nano latency, decode rate, and CPU fallback matmul `MetricCard`s vertically into full-width cards instead of horizontal row layout, ensuring consistent styling, no horizontal compression, and clean typography across mobile viewports.

## [1.0.9] - 2026-09-06

### Added
- Native radio telemetry in `PixelNativeModule.kt`: implemented `getRadioInfo()` querying Android system services (`NfcAdapter`, `BluetoothManager`, `BluetoothAdapter`, `UwbManager`, `WifiRttManager`, `PackageManager`) for live hardware states without mock fallbacks.
- `useRadios` hook in `src/hardware/useRadios.ts`: comprehensive hardware radio telemetry exposing real NFC antenna state, Bluetooth controller & bonded devices, UWB chip status, and Wi-Fi RTT availability (`source: 'hardware'`).
- Bonded Bluetooth peripheral device listing in `SensorsLabScreen` with real MAC addresses and bond states.
- UWB hardware status card in `DashboardScreen` and `SensorsLabScreen` reporting real chip readiness (`default`, `READY`) with `source: 'hardware'`.

### Changed
- `useNFC`: wired to `PixelNative.getRadioInfo().nfc` to report real hardware adapter status, antenna state (`ENABLED`/`DISABLED`), and Android 15+ Observe Mode support with `source: 'hardware'`.
- `useBLE`: wired to `PixelNative.getRadioInfo().bluetooth` to report real adapter status (`ON`/`OFF`), Bluetooth 5.4 Channel Sounding hardware feature verification, and real bonded/paired devices with `source: 'hardware'`.
- `useUWB`: wired to `PixelNative.getRadioInfo().uwb` to report real chip state (`default`, `READY`) and Android 16+ RangingManager availability with `source: 'hardware'`.
- Synchronized documentation across `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`, `PIXELKIT.md`, `docs/HARDWARE_API.md`, `docs/api/radios-security.md`, `docs/api/pro-exclusives.md`, `docs/AI_PRIMER.md`, `docs/research/DEVICE_TEST_REPORT_2026-09-06.md`, and in-app `DocsScreen.tsx`.

## [1.0.8] - 2026-09-06

### Changed
- Dashboard: Stacked all 2-column grid cards across the Silicon dashboard into full-width vertical `MetricCard`s (CPU: Cluster utilisation & This app CPU; Thermal: Thermal headroom & CPU/GPU headroom; GPU: Frame interval & Presented FPS; Power & atmosphere: Battery & Barometer) for optimal readability and breathing room.
- Styling: Fixed trailing character clipping on Android across headers, telemetry, and navigation (`Wordmark` "PIXELKIT" letter-spacing margin, `TelemetryRow` label shrink-resistance, and `Shell` navigation tab titles).

## [1.0.7] - 2026-09-06

### Added
- Native PixelKit ADB HiLight Daemon in `scripts/hilight-daemon/`: zero-dependency Java daemon that runs as UID 2000 (`com.android.shell`) via `app_process` on the device.
- Direct HTTP loopback driver on `127.0.0.1:11080` that controls all 8 physical RGB LEDs with ~3 ms latency via `android.hardware.lights.ILightsManager`.
- Built-in hardware safety controls: 60-second automatic hold clamp and stuck-LED clear mitigation sequence (alpha-black write, canonical black write, and priority -1000 cleanup passes).
- NPM scripts `"hilight:daemon"` (pushes and runs the daemon over ADB) and `"hilight:build"` (compiles daemon Java sources into DEX JAR).
- Enabled `android:usesCleartextTraffic="true"` in `AndroidManifest.xml` for local loopback IPC.

### Changed
- `useHiLight`: elevated to hybrid driver. Automatically detects the active local ADB daemon; reports `availability: 'hardware'` and `source: 'hardware'` when the daemon is running, and seamlessly falls back to on-screen simulation (`'simulated'`) when untethered.
- Dashboard: HiLight card reflects `HARDWARE` status when the ADB daemon is active.
- Docs & Guides: Updated `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`, `docs/HARDWARE_API.md`, `docs/AI_PRIMER.md`, `docs/api/pro-exclusives.md`, and `DocsScreen.tsx` to document the native ADB hardware driver.

## [1.0.6] - 2026-09-06

### Removed
- Completely removed Shizuku privileged shell helper integration: deleted `modules/pixel-hilight` (Kotlin module + AIDL binder IPC) and `scripts/hilight-probe/`.
- Removed Shizuku connection state, helper bind/unbind logic, and connect action buttons from `useHiLight` and UI surfaces.

### Changed
- Restored `useHiLight` to a pure, honest on-screen simulation and LRA haptic actuator (`availability: 'simulated'`, `source: 'simulated'`) without privileged external dependencies.
- Updated `HardwareAvailability` union type in `src/core/capabilities.ts` to remove `'shizuku'`.
- Synchronized documentation, agent rules (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`), `README.md`, `docs/HARDWARE_API.md`, `docs/AI_PRIMER.md`, `docs/README.md`, `docs/api/pro-exclusives.md`, and in-app `DocsScreen.tsx` to reflect the pure simulation architecture for HiLight.

## [1.0.5] - 2026-09-06

### Changed
- Rebranded framework from **PixelForge** to **PixelKit** (`pixelkit`): reflects its identity as the developer SDK and starter template for the Google Pixel 11 Pro (Tensor G6, Android 17).
- Updated package and application metadata in `package.json` and `app.json` (`name: "PixelKit"`, `slug: "pixelkit"`, `package: "com.pixelkit.sdk"`).
- Renamed canonical documentation from `PIXELFORGE.md` to `PIXELKIT.md` and updated all documentation references, UI wordmarks (`PIXELKIT`), and agent guides (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`).
- Migrated logging prefix from `[PixelForge]` to `[PixelKit]` in `src/core/observability.ts` and `DashboardScreen.tsx` while preserving backward compatibility for stored Gemini API keys.
- Updated Kotlin modules group ID to `com.pixelkit`.

## [1.0.4] - 2026-09-06

### Removed
- `useTemperature`, the `TemperatureReading` type, the `hasThermometer` capability, the Silicon "IR thermometer" card, the Docs entry, and every documentation row and section for it. The Pixel 11 Pro has no thermometer (sensor list checked on device); the hook only ever targeted Pixel 8-10 Pro.

### Fixed
- README: every line had carried a stray prefix since 1.0.2 (a substitution whose escaped pipe became an empty alternation). Restored from 1.0.1 with the intended edits reapplied.
- README, PIXELFORGE, `docs/HARDWARE_API.md`, `docs/AI_PRIMER.md`, `docs/README.md` and the hardware research note: lines that the 1.0.2 and 1.0.3 doc scripts replaced with a literal `$1` are restored.

## [1.0.3] - 2026-09-06

### Added
- `docs/research/HILIGHT_LED_ARRAY.md`: HiLight research with adb-measured facts (eight `LIGHT_TYPE_APPLICATION` lights, ids 1-8, RGB + animation capabilities, 33 ms update period), the `CONTROL_DEVICE_LIGHTS` gate, HiLight Studio internals and safety limits, and the plan for a `shizuku` availability state.
- `scripts/hilight-probe/HiLightProbe.java`: shell-level helper (`app_process`, uid 2000) that enumerates the lights, drives them through `ILightsManager`, reads back and clears with the stuck-LED mitigation sequence. Verified on the Pixel 11 Pro: all eight LEDs accepted a colour in ~3 ms and read back.

### Changed
- Device profile: sensor list confirms no object-temperature sensor on the Pixel 11 Pro; the two "Temperature" sensors are IMU and barometer die temperatures.
- `useHiLight` and the Silicon card describe the real gate (privileged permission, Shizuku path) instead of only "no API".

## [1.0.2] - 2026-09-06

### Added
- `modules/pixel-nano`: local Expo Module (Kotlin) over `com.google.mlkit:genai-prompt:1.0.0-beta4` (ML Kit GenAI Prompt API on AICore). Functions: `checkStatus`, `getModelInfo` (base model name, token limit, thinking/system-prompt/structured-output/caching flags), `download` with progress events, `warmup`, `countTokens`, `generate`, `stream` (tokens and thoughts as events), `setModelConfig` (stable/preview, full/fast). Errors surface as `E_NANO_<ErrorCode>`.
- `useGeminiNano`: on-device Gemini Nano chat with streaming `partial` text, capped transcript re-sent per turn (`buildNanoTurn`), natively measured latency and time-to-first-token, output tokens from the on-device tokenizer and a derived decode rate. No cloud fallback and no simulated reply.
- AI Lab: Gemini Nano section (status, model facts, download, warm-up, latency and decode-rate cards) and a Cloud / On-device engine switch for the conversation and voice input.
- Docs: `useGeminiNano` in DocsScreen, `docs/api/neural-ai.md`, `docs/HARDWARE_API.md`, `docs/AI_PRIMER.md`, README and PIXELFORGE; the Gemini Nano guide now records where the beta4 AAR differs from its sketches.

### Changed
- Build: the module passes `-Xskip-metadata-version-check` (genai-prompt is compiled with Kotlin 2.3; Expo 57 builds with 2.1.20) and pins every `kotlin-stdlib` artifact in the build to the project Kotlin version. Kotlin ≥ 2.3 is rejected by Expo modules, so the project version cannot be raised instead.
- `useTPU` comments and the Dashboard / Docs copy point at `useGeminiNano` for inference metrics instead of "not wired yet".
- Agent guides (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`) list both local modules.

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

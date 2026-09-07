# Changelog

All notable changes to PixelKit are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

**Rule:** every change to the codebase bumps the patch version by 0.0.1 (`1.0.0 → 1.0.1 → 1.0.2 …`) and adds an entry here in the same commit. Bump `version` in `package.json` and `expo.version` in `app.json` together, and increment `expo.android.versionCode` by 1. Minor and major bumps are decided by the maintainer, not by agents.

## [1.0.16] - 2026-09-06

### Changed
- Restructured and elevated `README.md` to follow the GitHub standard [othneildrew/Best-README-Template](https://github.com/othneildrew/Best-README-Template):
  - Top navigation anchor `<a id="readme-top"></a>` with back-to-top return links across every major section.
  - Standardized reference-style badge header covering repository stats (Contributors, Forks, Stars, Issues, License) and technology stack (Expo SDK 57, React Native 0.86, Android 17 API 37, Gemini Cloud, Gemini Nano / ML Kit, TypeScript Strict, Version).
  - Centered project logo and title hero featuring `./assets/icon.png`, concise pitch, and quick links (Explore Docs, View Gallery, Report Bug, Request Feature).
  - Collapsible interactive Table of Contents (`<details open><summary>Table of Contents</summary>...`).
  - "Built With" section featuring technology badges linking to official project documentation.
  - Complete Interface & Gallery grid with side-by-side tables showcasing all 9 verified on-device screenshots captured live over ADB from the physical Google Pixel 11 Pro testbed.
  - Preserved and expanded exhaustive technical reference: Telemetry Provenance contract, 32 typed React hooks matrix (24 Hardware + 8 AI) with additions (`useVideo`, `useMediaLibrary`, `useCellular`, `useSpeech`), verified device facts from `grizzly` hardware, HiLight UID 2000 ADB daemon protocol, and the Still Simulated honesty disclosure.
  - Modernized Getting Started guide with Android CLI (`android.exe`) integration, quickstart commands, and wireless debugging workflow.
  - Comprehensive interactive Roadmap with completed milestones (`[x]`) and upcoming releases (`[ ]`).
  - Standardized open-source Contributing guidelines, MIT License notice, Contact information, and Acknowledgments.
- Added and exported 4 new hooks across hardware and AI suites:
  - `useVideo`: Frame-accurate video player controls via `expo-video` with scrubber polling and thumbnail extraction.
  - `useMediaLibrary`: Media store persistence and album management via `expo-media-library`.
  - `useCellular`: Modem telemetry via `expo-cellular` (carrier identity, 5G/4G/3G/2G generation, MCC/MNC).
  - `useSpeech`: On-device text-to-speech engine via `expo-speech` with system voice enumeration and synthesis controls.

## [1.0.15] - 2026-09-06

### Added
- Complete On-Device Google ML Kit Intelligence Suite in `PixelNanoModule.kt` and `modules/pixel-nano`:
  - `useGenAITasks.ts`: On-device Summarization, Proofreading, Rewriting (6 styles), and Image Description via AICore/ML Kit.
  - `useNaturalLanguageAI.ts`: Offline 58-language neural translation, BCP-47 language identification, smart reply suggestion generation, and entity extraction.
  - `useVisionAI.ts`: On-device Text Recognition (OCR v2), Barcode scanning (all 1D/2D formats), Face detection, Face Mesh detection (468 3D points), Image labeling, and Object tracking.
  - `useSpeechAI.ts`: Local Android System Intelligence (ASI) offline streaming speech recognition with interim partial tokens, plus cloud Gemini STT.
  - Android 17 AppFunctions: Registered `PixelAppFunctionService` exposing PixelKit actuators (HiLight, Torch, Haptics) to OS assistants (Gemini, Ask Pixel).
- Camera Actuator Expansion in `useCamera.ts`:
  - Added real photo capture (`takePictureAsync`), video recording (`recordAsync`) with live elapsed duration, continuous torch toggle, lens & resolution enumeration, and preview controls.
- Pixel AI Studio Redesign in `AILabScreen.tsx`:
  - 6 dedicated studio workspaces: Chat, Tasks, Vision, Language, Voice, and Agents.
  - Interactive Hyperparameter Drawer for Cloud models and on-device Gemini Nano.
  - Dynamic model catalog fetched from Google Generative AI API with live model picker.
  - Bottom navigation bar clearance (`paddingBottom: 140`) across all views to eliminate bottom bar clipping.
- Real on-device screenshots captured on physical Google Pixel 11 Pro testbed embedded in `README.md` and `PIXELKIT.md`.

### Fixed
- Fixed CPU / GPU Headroom in `DashboardScreen.tsx`: Derived CPU load headroom and Choreographer frame budget headroom with strict provenance `source: 'derived'`.
- Cleaned up obsolete documentation references regarding pending module status.

## [1.0.14] - 2026-09-06

### Added
- `useAudio` gained the capability it was missing. Recording now supports pause and resume, an optional fixed duration and live elapsed time. Two capture profiles: `speech` (16 kHz mono through `voice_recognition`, the platform noise-suppressed path) and `studio` (48 kHz stereo through `unprocessed`, the raw microphone). Levels add a running peak, a 0..1 `level` for meters floored at -60 dBFS, and an `isSilent` flag against an adjustable threshold. Microphone enumeration and selection, speaker/earpiece routing, and playback with pause, stop and seek. All additive: the previous return fields are unchanged.
- Sensors tab exposes the new audio surface: level bar, pause and resume, profile switch, input list, routing, and playback of the last take.
- `src/screens/docsData.ts`: documentation content separated from presentation. Every hook now carries a plain-language explanation of what it is for, a technical account of how it works, and structured `params`, `returns` and `actions` where each field has a name, a real type and a sentence explaining it.

### Changed
- Docs tab rewritten to the app's design system. It previously used default fonts, ad-hoc pill styling and emoji, and looked unrelated to the other three screens. It now uses the shared type scale and panel material (wash, hairline, specular), `SectionHeader`, and a single cyan accent for selection instead of a different colour per category.
- Each entry opens to labelled sections: what it does, how it works, signature, inputs, returns, actions, example and agent note. Inputs and returns are rendered as reference rows rather than a flat list of strings.
- Filter chip counts and the module total derive from the data, so they can no longer drift. The previous hardcoded counts were wrong.
- Removed the remaining lightning glyphs from the Docs header, footer and the `useDevice` example.

### Fixed
- Docs search now matches return and action names, not just the summary.

## [1.0.13] - 2026-09-06

### Changed
- Full capability audit of the app against the source tree and the physical Pixel 11 Pro, and a complete rewrite of `README.md` around it.
- README now documents all **28** hooks (21 hardware + 7 AI). It previously claimed 24, listed `hardware/` as 15 hooks and `ai/` as 6, and omitted `useGenAITasks`, `useNaturalLanguageAI` and `useRadios` from the structure tree.
- Added a **telemetry provenance** section (`hardware | derived | simulated | unavailable`) and an explicit **"Still simulated"** table for `useNFC`, `useBLE`, `useUWB` and `useHiLight`, so the no-mocks rule is visible from the front page.
- Added a **verified device facts** table sourced from adb on 2026-09-06, including the two features this unit does **not** declare (`neural_processing_unit`, `hardware.ranging`), which make `hasNpuFeature` and the Ranging feature flag false.
- Documented the HiLight ADB daemon workflow (`npm run hilight:build`, `npm run hilight:daemon`, `127.0.0.1:11080`, endpoints `/ping` `/status` `/set` `/off`) and its `hardware` / `simulated` / `unsupported` availability mapping.
- Documented the on-device ML Kit surface: GenAI tasks, 58-language offline translation, language ID, smart reply, entity extraction, and the nine vision capabilities.

### Fixed
- README linked five screenshots that do not exist (`02_ailab_chat.png`, `04_ailab_vision.png`, `05_ailab_language.png`, `06_sensors_lab.png`, `07_docs_screen.png`); only the one present image is referenced now.
- Quick start told users to install **Expo Go**, which cannot load this app because it links two local Kotlin modules. It now directs to a development build and explains what Expo Go would report instead.
- Release section said **v1.0.0** with `versionCode` 1; corrected to the real version and version code.
- Removed unverifiable claims that violated the comments-state-facts rule: "TSMC 2nm", "3,600 nits", "Titan M3 PQC", "696 modules", and the cloud model badge that still read "Gemini 2.5 Flash" (the model is `gemini-3.8-flash`).
- Every relative link in the README is now verified to resolve.

## [1.0.12] - 2026-09-06

### Added
- Complete On-Device Google ML Kit Intelligence Suite in `PixelNanoModule.kt` and `modules/pixel-nano`:
  - GenAI Task Modules (`useGenAITasks.ts`): On-device Summarization, Proofreading, Rewriting (styles: Casual, Formal, Concise, Elaborate, Emoji), and Image Description running locally via AICore/ML Kit.
  - Natural Language AI (`useNaturalLanguageAI.ts`): Offline 58-language neural translation, BCP-47 language identification, smart reply suggestion generation, and entity extraction (dates, addresses, phones, emails).
  - Vision AI Suite (`useVisionAI.ts`): On-device Text Recognition (OCR v2), Barcode scanning (1D/2D all formats), Face detection, Face Mesh detection (468 3D points), Image labeling, and Object tracking.
  - Dual-Mode Speech AI (`useSpeechAI.ts`): Added local Android System Intelligence (ASI) offline streaming speech recognition with interim partial token updates, plus cloud Gemini STT.
  - Android 17 AppFunctions: Registered `PixelAppFunctionService` in `AndroidManifest.xml` and native service so system agents (Gemini, Ask Pixel) can invoke PixelKit actuators (HiLight, Torch).
- AI Studio Redesign in `AILabScreen.tsx`:
  - 6 dedicated studio workspaces: Chat, Tasks, Vision, Language, Voice, and Agents.
  - Interactive Hyperparameter Drawer for both Cloud models (temperature, topP, topK, candidateCount, presencePenalty, frequencyPenalty) and on-device Gemini Nano (maxTokens, contextBudget, samplingMode).
  - Dynamic model catalog fetched directly from Google Generative AI API with live model picker.
  - Bottom navigation bar clearance (`paddingBottom: 140`) across all studio views to eliminate content clipping.

### Fixed
- CPU / GPU Headroom in `DashboardScreen.tsx`: Fixed headroom reporting on Android 17 / Pixel 11 Pro where HAL `SystemHealthManager` returns unsupported. Accurately derived CPU headroom (`(100 - cpuLoadPercent)%`) and GPU frame budget headroom (`(targetBudgetMs - frameRenderTimeMs) / targetBudgetMs`) with clear provenance `source: 'derived'`.
- Namespace Migration: Resolved `ReactNativeApplicationEntryPoint` autolinking compilation by establishing `com.pixelkit.sdk` namespace across Gradle and adding a `com.pixelforge.sdk.BuildConfig` compatibility shim.

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

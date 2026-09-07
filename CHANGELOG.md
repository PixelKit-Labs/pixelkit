# Changelog

All notable changes to PixelKit are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/).

**Rule:** every change to the codebase bumps the patch version by 0.0.1 (`1.0.0 → 1.0.1 → 1.0.2 …`) and adds an entry here in the same commit. Bump `version` in `package.json` and `expo.version` in `app.json` together, and increment `expo.android.versionCode` by 1. Minor and major bumps are decided by the maintainer, not by agents.

## [1.0.26] - 2026-09-07

### Added
- `src/core/surface.ts`: one home per hook. Every exported hook now declares the tab and section that demonstrates it, and the sub-tab rows on all four screens are generated from the same map, so the app's structure and the SDK's contents cannot drift apart.
- `src/components/ScreenScaffold.tsx` with `ScreenHeader` and `SectionTabs`. Every screen now shares one header treatment and one navigation control instead of three; a screen that owns its own scrolling (AI Lab) composes the two pieces directly.
- **Nine hooks that were documented but had no interface anywhere** are now demonstrated: `useCamera`, `useVideo` and `useMediaLibrary` in Sensors → Capture (preview, still, 15 s clip, playback with speed and poster frames, save to the gallery); `useNetwork` and `useCellular` in Silicon → Network; `useRadios` and `useLocation` in Sensors → Radios; `useSecurity` in Sensors → Security with a real write, read-back and delete; and `useSpeech` in AI Lab → Voice, which reads the last model reply aloud.
- Gemini Nano model lifecycle in AI Lab: download when the status is `downloadable`, warm-up, prompt token count against `info.tokenLimit`, and a stable/preview track switch — none of which had a control before, so a device reporting `downloadable` had no way to fetch the model from the app. The measured latency, time to first token, decode rate and output tokens are now displayed rather than only recorded.
- Silicon → Trace: slowest traced operations, per-module error counts and a diagnostics reset, from the observability readers added in 1.0.19.
- `npm run parity` (`scripts/check-parity.js`, `scripts/parity-waivers.json`) and `npm run verify`. The check fails when an exported hook has no home, when a home screen never calls its hook, when a documented function has no control anywhere without a waived reason, and when a handler that takes arguments is passed straight to `onPress`.
- Docs tab entries now show **where to try it**, e.g. "Sensors → Capture", read from the surface map.

### Changed
- Silicon is four sections (Compute · System · Network · Trace) instead of one twelve-section scroll, and it keeps the chip and the system: actuators, radios and biometrics moved to Sensors, where each now appears exactly once. Display, UWB, HiLight, the torch, the barometer and biometrics had each been rendered on two screens with different wording.
- Sensors is six sections (Motion · Capture · Audio · Actuators · Radios · Security) and gained the missing controls: stop UWB ranging, stop a BLE scan, queue an NFC text write, seek within a recording, select a microphone.
- AI Lab gained the rest of the generation parameters (`topP`, `maxOutputTokens`, `thinkingBudget`, system instruction) and a clear-chat control, and three more on-device detectors (objects, pose, subject segmentation) that the hook exposed but nothing called.
- Agent guides gained rules 12 and 13: one home per hook, and screens share their frame. `npm run verify` replaces `npm run typecheck` as the validation gate.

### Fixed
- `DashboardScreen` passed `onPress={uwb.startRanging}` directly, so React Native handed the press event in as the `sessionId` argument. The parity check now fails on that shape anywhere in the app.
- Neither screen offered a way to stop a UWB ranging session: both start buttons disabled themselves while ranging, leaving the session open until the app was killed.

## [1.0.25] - 2026-09-07

### Removed
- The `native / live` status chip in the app header (`App.tsx`). The wordmark now stands alone in the top bar; the `topBar` style drops `justifyContent: 'space-between'`. Native-module availability is still reported per hook through `source` and on the Silicon screen.

## [1.0.24] - 2026-09-06

### Added
- Real physical battery temperature and electrical telemetry engine in `PixelNative` (`PixelNativeModule.kt`) and `useDevice` (`src/hardware/useDevice.ts`):
  - `batteryTemperatureC`: Real-time temperature of the lithium battery pack from its NTC thermistor via `BatteryManager.EXTRA_TEMPERATURE` in 0.1 °C units.
  - `batteryVoltageMv`: Instantaneous cell terminal voltage from the PMIC ADC via `BatteryManager.EXTRA_VOLTAGE`.
  - `batteryCurrentMa`: Instantaneous current flow in mA via `BatteryManager.BATTERY_PROPERTY_CURRENT_NOW` (negative discharging, positive charging).
  - `batteryCurrentAvgMa`: Rolling average current draw in mA via `BatteryManager.BATTERY_PROPERTY_CURRENT_AVERAGE`.
  - `batteryPowerWatts`: Real-time power draw or fast-charging rate in Watts (derived from V × |I|).
  - `batteryHealth`: Hardware health enum (`GOOD`, `OVERHEAT`, `DEAD`, `OVER_VOLTAGE`, `COLD`, `UNKNOWN`) via `BatteryManager.EXTRA_HEALTH`.
  - `batteryCycleCount`: Lifetime charge cycle count from the battery EEPROM via `BatteryManager.EXTRA_CYCLE_COUNT` (Android 14+).
  - `batteryChargeCounterMah`: Remaining charge capacity in mAh via `BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER`.
  - `batteryEnergyCounterMwh`: Remaining stored energy in mWh via `BatteryManager.BATTERY_PROPERTY_ENERGY_COUNTER`.
  - `pluggedSource`: Charging source (`AC`, `USB`, `WIRELESS`, `DOCK`, `NONE`) via `BatteryManager.EXTRA_PLUGGED`.
  - `thermalZones`: Opportunistic probe of kernel `/sys/class/thermal/thermal_zone*` when readable.
- Silicon HUD (`DashboardScreen.tsx`) updated:
  - Hero telemetry bar now displays live `battery temp` (°C) with warning tinting when above 42°C.
  - "Thermal & ADPF headroom" section gained a dedicated "Battery temperature" card (`Fuel gauge NTC thermistor • cell temp`).
  - "Power & atmosphere" section expanded into "Power & electrical telemetry", with live cards for Battery percentage, Power draw / rate (Watts and mA), Remaining charge (mAh), and cell voltage (mV).

## [1.0.23] - 2026-09-06

### Added
- Every documented function now states its inputs and its outputs. `docs/api/*.md` gained an **Inputs** table (each argument with its type, default and units), an **Outputs** table (every returned field with what it means and what `null` means there) and a **Functions** table (per-callable: what each parameter does, what the call resolves to, and what a failure looks like) for all 32 hooks plus `geminiClient`, the observability API, and the `PixelNative` and `PixelNano` native modules with their event payloads.
- `docs/HARDWARE_API.md` rebuilt around the same three sections per hook, with the field-by-field tables linked rather than duplicated so the two cannot drift.
- Guides now carry function contracts: the tool registry, tool declarations, cloud and on-device agent loops, AppFunctions and the routing helper in `docs/guides/function-calling.md`; microphone preparation, the PCM mic and speaker, on-device recognition, ephemeral tokens, the Live agent hook and both text-to-speech paths in `docs/guides/voice.md`; the native Prompt API surface, `NanoOptions`, the hook, structured-output shapes and the hybrid router in `docs/guides/on-device-ai-gemini-nano.md`.
- In-app Docs tab renders the same contract: `DocField` gained optional `inputs` and `output`, `DocsScreen` renders them as nested **TAKES** and **GIVES BACK** blocks, and every callable in `docsData.ts` now carries them.
- Plain-language explanation of thermal headroom in `docs/api/silicon-compute.md`, linked from `docs/HARDWARE_API.md`: it is a ratio of the current thermal state to the throttling threshold, not a temperature.
- Troubleshooting entry for "a hook returns null and its source says unavailable", with the five real causes and how to check each.

### Changed
- `README.md` no longer carries images. The shield badges, the logo, the nine-screenshot gallery and the badge reference definitions are gone; **Built With** is a plain list with links, and the screenshot files have been deleted from the repository along with the gallery in `PIXELKIT.md`.
- `docs/AI_PRIMER.md` hook table rebuilt with Inputs, Key outputs and Functions columns, replacing entries that listed fields the hooks do not return.
- `docs/ai-guidance/recipes.md` rewritten: every recipe states what it takes and gives back. Fixed three broken examples — `useSensors` no longer returns `setUpdateInterval` (the interval is an argument), `thermalHeadroom` is nullable and was being multiplied, and `onPress={startRanging}` was passing the press event as a session id.
- Corrected contracts that did not match the code: `reportWorkDuration` returns a verdict and does not call `PerformanceHintManager`; `playEnvelope` and `playPrimitives` return `boolean`; `setTorch` and `toggleTorch` resolve `boolean`; `startStrobe` takes an interval; `refreshLocation` resolves `boolean`; `pickImage` takes a camera flag and resolves a URI and base64; `setRecognitionMode` takes `'on-device'`, not `'offline'`; `useSensors` defaults to 100 ms.
- Removed device claims that cannot be read from the device: the process node, peak-nits figures, and post-quantum protection, which `useSecurity` reports as `false`. `docs/getting-started/architecture.md` now separates verified readings from Google's published specification.

## [1.0.22] - 2026-09-06

### Added
- Thermal headroom architecture guide in `docs/api/silicon-compute.md` and `docs/HARDWARE_API.md` detailing `PowerManager.getThermalHeadroom` ratio mechanics (0.0 cool … 1.0 throttling point), verified 0.55 idle baseline on Tensor G6, per-status thresholds (`thermalThresholds`), and ADPF workload shedding strategies.
- In-app Docs tab (`DocsScreen.tsx`, `docsData.ts`): added nested action I/O cards displaying structured `TAKES` (argument names, types, descriptions) and `GIVES BACK` (resolved promises and error shapes) for every callable function.

## [1.0.21] - 2026-09-06

### Changed
- Comprehensive API and documentation audit across the 32-hook suite.
- Synchronized `README.md` Hook Matrix and Honesty Matrix with real native NDEF read/write capabilities in `useNFC()` and active hardware BLE peripheral discovery in `useBLE()`.
- Added complete Function Calling registry contract and tool specifications to `docs/guides/function-calling.md`.
- Expanded `useVisionAI()` and `geminiClient` references in `docs/HARDWARE_API.md` and `docs/api/neural-ai.md` with explicit parameter signatures and typed return structures.
- Verified on-device execution on Google Pixel 11 Pro (Tensor G6, Android 17 API 37) with 0 TypeScript errors and Hermes Android export verified.

## [1.0.20] - 2026-09-06

### Changed
- README header rewritten. The old subtitle read "32 typed React hooks over real Android telemetry, two local Kotlin Expo Modules, and an app that refuses to invent a number", which described the project from the inside: it counted internal modules nobody choosing a library asks about, and compressed the no-simulation rule into a riddle that only makes sense to someone who already knows it. It now walks the actual surface by domain (silicon and thermals, camera and video, microphone and speech, radios, biometrics and keystore, the camera-bar LEDs, on-device Gemini) and states the rule plainly as its own line.

## [1.0.19] - 2026-09-06

### Added
- Observability layer rebuilt in `src/core/observability.ts`. `traced` times an operation, gives it a correlation id, records the duration as a metric and logs success or failure; nested calls inherit the parent id, so a single user action can be followed end to end. `tracedSafe` does the same where a failure is survivable. `normalizeError` reduces native `CodedException`s, `Error`s and thrown strings to one shape, and `logError` records them and counts them per module. New readers: `getTraces`, `getSlowestTraces`, `getTrace(id)`, `getErrorCounts`, `getHealthSummary`, `resetObservability`. Operations slower than 1.5 s log at warn level.
- Real NFC. `PixelNativeModule` gained `startNfcReader`, `stopNfcReader`, `writeNdefText` and `isNfcReaderActive`, driving `NfcAdapter` reader mode on the foreground Activity. Tags raise `onNfcTag` carrying the identifier, supported technologies, NDEF capacity, writability and decoded records; text records have their language prefix stripped and URI records are resolved. Writing formats an unformatted tag where the tag allows it.

### Changed
- **Nothing in the SDK is simulated, and the type system now enforces it.** `TelemetrySource` is `'hardware' | 'derived' | 'unavailable'` and `HardwareAvailability` is `'hardware' | 'unavailable' | 'estimated' | 'unsupported'`. The `simulated` member is gone from both, so a fabricated reading no longer compiles.
- `useNFC` rewritten on the native reader: real tag reads and NDEF writes, tag count, pending write state and write outcome. It previously returned a hardcoded placeholder tag.
- `useHiLight` no longer mirrors its state on screen when the daemon is absent. Availability is `unavailable` and the controls refuse rather than implying a colour was shown.
- Ten hooks had no observability at all and now carry traces, surfaced errors and provenance: `useBiometrics`, `useSecurity`, `useLocation`, `useSensors`, `useNetwork` and `useNFC` among them.
- `MetricCard` dropped its SIMULATED badge. The Silicon and Sensors screens no longer label anything as simulated.

### Fixed
- `useNetwork` claimed `isConnected: true` on WIFI before any read had happened. It now starts UNKNOWN and disconnected, and requires both an attached interface and a reachable route before reporting connected.
- `useSensors` reported a standing 1013.25 hPa before the barometer produced a sample. Pressure and altitude are null until a real reading arrives, per-sensor availability is reported separately, and `isAvailable` starts false.
- Empty `catch` blocks across the hooks discarded failures silently. Errors are now logged, counted and surfaced through an `error` field.
- `useBiometrics` treated a user cancel and a genuine failure identically. It now distinguishes them and sets `error` only when the call itself failed.

### Rules
- `AGENTS.md`, `CLAUDE.md` and `GEMINI.md` (kept identical): rule 3 rewritten as **Nothing is simulated**; new rule 10 **Observability on every function**, requiring `traced`, a surfaced error and a `source` field with no empty catch; new rule 11 **Documented before it is done**, requiring JSDoc, a typed `docsData.ts` entry, the `docs/api/*` section and the README row before a function counts as finished.
- Every project document scrubbed of simulation claims.

## [1.0.18] - 2026-09-06

### Added
- Genuine physical Bluetooth Low Energy discovery in `useBLE` via Android `BluetoothLeScanner` (`PixelNative.startBleScan`, `stopBleScan`, `getDiscoveredBleDevices`). Discovers real nearby peripherals with MAC address, name, verified RSSI (dBm), and estimated distance derived from the log-distance path loss model, eliminating simulated placeholders.
- Hardware UWB ranging session management in `useUWB` via `PixelNative.startUwbRanging` and `stopUwbRanging`, querying Android 14+ `RangingManager` and `UwbManager` with honest HAL state reporting.
- Production release signing pipeline in `android/app/build.gradle` supporting `PIXELKIT_UPLOAD_STORE_FILE` gradle properties and `PIXELKIT_RELEASE_KEYSTORE_PATH` environment variables with debug fallback.
- EAS Build configuration in `eas.json` with `development`, `preview` (standalone APK), and `production` (Google Play AAB) build profiles.
- Release obfuscation and shrinkage keep rules in `android/app/proguard-rules.pro` for `expo.modules.pixelnative`, `expo.modules.pixelnano`, ML Kit, and Google Play Tasks.
- Android 17 AppFunctions execution support via `PixelNative.executeAppFunction` wired directly into `AILabScreen.tsx` for real-time actuator testing across 10 system tools (haptic envelopes, rear torch levels, radio discovery, thermal diagnostics, and ML Kit models).

### Changed
- `useBLE` and `useUWB` report genuine hardware provenance (`source: 'hardware'`) when backed by `PixelNative`.
- `SensorsLabScreen` now features real-time BLE spectrum discovery cards with signal strength badges and distance estimates, as well as live UWB session telemetry.
- Updated in-app documentation in `src/screens/docsData.ts` and reference markdown (`docs/HARDWARE_API.md`, `docs/api/radios-security.md`, `docs/api/pro-exclusives.md`, `README.md`, `PIXELKIT.md`) to reflect active BLE scanning and UWB session handling.

## [1.0.17] - 2026-09-06

### Added
- `useCamera` can now capture. It previously held interface state only and could not take a photo or record video. Adds a `CameraView` ref the hook drives, `takePicture` (resolving with a file, dimensions and optional base64 for the AI hooks), `startRecording` and `stopRecording` with duration and size limits and live elapsed time, torch, picture/video mode, available lenses and picture sizes, and preview pause and resume.
- `useVideo` (`expo-video`): playback of a local file or remote stream with position, duration, buffered position, status, seek, playback rate, loop, mute, volume, keep-screen-on and frame thumbnails. Plays back what `useCamera` records.
- `useSpeech` (`expo-speech`): text to speech, the output half of voice. Installed voices with language and quality, rate and pitch, and a `speak` that resolves when the utterance finishes so calls can be sequenced. Rejects text over the engine limit rather than truncating it.
- `useMediaLibrary` (`expo-media-library`): saves captures into the user's gallery so they survive, using the SDK 57 class API; lists recent items, creates albums, deletes. Reports Android 13+ limited access.
- `useCellular` (`expo-cellular`): radio generation from 2G to 5G, carrier name, ISO country, mobile country and network codes, VoIP support. Answers what `useNetwork` cannot, namely whether a cellular connection is actually 5G and who is serving it.
- `READ_PHONE_STATE` permission and the `expo-media-library` config plugin in `app.json`.

### Fixed
- `useCamera` zoom was wrong. `expo-camera` takes a 0..1 fraction of the lens range, but the hook defaulted to `1.0`, which is maximum zoom, and clamped input to 0.5..120 so any "5x" style value was passed straight through out of range. Zoom is now a 0..1 fraction with `setZoomStep` for discrete stops, and the documentation says so explicitly.
- Docs data carried duplicate entries for the four new hooks after two agents added them concurrently. The set that matches the shipped implementations is kept.

### Changed
- Reference documentation brought back in sync, which the previous two releases had missed: `docs/HARDWARE_API.md`, `docs/api/system-media.md`, `docs/api/neural-ai.md`, `docs/api/sensors-actuators.md` and `docs/AI_PRIMER.md` now cover capture, playback, speech, media library and cellular.
- In-app Docs gained entries for the four new hooks and a rewritten `useCamera` entry, taking the reference to 32 modules.

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

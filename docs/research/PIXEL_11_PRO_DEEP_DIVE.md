# Pixel 11 Pro Deep Dive: Round 2 Research & Corrections

> **Date:** 2026-09-05 · **Scope:** What the first pass ([PIXEL_11_PRO_HARDWARE_RESEARCH.md](./PIXEL_11_PRO_HARDWARE_RESEARCH.md)) missed or got wrong, verified against primary sources and the Android CLI's offline documentation knowledge base (`android docs search` / `android docs fetch`, 5,174 indexed articles).

---

## 1. Corrections to Round 1

| Round 1 said | Reality | Impact |
| :--- | :--- | :--- |
| Use `androidx.core:core-uwb` for real UWB ranging | **Android 16 ships `android.ranging.RangingManager`**, a unified platform API over UWB, Bluetooth Channel Sounding, Wi-Fi NAN RTT and BLE RSSI. Android 17 adds UWB DL-TDoA on top. Permission: `android.permission.RANGING` (NEARBY_DEVICES group). | Rename `useUWB` plan to **`useRanging`**; UWB becomes one technology inside it. |
| `expo-widgets` for home-screen widgets | `expo-widgets` is **iOS only** (WidgetKit / Live Activities). | Android widgets need a Glance/RemoteViews Expo Module. |
| ML Kit Prompt API artifact `1.0.0-beta2` | Release notes: **beta3 (July 14 2026)** added multi-image + 4,096 output tokens; **beta4 (July 21 2026)** fixed Nano v4 compatibility and streaming. The get-started page still prints beta2. | Use `com.google.mlkit:genai-prompt:1.0.0-beta4`. |
| Nano is single-turn, so prepend a system prompt manually | **System Instructions API (Beta)** exists: `SystemInstruction("...")` as a request part, Nano V3+. Multi-turn is still unsupported. | Use `SystemInstruction` for behaviour, keep transcript-in-prompt for history. |
| Structured output uses `@Generable` from `genai-prompt` | It ships as separate **GenAI Schema APIs 1.0.0-alpha1**: `genai-schema` + `genai-schema-compiler` (KSP). | Add the KSP compiler to the module's Gradle. |
| Gemini Nano has no function calling, full stop | **Gemma 4 (AICore Developer Preview)** has native tool calling; Google says "tool calling, structured output, system prompts, thinking" are coming to the Prompt API during the preview and "code written for Gemma 4 will work automatically on Gemini Nano 4-enabled devices". | Keep the structured-output emulation now; design the registry so native tool calls drop in later. |
| `@google/genai` docs show `client.interactions.create` | npm latest is still **2.21.0** (published 2026-09-02) and it has **no `interactions`** surface. `generateContent`, `chats`, `live`, `authTokens` are correct for the installed SDK. | Guides are correct; re-check when 3.x ships. |
| Satellite SOS has no third-party API | `SatelliteManager` is signature-permission only, **but** Android 16 QPR2 / 17 added **constrained satellite networks** for third-party apps: manifest `android.telephony.PROPERTY_SATELLITE_DATA_OPTIMIZED` opt-in plus `NetworkCapabilities.TRANSPORT_SATELLITE` / `NET_CAPABILITY_NOT_BANDWIDTH_CONSTRAINED` detection. | New `useSatellite` hook is feasible: detect satellite transport and throttle data. |
| CameraX Extensions "available since Pixel 6" | Google removes extension support on some devices for apps on **CameraX ≤ 1.5 starting 2026-11-01**. | Any `useCameraExtensions` module must use `androidx.camera:*` **1.6+**. |
| Tensor G6 process node 2 nm vs 3 nm | Still unresolved across sources. | Unchanged: do not hard-code. |

---

## 2. Store & Platform Deadlines That Bind the Template

| Requirement | Date | Status for PixelForge |
| :--- | :--- | :--- |
| New apps and updates must target **API 36** (Android 16) | **2026-08-31** (passed; extension possible to 2026-11-01) | Expo 57 defaults compileSdk/targetSdk 36. Moving to 37 via `expo-build-properties` is safe and forward-compatible. |
| Native libraries must be **16 KB page-size** aligned | Enforcement **2027-02-01** | RN ≥ 0.77 is aligned; every local Expo Module and third-party `.so` (ML Kit, LiteRT, BLE libs) must be verified with Android Studio's APK Analyzer "Alignment" tab or `zipalign -c -P 16`. |
| CameraX Extensions require **CameraX 1.6+** on some devices | 2026-11-01 | Applies to P1 camera work. |
| Apps targeting 36+ get **edge-to-edge enforced**, predictive back on by default, large-screen orientation/resizability attributes ignored on ≥600 dp | Already active | RN 0.86 (Expo 57) carries the edge-to-edge fixes. `app.json` already sets `predictiveBackGestureEnabled`. Fold requires adaptive layouts. |

---

## 3. Platform APIs Missed in Round 1 (Android 16 + 17)

Grouped by which PixelForge hook they change. All verified in the Android 16/17 "Features and APIs" pages.

### 3.1 Performance & thermals (turns `useADPF` from simulated into real)

- `PowerManager.getThermalHeadroom(forecastSeconds)` → 0.0 (none) to 1.0 (severe); poll at most every 10 s or you get `NaN`. `getCurrentThermalStatus()`, `addThermalStatusListener()`. Android 15 added `getThermalHeadroomThresholds()`.
- **Android 16** `SystemHealthManager.getCpuHeadroom(CpuHeadroomParams)` / `getGpuHeadroom(GpuHeadroomParams)`: the real CPU/GPU headroom numbers `useADPF` currently fabricates from FPS.
- `PerformanceHintManager` sessions for frame-work duration reporting (what `reportWorkDuration` should call).
- **Android 17** `ProfilingManager` system triggers: `TRIGGER_TYPE_COLD_START`, `TRIGGER_TYPE_OOM`, `TRIGGER_TYPE_KILL_EXCESSIVE_CPU_USAGE`, `TRIGGER_TYPE_ANOMALY` (fires **before** the memory limiter kills the app). `ApplicationStartInfo.getStartComponent()`. `JobScheduler.getPendingJobReasonStats()` (17), `getPendingJobReasons/History()` (16).
- Android 17 app memory limits: killed apps carry `"MemoryLimiter"` in `ApplicationExitInfo.getDescription()`.

### 3.2 Display (`useDisplay`, `useGPU`)

- **Adaptive Refresh Rate (Android 16)**: `Display.hasArrSupport()`, `Display.getSuggestedFrameRate(int)`, `Display.getSupportedRefreshRates()`. Pair with `Surface.setFrameRate()` so 120 Hz is requested only when animating.
- AGSL `RuntimeColorFilter` / `RuntimeXfermode` for GPU effects (Android 16).

### 3.3 Haptics (`useHaptics`)

- **Android 16 envelope APIs**: `VibrationEffect.BasicEnvelopeBuilder` (intensity + sharpness control points, must end at 0 intensity, ≤16 points recommended) and `WaveformEnvelopeBuilder` (amplitude + frequency in Hz, uses the device FOAM via `VibratorFrequencyProfile`). Gate on `Vibrator.areEnvelopeEffectsSupported()`; there is **no fallback**, so keep `Composition` primitives (`PRIMITIVE_CLICK`, `PRIMITIVE_THUD`, ...) as the fallback tier. `expo-haptics` cannot express any of this; a native module is required for "Gemini thinking" ramps or HiLight-synchronised pulses.

### 3.4 Camera (`useCamera`)

- **Android 16**: hybrid auto-exposure (`CONTROL_AE_PRIORITY_MODE_SENSOR_SENSITIVITY_PRIORITY` / `..._EXPOSURE_TIME_PRIORITY`), precise white balance (`COLOR_CORRECTION_MODE_CCT`, `COLOR_CORRECTION_COLOR_TEMPERATURE`, `COLOR_CORRECTION_COLOR_TINT`), `EXTENSION_NIGHT_MODE_INDICATOR` in `CaptureResult` (tells you when to switch to Night), `ImageFormat.HEIC_ULTRAHDR`, `ACTION_MOTION_PHOTO_CAPTURE` intents, APV codec (`MIMETYPE_VIDEO_APV`).
- **Android 17**: `ImageFormat.RAW14`, vendor-defined extensions, camera device type (built-in / external / virtual), `CameraCaptureSession.updateOutputConfigurations()`, `MediaRecorder.setVideoEncodingQuality()` constant-quality mode, VVC/H.266 decode.
- `expo-camera` exposes none of these. A `useCameraPro` module over CameraX 1.6 + Camera2 interop is the path to Camera Looks-like tone control (CCT/tint) and Night detection.

### 3.5 Connectivity (`useRanging`, `useNetwork`, `useBLE`, new `useSatellite`)

- **`RangingManager`** (16): `createRangingSession(executor, callback)`, `RangingPreference(DEVICE_ROLE_INITIATOR | RESPONDER, config)`, OOB configs (`OobInitiatorRangingConfig` with intervals, `RANGING_MODE_AUTO`, `SECURITY_LEVEL_BASIC`) or raw (`RawInitiatorRangingConfig` + `UwbRangingParams` / `BleCsRangingParams` / `RttRangingParams`), results via `onResults` → `RangingData` (distance, azimuth, elevation). Only UWB may range in background. iOS interop through raw UWB `CONFIG_UNICAST_DS_TWR`.
- **Android 17 UWB DL-TDoA**: `DlTdoaRangingParams.Builder` or `createFromFiraConfigPacket()`; needs `ACCESS_FINE_LOCATION` (+ background location if ranging in background).
- Secure Wi-Fi ranging `SecureRangingConfig` (802.11az, AES-256).
- `CompanionDeviceManager.startObservingDevicePresence()` + `CompanionDeviceService.onDevicePresenceEvent()` (16); Android 17 profiles `DEVICE_PROFILE_MEDICAL`, `DEVICE_PROFILE_FITNESS_TRACKER`; `setExtraPermissions()` bundles nearby permissions in one dialog.
- **Constrained satellite networks** (16 QPR2 / 17): manifest `<meta-data android:name="android.telephony.PROPERTY_SATELLITE_DATA_OPTIMIZED" android:value="PACKAGE_NAME"/>`; `NetworkRequest` must `removeCapability(NET_CAPABILITY_NOT_BANDWIDTH_CONSTRAINED)`; detect `nc.hasTransport(TRANSPORT_SATELLITE)` and go burst-mode. FCM has special guidance.
- `ACCESS_LOCAL_NETWORK` runtime permission (17) for mDNS/LAN discovery; `SubscriptionInfo.getStreamingAppMaxDownlinkKbps()`.
- Encrypted Client Hello (17) via Network Security Config `<domainEncryption>`.

### 3.6 Security (`useSecurity`, `useBiometrics`)

- **`AdvancedProtectionManager`** (17): detect Android Advanced Protection Mode and harden the app (disable sideload-dependent flows, hide high-risk features).
- **ML-DSA** hardware keys via JCA (17), `KeyStoreManager.grantKeyAccess(alias, uid)` / `revokeKeyAccess` (16), HPKE SPI, hybrid PQC APK signing (new classical key required; Play App Signing will offer it).
- Credential Manager: Restore Credentials, Identity Check, passkey autofill (16). Android skill `restore-credentials` exists.
- System location button (`USE_LOCATION_BUTTON`, 17) and Android contacts picker (`ACTION_PICK_CONTACTS`, 17) replace broad permissions.

### 3.7 Notifications & UX (`useLiveUpdates`, `useHandoff`)

- **Live Updates**: `Notification.ProgressStyle` with points/segments (16); Android 17 adds **semantic colours** (`SEMANTIC_STYLE_INFO | SAFE | CAUTION | DANGER`) on `Notification`, `Notification.Metric`, `ProgressStyle.Point/Segment`. Bridges to Pixel Watch 5 At-a-Glance.
- **Handoff** (17): `Activity.setHandoffEnabled(true, HandoffActivityParams)` + `onHandoffActivityDataRequested()` → `HandoffActivityData`; app-to-app or app-to-web fallback.
- **Dedicated Assistant volume stream** (17): playback with `AudioAttributes.USAGE_ASSISTANT` now has its own volume; `AudioManager.MODE_ASSISTANT_CONVERSATION` for assistant apps. Directly relevant to the [Voice guide](../guides/voice.md) speaker setup.
- Interactive PiP (`USE_PINNED_WINDOWING_LAYER`), bubbles / bubble bar on large screens, `ChooserSession.getInitialRestingBounds()`.

### 3.8 Health (`useHealthConnect`)

- Health Connect **medical records in FHIR** (16, immunisations first), `ACTIVITY_INTENSITY` (WHO), **Device Data Providers** (17) to separate hardware-verified from app-written data.

### 3.9 Foldable (`useFoldPosture`)

- Jetpack WindowManager `WindowAreaController` **rear display mode** (move activity to the outer screen, e.g. rear-camera selfies) and **dual-screen mode**, plus `FoldingFeature` posture (flat, half-opened, tabletop, book) and `Sensor.TYPE_HINGE_ANGLE`. Dual Screen Preview is a Pixel Fold camera feature that a third-party camera can replicate with rear display mode.

### 3.10 Misc

- `Build.SDK_INT_FULL` / `VERSION_CODES_FULL` / `getMinorSdkVersion()` (16) for quarterly release gating.
- `AlarmManager.setExactAndAllowWhileIdle(OnAlarmListener)` (17) for socket keep-alive without wakelocks.
- ICU 78, Unicode 17, OpenJDK 21/25 (17).

---

## 4. On-Device AI: What Changed in 2026

| Date | Change |
| :--- | :--- |
| 2026-01-28 | Prompt API **beta1**; **Speech Recognition API** released; explicit cache management; faster large-image handling. |
| 2026-04-02 | Prompt API **beta2**: **model selection** (`ModelConfig { releaseTrack = ModelReleaseTrack.PREVIEW; preference = ModelPreference.FULL }`), preview model downloads for AICore Developer Preview testers. Gemma 4 E2B/E4B announced in AICore DP. |
| 2026-07-14 | **Structured Output**, **System Instructions**, **Thinking Mode**; Prompt API **beta3** with multi-image and 4,096 output tokens; **GenAI Schema APIs alpha1** (`genai-schema`, `genai-schema-compiler`). |
| 2026-07-21 | Prompt API **beta4**: Gemini Nano **v4** compatibility, `checkStatus()` fix on non-Pixel, `generateContentStream()` fix. |
| 2026-08-11 | Pixel 11 launch: **Gemini Nano 4** (nano-v4 tier), 140+ languages, better multimodal, "4x faster, 60% less battery" than the previous Nano. |

**AICore Developer Preview** (enrol: aicore-experimental Google group → Play tester for AICore → AICore Beta → pick a preview model in the AICore app; Wi-Fi download, ~1 min first inference). Gives Gemma 4 E2B (3x faster) / E4B today; **tool calling, structured output, system prompts, thinking** announced for the Prompt API surface. Quota bypass is Pixel-only. Expect `BUSY` under frequent testing.

**Two non-AICore paths for custom models on the Tensor G6 TPU:**
- **LiteRT-LM**: runs `.litertlm` LLMs (Gemma4-E2B, Gemma3-1B) on NPU; **Tensor_G6 and Tensor_G5 are listed**; models are per-SoC downloads (658 MB to 2.96 GB); Android NDK r28b+. This is the route if the app must bundle its own LLM or run on non-AICore phones (`react-native-ai-core` already wraps it as a fallback).
- **LiteRT Tensor SDK** (`CompiledModel` AOT): only **Tensor_G5** listed as of this check; no on-device JIT; Linux x86_64 toolchain. Re-check for G6 before committing.
- **AI Edge Gallery** app is the reference for NPU-accelerated Gemma on Android.

**Firebase AI Logic hybrid** (Kotlin): `firebase-ai:17.16.0` + `firebase-ai-ondevice:16.0.0-beta05`, `InferenceMode.PREFER_ON_DEVICE`; on-device still lacks function calling, structured JSON, multi-turn, audio. Our JS router mirrors it.

---

## 5. Pixel 11 Software Features (no public API, but UX cues)

Gemini multi-step actions across 40+ apps; **Rambler** (rambling voice input turned into clean text); **Sign-to-text**; **Live Translate** with video/audio dubbing on Tensor G6; **Instant Night Sight** (4.5x faster, **Pro / Pro XL only**); **Circle to Search** in the viewfinder; **Creator Suite** teleprompter + Storyboard; Magic Capture (~400 frames → 12 MP still + video); Camera Looks (9 looks). Third-party apps reach adjacent capability through AppFunctions (be callable by Gemini), CameraX Extensions (Night/HDR/Bokeh), and Gemini Nano (Rambler-style rewriting via the Rewriting API).

---

## 6. Toolchain Findings

### 6.1 Android CLI (v1.0.16261425) is more than `describe`

| Command | Use for PixelForge |
| :--- | :--- |
| `android docs search "<query>"` / `android docs fetch kb://…` | Offline official Android docs (5,174 articles). Agents should use this **before** web search for Android APIs. |
| `android skills list | find | add <id>` | Installs Google-maintained agent skills into `.agents/skills/`. |
| `android run`, `android install`, `android emulator`, `android layout`, `android screen` | Build/deploy, fast APK install, AVD control, UI tree, screenshots. |
| `android create` | New Android project templates (useful for a standalone AppFunctions service). |

Available skills (Sept 2026): `adaptive`, `agp-9-upgrade`, `android-cli`, `android-intent-security`, `android-profiler`, `appfunctions`, `camerax`, `display-glasses-with-jetpack-compose-glimmer`, `edge-to-edge`, `engage-sdk-integration`, `leanback-to-compose-tv-migration`, `media3-cast-integration`, `migrate-xml-views-to-jetpack-compose`, `navigation-3`, `play-billing-library-version-upgrade`, `play-policy-insights`, `r8-analyzer`, `restore-credentials`, `styles`, `testing-setup`, `verified-email`, `wear-compose-m3`.

**Recommend installing** into the template: `appfunctions`, `camerax`, `adaptive`, `edge-to-edge`, `android-profiler`, `android-intent-security`, `play-policy-insights`, `testing-setup`, `restore-credentials`.

### 6.2 Expo 57 specifics

- `expo prebuild` now **cleans native folders by default** (`--no-clean` to keep). Any manual `android/` edits must live in config plugins or local modules, which is what the guides already assume.
- Hermes V1 memory regression (worklets/reanimated) fixed in 57.0.9; startup regression fixed in 57.0.17. Project is on **57.0.20**.
- Reanimated 4.5 / worklets 0.10 / gesture-handler 2.32 for 120 Hz UI.
- `expo-widgets` iOS only; Android needs Glance.
- Not in the SDK 57 package index: `expo-av`. Migrate to `expo-audio` / `expo-video`.

---

## 7. Revised Hook Roadmap (supersedes Round 1 section 6 where they differ)

| Priority | Hook | Backing API | Change vs Round 1 |
| :--- | :--- | :--- | :--- |
| P0 | `useGeminiNano` | ML Kit `genai-prompt:1.0.0-beta4`, `SystemInstruction`, `ModelConfig`, `genai-schema(-compiler)` | Version + system instructions + schema compiler |
| P0 | `useCapabilities` | `PackageManager.hasSystemFeature`, `Build.SDK_INT_FULL`, ML Kit `checkStatus`, `Vibrator.areEnvelopeEffectsSupported`, `Display.hasArrSupport`, `RangingManager` capabilities callback | Broader probe list |
| P0 | `useADPF` (real) | `PowerManager.getThermalHeadroom`, `SystemHealthManager.getCpu/GpuHeadroom` (16), `PerformanceHintManager` | **New**: replaces FPS heuristic |
| P0 | `useAudio`/`useSpeechAI` | `expo-audio`, ML Kit Speech Recognition `1.0.0-alpha1`, `USAGE_ASSISTANT` stream | unchanged + Android 17 stream |
| P1 | `useRanging` | `android.ranging.RangingManager` (16) + DL-TDoA (17) | **Replaces** `useUWB` plan |
| P1 | `useHaptics` (envelopes) | `BasicEnvelopeBuilder` / `WaveformEnvelopeBuilder` (16) with `Composition` fallback | **New** |
| P1 | `useDisplay` (ARR) | `Display.hasArrSupport`, `getSuggestedFrameRate`, `Surface.setFrameRate` | **New** |
| P1 | `useCameraPro` | CameraX **1.6+** Extensions, Camera2 interop CCT/tint, hybrid AE, `EXTENSION_NIGHT_MODE_INDICATOR`, `HEIC_ULTRAHDR`, `RAW14` (17) | Version pin + Android 16 controls |
| P1 | `useSecurity` (PQC) | ML-DSA keys (17), `KeyStoreManager.grantKeyAccess` (16), `AdvancedProtectionManager` (17) | + Advanced Protection |
| P1 | `useSatellite` | `PROPERTY_SATELLITE_DATA_OPTIMIZED`, `TRANSPORT_SATELLITE`, `NET_CAPABILITY_NOT_BANDWIDTH_CONSTRAINED` | **New**, was "detection only" |
| P1 | `useFoldPosture` | WindowManager `FoldingFeature`, `WindowAreaController` rear/dual display, `TYPE_HINGE_ANGLE` | + rear display mode |
| P1 | `useHealthConnect` | Health Connect client, FHIR medical records, `ACTIVITY_INTENSITY`, DDPs (17) | + medical records |
| P2 | `useProfiling` | `ProfilingManager` triggers (17), `ApplicationExitInfo` | **New** |
| P2 | `useLiveUpdates` | `Notification.ProgressStyle` + semantic colours (17) | + semantic colours |
| P2 | `useHandoff` | `setHandoffEnabled`, `onHandoffActivityDataRequested` (17) | unchanged |
| P2 | `useCompanion` | CDM presence + medical/fitness profiles | **New** |
| P2 | Android widgets | Glance Expo Module (expo-widgets is iOS only) | Corrected |
| P2 | `useLocalModel` | LiteRT-LM `.litertlm` on Tensor G6 NPU | **New** alternative to AICore |

---

## 8. Sources

- Android 16/17 features: `android docs fetch kb://android/about/versions/17/features/index`, [Android 16 Features and APIs](https://developer.android.com/about/versions/16/features), [Android 17 release notes](https://developer.android.com/about/versions/17/release-notes)
- Ranging: [Range between devices](https://developer.android.com/develop/connectivity/ranging) · [Android 16 Ranging module (AOSP)](https://source.android.com/docs/whatsnew/android-16-release)
- Satellite: `kb://android/develop/connectivity/satellite/constrained-networks` · [SatelliteManager reference](https://developer.android.com/reference/android/telephony/satellite/SatelliteManager)
- Haptics: `kb://android/develop/ui/views/haptics/custom-haptic-effects` · [Haptics APIs](https://developer.android.com/develop/ui/views/haptics/haptics-apis)
- ADPF: `kb://android/games/optimize/adpf/thermal`
- ML Kit: [Release notes](https://developers.google.com/ml-kit/release-notes) · [System instructions](https://developers.google.com/ml-kit/genai/prompt/android/system-instructions) · [AICore Developer Preview](https://developers.google.com/ml-kit/genai/aicore-dev-preview) · [Gemma 4 in AICore DP](https://android-developers.googleblog.com/2026/04/AI-Core-Developer-Preview.html) · [Gemma 4 on Android](https://developer.android.com/blog/posts/gemma-4-the-new-standard-for-local-agentic-intelligence-on-android)
- LiteRT: [LiteRT-LM on NPU](https://developers.google.com/edge/litert/next/litert_lm_npu) · [Google Tensor with LiteRT](https://developers.google.com/edge/litert/next/tensor-sdk) · [NPU acceleration](https://developers.google.com/edge/litert/next/npu)
- Camera: [CameraX Extensions API](https://developer.android.com/media/camera/camerax/extensions-api)
- Foldables: [Support foldable display modes](https://developer.android.com/develop/adaptive-apps/guides/foldables/support-foldable-display-modes)
- Play policy: [Target API 36 deadline](https://stora.sh/blog/2026-04-14-android-api-36-august-deadline-what-to-do-now) · [16 KB page size deadline clarification](https://support.google.com/googleplay/android-developer/thread/368982598) · [RN 0.77 16 KB support](https://reactnative.dev/blog/2025/01/21/version-0.77)
- Expo: [SDK 57 changelog](https://expo.dev/changelog/sdk-57) · [expo-widgets](https://docs.expo.dev/versions/v57.0.0/sdk/widgets/)
- Pixel 11 features: [7 can't-miss updates](https://blog.google/products-and-platforms/devices/pixel/pixel-11-features/)
- Android Skills: [github.com/android/skills](https://github.com/android/skills) and `android skills list`
- `@google/genai`: `npm view @google/genai version` → 2.21.0 (2026-09-02)

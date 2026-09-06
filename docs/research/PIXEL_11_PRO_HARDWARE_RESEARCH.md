# Pixel 11 Pro Hardware Research & SDK Gap Analysis

> **Date:** 2026-09-05 · **Author:** Claude (research pass) · **Status:** Research only, no code changed
> **Purpose:** Establish ground truth for the Pixel 11 Pro / Pro XL / Pro Fold and Android 17 (API 37), compare it against what PixelForge currently models, and propose what to add to the SDK/template next.

---

## 1. Executive Summary

The Pixel 11 Pro launched **August 12, 2026** (on sale August 20) running **Android 17** on **Tensor G6** with a **Titan M3** security chip. Compared with the Pixel 10 Pro, the hardware deltas that matter to an SDK are:

1. **Thermometer removed.** The rear IR thermopile is gone on every Pixel 11 Pro model. The slot now holds the multi-colour **HiLight** LED array around the flash. `useTemperature` therefore targets Pixel 8 Pro to 10 Pro only and must be capability-gated.
2. **HiLight has no public third-party API.** Google has stated third-party apps cannot drive the LEDs. Community apps (HiLight Studio) reach it through the Android `lights` system service with shell-level access (ADB/Shizuku), re-granted every reboot. Our `useHiLight` must remain a simulation/state-model unless the user opts in to a Shizuku bridge.
3. **Gemini Nano 4 is the headline.** It runs on-device via AICore and is exposed to apps through the **ML Kit GenAI Prompt API** (`com.google.mlkit:genai-prompt`). PixelForge currently only calls cloud Gemini through `@google/genai`. An on-device path is the single biggest missing capability.
4. **Android 17 adds API 37 surfaces** we can wrap: RAW14 capture, dynamic camera session outputs, vendor camera extensions, UWB DL-TDOA (FiRA 4.0), Wi-Fi proximity ranging, ML-DSA post-quantum keys in hardware, Handoff API, EyeDropper, `FEATURE_NEURAL_PROCESSING_UNIT` declaration, Health Connect device data providers, and lock-free MessageQueue.
5. **Expo SDK 57 ships compileSdk 36.** Android 17 APIs need `expo-build-properties` raised to compileSdk 37, and anything not covered by an Expo module (Gemini Nano, UWB, HiLight, Health Connect, CameraX Extensions) needs a local **Expo Module** (Kotlin) plus a config plugin. That means a dev client / prebuild workflow, not Expo Go.
6. **`expo-av` is legacy.** The project still imports `Audio` from `expo-av` (v16.0.8). SDK 57 documentation lists `expo-audio` and `expo-video` as the supported packages. `useAudio` and `useSpeechAI` should migrate.

---

## 2. Pixel 11 Pro Ground-Truth Spec Sheet

Sources: GSMArena spec page, Google Keyword blog, FoneArena, Notebookcheck, Android Authority. Where sources disagree, both values are listed.

### 2.1 Silicon

| Component | Value | Notes for SDK |
| :--- | :--- | :--- |
| SoC | Google Tensor G6 ("Malibu") | GSMArena lists **3 nm**; several outlets and the project docs say TSMC **2 nm (N2)**. Treat process node as unconfirmed and avoid hard-coding it in UI strings. |
| CPU | 7-core: 1x Arm **C1-Ultra @ 4.11 GHz**, 4x **C1-Pro @ 3.38 GHz**, 2x **C1-Pro @ 2.65 GHz** | Matches `useCPU` update in commit 14820ae. Note there is **no efficiency (A5xx-class) cluster**; the "little" cores are also C1-Pro. |
| GPU | **IMG CXTP-48-1536** (PowerVR) | Vulkan 1.3 / GLES 3.2. Reviews report GPU performance flat versus G5. |
| TPU / NPU | +50% TPU compute vs G5; "3.5x faster, 3.5x less energy" on-device AI | Android 17 requires apps to declare `android.hardware.neural_processing_unit` (`FEATURE_NEURAL_PROCESSING_UNIT`) to access the NPU directly. |
| Security | **Titan M3** with post-quantum cryptography, secure boot with PQC | Android 17 exposes **ML-DSA** hardware keys via standard JCA. |
| RAM | 12 GB (Pro) / 16 GB (Pro XL, Fold), LPDDR5X | |
| Storage | 256 GB / 512 GB / 1 TB UFS 4.x | 256 GB is now the floor on all models. |
| Performance | Geekbench 6: ~+17% single-core, ~+21% multi-core vs G5 | Larger vapour chamber, meaningfully less throttling than Pixel 10. |

### 2.2 Display

| Model | Panel | Resolution | Brightness |
| :--- | :--- | :--- | :--- |
| Pixel 11 Pro | 6.3" LTPO OLED, 1-120 Hz, HDR10+ | 1280 x 2856 (~497 ppi) | 2,400 nits HBM / **3,600 nits peak** |
| Pixel 11 Pro XL | 6.8" LTPO OLED, 1-120 Hz | 1344 x 2992 | 3,600 nits peak |
| Pixel 11 Pro Fold | 8.0" inner Super Actua Flex, 2076 x 2152, 372 ppi; outer display | | 3,600 nits, 20% brighter than gen 10 |

Gorilla Glass Victus 2 with a new anti-scratch coating (Mohs level 4, "2x scratch resistance").

### 2.3 Cameras

| Camera | Sensor | Optics | Features |
| :--- | :--- | :--- | :--- |
| Wide | **50 MP, 1/1.3", 1.2 µm** | f/1.68, 25 mm, multi-directional PDAF, OIS, multi-zone laser AF | Same sensor as Pixel 10 Pro; new ISP |
| Ultrawide | **48 MP, 1/2.51"** | f/1.7, 123°, AF, Macro Focus | Same as gen 10 |
| Telephoto | **48 MP, 1/1.95"** (new) | f/2.8, 106 mm, 5x periscope, OIS | 30% more light sensitivity; **Portrait at 5x**; **Pro Zoom up to 120x** |
| Selfie | 42 MP | f/2.2, 103°, PDAF | 4K30/60 |
| Video | 8K 24/30, 4K 24/30/60, 1080p up to 240 fps, 10-bit HDR, gyro-EIS + OIS | Video Boost, Cinematic Blur | |

Software features (Pixel Camera app only, **no third-party API**): **Magic Capture** (analyses ~400 frames, outputs best 12 MP still plus video), **Camera Looks** (Natural / Shadows / Vanilla defaults plus Digi, Black Tie, Minimal, Editorial, Classic, Velvet), **Creator Suite** with teleprompter, Ultra Low Light Video (5-10 lux), Best Take, Zoom Enhance, Pixel Shift, Ultra HDR.

Third-party camera access paths:
- **CameraX / Camera2 Extensions** via **Pixel Camera Services** (Night mode, HDR, Bokeh, autofocus/manual focus/zoom inside Night). Available since Pixel 6.
- **Android 17**: `ImageFormat.RAW14`, vendor-defined extensions (`isExtensionSupported`), camera device type API (built-in vs external vs virtual), `CameraCaptureSession.updateOutputConfigurations()` to swap outputs without reopening.

### 2.4 Sensors (official list)

Ultrasonic under-display fingerprint (new; Pixel 10 Pro was optical), accelerometer, gyroscope, proximity, compass/magnetometer, barometer, ambient light. **No thermometer. No IR blaster.** Class 3 face unlock via front camera.

### 2.5 Radios & Connectivity

| Radio | Spec |
| :--- | :--- |
| Modem | MediaTek M90; 5G SA/NSA, Sub-6 and mmWave (US) |
| Wi-Fi | **Wi-Fi 7** (802.11be), tri-band |
| Bluetooth | **6.0**, LE, LE Audio, aptX HD |
| UWB | Yes (Pro models). Android 17 adds **DL-TDOA / FiRA 4.0** indoor positioning |
| NFC | Yes |
| Satellite | **Satellite SOS** (no third-party API) |
| GNSS | Dual-band **L1 + L5**: GPS, GLONASS, Galileo, BeiDou, QZSS, NavIC |
| USB | Type-C 3.2, USB-C audio |

### 2.6 Battery & Charging

| Model | Battery | Wired | Wireless |
| :--- | :--- | :--- | :--- |
| Pro | 4,850 mAh | 30 W PD3.0/PPS, 55% in 30 min | **Qi2.2 25 W magnetic (Pixelsnap)** |
| Pro XL | 5,115 mAh | 45 W, "15 hours in 15 minutes" | Qi2.2 25 W |
| Pro Fold | | 30 W | Qi2.2 25 W |

Reverse wired charging and bypass charging supported. IP68. Camera bar 40% thinner.

### 2.7 HiLight (Pro, Pro XL, Pro Fold)

- Multi-colour LED array (reports say ~8 addressable LEDs) embedded around the rear flash.
- Google's use cases: Gemini listening / processing / responding states during hands-free use, favourite-contact call colours, face-down glanceable notifications.
- **Not available to third-party apps** per Google. HiLight Studio (open source, sideloaded) drives it through the Android `lights` system service using Shizuku/ADB shell permission, which must be re-granted after every reboot. Patterns it exposes: Wave, Breathe, Rainbow, Pulse, Comet; per-LED colour, saturation, intensity, brightness.
- Implication: `useHiLight` should expose an `availability: 'unsupported' | 'simulated' | 'shizuku'` field and default to simulation.

### 2.8 Pixel 11 Pro Fold specifics

Tensor G6, 16 GB RAM, gearless hinge (3x durability), 10.1 mm folded / 5 mm open, HiLight, 30 W wired / 25 W Qi2.2. Developer guidance from Google: WindowManager 1.5 window size classes, `FoldingFeature` posture, Compose MediaQuery (experimental), Navigation 3 scene strategies, CameraX for rotation/scaling across screens.

---

## 3. Android 17 (API 37) Developer Surface Relevant to PixelForge

| Area | API | Hook opportunity |
| :--- | :--- | :--- |
| Camera | `ImageFormat.RAW14`, vendor extensions, camera device type, dynamic session outputs, `PhotoPickerUiCustomizationParams` | `useCamera` RAW14 + extension capability flags |
| Media | `MediaRecorder.setVideoEncodingQuality()` constant-quality mode, VVC/H.266 decode, xHE-AAC encoder, `AudioDeviceInfo.TYPE_BLE_HEARING_AID` | `useAudio` route enumeration |
| Connectivity | UWB DL-TDOA (FiRA 4.0), Wi-Fi proximity ranging, `ACCESS_LOCAL_NETWORK` permission, CDM `DEVICE_PROFILE_MEDICAL` / `DEVICE_PROFILE_FITNESS_TRACKER`, `SubscriptionInfo.getStreamingAppMaxDownlinkKbps()` | `useUWB` real ranging, `useNetwork` streaming caps |
| Cross-device | **Handoff API** (`Activity.setHandoffEnabled`, CompanionDeviceManager) | `useHandoff` |
| Security | **ML-DSA** hardware keys via JCA, HPKE SPI, APK Signature Scheme v3.2 hybrid PQC, system location button (`USE_LOCATION_BUTTON`) | `useSecurity` PQC key generation on Titan M3 |
| AI | `FEATURE_NEURAL_PROCESSING_UNIT` manifest declaration; ML Kit GenAI Prompt API | `useGeminiNano`, `useTPU` should report NPU feature flag |
| Performance | Lock-free `MessageQueue`, generational GC, `ProfilingManager` triggers (`TRIGGER_TYPE_COLD_START`, `TRIGGER_TYPE_OOM`, `TRIGGER_TYPE_ANOMALY`), `ApplicationExitInfo` "MemoryLimiter" | `useMemory` exit-reason telemetry, `useADPF` |
| Privacy/UI | EyeDropper API, `ACTION_PICK_CONTACTS`, interactive PiP (`USE_PINNED_WINDOWING_LAYER`), bubbles, mandatory large-screen adaptivity | `useEyeDropper`, Fold-aware layout |
| Health | Health Connect **Device Data Providers** (hardware-verified vs app-sourced data) | `useHealthConnect` |
| Alarms | Callback-based `setExactAndAllowWhileIdle(OnAlarmListener)` | background scheduling |

---

## 4. On-Device AI: Gemini Nano 4 via ML Kit GenAI

**Why it matters:** Pixel 11 ships **Gemini Nano 4** (nano-v4 tier; Pixel 9/10 get nano-v3). Google's own Pixel developer post leads with "ML Kit GenAI Prompt API" as the way to reach it. PixelForge's `useGemini`, `useVisionAI`, and `useSpeechAI` are cloud-only today, so the SDK does not touch the TPU it advertises.

**Implementation facts (ML Kit docs, Sept 2026):**

```gradle
implementation("com.google.mlkit:genai-prompt:1.0.0-beta2")
```

- minSdk 26; model is managed by **AICore** and delivered through Private Compute Services, so the app never downloads weights itself but must handle `FeatureStatus.UNAVAILABLE | DOWNLOADABLE | DOWNLOADING | AVAILABLE`.
- Client: `Generation.getClient()`; `checkStatus()`, `download().collect { ... }`, `generateContent(...)`, `generateContentStream(...)`.
- Multimodal request: `generateContentRequest(ImagePart(bitmap), TextPart(prompt)) { temperature; topK; candidateCount }`. Multi-image supported.
- **Structured Output** (Alpha) and **Thinking Mode** (Beta) shipped in the Prompt API in 2026.
- Input limit about 4,000 tokens; avoid outputs over 4K tokens.
- Feature APIs also available: Summarization, Proofreading, Rewriting, Image Description, Speech Recognition (basic/advanced).
- Gemini Nano 4 variants: E2B (fast) and **E4B (full)** for reasoning, summarisation, structured output; 140+ languages; broader multimodal understanding.
- **AICore Developer Preview** additionally exposes **Gemma 4** for lower-level access.

**Reference implementation:** `react-native-ai-core` (albertoroda) wraps `genai-prompt:1.0.0-beta2` plus LiteRT-LM and MediaPipe fallbacks with a JS surface of `checkAvailability`, `ensureModel`, `generateResponse`, `generateResponseStream(onToken)`, `generateStructuredResponse(zod)`, `generateResponseWithImage(base64)`. Requires New Architecture, physical device, no Expo config plugin yet, and is marked not production-ready. It is a good API-shape reference for our own `useGeminiNano`, but we should write a local Expo Module rather than depend on it.

---

## 5. Gap Analysis: Current Hooks vs Reality

Legend: **Real** = calls a real Expo/RN API · **Sim** = simulated telemetry only (greps for `simulat|mock|Math.random`).

| Hook | Status today | Reality on Pixel 11 Pro | Recommended action |
| :--- | :--- | :--- | :--- |
| `useCPU` | Sim | Correct 7-core topology; node unconfirmed | Read `/proc/cpuinfo` core count via native module or `expo-device` `totalMemory`; drop "2nm" from user-facing strings or mark as reported |
| `useGPU` | Sim | IMG CXTP-48-1536 | Real frame pacing via `requestAnimationFrame` delta; expose `Choreographer` frame drops through native `FrameMetrics` |
| `useTPU` | Sim | Real TPU reachable only via ML Kit GenAI / LiteRT | Replace benchmark simulation with `useGeminiNano` status and measured latency; declare `FEATURE_NEURAL_PROCESSING_UNIT` |
| `useMemory` | Sim | Android 17 memory limiter kills | Use `expo-device` `totalMemory` + `ApplicationExitInfo` native read |
| `useADPF` | ? | ADPF hints need native `PerformanceHintManager` | Local Expo Module for `PerformanceHintManager` and `PowerManager.getThermalHeadroom()` |
| `useTemperature` | Sim | **Sensor removed on Pixel 11 Pro** | Gate on `Device.modelName` and report `unsupported`; keep for Pixel 8-10 Pro |
| `useHiLight` | Sim | No public API | Add `availability` field; optional Shizuku bridge behind a flag |
| `useUWB` | Sim | Real UWB present; Android 17 DL-TDOA | Local Expo Module over `androidx.core.uwb` (`UwbManager`, `RangingParameters`) |
| `useBLE` | Sim | BT 6.0, LE Audio | Adopt `react-native-ble-plx` or an Expo Module; add LE Audio route detection |
| `useNFC` | Sim | Present | Adopt `react-native-nfc-manager` |
| `useCamera` | Partial (expo-camera) | RAW14, extensions, 8K, 120x are Pixel-Camera-only or Camera2 | Add `useCameraExtensions` capability probe (Night/HDR/Bokeh) via CameraX Extensions native module; document that Magic Capture / Camera Looks have no API |
| `useLocation` | Real (expo-location) | Dual-band L1+L5 | Expose `accuracy`, satellite constellation count via `GnssStatus` native module |
| `useNetwork` | Real (expo-network) | Wi-Fi 7, 5G | Add `expo-cellular` for NR state; Android 17 streaming caps |
| `useDisplay` | Partial | 3,600 nits, 1-120 Hz | Real refresh rate via `Display.getRefreshRate()`; HDR capability flags |
| `useDevice` | Real | Qi2.2 25 W | `expo-battery` charging state is real; wattage is not exposed by Android, so label as nominal |
| `useSecurity` | Real (SecureStore) | Titan M3 + ML-DSA (API 37) | Add PQC key generation via Android KeyStore ML-DSA in a native module |
| `useBiometrics` | Real | Ultrasonic FP, Class 3 face | Already correct |
| `useAudio` / `useSpeechAI` | Real but **expo-av (legacy)** | | Migrate to `expo-audio`; speech-to-text via ML Kit GenAI Speech Recognition on-device |
| `useGemini` / `useVisionAI` | Cloud only | Gemini Nano 4 on device | Add `useGeminiNano` and a `preferOnDevice` routing option |
| `useSensors` | Real (expo-sensors) | Full set present | Consider standalone `expo-pedometer`, `expo-light-sensor` packages listed in SDK 57 |

---

## 6. Proposed Additions (Prioritised)

### P0: Correctness and platform baseline

1. **`useGeminiNano`** (new, `src/ai/`): local Expo Module wrapping ML Kit GenAI Prompt API. Surface: `status`, `download()`, `progress`, `generate(prompt, { image?, temperature, topK })`, `stream(prompt, onToken)`, `generateStructured(schema)`, `thinking` toggle, `modelTier: 'nano-v3' | 'nano-v4'`. Also feature APIs: `summarize`, `proofread`, `rewrite`, `describeImage`, `transcribe`.
2. **Capability gating layer** (`src/core/capabilities.ts`): one `useCapabilities()` hook that resolves `hasThermometer`, `hasHiLight`, `hasUWB`, `hasNPU`, `isFoldable`, `geminiNanoTier` from device model, `PackageManager.hasSystemFeature`, and ML Kit status. Every Pro-exclusive hook reads from it.
3. **Migrate `expo-av` to `expo-audio`** in `useAudio` and `useSpeechAI`.
4. **Raise compileSdk to 37** with `expo-build-properties`; declare `android.hardware.neural_processing_unit` (`required=false`) and `ACCESS_LOCAL_NETWORK` where relevant in `app.json`.
5. **Fix `useTemperature`** to report `unsupported` on Pixel 11 Pro; update README, HARDWARE_API, pro-exclusives, DocsScreen per the docs-sync rule.

### P1: Real hardware where Expo has no module

6. **`useUWB` real ranging** via `androidx.core:core-uwb` Expo Module (controller/controlee, distance, azimuth, elevation; Android 17 DL-TDOA when available).
7. **`useCameraExtensions`**: probe and enable CameraX Extensions (Night, HDR, Bokeh, Face Retouch) through Pixel Camera Services; expose RAW14 support flag on API 37.
8. **`useSecurity` PQC**: ML-DSA key pair in StrongBox/Titan M3 with sign/verify; fall back to EC on older devices.
9. **`useHealthConnect`**: steps, heart rate, sleep via Health Connect with Android 17 device-data-provider attribution. Pairs with Pixel Watch 5.
10. **`useFoldPosture`**: WindowManager `FoldingFeature` (flat, half-opened, tabletop, book) and window size class for the Pro Fold.
11. **`useHiLight` Shizuku bridge** (opt-in, documented as unsupported by Google).

### P2: Android 17 conveniences and template polish

12. **`useHandoff`** (cross-device state resume), **`useEyeDropper`**, **`useLiveUpdates`** (Live Update notifications also bridged to Pixel Watch 5).
13. **`expo-widgets`** home-screen widget template, **`expo-app-integrity`** (Play Integrity, hardware-backed attestation) as `useAttestation`.
14. **Satellite SOS**: detection only (no third-party API); surface as a capability flag with deep link to Emergency settings.
15. **Template additions**: EAS dev-client profile, `modules/` folder with Expo Module scaffold, config plugin for Kotlin deps, Android 17 emulator system image instructions via `android sdk`.

---

## 7. Native Module Strategy

Everything in P0/P1 that is not an Expo package (Gemini Nano, UWB, CameraX Extensions, ML-DSA, Health Connect, ADPF, HiLight) should live as **local Expo Modules** under `modules/<name>/` with:

- `expo-module.config.json` + Kotlin class extending `Module` using the Expo Modules API (`Function`, `AsyncFunction`, `Events`).
- A config plugin adding Gradle dependencies (`genai-prompt`, `core-uwb`, `camera-extensions`, `health-connect-client`) and manifest features/permissions.
- Consumption through `expo-dev-client` or `npx expo run:android`. **Expo Go cannot load these**; the README quickstart must say so.
- Typecheck and `npx expo export -p android` remain the validation gates. Add `npx expo prebuild --platform android --no-install` to confirm plugin output.

---

## 8. Corrections to Current Docs Worth Applying

- Process node: state "TSMC 3 nm-class (reported 2 nm N2)" or omit; sources conflict.
- Remove "Infrared Thermometer" from the Pixel 11 Pro executive summary in PIXELFORGE.md; mark as Pixel 8-10 Pro legacy.
- Titan M2 references in README (`useGemini` row, `useBiometrics` row) should read Titan M3.
- Main sensor is unchanged from Pixel 10 Pro (50 MP 1/1.3"); only the telephoto is new.
- Wired charging is 30 W on the Pro, 45 W on the Pro XL only.
- Fingerprint is ultrasonic, not optical.

---

## 9. Sources

- Google Keyword: [Pixel 11, 11 Pro, 11 Pro XL announcement](https://blog.google/products-and-platforms/devices/pixel/google-pixel-11-pro-xl/) · [Pixel 11 Pro Fold](https://blog.google/products-and-platforms/devices/pixel/pixel-11-pro-fold/) · [7 updates from launch](https://blog.google/products-and-platforms/devices/pixel/pixel-11-features/)
- Android Developers: [Enhance your app for the new Pixel lineup](https://android-developers.googleblog.com/2026/08/pixel-app-experience-made-by-google.html) · [Android 17 release notes](https://developer.android.com/about/versions/17/release-notes) · [Android 17 is here](https://android-developers.googleblog.com/2026/06/Android-17.html) · [Gemini Nano](https://developer.android.com/ai/gemini-nano) · [Gemini Nano 4 topic](https://developer.android.com/blog/topics/gemini-nano-4) · [Gemma 4 in AICore Developer Preview](https://developer.android.com/blog/posts/announcing-gemma-4-in-the-ai-core-developer-preview)
- ML Kit: [GenAI overview](https://developers.google.com/ml-kit/genai) · [Prompt API get started](https://developers.google.com/ml-kit/genai/prompt/android/get-started) · [Structured output](https://developers.google.com/ml-kit/genai/prompt/android/structured-output) · [Thinking mode](https://developers.google.com/ml-kit/genai/prompt/android/thinking-mode) · [Release notes](https://developers.google.com/ml-kit/release-notes)
- Specs: [GSMArena Pixel 11 Pro](https://www.gsmarena.com/google_pixel_11_pro_5g-14801.php) · [GSMArena hands-on: software & performance](https://www.gsmarena.com/google_pixel_11_pro_hands_on-review-2990p3.php) · [FoneArena specs](https://www.fonearena.com/blog/489452/google-pixel-11-pixel-11-pro-pixel-11-pro-xl-price-india-specifications.html) · [Notebookcheck launch](https://www.notebookcheck.net/Google-Pixel-11-Pro-series-debuts-with-Tensor-G6-new-cameras-and-Qi2-2-charging.1366782.0.html) · [Android Authority Tensor G6 deep dive](https://www.androidauthority.com/tensor-g6-deep-dive-3695968/) · [PhoneArena Pixel 11 Pro Fold](https://www.phonearena.com/news/pixel-11-pro-fold-is-here_id182546)
- Thermometer / HiLight: [Android Authority: no thermometer](https://www.androidauthority.com/pixel-11-pro-phones-no-thermometer-3697115/) · [Fast Company: HiLight](https://www.fastcompany.com/91588662/google-just-repurposed-temperature-sensor-pro-series-pixel-phones-heres-what-does-now) · [9to5Google: HiLight third-party control](https://9to5google.com/2026/08/20/google-pixel-11-pro-hilight-third-party-control-feature/) · [Android Authority: HiLight Studio](https://www.androidauthority.com/google-pixel-11-pro-hilight-studio-3700860/) · [Android Police: face-down mode](https://www.androidpolice.com/pixel-11-face-down-mode/)
- Camera features: [DPReview: Magic Capture and Camera Looks](https://www.dpreview.com/articles/we-tested-the-pixel-11s-magic-capture-and-camera-looks-heres-how-the-photos-look/) · [Android Central: Pixel 11 features](https://www.androidcentral.com/phones/google-pixel/you-cant-miss-these-huge-pixel-11-features-that-put-gemini-and-its-camera-up-front) · [Pixel Camera Services](https://play.google.com/store/apps/details?id=com.google.android.apps.camera.services) · [AOSP camera extensions](https://source.android.com/docs/core/camera/camerax-vendor-extensions)
- RN on-device AI: [react-native-ai-core](https://github.com/albertoroda/react-native-ai-core) · [Bridging RN to Gemini Nano](https://mobile.wednesday.is/writing/react-native-on-device-llm-core-ml-gemini-nano-integration)
- Expo: [SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)

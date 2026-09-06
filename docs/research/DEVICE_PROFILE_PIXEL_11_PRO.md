# Device Profile: Pixel 11 Pro ("grizzly"), captured from hardware

> **Captured:** 2026-09-05 via `adb` over wireless debugging from the PixelForge dev build session. Everything below is read from the device, not from marketing pages. Use it to settle spec disputes and to write capability checks.

## Identity

| Property | Value |
| :--- | :--- |
| `ro.product.model` | Pixel 11 Pro |
| `ro.product.device` / `ro.hardware` | grizzly |
| Android | **17** (`ro.build.version.sdk` = **37**, `sdk_full` = 37.0) |
| Build | CD1A.260618.001.A7, security patch 2026-06-05, release-keys |
| SoC | `ro.soc.manufacturer` Google, `ro.soc.model` **Tensor G6** (process node not exposed) |
| Hardware revision | MP1.0 |
| ABI | arm64-v8a only |

## CPU (from `/proc/cpuinfo` + cpufreq)

7 cores, Arm implementer 0x41. Parts: **6x 0xd8b (Cortex/C1-Pro class)** + **1x 0xd8c (C1-Ultra class)**.
Max frequencies: 2x **2.649 GHz**, 4x **3.379 GHz**, 1x **4.109 GHz**. Matches the 1+4+2 topology the docs claim; there is no separate efficiency-core part number.

## Memory & storage

`MemTotal` 11,926,592 kB (**12 GB** SKU). `/data` 224 GB total (**256 GB** SKU), 49 GB used at capture.

## GPU

SurfaceFlinger RenderEngine: **Vulkan (Graphite)**, protected device initialised. (GPU model string not exposed by dumpsys; IMG CXTP per public specs.)

## Display (`dumpsys display`)

- Physical panel **1280 x 2856**, default render mode **1080 x 2410** (system downscale, `physicalPixelDisplaySizeRatio` 0.84375), density 420, ~416 dpi at render size, ~493 dpi physical.
- `hasArrSupport` **true** (Adaptive Refresh Rate). `supportedRefreshRates` = 120, 60, 40, 30, 24, 20, 15, 10, 5, 2, **1 Hz**. Frame-rate categories normal 60 / high 90. Render modes 120 and ARR 60.
- HDR types **[2, 3, 4]** = HDR10, HLG, HDR10+. `maxLuminance` 1000, `minLuminance` 0.0005 (HDR capability report; marketing peak 3,600 nits is not exposed here). Colour modes [0, 7, 9].
- Cutout: centred hole-punch, top inset 172 px. Rounded corners radius 132.
- Presentation deadline 11.5 ms, vsync offset 6.23 ms.

## On-device AI stack

| Package | Version |
| :--- | :--- |
| `com.google.android.aicore` | **0.release.prod_aicore_20260723.00_RC11** |
| `com.google.android.as.oss` (Private Compute Services) | 1.0.release.962568596 |
| `com.google.android.as` (Android System Intelligence) | C.6.playstore.pixel11 |

AICore build 2026-07-23 postdates ML Kit Prompt API beta4 (2026-07-21), so Gemini Nano v4 support is expected.

## Hardware features (`pm list features`, filtered)

Present: `android.hardware.uwb`, `android.hardware.bluetooth_le.channel_sounding`, `android.hardware.wifi.rtt`, `android.hardware.wifi.aware`, `android.hardware.wifi.passpoint`, `android.hardware.nfc` (+ `.any`, `.ese`, `.hce`, `.hcef`), `android.hardware.telephony.satellite`, `android.hardware.strongbox_keystore=400`, `android.hardware.hardware_keystore=500`, `android.hardware.keystore.app_attest_key`, `android.hardware.biometrics.face`, `android.hardware.fingerprint`, `android.hardware.sensor.barometer`, `android.hardware.sensor.hifi_sensors`, `android.hardware.sensor.light`, `android.hardware.sensor.proximity`, `android.hardware.context_hub`, `android.hardware.camera.concurrent`, `android.hardware.camera.flash`.

**Absent:** any thermometer / infrared feature. Confirms the Pixel 11 Pro has **no IR thermopile**.

## System services present (`service list`)

`advanced_protection`, `app_function`, `lights`, `ranging`, `uwb`, `thermalservice`, `vibrator_manager`, `companiondevice`, `nfc`, `bluetooth_manager`.

Implications: Android 17 `AdvancedProtectionManager`, AppFunctions, unified `RangingManager`, and the `lights` service (the one HiLight Studio drives via shell) are all live on this device.

## Haptics (`dumpsys vibrator_manager`)

- Capabilities: `ON_CALLBACK, PERFORM_CALLBACK, COMPOSE_EFFECTS, AMPLITUDE_CONTROL, FREQUENCY_CONTROL, EXTERNAL_CONTROL, CAP_COMPOSE_PWLE_EFFECTS_V2, GET_RESONANT_FREQUENCY`
- **PWLE v2 → Android 16 envelope effects (`BasicEnvelopeBuilder` / `WaveformEnvelopeBuilder`) are supported.**
- Primitives: NOOP, CLICK 28 ms, THUD 300 ms, SPIN 132 ms, QUICK_RISE 150 ms, SLOW_RISE 500 ms, QUICK_FALL 101 ms, TICK 5 ms, LOW_TICK 11 ms. `primitiveDelayMax` 10,000 ms.
- Frequency profile: resonant **134.4 Hz**, usable range **50 to 170.5 Hz** in 0.25 Hz steps, max output **1.78 G** (peak near resonance).

## Thermal (`dumpsys thermalservice`)

Status 0 (none) at capture. Headroom thresholds `[NaN, 0.8, 0.933, 1.0, 1.05, 1.233, 1.667]` for statuses NONE..SHUTDOWN. Virtual skin sensors reported (`VIRTUAL-SKIN-SPEAKER-MODEL` 36.7 C, `VIRTUAL-SKIN-AMBIENT-MODEL` 27.5 C). `PowerManager.getThermalHeadroom()` is the API to read this.

## Sensors (`dumpsys sensorservice`)

| Sensor | Part | Rate / notes |
| :--- | :--- | :--- |
| Accelerometer / Gyroscope | TDK **ICM45631** (6-axis IMU) | 1.56 to 400 Hz, FIFO 3000 |
| Magnetometer | MEMSIC **MMC5616** | up to 100 Hz |
| Barometer | Goermicro **SPA18001** | 1 to 25 Hz |
| Ambient light / proximity / colour | AMS **TMD3743** | proximity 10 to 120 Hz; colour channel exposed as `com.google.sensor.color` |
| **Rear light** | Google **VD628X** `com.google.sensor.rear_light` | rear-facing ambient sensor (face-down / HiLight context) |
| Step detector / counter, significant motion, tilt, pick-up, device orientation, double twist, binned brightness, auto brightness | Google (context hub) | |
| Camera V-Sync 0..3 | Google | 4 camera sync channels |
| Gyro/pressure temperature | TDK / Goermicro | internal die temps, not object temperature |

No `android.sensor.ambient_temperature`, no thermopile.

## Cameras (`dumpsys media.camera`)

Camera HAL device v1.4. Static metadata includes `pixelArraySizeMaximumResolution` and `availableStreamConfigurationsMaximumResolution` (high-resolution / remosaic modes present). Detailed per-camera enumeration requires the app-side `CameraManager` query; RAW14 / HEIC_ULTRAHDR support should be probed from `StreamConfigurationMap` at runtime.

## Networking

Wireless debugging: mDNS `_adb-tls-connect._tcp` on port 42641, pairing service on a rotating port. Device IP 10.0.0.47 on the dev LAN.

## What this changes for PixelForge

1. `useCapabilities()` resolves correctly here: `hasThermometer=false`, `hasHiLight=true`, `hasUWB=true`, `hasTitanM3=true`, `geminiNanoTier='nano-v4'`, `androidApiLevel=37`, all `supports*` true.
2. `useADPF` can read real thermal headroom; `useDisplay` can read ARR and the 1 to 120 Hz ladder; `useHaptics` can use envelopes.
3. `useRanging` has UWB, BLE channel sounding and Wi-Fi RTT all present on one device.
4. The `rear_light` sensor is a candidate signal for face-down detection to drive `useHiLight` state.

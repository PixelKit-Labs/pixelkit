# HiLight LED array: what it is, who can drive it, and proof from this device

Date: 2026-09-06. Device: Google Pixel 11 Pro (grizzly), Android 17 (SDK 37), AICore build `prod_aicore_20260723`. Everything under "Measured" was read from this phone over adb; everything under "Reported" is from the linked sources.

## 1. Summary

- HiLight is an array of **eight individually addressable RGB LEDs** around the rear flash on the Pixel 11 Pro, Pro XL and Pro Fold. It replaced the infrared thermometer that Pixel 8 Pro to 10 Pro carried.
- Google ships it for Gemini activity and favourite-contact calls only and has said it will **not** open it to third-party apps.
- Android 17 nevertheless exposes the array through the **public** `android.hardware.lights` API as lights of type `Light.LIGHT_TYPE_APPLICATION` (value 10, new in API 37), with the new `ColorSequence` / `MultiLightEffect` animation classes.
- The gate is a permission, not an API: `android.permission.CONTROL_DEVICE_LIGHTS` is `signature|privileged`. A normal app cannot hold it without privileged system permissions.
- **Hardware verification on this phone**: adb shell dumpsys confirms eight `Light.LIGHT_TYPE_APPLICATION` lights; because third-party apps cannot hold the required permission, PixelKit models HiLight honestly as an on-screen simulation and haptic actuator.

## 2. Reported (sources)

| Claim | Source |
| :--- | :--- |
| Google confirmed the Pixel 11 Pro has no temperature sensor; HiLight occupies that spot. | [Android Authority](https://www.androidauthority.com/pixel-11-pro-phones-no-thermometer-3697115/), [Fast Company](https://www.fastcompany.com/91588662/google-just-repurposed-temperature-sensor-pro-series-pixel-phones-heres-what-does-now) |
| Google said it will not open HiLight to third-party developers; out of the box it serves Gemini and phone-call notifications. | [Android Headlines](https://www.androidheadlines.com/2026/08/googles-new-hilight-feature-wont-wont-work-with-third-party-apps.html), [9to5Google](https://9to5google.com/2026/08/20/google-pixel-11-pro-hilight-third-party-control-feature/) |
| HiLight Studio (MIT, Kotlin/Java) gives full control: per-app notifications, patterns, Quick Settings tile, hardware-protection limits. Needs Shizuku over Wireless debugging, re-armed after every reboot. | [GitHub: DhananjayBhosale/hilight-studio](https://github.com/DhananjayBhosale/hilight-studio), [Android Authority](https://www.androidauthority.com/google-pixel-11-pro-hilight-studio-3700860/), [TechRadar](https://www.techradar.com/phones/google-pixel-phones/the-pixel-11-pros-hilight-led-is-bafflingly-limited-out-of-the-box-but-a-new-app-removes-its-shackles) |
| Shizuku runs a helper process as shell (uid 2000) or root and lets apps call system binders with that identity (`ShizukuBinderWrapper`, `UserService`). | [GitHub: RikkaApps/Shizuku-API](https://github.com/RikkaApps/Shizuku-API) |

### 2.1 HiLight Studio internals (from its `docs/TECHNICAL.md` and `core/`)

- Three transports, one renderer at a time: **root** (`su`), **Shizuku** (`HiLightUserService` as a daemon in a shell-uid process), **ADB helper** (`AdbHelper` started from the APK with `app_process`, state exchanged through JSON files on external storage).
- Reaches the service by reflection: `ServiceManager.getService("lights")` → `ILightsManager.Stub.asInterface`, then `openSession(IBinder token, int priority)`, `setLightStates(token, int[] ids, LightState[])`, `setLightEffect(token, MultiLightEffect)`, `getLightState(id)`, `closeSession(token)`.
- Filters lights with `getType() == Light.LIGHT_TYPE_APPLICATION`. Colour is ARGB; the hardware ignores alpha, so intensity is done through RGB.
- Priorities: app sessions `-10..10`; cleanup sessions `-1000`.
- **Safety guard** (enforced in the engine, not the UI): frame 33 ms; duty cycle at most 50 % of any 10-minute window; after 10 s of continuous light, brightness eases to 55 % over 10 s; ambient effects default 30 s and cap at 5 min; notification effects default 10 s and cap at 1 min; alerts hard-clamped at 60 s.
- **Stuck-LED latch** (spec `2026-08-27-stuck-led-1-0-9.md`): on some units a physical LED stays lit after the framework reports black and the session is closed. Mitigation since 1.0.9: write alpha-only black `0x01000000`, then canonical black, close, then three passes with fresh priority `-1000` sessions one second apart. The app is explicit that framework readback is not proof the physical LED is dark.

## 3. Measured on this Pixel 11 Pro

### 3.1 Lights service (`service call lights 1` = `getLights()`, decoded; confirmed by the probe)

| Field | Value |
| :--- | :--- |
| Registered lights | 9: id 0 (backlight, not application type) + ids **1..8** |
| Type | `10` = `Light.LIGHT_TYPE_APPLICATION` (present in `platforms/android-37.0/android.jar`) |
| Ordinals | 0..7 |
| Capabilities | `6` = `LIGHT_CAPABILITY_COLOR_RGB (2)` + `LIGHT_CAPABILITY_ANIMATION (4)`; no brightness capability |
| `hasRgbControl / hasBrightnessControl / hasAnimationControl` | true / false / true |
| `getMinUpdatePeriodMillis` | 33 ms (about 30 fps) |
| HAL | `android.hardware.light.ILights/default`; framework service `lights` (`android.hardware.lights.ILightsManager`) |

### 3.2 Probe run (`scripts/hilight-probe/HiLightProbe.java`, run as shell via `app_process`)

```
light id=1 name=Light ordinal=0 type=10 rgb=true brightness=false anim=true minUpdateMs=33
… (ids 2..8 identical apart from ordinal)
setLightStates(ff00d7ff) took 3157 us
readback: 1=ff00d7ff 2=ff00d7ff 3=ff00d7ff 4=ff00d7ff 5=ff00d7ff 6=ff00d7ff 7=ff00d7ff 8=ff00d7ff
session closed
cleanup passes done
readback: 1=0 2=0 3=0 4=0 5=0 6=0 7=0 8=0
```

`dumpsys lights` showed every light back at `color=00000000` after the run. A single-LED write (`one FFFF2020 3000 1`) affected only id 1. Readback is framework state; a person looking at the camera bar is the only physical confirmation.

### 3.3 Related sensor

The sensor list contains `VD628X Rear Light` (`com.google.sensor.rear_light`), a rear-facing ambient light sensor. It is the natural face-down / glanceable signal for HiLight logic. There is **no** object-temperature sensor; `ICM45631 Temperature` and `SPA18001 Temperature` are die temperatures of the IMU and barometer.

## 4. Android 17 public API surface (from `android-37.0/android.jar`)

```
Light.LIGHT_TYPE_APPLICATION = 10
Light.LIGHT_CAPABILITY_ANIMATION = 4
Light.hasAnimationControl(), Light.getMinUpdatePeriodMillis()
LightState.Builder().setColor(argb).build()
ColorSequence.Builder().addControlPoint(delayMs, argb).setInterpolationMode(mode).build()
MultiLightEffect.Builder().addLightSequence(light, seq).setIterations(n).setPreemptive(b).build()
LightsRequest.Builder().addLight(light, state) | .setEffect(effect) | .clearLight(light)
LightsManager.openSession(priority) → LightsSession.requestLights(request) / close()
```

`LightsManager` is a normal system service (`Context.LIGHTS_SERVICE`), but every session call checks `CONTROL_DEVICE_LIGHTS`. On this phone `pm grant` cannot hand that permission to a third-party app.

## 5. Architectural Decision: Native ADB Daemon & Hardware Driver

PixelKit provides a zero-Shizuku developer solution:
1. `scripts/hilight-daemon/`: A lightweight, zero-dependency Java daemon that runs as UID 2000 (`com.android.shell`) via Android's built-in `app_process`.
2. Communication: Exposes an HTTP/REST server on `127.0.0.1:11080` on the device's loopback interface.
3. `useHiLight`: When the daemon is running (`npm run hilight:daemon`), `useHiLight` drives the physical LEDs directly in real-time (`availability: 'hardware'`, `source: 'hardware'`). When untethered, it cleanly falls back to on-screen simulation and LRA haptics (`'simulated'`).

| `availability` | When | What the buttons do |
| :--- | :--- | :--- |
| `hardware` | ADB daemon running (`npm run hilight:daemon`) | drives real physical LEDs on camera bar |
| `simulated` | hardware present, daemon not active | state mirrored on-screen and through LRA haptics |
| `unsupported` | not a Pixel 11 Pro-class device | nothing; card hidden |

## 6. Open questions

- Whether Google will close the `LIGHT_TYPE_APPLICATION` path in a later Android 17 QPR. HiLight Studio calls itself experimental for that reason.
- Physical brightness at full RGB: the framework offers no brightness channel, so thermal load is managed only by colour value and duty cycle.
- The stuck-LED latch has not been reproduced on this unit.

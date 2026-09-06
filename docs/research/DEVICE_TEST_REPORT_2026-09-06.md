# Device Test Report: Pixel 11 Pro, 2026-09-06

> Full telemetry and observability pass on the physical Pixel 11 Pro (grizzly, Android 17 / SDK 37) over wireless adb, dev-client build with the `PixelNative` module. Goal: **no mocked connections**. Each hook is verified from two sides where possible: the app's own provenance log (`[PixelKit]` in `adb logcat -s ReactNativeJS`) and an independent system view (`dumpsys`, HAL logs).

## Summary

| Hook | Status | Independent evidence |
| :--- | :--- | :--- |
| `useCapabilities` | **HW (device-verified)** | PackageManager features: UWB ✓, NFC ✓, BLE channel sounding ✓, Wi-Fi RTT ✓, satellite ✓, StrongBox ✓; AICore version read after `<queries>` fix |
| `useCPU` | **HW** | Topology `1x C1-Ultra 4109 MHz + 4x C1-Pro 3379 + 2x C1-Pro 2649`, governor `sched_pixel`, live per-core MHz (e.g. 1344/394/4109) |
| `useGPU` | **HW** | EGL: `ANGLE (Imagination Technologies, Vulkan 1.4.317 (PowerVR C-Series CXTP-48-1536 MC1))`; Choreographer 114 FPS @ 120 Hz, avg 8.77 ms |
| `useMemory` | **HW** | 9,335 MB used / 2,312 free of 11,647 MB, LMK threshold 216 MB, app heap 256 MB limit |
| `useADPF` | **HW / partial** | Thermal headroom 0.55, status NONE; thresholds read. SystemHealth CPU/GPU headroom returned null (see open items) |
| `useDisplay` | **HW** | 120 Hz mode, ARR supported, 11 refresh rates, HDR10/HLG/HDR10+. `setPreferredRefreshRate(60)` → `dumpsys display` shows `frameRateOverride {uid=10398 frameRateHz=60}`; 120 restores it |
| `useTorch` | **HW** | Camera HAL: `Torch for camera id 0 turned on for client PID 23113`; 21 strength levels; UI state followed the system callback |
| `useHaptics` (standard) | **HW** | `dumpsys vibrator_manager` lists TOUCH-usage effects for our uid on every button press |
| `useHaptics` (envelopes) | **Unverified** | Vibrator reports `CAP_COMPOSE_PWLE_EFFECTS_V2` and `areEnvelopeEffectsSupported()`; tap-driven test was inconclusive because the device locked mid-run. Re-test pending |
| `useAudio` | **HW** | `dumpsys audio`: `rec start … src:VOICE_RECOGNITION pack:com.pixelkit.sdk`, client format 1ch 16 kHz PCM; meter read −46 dBFS in a quiet room |
| `useSensors` | **HW** | Accelerometer 1.00 g on Z at rest, magnetometer −6/−33/−50 µT, barometer 900.8 hPa (≈981 m ISA), light 0.4–1.9 lux in a dark room (kernel event log matches) |
| `useBiometrics` | **HW** | BiometricService ran `FingerprintAuthenticationClient` for the prompt; secure window (black screenshot, expected) |
| `useDevice` | **HW** | Battery 99–100 %, discharging; Wi-Fi |
| `useDisplay` keep-awake | **HW** | `SCREEN_BRIGHT_WAKE_LOCK` with `WorkSource{10398 com.pixelkit.sdk}` |
| `useTPU` | **HW (detection only)** | AICore `0.release.prod_aicore_20260723.00_RC11`, PCS `1.0.release.962568596`; NPU feature flag not declared; inference metrics null by design |
| `useGemini` / `useVisionAI` / `useSpeechAI` | **Real or error** | Without a key: `sendMessage without key` logged and an error bubble shown. No simulated replies remain. With a key: Gemini `gemini-3.8-flash`, chat via `ai.chats`, vision via structured JSON, transcription via audio input (not exercised without a key) |
| `useNFC`, `useBLE`, `useUWB`, `useRadios` | **HW / SIMULATED (labelled)** | Radio adapters verified live via `PixelNative.getRadioInfo()` (`source: 'hardware'`): NFC antenna on/off + Observe Mode, Bluetooth adapter state + bonded devices, UWB chip state (`default`, `READY`). Tag/beacon/ranging RF scans remain simulated until peripheral scan services land |
| `useHiLight` | **SIMULATED (labelled)** | Hardware present; Google exposes no third-party API |
| `useTemperature` | **N/A (labelled)** | No thermometer on Pixel 11 Pro |

## UI fixes verified on device

- Header no longer overlaps the status bar (react-native-safe-area-context insets).
- Card badges wrap instead of overlapping titles.
- Sensor bars are centred with per-sensor ranges (±2 g, ±5 rad/s, ±100 µT); magnetometer now visible.
- Light sensor shows one decimal (dark rooms read 0.4–1.9 lux, not "0").
- Every card shows a provenance tag; the Observability panel lists per-module sources and the last events.

## Open items

1. **SystemHealthManager headroom** returns null on this build. Verify whether `getCpuHeadroom` requires a non-null `CpuHeadroomParams` or is unsupported on grizzly; the reflection path swallows the exception.
2. **Envelope haptics** need a clean re-test with the device unlocked; confirm entries in `dumpsys vibrator_manager` with a non-`effect` type.
3. **AILab input bar** is padded to clear the floating nav; confirm on device after the redesign.
4. Real NFC / BLE / UWB paths (P1 roadmap).
5. Screen timeout was set to 600000 ms for testing via `settings put system screen_off_timeout`; restore to 30000 when done.

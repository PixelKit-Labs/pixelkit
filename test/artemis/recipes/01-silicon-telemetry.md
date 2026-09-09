# Recipe 01: Silicon & Telemetry Verification

## Objective
Verify that the `useCPU`, `useGPU`, `useMemory`, and `useADPF` hooks correctly read live hardware stats on the device and report `source: "hardware"` (or `"derived"` where mathematically calculated).

## Target Application
- App Name: `PixelKit` or `PixelKit Template`
- Package: `com.pixelkit.template`

## Verification Milestones

1. **Launch App**:
   - Open the PixelKit application on the device.
   - If not already on the home screen, navigate to the **Silicon** tab (usually the first tab in the bottom bar).

2. **Verify CPU Telemetry**:
   - Locate the CPU card.
   - Assert that core frequencies (MHz) are displayed and non-zero.
   - Assert that CPU source badge displays `hardware`.
   - Assert that no value says `unavailable` or `null`.

3. **Verify Memory & System Telemetry**:
   - Scroll down to the Memory section.
   - Assert that total RAM and available RAM numbers are populated with realistic numbers (e.g., in MB or GB).
   - Assert that memory source badge displays `hardware`.

4. **Verify ADPF Thermal Telemetry**:
   - Locate the ADPF (Android Dynamic Performance Framework) section.
   - Verify that thermal status is displayed (e.g. `NONE`, `LIGHT`, `MODERATE`, or current thermal headroom).
   - If thermal headroom is present, verify it is a valid floating point number between 0.0 and 1.0.

5. **Diagnostic Assertions**:
   - Check device Logcat for any `NullPointerException` or `SecurityException` originating from `com.pixelkit.native`.
   - Record screenshots of the Silicon dashboard.

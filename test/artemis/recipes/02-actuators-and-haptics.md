# Recipe 02: Actuators & Haptics Verification

## Objective
Verify physical actuators controlled by `@pixelkit-labs/native`: `useHaptics`, `useTorch`, and `useHiLight`.

## Target Application
- App Name: `PixelKit` or `PixelKit Template`
- Package: `com.pixelkit.template`

## Verification Milestones

1. **Navigate to Actuators Screen**:
   - Tap the **Actuators** tab in the bottom navigation bar.

2. **Trigger Haptic Feedback**:
   - Locate the Haptics test panel.
   - Tap the "Light Click" button.
   - Tap the "Heavy Impact" button.
   - Tap the "Selection Changed" button.
   - Assert that button states reflect the trigger without throwing unhandled JavaScript or native exceptions.

3. **Toggle Flashlight (Torch)**:
   - Locate the Torch switch/button.
   - Tap to toggle torch **ON**.
   - Assert that torch state indicator changes to `Active` or `ON`.
   - Tap to toggle torch **OFF**.
   - Assert that torch state indicator changes to `Inactive` or `OFF`.

4. **Error & Logcat Check**:
   - Verify Logcat contains no `CameraAccessException` or vibrator hardware service errors.

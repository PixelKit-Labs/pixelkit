# Recipe 03: Sensors & Capture Verification

## Objective
Verify real-time sensor streams and hardware capture: `useSensors`, `useLocation`, `useCamera`, and `useAudio`.

## Target Application
- App Name: `PixelKit` or `PixelKit Template`
- Package: `com.pixelkit.template`

## Verification Milestones

1. **Navigate to Sensors Screen**:
   - Tap the **Sensors** tab in the bottom navigation bar.

2. **Handle Runtime Permissions**:
   - If a system dialog appears requesting Camera, Microphone, or Location permissions, tap "While using the app" or "Allow".
   - Artemis Safety Net will verify and clear permission requests.

3. **Verify Motion Sensors**:
   - Assert that Accelerometer readings (x, y, z) are streaming and updating.
   - Assert that Gyroscope or Magnetometer values are not static `0, 0, 0` or null.

4. **Verify Barometer / Environmental Sensors**:
   - Check if atmospheric pressure (hPa) is displayed (available on Pixel devices).

5. **Capture & Audio**:
   - Verify camera preview viewfinder renders properly.
   - Assert that audio input level meter registers amplitude.

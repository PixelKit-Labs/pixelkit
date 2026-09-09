# Recipe 05: Full Sanity Regression Suite

## Objective
Comprehensive end-to-end regression across all four PixelKit tabs, ensuring stability, absence of native crashes, and accurate hardware reporting.

## Target Application
- App Name: `PixelKit` or `PixelKit Template`
- Package: `com.pixelkit.template`

## Verification Flow

1. **Cold Launch & Splash**:
   - Force-stop `com.pixelkit.template` via ADB: `adb shell am force-stop com.pixelkit.template`.
   - Launch app: `adb shell monkey -p com.pixelkit.template -c android.intent.category.LAUNCHER 1`.
   - Verify initial splash clears within 3 seconds.

2. **Tab 1: Silicon**:
   - Select Silicon tab.
   - Verify CPU frequencies, GPU, and memory are not null.
   - Verify thermal ADPF headroom.

3. **Tab 2: Actuators**:
   - Select Actuators tab.
   - Trigger haptic pattern.
   - Toggle torch ON then OFF.

4. **Tab 3: Sensors**:
   - Select Sensors tab.
   - Check accelerometer stream is active.
   - Ensure viewfinder preview does not freeze.

5. **Tab 4: AI**:
   - Select AI tab.
   - Verify Gemini Nano AICore state.

6. **Post-Run Logcat Audit**:
   - Dump logcat for fatal exceptions: `adb logcat -d *:E | grep -i "pixelkit"`.
   - Pass Criteria: Zero uncaught exceptions, zero SIGSEGV crashes.

# Recipe 04: On-Device AI & Gemini Nano Verification

## Objective
Verify on-device generative AI and ML Kit acceleration powered by `@pixelkit-labs/mlkit`: `useGeminiNano`, `useGenAITasks`, and `useVisionAI`.

## Target Application
- App Name: `PixelKit` or `PixelKit Template`
- Package: `com.pixelkit.template`

## Verification Milestones

1. **Navigate to AI Screen**:
   - Tap the **AI** tab in the bottom navigation bar.

2. **Check AICore & Gemini Nano Availability**:
   - Locate the Gemini Nano status indicator.
   - Assert whether the device's Google AICore reports `Ready`, `Downloading`, or `Unsupported`.
   - On compatible Pixel devices (Pixel 8+, 9+, 10+, 11+), AICore should report `Ready`.

3. **Trigger On-Device Generation**:
   - Tap the "Generate Summary" or "Proofread" button.
   - Wait for the on-device inference to complete.
   - Assert that output text appears in the output container.
   - Verify that generation time and token metrics (tokens/sec) are reported.

4. **Verify Vision / ML Kit Model**:
   - If document scanner, text recognition, or barcode scanner is presented, trigger scan mode.
   - Assert that ML Kit native pipeline initialises without crashing the process.

5. **Logcat & Memory Inspection**:
   - Ensure AICore service IPC did not throw binder transaction errors.

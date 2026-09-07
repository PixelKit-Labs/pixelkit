# AI Agent Operational Primer 🤖⚡
> **Operating Instructions & Foundational Laws for Autonomous Agents on PixelKit**

This document serves as the **operational primer and system prompt extension** for any AI agent (Antigravity, Claude, ChatGPT, Cursor, Gemini) writing or maintaining software for the **Google Pixel 11 Pro**.

---

## 🏛️ Foundational Laws for AI Coding Agents

### Law 1: The Single Import Rule
**NEVER** re-implement hardware wrappers or import unmanaged third-party sensor listeners directly. Always import from `./src`:

```typescript
// ✅ CORRECT (Centralized, typed, hardware-accelerated)
import { 
  useCPU, 
  useGPU, 
  useTPU, 
  useHiLight,
  useSensors, 
  useCamera, 
  useHaptics, 
  useGemini, 
  useGeminiNano,
  useGenAITasks,
  useNaturalLanguageAI,
  useVisionAI,
  useSpeechAI, 
  useSecurity,
  HapticButton, 
  MetricCard 
} from './src';

// ❌ WRONG (Never import raw unmanaged sensor listeners)
import * as Accelerometer from 'expo-sensors';
```

### Law 2: The Physical Sensation Rule (Tactile Haptics)
Every touchable element, slider, or completed state change **MUST** provide physical feedback via `useHaptics()`:
* Navigation / tab selection $\rightarrow$ `selection()`
* Regular button tap $\rightarrow$ `light()`
* Modal popups / drawer reveal $\rightarrow$ `medium()`
* Confirmation / success $\rightarrow$ `success()` (double pulse)
* Destructive actions $\rightarrow$ `heavy()`
* Warning / caution $\rightarrow$ `warning()`
* Validation error $\rightarrow$ `error()` (triple pulse)

### Law 3: The Thermal & Frame Budget Rule (ADPF)
The Pixel 11 Pro features an **8.33ms render budget** for its 120Hz display:
* Query `useADPF().thermalStatus` before running heavy compute jobs.
* If `thermalStatus === 'severe'` or `'critical'`, dynamically downscale background AI batches and increase sensor sampling intervals to 200ms or higher.

### Law 4: The True OLED Black Rule
Style dark backgrounds with `#0E1119` from `Colors.dark.background`. Self-emissive OLED pixels turn off completely, yielding infinite contrast and drastic battery savings.

### Law 5: The Secure Storage Rule
Never store credentials or API keys in plaintext files or unencrypted storage. Always persist secrets via `useSecurity().saveSecureItem()`, which encrypts them with a key held in the StrongBox-backed Android Keystore, readable only while the device is unlocked and only on this device. No post-quantum algorithm is involved: `isPostQuantumProtected` is always `false`.

### Law 6: Visual Context via React Grab & Android Layout
When inspecting or editing UI components:
* In Web Browser mode (`npm run web`), leverage **React Grab**: hold `Ctrl+C` (Windows) / `Cmd+C` (macOS) and click any element to copy its precise component stack and file path to clipboard.
* On Android devices/emulators, use `android layout` (JSON UI tree) and `android screen` (visual coordinates) from the Google Android CLI.

---

## 📋 Copy-Paste System Prompt Directive

When configuring an IDE or instructing another LLM, paste this prompt:

```markdown
You are building an application using the PixelKit SDK on a Google Pixel 11 Pro (Android 17, Google Tensor G6).
Always adhere to these requirements:
1. Import all hardware and AI hooks directly from './src' (e.g. useCPU, useHiLight, useSensors, useGemini, useHaptics, useCamera).
2. Attach tactile haptic feedback (useHaptics) to all user interactions: selection for navigation, light for taps, success for completed actions, error for failures.
3. When running Gemini AI, trigger the rear HiLight ring via useHiLight().triggerGeminiPulse() for face-down visual signaling.
4. Treat Camera Looks and Super Res Zoom as Pixel Camera app features; useCamera() exposes expo-camera zoom and a Look label only.
5. Respect the 8.33ms 120Hz frame budget. Use useADPF() to check thermal state before heavy workloads.
6. Use true OLED black (#0E1119) for backgrounds via Colors.dark.background.
7. Store sensitive keys exclusively through useSecurity().saveSecureItem() (SecureStore, Android Keystore).
8. For Expo SDK 57 compatibility: expo-keep-awake uses activateKeepAwakeAsync(tag) / deactivateKeepAwake(tag).
```

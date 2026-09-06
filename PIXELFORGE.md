# PixelForge SDK ⚡
> **The Hardware & AI Framework for Google Pixel & Android**  
> *Engineered for high-performance mobile applications and AI-driven bots.*

---

## 📖 Executive Summary

**PixelForge** is a production-grade, modular framework and SDK designed to bridge Google Pixel hardware silicon (Tensor TPU, Titan M2 Security Enclave, 120Hz LTPO display, Camera array, and 6-axis sensors) with modern Generative AI capabilities (Google Gemini, Vision AI, and LiteRT).

This document serves as the **canonical API Reference and Blueprint for AI agents (including the future Delta Bot)** and developers building on top of this framework.

---

## 🏛️ Project Architecture

```text
pixel-delta/ (PixelForge Framework)
├── App.tsx                     # Main App Shell & Navigation Router
├── app.json                    # Expo & Android 15/16 Manifest & Hardware Permissions
├── src/
│   ├── index.ts                # Root barrel export for all hooks, types, and UI
│   ├── core/
│   │   └── types.ts            # Strongly-typed telemetry, sensor, and AI interfaces
│   ├── hardware/               # Physical Silicon & Hardware Abstractions
│   │   ├── useSensors.ts       # 6-Axis Motion, Barometer/Altimeter, Magnetometer, Light
│   │   ├── useHaptics.ts       # Linear Resonant Actuator tactile waveforms
│   │   ├── useDevice.ts        # Battery level, state, thermal state, model info
│   │   ├── useDisplay.ts       # 120Hz LTPO display, wake lock, brightness
│   │   ├── useBiometrics.ts    # Titan M2 Fingerprint & Face Unlock auth
│   │   ├── useLocation.ts      # High-precision GNSS positioning & heading
│   │   ├── useADPF.ts          # Android Dynamic Performance Framework (Headroom/Thermal)
│   │   ├── useAudio.ts         # Mic input, decibel metering & sound recording
│   │   ├── useNFC.ts           # RFID / NFC tag read & write controller
│   │   └── useSecurity.ts      # Hardware-backed Titan M2 SecureStore
│   ├── ai/                     # Intelligence & Acceleration Layer
│   │   ├── useTPU.ts           # Google Tensor TPU hardware accelerator & latency benchmarker
│   │   ├── useGemini.ts        # Multi-turn conversational chat, reasoning, and completions
│   │   ├── useVisionAI.ts      # Multimodal camera snapshot & visual inspection
│   │   └── geminiClient.ts     # Google Gen AI SDK client with secure key persistence
│   ├── theme/
│   │   └── colors.ts           # Material 3 Expressive & Pure OLED Black tokens
│   ├── components/             # Reusable UI Primitives
│   │   ├── HapticButton.tsx    # Tactile touch button with haptic feedback
│   │   ├── MetricCard.tsx      # Real-time hardware telemetry display card
│   │   └── SensorVisualizer.tsx# Live 3-axis motion visualizer
│   └── screens/
│       ├── DashboardScreen.tsx # Silicon & compute HUD (FPS, CPU/GPU headroom, TPU, Battery)
│       ├── AILabScreen.tsx     # Gemini Chat, Vision Inspector, and API key management
│       └── SensorsLabScreen.tsx# Interactive sensor playground & haptics test pad
```

---

## 🔌 Core Hardware APIs (AI Quick-Reference)

Every hook can be imported directly from `./src`:
```typescript
import { 
  useSensors, 
  useHaptics, 
  useTPU, 
  useGemini, 
  useVisionAI, 
  useDevice, 
  useADPF, 
  useBiometrics,
  useDisplay,
  HapticButton, 
  MetricCard 
} from './src';
```

---

### 1. `useSensors(updateIntervalMs?: number)`
Connects to the phone's 6-axis IMU, barometer, and light sensors.
* **Returns**:
  * `accelerometer`: `{ x: number, y: number, z: number }` (gravitational acceleration in `g`)
  * `gyroscope`: `{ x: number, y: number, z: number }` (rotational velocity in `rad/s`)
  * `magnetometer`: `{ x: number, y: number, z: number }` (geomagnetic field in `μT`)
  * `barometer`: `{ pressure: number, relativeAltitude?: number }` (air pressure in `hPa`, altitude in `m`)
  * `lightLux`: `number | undefined` (ambient illumination)
  * `isAvailable`: `boolean`

```typescript
const { accelerometer, gyroscope, barometer } = useSensors(100);
console.log(`Altitude: ${barometer.relativeAltitude}m, Tilt: X=${accelerometer.x}`);
```

---

### 2. `useHaptics()`
Triggers crisp, mechanical-feeling tactile feedback via the Pixel's **Linear Resonant Actuator (LRA)**.
* **Methods**:
  * `selection()`: Ultra-light tactile tick (ideal for sliders, wheel pickers, switches).
  * `light()`: Crisp tap (ideal for standard buttons).
  * `medium()`: Solid tactile bump (ideal for drag-and-drop or toggles).
  * `heavy()`: Strong physical thud (ideal for destructive actions or hits).
  * `success()`: Double-pulse confirmation waveform.
  * `warning()`: Alert vibration pattern.
  * `error()`: Triple-pulse error warning.

```typescript
const haptics = useHaptics();
<HapticButton title="Confirm" onPress={() => haptics.success()} />
```

---

### 3. `useTPU()`
Direct interface to the **Google Tensor TPU / Neural Processing Unit**.
* **Returns**:
  * `activeDelegate`: `'Tensor TPU' | 'NPU' | 'GPU' | 'CPU Fallback'`
  * `isHardwareAccelerated`: `boolean`
  * `lastInferenceLatencyMs`: `number` (inference latency in milliseconds)
  * `throughputTokensPerSec`: `number` (estimated token processing speed)
  * `memoryFootprintMB`: `number` (RAM used by neural model)
  * `isBenchmarking`: `boolean`
  * `benchmarkTPU()`: `Promise<TPUAcceleration>` (runs real-time matrix multiplication benchmark)

```typescript
const tpu = useTPU();
await tpu.benchmarkTPU();
console.log(`TPU Latency: ${tpu.lastInferenceLatencyMs} ms`);
```

---

### 4. `useGemini()`
Conversational AI engine backed by `@google/genai` (Gemini 2.5 Flash).
* **Returns**:
  * `messages`: `AIMessage[]` (history with roles, content, latencies, and token counts)
  * `isLoading`: `boolean`
  * `sendMessage(prompt: string)`: Sends a prompt, computes latency, and streams or returns response
  * `clearMessages()`: Clears chat history
  * `hasApiKey`: `boolean`
  * `setApiKey(key: string)`: Updates the active key

```typescript
const { messages, isLoading, sendMessage } = useGemini();
sendMessage("Analyze telemetry and optimize sensor sampling rate.");
```

---

### 5. `useVisionAI()`
Multimodal camera capture and visual scene inspection.
* **Returns**:
  * `captureAndAnalyze(useCamera: boolean)`: Opens camera (or gallery), captures frame, and sends to Gemini Vision
  * `selectedImageUri`: `string | null`
  * `analysis`: `{ description: string, labels: string[], latencyMs: number } | null`
  * `isAnalyzing`: `boolean`

---

### 6. `useADPF()`
Android Dynamic Performance Framework for hardware thermal budgeting.
* **Returns**:
  * `cpuHeadroom`: `number` (0.0 to 1.0; 1.0 = full CPU capacity available)
  * `gpuHeadroom`: `number`
  * `thermalStatus`: `'nominal' | 'light' | 'moderate' | 'severe' | 'critical'`
  * `currentFps`: `number` (real-time measured frame rate)
  * `reportWorkDuration(workMs, targetBudgetMs)`: Signals the Android kernel to boost or throttle clocks

---

### 7. `useBiometrics()` & `useSecurity()`
Titan M2 cryptographic hardware enclave.
* `useBiometrics().authenticate(prompt)`: Prompts for in-screen fingerprint or 3D Face Unlock.
* `useSecurity().saveSecureItem(key, val)`: Saves encrypted token into hardware keystore.
* `useSecurity().getSecureItem(key)`: Retrieves hardware-encrypted secret.

---

### 8. `useDisplay()`
* `isKeepAwake`: `boolean`
* `toggleKeepAwake()`: Locks screen awake (prevents screen dimming during active monitoring)
* `brightness`: `number` (0.0 to 1.0)
* `setScreenBrightness(val)`: Sets hardware screen brightness
* `refreshRateHz`: `120` (Pixel Pro LTPO display)

---

### 9. `useAudio()` & `useNFC()`
* `useAudio()`: Real-time decibel level meter (`meteringDecibels`), `startRecording()`, `stopRecording()`.
* `useNFC()`: Polls for nearby contactless smart cards/tags (`startScan()`, `lastScannedTag`).

---

## 🎨 UI Primitives

### `HapticButton`
Pill-shaped Material 3 button with built-in tactile vibration:
```typescript
<HapticButton 
  title="Action" 
  onPress={handleAction} 
  variant="primary" // 'primary' | 'secondary' | 'outline' | 'danger'
  hapticType="light" // 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'
/>
```

### `MetricCard`
Displays real-time hardware telemetry with badges and subtitles:
```typescript
<MetricCard
  title="Sensor Name"
  value={42}
  unit="ms"
  badge="ACTIVE"
  badgeColor="#00E5FF"
  subtitle="Description"
/>
```

---

## 🚀 Running on Your Pixel 11 Pro

1. Start the Expo development server:
   ```bash
   npm start
   ```
2. Open **Expo Go** on your Pixel 11 Pro.
3. Scan the terminal QR code.
4. The app will launch immediately with **live hot-reloading** over Wi-Fi!

---

## 🤖 Instructions for AI Agents Building Apps

When an AI agent (such as Delta) is tasked with building a new application using PixelForge:
1. **Never reinvent hardware wrappers**: Import the hooks from `./src`.
2. **Always include tactile haptics**: Bind touch events to `useHaptics` for premium physical feel.
3. **Respect thermal headroom**: Query `useADPF()` before launching heavy recursive loops or batch processing.
4. **Use Material 3 colors**: Always style with `Colors.dark` from `./src/theme/colors` for OLED battery savings and true black contrast.

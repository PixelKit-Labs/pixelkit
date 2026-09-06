# PixelForge SDK Documentation ⚡
> **The Official Developer & AI Agent Documentation Portal for Google Pixel 11 Pro**

Welcome to the comprehensive documentation suite for the **PixelForge SDK**. This framework directly unlocks the bare silicon, sensory suite, and neural hardware of the **Google Pixel 11 Pro** powered by the **Google Tensor G6 ("Malibu")** processor fabricated on **TSMC 2nm (N2)**.

---

## 🧭 Documentation Sitemap

### 🚀 [Getting Started](./getting-started/)
* **[Quickstart Guide](./getting-started/quickstart.md)**: Workstation prerequisites (Node 20+, Google Android CLI), installing dependencies, running on Pixel 11 Pro via Expo Go or development builds.
* **[Architecture & Silicon Overview](./getting-started/architecture.md)**: Deep dive into the Tensor G6 7-core cluster, PowerVR GPU, Titan M3 coprocessor, Pixelsnap Qi2.2 magnetic charging, and the React Native Hermes runtime.

### 📚 [API Reference](./api/)
* **[Silicon & Compute](./api/silicon-compute.md)**: `useCPU`, `useGPU`, `useTPU`, `useMemory`, `useADPF`.
* **[Pixel Pro Exclusives](./api/pro-exclusives.md)**: `useHiLight` (camera bar notification ring), `useUWB` (spatial radar AoA), `useTemperature` (backward compatibility & ambient).
* **[Neural & AI](./api/neural-ai.md)**: `useGemini`, `useSpeechAI`, `useVisionAI`, `geminiClient`.
* **[Sensors & Actuators](./api/sensors-actuators.md)**: `useSensors` (6-axis IMU + Barometer), `useCamera` (Camera Looks & 120x Zoom), `useTorch`, `useHaptics` (LRA tactile profiles).
* **[Radios & Security](./api/radios-security.md)**: `useBiometrics`, `useSecurity` (Titan M3 Post-Quantum Cryptography), `useBLE`, `useNFC`, `useLocation` (dual-band GNSS).
* **[System & Media](./api/system-media.md)**: `useAudio`, `useDisplay` (3,600 nits 120Hz LTPO), `useDevice`, `useNetwork` (MediaTek M90 modem, Satellite SOS).

### 🤖 [AI Agent Guidance](./ai-guidance/)
* **[Agent Operational Primer](./ai-guidance/agent-primer.md)**: Foundational laws for autonomous coding agents, the 5 Golden Rules of PixelForge, and copy-paste system prompt directives.
* **[Production Recipes](./ai-guidance/recipes.md)**: Copy-pasteable recipes for voice agent loops, multimodal scene reasoning, face-down HiLight visual signaling, and spatial tracking.

### 🛠️ [Guides & Diagnostics](./guides/)
* **[Troubleshooting & Diagnostics](./guides/troubleshooting.md)**: Expo SDK 57 specifics, camera permissions, keep-awake tags, Hermes bytecode compilation, and thermal throttling mitigations.

### 🔬 [Hardware Research & Gap Analysis](./research/)
* **[Pixel 11 Pro Hardware Research & SDK Gap Analysis](./research/PIXEL_11_PRO_HARDWARE_RESEARCH.md)**: Ground-truth spec sheet, Android 17 (API 37) surfaces, on-device Gemini Nano ML Kit integration roadmap, and native Kotlin module plan.

### 📑 Consolidated Single-File Manuals
* **[HARDWARE_API.md](./HARDWARE_API.md)**: Complete 23-module API reference in a single document.
* **[AI_PRIMER.md](./AI_PRIMER.md)**: Complete AI agent operational manual in a single document.

---

## 🏛️ Silicon Architecture Diagram

```
+-------------------------------------------------------------------------+
|                           REACT NATIVE / EXPO                           |
|                      (Hermes Bytecode Execution)                        |
+-------------------------------------------------------------------------+
                                     |
+-------------------------------------------------------------------------+
|                           PIXELFORGE SDK                                |
|                        (src/index.ts Re-exports)                        |
+-------------------------------------------------------------------------+
        |                  |                    |                  |
+---------------+  +---------------+  +------------------+  +---------------+
|  CPU / GPU    |  |  Tensor TPU   |  | Pro Exclusives   |  | Titan M3      |
|  Tensor G6    |  |  NNAPI/LiteRT |  | HiLight LED Ring |  | Quantum Vault |
|  TSMC 2nm N2  |  |  Gemini 2.5   |  | UWB Radar AoA    |  | Biometrics    |
+---------------+  +---------------+  +------------------+  +---------------+
```

---

## ⚡ The Single Import Rule

All hardware hooks and UI primitives are centralized:

```typescript
import { 
  useCPU, 
  useGPU, 
  useTPU, 
  useHiLight, 
  useSensors, 
  useCamera, 
  useGemini, 
  useSpeechAI, 
  useHaptics, 
  HapticButton, 
  MetricCard 
} from './src';
```

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
* **[Sensors & Actuators](./api/sensors-actuators.md)**: `useSensors` (6-axis IMU + Barometer), `useCamera` (expo-camera zoom, flash, lens), `useTorch`, `useHaptics` (LRA tactile profiles).
* **[Radios & Security](./api/radios-security.md)**: `useBiometrics`, `useSecurity` (Titan M3 Post-Quantum Cryptography), `useBLE`, `useNFC`, `useLocation` (dual-band GNSS).
* **[System & Media](./api/system-media.md)**: `useAudio`, `useDisplay` (3,600 nits 120Hz LTPO), `useDevice`, `useNetwork` (MediaTek M90 modem, Satellite SOS).

### 🤖 [AI Agent Guidance](./ai-guidance/)
* **[Agent Operational Primer](./ai-guidance/agent-primer.md)**: Foundational laws for autonomous coding agents, the 5 Golden Rules of PixelForge, and copy-paste system prompt directives.
* **[Production Recipes](./ai-guidance/recipes.md)**: Copy-pasteable recipes for voice agent loops, multimodal scene reasoning, face-down HiLight visual signaling, and spatial tracking.
* **Agent Skills & Tooling**: 26 official Expo agent skills (`.agents/skills/` tracked via `skills-lock.json`) covering navigation, UI, modules, animations, and deployment alongside Google `android-cli`.

### 🛠️ [Guides & Diagnostics](./guides/)
* **[Built-in AI, Function Calling & Voice (hub)](./guides/README.md)**: Where inference runs (Gemini Nano 4 on-device vs Gemini cloud), capability matrix, and shared dev-build prerequisites.
* **[On-Device AI with Gemini Nano](./guides/on-device-ai-gemini-nano.md)**: `pixel-nano` Expo Module over the ML Kit GenAI Prompt API, `useGeminiNano`, structured output, thinking mode, hybrid routing.
* **[Function Calling & Hardware Tools](./guides/function-calling.md)**: One tool registry executed by cloud Gemini function calling, Gemini Nano structured output, and Android AppFunctions.
* **[Voice: Speech In, Speech Out, Live Agents](./guides/voice.md)**: On-device streaming STT (Pixel 10/11 Advanced mode), Gemini Live API voice agents with ephemeral tokens, TTS, HiLight/haptic status.
* **[Troubleshooting & Diagnostics](./guides/troubleshooting.md)**: Expo SDK 57 specifics, camera permissions, keep-awake tags, Hermes bytecode compilation, and thermal throttling mitigations.

### 🔬 [Research](./research/)
* **[Pixel 11 Pro Hardware Research & SDK Gap Analysis](./research/PIXEL_11_PRO_HARDWARE_RESEARCH.md)**: Ground-truth spec sheet, Android 17 API surface, hook-by-hook gap analysis, and prioritised roadmap.
* **[Device Profile: Pixel 11 Pro (captured from hardware)](./research/DEVICE_PROFILE_PIXEL_11_PRO.md)**: adb-verified identity (Android 17 / SDK 37, Tensor G6, grizzly), CPU clocks, display modes and ARR, AICore version, feature flags (UWB, channel sounding, Wi-Fi RTT, satellite, StrongBox, no thermometer), services, haptic PWLE v2 capabilities, thermal thresholds, full sensor inventory.
$1* **[HiLight LED Array](./research/HILIGHT_LED_ARRAY.md)**: Measured lights-service facts (eight `LIGHT_TYPE_APPLICATION` lights), the `CONTROL_DEVICE_LIGHTS` gate, HiLight Studio internals, shell-level proof and the planned Shizuku path.
* **[Pixel 11 Pro Deep Dive (Round 2)](./research/PIXEL_11_PRO_DEEP_DIVE.md)**: Corrections to round 1, Android 16/17 APIs missed (RangingManager, real ADPF headroom, haptic envelopes, ARR, constrained satellite networks, Advanced Protection), 2026 ML Kit / AICore timeline, Play deadlines, Android CLI docs & skills, revised hook roadmap.

### 📑 Consolidated Single-File Manuals
* **[HARDWARE_API.md](./HARDWARE_API.md)**: Complete 24-module API reference in a single document.
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
|  TSMC 2nm N2  |  |  Gemini 3.8   |  | UWB Radar AoA    |  | Biometrics    |
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

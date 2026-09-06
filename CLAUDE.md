# Claude Code Instructions for PixelForge SDK ⚡
> **Hardware & AI Framework for Google Pixel 11 Pro (Tensor G6 2nm)**

---

## 🚨 MANDATORY RULE: Always Keep Docs Up To Date

Whenever you make **ANY** changes to this codebase (creating or modifying hooks, updating TypeScript types, changing UI screens, altering configurations, or adding features):

1. **Update `docs/`**:
   - Update API specifications in `docs/api/` (`silicon-compute.md`, `pro-exclusives.md`, `neural-ai.md`, etc.) and `docs/HARDWARE_API.md`.
   - Update AI recipes & guidelines in `docs/ai-guidance/` and `docs/AI_PRIMER.md`.
   - Update getting started guides in `docs/getting-started/`.
2. **Update `README.md` & `PIXELFORGE.md`**:
   - Keep the feature matrix, hardware mapping tables, and architecture directory trees 100% accurate.
3. **Update On-Device Docs (`src/screens/DocsScreen.tsx`)**:
   - Any new or modified hook must be reflected in the interactive in-app documentation viewer with an updated signature, TypeScript recipe, and AI tip.
4. **Docs must NEVER be an afterthought or omitted**. Every change that alters behavior or exports must include its corresponding documentation updates.

---

## 🏛️ Project Architecture & Silicon Mapping

* **Target Device**: Google Pixel 11 Pro
* **Processor**: Google Tensor G6 ("Malibu") fabricated on TSMC 2nm (N2)
* **CPU Topology**: 7-Core Asymmetrical (1x ARM C1-Ultra @ 4.11GHz + 4x C-1 Pro @ 3.38GHz + 2x C-1 Pro @ 2.65GHz)
* **GPU**: PowerVR / IMG CXTP (Vulkan 1.3 / OpenGL ES 3.2, 8.33ms budget for 120Hz LTPO)
* **Security**: Titan M3 Security Coprocessor with Post-Quantum Cryptography (PQC)
* **Camera Bar**: Multi-color "HiLight" glanceable notification & Gemini AI status LED ring (`useHiLight`)
* **Camera Array**: 50MP Wide + 48MP Ultrawide + 48MP Periscope (120x Generative AI Zoom, Camera Looks, Ultra Low Light Video in 5-10 lux)
* **Display**: 3,600 nits Super Actua 1-120Hz LTPO OLED (`Colors.dark.background = '#07060E'` for true OLED black)
* **Modem**: MediaTek M90 (Wi-Fi 7, 5G Sub-6/mmWave, Satellite SOS)
* **Charging**: Pixelsnap Qi2.2 25W magnetic wireless charging

---

## 🛠️ Development & Validation Commands

* **TypeScript Typecheck**: `npm run typecheck` (`tsc --noEmit`) - Must pass with 0 errors.
* **Metro Bundler Check**: `npx expo export -p android` - Verifies Hermes bytecode compilation.
* **Android CLI**: `android describe --project_dir=.`, `android layout`, `android screen`.
* **Agent Skills (`.agents/skills/`)**:
  - `android-cli`: Android CLI, SDK management, AVD controls, UI layout inspection.
  - `expo/skills` (26 skills via `npx skills add expo/skills` & `skills-lock.json`): `expo-router`, `expo-native-ui`, `expo-ui`, `expo-module`, `expo-design-system`, `expo-animation`, `eas-app-stores`, `eas-hosting`, `eas-observe`, `eas-simulator`, `eas-update`, `eas-workflows`, etc.

---

## 📋 The 5 Golden Rules of PixelForge

1. **Single Import Rule**: Always import from `./src` (e.g. `import { useCPU, useHiLight, useSensors } from './src'`). Never write raw listeners.
2. **Physical Sensation Rule**: Trigger `useHaptics` on all touchable elements (`selection`, `light`, `medium`, `heavy`, `success`, `warning`, `error`).
3. **Thermal & Frame Budget Rule**: Respect 8.33ms 120Hz frame budget. Use `useADPF()` to check thermal headroom before heavy jobs.
4. **True OLED Black Rule**: Use `#07060E` for dark backgrounds to save battery on self-emissive OLED panels.
5. **Titan M3 Enclave Rule**: Store sensitive keys and tokens exclusively in `useSecurity().saveSecureItem()` which encrypts into the Titan M3 PQC vault.

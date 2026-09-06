# PixelForge Agent Guidelines ⚡

## Expo SDK 57
Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Android CLI & Project Describing
The official Google Android CLI (`android.exe`) is installed and available in PATH (`%USERPROFILE%\AppData\AndroidCLI\android.exe`).

### Project Describing (`android describe`)
* Run `android describe --project_dir=<path>` to generate descriptive metadata and locate build targets/APK outputs.
* Use `android layout` to inspect device UI trees in JSON format.
* Use `android screen` to visually inspect screen elements and capture screenshots.

### Android Skills
* Built-in skills are located in `.agents/skills/android-cli/`. Refer to `.agents/skills/android-cli/SKILL.md` for CLI workflows.

### Official Expo Agent Skills
* Official Expo agent skills are installed in `.agents/skills/` (managed via `skills-lock.json` and `npx skills add expo/skills`).
* 26 specialized skills are available for Expo development:
  - **Navigation & UI**: `expo-router`, `expo-native-ui`, `expo-ui`, `expo-design-system`, `expo-animation`
  - **Modules & Native**: `expo-module`, `expo-migrate-module`, `expo-brownfield`, `expo-dev-client`
  - **Data, Web & DOM**: `expo-data-fetching`, `expo-dom`, `expo-web-to-native`, `expo-examples`
  - **Deployment & EAS**: `eas-app-stores`, `eas-hosting`, `eas-observe`, `eas-simulator`, `eas-update`, `eas-update-insights`, `eas-workflows`
  - **Project Management**: `expo-overview`, `expo-project-structure`, `expo-upgrade`, `expo-skill-eval`, `expo-skill-feedback`
* Consult each skill's `SKILL.md` before executing related tasks.

---

## 🚨 Mandatory Documentation Synchronization Rule

Whenever you make **ANY** changes to the codebase (adding/modifying hooks, updating types, changing UI screens, adding hardware features, or modifying dependencies):
1. **You MUST immediately update the corresponding documentation files in `docs/`**:
   - API changes $\rightarrow$ `docs/api/` (`silicon-compute.md`, `pro-exclusives.md`, `neural-ai.md`, etc.) and `docs/HARDWARE_API.md`
   - AI guidelines/rules $\rightarrow$ `docs/ai-guidance/` and `docs/AI_PRIMER.md`
   - Architectural shifts $\rightarrow$ `docs/getting-started/` and `docs/index.md`
2. **You MUST keep `README.md` and `PIXELFORGE.md` up to date**:
   - The feature matrix, directory trees, and hook examples must reflect real code.
3. **You MUST update the In-App Documentation Browser (`src/screens/DocsScreen.tsx`)**:
   - Any new hook or updated signature must appear in the interactive on-device viewer with a working TypeScript example and AI tip.
4. **Documentation must NEVER be omitted, deferred, or allowed to fall out of sync with code**.

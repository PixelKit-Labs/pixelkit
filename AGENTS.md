# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

---

# Android CLI & Project Describing

The official Google Android CLI (`android.exe`) is installed and available in PATH (`%USERPROFILE%\AppData\AndroidCLI\android.exe`).

### Project Describing (`android describe`)
When analyzing an Android project or locating build targets and APK outputs:
* Run `android describe --project_dir=<path>` to analyze the project and generate descriptive metadata JSON files.
* Use the resulting metadata to identify build targets, APK locations, and artifact outputs efficiently.

### Device Interaction & Layout Inspection
* Use `android layout` to retrieve the JSON UI layout tree of a connected device or emulator.
* Use `android screen` to capture screenshots and obtain bounding coordinates for UI elements.
* Follow the instructions in `.agents/skills/android-cli/` when executing journeys or device interactions.

### Android Skills Integration
* The `android-cli` skill is installed in `.agents/skills/android-cli/`.
* Consult `.agents/skills/android-cli/SKILL.md` for CLI command details, SDK management (`android sdk`), and emulator controls.

---

# Mandatory Documentation Synchronization Rule

**CRITICAL REQUIREMENT FOR ALL CODING AGENTS (Antigravity, Claude, Gemini, Delta)**:
Whenever you make ANY changes to the codebase (adding/modifying hooks, updating types, changing UI screens, adding hardware features, or modifying dependencies):
1. **You MUST immediately update the corresponding documentation files in `docs/`**:
   - API changes $\rightarrow$ `docs/api/` (`silicon-compute.md`, `pro-exclusives.md`, `neural-ai.md`, etc.) and `docs/HARDWARE_API.md`
   - AI guidelines/rules $\rightarrow$ `docs/ai-guidance/` and `docs/AI_PRIMER.md`
   - Architectural shifts $\rightarrow$ `docs/getting-started/` and `docs/index.md`
2. **You MUST keep `README.md` and `PIXELFORGE.md` up to date**:
   - The feature matrix, directory trees, and hook examples must reflect real code.
3. **You MUST update the In-App Documentation Browser (`src/screens/DocsScreen.tsx`)**:
   - Any new hook or updated signature must appear in the interactive on-device viewer with a working TypeScript example and AI tip.
4. **Documentation must NEVER be omitted, deferred, or allowed to fall out of sync with code**. Every commit that alters functionality must include its documentation updates.


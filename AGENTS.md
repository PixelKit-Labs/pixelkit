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

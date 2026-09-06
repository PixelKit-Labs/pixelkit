# PixelForge Agent Guidelines

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

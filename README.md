# PixelForge SDK ⚡
> **The Hardware & AI Framework for Google Pixel & Android**  
> *Engineered for high-performance mobile applications and AI-driven bots.*

---

## 📋 Prerequisites

Before developing with PixelForge, ensure the following tools are installed:

### 1. Node.js
* Version **20.x** or higher (tested with Node 24).
* Verify installation: `node -v`

### 2. Official Android CLI (`android.exe`)
The official Google Android CLI provides commands to manage SDK packages, inspect devices, capture screenshots, analyze layout trees, and generate project metadata.

#### Installation:
* **Windows (Command Prompt / PowerShell)**:
  ```cmd
  curl.exe -fsSL https://dl.google.com/android/cli/latest/windows_x86_64/install.cmd -o "%TEMP%\i.cmd" && "%TEMP%\i.cmd"
  ```
* **macOS (Apple Silicon)**:
  ```bash
  curl -fsSL https://dl.google.com/android/cli/latest/darwin_arm64/install.sh | bash
  ```
* **Linux (x86_64)**:
  ```bash
  curl -fsSL https://dl.google.com/android/cli/latest/linux_x86_64/install.sh | bash
  ```

* Verify installation:
  ```bash
  android --help
  ```

---

## 🛠️ Android CLI & Project Describing (`android describe`)

The Android CLI includes the `describe` command to analyze Android project structures and locate build artifacts:

```bash
# Generate descriptive metadata and identify JSON build targets & APK outputs
android describe --project_dir=.
```

### Key Android CLI Commands:
* `android describe`: Analyzes project structure and outputs paths to JSON metadata detailing build targets and artifact locations (e.g., APKs).
* `android layout`: Dumps the UI layout tree of a connected Android device in JSON.
* `android screen`: Inspects UI elements, bounds, and takes screenshots of connected devices.
* `android sdk list --all`: Lists available and installed Android SDK packages.
* `android emulator`: Manages and launches Android Virtual Devices.
* `android skills`: Manages agent skills (located in `.agents/skills/`).

---

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Open on your Pixel 11 Pro**:
   * Install **Expo Go** from Google Play.
   * Scan the QR code displayed in the terminal.
   * Test the Silicon HUD, tactile haptics, 120Hz display pacing, and Gemini AI Lab live!

---

## 📚 Complete Documentation & AI Blueprint

For the complete API reference, sensor hooks guide, and instructions for AI agents building on PixelForge:
👉 **[Read PIXELFORGE.md](./PIXELFORGE.md)**

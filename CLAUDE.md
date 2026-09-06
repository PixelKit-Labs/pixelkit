# PixelForge: Agent Guide

This file is the single source of truth for any coding agent (Claude, Gemini, Antigravity, Codex, Delta) working in this repository. `CLAUDE.md` and `GEMINI.md` are identical copies; keep all three in sync.

## Project

PixelForge is an Expo SDK 57 / React Native 0.86 hardware and AI framework for the Google Pixel 11 Pro (Android 17, Tensor G6). Hardware access goes through Expo modules and two local Kotlin Expo Modules: `modules/pixel-native` (telemetry and actuators) and `modules/pixel-nano` (Gemini Nano via ML Kit GenAI on AICore). Cloud AI uses `@google/genai` on `gemini-3.8-flash`. The app has four screens: Silicon (dashboard), AI Lab, Sensors, Docs.

Verified device facts live in `docs/research/DEVICE_PROFILE_PIXEL_11_PRO.md`. Do not restate marketing claims (process node, brightness figures, "post-quantum") as facts in code or comments.

## Rules

1. **Changelog on every change.** Every change to the codebase bumps the patch version by 0.0.1 and adds an entry to `CHANGELOG.md` in the same commit. Bump `version` in `package.json` and `expo.version` in `app.json` together and increment `expo.android.versionCode` by 1. Minor and major bumps are the maintainer's call.
2. **Docs in sync.** Any change to a hook, type, screen, config, or dependency updates: `docs/api/*` and `docs/HARDWARE_API.md` (API), `docs/ai-guidance/*` and `docs/AI_PRIMER.md` (agent rules), `docs/getting-started/*` (setup), `README.md` and `PIXELFORGE.md` (feature matrix, tree, examples), and `src/screens/DocsScreen.tsx` (in-app entries with a working example).
3. **No mocks.** Every hook exposes `source: 'hardware' | 'derived' | 'simulated' | 'unavailable'` (`src/core/observability.ts`). Never substitute a plausible default for a value that could not be read; render `null` as "—" and pass `source` to `MetricCard`. Only NFC, BLE, UWB and HiLight are currently simulated, and every surface that shows them says so.
4. **Comments state facts.** JSDoc and comments describe what the code does and which Android API it uses. No marketing language.
5. **Design system.** Use tokens from `src/theme/colors.ts` and primitives from `src/components/Decor.tsx`. One accent (cyan) for interaction; green = well, red = wrong, amber = a human or tool must act, violet = the model or external streams. Geist for language, Geist Mono for numbers and labels. Panels use wash + hairline + specular, no shadows or gradient fills. Buttons are solid (one per group) or outlined. Only the reactor glows.
6. **Single import.** App code imports hooks and components from `./src`.
7. **Haptics on every touchable** via `HapticButton` or `useHaptics`.
8. **Secrets** go through `useSecurity().saveSecureItem()` or `saveApiKey()` (SecureStore, hardware-backed Android Keystore). Never in plaintext storage.
9. **Coordinate with other agents.** Run `git status` and `git log --oneline -5` before editing; another agent may have committed. Prefer targeted edits over whole-file rewrites on files touched recently by others.

## Validation

- `npm run typecheck` must pass with 0 errors.
- `npx expo export -p android` must bundle.
- Native changes: build from the space-free junction `C:\dev\pixel-delta\android` with `.\gradlew.bat assembleDebug` (JDK 17, SDK at `%LOCALAPPDATA%\Android\Sdk`), then `adb install -r -g android/app/build/outputs/apk/debug/app-debug.apk`.
- On-device checks: `adb logcat -s ReactNativeJS | grep PixelForge` for provenance events; `dumpsys` for independent confirmation (see `docs/research/DEVICE_TEST_REPORT_2026-09-06.md`).

## Tooling

- **Expo docs:** https://docs.expo.dev/versions/v57.0.0/ (SDK 57 only). The Expo MCP server is registered in `.mcp.json`; `npm run start:mcp` starts Metro with local MCP capabilities.
- **Android CLI** (`%USERPROFILE%\AppData\AndroidCLI\android.exe`): `android docs search "<query>"` / `android docs fetch kb://…` (offline official docs, use before web search), `android describe --project_dir=.`, `android layout`, `android screen capture`, `android sdk`, `android emulator`, `android skills add <id>`.
- **Agent skills** in `.agents/skills/`: `android-cli` plus the official Expo skills (`skills-lock.json`, `npx skills add expo/skills`). Read a skill's `SKILL.md` before the related task.
- **Device:** the Pixel is paired over wireless adb (`adb pair` / `adb connect 10.0.0.47:<port>`); use `adb reverse tcp:8081 tcp:8081` so the dev client loads Metro from `localhost`.

## Map

```
App.tsx                      shell: fonts, scrims, wordmark, tabs
modules/pixel-native/        Kotlin Expo Module + TS bridge (index.ts): telemetry, actuators
modules/pixel-nano/          Kotlin Expo Module + TS bridge: Gemini Nano (ML Kit GenAI Prompt API)
src/core/                    types, capabilities, observability
src/hardware/                device hooks
src/ai/                      Gemini cloud hooks, useGeminiNano, TPU/AICore detection, client
src/theme/                   colors (tokens), mode (state → colour)
src/components/              HapticButton, MetricCard, SensorVisualizer, Decor
src/screens/                 Dashboard, AILab, SensorsLab, Docs
docs/                        api, guides, research, primers
```

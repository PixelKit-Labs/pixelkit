# Troubleshooting & Diagnostics Guide 🛠️
> **Common Issues, Expo SDK 57 Nuances, Permissions, and Hardware Diagnostics**

This guide outlines common errors, hardware lifecycle caveats, and resolution steps for PixelForge developers.

---

## 📑 Issue Index

1. [KeepAwake Tag Error in Expo SDK 57](#1-keepawake-tag-error-in-expo-sdk-57)
2. [StatusBar BackgroundColor Deprecation](#2-statusbar-backgroundcolor-deprecation)
3. [Camera Permission & Simulator Fallback](#3-camera-permission--simulator-fallback)
4. [ADPF Thermal Throttling Mitigation](#4-adpf-thermal-throttling-mitigation)
5. [Hermes Bytecode Metro Bundling Verification](#5-hermes-bytecode-metro-bundling-verification)
6. [Titan M3 Keystore SecureStore Access Modes](#6-titan-m3-keystore-securestore-access-modes)

---

## 1. KeepAwake Tag Error in Expo SDK 57

### Symptom
`Unhandled promise rejection: activateKeepAwake requires a tag parameter in Expo SDK 57`.

### Cause
In Expo SDK 57 (`~57.0.20`), `activateKeepAwakeAsync()` requires passing a string tag to identify the wake-lock owner.

### Resolution
Always pass a unique tag when activating or deactivating:
```typescript
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const TAG = 'pixelforge_display_lock';

// ✅ CORRECT
await activateKeepAwakeAsync(TAG);
deactivateKeepAwake(TAG);

// ❌ WRONG (Omitted tag throws in Expo 57)
await activateKeepAwakeAsync();
```

---

## 2. StatusBar BackgroundColor Deprecation

### Symptom
TypeScript warning or runtime error: `Property 'backgroundColor' does not exist on type 'IntrinsicAttributes & StatusBarProps'`.

### Cause
In Expo SDK 57, `<StatusBar />` from `expo-status-bar` dropped the `backgroundColor` prop in favor of root View background styling.

### Resolution
Style the parent `<SafeAreaView>` or root `<View>` with `Colors.dark.background` (`#0E1119`) and use `<StatusBar style="light" />`:
```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: '#0E1119' }}>
  <StatusBar style="light" />
  {/* Content */}
</SafeAreaView>
```

---

## 3. Camera Permission & Simulator Fallback

### Symptom
Camera screen throws `Camera permission not granted` on Android emulator or initial launch.

### Resolution
`useCamera()` includes an asynchronous permission check with a graceful fallback. Ensure `app.json` includes the camera permission:
```json
"android": {
  "permissions": [
    "android.permission.CAMERA",
    "android.permission.RECORD_AUDIO"
  ]
}
```
If running in an emulator without camera hardware, `useVisionAI()` provides gallery photo picking via `captureAndAnalyze(false)`.

---

## 4. ADPF Thermal Throttling Mitigation

### Symptom
Frame drops or stutter when rendering complex graphics or processing sustained neural workloads.

### Resolution
Check `useADPF().thermalStatus`:
```typescript
const { thermalStatus } = useADPF();

if (thermalStatus === 'severe' || thermalStatus === 'critical') {
  // 1. Back off sensor polling to 500ms
  // 2. Pause non-essential background tensor passes
  // 3. Extinguish flashlight / HiLight ring
}
```

---

## 5. Hermes Bytecode Metro Bundling Verification

To ensure all TypeScript modules compile and package cleanly without syntax or bundling errors:

```bash
# 1. Typecheck
npm run typecheck

# 2. Bundle Hermes bytecode for Android
npx expo export -p android
```

If bundling reports an error, clean the Metro cache:
```bash
npx expo start -c
```

---

## 6. Titan M3 Keystore SecureStore Access Modes

On Android, `expo-secure-store` encrypts values directly in the Titan M3 hardware-backed keystore:
* Always use `SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
* In Web / Simulator fallback, `useSecurity()` gracefully persists into local memory.

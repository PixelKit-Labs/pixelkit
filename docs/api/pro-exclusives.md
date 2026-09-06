# Pixel Pro Exclusives API Reference 🎯
> **HiLight Camera Bar LED Ring and Ultra-Wideband (UWB) Ranging**

This document covers hardware capabilities exclusive to Google's flagship Pro models.

---

## 📑 Module Index

* [`useHiLight`](#usehilight) - Rear Camera Bar Multi-Color Notification & Gemini Status Ring
* [`useUWB`](#useuwb) - Ultra-Wideband Ranging & Angle-of-Arrival (AoA)

---

## `useHiLight`

Drives the eight-LED **HiLight** array around the Pixel 11 Pro flash. Android 17 exposes it as eight `Light.LIGHT_TYPE_APPLICATION` lights (RGB + animation, 33 ms update period), but every lights session needs `CONTROL_DEVICE_LIGHTS`, a signature|privileged permission a third-party app cannot hold. The hook therefore has two paths (measured facts in [HILIGHT_LED_ARRAY.md](../research/HILIGHT_LED_ARRAY.md)):

| `availability` | Condition | Effect of the colour methods | `source` |
| :--- | :--- | :--- | :--- |
| `'shizuku'` | Shizuku installed, running, granted, helper bound | Real LEDs through `modules/pixel-hilight` | `'hardware'` |
| `'simulated'` | Pixel 11 Pro-class device without the helper | State only, mirrored on screen | `'simulated'` |
| `'unsupported'` | No HiLight array | Nothing | `'unavailable'` |

### The helper (`modules/pixel-hilight`)
`connect()` requests Shizuku permission and binds `HiLightService`, which Shizuku spawns as uid 2000 (shell). The service reaches `android.hardware.lights.ILightsManager` by reflection, enumerates the application-type lights at runtime, and enforces hardware protection that JS cannot bypass:
* every request auto-clears after at most **60 s**;
* the LEDs may be lit for at most **50 % of any 10-minute window** (`setColors` returns `false` when refused);
* every clear writes alpha-only black, canonical black, closes the session, then repeats the black writes in three fresh priority `-1000` sessions (the stuck-LED mitigation HiLight Studio documents).

Shizuku must be started again after every reboot (Wireless debugging or `adb shell sh /storage/emulated/0/Android/data/moe.shizuku.privileged.api/start.sh`).

### Signature
```typescript
function useHiLight(): {
  availability: 'shizuku' | 'simulated' | 'unsupported';
  isHardwareSupported: boolean;
  source: 'hardware' | 'simulated' | 'unavailable';
  shizuku: { shizukuInstalled: boolean; shizukuRunning: boolean; shizukuVersion: number | null; shizukuUid: number | null; permissionGranted: boolean; serviceBound: boolean } | null;
  helper: { uid: number; pid: number; count: number; sessionOpen: boolean; litMsInWindow: number; dutyLimitMs: number; hardMaxMs: number; initError: string | null; lights: { id: number; ordinal: number; type: number }[] } | null;
  error: string | null;
  isActive: boolean; currentColor: string; mode: HiLightMode; brightness: number; isFaceDownMode: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  setColor: (hexColor: string) => void;
  setMode: (mode: HiLightMode) => void;
  setBrightness: (level: number) => void;          // scales RGB; the hardware has no brightness channel
  triggerGeminiPulse: (durationMs?: number) => void; // cyan hold
  triggerContactAlert: (hexColor: string, durationMs?: number) => void;
  turnOff: () => void;
  toggle: () => void;
};
```

### Native module surface (`modules/pixel-hilight/index.ts`)
`getStatus()`, `requestPermission()`, `bind()`, `unbind()`, `info()`, `readback()`, `setAll(argb, maxMs)`, `setColors(ids, colors, maxMs)`, `clear()`, event `onState`. Colours are ARGB numbers; `hexToArgb('#00E5FF')` converts.

### Example
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useHiLight, HapticButton } from './src';

export function HiLightHUD() {
  const hilight = useHiLight();
  return (
    <View>
      <Text>{hilight.availability} · {hilight.error ?? 'ok'}</Text>
      {hilight.availability !== 'shizuku' && (
        <HapticButton title="Connect Shizuku helper" onPress={() => hilight.connect()} variant="primary" />
      )}
      <HapticButton title="Gemini thinking (4 s)" onPress={() => hilight.triggerGeminiPulse(4000)} variant="secondary" />
      <HapticButton title="Contact alert (green)" onPress={() => hilight.triggerContactAlert('#81C995', 3000)} variant="secondary" />
    </View>
  );
}
```

---

## `useUWB`

Distance and Angle-of-Arrival to UWB targets. The radio is verified by `useCapabilities`; ranging is simulated until the Android 16 RangingManager path is implemented.

### Signature
```typescript
function useUWB(): {
  isSupported: boolean;
  isRanging: boolean;
  activeTargets: UWBSpatialTarget[];
  startRanging: () => Promise<void>;
  stopRanging: () => void;
};
```

### Properties & Target Structure
```typescript
interface UWBSpatialTarget {
  deviceId: string;
  distanceMeters: number;     // Distance in metres (simulated today)
  azimuthDegrees: number;     // Horizontal angle (-180° to +180°)
  elevationDegrees: number;   // Vertical angle (-90° to +90°)
  signalQuality: number;      // 0.0 to 1.0 line-of-sight score
}
```

### Example
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useUWB, HapticButton } from './src';

export function RadarHUD() {
  const { activeTargets, isRanging, startRanging } = useUWB();

  return (
    <View>
      {activeTargets.map(target => (
        <Text key={target.deviceId}>
          {target.deviceId}: {target.distanceMeters.toFixed(2)}m @ {target.azimuthDegrees}°
        </Text>
      ))}
      <HapticButton
        title={isRanging ? "Ranging Active" : "Start UWB Radar"}
        onPress={startRanging}
      />
    </View>
  );
}
```


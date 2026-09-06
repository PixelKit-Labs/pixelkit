# Pixel Pro Exclusives API Reference 🎯
> **HiLight Camera Bar LED Ring and Ultra-Wideband (UWB) Ranging**

This document covers hardware capabilities exclusive to Google's flagship Pro models.

---

## 📑 Module Index

* [`useHiLight`](#usehilight) - Rear Camera Bar Multi-Color Notification & Gemini Status Ring
* [`useUWB`](#useuwb) - Ultra-Wideband Ranging & Angle-of-Arrival (AoA)

---

## `useHiLight`

Hardware driver and state machine for the eight-LED **HiLight** array around the Pixel 11 Pro flash. Android restricts `CONTROL_DEVICE_LIGHTS` to signature|privileged permissions, which only Google system apps and `android.uid.shell` (UID 2000) hold.

PixelKit includes a native, zero-dependency Java daemon (`scripts/hilight-daemon/`, started via `npm run hilight:daemon`) that runs as UID 2000 via ADB on `127.0.0.1:11080`. When active, `useHiLight` directly drives the physical LEDs in real-time (~3 ms latency). When untethered, it falls back to an honest on-screen simulation and LRA haptic actuator.

| `availability` | Condition | Effect of the colour methods | `source` |
| :--- | :--- | :--- | :--- |
| `'hardware'` | Native ADB daemon active (`npm run hilight:daemon`) | Drives real physical LEDs via `ILightsManager` | `'hardware'` |
| `'simulated'` | Pixel 11 Pro without active daemon | State maintained, mirrored on screen & LRA haptics | `'simulated'` |
| `'unsupported'` | No HiLight array | Nothing | `'unavailable'` |

### Signature
```typescript
function useHiLight(): {
  availability: 'hardware' | 'simulated' | 'unsupported';
  isHardwareSupported: boolean;
  source: 'hardware' | 'simulated' | 'unavailable';
  isDaemonConnected: boolean;
  isActive: boolean;
  currentColor: string;
  mode: HiLightMode;
  brightness: number;
  isFaceDownMode: boolean;
  refreshDaemonStatus: () => Promise<boolean>;
  setColor: (hexColor: string) => void;
  setMode: (mode: HiLightMode) => void;
  setBrightness: (level: number) => void;
  triggerGeminiPulse: (durationMs?: number) => void;
  triggerContactAlert: (hexColor: string, durationMs?: number) => void;
  turnOff: () => void;
  toggle: () => void;
};
```

### Example
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useHiLight, HapticButton } from './src';

export function HiLightHUD() {
  const hilight = useHiLight();
  return (
    <View>
      <Text>{hilight.availability} · {hilight.mode}</Text>
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


# Pixel Pro Exclusives API Reference 🎯
> **HiLight Camera Bar LED Ring and Ultra-Wideband (UWB) Ranging**

This document covers hardware capabilities exclusive to Google's flagship Pro models.

---

## 📑 Module Index

* [`useHiLight`](#usehilight) - Rear Camera Bar Multi-Color Notification & Gemini Status Ring
* [`useUWB`](#useuwb) - Ultra-Wideband Ranging & Angle-of-Arrival (AoA)

---

## `useHiLight`

State model for the eight-LED **HiLight** array around the Pixel 11 Pro flash. Android restricts `CONTROL_DEVICE_LIGHTS` to signature/system permissions with no public third-party API. The hook provides a strongly-typed state machine for patterns, colours, and brightness, mirrored honestly on screen (`availability: 'simulated'`, `source: 'simulated'`) and through the linear resonant actuator (LRA).

| `availability` | Condition | Effect of the colour methods | `source` |
| :--- | :--- | :--- | :--- |
| `'simulated'` | Pixel 11 Pro-class device | State maintained, mirrored on screen & LRA haptics | `'simulated'` |
| `'unsupported'` | No HiLight array | Nothing | `'unavailable'` |

### Signature
```typescript
function useHiLight(): {
  availability: 'simulated' | 'unsupported';
  isHardwareSupported: boolean;
  source: 'simulated' | 'unavailable';
  isActive: boolean;
  currentColor: string;
  mode: HiLightMode;
  brightness: number;
  isFaceDownMode: boolean;
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


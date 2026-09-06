# Pixel Pro Exclusives API Reference 🎯
> **HiLight Camera Bar LED Ring, Ultra-Wideband (UWB) Spatial Radar, and Infrared Thermometer**

This document covers hardware capabilities exclusive to Google's flagship Pro models.

---

## 📑 Module Index

* [`useHiLight`](#usehilight) - Rear Camera Bar Multi-Color Notification & Gemini Status Ring
* [`useUWB`](#useuwb) - Ultra-Wideband Centimeter Spatial Radar & Angle-of-Arrival (AoA)
* [`useTemperature`](#usetemperature) - Infrared Thermometer Sensor (Legacy Pro & Ambient)

---

## `useHiLight`

Directly controls the **HiLight** multi-color LED notification ring integrated into the Pixel 11 Pro camera bar visor.

### Signature
```typescript
function useHiLight(): HiLightState;
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `isActive` | `boolean` | Whether the HiLight ring is physically illuminated |
| `currentColor` | `string` | Current RGB hex color (`#00E5FF`, `#8AB4F8`, `#81C995`, etc.) |
| `mode` | `HiLightMode` | Active pattern (`'off' \| 'glow' \| 'breathing' \| 'pulse' \| 'gemini_thinking' \| 'incoming_call' \| 'notification'`) |
| `brightness` | `number` | Illumination intensity (0.0 to 1.0) |
| `isFaceDownMode` | `boolean` | True if glanceable mode is active when resting face-down |

### Methods
* `triggerGeminiPulse(durationMs?: number): void`: Pulses the signature cyan breathing animation while Gemini AI reasons.
* `triggerContactAlert(colorHex: string, durationMs?: number): void`: Triggers custom contact alert color.
* `setColor(hex: string): void`: Sets static color.
* `setMode(mode: HiLightMode): void`: Changes animation profile.
* `turnOff(): void`: Extinguishes the LED ring.
* `toggle(): void`: Toggles on/off state.

### Example
```tsx
import React from 'react';
import { View } from 'react-native';
import { useHiLight, HapticButton } from './src';

export function HiLightHUD() {
  const hilight = useHiLight();

  return (
    <View>
      <HapticButton
        title="Trigger Gemini Thinking Pulse"
        onPress={() => hilight.triggerGeminiPulse(4000)}
        variant="secondary"
      />
      <HapticButton
        title="Alert Pulse (Green)"
        onPress={() => hilight.triggerContactAlert('#81C995', 3000)}
        variant="primary"
      />
    </View>
  );
}
```

---

## `useUWB`

Interfaces with the Ultra-Wideband (UWB) spatial radar transceiver for centimeter-level time-of-flight (ToF) ranging and Angle-of-Arrival (AoA).

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
  distanceMeters: number;     // Centimeter-level precision (e.g. 0.82m)
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

---

## `useTemperature`

Samples thermal infrared radiation from surfaces and liquids.
> **Note**: On the Pixel 11 Pro, the physical camera bar thermopile slot transitioned to the **HiLight** multi-color notification ring. This hook is maintained for full backward compatibility on Pixel 8 Pro, 9 Pro, and 10 Pro hardware, as well as software ambient estimation.

### Signature
```typescript
function useTemperature(): {
  reading: TemperatureReading;
  materialPreset: string;
  isMeasuring: boolean;
  measureTemperature: (preset?: string) => Promise<TemperatureReading>;
  setMaterialPreset: (preset: string) => void;
};
```

### Material Presets
* `'organic'`: Calibrated for skin and organic matter.
* `'liquid'`: Calibrated for beverages, water, and soups.
* `'metal'`: Calibrated for cookware and metallic surfaces.
* `'glass'`: Calibrated for windows and glassware.

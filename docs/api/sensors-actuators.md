# Sensors & Physical Actuators API Reference 📡
> **6-Axis IMU & Barometer, Camera Looks & 120x Zoom, Dual-LED Torch, and Linear Resonant Actuator Haptics**

This document covers physical sensors and mechanical actuation modules on the Pixel 11 Pro.

---

## 📑 Module Index

* [`useSensors`](#usesensors) - 6-Axis IMU, Barometer, Compass, and Ambient Light
* [`useCamera`](#usecamera) - Camera Looks, 120x Super Res AI Zoom & Ultra Low Light Video
* [`useTorch`](#usetorch) - Hardware Dual-LED Torch & SOS Optical Strobe
* [`useHaptics`](#usehaptics) - Linear Resonant Actuator (LRA) Mechanical Tactile Feedback

---

## `useSensors`

Continuous multi-sensor telemetry with configurable update rates. Calculates barometric relative altitude using the international hypsometric formula.

### Signature
```typescript
function useSensors(updateIntervalMs?: number): SensorTelemetry & {
  setUpdateInterval: (intervalMs: number) => void;
};
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `accelerometer` | `Vector3D { x, y, z }` | Gravitational acceleration in g-units |
| `gyroscope` | `Vector3D { x, y, z }` | Rotational velocity in radians/sec |
| `magnetometer` | `Vector3D { x, y, z }` | Geomagnetic field strength in microteslas (μT) |
| `barometer` | `BarometerData` | Air pressure in hPa and relative altitude in meters |
| `lightLux` | `number` | Ambient illuminance in Lux from front photodiode |
| `isAvailable` | `boolean` | True if physical sensors are streaming |

### Example
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useSensors } from './src';

export function AltitudeHUD() {
  const { barometer, accelerometer } = useSensors(100);

  return (
    <View>
      <Text>Altitude: {barometer.relativeAltitude ?? 0} m</Text>
      <Text>Pressure: {barometer.pressure} hPa</Text>
      <Text>Accel Z: {accelerometer.z.toFixed(2)} g</Text>
    </View>
  );
}
```

---

## `useCamera`

Controls the Pixel 11 Pro triple optical camera array (50MP Wide + 48MP Ultrawide + 48MP Periscope Telephoto). Supports **Camera Looks** live tone-mapping styles, up to **120x Generative AI Super Res Zoom**, and **On-Device Ultra Low Light Video** (5–10 lux candlelight mode).

### Signature
```typescript
function useCamera(): CameraTelemetry & {
  toggleFacing: () => void;
  setZoom: (ratio: number) => void;
  setFlash: (mode: 'auto' | 'on' | 'off') => void;
  setLook: (look: CameraLook) => void;
  toggleUltraLowLightVideo: () => void;
};
```

### Camera Looks Presets
```typescript
type CameraLook =
  | 'Original'
  | 'Natural'
  | 'Shadows'
  | 'Vanilla'
  | 'Editorial'
  | 'Velvet'
  | 'Classic'
  | 'Digi'
  | 'Black Tie'
  | 'Minimal';
```

### Example
```tsx
import React from 'react';
import { View } from 'react-native';
import { useCamera, HapticButton } from './src';

export function ProCameraControls() {
  const { zoomFactor, setZoom, selectedLook, setLook } = useCamera();

  return (
    <View>
      <HapticButton title="5x Optical Telephoto" onPress={() => setZoom(5.0)} />
      <HapticButton title="120x AI Super Res Zoom" onPress={() => setZoom(120.0)} />
      <HapticButton title={`Look: ${selectedLook}`} onPress={() => setLook('Velvet')} />
    </View>
  );
}
```

---

## `useTorch`

Directly operates the camera bar rear dual-LED hardware flashlight.

### Signature
```typescript
function useTorch(): {
  isTorchOn: boolean;
  isStrobing: boolean;
  toggleTorch: () => Promise<boolean>;
  startStrobe: (intervalMs?: number) => void;
  stopStrobe: () => void;
};
```

---

## `useHaptics`

Drives the Linear Resonant Actuator (LRA) to produce tactile pulses that match Google Pixel physical feedback standards.

### Signature
```typescript
function useHaptics(): {
  triggerHaptic: (type: HapticType) => Promise<void>;
  selection: () => Promise<void>;
  light: () => Promise<void>;
  medium: () => Promise<void>;
  heavy: () => Promise<void>;
  success: () => Promise<void>;
  warning: () => Promise<void>;
  error: () => Promise<void>;
};
```

### Tactile Pattern Mapping
* `selection()`: Subtle tick for sliders, wheel pickers, and tab transitions.
* `light()`: Soft mechanical tap for button taps.
* `medium()`: Solid click for modal reveals and drawers.
* `heavy()`: Firm thud for dangerous/destructive actions.
* `success()`: Double-pulse positive confirmation.
* `warning()`: Continuous buzzing alert.
* `error()`: Triple-pulse validation failure.

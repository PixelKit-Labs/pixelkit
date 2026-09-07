# Sensors & Physical Actuators API Reference 📡
> **6-Axis IMU & Barometer, Camera Zoom & Looks, Torch, and Linear Resonant Actuator Haptics**

This document covers physical sensors and mechanical actuation modules on the Pixel 11 Pro.

---

## 📑 Module Index

* [`useSensors`](#usesensors) - 6-Axis IMU, Barometer, Compass, and Ambient Light
* [`useCamera`](#usecamera) - Photo capture, video recording, zoom, flash, torch
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

Wraps expo-camera lens, zoom, flash and permission state. **Camera Looks**, Super Res Zoom and low-light video modes belong to the Pixel Camera app and are not reachable from third-party apps; the hook keeps a Look label and a low-light flag as UI state only.

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
  const { zoomFactor, maxZoomFactor, setZoom, selectedLook, setLook } = useCamera();

  return (
    <View>
      <HapticButton title="5x Optical Telephoto" onPress={() => setZoom(5.0)} />
      <HapticButton title="Max zoom" onPress={() => setZoom(maxZoomFactor)} />
      <HapticButton title={`Look: ${selectedLook}`} onPress={() => setLook('Velvet')} />
    </View>
  );
}
```

---

## `useTorch`

Operates the rear camera flash LED through Android `CameraManager.setTorchMode` and, on Android 13+, `turnOnTorchWithStrengthLevel` (variable brightness). State follows the system torch callback, so Quick Settings toggles are reflected. Verified on Pixel 11 Pro: camera id `0`, **21 strength levels**; the camera HAL logs `Torch for camera id 0 turned on`.

### Signature
```typescript
function useTorch(): {
  isAvailable: boolean;                 // rear camera with flash + native module present
  isTorchOn: boolean;                   // from CameraManager.TorchCallback
  isStrobing: boolean;
  maxStrengthLevel: number | null;      // Android 13+
  error: string | null;
  source: 'hardware' | 'unavailable';
  setTorch: (on: boolean, strengthLevel?: number) => Promise<boolean>;
  toggleTorch: () => Promise<boolean>;
  startStrobe: (intervalMs?: number) => void;   // ≥ 120 ms; the HAL needs ~50-100 ms per switch
  stopStrobe: () => void;
};
```

### Example
```tsx
const torch = useTorch();
<HapticButton title={torch.isTorchOn ? 'Torch off' : 'Torch on'} onPress={() => torch.toggleTorch()} disabled={!torch.isAvailable} />
<HapticButton title="Dim" onPress={() => torch.setTorch(true, 1)} />
```

---

## `useHaptics`

Drives the Linear Resonant Actuator: standard Pixel patterns through `expo-haptics`, plus the vibrator's real capabilities and **Android 16 envelope effects** (`VibrationEffect.BasicEnvelopeBuilder`) and primitive compositions through the PixelNative module. Verified on Pixel 11 Pro: resonant **134.4 Hz**, Q 14.5, amplitude control, `CAP_COMPOSE_PWLE_EFFECTS_V2` (envelopes supported), primitives `CLICK, TICK, QUICK_RISE, SLOW_RISE, QUICK_FALL, THUD, SPIN, LOW_TICK`.

### Signature
```typescript
function useHaptics(): {
  triggerHaptic: (type: HapticType) => Promise<void>;
  selection | light | medium | heavy | success | warning | error: () => Promise<void>;
  playEnvelope: (points: EnvelopePoint[], initialSharpness?: number) => boolean;   // Android 16+
  playPrimitives: (steps: PrimitiveStep[]) => boolean;                             // Android 11+
  cancel: () => void;
  hasAmplitudeControl: boolean | null;
  envelopeSupported: boolean;
  resonantFrequencyHz: number | null;
  supportedPrimitives: string[];
  source: TelemetrySource;
};

type EnvelopePoint = { intensity: number; sharpness: number; durationMs: number }; // 0..1, must end at intensity 0 (the module appends it)
type PrimitiveStep = { primitive: 'CLICK' | 'TICK' | 'THUD' | 'SPIN' | 'QUICK_RISE' | 'SLOW_RISE' | 'QUICK_FALL' | 'LOW_TICK'; scale?: number; delayMs?: number };
```

### Presets
`HapticEnvelopes.thinkingRamp` (Gemini is thinking), `HapticEnvelopes.doublePulse` (response ready), `HapticEnvelopes.spring` (bouncing spring from the Android haptics guide).

```tsx
const haptics = useHaptics();
if (haptics.envelopeSupported) haptics.playEnvelope(HapticEnvelopes.thinkingRamp);
haptics.playPrimitives([{ primitive: 'QUICK_RISE', scale: 0.8 }, { primitive: 'THUD', delayMs: 40 }]);
```

### Tactile Pattern Mapping
* `selection()`: Subtle tick for sliders, wheel pickers, and tab transitions.
* `light()`: Soft mechanical tap for button taps.
* `medium()`: Solid click for modal reveals and drawers.
* `heavy()`: Firm thud for dangerous/destructive actions.
* `success()`: Double-pulse positive confirmation.
* `warning()`: Continuous buzzing alert.
* `error()`: Triple-pulse validation failure.

# System & Media API Reference 📱
> **Microphone Metering, 3,600 nits Super Actua Display, Pixelsnap Qi2.2 Battery, and MediaTek M90 Modem**

This document covers system telemetry, media capture, power, and wireless modem subsystems.

---

## 📑 Module Index

* [`useAudio`](#useaudio) - expo-audio recording (VOICE_RECOGNITION source) & dBFS metering
* [`useDisplay`](#usedisplay) - 3,600 nits Super Actua Display & Wake-Lock
* [`useDevice`](#usedevice) - Pixelsnap Qi2.2 25W Charging, Thermals & Battery Telemetry
* [`useNetwork`](#usenetwork) - MediaTek M90 Modem, Wi-Fi 7 & Satellite SOS

---

## `useAudio`

Operates the microphone array with 100 ms decibel metering in dBFS (-160 to 0). Backed by **`expo-audio`** (the legacy `expo-av` package was removed in this project). Records mono 16 kHz AAC through the `voice_recognition` audio source so Pixel's hardware noise suppression is applied, which is the input every Google speech API expects.

### Signature
```typescript
function useAudio(): {
  isRecording: boolean;
  meteringDecibels: number;       // dBFS -160..0
  currentDecibels: number;        // alias of meteringDecibels
  permissionGranted: boolean;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<string | null>;   // recorded file URI
};
```

---

## `useCapabilities`

Single source of truth for what the current Pixel physically has and which Android platform APIs exist. Pure resolver lives in `src/core/capabilities.ts` (`resolveCapabilities(modelName, apiLevel, isDevice)`) so it can be unit tested; the hook memoises it for the app lifetime. Read it before rendering any Pro-exclusive feature.

### Signature
```typescript
function useCapabilities(): DeviceCapabilities;

interface DeviceCapabilities {
  modelName: string; isPhysicalDevice: boolean; isPixel: boolean;
  pixelGeneration: number | null; isProModel: boolean; isFoldable: boolean;
  androidApiLevel: number | null;
  hasHiLight: boolean;              // Pixel 11 Pro / Pro XL / Pro Fold (no public API; simulated)
  hasUWB: boolean;                  // Pro models since Pixel 6 Pro, all Folds
  hasTitanM3: boolean;              // Pixel 11 family
  geminiNanoTier: 'nano-v4' | 'nano-v3' | 'nano-v2' | 'none';
  supportsRangingApi: boolean;      // Android 16+ RangingManager
  supportsHapticEnvelopes: boolean; // Android 16+ envelope vibrations
  supportsAppFunctions: boolean;    // Android 16+
  supportsAndroid17Apis: boolean;   // Android 17+
}
```

### Example
```typescript
const caps = useCapabilities();
if (!caps.hasHiLight) hideHiLightCard();
if (caps.geminiNanoTier === 'nano-v4') enableThinkingMode();
```

---

## `useDisplay`

Real display telemetry from Android `Display` (active mode refresh rate, supported refresh rates, resolution, HDR types, ARR support) polled every 2 s because adaptive refresh rate changes it live, plus brightness (expo-brightness) and the wake lock (expo-keep-awake). `setPreferredRefreshRate()` sets the window's preferred rate; verified on Pixel 11 Pro via `dumpsys display` (`frameRateOverride {uid=… frameRateHz=60}` after preferring 60 Hz). Supported rates on Pixel 11 Pro: 120 / 60 / 40 / 30 / 24 / 20 / 15 / 10 / 5 / 2 / 1 Hz, HDR10 · HLG · HDR10+, `hasArrSupport = true`.

### Signature
```typescript
function useDisplay(): {
  isKeepAwake: boolean;
  toggleKeepAwake: () => Promise<void>;
  brightness: number;                          // 0..1
  setScreenBrightness: (val: number) => Promise<void>;
  setBrightness: (val: number) => Promise<void>;   // alias
  refreshRateHz: number;                       // active mode, 0 until read
  hasArrSupport: boolean | null;               // Android 16+
  supportedRefreshRates: number[];
  resolution: { width: number; height: number; densityDpi: number } | null;  // active mode
  hdrTypes: number[];                          // 1 Dolby Vision, 2 HDR10, 3 HLG, 4 HDR10+
  isHdr: boolean;
  maxLuminance: number | null;
  setPreferredRefreshRate: (hz: number) => Promise<boolean>;
  source: TelemetrySource;
};
```

> **Expo SDK 57 Note**: In Expo SDK 57, `activateKeepAwakeAsync(tag)` requires passing a string tag to prevent unhandled promise rejections.

---

## `useDevice`

Monitors battery health, charging status, PMIC telemetry, and Pixelsnap Qi2.2 25W magnetic wireless charging.

### Signature
```typescript
function useDevice(): DeviceTelemetry;
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `modelName` | `string` | Device model string (`"Pixel 11 Pro"`) |
| `brand` | `string` | Device brand (`"Google"`) |
| `osVersion` | `string` | Android version (`"Android 16"`) |
| `batteryLevel` | `number` | Remaining battery percentage (0–100) |
| `isCharging` | `boolean` | True if connected to AC or Pixelsnap wireless charger |
| `lowPowerMode` | `boolean` | True if Android Battery Saver is engaged |
| `networkType` | `string` | Primary network link (`"WIFI"`, `"CELLULAR"`) |
| `isConnected` | `boolean` | Internet route reachability |

---

## `useNetwork`

Interfaces with the MediaTek M90 modem for Wi-Fi 7 (802.11be), 5G Sub-6/mmWave, and Satellite SOS.

### Signature
```typescript
function useNetwork(): NetworkTelemetry & {
  refreshNetworkStatus: () => Promise<void>;
};
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `ipAddress` | `string \| null` | Device IP address string |
| `networkType` | `string` | Connection technology |
| `isConnected` | `boolean` | Online status |
| `isMetered` | `boolean` | True if carrier data billing is metered |
| `isAirplaneMode` | `boolean` | True if all radios are disabled |

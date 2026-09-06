# System & Media API Reference 📱
> **Quad-Mic Audio Metering, 3,600 nits Super Actua Display, Pixelsnap Qi2.2 Battery, and MediaTek M90 Modem**

This document covers system telemetry, media capture, power, and wireless modem subsystems.

---

## 📑 Module Index

* [`useAudio`](#useaudio) - Quad-Mic Recording & Real-Time dBFS Sound Metering
* [`useDisplay`](#usedisplay) - 3,600 nits Super Actua Display & Wake-Lock
* [`useDevice`](#usedevice) - Pixelsnap Qi2.2 25W Charging, Thermals & Battery Telemetry
* [`useNetwork`](#usenetwork) - MediaTek M90 Modem, Wi-Fi 7 & Satellite SOS

---

## `useAudio`

Operates the studio microphone array with instant decibel sound level metering in dBFS (-160 to 0).

### Signature
```typescript
function useAudio(): {
  isRecording: boolean;
  recordingUri: string | null;
  currentDecibels: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
};
```

---

## `useDisplay`

Manages display state for the 3,600 nits peak 1-120Hz LTPO Super Actua OLED panel.

### Signature
```typescript
function useDisplay(): {
  isKeepAwake: boolean;
  brightness: number;
  toggleKeepAwake: () => Promise<void>;
  setBrightness: (val: number) => Promise<void>;
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

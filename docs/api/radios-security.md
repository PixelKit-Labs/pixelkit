# Radios & Hardware Security API Reference 🔐
> **Android Keystore secure storage, Biometrics, Bluetooth LE, NFC, and Dual-Band GNSS**

This document covers wireless radios, near-field interactions, satellite positioning, and hardware-backed cryptographic security on the Pixel 11 Pro.

---

## 📑 Module Index

* [`useBiometrics`](#usebiometrics) - Ultrasonic In-Screen Fingerprint & Class 3 Face Unlock
* [`useSecurity`](#usesecurity) - SecureStore on the Android Keystore (StrongBox)
* [`useBLE`](#useble) - Bluetooth 5.4 Low Energy Scanner & Beacon Proximity
* [`useNFC`](#usenfc) - Contactless NDEF / RFID Smart Tag Controller
* [`useRadios`](#useradios) - Unified Hardware Radio Subsystem Telemetry
* [`useLocation`](#uselocation) - Dual-Frequency Multi-Band GNSS (GPS L1/L5)

---

## `useBiometrics`

Hardware-backed biometric verification using the Titan M3 security coprocessor.

### Signature
```typescript
function useBiometrics(): BiometricState & {
  authenticate: (promptMessage?: string) => Promise<boolean>;
};
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `hasHardware` | `boolean` | True if biometric scanner hardware is present |
| `isEnrolled` | `boolean` | True if the user has enrolled fingerprints or face data |
| `supportedTypes` | `string[]` | Available modalities (`['Fingerprint', 'Face Unlock']`) |

---

## `useSecurity`

Secret persistence through `expo-secure-store`, which encrypts values with an AES key held in the **Android Keystore** (StrongBox-backed on the Pixel 11 Pro). No post-quantum algorithms are involved; `isPostQuantumProtected` is always `false`.

### Signature
```typescript
function useSecurity(): {
  saveSecureItem: (key: string, value: string) => Promise<boolean>;
  getSecureItem: (key: string) => Promise<string | null>;
  deleteSecureItem: (key: string) => Promise<boolean>;
  isHardwareBacked: boolean;
  securityModule: 'Titan M3';
  isPostQuantumProtected: boolean;
};
```

### Example
```tsx
import React from 'react';
import { useSecurity, HapticButton } from './src';

export function VaultManager() {
  const { saveSecureItem, getSecureItem } = useSecurity();

  const handleSave = async () => {
    await saveSecureItem("USER_VAULT_KEY", "secret_token");
  };

  return <HapticButton title="Save to Titan M3 Vault" onPress={handleSave} />;
}
```

---

## `useBLE`

Inspects physical Bluetooth adapter status, verifies Bluetooth 5.4 Channel Sounding silicon capabilities, retrieves real paired/bonded devices, and scans for nearby BLE beacons.

### Signature
```typescript
function useBLE(): {
  isSupported: boolean;
  isEnabled: boolean;
  state: 'ON' | 'OFF' | 'TURNING_ON' | 'TURNING_OFF';
  channelSounding: boolean;
  bondedDevices: BondedDevice[];
  source: 'hardware' | 'simulated';
  isScanning: boolean;
  peripherals: BLEPeripheral[];
  startScan: () => Promise<void>;
  stopScan: () => void;
};
```

---

## `useNFC`

Queries physical Near Field Communication adapter status, antenna state, Android 15+ Observe Mode capabilities, and interacts with contactless NDEF smart tags.

### Signature
```typescript
function useNFC(): {
  isSupported: boolean;
  isEnabled: boolean;
  observeModeSupported: boolean;
  antennaState: 'ENABLED' | 'DISABLED' | 'UNAVAILABLE';
  source: 'hardware' | 'simulated';
  isScanning: boolean;
  lastScannedTag: NFCTag | null;
  startScan: () => Promise<void>;
  stopScan: () => void;
};
```

---

## `useRadios`

Unified hardware radio telemetry directly querying Android system services (`NfcAdapter`, `BluetoothManager`, `UwbManager`, `WifiRttManager`, `PackageManager`) with zero mock fallbacks.

### Signature
```typescript
function useRadios(): {
  nfc: {
    supported: boolean;
    enabled: boolean;
    observeModeSupported: boolean;
    antennaState: 'ENABLED' | 'DISABLED' | 'UNAVAILABLE';
  };
  bluetooth: {
    supported: boolean;
    bleSupported: boolean;
    enabled: boolean;
    state: 'ON' | 'OFF' | 'TURNING_ON' | 'TURNING_OFF';
    channelSounding: boolean;
    bondedDevices: BondedDevice[];
  };
  uwb: {
    supported: boolean;
    enabled: boolean;
    chipId: string | null;
    rangingApiSupported: boolean;
  };
  wifiRtt: {
    supported: boolean;
    available: boolean;
  };
  satellite: {
    supported: boolean;
  };
  source: 'hardware' | 'unavailable';
  refresh: () => void;
};
```

---

## `useLocation`

Queries dual-band multi-constellation GNSS (GPS L1/L5, Galileo, GLONASS, BeiDou) for high-accuracy positioning.

### Signature
```typescript
function useLocation(): LocationTelemetry;
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `latitude` | `number` | Latitude in decimal degrees |
| `longitude` | `number` | Longitude in decimal degrees |
| `altitude` | `number \| null` | Elevation above mean sea level in meters |
| `accuracy` | `number \| null` | Horizontal uncertainty radius in meters |
| `heading` | `number \| null` | Ground track direction in degrees (0 = North) |
| `speed` | `number \| null` | Speed in meters per second |
| `hasPermission` | `boolean` | Fine location permission status |

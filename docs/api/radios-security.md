# Radios & Hardware Security API Reference 🔐
> **Titan M3 Post-Quantum Cryptography, Biometrics, Bluetooth LE, NFC, and Dual-Band GNSS**

This document covers wireless radios, near-field interactions, satellite positioning, and hardware-backed cryptographic security on the Pixel 11 Pro.

---

## 📑 Module Index

* [`useBiometrics`](#usebiometrics) - Ultrasonic In-Screen Fingerprint & Class 3 Face Unlock
* [`useSecurity`](#usesecurity) - Titan M3 Post-Quantum Cryptography (PQC) KeyStore
* [`useBLE`](#useble) - Bluetooth 5.4 Low Energy Scanner & Beacon Proximity
* [`useNFC`](#usenfc) - Contactless NDEF / RFID Smart Tag Controller
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

Cryptographic key persistence backed by the **Titan M3** security coprocessor with **Post-Quantum Cryptography (PQC)**.

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
    await saveSecureItem("USER_VAULT_KEY", "quantum_resistant_secret_token");
  };

  return <HapticButton title="Save to Titan M3 Vault" onPress={handleSave} />;
}
```

---

## `useBLE`

Scans for nearby Bluetooth 5.4 Low Energy beacons, trackers, and smart accessories with RSSI distance estimation.

### Signature
```typescript
function useBLE(): {
  peripherals: BLEPeripheral[];
  isScanning: boolean;
  startScan: () => void;
  stopScan: () => void;
};
```

---

## `useNFC`

Interacts with Near Field Communication tags and smart cards touched against the upper third of the rear glass visor.

### Signature
```typescript
function useNFC(): {
  isSupported: boolean;
  isScanning: boolean;
  lastScannedTag: NFCTag | null;
  startScan: () => Promise<void>;
  simulateScan: (mockId?: string, mockPayload?: string) => void;
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

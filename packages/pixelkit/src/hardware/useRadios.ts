/**
 * @file useRadios.ts
 * @description Comprehensive hardware radio telemetry (NFC, Bluetooth LE, UWB, Wi-Fi RTT, Satellite)
 * directly queried from Android system services (NfcAdapter, BluetoothManager, UwbManager,
 * WifiRttManager, and PackageManager).
 */

import { useCallback, useEffect, useState } from 'react';
import PixelNative, { type RadioInfo, type BondedDevice } from 'pixel-native';
import { logEvent, recordMetric, type TelemetrySource } from '../core/observability';

const MODULE = 'useRadios';
const POLL_MS = 5000;

export interface RadioTelemetry {
  /** Latest failure message, or null. Failures are also logged and counted. */
  error: string | null;
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
  source: TelemetrySource;
  refresh: () => void;
}

const DEFAULT_RADIO_INFO: RadioInfo = {
  nfc: {
    supported: false,
    enabled: false,
    observeModeSupported: false,
    antennaState: 'UNAVAILABLE',
  },
  bluetooth: {
    supported: false,
    bleSupported: false,
    enabled: false,
    state: 'OFF',
    channelSounding: false,
    bondedDevices: [],
  },
  uwb: {
    supported: false,
    enabled: false,
    chipId: null,
    rangingApiSupported: false,
  },
  wifiRtt: {
    supported: false,
    available: false,
  },
  satellite: {
    supported: false,
  },
};

/**
 * Hook exposing real hardware radio states across NFC, Bluetooth LE, UWB, and Wi-Fi RTT.
 *
 * @example
 * ```typescript
 * const { nfc, bluetooth, uwb, source, refresh } = useRadios();
 * console.log(`NFC: ${nfc.antennaState}, BT: ${bluetooth.state}, UWB: ${uwb.enabled}`);
 * ```
 */
export function useRadios(): RadioTelemetry {
  const [radioInfo, setRadioInfo] = useState<RadioInfo>(DEFAULT_RADIO_INFO);
  const [error, setError] = useState<string | null>(null);
  const source: TelemetrySource = PixelNative ? 'hardware' : 'unavailable';

  const read = useCallback(() => {
    if (!PixelNative) return;
    try {
      const info = PixelNative.getRadioInfo();
      setRadioInfo(info);
      recordMetric(MODULE, 'nfcEnabled', info.nfc.enabled, 'hardware');
      recordMetric(MODULE, 'bluetoothState', info.bluetooth.state, 'hardware');
      recordMetric(MODULE, 'uwbEnabled', info.uwb.enabled, 'hardware');
    } catch (e: any) {
      setError(e?.message ?? 'getRadioInfo error');
      logEvent(MODULE, 'getRadioInfo error', { message: e?.message }, 'error');
    }
  }, []);

  useEffect(() => {
    if (!PixelNative) {
      logEvent(MODULE, 'native module absent; radio telemetry unavailable', undefined, 'warn');
      return;
    }
    read();
    const interval = setInterval(read, POLL_MS);
    return () => clearInterval(interval);
  }, [read]);

  return {
    ...radioInfo,
    /** Latest failure message, or null. Failures are also logged and counted. */
    error,
    source,
    refresh: read,
  };
}

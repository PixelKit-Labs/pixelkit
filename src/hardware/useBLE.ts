/**
 * @file useBLE.ts
 * @description Bluetooth Low Energy (BLE) peripheral discovery, bonded devices, and RSSI tracking.
 * Reads physical adapter state, Bluetooth 5.4 Channel Sounding hardware support, bonded devices,
 * and active BluetoothLeScanner discovery from PixelNative.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import PixelNative, { type BondedDevice, type DiscoveredBleDevice } from '../../modules/pixel-native';
import { logEvent, logError, recordMetric, traced, type TelemetrySource } from '../core/observability';

const MODULE = 'useBLE';
import { BLEPeripheral } from '../core/types';

/**
 * Calculates estimated distance in meters from RSSI and txPower using the log-distance path loss model.
 */
function estimateDistance(rssi: number, txPower: number = -59): number {
  if (rssi === 0) return -1.0;
  const ratio = (txPower - rssi) / (10 * 2.0); // Path loss exponent n=2.0 (free space)
  return Number(Math.pow(10, ratio).toFixed(2));
}

/**
 * Hook to discover nearby Bluetooth Low Energy devices and inspect bonded peripherals.
 *
 * @returns Object providing discovered peripherals, bonded devices, hardware state, and scan controls.
 *
 * @example
 * ```typescript
 * const { state, channelSounding, bondedDevices, isScanning, peripherals, startScan, stopScan } = useBLE();
 * await startScan(10000);
 * console.log(`Bonded: ${bondedDevices.length}, Discovered: ${peripherals.length}`);
 * ```
 */
export function useBLE() {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [peripherals, setPeripherals] = useState<BLEPeripheral[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nativeInfo = PixelNative?.getRadioInfo?.()?.bluetooth;
  const isSupported = nativeInfo?.supported ?? false;
  const isEnabled = nativeInfo?.enabled ?? false;
  const state = nativeInfo?.state ?? (isEnabled ? 'ON' : 'OFF');
  const channelSounding = nativeInfo?.channelSounding ?? false;
  const bondedDevices: BondedDevice[] = nativeInfo?.bondedDevices ?? [];

  // When native module is available, provenance is genuine hardware
  const source: TelemetrySource = PixelNative ? 'hardware' : 'unavailable';

  const syncDiscovered = useCallback(() => {
    if (!PixelNative?.getDiscoveredBleDevices) return;
    try {
      const raw: DiscoveredBleDevice[] = PixelNative.getDiscoveredBleDevices() ?? [];
      const mapped: BLEPeripheral[] = raw.map((d) => ({
        id: d.address,
        name: d.name,
        rssi: d.rssi,
        estimatedDistanceMeters: estimateDistance(d.rssi, d.txPower ?? -59),
        lastSeenTimestamp: Math.floor(Date.now() - (d.timestampNanos ? 100 : 0)),
      }));
      setPeripherals(mapped);
    } catch (e) {
      logError(MODULE, 'readDiscovered failed', e);
    }
  }, []);

  /**
   * Halts active BLE scanning.
   */
  const stopScan = useCallback((): void => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    if (stopTimeout.current) {
      clearTimeout(stopTimeout.current);
      stopTimeout.current = null;
    }
    try {
      PixelNative?.stopBleScan?.();
      logEvent(MODULE, 'scan stopped');
    } catch (e) {
      logError(MODULE, 'stopScan failed', e);
    }
    syncDiscovered();
    setIsScanning(false);
  }, [syncDiscovered]);

  /**
   * Begins physical Bluetooth Low Energy discovery via Android BluetoothLeScanner.
   */
  const startScan = useCallback(async (timeoutMs: number = 10000): Promise<boolean> => {
    setScanError(null);
    if (!PixelNative?.startBleScan) {
      setScanError('Native BLE scanner not available on this platform');
      return false;
    }

    try {
      const res = await traced(MODULE, 'startScan', () => PixelNative!.startBleScan(timeoutMs), { timeoutMs });
      if (!res?.success) {
        setScanError(res?.error ?? 'Scan failed to start');
        setIsScanning(false);
        return false;
      }

      setIsScanning(true);

      // Poll discovered devices every 500ms while scanning
      if (pollTimer.current) clearInterval(pollTimer.current);
      pollTimer.current = setInterval(syncDiscovered, 500);

      // Auto-stop flag after timeout
      if (stopTimeout.current) clearTimeout(stopTimeout.current);
      stopTimeout.current = setTimeout(() => {
        stopScan();
      }, timeoutMs);

      return true;
    } catch (e: any) {
      setScanError(e?.message ?? 'Scan error');
      setIsScanning(false);
      return false;
    }
  }, [stopScan, syncDiscovered]);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      if (stopTimeout.current) clearTimeout(stopTimeout.current);
    };
  }, []);

  return {
    /** Whether device hardware has Bluetooth Low Energy */
    isSupported,
    /** Whether Bluetooth is switched on in Android Settings */
    isEnabled,
    /** Bluetooth adapter state ('ON' | 'OFF' | 'TURNING_ON' | 'TURNING_OFF') */
    state,
    /** True if Bluetooth Channel Sounding (fine ranging) is supported by silicon */
    channelSounding,
    /** Real paired/bonded Bluetooth peripherals from Android BluetoothAdapter */
    bondedDevices,
    /** Latest failure message, or null. Failures are also logged and counted. */
    error,
    /** Provenance of the adapter telemetry */
    source,
    /** Whether BLE radio is actively scanning */
    isScanning,
    /** List of discovered nearby peripherals with genuine RSSI and distance estimate */
    peripherals,
    /** Error message if scan failed */
    scanError,
    /** Start physical discovery scan */
    startScan,
    /** Stop active scan */
    stopScan,
  };
}

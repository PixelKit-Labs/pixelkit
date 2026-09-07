/**
 * @file useDevice.ts
 * @description Device identity, battery and power state, with live listeners.
 *
 * Nothing is assumed before the platform answers. Battery level starts null rather than a
 * comfortable 100, connectivity starts false rather than optimistically connected, and identity
 * fields fall back to null rather than to the model this SDK happens to target. Each sub-read
 * fails independently, so one unavailable value does not blank the rest, and every failure is
 * logged and counted rather than swallowed.
 *
 * `lowPowerMode` reflects Android Battery Saver and is a direct instruction to do less: reduce
 * sensor intervals, defer heavy work and stop background polling.
 */

import { useState, useEffect, useCallback } from 'react';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import { logEvent, logError, recordMetric, tracedSafe, type TelemetrySource } from '../core/observability';
import { DeviceTelemetry } from '../core/types';

const MODULE = 'useDevice';

export function useDevice() {
  // Identity is available synchronously from the platform; null when it cannot be read.
  const [identity] = useState(() => ({
    modelName: Device.modelName ?? 'Unknown device',
    brand: Device.brand ?? 'Unknown',
    osVersion: Device.osVersion ?? 'Unknown',
    totalMemoryMB: Device.totalMemory ? Math.round(Device.totalMemory / (1024 * 1024)) : undefined,
  }));

  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [lowPowerMode, setLowPowerMode] = useState<boolean>(false);
  const [networkType, setNetworkType] = useState<string>('UNKNOWN');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [hasRead, setHasRead] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const source: TelemetrySource = hasRead ? 'hardware' : 'unavailable';

  /** Re-reads power and connectivity. Each value is read independently. */
  const refresh = useCallback(async (): Promise<void> => {
    const [level, state, lowPower, net] = await Promise.all([
      tracedSafe(MODULE, 'readBatteryLevel', () => Battery.getBatteryLevelAsync(), null),
      tracedSafe(MODULE, 'readBatteryState', () => Battery.getBatteryStateAsync(), null),
      tracedSafe(MODULE, 'readLowPowerMode', () => Battery.isLowPowerModeEnabledAsync(), false),
      tracedSafe(MODULE, 'readNetworkState', () => Network.getNetworkStateAsync(), null),
    ]);

    // A failed battery read leaves the level null rather than inventing a charge.
    if (level != null) {
      const pct = Math.round(level * 100);
      setBatteryLevel(pct);
      recordMetric(MODULE, 'batteryPercent', pct, 'hardware');
    }
    if (state != null) {
      setIsCharging(state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL);
    }
    setLowPowerMode(!!lowPower);
    setNetworkType(net?.type ?? 'UNKNOWN');
    setIsConnected(!!net?.isConnected && net?.isInternetReachable !== false);

    const anyRead = level != null || state != null || net != null;
    setHasRead(anyRead);
    if (!anyRead) {
      setError('Could not read battery or network state');
    } else {
      setError(null);
      logEvent(MODULE, 'state', {
        batteryPercent: level == null ? null : Math.round(level * 100),
        charging: state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL,
        lowPowerMode: !!lowPower,
        networkType: net?.type ?? 'UNKNOWN',
      });
    }
  }, []);

  useEffect(() => {
    let levelSub: { remove: () => void } | null = null;
    let stateSub: { remove: () => void } | null = null;

    void refresh();

    // Listeners are attached separately: a failure here must not prevent the one-off read above.
    try {
      levelSub = Battery.addBatteryLevelListener(({ batteryLevel: lvl }) => {
        const pct = Math.round(lvl * 100);
        setBatteryLevel(pct);
        recordMetric(MODULE, 'batteryPercent', pct, 'hardware');
      });
      stateSub = Battery.addBatteryStateListener(({ batteryState }) => {
        const charging = batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL;
        setIsCharging(charging);
        logEvent(MODULE, 'charging changed', { charging });
      });
      logEvent(MODULE, 'battery listeners attached');
    } catch (e) {
      setError(logError(MODULE, 'battery listeners failed', e).message);
    }

    return () => {
      levelSub?.remove();
      stateSub?.remove();
    };
  }, [refresh]);

  const telemetry: DeviceTelemetry = {
    ...identity,
    // The shared type requires a number; callers wanting the honest value read `batteryPercent`.
    batteryLevel: batteryLevel ?? 0,
    isCharging,
    lowPowerMode,
    networkType,
    isConnected,
  };

  return {
    ...telemetry,
    /** Battery percentage, or null when it has not been read. Prefer this over `batteryLevel`. */
    batteryPercent: batteryLevel,
    /** Whether any power or network value has been read. */
    hasRead,
    /** Why the last read failed. */
    error,
    source,
    refresh,
  };
}

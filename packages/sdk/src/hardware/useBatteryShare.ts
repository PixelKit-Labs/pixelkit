/**
 * @file useBatteryShare.ts
 * @description Google Pixel Battery Share (Reverse Wireless Qi Charging) telemetry and actuator.
 *
 * Adheres to the Zero-Simulation Principle: returns isSupported: false, transmittedWatts: null,
 * and source: 'unavailable' if reverse wireless power transfer is not supported by hardware.
 */

import { useState, useEffect, useCallback } from 'react';
import PixelNative, { type BatteryShareStatus } from '@pixelkit-labs/native';
import { logEvent, logError, recordMetric, type TelemetrySource } from '../core/observability';

const MODULE = 'useBatteryShare';

export interface BatteryShareTelemetry {
  /** Whether this device hardware supports reverse wireless power transmission. */
  isSupported: boolean;
  /** Whether the Qi TX reverse charging coil is currently energized. */
  isActive: boolean;
  /** Whether a compatible Qi receiver (Pixel Buds, Pixel Watch, Qi phone) is docked on the coil. */
  isReceiverDetected: boolean;
  /** Real-time power transmitted in watts (W), or null if inactive/unsupported. */
  transmittedWatts: number | null;
  /** Safety cutoff threshold percentage (stops sharing when battery drops below this). */
  batteryThreshold: number;
  /** Error message if query or toggle failed. */
  error: string | null;
  /** Provenance of the data: 'hardware' or 'unavailable'. */
  source: TelemetrySource;
  /** Toggles the reverse wireless charging coil on or off. */
  setBatteryShare: (enabled: boolean) => Promise<boolean>;
  /** Sets the battery percentage cutoff threshold (e.g. 15%). */
  setBatteryThreshold: (pct: number) => void;
  /** Refreshes the reverse wireless charging status. */
  refresh: () => void;
}

export function useBatteryShare(): BatteryShareTelemetry {
  const [status, setStatus] = useState<BatteryShareStatus>({
    isSupported: false,
    isActive: false,
    isReceiverDetected: false,
    transmittedWatts: null,
    batteryThreshold: 15,
    error: null,
  });

  const [threshold, setThreshold] = useState<number>(15);
  const [error, setError] = useState<string | null>(null);

  const source: TelemetrySource =
    PixelNative && status.isSupported ? 'hardware' : 'unavailable';

  const refresh = useCallback(() => {
    if (!PixelNative) {
      setStatus({
        isSupported: false,
        isActive: false,
        isReceiverDetected: false,
        transmittedWatts: null,
        batteryThreshold: 15,
        error: 'PixelNative module unavailable',
      });
      setError('PixelNative module unavailable');
      return;
    }

    try {
      const res = PixelNative.getBatteryShareStatus();
      setStatus(res);
      setThreshold(res.batteryThreshold ?? 15);
      setError(res.error ?? null);

      if (res.transmittedWatts !== null) {
        recordMetric(MODULE, 'transmittedWatts', res.transmittedWatts, 'hardware');
      }
      logEvent(MODULE, 'queried battery share status', {
        supported: res.isSupported,
        active: res.isActive,
      });
    } catch (e: any) {
      const err = logError(MODULE, 'getBatteryShareStatus failed', e);
      setError(err.message);
    }
  }, []);

  const setBatteryShare = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (!PixelNative) return false;
    try {
      const success = await PixelNative.setBatteryShareEnabled(enabled);
      if (success) {
        setStatus((prev) => ({ ...prev, isActive: enabled }));
        logEvent(MODULE, 'toggled battery share', { enabled });
      }
      return success;
    } catch (e: any) {
      logError(MODULE, 'setBatteryShareEnabled failed', e);
      return false;
    }
  }, []);

  const setBatteryThreshold = useCallback((pct: number) => {
    const clamped = Math.max(10, Math.min(50, pct));
    setThreshold(clamped);
    logEvent(MODULE, 'updated battery share threshold', { threshold: clamped });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    isSupported: status.isSupported,
    isActive: status.isActive,
    isReceiverDetected: status.isReceiverDetected,
    transmittedWatts: status.transmittedWatts,
    batteryThreshold: threshold,
    error,
    source,
    setBatteryShare,
    setBatteryThreshold,
    refresh,
  };
}

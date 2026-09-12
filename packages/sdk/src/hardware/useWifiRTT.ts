/**
 * @file useWifiRTT.ts
 * @description Fine Timing Measurement (FTM / 802.11az) indoor centimeter-level positioning
 * via Android WifiRttManager.
 *
 * Adheres to the Zero-Simulation Principle: isSupported: false, rangingResults: [],
 * and source: 'unavailable' when FTM hardware is missing or unsupported.
 */

import { useState, useEffect, useCallback } from 'react';
import PixelNative, {
  type WifiRttStatusResult,
  type WifiRttResult,
} from '@pixelkit-labs/native';
import { logEvent, logError, recordMetric, type TelemetrySource } from '../core/observability';

const MODULE = 'useWifiRTT';
export { type WifiRttResult };

export interface WifiRTTTelemetry {
  /** Whether the device hardware contains the Wi-Fi RTT (FTM) responder/initiator subsystem. */
  isSupported: boolean;
  /** Whether the Wi-Fi RTT ranging service is currently available (Wi-Fi and Location turned on). */
  isAvailable: boolean;
  /** Whether an active ranging sweep is currently in progress. */
  isRanging: boolean;
  /** Latest round-trip time ranging measurements to specified Access Point BSSIDs. */
  rangingResults: WifiRttResult[];
  /** Error message if RTT service probing or ranging execution failed. */
  error: string | null;
  /** Provenance of the data: 'hardware' or 'unavailable'. */
  source: TelemetrySource;
  /** Initiates an active round-trip time ranging request against specified AP BSSID MAC addresses. */
  startRanging: (bssids: string[]) => Promise<WifiRttResult[]>;
  /** Re-checks the availability status of the Wi-Fi RTT service. */
  refresh: () => void;
}

export function useWifiRTT(): WifiRTTTelemetry {
  const [data, setData] = useState<WifiRttStatusResult>({
    isSupported: false,
    isAvailable: false,
    isRanging: false,
    rangingResults: [],
    error: null,
  });

  const [isRanging, setIsRanging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const source: TelemetrySource =
    PixelNative && data.isSupported ? 'hardware' : 'unavailable';

  const refresh = useCallback(() => {
    if (!PixelNative) {
      setData({
        isSupported: false,
        isAvailable: false,
        isRanging: false,
        rangingResults: [],
        error: 'PixelNative module unavailable',
      });
      setError('PixelNative module unavailable');
      return;
    }

    try {
      const res = PixelNative.getWifiRttStatus();
      setData(res);
      setError(res.error ?? null);
      logEvent(MODULE, 'queried wifi rtt status', {
        supported: res.isSupported,
        available: res.isAvailable,
      });
    } catch (e: any) {
      const err = logError(MODULE, 'getWifiRttStatus failed', e);
      setError(err.message);
    }
  }, []);

  const startRanging = useCallback(
    async (bssids: string[]): Promise<WifiRttResult[]> => {
      if (!PixelNative) return [];
      setIsRanging(true);
      try {
        const res = await PixelNative.startWifiRttRanging(bssids);
        setData(res);
        setIsRanging(false);
        setError(res.error ?? null);
        recordMetric(MODULE, 'rangingSuccessCount', res.rangingResults?.length ?? 0, 'hardware');
        logEvent(MODULE, 'completed wifi rtt ranging', { count: res.rangingResults?.length ?? 0 });
        return res.rangingResults ?? [];
      } catch (e: any) {
        setIsRanging(false);
        const err = logError(MODULE, 'startWifiRttRanging failed', e);
        setError(err.message);
        return [];
      }
    },
    []
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    isSupported: data.isSupported,
    isAvailable: data.isAvailable,
    isRanging,
    rangingResults: data.rangingResults,
    error,
    source,
    startRanging,
    refresh,
  };
}

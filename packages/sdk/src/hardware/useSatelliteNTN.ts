/**
 * @file useSatelliteNTN.ts
 * @description 3GPP Release-17 Non-Terrestrial Network (satellite SOS) status and alignment telemetry.
 *
 * Adheres to the Zero-Simulation Principle: isSupported: false, carrier: null,
 * and source: 'unavailable' on non-satellite hardware modems.
 */

import { useState, useEffect, useCallback } from 'react';
import PixelNative, {
  type SatelliteStatusResult,
  type SatelliteGuidance,
} from '@pixelkit-labs/native';
import { logEvent, logError, recordMetric, type TelemetrySource } from '../core/observability';

const MODULE = 'useSatelliteNTN';
export { type SatelliteGuidance };

export type SatelliteConnectionState = 'disconnected' | 'searching' | 'connected' | 'pointing_assist';

export interface SatelliteNTNTechTelemetry {
  /** Whether this device hardware and modem support Non-Terrestrial Network satellite links. */
  isSupported: boolean;
  /** Current lifecycle connection state with the satellite constellation. */
  connectionState: SatelliteConnectionState;
  /** Satellite network provider or operator (e.g. Skylo, T-Mobile Starlink, Iridium), or null. */
  carrier: string | null;
  /** Signal quality indicator bars (0 to 4), or null if disconnected. */
  signalQualityBars: number | null;
  /** Spatial pointing guidance for antenna alignment (azimuth, elevation, alignment flag), or null. */
  pointingGuidance: SatelliteGuidance | null;
  /** Whether the satellite link is ready for emergency SOS packet transmission. */
  emergencyServicesReady: boolean;
  /** Error message if satellite query failed. */
  error: string | null;
  /** Provenance of the data: 'hardware' or 'unavailable'. */
  source: TelemetrySource;
  /** Re-reads satellite modem connectivity and pointing status. */
  refresh: () => void;
}

export function useSatelliteNTN(): SatelliteNTNTechTelemetry {
  const [data, setData] = useState<SatelliteStatusResult>({
    isSupported: false,
    connectionState: 'disconnected',
    carrier: null,
    signalQualityBars: null,
    pointingGuidance: null,
    emergencyServicesReady: false,
    error: null,
  });

  const [error, setError] = useState<string | null>(null);

  const source: TelemetrySource =
    PixelNative && data.isSupported ? 'hardware' : 'unavailable';

  const refresh = useCallback(() => {
    if (!PixelNative) {
      setData({
        isSupported: false,
        connectionState: 'disconnected',
        carrier: null,
        signalQualityBars: null,
        pointingGuidance: null,
        emergencyServicesReady: false,
        error: 'PixelNative module unavailable',
      });
      setError('PixelNative module unavailable');
      return;
    }

    try {
      const res = PixelNative.getSatelliteStatus();
      setData(res);
      setError(res.error ?? null);

      if (res.signalQualityBars !== null) {
        recordMetric(MODULE, 'signalQualityBars', res.signalQualityBars, 'hardware');
      }
      logEvent(MODULE, 'queried satellite ntn status', {
        supported: res.isSupported,
        state: res.connectionState,
        carrier: res.carrier,
      });
    } catch (e: any) {
      const err = logError(MODULE, 'getSatelliteStatus failed', e);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    isSupported: data.isSupported,
    connectionState: data.connectionState,
    carrier: data.carrier,
    signalQualityBars: data.signalQualityBars,
    pointingGuidance: data.pointingGuidance,
    emergencyServicesReady: data.emergencyServicesReady,
    error,
    source,
    refresh,
  };
}

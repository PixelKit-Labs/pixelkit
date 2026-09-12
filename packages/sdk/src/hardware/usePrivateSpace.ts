/**
 * @file usePrivateSpace.ts
 * @description Android 15+ (API 35+) Private Space vault isolation detection and auto-lock policy telemetry.
 *
 * Adheres to the Zero-Simulation Principle: isInsidePrivateSpace: false,
 * and source: 'unavailable' on Android 14 or earlier.
 */

import { useState, useEffect, useCallback } from 'react';
import PixelNative, { type PrivateSpaceInfo } from '@pixelkit-labs/native';
import { logEvent, logError, recordMetric, type TelemetrySource } from '../core/observability';

const MODULE = 'usePrivateSpace';

export type PrivateSpaceAutoLockPolicy = 'immediate' | 'screen_off' | 'device_reboot' | 'unknown';

export interface PrivateSpaceTelemetry {
  /** Whether the current application process is executing inside the isolated Private Space profile. */
  isInsidePrivateSpace: boolean;
  /** Whether the device currently has a Private Space secure profile configured. */
  isPrivateSpaceConfigured: boolean;
  /** Configured auto-lock timeout policy for the private space vault. */
  autoLockPolicy: PrivateSpaceAutoLockPolicy;
  /** Error message if private profile querying failed. */
  error: string | null;
  /** Provenance of the data: 'hardware' or 'unavailable'. */
  source: TelemetrySource;
  /** Queries user profile isolation state. */
  refresh: () => void;
}

export function usePrivateSpace(): PrivateSpaceTelemetry {
  const [data, setData] = useState<PrivateSpaceInfo>({
    isInsidePrivateSpace: false,
    isPrivateSpaceConfigured: false,
    autoLockPolicy: 'unknown',
    error: null,
  });

  const [error, setError] = useState<string | null>(null);

  const source: TelemetrySource = PixelNative ? 'hardware' : 'unavailable';

  const refresh = useCallback(() => {
    if (!PixelNative) {
      setData({
        isInsidePrivateSpace: false,
        isPrivateSpaceConfigured: false,
        autoLockPolicy: 'unknown',
        error: 'PixelNative module unavailable',
      });
      setError('PixelNative module unavailable');
      return;
    }

    try {
      const res = PixelNative.getPrivateSpaceInfo();
      setData(res);
      setError(res.error ?? null);
      recordMetric(MODULE, 'isInsidePrivateSpace', res.isInsidePrivateSpace, 'hardware');
      logEvent(MODULE, 'queried private space status', {
        inside: res.isInsidePrivateSpace,
        configured: res.isPrivateSpaceConfigured,
      });
    } catch (e: any) {
      const err = logError(MODULE, 'getPrivateSpaceInfo failed', e);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    isInsidePrivateSpace: data.isInsidePrivateSpace,
    isPrivateSpaceConfigured: data.isPrivateSpaceConfigured,
    autoLockPolicy: data.autoLockPolicy as PrivateSpaceAutoLockPolicy,
    error,
    source,
    refresh,
  };
}

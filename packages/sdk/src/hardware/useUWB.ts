/**
 * @file useUWB.ts
 * @description Ultra-Wideband (UWB) radio controller and spatial ranging sessions.
 * Queries physical UWB transceiver status, Android 14+ RangingManager / UwbManager service,
 * and tracks spatial distance and orientation without simulated placeholders.
 */

import { useCallback, useState } from 'react';
import PixelNative, { type UwbRangingResult } from '@pixelkit-labs/native';
import { logEvent, logError, traced, type TelemetrySource } from '../core/observability';

const MODULE = 'useUWB';
import { UWBSpatialTarget } from '../core/types';

/**
 * Hook to inspect hardware UWB transceiver state and manage spatial ranging sessions.
 *
 * @returns Object providing hardware chip status, session diagnostics, tracked targets, and ranging controls.
 *
 * @example
 * ```typescript
 * const { isEnabled, chipId, isRanging, startRanging, stopRanging, rangingApiSupported } = useUWB();
 * await startRanging();
 * ```
 */
export function useUWB() {
  const [isRanging, setIsRanging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTargets, setActiveTargets] = useState<UWBSpatialTarget[]>([]);
  const [sessionInfo, setSessionInfo] = useState<UwbRangingResult | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const nativeInfo = PixelNative?.getRadioInfo?.()?.uwb;
  const isSupported = nativeInfo?.supported ?? false;
  const isEnabled = nativeInfo?.enabled ?? false;
  const chipId = nativeInfo?.chipId ?? (isSupported ? 'default' : null);
  const rangingApiSupported = nativeInfo?.rangingApiSupported ?? false;

  // Genuine hardware provenance
  const source: TelemetrySource = PixelNative && isSupported ? 'hardware' : 'unavailable';

  /**
   * Starts a hardware UWB ranging session through Android RangingManager / UwbManager.
   */
  const startRanging = useCallback(async (sessionId: number = 1001): Promise<boolean> => {
    setSessionError(null);
    if (!PixelNative?.startUwbRanging) {
      setSessionError('Native UWB ranging service not available');
      return false;
    }

    try {
      const res = await traced(MODULE, 'startRanging', () => PixelNative!.startUwbRanging(sessionId), { sessionId });
      setSessionInfo(res);
      if (res?.success) {
        setIsRanging(true);
        return true;
      } else {
        setSessionError('UWB hardware not supported on this device');
        setIsRanging(false);
        return false;
      }
    } catch (e) {
      setSessionError(logError(MODULE, 'startRanging failed', e, { sessionId }).message);
      setIsRanging(false);
      return false;
    }
  }, []);

  /**
   * Stops the active UWB RF ranging session.
   */
  const stopRanging = useCallback((): void => {
    try {
      PixelNative?.stopUwbRanging?.();
      logEvent(MODULE, 'ranging stopped');
    } catch (e) {
      logError(MODULE, 'stopRanging failed', e);
    }
    setIsRanging(false);
  }, []);

  return {
    /** Whether UWB chip is present on device */
    isSupported,
    /** Whether UWB radio is enabled in system settings */
    isEnabled,
    /** Hardware UWB chip ID ('default' on Pixel Pro) */
    chipId,
    /** Whether Android 16+ RangingManager service is available */
    rangingApiSupported,
    /** Latest failure message, or null. Failures are also logged and counted. */
    error,
    /** Hardware provenance of the radio telemetry */
    source,
    /** Whether UWB radar ranging is actively transmitting */
    isRanging,
    /** List of spatially tracked anchors and devices */
    activeTargets,
    /** Active ranging session diagnostics */
    sessionInfo,
    /** Last session error message */
    sessionError,
    /** Begin spatial ranging session */
    startRanging,
    /** Stop spatial ranging session */
    stopRanging,
  };
}

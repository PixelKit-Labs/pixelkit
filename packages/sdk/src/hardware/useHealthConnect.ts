/**
 * @file useHealthConnect.ts
 * @description Android Health Connect & Sensor Vitals integration.
 * Verified on Pixel 11 Pro: Android 14+ system-integrated Health Connect framework,
 * `feature:android.hardware.sensor.stepcounter`, and physical hardware health sensors.
 * Nothing is simulated: queries actual system Health Connect framework and Sensor HAL.
 */

import { useCallback, useEffect, useState } from 'react';
import PixelNative, { type HealthConnectInfo } from '@pixelkit-labs/native';
import { logEvent, recordMetric, type TelemetrySource } from '../core/observability';

const MODULE = 'useHealthConnect';

export { type HealthConnectInfo };

export interface HealthConnectState {
  /** Whether Health Connect is available on the device */
  isAvailable: boolean;
  /** Platform SDK availability status ('SDK_AVAILABLE' | 'SDK_UNAVAILABLE' | 'SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED') */
  sdkStatus: 'SDK_AVAILABLE' | 'SDK_UNAVAILABLE' | 'SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED';
  /** Whether physical hardware step counter sensor is present */
  hasStepCounter: boolean;
  /** Whether hardware heart rate sensor is present */
  hasHeartRateSensor: boolean;
  /** Hardware sensor name (e.g. Google Step Counter) */
  stepSensorName: string | null;
  /** Hardware heart rate sensor name */
  heartRateSensorName: string | null;
  /** Whether Health Connect is built into the OS (Android 14+) */
  isFrameworkIntegrated: boolean;
  /** Error message if unavailable */
  error: string | null;
  /** Telemetry provenance */
  source: TelemetrySource;
  /** Re-probe Health Connect framework and hardware sensors */
  refresh: () => HealthConnectInfo | null;
}

/**
 * Hook to inspect Android Health Connect framework availability and query device health sensor hardware.
 *
 * @example
 * ```typescript
 * const { isAvailable, sdkStatus, hasStepCounter, stepSensorName } = useHealthConnect();
 * console.log(`Health Connect status: ${sdkStatus}, Step sensor: ${stepSensorName}`);
 * ```
 */
export function useHealthConnect(): HealthConnectState {
  const [data, setData] = useState<HealthConnectInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback((): HealthConnectInfo | null => {
    if (!PixelNative) {
      logEvent(MODULE, 'native module absent; health connect unavailable', undefined, 'warn');
      return null;
    }
    try {
      const info = PixelNative.getHealthConnectInfo();
      setData(info);
      if (info.error) {
        setError(info.error);
      } else {
        setError(null);
      }
      recordMetric(MODULE, 'isAvailable', info.isAvailable ? 1 : 0, info.isAvailable ? 'hardware' : 'unavailable');
      recordMetric(MODULE, 'hasStepCounter', info.hasStepCounter ? 1 : 0, info.hasStepCounter ? 'hardware' : 'unavailable');
      logEvent(MODULE, 'health connect queried', {
        isAvailable: info.isAvailable,
        sdkStatus: info.sdkStatus,
        hasStepCounter: info.hasStepCounter,
        isFrameworkIntegrated: info.isFrameworkIntegrated,
      });
      return info;
    } catch (e: any) {
      const msg = e?.message ?? 'getHealthConnectInfo failed';
      setError(msg);
      logEvent(MODULE, 'getHealthConnectInfo error', { error: msg }, 'error');
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isHardware = Boolean(PixelNative && data?.isAvailable);

  return {
    isAvailable: data?.isAvailable ?? false,
    sdkStatus: data?.sdkStatus ?? 'SDK_UNAVAILABLE',
    hasStepCounter: data?.hasStepCounter ?? false,
    hasHeartRateSensor: data?.hasHeartRateSensor ?? false,
    stepSensorName: data?.stepSensorName ?? null,
    heartRateSensorName: data?.heartRateSensorName ?? null,
    isFrameworkIntegrated: data?.isFrameworkIntegrated ?? false,
    error,
    source: isHardware ? 'hardware' : 'unavailable',
    refresh,
  };
}

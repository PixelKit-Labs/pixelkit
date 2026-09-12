/**
 * @file useThermometer.ts
 * @description Non-contact infrared temperature measurement on Google Pixel Pro hardware
 * (Melexis MLX90632 far-infrared thermopile sensor).
 *
 * Adheres to the Zero-Simulation Principle: returns null and source: 'unavailable'
 * on non-Pro Pixel models or when the sensor is not present.
 */

import { useState, useEffect, useCallback } from 'react';
import PixelNative, { type ThermometerReading } from '@pixelkit-labs/native';
import { logEvent, logError, recordMetric, type TelemetrySource } from '../core/observability';

const MODULE = 'useThermometer';
export const DEFAULT_EMISSIVITY = 0.95; // Default for organic materials / human skin / water

export type ThermometerMode = 'object' | 'body' | 'ambient';

export interface ThermometerTelemetry {
  /** Whether this device hardware contains the non-contact FIR temperature sensor. */
  isSupported: boolean;
  /** Calibrated surface temperature reading in degrees Celsius (°C), or null. */
  surfaceTemperatureC: number | null;
  /** Calibrated surface temperature reading in degrees Fahrenheit (°F), or null. */
  surfaceTemperatureF: number | null;
  /** Internal sensor die / ambient environment temperature in degrees Celsius (°C), or null. */
  ambientTemperatureC: number | null;
  /** Configured material surface emissivity factor (0.1 to 1.0). */
  emissivity: number;
  /** Target measurement mode ('object', 'body', 'ambient'). */
  mode: ThermometerMode;
  /** Error message if sensor probing or reading failed. */
  error: string | null;
  /** Provenance of the data: 'hardware' or 'unavailable'. */
  source: TelemetrySource;
  /** Configures the material emissivity coefficient (e.g. 0.95 for skin/water, 0.80 for cast iron). */
  setEmissivity: (value: number) => void;
  /** Sets the measurement calculation mode ('object', 'body', 'ambient'). */
  setMode: (mode: ThermometerMode) => void;
  /** Probes the hardware sensor for a fresh reading. */
  refresh: () => void;
}

export function useThermometer(initialEmissivity: number = DEFAULT_EMISSIVITY): ThermometerTelemetry {
  const [reading, setReading] = useState<ThermometerReading>({
    isSupported: false,
    surfaceTemperatureC: null,
    surfaceTemperatureF: null,
    ambientTemperatureC: null,
    sensorName: null,
    error: null,
  });

  const [emissivity, setEmissivityState] = useState<number>(initialEmissivity);
  const [mode, setModeState] = useState<ThermometerMode>('object');
  const [error, setError] = useState<string | null>(null);

  const source: TelemetrySource =
    PixelNative && reading.isSupported && reading.surfaceTemperatureC !== null ? 'hardware' : 'unavailable';

  const refresh = useCallback(() => {
    if (!PixelNative) {
      setReading({
        isSupported: false,
        surfaceTemperatureC: null,
        surfaceTemperatureF: null,
        ambientTemperatureC: null,
        sensorName: null,
        error: 'PixelNative module unavailable',
      });
      setError('PixelNative module unavailable');
      return;
    }

    try {
      const res = PixelNative.getThermometerReading();
      setReading(res);
      setError(res.error ?? null);

      if (res.surfaceTemperatureC !== null) {
        recordMetric(MODULE, 'surfaceTemperatureC', res.surfaceTemperatureC, 'hardware');
      }
      logEvent(MODULE, 'queried thermometer sensor', {
        supported: res.isSupported,
        sensor: res.sensorName,
      });
    } catch (e: any) {
      const err = logError(MODULE, 'getThermometerReading failed', e);
      setError(err.message);
    }
  }, []);

  const setEmissivity = useCallback((val: number) => {
    const clamped = Math.max(0.1, Math.min(1.0, val));
    setEmissivityState(clamped);
    logEvent(MODULE, 'updated emissivity', { emissivity: clamped });
  }, []);

  const setMode = useCallback((m: ThermometerMode) => {
    setModeState(m);
    logEvent(MODULE, 'updated thermometer mode', { mode: m });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    isSupported: reading.isSupported,
    surfaceTemperatureC: reading.surfaceTemperatureC,
    surfaceTemperatureF: reading.surfaceTemperatureF,
    ambientTemperatureC: reading.ambientTemperatureC,
    emissivity,
    mode,
    error,
    source,
    setEmissivity,
    setMode,
    refresh,
  };
}

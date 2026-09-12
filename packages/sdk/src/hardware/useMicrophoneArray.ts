/**
 * @file useMicrophoneArray.ts
 * @description Acoustic array topology, polar pattern directivity, and beamforming controls
 * queried directly from Android AudioManager.
 *
 * Adheres to the Zero-Simulation Principle: values are empty and source is 'unavailable'
 * if the device lacks multi-mic array hardware or if the native module is absent.
 */

import { useState, useEffect, useCallback } from 'react';
import PixelNative, {
  type MicrophoneInfo,
  type MicrophoneDirectionality,
  type MicrophoneLocation,
} from '@pixelkit-labs/native';
import { logEvent, logError, recordMetric, type TelemetrySource } from '../core/observability';

const MODULE = 'useMicrophoneArray';

export type MicrophoneBeamDirection = 'user' | 'away' | 'external' | 'omni';

export interface MicrophoneArrayTelemetry {
  /** Array of hardware microphones detected on the device chassis. */
  microphones: MicrophoneInfo[];
  /** Current beam direction configured for the microphone array. */
  direction: MicrophoneBeamDirection;
  /** Acoustic field zoom ratio from 0.0 (wide) to 1.0 (narrow focus). */
  fieldZoom: number;
  /** Whether the hardware and OS support microphone array querying and beamforming. */
  isSupported: boolean;
  /** Error message if microphone array query or direction setting failed. */
  error: string | null;
  /** Provenance of the data: 'hardware' or 'unavailable'. */
  source: TelemetrySource;
  /** Directs acoustic beamforming towards the user, away, external, or omnidirectional. */
  setDirection: (direction: MicrophoneBeamDirection) => Promise<boolean>;
  /** Adjusts microphone field dimension / acoustic zoom (0.0 to 1.0). */
  setFieldZoom: (zoom: number) => Promise<boolean>;
  /** Re-queries the hardware microphone array. */
  refresh: () => void;
}

export function useMicrophoneArray(): MicrophoneArrayTelemetry {
  const [microphones, setMicrophones] = useState<MicrophoneInfo[]>([]);
  const [direction, setDirectionState] = useState<MicrophoneBeamDirection>('omni');
  const [fieldZoom, setFieldZoomState] = useState<number>(0.0);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const source: TelemetrySource = PixelNative && isSupported ? 'hardware' : 'unavailable';

  const refresh = useCallback(() => {
    if (!PixelNative) {
      setIsSupported(false);
      setError('PixelNative module unavailable');
      return;
    }

    try {
      const res = PixelNative.getMicrophoneArray();
      setIsSupported(res.isSupported);
      setMicrophones(res.microphones ?? []);
      setDirectionState((res.direction as MicrophoneBeamDirection) ?? 'omni');
      setFieldZoomState(res.fieldZoom ?? 0.0);
      setError(res.error ?? null);

      recordMetric(MODULE, 'microphoneCount', res.microphones?.length ?? 0, 'hardware');
      logEvent(MODULE, 'queried microphone array', {
        count: res.microphones?.length ?? 0,
        direction: res.direction,
      });
    } catch (e: any) {
      const err = logError(MODULE, 'getMicrophoneArray failed', e);
      setError(err.message);
      setIsSupported(false);
    }
  }, []);

  const setDirection = useCallback(
    async (dir: MicrophoneBeamDirection): Promise<boolean> => {
      if (!PixelNative) return false;
      try {
        const success = await PixelNative.setPreferredMicrophoneDirection(dir, fieldZoom);
        if (success) {
          setDirectionState(dir);
          logEvent(MODULE, 'updated beam direction', { direction: dir });
        }
        return success;
      } catch (e: any) {
        logError(MODULE, 'setPreferredMicrophoneDirection failed', e);
        return false;
      }
    },
    [fieldZoom]
  );

  const setFieldZoom = useCallback(
    async (zoom: number): Promise<boolean> => {
      if (!PixelNative) return false;
      const clamped = Math.max(0.0, Math.min(1.0, zoom));
      try {
        const success = await PixelNative.setPreferredMicrophoneDirection(direction, clamped);
        if (success) {
          setFieldZoomState(clamped);
          logEvent(MODULE, 'updated field zoom', { fieldZoom: clamped });
        }
        return success;
      } catch (e: any) {
        logError(MODULE, 'setFieldZoom failed', e);
        return false;
      }
    },
    [direction]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    microphones,
    direction,
    fieldZoom,
    isSupported,
    error,
    source,
    setDirection,
    setFieldZoom,
    refresh,
  };
}

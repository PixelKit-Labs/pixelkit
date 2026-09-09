/**
 * @file useSpatialAudio.ts
 * @description Android Spatializer and dynamic head tracking integration (API 32+).
 * Detects whether spatial audio processing is available for current routing, whether binaural /
 * transaural spatialization is enabled, and reports head tracker sensor availability (e.g. Pixel Buds Pro).
 * Nothing is simulated: reads directly from the Android `android.media.Spatializer` HAL subsystem.
 */

import { useCallback, useEffect, useState } from 'react';
import PixelNative, {
  type HeadTrackingMode,
  type SpatialAudioInfo,
} from '@pixelkit-labs/native';
import { logEvent, recordMetric, type TelemetrySource } from '../core/observability';

const MODULE = 'useSpatialAudio';

export { type HeadTrackingMode, type SpatialAudioInfo };

export interface SpatialAudioState {
  /** Whether the device platform supports the Android Spatializer API (API 32+) */
  isSupported: boolean;
  /** Whether spatial audio processing is available for the current audio routing path */
  isAvailable: boolean;
  /** Whether spatial audio is enabled in user system settings */
  isEnabled: boolean;
  /** Whether a dynamic head tracker sensor (e.g. Pixel Buds Pro) is currently active and reporting */
  hasHeadTracker: boolean;
  /** Active head tracking mode reported by the audio HAL ('unsupported' | 'disabled' | 'relative_world' | 'relative_device') */
  headTrackingMode: HeadTrackingMode;
  /** Level of immersive spatialization applied by the audio DSP (0: none, 1: multichannel, 2: other) */
  immersiveAudioLevel: number;
  /** Whether the device declares the feature:android.hardware.sensor.dynamic.head_tracker feature */
  hasDynamicHeadTrackerFeature: boolean;
  /** Latest error message if query failed */
  error: string | null;
  /** Telemetry provenance ('hardware' when read from device, 'unavailable' otherwise) */
  source: TelemetrySource;
  /** Manually re-reads spatial audio status from the system AudioManager */
  refresh: () => SpatialAudioInfo | null;
}

/**
 * Hook exposing Android Spatializer and dynamic head tracking telemetry.
 *
 * @example
 * ```typescript
 * const { isAvailable, isEnabled, hasHeadTracker, headTrackingMode } = useSpatialAudio();
 * ```
 */
export function useSpatialAudio(): SpatialAudioState {
  const [data, setData] = useState<SpatialAudioInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback((): SpatialAudioInfo | null => {
    if (!PixelNative) {
      logEvent(MODULE, 'native module absent; spatial audio unavailable', undefined, 'warn');
      return null;
    }
    try {
      const info = PixelNative.getSpatialAudioInfo();
      setData(info);
      if (info.error) {
        setError(info.error);
      } else {
        setError(null);
      }
      recordMetric(MODULE, 'isAvailable', info.isAvailable ? 1 : 0, info.isSupported ? 'hardware' : 'unavailable');
      recordMetric(MODULE, 'hasHeadTracker', info.hasHeadTracker ? 1 : 0, info.isSupported ? 'hardware' : 'unavailable');
      logEvent(MODULE, 'spatial audio queried', {
        isAvailable: info.isAvailable,
        isEnabled: info.isEnabled,
        hasHeadTracker: info.hasHeadTracker,
        headTrackingMode: info.headTrackingMode,
        level: info.immersiveAudioLevel,
      });
      return info;
    } catch (e: any) {
      const msg = e?.message ?? 'getSpatialAudioInfo failed';
      setError(msg);
      logEvent(MODULE, 'query error', { message: msg }, 'error');
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const source: TelemetrySource =
    PixelNative && data?.isSupported ? 'hardware' : 'unavailable';

  return {
    isSupported: data?.isSupported ?? false,
    isAvailable: data?.isAvailable ?? false,
    isEnabled: data?.isEnabled ?? false,
    hasHeadTracker: data?.hasHeadTracker ?? false,
    headTrackingMode: data?.headTrackingMode ?? 'unsupported',
    immersiveAudioLevel: data?.immersiveAudioLevel ?? 0,
    hasDynamicHeadTrackerFeature: data?.hasDynamicHeadTrackerFeature ?? false,
    error,
    source,
    refresh,
  };
}

/**
 * @file useCameraExtensions.ts
 * @description Real Google computational photography vendor extensions from Android Camera2
 * `CameraExtensionCharacteristics` (Night Sight, Ultra HDR / HDR+, Portrait Bokeh, Face Retouch / TrueTone).
 * Nothing is simulated: queries actual camera HAL capabilities on device.
 */

import { useCallback, useEffect, useState } from 'react';
import PixelNative, {
  type CameraExtensionInfo,
  type CameraExtensionsResult,
} from '@pixelkit-labs/native';
import { logEvent, recordMetric, type TelemetrySource } from '../core/observability';

const MODULE = 'useCameraExtensions';

/**
 * Hook exposing real CameraX / Camera2 computational photography vendor extensions.
 *
 * @example
 * ```typescript
 * const { available, hasNightSight, hasUltraHdr, hasPortraitBokeh, cameras } = useCameraExtensions();
 * ```
 */
export function useCameraExtensions() {
  const [data, setData] = useState<CameraExtensionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const source: TelemetrySource =
    PixelNative && data?.available ? 'hardware' : 'unavailable';

  const refresh = useCallback((): CameraExtensionsResult | null => {
    if (!PixelNative) {
      logEvent(MODULE, 'native module absent; camera extensions unavailable', undefined, 'warn');
      return null;
    }
    try {
      const res = PixelNative.getCameraExtensions();
      setData(res);
      recordMetric(MODULE, 'hasNightSight', res.hasNightSight, res.available ? 'hardware' : 'unavailable');
      recordMetric(MODULE, 'hasUltraHdr', res.hasUltraHdr, res.available ? 'hardware' : 'unavailable');
      recordMetric(MODULE, 'hasPortraitBokeh', res.hasPortraitBokeh, res.available ? 'hardware' : 'unavailable');
      logEvent(MODULE, 'queried extensions', {
        available: res.available,
        camerasCount: res.cameras.length,
        hasNightSight: res.hasNightSight,
        hasUltraHdr: res.hasUltraHdr,
      });
      return res;
    } catch (e: any) {
      const msg = e?.message ?? 'getCameraExtensions failed';
      setError(msg);
      logEvent(MODULE, 'query error', { message: msg }, 'error');
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    /** Whether CameraExtensionCharacteristics is supported and accessible on the device */
    available: data?.available ?? false,
    /** List of cameras and their supported vendor extension modes */
    cameras: data?.cameras ?? [],
    /** True if any back or front camera supports Google Night Sight / low light extension */
    hasNightSight: data?.hasNightSight ?? false,
    /** True if any camera supports Ultra HDR / HDR+ exposure stacking */
    hasUltraHdr: data?.hasUltraHdr ?? false,
    /** True if any camera supports hardware-assisted Portrait mode bokeh blur */
    hasPortraitBokeh: data?.hasPortraitBokeh ?? false,
    /** Manually re-read camera HAL extension state */
    refresh,
    /** Latest error message if HAL query failed */
    error,
    /** Telemetry provenance */
    source,
  };
}

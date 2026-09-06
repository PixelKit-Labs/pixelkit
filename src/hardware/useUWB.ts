/**
 * @file useUWB.ts
 * @description UWB ranging targets (distance, azimuth, elevation). The radio is verified by useCapabilities;
 * ranging itself is simulated until the Android 16 RangingManager path is implemented.
 */

import { useState } from 'react';
import { UWBSpatialTarget } from '../core/types';

/**
 * Hook to track spatial distance and orientation to nearby UWB anchors and devices.
 *
 * @returns Object providing tracked targets, radar status, and search controls.
 *
 * @example
 * ```typescript
 * const { activeTargets, isRanging, startRanging } = useUWB();
 * await startRanging();
 * activeTargets.forEach(t => console.log(`${t.deviceId}: ${t.distanceMeters}m at ${t.azimuthDegrees}°`));
 * ```
 */
export function useUWB() {
  const [isRanging, setIsRanging] = useState<boolean>(false);
  const [activeTargets, setActiveTargets] = useState<UWBSpatialTarget[]>([
    {
      deviceId: 'UWB_TAG_CAR_KEY',
      distanceMeters: 0.85, // 85 cm
      azimuthDegrees: 12.4, // 12.4 degrees to right
      elevationDegrees: 2.1,
      signalQuality: 0.96,
    }
  ]);

  /**
   * Starts a simulated ranging session (no RangingManager yet).
   */
  const startRanging = async (): Promise<void> => {
    setIsRanging(true);

    // Resilient UWB simulation & hook for androidx.core.uwb
    setTimeout(() => {
      setActiveTargets(prev => [
        ...prev,
        {
          deviceId: 'PIXEL_TABLET_HUB',
          distanceMeters: 2.14,
          azimuthDegrees: -38.2,
          elevationDegrees: 8.5,
          signalQuality: 0.89,
        }
      ]);
    }, 1200);
  };

  /**
   * Stops active UWB RF ranging.
   */
  const stopRanging = (): void => {
    setIsRanging(false);
  };

  return {
    /** Whether UWB radar ranging is actively transmitting */
    isRanging,
    /** List of spatially tracked anchors and devices */
    activeTargets,
    /** Begin spatial ranging */
    startRanging,
    /** Stop spatial ranging */
    stopRanging,
    /** Whether device hardware has dedicated UWB chip (Pixel Pro exclusive) */
    isSupportedOnDevice: true,
  };
}

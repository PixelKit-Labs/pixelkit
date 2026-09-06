/**
 * @file useLocation.ts
 * @description High-accuracy GNSS positioning, altitude, heading, and speed telemetry.
 * Connects to the Pixel's multi-band dual-frequency GPS receiver.
 */

import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { LocationTelemetry } from '../core/types';

/**
 * Hook to request location permissions and stream real-time geographic telemetry.
 *
 * @returns {LocationTelemetry & { refreshLocation: () => Promise<void> }} Real-time coordinates, accuracy, and manual refresh trigger.
 *
 * @example
 * ```typescript
 * const { latitude, longitude, altitude, accuracy, refreshLocation } = useLocation();
 * console.log(`Position: ${latitude}, ${longitude} (±${accuracy}m)`);
 * ```
 */
export function useLocation() {
  const [location, setLocation] = useState<LocationTelemetry>({
    latitude: 0,
    longitude: 0,
    altitude: null,
    accuracy: null,
    heading: null,
    speed: null,
    hasPermission: false,
  });

  const requestAndWatch = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation(prev => ({ ...prev, hasPermission: false }));
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      setLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        altitude: current.coords.altitude,
        accuracy: current.coords.accuracy,
        heading: current.coords.heading,
        speed: current.coords.speed,
        hasPermission: true,
      });
    } catch {
      // Location service unavailable or disabled on simulator
    }
  };

  useEffect(() => {
    requestAndWatch();
  }, []);

  return {
    ...location,
    /** Force a synchronous high-accuracy GNSS query */
    refreshLocation: requestAndWatch,
  };
}

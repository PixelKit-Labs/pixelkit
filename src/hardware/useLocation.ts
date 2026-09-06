import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationTelemetry {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  hasPermission: boolean;
}

/**
 * PixelForge Location Hook
 * Connects to the Pixel's multi-band GNSS / GPS for sub-meter positioning.
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
      // Location service unavailable or disabled
    }
  };

  useEffect(() => {
    requestAndWatch();
  }, []);

  return {
    ...location,
    refreshLocation: requestAndWatch,
  };
}

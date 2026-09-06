/**
 * @file useSensors.ts
 * @description Real-time 6-axis IMU, Barometer, Magnetometer, and Light Sensor hook.
 * Streams physical hardware telemetry with configurable sampling rates and hypsometric altitude calculation.
 */

import { useState, useEffect } from 'react';
import {
  Accelerometer,
  Gyroscope,
  Magnetometer,
  Barometer,
  LightSensor,
} from 'expo-sensors';
import { SensorTelemetry, Vector3D, BarometerData } from '../core/types';

const INITIAL_VECTOR: Vector3D = { x: 0, y: 0, z: 0 };
const SEA_LEVEL_PRESSURE = 1013.25; // Standard atmospheric pressure in hPa

/**
 * Hook to subscribe to and stream Google Pixel physical hardware sensors.
 *
 * @param updateIntervalMs Polling/streaming interval in milliseconds (default: 100ms = 10 Hz).
 *                         Lower values increase precision; higher values preserve battery.
 * @returns {SensorTelemetry} Real-time object containing accelerometer, gyroscope, magnetometer, barometer, and light.
 *
 * @example
 * ```typescript
 * const { accelerometer, gyroscope, barometer } = useSensors(50); // 20 Hz
 * console.log(`Current Altitude: ${barometer.relativeAltitude}m`);
 * ```
 */
export function useSensors(updateIntervalMs: number = 100): SensorTelemetry {
  const [accelerometer, setAccelerometer] = useState<Vector3D>(INITIAL_VECTOR);
  const [gyroscope, setGyroscope] = useState<Vector3D>(INITIAL_VECTOR);
  const [magnetometer, setMagnetometer] = useState<Vector3D>(INITIAL_VECTOR);
  const [barometer, setBarometer] = useState<BarometerData>({ pressure: 1013.25, relativeAltitude: 0 });
  const [lightLux, setLightLux] = useState<number | undefined>(undefined);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  useEffect(() => {
    let accelSub: { remove: () => void } | null = null;
    let gyroSub: { remove: () => void } | null = null;
    let magSub: { remove: () => void } | null = null;
    let barSub: { remove: () => void } | null = null;
    let lightSub: { remove: () => void } | null = null;

    const setupSensors = async () => {
      try {
        Accelerometer.setUpdateInterval(updateIntervalMs);
        Gyroscope.setUpdateInterval(updateIntervalMs);
        Magnetometer.setUpdateInterval(updateIntervalMs);
        Barometer.setUpdateInterval(updateIntervalMs);

        accelSub = Accelerometer.addListener((data) => {
          setAccelerometer({
            x: Number(data.x.toFixed(3)),
            y: Number(data.y.toFixed(3)),
            z: Number(data.z.toFixed(3)),
          });
        });

        gyroSub = Gyroscope.addListener((data) => {
          setGyroscope({
            x: Number(data.x.toFixed(3)),
            y: Number(data.y.toFixed(3)),
            z: Number(data.z.toFixed(3)),
          });
        });

        magSub = Magnetometer.addListener((data) => {
          setMagnetometer({
            x: Number(data.x.toFixed(1)),
            y: Number(data.y.toFixed(1)),
            z: Number(data.z.toFixed(1)),
          });
        });

        const isBarometerAvailable = await Barometer.isAvailableAsync().catch(() => false);
        if (isBarometerAvailable) {
          barSub = Barometer.addListener(({ pressure }) => {
            // Hypsometric formula for international barometric altitude estimation
            const altitude = 44330 * (1 - Math.pow(pressure / SEA_LEVEL_PRESSURE, 0.1903));
            setBarometer({
              pressure: Number(pressure.toFixed(2)),
              relativeAltitude: Number(altitude.toFixed(1)),
            });
          });
        }

        const isLightAvailable = await LightSensor.isAvailableAsync().catch(() => false);
        if (isLightAvailable) {
          LightSensor.setUpdateInterval(updateIntervalMs * 2);
          lightSub = LightSensor.addListener(({ illuminance }) => {
            // Keep one decimal: a dark room legitimately reads 0.4–2 lux and must not display as 0.
            setLightLux(Number(illuminance.toFixed(1)));
          });
        }
      } catch {
        setIsAvailable(false);
      }
    };

    setupSensors();

    return () => {
      accelSub?.remove();
      gyroSub?.remove();
      magSub?.remove();
      barSub?.remove();
      lightSub?.remove();
    };
  }, [updateIntervalMs]);

  return {
    accelerometer,
    gyroscope,
    magnetometer,
    barometer,
    lightLux,
    isAvailable,
  };
}

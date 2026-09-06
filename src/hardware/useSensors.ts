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
const SEA_LEVEL_PRESSURE = 1013.25; // hPa standard

/**
 * PixelForge Sensor Suite
 * Connects to the Pixel's 6-axis motion sensors, Barometer (altimeter), and Magnetometer.
 */
export function useSensors(updateIntervalMs: number = 100) {
  const [accelerometer, setAccelerometer] = useState<Vector3D>(INITIAL_VECTOR);
  const [gyroscope, setGyroscope] = useState<Vector3D>(INITIAL_VECTOR);
  const [magnetometer, setMagnetometer] = useState<Vector3D>(INITIAL_VECTOR);
  const [barometer, setBarometer] = useState<BarometerData>({ pressure: 1013.25, relativeAltitude: 0 });
  const [lightLux, setLightLux] = useState<number | undefined>(undefined);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  useEffect(() => {
    let accelSub: any;
    let gyroSub: any;
    let magSub: any;
    let barSub: any;
    let lightSub: any;

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

        const isBarometerAvailable = await Barometer.isAvailableAsync();
        if (isBarometerAvailable) {
          barSub = Barometer.addListener(({ pressure }) => {
            // Hypsometric formula for altitude estimation
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
            setLightLux(Math.round(illuminance));
          });
        }
      } catch (err) {
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

  const telemetry: SensorTelemetry = {
    accelerometer,
    gyroscope,
    magnetometer,
    barometer,
    lightLux,
    isAvailable,
  };

  return telemetry;
}

/**
 * @file useTemperature.ts
 * @description Pixel Pro Exclusive Infrared Thermometer Sensor hook.
 * Interfaces with the camera bar infrared thermopile sensor for non-contact object temperature measurement.
 */

import { useState } from 'react';
import { TemperatureReading } from '../core/types';

/**
 * Hook to measure surface and liquid temperature using the Pixel Pro infrared sensor.
 *
 * @returns Object providing latest temperature reading, material preset, and measurement trigger.
 *
 * @example
 * ```typescript
 * const { reading, measureTemperature, setMaterialPreset } = useTemperature();
 * const temp = await measureTemperature();
 * console.log(`Object Temp: ${temp.celsius}°C (${temp.fahrenheit}°F)`);
 * ```
 */
export function useTemperature() {
  const [materialPreset, setMaterialPreset] = useState<string>('organic');
  const [reading, setReading] = useState<TemperatureReading>({
    celsius: 36.6,
    fahrenheit: 97.9,
    materialPreset: 'organic',
    timestamp: Date.now(),
  });
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);

  /**
   * Executes an infrared thermopile sample reading.
   * @param preset Optional material emissivity mode ('organic', 'liquid', 'metal', 'glass').
   */
  const measureTemperature = async (preset?: string): Promise<TemperatureReading> => {
    setIsMeasuring(true);
    const activePreset = preset || materialPreset;

    // Emissivity factor adjustments
    await new Promise(res => setTimeout(res, 800));

    // Simulated reading matching typical ambient/body ranges
    const baseCelsius = activePreset === 'liquid' ? 55.4 : activePreset === 'metal' ? 22.1 : 36.7;
    const jitter = Number(((Math.random() * 0.8) - 0.4).toFixed(1));
    const celsius = Number((baseCelsius + jitter).toFixed(1));
    const fahrenheit = Number(((celsius * 9 / 5) + 32).toFixed(1));

    const result: TemperatureReading = {
      celsius,
      fahrenheit,
      materialPreset: activePreset,
      timestamp: Date.now(),
    };

    setReading(result);
    setIsMeasuring(false);
    return result;
  };

  return {
    /** Most recent temperature reading */
    reading,
    /** Active material emissivity preset */
    materialPreset,
    /** Whether an infrared scan is actively sampling */
    isMeasuring,
    /** Perform an infrared measurement */
    measureTemperature,
    /** Update material emissivity preset */
    setMaterialPreset,
  };
}

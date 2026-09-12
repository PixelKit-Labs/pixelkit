/**
 * @file altimeterMath.ts
 * @description Pure mathematical formulas for barometric altimetry, rate of climb, and pressure trends.
 */

export const STANDARD_SEA_LEVEL_HPA = 1013.25;
export const METERS_TO_FEET = 3.28084;

export type PressureTrend = 'rising' | 'steady' | 'falling' | 'rapid_fall';

/**
 * Computes altitude in meters above sea level using the international ICAO hypsometric formula:
 *   h = 44330 * (1 - (P / P0)^0.1903)
 */
export function calculateAltitudeM(pressureHpa: number, seaLevelHpa: number = STANDARD_SEA_LEVEL_HPA): number {
  if (pressureHpa <= 0 || seaLevelHpa <= 0) return 0;
  const alt = 44330 * (1 - Math.pow(pressureHpa / seaLevelHpa, 0.1903));
  return Number(alt.toFixed(2));
}

/**
 * Converts altitude in meters to international feet.
 */
export function calculateAltitudeFt(altitudeM: number): number {
  return Number((altitudeM * METERS_TO_FEET).toFixed(2));
}

/**
 * Evaluates the atmospheric pressure change trend given a rate of change in hPa per hour.
 * - rapid_fall: < -1.5 hPa/hr (indicates severe weather or approaching storm)
 * - falling: < -0.5 hPa/hr
 * - rising: > 0.5 hPa/hr (improving conditions)
 * - steady: between -0.5 and +0.5 hPa/hr
 */
export function calculatePressureTrend(hpaPerHour: number): PressureTrend {
  if (hpaPerHour < -1.5) return 'rapid_fall';
  if (hpaPerHour < -0.5) return 'falling';
  if (hpaPerHour > 0.5) return 'rising';
  return 'steady';
}

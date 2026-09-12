/**
 * @file altimeter.test.ts
 * @description Unit tests for barometric altimetry formulas, velocity, and pressure trends.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  STANDARD_SEA_LEVEL_HPA,
  calculateAltitudeM,
  calculateAltitudeFt,
  calculatePressureTrend,
} from '../packages/sdk/src/core/altimeterMath.ts';

describe('useAltimeter: Barometric Calculations', () => {
  test('Standard sea level pressure yields 0m and 0ft altitude', () => {
    const altM = calculateAltitudeM(1013.25, 1013.25);
    const altFt = calculateAltitudeFt(altM);
    assert.equal(altM, 0);
    assert.equal(altFt, 0);
  });

  test('Standard pressure at 1000m elevation approximates ~898.7 hPa', () => {
    const altM = calculateAltitudeM(898.7, 1013.25);
    assert.ok(Math.abs(altM - 1000) < 10, `Expected ~1000m, got ${altM}`);
  });

  test('High elevation (Mount Everest ~300 hPa) calculates ~9000m', () => {
    const altM = calculateAltitudeM(300, 1013.25);
    assert.ok(altM > 8500 && altM < 9500, `Expected 8500-9500m, got ${altM}`);
    const altFt = calculateAltitudeFt(altM);
    assert.ok(altFt > 28000 && altFt < 31000, `Expected ~29000ft, got ${altFt}`);
  });

  test('QNH calibration offsets altitude baseline accurately', () => {
    const localPressure = 1000.0;
    const uncalibrated = calculateAltitudeM(localPressure, STANDARD_SEA_LEVEL_HPA);
    assert.ok(uncalibrated > 100);

    const calibrated = calculateAltitudeM(localPressure, 1000.0);
    assert.equal(calibrated, 0);
  });

  test('Pressure trends classify severe storm fronts and rising pressure', () => {
    assert.equal(calculatePressureTrend(-2.0), 'rapid_fall');
    assert.equal(calculatePressureTrend(-0.8), 'falling');
    assert.equal(calculatePressureTrend(0.0), 'steady');
    assert.equal(calculatePressureTrend(0.2), 'steady');
    assert.equal(calculatePressureTrend(0.9), 'rising');
  });
});

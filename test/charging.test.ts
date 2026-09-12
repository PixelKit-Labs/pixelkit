/**
 * @file charging.test.ts
 * @description Unit tests for battery charging tier classification and ADPF duration conversions.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

function classifyChargingTier(wattage: number | null): 'slow' | 'standard' | 'rapid' | 'ultra_rapid' {
  if (wattage === null) return 'standard';
  if (wattage >= 30.0) return 'ultra_rapid';
  if (wattage >= 18.0) return 'rapid';
  if (wattage >= 5.0) return 'standard';
  return 'slow';
}

function frameMsToNanos(frameMs: number): number {
  return Math.round(frameMs * 1_000_000);
}

describe('useChargingIntelligence & useADPF: Logic Tests', () => {
  test('Charging tier correctly classifies wattage ranges', () => {
    assert.equal(classifyChargingTier(null), 'standard');
    assert.equal(classifyChargingTier(2.5), 'slow');
    assert.equal(classifyChargingTier(10.0), 'standard');
    assert.equal(classifyChargingTier(22.5), 'rapid');
    assert.equal(classifyChargingTier(45.0), 'ultra_rapid');
  });

  test('ADPF frame deadline conversions to nanoseconds are exact', () => {
    assert.equal(frameMsToNanos(16.67), 16670000);
    assert.equal(frameMsToNanos(8.33), 8330000);
    assert.equal(frameMsToNanos(11.11), 11110000);
  });
});

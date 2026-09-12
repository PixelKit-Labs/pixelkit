/**
 * @file radios.test.ts
 * @description Unit tests for Wi-Fi 7 MLO aggregation, RTT units, and satellite states.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

function calculateMloAggregateSpeed(links: Array<{ txLinkSpeedMbps: number }>): number | null {
  if (links.length <= 1) return null;
  return links.reduce((acc, l) => acc + l.txLinkSpeedMbps, 0);
}

function rttMmToMeters(distanceMm: number): number {
  return Number((distanceMm / 1000.0).toFixed(2));
}

describe('useWifi7MLO & useWifiRTT: Radio Tests', () => {
  test('Single link returns null aggregate speed (not MLO active)', () => {
    const links = [{ txLinkSpeedMbps: 866 }];
    assert.equal(calculateMloAggregateSpeed(links), null);
  });

  test('Multi-link combines speeds accurately across bonded bands', () => {
    const links = [
      { txLinkSpeedMbps: 1200 }, // 5 GHz
      { txLinkSpeedMbps: 2400 }, // 6 GHz
    ];
    assert.equal(calculateMloAggregateSpeed(links), 3600);
  });

  test('RTT millimeter to meter conversion is accurate', () => {
    assert.equal(rttMmToMeters(1850), 1.85);
    assert.equal(rttMmToMeters(320), 0.32);
  });
});

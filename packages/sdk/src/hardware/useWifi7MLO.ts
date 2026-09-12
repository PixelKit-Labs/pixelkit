/**
 * @file useWifi7MLO.ts
 * @description Wi-Fi 7 (802.11be) Multi-Link Operation (MLO) link bonding and 320 MHz channel telemetry.
 *
 * Adheres to the Zero-Simulation Principle: isMloActive: false, links: [],
 * and aggregateSpeedMbps: null when connected to Wi-Fi 6 or earlier.
 */

import { useState, useEffect, useCallback } from 'react';
import PixelNative, { type Wifi7MloResult, type MloLinkInfo } from '@pixelkit-labs/native';
import { logEvent, logError, recordMetric, type TelemetrySource } from '../core/observability';

const MODULE = 'useWifi7MLO';
export { type MloLinkInfo };

export interface Wifi7MloTelemetry {
  /** Whether the device hardware and current Wi-Fi network support 802.11be MLO. */
  isSupported: boolean;
  /** Whether multiple simultaneous band links (e.g. 5GHz + 6GHz) are actively bonded. */
  isMloActive: boolean;
  /** Array of affiliated physical radio links with frequency band, signal, and link speeds. */
  links: MloLinkInfo[];
  /** Combined theoretical PHY data transfer rate across all bonded links in Mbps, or null. */
  aggregateSpeedMbps: number | null;
  /** Error message if Wi-Fi link inspection failed. */
  error: string | null;
  /** Provenance of the data: 'hardware' or 'unavailable'. */
  source: TelemetrySource;
  /** Queries the Wi-Fi subsystem for updated link telemetry. */
  refresh: () => void;
}

export function useWifi7MLO(): Wifi7MloTelemetry {
  const [data, setData] = useState<Wifi7MloResult>({
    isSupported: false,
    isMloActive: false,
    links: [],
    aggregateSpeedMbps: null,
    error: null,
  });

  const [error, setError] = useState<string | null>(null);

  const source: TelemetrySource =
    PixelNative && data.isSupported ? 'hardware' : 'unavailable';

  const refresh = useCallback(() => {
    if (!PixelNative) {
      setData({
        isSupported: false,
        isMloActive: false,
        links: [],
        aggregateSpeedMbps: null,
        error: 'PixelNative module unavailable',
      });
      setError('PixelNative module unavailable');
      return;
    }

    try {
      const res = PixelNative.getWifi7MloInfo();
      setData(res);
      setError(res.error ?? null);

      if (res.aggregateSpeedMbps !== null) {
        recordMetric(MODULE, 'aggregateSpeedMbps', res.aggregateSpeedMbps, 'hardware');
      }
      recordMetric(MODULE, 'mloLinksCount', res.links.length, 'hardware');

      logEvent(MODULE, 'queried wifi7 mlo info', {
        active: res.isMloActive,
        links: res.links.length,
        speed: res.aggregateSpeedMbps,
      });
    } catch (e: any) {
      const err = logError(MODULE, 'getWifi7MloInfo failed', e);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    isSupported: data.isSupported,
    isMloActive: data.isMloActive,
    links: data.links,
    aggregateSpeedMbps: data.aggregateSpeedMbps,
    error,
    source,
    refresh,
  };
}

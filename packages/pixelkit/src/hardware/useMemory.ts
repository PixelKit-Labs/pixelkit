/**
 * @file useMemory.ts
 * @description Real system and app memory telemetry from `ActivityManager.getMemoryInfo` (total,
 * available, low-memory threshold and flag), the Java heap (`Runtime`) and the native heap
 * (`Debug.getNativeHeapAllocatedSize`). "Purge" requests a garbage collection and re-reads; it does
 * not pretend to free system RAM.
 */

import { useCallback, useEffect, useState } from 'react';
import PixelNative, { type MemoryInfo } from '@pixelkit-labs/native';
import { logEvent, recordMetric, type TelemetrySource } from '../core/observability';

const MODULE = 'useMemory';
const POLL_MS = 2000;
const MB = 1024 * 1024;

/**
 * Hook exposing real memory telemetry.
 *
 * @example
 * ```typescript
 * const { totalRAMMB, usedRAMMB, freeRAMMB, isLowMemory, appJavaHeapMB, purgeCaches } = useMemory();
 * ```
 */
export function useMemory() {
  const [mem, setMem] = useState<MemoryInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const source: TelemetrySource = PixelNative ? 'hardware' : 'unavailable';

  useEffect(() => {
    const native = PixelNative;
    if (!native) { logEvent(MODULE, 'native module absent; memory telemetry unavailable', undefined, 'warn'); return; }
    const read = () => {
      try {
        const m = native.getMemoryInfo();
        setMem(m);
        recordMetric(MODULE, 'availableMB', Math.round(m.availableBytes / MB), 'hardware');
        recordMetric(MODULE, 'isLowMemory', m.isLowMemory, 'hardware');
      } catch (e: any) { setError(e?.message ?? 'getMemoryInfo error');
      logEvent(MODULE, 'getMemoryInfo error', { message: e?.message }, 'error'); }
    };
    read();
    const t = setInterval(read, POLL_MS);
    return () => clearInterval(t);
  }, []);

  /** Requests a GC and re-reads. Frees this app's garbage only. */
  const purgeCaches = useCallback((): void => {
    if (!PixelNative) return;
    try {
      const before = mem?.appJavaHeapUsedBytes ?? 0;
      const m = PixelNative.requestGc();
      setMem(m);
      logEvent(MODULE, 'gc', { freedMB: Number(((before - m.appJavaHeapUsedBytes) / MB).toFixed(1)) });
    } catch (e: any) { setError(e?.message ?? 'requestGc error');
      logEvent(MODULE, 'requestGc error', { message: e?.message }, 'error'); }
  }, [mem]);

  const totalRAMMB = mem ? Math.round(mem.totalBytes / MB) : 0;
  const freeRAMMB = mem ? Math.round(mem.availableBytes / MB) : 0;

  return {
    totalRAMMB,
    freeRAMMB,
    /** total - available, as the kernel reports it (includes caches the system can reclaim) */
    usedRAMMB: mem ? totalRAMMB - freeRAMMB : 0,
    /** Kernel low-memory flag (available below threshold) */
    isLowMemory: mem?.isLowMemory ?? false,
    lowMemoryThresholdMB: mem ? Math.round(mem.lowMemoryThresholdBytes / MB) : 0,
    /** This app's Java heap in use / max */
    appJavaHeapMB: mem ? Number((mem.appJavaHeapUsedBytes / MB).toFixed(1)) : 0,
    appJavaHeapMaxMB: mem ? Math.round(mem.appJavaHeapMaxBytes / MB) : 0,
    /** This app's native heap (Hermes, images, JSI) */
    appNativeHeapMB: mem ? Number((mem.appNativeHeapBytes / MB).toFixed(1)) : 0,
    purgeCaches,
    /** Latest failure message, or null. Failures are also logged and counted. */
    error,
    /** Telemetry provenance */
    source,
  };
}

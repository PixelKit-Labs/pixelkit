/**
 * @file observability.ts
 * @description Lightweight observability layer for PixelForge telemetry.
 * Every hook tags each reading with a TelemetrySource so the UI, docs, and logs can always answer
 * "is this number real?". Events are kept in a ring buffer for the on-device debug panel and echoed
 * to `console.log` with a stable prefix so they are greppable via `adb logcat -s ReactNativeJS`.
 */

import { useEffect, useState } from 'react';

/** Provenance of a telemetry value. `simulated` must never reach production UI without a label. */
export type TelemetrySource = 'hardware' | 'derived' | 'simulated' | 'unavailable';

export interface TelemetryEvent {
  ts: number;
  module: string;
  event: string;
  data?: Record<string, unknown>;
  level: 'info' | 'warn' | 'error';
}

export interface MetricRecord {
  module: string;
  metric: string;
  value: unknown;
  source: TelemetrySource;
  ts: number;
}

const LOG_PREFIX = '[PixelForge]';
const MAX_EVENTS = 400;

const events: TelemetryEvent[] = [];
const metrics = new Map<string, MetricRecord>();
const listeners = new Set<() => void>();
let notifyScheduled = false;

function notify() {
  if (notifyScheduled) return;
  notifyScheduled = true;
  setTimeout(() => {
    notifyScheduled = false;
    listeners.forEach(l => l());
  }, 250); // ≤4 Hz UI updates
}

/** Record a lifecycle or diagnostic event. Always logged to the console with the PixelForge prefix. */
export function logEvent(module: string, event: string, data?: Record<string, unknown>, level: TelemetryEvent['level'] = 'info'): void {
  const e: TelemetryEvent = { ts: Date.now(), module, event, data, level };
  events.push(e);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
  const line = `${LOG_PREFIX} ${module}: ${event}${data ? ' ' + safeJson(data) : ''}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
  notify();
}

/** Record the latest value of a metric with its provenance. Not logged per sample (too chatty); visible in the debug panel. */
export function recordMetric(module: string, metric: string, value: unknown, source: TelemetrySource): void {
  metrics.set(`${module}.${metric}`, { module, metric, value, source, ts: Date.now() });
  notify();
}

/** Snapshot helpers for non-React consumers (tests, agents). */
export function getRecentEvents(): TelemetryEvent[] { return events.slice(); }
export function getMetrics(): MetricRecord[] { return [...metrics.values()]; }

/** Summarise provenance per module: which sources each module currently reports. */
export function getSourceSummary(): Record<string, TelemetrySource[]> {
  const out: Record<string, Set<TelemetrySource>> = {};
  for (const m of metrics.values()) (out[m.module] ??= new Set()).add(m.source);
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v]]));
}

/** React hook: live view of recent events and latest metrics, throttled to ≤4 Hz. */
export function useObservability() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force(n => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return { events: getRecentEvents(), metrics: getMetrics(), sources: getSourceSummary() };
}

function safeJson(v: unknown): string {
  try { return JSON.stringify(v); } catch { return String(v); }
}

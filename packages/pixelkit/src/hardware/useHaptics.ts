/**
 * @file useHaptics.ts
 * @description Linear Resonant Actuator control. Standard patterns use `expo-haptics`. On top of that
 * the PixelNative module exposes the vibrator's real capabilities (amplitude control, resonant
 * frequency, supported primitives) and Android 16+ envelope effects (`BasicEnvelopeBuilder`), which
 * this Pixel 11 Pro supports (PWLE v2). Envelopes are how "Gemini thinking" ramps and HiLight-synced
 * pulses are rendered tactilely.
 */

import { useCallback, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import PixelNative, { type EnvelopePoint, type HapticsInfo, type PrimitiveStep } from 'pixel-native';
import { logEvent, type TelemetrySource, noteExpected } from '../core/observability';
import { HapticType } from '../core/types';

const MODULE = 'useHaptics';

/** Preset envelopes (intensity 0..1, sharpness 0..1, duration ms). Every envelope must end at intensity 0. */
export const HapticEnvelopes = {
  /** Slow swell then release: "Gemini is thinking" */
  thinkingRamp: [
    { intensity: 0.35, sharpness: 0.2, durationMs: 220 },
    { intensity: 0.7, sharpness: 0.4, durationMs: 260 },
    { intensity: 0.0, sharpness: 0.3, durationMs: 180 },
  ] as EnvelopePoint[],
  /** Two crisp pulses: "response ready" */
  doublePulse: [
    { intensity: 0.9, sharpness: 0.9, durationMs: 40 },
    { intensity: 0.0, sharpness: 0.9, durationMs: 60 },
    { intensity: 0.9, sharpness: 0.9, durationMs: 40 },
    { intensity: 0.0, sharpness: 0.9, durationMs: 40 },
  ] as EnvelopePoint[],
  /** Bouncing spring from the Android haptics guide */
  spring: [
    { intensity: 1.0, sharpness: 1.0, durationMs: 60 },
    { intensity: 0.2, sharpness: 0.6, durationMs: 120 },
    { intensity: 0.6, sharpness: 0.8, durationMs: 60 },
    { intensity: 0.0, sharpness: 0.5, durationMs: 100 },
  ] as EnvelopePoint[],
};

/** Vibrator capabilities never change at runtime; read once per app, not once per button. */
let cachedInfo: HapticsInfo | null | undefined;
function readHapticsInfo(): HapticsInfo | null {
  if (cachedInfo !== undefined) return cachedInfo;
  if (!PixelNative) { cachedInfo = null; return null; }
  try {
    cachedInfo = PixelNative.getHapticsInfo();
    logEvent(MODULE, 'vibrator', cachedInfo as unknown as Record<string, unknown>);
  } catch (e: any) {
    cachedInfo = null;
    logEvent(MODULE, 'getHapticsInfo error', { message: e?.message }, 'warn');
  }
  return cachedInfo;
}

export function useHaptics() {
  const [info, setInfo] = useState<HapticsInfo | null>(() => cachedInfo ?? null);
  const source: TelemetrySource = Platform.OS === 'web' ? 'unavailable' : 'hardware';

  useEffect(() => {
    if (cachedInfo === undefined) setInfo(readHapticsInfo());
  }, []);

  const triggerHaptic = useCallback(async (type: HapticType = 'light'): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      switch (type) {
        case 'selection': await Haptics.selectionAsync(); break;
        case 'light': await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
        case 'medium': await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
        case 'heavy': await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
        case 'success': await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
        case 'warning': await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break;
        case 'error': await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
      }
    } catch (e: any) { logEvent(MODULE, 'haptic error', { type, message: e?.message }, 'warn'); }
  }, []);

  /** Android 16+ envelope effect. Returns false (and logs) when unsupported. */
  const playEnvelope = useCallback((points: EnvelopePoint[], initialSharpness?: number): boolean => {
    if (!PixelNative || !info?.envelopeEffectsSupported) return false;
    try { return PixelNative.playEnvelope(points, initialSharpness ?? null); }
    catch (e: any) { logEvent(MODULE, 'playEnvelope error', { message: e?.message }, 'warn'); return false; }
  }, [info]);

  /** Android 11+ primitive composition (CLICK, THUD, SPIN, QUICK_RISE, SLOW_RISE, QUICK_FALL, TICK, LOW_TICK). */
  const playPrimitives = useCallback((steps: PrimitiveStep[]): boolean => {
    if (!PixelNative) return false;
    try { return PixelNative.playPrimitives(steps); }
    catch (e: any) { logEvent(MODULE, 'playPrimitives error', { message: e?.message }, 'warn'); return false; }
  }, []);

  const cancel = useCallback(() => { try { PixelNative?.cancelVibration(); } catch { noteExpected(MODULE, 'vibrator already idle'); } }, []);

  return {
    triggerHaptic,
    selection: () => triggerHaptic('selection'),
    light: () => triggerHaptic('light'),
    medium: () => triggerHaptic('medium'),
    heavy: () => triggerHaptic('heavy'),
    success: () => triggerHaptic('success'),
    warning: () => triggerHaptic('warning'),
    error: () => triggerHaptic('error'),
    playEnvelope,
    playPrimitives,
    cancel,
    /** Real vibrator capabilities (null until read or when native module absent) */
    hasAmplitudeControl: info?.hasAmplitudeControl ?? null,
    envelopeSupported: info?.envelopeEffectsSupported ?? false,
    resonantFrequencyHz: info?.resonantFrequencyHz ?? null,
    supportedPrimitives: info?.supportedPrimitives ?? [],
    source,
  };
}

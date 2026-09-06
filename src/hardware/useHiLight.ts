/**
 * @file useHiLight.ts
 * @description Hardware controller for the Pixel 11 Pro "HiLight" rear camera bar notification LED ring.
 * Replaces traditional thermopiles with a multi-color glanceable notification and AI status ring.
 * Supports dynamic breathing, Gemini thinking pulses, and face-down contact alert patterns.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { HardwareAvailability } from '../core/capabilities';
import { useCapabilities } from './useCapabilities';

export type HiLightMode =
  | 'off'
  | 'glow'
  | 'breathing'
  | 'pulse'
  | 'gemini_thinking'
  | 'incoming_call'
  | 'notification';

export interface HiLightState {
  /**
   * 'simulated' on Pixel 11 Pro / Pro XL / Pro Fold: the LED array exists but Google exposes no
   * third-party API, so state is mirrored on-screen. 'unsupported' on every other device.
   */
  availability: HardwareAvailability;
  /** True when the device physically has the HiLight LED array */
  isHardwareSupported: boolean;
  /** Whether the HiLight LED ring is (virtually) illuminated */
  isActive: boolean;
  /** Current RGB hex color displayed by the HiLight ring */
  currentColor: string;
  /** Active illumination animation pattern */
  mode: HiLightMode;
  /** Brightness level normalized from 0.0 to 1.0 */
  brightness: number;
  /** Whether the phone is placed face-down (glanceable mode active) */
  isFaceDownMode: boolean;
  /** Set custom color for the ring */
  setColor: (hexColor: string) => void;
  /** Change the active lighting pattern */
  setMode: (mode: HiLightMode) => void;
  /** Set LED ring brightness */
  setBrightness: (level: number) => void;
  /** Trigger signature Google Gemini AI thinking pulse animation */
  triggerGeminiPulse: (durationMs?: number) => void;
  /** Trigger custom color alert for favorite contact or event */
  triggerContactAlert: (hexColor: string, durationMs?: number) => void;
  /** Turn off the HiLight ring completely */
  turnOff: () => void;
  /** Toggle HiLight on/off */
  toggle: () => void;
}

const GEMINI_CYAN = '#00E5FF';
const GOOGLE_BLUE = '#8AB4F8';

/**
 * Pixel 11 Pro Hardware Hook for the rear camera bar "HiLight" multi-color LED ring.
 *
 * @example
 * ```typescript
 * const hilight = useHiLight();
 * // Trigger cyan pulse when Gemini is generating tokens
 * hilight.triggerGeminiPulse(3000);
 * ```
 */
export function useHiLight(): HiLightState {
  const { hasHiLight } = useCapabilities();
  const availability: HardwareAvailability = hasHiLight ? 'simulated' : 'unsupported';
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentColor, setCurrentColor] = useState<string>(GEMINI_CYAN);
  const [mode, setModeState] = useState<HiLightMode>('off');
  const [brightness, setBrightnessState] = useState<number>(0.85);
  const [isFaceDownMode, setIsFaceDownMode] = useState<boolean>(true);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const setColor = useCallback((hexColor: string) => {
    setCurrentColor(hexColor);
    if (!isActive) {
      setIsActive(true);
      if (mode === 'off') setModeState('glow');
    }
  }, [isActive, mode]);

  const setMode = useCallback((newMode: HiLightMode) => {
    setModeState(newMode);
    setIsActive(newMode !== 'off');
  }, []);

  const setBrightness = useCallback((level: number) => {
    setBrightnessState(Math.max(0.0, Math.min(1.0, level)));
  }, []);

  const triggerGeminiPulse = useCallback((durationMs: number = 4000) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentColor(GEMINI_CYAN);
    setModeState('gemini_thinking');
    setIsActive(true);

    timerRef.current = setTimeout(() => {
      setModeState('off');
      setIsActive(false);
    }, durationMs);
  }, []);

  const triggerContactAlert = useCallback((hexColor: string, durationMs: number = 5000) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentColor(hexColor);
    setModeState('incoming_call');
    setIsActive(true);

    timerRef.current = setTimeout(() => {
      setModeState('off');
      setIsActive(false);
    }, durationMs);
  }, []);

  const turnOff = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setModeState('off');
    setIsActive(false);
  }, []);

  const toggle = useCallback(() => {
    if (isActive) {
      turnOff();
    } else {
      setIsActive(true);
      setCurrentColor(GOOGLE_BLUE);
      setModeState('glow');
    }
  }, [isActive, turnOff]);

  return {
    availability,
    isHardwareSupported: hasHiLight,
    isActive,
    currentColor,
    mode,
    brightness,
    isFaceDownMode,
    setColor,
    setMode,
    setBrightness,
    triggerGeminiPulse,
    triggerContactAlert,
    turnOff,
    toggle,
  };
}

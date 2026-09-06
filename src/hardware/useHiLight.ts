/**
 * @file useHiLight.ts
 * @description State model for the Pixel 11 Pro HiLight LED array.
 * The physical device features eight RGB LEDs around the camera flash, but Android restricts
 * `android.permission.CONTROL_DEVICE_LIGHTS` to signature/system apps with no public third-party API.
 * This hook maintains the intended state (glow, pulse, breathing, notification, Gemini thinking, incoming call)
 * and exposes an honest `availability: 'simulated'` and `source: 'simulated'` on supported hardware,
 * mirrored on-screen and through the linear resonant actuator (LRA) haptics.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { HardwareAvailability } from '../core/capabilities';
import { useCapabilities } from './useCapabilities';
import type { TelemetrySource } from '../core/observability';

export type HiLightMode =
  | 'off'
  | 'glow'
  | 'breathing'
  | 'pulse'
  | 'gemini_thinking'
  | 'incoming_call'
  | 'notification';

export interface HiLightState {
  /** 'simulated' on Pixel 11 Pro-class devices; 'unsupported' on devices without the physical array */
  availability: HardwareAvailability;
  /** True when the device physically has the HiLight LED array */
  isHardwareSupported: boolean;
  /** Telemetry provenance: 'simulated' for on-screen mirror, 'unavailable' when no hardware */
  source: TelemetrySource;
  /** Whether the HiLight ring is virtually illuminated */
  isActive: boolean;
  /** Current RGB hex colour displayed by the ring */
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
  /** Show the Gemini-thinking pulse pattern */
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
  const source: TelemetrySource = hasHiLight ? 'simulated' : 'unavailable';
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentColor, setCurrentColor] = useState<string>(GEMINI_CYAN);
  const [mode, setModeState] = useState<HiLightMode>('off');
  const [brightness, setBrightnessState] = useState<number>(0.85);
  const [isFaceDownMode] = useState<boolean>(true);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    source,
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

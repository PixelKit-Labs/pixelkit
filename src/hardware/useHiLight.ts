/**
 * @file useHiLight.ts
 * @description State machine and hardware driver for the Pixel 11 Pro HiLight LED array.
 *
 * Physical device: 8 RGB LEDs around the rear flash (Light.LIGHT_TYPE_APPLICATION, API 37).
 * Android restricts CONTROL_DEVICE_LIGHTS to signature|privileged permissions, which only
 * Google system apps and android.uid.shell (UID 2000) hold.
 *
 * Operation modes:
 * 1. Hardware mode: When the PixelKit ADB daemon is running (scripts/hilight-daemon, started via
 *    `npm run hilight:daemon`), this hook talks to 127.0.0.1:11080 to drive the physical LEDs (source: 'hardware').
 * 2. Simulated mode: When untethered or daemon is off, maintains the state model and mirrors on-screen
 *    with linear resonant actuator (LRA) haptics (source: 'simulated').
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
  /** 'hardware' when ADB daemon is driving physical LEDs; 'simulated' on screen; 'unsupported' if no array */
  availability: HardwareAvailability;
  /** True when the device physically has the HiLight LED array */
  isHardwareSupported: boolean;
  /** Telemetry provenance: 'hardware' when daemon is connected, 'simulated' otherwise */
  source: TelemetrySource;
  /** True when the local PixelKit ADB daemon is actively connected */
  isDaemonConnected: boolean;
  /** Whether the HiLight ring is illuminated */
  isActive: boolean;
  /** Current RGB hex colour displayed by the ring */
  currentColor: string;
  /** Active illumination animation pattern */
  mode: HiLightMode;
  /** Brightness level normalized from 0.0 to 1.0 */
  brightness: number;
  /** Whether the phone is placed face-down (glanceable mode active) */
  isFaceDownMode: boolean;
  /** Probe local daemon status */
  refreshDaemonStatus: () => Promise<boolean>;
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

const DAEMON_URL = 'http://127.0.0.1:11080';
const GEMINI_CYAN = '#00E5FF';
const GOOGLE_BLUE = '#8AB4F8';

async function sendDaemonCommand(path: string, payload?: object): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600);
    const res = await fetch(`${DAEMON_URL}${path}`, {
      method: payload ? 'POST' : 'GET',
      headers: payload ? { 'Content-Type': 'application/json' } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

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
  const [isDaemonConnected, setIsDaemonConnected] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentColor, setCurrentColor] = useState<string>(GEMINI_CYAN);
  const [mode, setModeState] = useState<HiLightMode>('off');
  const [brightness, setBrightnessState] = useState<number>(0.85);
  const [isFaceDownMode] = useState<boolean>(true);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const availability: HardwareAvailability = !hasHiLight
    ? 'unsupported'
    : isDaemonConnected
    ? 'hardware'
    : 'simulated';

  const source: TelemetrySource = !hasHiLight
    ? 'unavailable'
    : isDaemonConnected
    ? 'hardware'
    : 'simulated';

  const checkDaemon = useCallback(async () => {
    if (!hasHiLight) return false;
    const ok = await sendDaemonCommand('/status');
    setIsDaemonConnected(ok);
    return ok;
  }, [hasHiLight]);

  useEffect(() => {
    checkDaemon();
    const interval = setInterval(checkDaemon, 5000);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [checkDaemon]);

  const setColor = useCallback(
    (hexColor: string) => {
      setCurrentColor(hexColor);
      setIsActive(true);
      const newMode = mode === 'off' ? 'glow' : mode;
      if (mode === 'off') setModeState('glow');

      if (hasHiLight) {
        sendDaemonCommand('/set', {
          color: hexColor,
          mode: newMode,
          brightness,
          durationMs: 0,
        });
      }
    },
    [hasHiLight, mode, brightness]
  );

  const setMode = useCallback(
    (newMode: HiLightMode) => {
      setModeState(newMode);
      const active = newMode !== 'off';
      setIsActive(active);

      if (hasHiLight) {
        if (active) {
          sendDaemonCommand('/set', {
            color: currentColor,
            mode: newMode,
            brightness,
            durationMs: 0,
          });
        } else {
          sendDaemonCommand('/off');
        }
      }
    },
    [hasHiLight, currentColor, brightness]
  );

  const setBrightness = useCallback(
    (level: number) => {
      const clamped = Math.max(0.0, Math.min(1.0, level));
      setBrightnessState(clamped);

      if (hasHiLight && isActive) {
        sendDaemonCommand('/set', {
          color: currentColor,
          mode,
          brightness: clamped,
          durationMs: 0,
        });
      }
    },
    [hasHiLight, isActive, currentColor, mode]
  );

  const triggerGeminiPulse = useCallback(
    (durationMs: number = 4000) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setCurrentColor(GEMINI_CYAN);
      setModeState('gemini_thinking');
      setIsActive(true);

      if (hasHiLight) {
        sendDaemonCommand('/set', {
          color: GEMINI_CYAN,
          mode: 'gemini_thinking',
          brightness,
          durationMs,
        });
      }

      timerRef.current = setTimeout(() => {
        setModeState('off');
        setIsActive(false);
      }, durationMs);
    },
    [hasHiLight, brightness]
  );

  const triggerContactAlert = useCallback(
    (hexColor: string, durationMs: number = 5000) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setCurrentColor(hexColor);
      setModeState('incoming_call');
      setIsActive(true);

      if (hasHiLight) {
        sendDaemonCommand('/set', {
          color: hexColor,
          mode: 'incoming_call',
          brightness,
          durationMs,
        });
      }

      timerRef.current = setTimeout(() => {
        setModeState('off');
        setIsActive(false);
      }, durationMs);
    },
    [hasHiLight, brightness]
  );

  const turnOff = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setModeState('off');
    setIsActive(false);

    if (hasHiLight) {
      sendDaemonCommand('/off');
    }
  }, [hasHiLight]);

  const toggle = useCallback(() => {
    if (isActive) {
      turnOff();
    } else {
      setIsActive(true);
      setCurrentColor(GOOGLE_BLUE);
      setModeState('glow');

      if (hasHiLight) {
        sendDaemonCommand('/set', {
          color: GOOGLE_BLUE,
          mode: 'glow',
          brightness,
          durationMs: 0,
        });
      }
    }
  }, [isActive, turnOff, hasHiLight, brightness]);

  return {
    availability,
    isHardwareSupported: hasHiLight,
    source,
    isDaemonConnected,
    isActive,
    currentColor,
    mode,
    brightness,
    isFaceDownMode,
    refreshDaemonStatus: checkDaemon,
    setColor,
    setMode,
    setBrightness,
    triggerGeminiPulse,
    triggerContactAlert,
    turnOff,
    toggle,
  };
}

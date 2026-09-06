/**
 * @file useHiLight.ts
 * @description Pixel 11 Pro HiLight LED array: eight `Light.LIGHT_TYPE_APPLICATION` lights in the Android 17
 * lights service. Driving them needs `CONTROL_DEVICE_LIGHTS`, a signature|privileged permission a third-party
 * app cannot hold, so two paths exist:
 *  - `availability: 'shizuku'`: Shizuku is installed, running and has granted this app; the PixelHiLight module
 *    binds a shell-uid helper and every colour call reaches the real LEDs (`source: 'hardware'`).
 *  - `availability: 'simulated'`: hardware present but no helper; the intended colour and pattern are kept as
 *    state and mirrored on screen (`source: 'simulated'`).
 * `'unsupported'` on devices without the array. See docs/research/HILIGHT_LED_ARRAY.md.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { HardwareAvailability } from '../core/capabilities';
import { useCapabilities } from './useCapabilities';
import PixelHiLight, { hexToArgb, type HiLightInfo, type HiLightStatus } from '../../modules/pixel-hilight';
import { logEvent, type TelemetrySource } from '../core/observability';

const MODULE = 'useHiLight';

export type HiLightMode =
  | 'off'
  | 'glow'
  | 'breathing'
  | 'pulse'
  | 'gemini_thinking'
  | 'incoming_call'
  | 'notification';

export interface HiLightState {
  /** 'shizuku' when the helper is bound, 'simulated' on Pixel 11 Pro-class devices without it, else 'unsupported' */
  availability: HardwareAvailability;
  /** True when the device physically has the HiLight LED array */
  isHardwareSupported: boolean;
  /** 'hardware' while the helper drives the LEDs, 'simulated' for the on-screen mirror, 'unavailable' elsewhere */
  source: TelemetrySource;
  /** Whether the ring is illuminated (real LEDs when 'shizuku', virtual otherwise) */
  isActive: boolean;
  /** Current RGB hex colour */
  currentColor: string;
  /** Active pattern label */
  mode: HiLightMode;
  /** Brightness 0..1. The hardware has no brightness channel; applied by scaling RGB */
  brightness: number;
  /** Whether the phone is placed face-down (glanceable mode active) */
  isFaceDownMode: boolean;
  /** Shizuku preconditions, each read live from the module; null when the module is absent */
  shizuku: HiLightStatus | null;
  /** Facts from the shell helper once bound (uid, light ids, duty accounting) */
  helper: HiLightInfo | null;
  /** Last helper or Shizuku error */
  error: string | null;
  /** Requests Shizuku permission, binds the helper, reads its info */
  connect: () => Promise<boolean>;
  /** Clears the LEDs and unbinds the helper */
  disconnect: () => void;
  /** Set a colour (drives the LEDs when 'shizuku') */
  setColor: (hexColor: string) => void;
  setMode: (mode: HiLightMode) => void;
  setBrightness: (level: number) => void;
  /** Cyan hold for the duration (Gemini thinking) */
  triggerGeminiPulse: (durationMs?: number) => void;
  /** Colour hold for the duration (favourite contact) */
  triggerContactAlert: (hexColor: string, durationMs?: number) => void;
  turnOff: () => void;
  toggle: () => void;
}

const GEMINI_CYAN = '#00E5FF';
const GOOGLE_BLUE = '#8AB4F8';
/** Longest hold the helper accepts per request; it auto-clears after this. */
const HARD_MAX_MS = 60_000;

function scaleHex(hex: string, brightness: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 6 ? h : h.slice(-6), 16);
  const s = (v: number) => Math.round(v * Math.max(0, Math.min(1, brightness)));
  const r = s((n >> 16) & 0xff), g = s((n >> 8) & 0xff), b = s(n & 0xff);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function useHiLight(): HiLightState {
  const { hasHiLight } = useCapabilities();
  const [shizuku, setShizuku] = useState<HiLightStatus | null>(() => (PixelHiLight ? PixelHiLight.getStatus() : null));
  const [helper, setHelper] = useState<HiLightInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentColor, setCurrentColor] = useState<string>(GEMINI_CYAN);
  const [mode, setModeState] = useState<HiLightMode>('off');
  const [brightness, setBrightnessState] = useState<number>(0.85);
  const [isFaceDownMode] = useState<boolean>(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bound = !!shizuku?.serviceBound && !!PixelHiLight;
  const availability: HardwareAvailability = !hasHiLight ? 'unsupported' : bound ? 'shizuku' : 'simulated';
  const source: TelemetrySource = !hasHiLight ? 'unavailable' : bound ? 'hardware' : 'simulated';

  useEffect(() => {
    if (!PixelHiLight) return;
    const sub = PixelHiLight.addListener('onState', e => {
      const { reason, ...status } = e;
      setShizuku(status);
      logEvent(MODULE, 'shizuku state', { reason, ...status });
      if (!status.serviceBound) setHelper(null);
    });
    return () => {
      sub.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const readInfo = useCallback(async () => {
    if (!PixelHiLight) return;
    try {
      const info = JSON.parse(await PixelHiLight.info()) as HiLightInfo;
      setHelper(info);
      logEvent(MODULE, 'helper info', { uid: info.uid, count: info.count, litMsInWindow: info.litMsInWindow, initError: info.initError });
    } catch (e: any) {
      setError(e?.message ?? 'info failed');
    }
  }, []);

  const connect = useCallback(async (): Promise<boolean> => {
    if (!PixelHiLight) { setError('PixelHiLight module is not in this build'); return false; }
    setError(null);
    const status = PixelHiLight.getStatus();
    setShizuku(status);
    if (!status.shizukuInstalled) { setError('Shizuku is not installed (Play Store: Shizuku)'); return false; }
    if (!status.shizukuRunning) { setError('Shizuku is not running; start it from Wireless debugging or adb'); return false; }
    try {
      const granted = status.permissionGranted || (await PixelHiLight.requestPermission());
      if (!granted) { setError('Shizuku permission denied'); setShizuku(PixelHiLight.getStatus()); return false; }
      const ok = await PixelHiLight.bind();
      setShizuku(PixelHiLight.getStatus());
      if (ok) await readInfo();
      logEvent(MODULE, 'connect', { bound: ok });
      return ok;
    } catch (e: any) {
      setError(e?.message ?? 'connect failed');
      logEvent(MODULE, 'connect error', { message: e?.message, code: e?.code }, 'error');
      return false;
    }
  }, [readInfo]);

  const disconnect = useCallback(() => {
    if (!PixelHiLight) return;
    try { PixelHiLight.unbind(); } catch { /* helper already gone */ }
    setShizuku(PixelHiLight.getStatus());
    setHelper(null);
    setIsActive(false);
    setModeState('off');
  }, []);

  /** Sends the colour to the helper when bound; returns false when refused. */
  const drive = useCallback(async (hex: string, ms: number): Promise<boolean> => {
    if (!PixelHiLight || !PixelHiLight.getStatus().serviceBound) return false;
    try {
      const ok = await PixelHiLight.setAll(hexToArgb(scaleHex(hex, brightness)), Math.min(ms, HARD_MAX_MS));
      if (!ok) setError('Helper refused: duty-cycle guard (50 % of any 10 min) or no lights');
      logEvent(MODULE, 'led set', { hex, ms, ok });
      void readInfo();
      return ok;
    } catch (e: any) {
      setError(e?.message ?? 'set failed');
      logEvent(MODULE, 'led error', { message: e?.message, code: e?.code }, 'error');
      return false;
    }
  }, [brightness, readInfo]);

  const driveOff = useCallback(async () => {
    if (!PixelHiLight || !PixelHiLight.getStatus().serviceBound) return;
    try { await PixelHiLight.clear(); logEvent(MODULE, 'led clear'); void readInfo(); } catch (e: any) { setError(e?.message ?? 'clear failed'); }
  }, [readInfo]);

  const turnOff = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setModeState('off');
    setIsActive(false);
    void driveOff();
  }, [driveOff]);

  const hold = useCallback((hex: string, newMode: HiLightMode, durationMs: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentColor(hex);
    setModeState(newMode);
    setIsActive(true);
    void drive(hex, durationMs);
    timerRef.current = setTimeout(() => {
      setModeState('off');
      setIsActive(false);
      void driveOff();
    }, durationMs);
  }, [drive, driveOff]);

  const setColor = useCallback((hexColor: string) => {
    setCurrentColor(hexColor);
    setIsActive(true);
    setModeState(prev => (prev === 'off' ? 'glow' : prev));
    void drive(hexColor, HARD_MAX_MS);
  }, [drive]);

  const setMode = useCallback((newMode: HiLightMode) => {
    setModeState(newMode);
    setIsActive(newMode !== 'off');
    if (newMode === 'off') void driveOff();
  }, [driveOff]);

  const setBrightness = useCallback((level: number) => {
    setBrightnessState(Math.max(0.0, Math.min(1.0, level)));
  }, []);

  const triggerGeminiPulse = useCallback((durationMs: number = 4000) => hold(GEMINI_CYAN, 'gemini_thinking', durationMs), [hold]);
  const triggerContactAlert = useCallback((hexColor: string, durationMs: number = 5000) => hold(hexColor, 'incoming_call', durationMs), [hold]);

  const toggle = useCallback(() => {
    if (isActive) turnOff();
    else setColor(GOOGLE_BLUE);
  }, [isActive, turnOff, setColor]);

  return {
    availability,
    isHardwareSupported: hasHiLight,
    source,
    isActive,
    currentColor,
    mode,
    brightness,
    isFaceDownMode,
    shizuku,
    helper,
    error,
    connect,
    disconnect,
    setColor,
    setMode,
    setBrightness,
    triggerGeminiPulse,
    triggerContactAlert,
    turnOff,
    toggle,
  };
}

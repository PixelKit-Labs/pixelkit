/**
 * @file useDisplay.ts
 * @description Controls Pixel's 120Hz LTPO display, wake lock persistence, and screen brightness.
 * Useful for dashboards, continuous sensor monitors, and HUD interfaces to prevent premature screen sleep.
 */

import { useState, useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Brightness from 'expo-brightness';
import { Platform } from 'react-native';

/**
 * Hook to manage screen wake state and adjust display illumination.
 *
 * @returns Object containing wake lock status, toggling function, brightness control, and 120Hz refresh specification.
 *
 * @example
 * ```typescript
 * const { isKeepAwake, toggleKeepAwake, setScreenBrightness } = useDisplay();
 * // Keep screen on during telemetry session:
 * await toggleKeepAwake();
 * ```
 */
export function useDisplay() {
  const [isKeepAwake, setIsKeepAwake] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(0.8);

  useEffect(() => {
    const initBrightness = async () => {
      if (Platform.OS === 'web') return;
      try {
        const current = await Brightness.getBrightnessAsync();
        setBrightness(Number(current.toFixed(2)));
      } catch {
        // Permissions not yet granted or simulator
      }
    };
    initBrightness();
  }, []);

  /**
   * Toggles the system wake-lock state.
   * When enabled, prevents the Pixel OLED display from sleeping.
   */
  const toggleKeepAwake = async (): Promise<void> => {
    try {
      if (isKeepAwake) {
        await deactivateKeepAwake();
        setIsKeepAwake(false);
      } else {
        await activateKeepAwakeAsync();
        setIsKeepAwake(true);
      }
    } catch {
      // Degrades gracefully on unsupported platforms
    }
  };

  /**
   * Programmatically sets the display brightness.
   * @param value Floating-point value from 0.0 (dimmest) to 1.0 (full brightness).
   */
  const setScreenBrightness = async (value: number): Promise<void> => {
    const clamped = Math.max(0, Math.min(1, value));
    setBrightness(clamped);
    if (Platform.OS !== 'web') {
      try {
        await Brightness.setBrightnessAsync(clamped);
      } catch {
        // Permissions not yet granted
      }
    }
  };

  return {
    /** Whether the screen is currently locked awake */
    isKeepAwake,
    /** Toggle the wake lock on or off */
    toggleKeepAwake,
    /** Current normalized brightness (0.0 to 1.0) */
    brightness,
    /** Programmatically adjust screen brightness */
    setScreenBrightness,
    /** Hardware display refresh rate specification */
    refreshRateHz: 120,
  };
}

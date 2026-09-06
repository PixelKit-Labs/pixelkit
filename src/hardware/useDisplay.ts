import { useState, useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Brightness from 'expo-brightness';
import { Platform } from 'react-native';

/**
 * PixelForge Display Hook
 * Controls 120Hz LTPO screen wake lock, brightness, and screen state.
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
        // Permissions not yet granted
      }
    };
    initBrightness();
  }, []);

  const toggleKeepAwake = async () => {
    try {
      if (isKeepAwake) {
        await deactivateKeepAwake();
        setIsKeepAwake(false);
      } else {
        await activateKeepAwakeAsync();
        setIsKeepAwake(true);
      }
    } catch {
      // Ignored
    }
  };

  const setScreenBrightness = async (value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    setBrightness(clamped);
    if (Platform.OS !== 'web') {
      try {
        await Brightness.setBrightnessAsync(clamped);
      } catch {
        // Ignored
      }
    }
  };

  return {
    isKeepAwake,
    toggleKeepAwake,
    brightness,
    setScreenBrightness,
    refreshRateHz: 120, // Pixel Pro LTPO OLED display
  };
}

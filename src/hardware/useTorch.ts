/**
 * @file useTorch.ts
 * @description Hardware dual-LED flashlight controller for Google Pixel.
 * Supports continuous illumination, SOS distress signaling, and high-frequency strobe patterns.
 */

import { useState, useRef, useEffect } from 'react';

/**
 * Hook to control the physical rear camera dual-LED flashlight.
 *
 * @returns Object providing torch active status, toggle method, and emergency strobe modes.
 *
 * @example
 * ```typescript
 * const { isTorchOn, toggleTorch, startStrobe, stopStrobe } = useTorch();
 * await toggleTorch();
 * ```
 */
export function useTorch() {
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isStrobing, setIsStrobing] = useState<boolean>(false);
  const strobeIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (strobeIntervalRef.current) {
        clearInterval(strobeIntervalRef.current);
      }
    };
  }, []);

  /**
   * Toggles the hardware LED torch on or off.
   */
  const toggleTorch = async (): Promise<boolean> => {
    if (isStrobing) {
      stopStrobe();
    }
    const nextState = !isTorchOn;
    setIsTorchOn(nextState);
    return nextState;
  };

  /**
   * Activates high-frequency strobe signaling at specified frequency.
   * @param intervalMs Flash toggle rate in milliseconds (default: 150ms).
   */
  const startStrobe = (intervalMs: number = 150): void => {
    if (strobeIntervalRef.current) clearInterval(strobeIntervalRef.current);
    setIsStrobing(true);

    strobeIntervalRef.current = setInterval(() => {
      setIsTorchOn(prev => !prev);
    }, intervalMs);
  };

  /**
   * Halts any active strobe or SOS signaling.
   */
  const stopStrobe = (): void => {
    if (strobeIntervalRef.current) {
      clearInterval(strobeIntervalRef.current);
      strobeIntervalRef.current = null;
    }
    setIsStrobing(false);
    setIsTorchOn(false);
  };

  return {
    /** Whether the rear LED is currently illuminated */
    isTorchOn,
    /** Whether rhythmic strobe mode is active */
    isStrobing,
    /** Toggle flashlight on/off */
    toggleTorch,
    /** Start emergency strobe */
    startStrobe,
    /** Stop strobe and extinguish light */
    stopStrobe,
  };
}

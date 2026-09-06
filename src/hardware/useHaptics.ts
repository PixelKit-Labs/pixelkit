/**
 * @file useHaptics.ts
 * @description Tactile feedback abstraction for Google Pixel's Linear Resonant Actuator (LRA).
 * Generates crisp mechanical ticks, varying impact weights, and notification waveforms.
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { HapticType } from '../core/types';

/**
 * Hook to trigger tactile vibrations and haptic waveforms on the device.
 * Gracefully degrades to a no-op on web browsers or environments lacking an actuator.
 *
 * @returns Object providing dedicated helper methods for each haptic vibration pattern.
 *
 * @example
 * ```typescript
 * const { light, success, error } = useHaptics();
 * // On button tap:
 * light();
 * // On async completion:
 * success();
 * ```
 */
export function useHaptics() {
  /**
   * Triggers a specific haptic vibration pattern by name.
   * @param type The haptic pattern category.
   */
  const triggerHaptic = async (type: HapticType = 'light'): Promise<void> => {
    if (Platform.OS === 'web') return;

    try {
      switch (type) {
        case 'selection':
          await Haptics.selectionAsync();
          break;
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch {
      // Haptics unavailable on emulator or unsupported hardware
    }
  };

  return {
    /** Trigger a specific haptic pattern dynamically */
    triggerHaptic,
    /** Ultra-subtle click for rotary pickers, sliders, and segmented controls */
    selection: () => triggerHaptic('selection'),
    /** Crisp mechanical click for standard UI button presses */
    light: () => triggerHaptic('light'),
    /** Firm physical thump for switches and modal reveals */
    medium: () => triggerHaptic('medium'),
    /** Deep substantial thud for drag drops, snapping, or critical events */
    heavy: () => triggerHaptic('heavy'),
    /** Double-pulse confirmation for successful operations */
    success: () => triggerHaptic('success'),
    /** Cautionary alert vibration pattern */
    warning: () => triggerHaptic('warning'),
    /** Rapid triple-pulse error vibration */
    error: () => triggerHaptic('error'),
  };
}

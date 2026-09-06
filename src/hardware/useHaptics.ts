import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { HapticType } from '../core/types';

/**
 * PixelForge Haptics Hook
 * Interacts with the Pixel's Linear Resonant Actuator (LRA) vibration engine.
 */
export function useHaptics() {
  const triggerHaptic = async (type: HapticType = 'light') => {
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
      // Haptics unavailable on simulator or device without actuator
    }
  };

  return {
    triggerHaptic,
    selection: () => triggerHaptic('selection'),
    light: () => triggerHaptic('light'),
    medium: () => triggerHaptic('medium'),
    heavy: () => triggerHaptic('heavy'),
    success: () => triggerHaptic('success'),
    warning: () => triggerHaptic('warning'),
    error: () => triggerHaptic('error'),
  };
}

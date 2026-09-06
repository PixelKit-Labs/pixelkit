/**
 * @file HapticButton.tsx
 * @description Tactile interactive button component complying with Material 3 Expressive guidelines.
 * Automatically triggers the designated physical vibration waveform on tap before executing the callback.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useHaptics } from '../hardware/useHaptics';
import { Colors } from '../theme/colors';
import { HapticType } from '../core/types';

/**
 * Properties for the HapticButton component.
 */
export interface HapticButtonProps {
  /** Button title text */
  title: string;
  /** Callback triggered when button is pressed */
  onPress: () => void;
  /** Type of haptic vibration waveform to trigger on tap (default: 'light') */
  hapticType?: HapticType;
  /** Visual variant styling (default: 'primary') */
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  /** Optional container style overrides */
  style?: ViewStyle;
  /** Optional label typography style overrides */
  textStyle?: TextStyle;
  /** Whether interaction is disabled */
  disabled?: boolean;
  /** Optional icon rendered adjacent to the text */
  icon?: React.ReactNode;
}

/**
 * Reusable button primitive with integrated Linear Resonant Actuator haptics.
 *
 * @example
 * ```tsx
 * <HapticButton
 *   title="Execute Operation"
 *   onPress={handleExecute}
 *   variant="primary"
 *   hapticType="medium"
 * />
 * ```
 */
export const HapticButton: React.FC<HapticButtonProps> = ({
  title,
  onPress,
  hapticType = 'light',
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
  icon,
}) => {
  const { triggerHaptic } = useHaptics();

  const handlePress = () => {
    if (disabled) return;
    triggerHaptic(hapticType);
    onPress();
  };

  const getBackgroundColor = () => {
    if (disabled) return Colors.dark.surfaceVariant;
    switch (variant) {
      case 'primary': return Colors.dark.primary;
      case 'secondary': return Colors.dark.surfaceVariant;
      case 'danger': return Colors.dark.error;
      case 'outline': return 'transparent';
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.dark.textMuted;
    switch (variant) {
      case 'primary': return '#0A1424'; // Deep contrast against dynamic blue
      case 'secondary': return Colors.dark.text;
      case 'danger': return '#FFFFFF';
      case 'outline': return Colors.dark.primary;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'outline' ? Colors.dark.primary : 'transparent',
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.text, { color: getTextColor(), marginLeft: icon ? 8 : 0 }, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24, // Material 3 pill shape
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

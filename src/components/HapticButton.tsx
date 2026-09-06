/**
 * @file HapticButton.tsx
 * @description Pill button with integrated haptics and the PixelForge look:
 * `primary` violet gradient, `cta` white pill (hero actions), `secondary` glass, `outline` hairline,
 * `danger` warm-red gradient, `ghost` text-only. Press feedback scales the pill slightly.
 */

import React from 'react';
import { Pressable, Text, StyleSheet, View, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useHaptics } from '../hardware/useHaptics';
import { Colors, Gradients, Radius } from '../theme/colors';
import { HapticType } from '../core/types';

export type HapticButtonVariant = 'primary' | 'cta' | 'secondary' | 'outline' | 'danger' | 'ghost';

/**
 * Properties for the HapticButton component.
 */
export interface HapticButtonProps {
  /** Button title text */
  title: string;
  /** Callback triggered when button is pressed */
  onPress: () => void;
  /** Haptic pattern played on tap (default: 'light') */
  hapticType?: HapticType;
  /** Visual variant (default: 'primary') */
  variant?: HapticButtonVariant;
  /** Size preset (default: 'md') */
  size?: 'sm' | 'md' | 'lg';
  /** Container style overrides */
  style?: StyleProp<ViewStyle>;
  /** Label style overrides */
  textStyle?: StyleProp<TextStyle>;
  /** Whether interaction is disabled */
  disabled?: boolean;
  /** Optional icon rendered before the text */
  icon?: React.ReactNode;
}

const SIZES = {
  sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 12 },
  md: { paddingVertical: 13, paddingHorizontal: 20, fontSize: 15 },
  lg: { paddingVertical: 17, paddingHorizontal: 24, fontSize: 16 },
};

/**
 * Reusable button primitive with integrated Linear Resonant Actuator haptics.
 *
 * @example
 * ```tsx
 * <HapticButton title="Let's begin" variant="cta" size="lg" onPress={start} />
 * ```
 */
export const HapticButton: React.FC<HapticButtonProps> = ({
  title,
  onPress,
  hapticType = 'light',
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  disabled = false,
  icon,
}) => {
  const { triggerHaptic } = useHaptics();
  const s = SIZES[size];

  const handlePress = () => {
    if (disabled) return;
    void triggerHaptic(hapticType);
    onPress();
  };

  const textColor = (() => {
    if (disabled) return Colors.dark.textMuted;
    switch (variant) {
      case 'primary': return '#FFFFFF';
      case 'cta': return '#12101F';
      case 'danger': return '#FFFFFF';
      case 'secondary': return Colors.dark.text;
      case 'outline': return Colors.dark.primary;
      case 'ghost': return Colors.dark.primary;
    }
  })();

  const gradient = !disabled && (variant === 'primary' ? Gradients.primary : variant === 'danger' ? Gradients.danger : null);

  const surfaceStyle: ViewStyle = (() => {
    if (disabled) return { backgroundColor: Colors.dark.surfaceVariant, opacity: 0.55 };
    switch (variant) {
      case 'cta': return { backgroundColor: '#FFFFFF' };
      case 'secondary': return { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' };
      case 'outline': return { backgroundColor: 'transparent', borderWidth: 1, borderColor: `${Colors.dark.primary}66` };
      case 'ghost': return { backgroundColor: 'transparent' };
      default: return {};
    }
  })();

  const content = (
    <View style={styles.content}>
      {icon}
      <Text style={[styles.text, { color: textColor, fontSize: s.fontSize, marginLeft: icon ? 8 : 0 }, textStyle]} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal },
        surfaceStyle,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {gradient ? (
        <LinearGradient colors={[...gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      ) : null}
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

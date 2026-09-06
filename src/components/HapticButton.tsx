import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useHaptics } from '../hardware/useHaptics';
import { Colors } from '../theme/colors';
import { HapticType } from '../core/types';

interface HapticButtonProps {
  title: string;
  onPress: () => void;
  hapticType?: HapticType;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  icon?: React.ReactNode;
}

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
      case 'primary': return '#0A1424'; // Deep contrast against blue
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

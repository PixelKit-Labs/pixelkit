/**
 * @file Decor.tsx
 * @description Decorative primitives for the PixelForge look: an ambient violet glow anchored to the
 * top of a screen, thin concentric line-art rings (gold/violet hairlines, no SVG dependency), a
 * small-caps section header with a glowing dot, and a pill chip. All are pointer-transparent.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Radius, Type } from '../theme/colors';

/** Ambient glow at the top of a screen. Place first inside a relative container. */
export const GlowBackdrop: React.FC<{ height?: number; style?: StyleProp<ViewStyle> }> = ({ height = 420, style }) => (
  <LinearGradient
    colors={[...Gradients.glow]}
    style={[styles.glow, { height }, style]}
    pointerEvents="none"
  />
);

/** Concentric hairline rings, offset to the top-right like an orbital diagram. */
export const OrbitRings: React.FC<{ size?: number; rings?: number; style?: StyleProp<ViewStyle>; color?: string }> = ({
  size = 320,
  rings = 5,
  style,
  color = Colors.dark.tertiary,
}) => (
  <View style={[styles.rings, { width: size, height: size }, style]} pointerEvents="none">
    {Array.from({ length: rings }).map((_, i) => {
      const d = size - i * (size / rings) * 0.85;
      return (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: d,
            height: d,
            borderRadius: d / 2,
            borderWidth: 1,
            borderColor: color,
            opacity: 0.12 + i * 0.05,
            top: (size - d) / 2,
            left: (size - d) / 2,
          }}
        />
      );
    })}
    <View style={[styles.ringCore, { top: size / 2 - 3, left: size / 2 - 3, backgroundColor: color }]} />
  </View>
);

/** Section header: glowing dot + small caps label, optional right-side hint. */
export const SectionHeader: React.FC<{ title: string; hint?: string; style?: StyleProp<ViewStyle> }> = ({ title, hint, style }) => (
  <View style={[styles.section, style]}>
    <View style={styles.sectionLeft}>
      <View style={styles.sectionDot} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
  </View>
);

/** Pill chip for tags and statuses. */
export const Chip: React.FC<{ label: string; color?: string; filled?: boolean; style?: StyleProp<ViewStyle> }> = ({
  label,
  color = Colors.dark.primary,
  filled = false,
  style,
}) => (
  <View style={[styles.chip, { borderColor: `${color}55`, backgroundColor: filled ? `${color}33` : `${color}14` }, style]}>
    <Text style={[styles.chipText, { color }]} numberOfLines={1}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  rings: {
    position: 'absolute',
  },
  ringCore: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.9,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.accent,
    marginRight: 8,
    shadowColor: Colors.dark.accent,
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  sectionTitle: {
    ...Type.label,
    color: Colors.dark.textMuted,
  },
  sectionHint: {
    ...Type.micro,
    color: Colors.dark.textMuted,
    opacity: 0.8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    ...Type.micro,
  },
});

/**
 * @file MetricCard.tsx
 * @description Card component for displaying hardware telemetry, silicon metrics, and status badges.
 * Built with dark-mode OLED borders, tabular numerals for jump-free real-time rendering, and customizable accent chips.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

/**
 * Properties for the MetricCard component.
 */
export interface MetricCardProps {
  /** Metric header title */
  title: string;
  /** Primary numeric or string telemetry value */
  value: string | number;
  /** Optional unit suffix (e.g., 'FPS', 'ms', 'hPa', '%') */
  unit?: string;
  /** Explanatory secondary text below the value */
  subtitle?: string;
  /** Status badge chip text rendered in top right */
  badge?: string;
  /** Accent color of the status badge border and text */
  badgeColor?: string;
  /** Optional header icon element */
  icon?: React.ReactNode;
}

/**
 * Reusable telemetry card primitive for hardware HUD and diagnostic dashboards.
 *
 * @example
 * ```tsx
 * <MetricCard
 *   title="Tensor TPU"
 *   value={14.2}
 *   unit="ms"
 *   badge="HARDWARE ACCELERATED"
 *   badgeColor="#00E5FF"
 *   subtitle="Running on local NPU silicon"
 * />
 * ```
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  badge,
  badgeColor = Colors.dark.primary,
  icon,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {icon}
          <Text style={[styles.title, { marginLeft: icon ? 6 : 0 }]}>{title}</Text>
        </View>
        {badge && (
          <View style={[styles.badge, { backgroundColor: `${badgeColor}25`, borderColor: badgeColor }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
          </View>
        )}
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    color: Colors.dark.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    color: Colors.dark.textMuted,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  subtitle: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});

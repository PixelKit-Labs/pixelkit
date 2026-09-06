/**
 * @file MetricCard.tsx
 * @description Card component for displaying hardware telemetry, silicon metrics, and status badges.
 * Built with dark-mode OLED borders, tabular numerals for jump-free real-time rendering, a
 * wrap-safe header (long badges drop below the title instead of overlapping it), and an optional
 * provenance tag so every number says whether it came from hardware, was derived, is simulated,
 * or is unavailable.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import type { TelemetrySource } from '../core/observability';

/**
 * Properties for the MetricCard component.
 */
export interface MetricCardProps {
  /** Metric header title */
  title: string;
  /** Primary numeric or string telemetry value. `null`/`undefined` renders as "—" */
  value: string | number | null | undefined;
  /** Optional unit suffix (e.g., 'FPS', 'ms', 'hPa', '%') */
  unit?: string;
  /** Explanatory secondary text below the value */
  subtitle?: string;
  /** Status badge chip text rendered in the header */
  badge?: string;
  /** Accent color of the status badge border and text */
  badgeColor?: string;
  /** Optional header icon element */
  icon?: React.ReactNode;
  /** Telemetry provenance; renders a small tag in the footer */
  source?: TelemetrySource;
}

const SOURCE_STYLE: Record<TelemetrySource, { label: string; color: string }> = {
  hardware: { label: 'HW', color: Colors.dark.success },
  derived: { label: 'DERIVED', color: Colors.dark.primary },
  simulated: { label: 'SIMULATED', color: Colors.dark.warning },
  unavailable: { label: 'N/A', color: Colors.dark.error },
};

/**
 * Reusable telemetry card primitive for hardware HUD and diagnostic dashboards.
 *
 * @example
 * ```tsx
 * <MetricCard title="Thermal headroom" value={0.41} badge="NOMINAL" source="hardware" />
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
  source,
}) => {
  const display = value === null || value === undefined ? '—' : value;
  const src = source ? SOURCE_STYLE[source] : null;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {icon}
          <Text style={[styles.title, { marginLeft: icon ? 6 : 0 }]} numberOfLines={2}>{title}</Text>
        </View>
        {badge && (
          <View style={[styles.badge, { backgroundColor: `${badgeColor}25`, borderColor: badgeColor }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]} numberOfLines={1}>{badge}</Text>
          </View>
        )}
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.value}>{display}</Text>
        {unit && display !== '—' && <Text style={styles.unit}>{unit}</Text>}
      </View>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      {src && (
        <View style={styles.footer}>
          <View style={[styles.sourceDot, { backgroundColor: src.color }]} />
          <Text style={[styles.sourceText, { color: src.color }]}>{src.label}</Text>
        </View>
      )}
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
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  title: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: '100%',
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
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  sourceText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});

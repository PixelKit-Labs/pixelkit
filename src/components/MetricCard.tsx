/**
 * @file MetricCard.tsx
 * @description Glass telemetry card: hairline border, faint top sheen, small-caps title, chip badge,
 * large tabular value, optional provenance tag (HW / DERIVED / SIMULATED / N/A). The header wraps so
 * long badges drop under the title instead of overlapping it.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Radius, Type } from '../theme/colors';
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
  /** Larger value typography for hero metrics */
  emphasis?: boolean;
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
  emphasis = false,
}) => {
  const display = value === null || value === undefined ? '—' : value;
  const src = source ? SOURCE_STYLE[source] : null;
  const isLongText = typeof display === 'string' && display.length > 18;
  return (
    <View style={styles.card}>
      <LinearGradient colors={[...Gradients.card]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={styles.sheen} pointerEvents="none" />
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {icon}
          <Text style={[styles.title, { marginLeft: icon ? 6 : 0 }]} numberOfLines={2}>{title}</Text>
        </View>
        {badge && (
          <View style={[styles.badge, { backgroundColor: `${badgeColor}1F`, borderColor: `${badgeColor}55` }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]} numberOfLines={1}>{badge}</Text>
          </View>
        )}
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.value, emphasis && styles.valueEmphasis, isLongText && styles.valueText]}>{display}</Text>
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
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  title: {
    ...Type.label,
    color: Colors.dark.textMuted,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    maxWidth: '100%',
  },
  badgeText: {
    ...Type.micro,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  value: {
    ...Type.value,
    color: Colors.dark.text,
    fontVariant: ['tabular-nums'],
  },
  valueEmphasis: {
    fontSize: 40,
    letterSpacing: -1.2,
  },
  valueText: {
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.2,
    fontWeight: '600',
  },
  unit: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  subtitle: {
    ...Type.caption,
    color: Colors.dark.textMuted,
    marginTop: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  sourceText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

/**
 * @file SensorVisualizer.tsx
 * @description Real-time 3-axis motion visualizer for Accelerometer, Gyroscope, and Magnetometer.
 * Displays normalized horizontal bar graphs for X, Y, and Z axes with tabular numeric readouts.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Vector3D } from '../core/types';
import { Colors } from '../theme/colors';

/**
 * Properties for the SensorVisualizer component.
 */
export interface SensorVisualizerProps {
  /** Display label describing the sensor (e.g. "6-Axis Accelerometer") */
  label: string;
  /** Real-time 3D vector */
  vector: Vector3D;
  /** Optional unit suffix (e.g. "g", "rad/s", "μT") */
  unit?: string;
}

/**
 * Multi-axis telemetry graph component with color-coded X (red), Y (green), and Z (blue) bars.
 *
 * @example
 * ```tsx
 * <SensorVisualizer
 *   label="6-Axis Accelerometer"
 *   vector={accelerometer}
 *   unit="g"
 * />
 * ```
 */
export const SensorVisualizer: React.FC<SensorVisualizerProps> = ({
  label,
  vector,
  unit = '',
}) => {
  const renderAxis = (axisLabel: string, val: number, color: string) => {
    // Clamp to -10 to +10 for visual bar representation
    const clamped = Math.max(-10, Math.min(10, val));
    const percentage = ((clamped + 10) / 20) * 100;

    return (
      <View style={styles.axisRow} key={axisLabel}>
        <View style={styles.axisHeader}>
          <Text style={[styles.axisLabel, { color }]}>{axisLabel}:</Text>
          <Text style={styles.axisValue}>{val.toFixed(2)} {unit}</Text>
        </View>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              {
                width: `${percentage}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{label}</Text>
      {renderAxis('X', vector.x, '#FF5252')}
      {renderAxis('Y', vector.y, '#69F0AE')}
      {renderAxis('Z', vector.z, '#448AFF')}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  axisRow: {
    marginBottom: 10,
  },
  axisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  axisLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  axisValue: {
    fontSize: 13,
    color: Colors.dark.text,
    fontVariant: ['tabular-nums'],
  },
  barBackground: {
    height: 8,
    backgroundColor: Colors.dark.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});

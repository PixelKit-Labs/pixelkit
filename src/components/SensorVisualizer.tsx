import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Vector3D } from '../core/types';
import { Colors } from '../theme/colors';

interface SensorVisualizerProps {
  label: string;
  vector: Vector3D;
  unit?: string;
}

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

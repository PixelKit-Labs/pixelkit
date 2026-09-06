/**
 * @file index.ts
 * @description Master entry barrel for PixelForge SDK.
 * Exports strongly-typed hardware hooks, Tensor AI services, and Material 3 UI primitives.
 *
 * @example
 * ```typescript
 * import {
 *   useSensors,
 *   useHaptics,
 *   useTPU,
 *   useGemini,
 *   useVisionAI,
 *   useDevice,
 *   useADPF,
 *   MetricCard,
 *   HapticButton
 * } from './src';
 * ```
 */

// Core Types & Design System
export * from './core/types';
export * from './theme/colors';

// Hardware & Sensor Hooks
export { useHaptics } from './hardware/useHaptics';
export { useSensors } from './hardware/useSensors';
export { useDevice } from './hardware/useDevice';
export { useBiometrics } from './hardware/useBiometrics';
export { useDisplay } from './hardware/useDisplay';
export { useLocation } from './hardware/useLocation';
export { useSecurity } from './hardware/useSecurity';
export { useADPF } from './hardware/useADPF';
export { useAudio } from './hardware/useAudio';
export { useNFC } from './hardware/useNFC';

// AI & Tensor TPU Hooks
export { useTPU } from './ai/useTPU';
export { useGemini } from './ai/useGemini';
export { useVisionAI } from './ai/useVisionAI';
export { getStoredApiKey, saveApiKey, createGeminiClient } from './ai/geminiClient';

// Reusable UI Primitives
export { HapticButton, type HapticButtonProps } from './components/HapticButton';
export { MetricCard, type MetricCardProps } from './components/MetricCard';
export { SensorVisualizer, type SensorVisualizerProps } from './components/SensorVisualizer';

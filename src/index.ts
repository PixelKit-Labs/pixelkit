/**
 * @file index.ts
 * @description Master entry barrel for PixelKit SDK.
 * Exports strongly-typed hardware hooks, Tensor AI services, and Material 3 UI primitives.
 *
 * @example
 * ```typescript
 * import {
 *   useCPU,
 *   useGPU,
 *   useTPU,
 *   useMemory,
 *   useSensors,
 *   useHaptics,
 *   useSpeechAI,
 *   useGemini,
 *   useGeminiNano,
 *   useVisionAI,
 *   useDevice,
 *   useDisplay,
 *   useBiometrics,
 *   useLocation,
 *   useTorch,
 *   useUWB,
 *   useBLE,
 *   useNFC,
 *   useAudio,
 *   useSecurity,
 *   useADPF,
 *   MetricCard,
 *   HapticButton
 * } from './src';
 * ```
 */

// Core Types & Design System
export * from './core/types';
export * from './core/capabilities';
export * from './theme/colors';

// Device Capability Resolution (read this before any Pro-exclusive hook)
export { useCapabilities } from './hardware/useCapabilities';

// Compute & Silicon Hardware Hooks
export { useCPU } from './hardware/useCPU';
export { useGPU } from './hardware/useGPU';
export { useMemory } from './hardware/useMemory';
export { useADPF } from './hardware/useADPF';
export { useDevice } from './hardware/useDevice';
export { useDisplay } from './hardware/useDisplay';
export { useSecurity } from './hardware/useSecurity';

// Sensor & Radio Hardware Hooks
export { useSensors } from './hardware/useSensors';
export { useHaptics } from './hardware/useHaptics';
export { useCamera } from './hardware/useCamera';
export { useBiometrics } from './hardware/useBiometrics';
export { useLocation } from './hardware/useLocation';
export { useNetwork } from './hardware/useNetwork';
export { useAudio } from './hardware/useAudio';
export { useTorch } from './hardware/useTorch';
export { useBLE } from './hardware/useBLE';
export { useNFC } from './hardware/useNFC';
export { useRadios, type RadioTelemetry } from './hardware/useRadios';

// Pixel Pro Exclusive Hardware Hooks
export { useHiLight, type HiLightMode, type HiLightState } from './hardware/useHiLight';
export { useUWB } from './hardware/useUWB';

// AI, Voice & Tensor TPU Hooks
export { useTPU } from './ai/useTPU';
export { useGemini } from './ai/useGemini';
export { useGeminiNano, buildNanoTurn, NANO_SYSTEM_INSTRUCTION } from './ai/useGeminiNano';
export { useGenAITasks, type TaskTone } from './ai/useGenAITasks';
export { useNaturalLanguageAI } from './ai/useNaturalLanguageAI';
export { useVisionAI } from './ai/useVisionAI';
export { useSpeechAI } from './ai/useSpeechAI';
export { getStoredApiKey, saveApiKey, createGeminiClient } from './ai/geminiClient';

// Reusable UI Primitives
export { HapticButton, type HapticButtonProps } from './components/HapticButton';
export { MetricCard, type MetricCardProps } from './components/MetricCard';
export { SensorVisualizer, type SensorVisualizerProps } from './components/SensorVisualizer';

// Application Screens
export { DashboardScreen } from './screens/DashboardScreen';
export { AILabScreen } from './screens/AILabScreen';
export { SensorsLabScreen } from './screens/SensorsLabScreen';
export { DocsScreen } from './screens/DocsScreen';


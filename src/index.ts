// Core Types & Constants
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
export { HapticButton } from './components/HapticButton';
export { MetricCard } from './components/MetricCard';
export { SensorVisualizer } from './components/SensorVisualizer';

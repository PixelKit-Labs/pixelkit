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
 *   useDevice,
 *   useDisplay,
 *   useBiometrics,
 *   useLocation,
 *   useTorch,
 *   useUWB,
 *   useBLE,
 *   useNFC,
 *   useAudio,
 *   useVideo,
 *   useSpeech,
 *   useSecurity,
 *   useADPF,
 * } from './src';
 * ```
 */

// Core Types & Design System
export * from './core/types';
export * from './core/surface-types';
export * from './core/capabilities';

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
export { useHaptics, HapticEnvelopes } from './hardware/useHaptics';
export { useCamera } from './hardware/useCamera';
export { useBiometrics } from './hardware/useBiometrics';
export { useLocation } from './hardware/useLocation';
export { useNetwork } from './hardware/useNetwork';
export { useAudio } from './hardware/useAudio';
export { useVideo } from './hardware/useVideo';
export { useMediaLibrary, type SavedMedia } from './hardware/useMediaLibrary';
export { useCellular, type CellularGenerationLabel } from './hardware/useCellular';
export { useTorch } from './hardware/useTorch';
export { useBLE } from './hardware/useBLE';
export { useNFC } from './hardware/useNFC';
export { useRadios, type RadioTelemetry } from './hardware/useRadios';

// Pixel Pro Exclusive Hardware Hooks
export { useHiLight, type HiLightMode, type HiLightState } from './hardware/useHiLight';
export { useUWB } from './hardware/useUWB';

// AI, Voice & Tensor TPU Hooks
export { useTPU } from './ai/useTPU';
export { useGemini, type SafetyThreshold, type GroundingSummary } from './ai/useGemini';

// useGeminiNano, useGenAITasks, useVisionAI and useNaturalLanguageAI are exported from
// 'pixelkit/mlkit'. They need @pixelkit/mlkit, whose 19 ML Kit artifacts are a build cost that
// installing the package imposes whether or not anything imports it. See src/mlkit.ts.
export { useSpeechAI } from './ai/useSpeechAI';
export { useSpeech } from './ai/useSpeech';
export { getStoredApiKey, saveApiKey, createGeminiClient } from './ai/geminiClient';


export * from './core/observability';

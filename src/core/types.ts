export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface BarometerData {
  pressure: number; // in hPa
  relativeAltitude?: number; // estimated meters
}

export interface SensorTelemetry {
  accelerometer: Vector3D;
  gyroscope: Vector3D;
  magnetometer: Vector3D;
  barometer: BarometerData;
  lightLux?: number;
  isAvailable: boolean;
}

export type HapticType = 
  | 'selection'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error';

export interface DeviceTelemetry {
  modelName: string;
  brand: string;
  osVersion: string;
  batteryLevel: number;
  isCharging: boolean;
  lowPowerMode: boolean;
  networkType: string;
  isConnected: boolean;
  totalMemoryMB?: number;
}

export interface PerformanceHeadroom {
  cpuHeadroom: number; // 0.0 to 1.0 (1.0 = maximum capacity available)
  gpuHeadroom: number;
  thermalStatus: 'nominal' | 'light' | 'moderate' | 'severe' | 'critical';
  targetFps: number;
  currentFps: number;
}

export interface TPUAcceleration {
  activeDelegate: 'Tensor TPU' | 'NPU' | 'GPU' | 'CPU Fallback';
  isHardwareAccelerated: boolean;
  lastInferenceLatencyMs: number;
  throughputTokensPerSec: number;
  memoryFootprintMB: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  latencyMs?: number;
  tokenCount?: number;
}

export interface VisionAnalysisResult {
  description: string;
  labels: string[];
  latencyMs: number;
  timestamp: number;
}

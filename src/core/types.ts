/**
 * @file types.ts
 * @description Centralized TypeScript definitions and telemetry interfaces for PixelForge SDK.
 * Covers physical sensors, Google Tensor TPU, Titan M3 security, ADPF, and AI pipelines.
 */

/**
 * Represents a 3-dimensional Cartesian vector for spatial orientation.
 */
export interface Vector3D {
  /** X-axis value (lateral tilt or movement) */
  x: number;
  /** Y-axis value (longitudinal tilt or movement) */
  y: number;
  /** Z-axis value (vertical gravitational force or spin) */
  z: number;
}

/**
 * Barometer telemetry representing atmospheric pressure and barometric altitude.
 */
export interface BarometerData {
  /** Atmospheric air pressure in hectopascals (hPa) */
  pressure: number;
  /** Estimated relative altitude in meters calculated via hypsometric equation */
  relativeAltitude?: number;
}

/**
 * Aggregated real-time sensor telemetry from the device's IMU and environment suite.
 */
export interface SensorTelemetry {
  /** 3-axis gravitational acceleration in g-units */
  accelerometer: Vector3D;
  /** 3-axis angular rotational velocity in radians per second (rad/s) */
  gyroscope: Vector3D;
  /** 3-axis geomagnetic field strength in microteslas (μT) */
  magnetometer: Vector3D;
  /** Barometric air pressure and altitude estimation */
  barometer: BarometerData;
  /** Ambient light level measured by the forward photodiode in Lux */
  lightLux?: number;
  /** Whether the physical hardware sensors are available and actively streaming */
  isAvailable: boolean;
}

/**
 * Linear Resonant Actuator (LRA) haptic vibration patterns.
 */
export type HapticType = 
  | 'selection' // Ultra-light tactile click for switches and pickers
  | 'light'     // Subtle mechanical tap for button presses
  | 'medium'    // Solid tactile feedback for toggles and draggable items
  | 'heavy'     // Firm thud for confirmations or significant actions
  | 'success'   // Double-pulse positive affirmation pattern
  | 'warning'   // Pulsed alert pattern
  | 'error';    // Rapid triple-pulse warning pattern

/**
 * Hardware identification, battery telemetry, and network status.
 */
export interface DeviceTelemetry {
  /** Commercial model name (e.g. "Pixel 11 Pro") */
  modelName: string;
  /** Hardware manufacturer brand (e.g. "Google") */
  brand: string;
  /** Operating system version (e.g. "Android 16") */
  osVersion: string;
  /** Battery percentage (0 to 100) */
  batteryLevel: number;
  /** Whether the device is plugged into AC, USB, or Qi wireless charging */
  isCharging: boolean;
  /** Whether Android Battery Saver mode is currently active */
  lowPowerMode: boolean;
  /** Active network interface type ('WIFI', 'CELLULAR', 'UNKNOWN') */
  networkType: string;
  /** Whether the device has an active internet route */
  isConnected: boolean;
  /** Total system LPDDR5X RAM in megabytes */
  totalMemoryMB?: number;
}

/**
 * Android Dynamic Performance Framework (ADPF) real-time compute telemetry.
 */
export interface PerformanceHeadroom {
  /** CPU headroom ratio (0.0 to 1.0; 1.0 = maximum capacity remaining) */
  cpuHeadroom: number;
  /** GPU headroom ratio (0.0 to 1.0) */
  gpuHeadroom: number;
  /** Kernel thermal state indicating throttling level */
  thermalStatus: 'nominal' | 'light' | 'moderate' | 'severe' | 'critical';
  /** Target display refresh rate in Hz (e.g. 120Hz LTPO) */
  targetFps: number;
  /** Real-time rendered frames per second */
  currentFps: number;
}

/**
 * Google Tensor TPU (Neural Processing Unit) acceleration metrics.
 */
export interface TPUAcceleration {
  /** Active hardware execution delegate */
  activeDelegate: 'Tensor TPU' | 'NPU' | 'GPU' | 'CPU Fallback';
  /** Whether neural tensor operations are accelerated by dedicated silicon */
  isHardwareAccelerated: boolean;
  /** Latency of the most recent neural inference run in milliseconds */
  lastInferenceLatencyMs: number;
  /** Estimated throughput in tokens per second */
  throughputTokensPerSec: number;
  /** Memory footprint allocated by on-device model weights in MB */
  memoryFootprintMB: number;
}

/**
 * Conversational message format for AI chat and reasoning.
 */
export interface AIMessage {
  /** Unique message identifier */
  id: string;
  /** Speaker role: 'user', 'model' (assistant), or 'system' */
  role: 'user' | 'model' | 'system';
  /** Text content of the prompt or reply */
  content: string;
  /** Epoch timestamp in milliseconds */
  timestamp: number;
  /** Inference execution latency in milliseconds */
  latencyMs?: number;
  /** Approximate token count of the message */
  tokenCount?: number;
}

/**
 * Output data structure from Multimodal Vision AI analysis.
 */
export interface VisionAnalysisResult {
  /** High-level textual description of the visual scene */
  description: string;
  /** Array of recognized labels, objects, and attributes */
  labels: string[];
  /** Vision model inference latency in milliseconds */
  latencyMs: number;
  /** Epoch timestamp of the capture */
  timestamp: number;
}

/**
 * Contactless NFC tag payload and metadata.
 */
export interface NFCTag {
  /** Hexadecimal hardware UID of the physical tag */
  id: string;
  /** Textual or NDEF URI payload read from the tag */
  payload: string;
  /** Wireless standard technology type */
  tech: 'NfcA' | 'IsoDep' | 'Ndef';
  /** Timestamp when the tag was scanned */
  timestamp: number;
}

/**
 * Hardware biometric readiness and enrolled authenticators.
 */
export interface BiometricState {
  /** Whether physical biometric sensor hardware exists */
  hasHardware: boolean;
  /** Whether the user has enrolled fingerprints or face data */
  isEnrolled: boolean;
  /** List of supported modalities ('Fingerprint', 'Face Unlock', etc.) */
  supportedTypes: string[];
}

/**
 * GNSS multi-band satellite location telemetry.
 */
export interface LocationTelemetry {
  /** Latitude in decimal degrees */
  latitude: number;
  /** Longitude in decimal degrees */
  longitude: number;
  /** Altitude above sea level in meters */
  altitude: number | null;
  /** Horizontal positional accuracy radius in meters */
  accuracy: number | null;
  /** Direction of travel in degrees (0 = North) */
  heading: number | null;
  /** Ground speed in meters per second */
  speed: number | null;
  /** Whether fine location permissions are granted */
  hasPermission: boolean;
}

/**
 * Multi-core CPU cluster telemetry and compute metrics.
 */
export interface CPUTelemetry {
  /** CPU core topology (e.g. "1x Prime C1-Ultra @ 4.11GHz + 4x C-1 Pro @ 3.38GHz + 2x C-1 Pro @ 2.65GHz") */
  coreTopology: string;
  /** Number of active CPU execution cores (7 cores on Tensor G6) */
  coreCount: number;
  /** Estimated CPU load percentage (0 to 100) */
  cpuLoadPercent: number;
  /** Execution thread frequency governor status */
  governorMode: 'performance' | 'balanced' | 'powersave';
  /** Last multi-threaded compute benchmark duration in milliseconds */
  lastBenchmarkDurationMs: number;
  /** Semiconductor fabrication node */
  nodeProcess?: string;
}

/**
 * GPU graphics acceleration and Vulkan/OpenGLES telemetry.
 */
export interface GPUTelemetry {
  /** Active GPU graphics architecture name */
  gpuRenderer: string;
  /** Supported graphics API (e.g. 'Vulkan 1.3', 'OpenGL ES 3.2') */
  graphicsApi: string;
  /** Average frame render time in milliseconds (target <= 8.33ms for 120 FPS) */
  frameRenderTimeMs: number;
  /** Number of dropped frames in the last observation window */
  droppedFrameCount: number;
  /** Estimated GPU memory utilization in MB */
  gpuMemoryUsageMB: number;
}

/**
 * LPDDR5X system memory and cache metrics.
 */
export interface MemoryTelemetry {
  /** Total system physical RAM in MB */
  totalRAMMB: number;
  /** Currently allocated RAM in MB */
  usedRAMMB: number;
  /** Free available RAM in MB */
  freeRAMMB: number;
  /** Whether the OS Low Memory Killer has issued a memory pressure warning */
  isLowMemory: boolean;
}

/**
 * Bluetooth Low Energy (BLE) peripheral discovery data.
 */
export interface BLEPeripheral {
  /** Unique MAC or Bluetooth UUID */
  id: string;
  /** Advertised device name */
  name: string;
  /** Received Signal Strength Indicator in dBm */
  rssi: number;
  /** Estimated distance in meters based on RSSI path-loss */
  estimatedDistanceMeters: number;
  /** Timestamp when beacon/advertisement was received */
  lastSeenTimestamp: number;
}

/**
 * Pixel Pro infrared thermometer temperature reading.
 */
export interface TemperatureReading {
  /** Measured temperature in Celsius */
  celsius: number;
  /** Measured temperature in Fahrenheit */
  fahrenheit: number;
  /** Target surface emissivity preset ('default', 'liquid', 'organic', 'metal') */
  materialPreset: string;
  /** Timestamp of reading */
  timestamp: number;
}

/**
 * Ultra-Wideband (UWB) high-precision spatial tracking target.
 */
export interface UWBSpatialTarget {
  /** Identifier of the target UWB anchor or peer device */
  deviceId: string;
  /** Centimeter-level distance in meters */
  distanceMeters: number;
  /** Horizontal azimuth angle in degrees (-180 to +180) */
  azimuthDegrees: number;
  /** Vertical elevation angle in degrees (-90 to +90) */
  elevationDegrees: number;
  /** Line-of-sight signal quality (0.0 to 1.0) */
  signalQuality: number;
}

/**
 * Real-time sensor-level tone mapping styles for Pixel 11 Pro Camera Looks.
 */
export type CameraLook =
  | 'Original'
  | 'Natural'
  | 'Shadows'
  | 'Vanilla'
  | 'Editorial'
  | 'Velvet'
  | 'Classic'
  | 'Digi'
  | 'Black Tie'
  | 'Minimal';

/**
 * Camera lens configuration and zoom ratio telemetry.
 */
export interface CameraTelemetry {
  /** Selected lens orientation: 'back' (main array) or 'front' (selfie) */
  facing: 'back' | 'front';
  /** Optical/digital zoom factor (e.g. 0.5x ultra-wide, 1.0x wide, 5.0x periscope telephoto up to 120x AI Zoom) */
  zoomFactor: number;
  /** Maximum zoom ceiling supported (120x Super Res Zoom on Pixel 11 Pro) */
  maxZoomFactor: number;
  /** Flash illumination mode ('auto', 'on', 'off') */
  flashMode: 'auto' | 'on' | 'off';
  /** Whether camera hardware permission has been granted */
  hasPermission: boolean;
  /** Active sensor-level Camera Look profile */
  selectedLook: CameraLook;
  /** Whether on-device Ultra Low Light Video neural denoising is active (5-10 lux) */
  isUltraLowLightVideoActive: boolean;
}

/**
 * Detailed network interface and carrier telemetry.
 */
export interface NetworkTelemetry {
  /** IP address string of device */
  ipAddress: string | null;
  /** Network connection type (WIFI, CELLULAR, NONE, UNKNOWN) */
  networkType: string;
  /** Whether internet is reachable */
  isConnected: boolean;
  /** Whether device is metered (e.g. cellular data) */
  isMetered: boolean;
  /** Whether airplane mode is enabled */
  isAirplaneMode: boolean;
}

/**
 * Speech recognition and voice transcription output.
 */
export interface SpeechTranscriptionResult {
  /** Transcribed textual content */
  transcript: string;
  /** Confidence score between 0.0 and 1.0 */
  confidence: number;
  /** Duration of recorded audio in seconds */
  durationSeconds: number;
  /** Time taken to perform transcription in milliseconds */
  latencyMs: number;
  /** Language detected or specified (e.g. 'en-US') */
  language: string;
}


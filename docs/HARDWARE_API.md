# PixelForge Hardware API Reference ⚡
> **Exhaustive Technical Manual for Google Pixel 11 Pro Silicon & Neural Architecture**

This document provides a comprehensive technical reference for every hardware hook and module in the PixelForge SDK. All modules are designed to run in React Native (Expo SDK 57) on the **Google Pixel 11 Pro**.

---

## 📑 Table of Contents

1. [Architectural Overview](#architectural-overview)
2. [Silicon & Compute Hooks](#silicon--compute-hooks)
   - [useCPU](#usecpu)
   - [useGPU](#usegpu)
   - [useTPU](#usetpu)
   - [useMemory](#usememory)
   - [useADPF](#useadpf)
3. [Pixel Pro Exclusive Silicon](#pixel-pro-exclusive-silicon)
   - [useTemperature](#usetemperature)
   - [useUWB](#useuwb)
4. [Neural & Intelligence Hooks](#neural--intelligence-hooks)
   - [useGemini](#usegemini)
   - [useSpeechAI](#usespeechai)
   - [useVisionAI](#usevisionai)
5. [Sensors & Physical Actuators](#sensors--physical-actuators)
   - [useSensors](#usesensors)
   - [useCamera](#usecamera)
   - [useTorch](#usetorch)
   - [useHaptics](#usehaptics)
6. [Radios & Hardware Security](#radios--hardware-security)
   - [useBiometrics](#usebiometrics)
   - [useSecurity](#usesecurity)
   - [useBLE](#useble)
   - [useNFC](#usenfc)
   - [useLocation](#uselocation)
7. [System & Media Hooks](#system--media-hooks)
   - [useAudio](#useaudio)
   - [useDisplay](#usedisplay)
   - [useDevice](#usedevice)
   - [useNetwork](#usenetwork)

---

## 🏛️ Architectural Overview

PixelForge connects React Native applications directly to the bare silicon of the Google Pixel 11 Pro.

All hardware hooks are exported directly from ./src:
\\\	ypescript
import { 
  useCPU, 
  useGPU, 
  useTPU, 
  useMemory, 
  useADPF, 
  useTemperature, 
  useUWB, 
  useSensors, 
  useHaptics, 
  useSpeechAI, 
  useGemini, 
  useVisionAI 
} from './src';
\\\

---

## 💻 Silicon & Compute Hooks

### \useCPU\
* **File Path**: \src/hardware/useCPU.ts\
* **Target Hardware**: Google Tensor Multi-Core CPU Cluster (1x Cortex-X925 Prime @ 3.4GHz, 5x Cortex-A725 Performance @ 2.85GHz, 2x Cortex-A520 Efficiency @ 2.0GHz).
* **Description**: Monitors multi-core topology, dynamic frequency scaling, real-time CPU load estimates, and runs multi-threaded prime factorization benchmarks.

#### Interface
\\\	ypescript
interface CoreInfo {
  id: number;
  type: 'prime' | 'performance' | 'efficiency';
  clockSpeedMhz: number;
  architecture: string;
}

interface CPUState {
  coreTopology: CoreInfo[];
  totalCores: number;
  cpuLoadPercent: number;
  isBenchmarking: boolean;
  lastBenchmarkScore: number | null;
  benchmarkCPU: (iterations?: number) => Promise<number>;
}
\\\

#### Example Usage
\\\	sx
import { useCPU } from './src';

function CPUStats() {
  const { totalCores, cpuLoadPercent, benchmarkCPU, isBenchmarking } = useCPU();

  return (
    <View>
      <Text>CPU Cores: {totalCores} (Load: {cpuLoadPercent}%)</Text>
      <Button 
        title={isBenchmarking ? Benchmarking... : Run Compute Benchmark} 
        onPress={() => benchmarkCPU(100000)} 
      />
    </View>
  );
}
\\\

---

### \useGPU\
* **File Path**: \src/hardware/useGPU.ts\
* **Target Hardware**: Arm Mali / Immortalis GPU running Vulkan 1.3 / OpenGL ES 3.2.
* **Description**: Monitors GPU render pacing against the 120Hz LTPO display target (8.33ms budget). Detects dropped frames, stutter conditions, and estimates GPU memory consumption.

#### Interface
\\\	ypescript
interface GPUState {
  api: 'Vulkan 1.3' | 'OpenGL ES 3.2';
  targetFPS: 120;
  frameBudgetMs: 8.33;
  frameRenderTimeMs: number;
  droppedFrameCount: number;
  gpuMemoryUsageMB: number;
  isStuttering: boolean;
  renderPacingScore: number; // 0 - 100%
}
\\\

---

### \useTPU\
* **File Path**: \src/ai/useTPU.ts\
* **Target Hardware**: Google Tensor Neural Processing Unit (TPU).
* **Description**: Tracks hardware neural acceleration delegates (NNAPI, LiteRT / XNNPACK, GPU Fallback). Benchmarks tensor operations and token generation throughput.

#### Interface
\\\	ypescript
interface TPUState {
  isAvailable: boolean;
  activeDelegate: 'NNAPI_TPU' | 'LiteRT_XNNPACK' | 'GPU_FALLBACK';
  quantization: 'INT8' | 'FP16' | 'FP32';
  lastInferenceLatencyMs: number;
  throughputTokensPerSec: number;
  isEvaluating: boolean;
  runInferenceBenchmark: (tensorSize?: number) => Promise<{ latencyMs: number; tokensPerSec: number }>;
}
\\\

---

### \useMemory\
* **File Path**: \src/hardware/useMemory.ts\
* **Target Hardware**: 16 GB LPDDR5X Ultra-High-Speed Unified RAM.
* **Description**: Live telemetry of physical memory, system heap allocation, Low Memory Killer (LMK) protection thresholds, and cache purging methods.

#### Interface
\\\	ypescript
interface MemoryState {
  totalRAMMB: number;
  usedRAMMB: number;
  freeRAMMB: number;
  usagePercent: number;
  isLowMemory: boolean;
  memoryThresholdMB: number;
  purgeCaches: () => Promise<void>;
}
\\\

---

### \useADPF\
* **File Path**: \src/hardware/useADPF.ts\
* **Target Hardware**: Android Dynamic Performance Framework (ADPF) Kernel Subsystem.
* **Description**: Queries thermal headroom and GPU/CPU power budgets directly from the Android kernel to prevent thermal throttling during intensive tasks.

#### Interface
\\\	ypescript
type ThermalStatus = 'nominal' | 'light' | 'moderate' | 'severe' | 'critical' | 'emergency';

interface ADPFState {
  thermalStatus: ThermalStatus;
  thermalHeadroom: number; // 0.0 (cool) to 1.0 (throttling imminent)
  powerEfficiencyMode: boolean;
  reportActualWorkDuration: (durationMs: number) => void;
}
\\\

---

## 🎯 Pixel Pro Exclusive Silicon

### \useTemperature\
* **File Path**: \src/hardware/useTemperature.ts\
* **Target Hardware**: Rear Camera Bar Non-Contact Infrared Thermopile Sensor.
* **Description**: Samples thermal radiation from surfaces and liquids without physical contact. Includes material emissivity presets (Glass, Metal, Liquid, Food, Skin).

#### Interface
\\\	ypescript
type MaterialPreset = 'default' | 'metal' | 'liquid' | 'food' | 'skin';

interface TemperatureReading {
  celsius: number;
  fahrenheit: number;
  materialPreset: MaterialPreset;
  confidence: number;
  timestamp: number;
}

interface TemperatureState {
  reading: TemperatureReading;
  isMeasuring: boolean;
  measureTemperature: (preset?: MaterialPreset) => Promise<TemperatureReading>;
}
\\\

---

### \useUWB\
* **File Path**: \src/hardware/useUWB.ts\
* **Target Hardware**: Ultra-Wideband (UWB) Spatial Radar Transceiver.
* **Description**: Performs centimeter-precision spatial distance ranging and Angle-of-Arrival (AoA) azimuth/elevation tracking for spatial anchors and smart devices.

#### Interface
\\\	ypescript
interface UWBTarget {
  id: string;
  name: string;
  distanceMeters: number; // Centimeter precision (e.g. 0.85m)
  azimuthDegrees: number; // -90° to +90°
  elevationDegrees: number;
  signalStrengthDbm: number;
}

interface UWBState {
  isSupported: boolean;
  isRanging: boolean;
  activeTargets: UWBTarget[];
  startRanging: () => Promise<void>;
  stopRanging: () => void;
}
\\\

---

## 🧠 Neural & Intelligence Hooks

### \useGemini\
* **File Path**: \src/ai/useGemini.ts\
* **Target Hardware**: Google Gen AI SDK (\@google/genai\) configured for Gemini 2.5 Flash.
* **Description**: Manages multi-turn conversations, token generation metrics, streaming thoughts, tool calls, and offline simulation fallback.

#### Interface
\\\	ypescript
interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

interface GeminiState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (prompt: string) => Promise<string>;
  clearHistory: () => void;
  apiKey: string | null;
  setApiKey: (key: string) => Promise<void>;
}
\\\

---

### \useSpeechAI\
* **File Path**: \src/ai/useSpeechAI.ts\
* **Target Hardware**: Multi-Mic Acoustic Beamforming Array + Speech-to-Text Pipeline.
* **Description**: Records voice audio with real-time decibel metering, submits speech packets to AI models, and returns transcribed tokens.

#### Interface
\\\	ypescript
interface SpeechResult {
  transcript: string;
  confidence: number;
  durationMs: number;
}

interface SpeechAIState {
  isListening: boolean;
  isTranscribing: boolean;
  voiceDecibels: number; // -160 to 0 dBFS
  lastResult: SpeechResult | null;
  startListening: () => Promise<void>;
  stopListeningAndTranscribe: () => Promise<SpeechResult | null>;
}
\\\

---

### \useVisionAI\
* **File Path**: \src/ai/useVisionAI.ts\
* **Target Hardware**: CameraX Optical Stack + Multimodal Gemini Vision.
* **Description**: Takes raw camera photo buffers, downscales for optimal token economy, and submits multimodal prompts to Gemini for scene analysis.

#### Interface
\\\	ypescript
interface VisionAnalysis {
  description: string;
  objectsDetected: string[];
  tokensConsumed: number;
  timestamp: number;
}

interface VisionAIState {
  isAnalyzing: boolean;
  analysis: VisionAnalysis | null;
  captureAndAnalyze: (cameraRef: any, customPrompt?: string) => Promise<VisionAnalysis | null>;
}
\\\

---

## 📡 Sensors & Physical Actuators

### \useSensors\
* **File Path**: \src/hardware/useSensors.ts\
* **Target Hardware**: InvenSense 6-Axis IMU (Accelerometer + Gyroscope), Magnetometer (Compass), Bosch Barometer (Altimeter), and Photodiode Light Sensor.
* **Description**: Real-time multi-sensor telemetry with configurable update intervals. Computes relative altitude via the international hypsometric barometric formula.

#### Interface
\\\	ypescript
interface SensorData {
  x: number;
  y: number;
  z: number;
}

interface BarometerData {
  pressure: number; // hPa
  relativeAltitude: number; // meters
}

interface SensorsState {
  accelerometer: SensorData;
  gyroscope: SensorData;
  magnetometer: SensorData;
  barometer: BarometerData;
  lightSensor: { illuminance: number }; // lux
  isAvailable: boolean;
  setUpdateInterval: (intervalMs: number) => void;
}
\\\

---

### \useHaptics\
* **File Path**: \src/hardware/useHaptics.ts\
* **Target Hardware**: Linear Resonant Actuator (LRA) Haptic Engine.
* **Description**: High-fidelity tactile patterns matching Pixel mechanical click profiles.

#### Interface
\\\	ypescript
interface HapticsState {
  selection: () => Promise<void>; // Subtle tick
  light: () => Promise<void>;     // Soft tap
  medium: () => Promise<void>;    // Standard action
  heavy: () => Promise<void>;     // Strong click
  success: () => Promise<void>;   // Double pulse
  warning: () => Promise<void>;   // Buzzing warning
  error: () => Promise<void>;     // Triple rapid pulse
}
\\\

---

### \useCamera\
* **File Path**: \src/hardware/useCamera.ts\
* **Target Hardware**: Triple Camera Array (0.5x Ultra-Wide, 1.0x Wide, 5.0x Periscope Telephoto).
* **Description**: Controls CameraX lifecycle, active lens switching, zoom factors, and flash modes.

---

### \useTorch\
* **File Path**: \src/hardware/useTorch.ts\
* **Target Hardware**: Rear Dual-LED Camera Bar Flash.
* **Description**: Direct hardware flashlight toggle and rhythmic emergency SOS optical strobe.

---

## 🔐 Radios & Hardware Security

### \useBiometrics\
* **File Path**: \src/hardware/useBiometrics.ts\
* **Target Hardware**: Titan M2 Under-Display Ultrasonic Fingerprint & Class 3 3D Face Unlock.
* **Description**: Hardware-backed biometric authentication.

### \useSecurity\
* **File Path**: \src/hardware/useSecurity.ts\
* **Target Hardware**: Titan M2 Hardware Security Module (HSM).
* **Description**: Encrypted hardware Keystore storage via \expo-secure-store\.

### \useBLE\
* **File Path**: \src/hardware/useBLE.ts\
* **Target Hardware**: Bluetooth 5.4 Low Energy Radio.
* **Description**: Discovery of nearby BLE peripherals, beacons, and RSSI proximity tracking.

### \useNFC\
* **File Path**: \src/hardware/useNFC.ts\
* **Target Hardware**: Near Field Communication (NFC) Controller.
* **Description**: Reads contactless NDEF records and RFID tags.

### \useLocation\
* **File Path**: \src/hardware/useLocation.ts\
* **Target Hardware**: Dual-Band Multi-Constellation GNSS (GPS L1/L5, Galileo, GLONASS, BeiDou).
* **Description**: High-accuracy geographic coordinates, bearing, speed, and geodetic altitude.

---

## 📱 System & Media Hooks

### \useAudio\
* **File Path**: \src/hardware/useAudio.ts\
* **Target Hardware**: Quad-Microphone Studio Array.
* **Description**: Acoustic recording and real-time peak audio level metering in dBFS.

### \useDisplay\
* **File Path**: \src/hardware/useDisplay.ts\
* **Target Hardware**: 1-120Hz LTPO Super Actua OLED Display.
* **Description**: Display wake-lock management and screen brightness control.

### \useDevice\
* **File Path**: \src/hardware/useDevice.ts\
* **Target Hardware**: Android HAL & Power Management IC (PMIC).
* **Description**: Battery level, charging state, device thermals, and OS specifications.

### \useNetwork\
* **File Path**: \src/hardware/useNetwork.ts\
* **Target Hardware**: Wi-Fi 7 (802.11be) & 5G Sub-6/mmWave Modem.
* **Description**: IP address inspection, cellular status, and airplane mode detection.

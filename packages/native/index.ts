/**
 * @file packages/native/index.ts
 * @description TypeScript bridge for the PixelNative Expo Module: real Android telemetry and actuators
 * (SoC identity, CPU, memory, thermal/ADPF headroom, display modes, GPU, torch, haptic envelopes).
 * Resolves to `null` on web or when the native module is not compiled in (Expo Go), so hooks can
 * report "unavailable" instead of fabricating values.
 */

import { NativeModule, requireOptionalNativeModule } from 'expo';

export type SocInfo = {
  socModel: string | null; socManufacturer: string | null; hardware: string; device: string; model: string;
  buildId: string; release: string; sdkInt: number; sdkIntFull: number | null; securityPatch: string; supportedAbis: string[];
};

export type CoreFrequency = { index: number; part: string | null; name: string | null; curMHz: number | null; maxMHz: number | null; minMHz: number | null };
export type CpuInfo = {
  coreCount: number; implementer: string | null;
  clusters: { part: string | null; name: string | null; maxMHz: number | null; count: number }[];
  governor: string | null; cores: CoreFrequency[];
};
export type CpuLoad = { appCpuPercent: number | null; frequencyUtilizationPercent: number | null; cores: CoreFrequency[] };

export type MemoryInfo = {
  totalBytes: number; availableBytes: number; lowMemoryThresholdBytes: number; isLowMemory: boolean;
  appJavaHeapUsedBytes: number; appJavaHeapMaxBytes: number; appNativeHeapBytes: number;
  memoryClassMB: number; largeMemoryClassMB: number;
};

export type ThermalInfo = {
  thermalHeadroom: number | null; thermalStatus: number; thresholds: Record<string, number> | null;
  cpuHeadroom: number | null; gpuHeadroom: number | null;
};

export type DisplayMode = { id: number; width: number; height: number; refreshRate: number };
export type DisplayInfo = {
  refreshRate: number; modeId: number; physicalWidth: number; physicalHeight: number; densityDpi: number;
  modes: DisplayMode[]; hdrTypes: number[] | null; maxLuminance: number | null; maxAverageLuminance: number | null;
  isHdr: boolean; isWideColorGamut: boolean; hasArrSupport: boolean | null; supportedRefreshRates: number[] | null;
  suggestedFrameRateHigh: number | null; suggestedFrameRateNormal: number | null;
};

export type GpuInfo = { renderer: string | null; vendor: string | null; glVersion: string | null; vulkanVersion: string | null; error?: string };
export type FrameStats = { fps: number; avgFrameMs: number; maxFrameMs: number; jankFrames: number; frames: number; expectedFrameMs: number };

export type TorchInfo = { available: boolean; cameraId?: string; maxStrengthLevel?: number | null; defaultStrengthLevel?: number | null; currentStrengthLevel?: number | null };
export type TorchState = { cameraId: string; enabled: boolean; unavailable?: boolean };

export type CameraExtensionSupport = {
  night: boolean;
  hdr: boolean;
  bokeh: boolean;
  faceRetouch: boolean;
  auto: boolean;
};

export type CameraExtensionInfo = {
  cameraId: string;
  facing: 'back' | 'front' | 'external';
  extensions: CameraExtensionSupport;
  supportedExtensionIds: number[];
};

export type CameraExtensionsResult = {
  available: boolean;
  cameras: CameraExtensionInfo[];
  hasNightSight: boolean;
  hasUltraHdr: boolean;
  hasPortraitBokeh: boolean;
  error?: string;
};

export type AppFunctionsInfo = {
  isSupported: boolean;
  serviceFound: boolean;
  apiLevel: number;
  serviceName: string | null;
  interfaceDescriptor: string | null;
  error?: string | null;
};

export type HeadTrackingMode = 'unsupported' | 'disabled' | 'relative_world' | 'relative_device';

export type SpatialAudioInfo = {
  isSupported: boolean;
  isAvailable: boolean;
  isEnabled: boolean;
  hasHeadTracker: boolean;
  headTrackingMode: HeadTrackingMode;
  immersiveAudioLevel: number;
  hasDynamicHeadTrackerFeature: boolean;
  error?: string | null;
};

export type HapticsInfo = {
  hasVibrator: boolean; hasAmplitudeControl: boolean; envelopeEffectsSupported: boolean;
  resonantFrequencyHz: number | null; qFactor: number | null; supportedPrimitives: string[];
};
export type EnvelopePoint = { intensity: number; sharpness: number; durationMs: number };
export type PrimitiveStep = { primitive: 'CLICK' | 'TICK' | 'THUD' | 'SPIN' | 'QUICK_RISE' | 'SLOW_RISE' | 'QUICK_FALL' | 'LOW_TICK'; scale?: number; delayMs?: number };

export type PackageVersion = { installed: boolean; versionName: string | null; versionCode: number | null };

export type BatteryHealth = 'GOOD' | 'OVERHEAT' | 'DEAD' | 'OVER_VOLTAGE' | 'UNSPECIFIED_FAILURE' | 'COLD' | 'UNKNOWN';
export type PluggedSource = 'AC' | 'USB' | 'WIRELESS' | 'DOCK' | 'NONE';
export type BatteryStatus = 'CHARGING' | 'DISCHARGING' | 'FULL' | 'NOT_CHARGING' | 'UNKNOWN';

export type ThermalZone = {
  name: string;
  type: string;
  tempC: number | null;
};

export type BatteryTelemetry = {
  temperatureC: number | null;
  voltageMv: number | null;
  currentNowMa: number | null;
  currentAvgMa: number | null;
  powerWatts: number | null;
  health: BatteryHealth;
  plugged: PluggedSource;
  status: BatteryStatus;
  technology: string | null;
  cycleCount: number | null;
  chargeCounterMah: number | null;
  energyCounterMwh: number | null;
  thermalZones: ThermalZone[];
};

export type BondedDevice = {
  name: string;
  address: string;
  type: number;
  bondState: 'BONDED' | 'BONDING' | 'NONE';
};

export type RadioInfo = {
  nfc: {
    supported: boolean;
    enabled: boolean;
    observeModeSupported: boolean;
    antennaState: 'ENABLED' | 'DISABLED' | 'UNAVAILABLE';
  };
  bluetooth: {
    supported: boolean;
    bleSupported: boolean;
    enabled: boolean;
    state: 'ON' | 'OFF' | 'TURNING_ON' | 'TURNING_OFF';
    channelSounding: boolean;
    bondedDevices: BondedDevice[];
  };
  uwb: {
    supported: boolean;
    enabled: boolean;
    chipId: string | null;
    rangingApiSupported: boolean;
  };
  wifiRtt: {
    supported: boolean;
    available: boolean;
  };
  satellite: {
    supported: boolean;
  };
};

export type AppFunctionInfo = {
  id: string;
  name: string;
  description: string;
  category: 'actuator' | 'telemetry' | 'system' | 'intelligence';
  target: 'hardware' | 'daemon' | 'service' | 'tpu_aicore';
  enabled: boolean;
};

export type DiscoveredBleDevice = {
  name: string;
  address: string;
  rssi: number;
  txPower?: number | null;
  timestampNanos: number;
  serviceUuids: string[];
};

export type UwbRangingResult = {
  success: boolean;
  sessionId: number;
  technology: string;
  serviceAvailable: boolean;
  serviceName: string;
  rangingFeature: boolean;
  status: string;
  timestampMs: number;
};

/** One decoded NDEF record from a tag. */
export type NdefRecordInfo = {
  /** Type Name Format: 1 well-known, 2 MIME, 3 absolute URI, 4 external. */
  tnf: number;
  /** Record type, for example 'T' for text or 'U' for URI. */
  type: string;
  /** Decoded text. Text records have their language prefix stripped. */
  payload: string;
  /** Raw payload length in bytes. */
  bytes: number;
  /** Resolved URI when the record carries one. */
  uri: string | null;
};

/** A tag that entered the reader field. Every field is read from the tag. */
export type NfcTagEvent = {
  /** Hardware identifier as colon-separated hex. */
  id: string;
  /** Technologies the tag supports, for example ['Ndef', 'NfcA']. */
  techs: string[];
  /** NDEF specification the tag conforms to, when it is NDEF. */
  type: string | null;
  /** Capacity in bytes for NDEF tags. */
  maxSize: number | null;
  /** Whether the tag can be written. */
  writable: boolean | null;
  records: NdefRecordInfo[];
  /** True when a queued write was applied to this tag. */
  written: boolean;
  /** Why a queued write failed, if it did. */
  writeError: string | null;
  timestamp: number;
};

type Events = {
  onThermalStatus(e: { status: number }): void;
  onFrameStats(e: FrameStats): void;
  onTorchState(e: TorchState): void;
  onSpeechPartial(e: { requestId: string; text: string }): void;
  onSpeechResult(e: { requestId: string; text: string; isFinal: boolean }): void;
  onSpeechRms(e: { requestId: string; rmsdB: number }): void;
  onSpeechError(e: { requestId: string; error: string; code?: number }): void;
  onBleDeviceFound(e: DiscoveredBleDevice): void;
  onNfcTag(e: NfcTagEvent): void;
  onNfcError(e: { id: string; message: string }): void;
};

declare class PixelNativeModule extends NativeModule<Events> {
  getSocInfo(): SocInfo;
  hasSystemFeature(name: string): boolean;
  getPackageVersion(pkg: string): PackageVersion;
  getCpuInfo(): CpuInfo;
  getCpuLoad(): CpuLoad;
  getMemoryInfo(): MemoryInfo;
  requestGc(): MemoryInfo;
  getThermal(): ThermalInfo;
  getDisplayInfo(): DisplayInfo;
  setPreferredRefreshRate(rate: number): Promise<boolean>;
  getGpuInfo(): GpuInfo;
  getTorchInfo(): TorchInfo;
  setTorch(on: boolean, strengthLevel?: number | null): Promise<boolean>;
  getCameraExtensions(): CameraExtensionsResult;
  getAppFunctionsInfo(): AppFunctionsInfo;
  getSpatialAudioInfo(): SpatialAudioInfo;
  getHapticsInfo(): HapticsInfo;
  playEnvelope(points: EnvelopePoint[], initialSharpness?: number | null): boolean;
  playPrimitives(steps: PrimitiveStep[]): boolean;
  cancelVibration(): boolean;
  getBatteryTelemetry(): BatteryTelemetry;
  getRadioInfo(): RadioInfo;
  startBleScan(timeoutMs?: number): Promise<{ success: boolean; scanning: boolean; error?: string }>;
  stopBleScan(): boolean;
  getDiscoveredBleDevices(): DiscoveredBleDevice[];
  /** Enables NfcAdapter reader mode on the foreground Activity; tags arrive on . */
  startNfcReader(flags?: number): Promise<{ success: boolean; flags?: number; started?: boolean; error?: string }>;
  /** Disables reader mode. Safe when no reader is running. */
  stopNfcReader(): Promise<{ success: boolean }>;
  /** Queues a text record written to the next tag that enters the field. */
  writeNdefText(text: string): Promise<{ success: boolean; queuedBytes?: number; error?: string }>;
  isNfcReaderActive(): boolean;
  startUwbRanging(sessionId?: number): Promise<UwbRangingResult>;
  stopUwbRanging(): boolean;
  isOfflineSpeechAvailable(): boolean;
  startSpeechRecognition(requestId: string, onDevice: boolean): Promise<boolean>;
  stopSpeechRecognition(): boolean;
  cancelSpeechRecognition(): boolean;
  getAppFunctions(): AppFunctionInfo[];
  executeAppFunction(functionId: string, params?: Record<string, any>): Promise<any>;
}

/** `null` when the native module is absent (web, Expo Go, or not yet built). */
const PixelNative = requireOptionalNativeModule<PixelNativeModule>('PixelNative');

export default PixelNative;
export const isPixelNativeAvailable = PixelNative != null;

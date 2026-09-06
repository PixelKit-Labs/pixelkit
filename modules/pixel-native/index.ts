/**
 * @file modules/pixel-native/index.ts
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

export type HapticsInfo = {
  hasVibrator: boolean; hasAmplitudeControl: boolean; envelopeEffectsSupported: boolean;
  resonantFrequencyHz: number | null; qFactor: number | null; supportedPrimitives: string[];
};
export type EnvelopePoint = { intensity: number; sharpness: number; durationMs: number };
export type PrimitiveStep = { primitive: 'CLICK' | 'TICK' | 'THUD' | 'SPIN' | 'QUICK_RISE' | 'SLOW_RISE' | 'QUICK_FALL' | 'LOW_TICK'; scale?: number; delayMs?: number };

export type PackageVersion = { installed: boolean; versionName: string | null; versionCode: number | null };

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

type Events = {
  onThermalStatus(e: { status: number }): void;
  onFrameStats(e: FrameStats): void;
  onTorchState(e: TorchState): void;
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
  getHapticsInfo(): HapticsInfo;
  playEnvelope(points: EnvelopePoint[], initialSharpness?: number | null): boolean;
  playPrimitives(steps: PrimitiveStep[]): boolean;
  cancelVibration(): boolean;
  getRadioInfo(): RadioInfo;
}

/** `null` when the native module is absent (web, Expo Go, or not yet built). */
const PixelNative = requireOptionalNativeModule<PixelNativeModule>('PixelNative');

export default PixelNative;
export const isPixelNativeAvailable = PixelNative != null;

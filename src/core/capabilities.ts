/**
 * @file capabilities.ts
 * @description Pure, side-effect-free resolution of Pixel hardware capabilities from device identity.
 * Encodes what physically exists on each Pixel generation so that Pro-exclusive hooks
 * (`useTemperature`, `useHiLight`, `useUWB`) and platform-gated features (Ranging API,
 * haptic envelopes, AppFunctions) can report `unsupported` instead of pretending.
 *
 * Ground truth (Sept 2026): Pixel 11 Pro / Pro XL / Pro Fold removed the IR thermometer and
 * replaced it with the HiLight LED array. Gemini Nano tiers: Pixel 11 = nano-v4, Pixel 9/10 = nano-v3,
 * Pixel 8 = nano-v2. See docs/research/PIXEL_11_PRO_DEEP_DIVE.md.
 */

/** On-device Gemini Nano model tier served by AICore, inferred from device generation. */
export type GeminiNanoTier = 'nano-v4' | 'nano-v3' | 'nano-v2' | 'none';

/** Whether a Pro-exclusive hook can talk to real silicon, has to simulate, or is absent. */
export type HardwareAvailability = 'hardware' | 'simulated' | 'estimated' | 'unsupported';

export interface DeviceCapabilities {
  /** Marketing model name, e.g. "Pixel 11 Pro" */
  modelName: string;
  /** True when running on a physical device (not emulator / web) */
  isPhysicalDevice: boolean;
  /** True for any Google Pixel */
  isPixel: boolean;
  /** Pixel generation number (11 for Pixel 11 Pro), null if unknown */
  pixelGeneration: number | null;
  /** Pro, Pro XL, or Pro Fold */
  isProModel: boolean;
  /** Any foldable Pixel */
  isFoldable: boolean;
  /** Android API level (36 = Android 16, 37 = Android 17), null on web */
  androidApiLevel: number | null;
  /** Rear infrared thermopile: Pixel 8 Pro, 9 Pro, 10 Pro only */
  hasThermometer: boolean;
  /** HiLight multi-colour LED array around the flash: Pixel 11 Pro family only (no public API) */
  hasHiLight: boolean;
  /** Ultra-Wideband radio: Pro models since Pixel 6 Pro and all Pixel Folds */
  hasUWB: boolean;
  /** Titan M3 security chip: Pixel 11 family (per Google; not readable from the device) */
  hasTitanM3: boolean;
  /** Gemini Nano tier AICore is expected to serve (ML Kit `checkStatus()` remains the runtime truth) */
  geminiNanoTier: GeminiNanoTier;
  /** Android 16+ unified `android.ranging.RangingManager` (UWB, BLE Channel Sounding, Wi-Fi RTT) */
  supportsRangingApi: boolean;
  /** Android 16+ `VibrationEffect.BasicEnvelopeBuilder` / `WaveformEnvelopeBuilder` */
  supportsHapticEnvelopes: boolean;
  /** Android 16+ AppFunctions (expose app functions to Gemini and other agents) */
  supportsAppFunctions: boolean;
  /** Android 17+ `AdvancedProtectionManager`, ML-DSA keys, Handoff, contacts picker */
  supportsAndroid17Apis: boolean;
  /**
   * 'device' when the flags below were confirmed with PackageManager.hasSystemFeature through the
   * PixelNative module; 'model-table' when inferred from the model name only.
   */
  verification: 'device' | 'model-table';
  /** Device-verified feature flags (null when not verified) */
  hasNFC: boolean | null;
  hasBleChannelSounding: boolean | null;
  hasWifiRtt: boolean | null;
  hasSatelliteTelephony: boolean | null;
  hasStrongBox: boolean | null;
  hasNpuFeature: boolean | null;
  /** AICore (Gemini Nano host) version name when installed */
  aicoreVersion: string | null;
}

const PIXEL_PATTERN = /pixel\s*(\d+)?(\s*a)?(\s*pro)?(\s*xl)?(\s*fold)?/i;

/**
 * Resolves hardware capabilities from device identity. Pure function; safe to unit test.
 *
 * @param modelName Device marketing name from `expo-device` (`Device.modelName`).
 * @param androidApiLevel `Device.platformApiLevel` on Android, null elsewhere.
 * @param isPhysicalDevice `Device.isDevice`.
 */
export function resolveCapabilities(
  modelName: string | null | undefined,
  androidApiLevel: number | null | undefined,
  isPhysicalDevice: boolean | null | undefined,
): DeviceCapabilities {
  const name = (modelName ?? '').trim();
  const match = PIXEL_PATTERN.exec(name);
  const isPixel = !!match;
  const generation = match?.[1] ? Number(match[1]) : null;
  const isProModel = isPixel && /pro/i.test(name);
  const isFoldable = isPixel && /fold/i.test(name);
  const api = typeof androidApiLevel === 'number' ? androidApiLevel : null;

  const geminiNanoTier: GeminiNanoTier =
    !isPixel || generation == null ? 'none'
    : generation >= 11 ? 'nano-v4'
    : generation >= 9 ? 'nano-v3'
    : generation >= 8 ? 'nano-v2'
    : 'none';

  return {
    modelName: name || 'Unknown device',
    isPhysicalDevice: !!isPhysicalDevice,
    isPixel,
    pixelGeneration: generation,
    isProModel,
    isFoldable,
    androidApiLevel: api,
    hasThermometer: isProModel && !isFoldable && generation != null && generation >= 8 && generation <= 10,
    hasHiLight: isPixel && generation != null && generation >= 11 && (isProModel || isFoldable),
    hasUWB: isPixel && ((isProModel && generation != null && generation >= 6) || isFoldable),
    hasTitanM3: isPixel && generation != null && generation >= 11,
    geminiNanoTier,
    supportsRangingApi: api != null && api >= 36,
    supportsHapticEnvelopes: api != null && api >= 36,
    supportsAppFunctions: api != null && api >= 36,
    supportsAndroid17Apis: api != null && api >= 37,
    verification: 'model-table',
    hasNFC: null,
    hasBleChannelSounding: null,
    hasWifiRtt: null,
    hasSatelliteTelephony: null,
    hasStrongBox: null,
    hasNpuFeature: null,
    aicoreVersion: null,
  };
}

/** Feature-flag probe interface (implemented by the PixelNative module). */
export interface FeatureProbe {
  hasSystemFeature(name: string): boolean;
  getPackageVersion(pkg: string): { installed: boolean; versionName: string | null };
}

/** Upgrade model-table capabilities with real PackageManager feature flags. Pure given a probe. */
export function verifyCapabilities(base: DeviceCapabilities, probe: FeatureProbe): DeviceCapabilities {
  const f = (name: string) => { try { return probe.hasSystemFeature(name); } catch { return null; } };
  const aicore = (() => { try { return probe.getPackageVersion('com.google.android.aicore'); } catch { return null; } })();
  const uwb = f('android.hardware.uwb');
  return {
    ...base,
    verification: 'device',
    hasUWB: uwb ?? base.hasUWB,
    hasNFC: f('android.hardware.nfc'),
    hasBleChannelSounding: f('android.hardware.bluetooth_le.channel_sounding'),
    hasWifiRtt: f('android.hardware.wifi.rtt'),
    hasSatelliteTelephony: f('android.hardware.telephony.satellite'),
    hasStrongBox: f('android.hardware.strongbox_keystore'),
    hasNpuFeature: f('android.hardware.neural_processing_unit'),
    aicoreVersion: aicore?.installed ? aicore.versionName : null,
  };
}

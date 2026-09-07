/**
 * @file useCapabilities.ts
 * @description Single source of truth for "what does this Pixel actually have?".
 *
 * Resolution happens in two stages. It starts from the device model table, which is inference from
 * the name, then upgrades to PackageManager-verified feature flags (UWB, NFC, BLE channel sounding,
 * Wi-Fi RTT, satellite, StrongBox, NPU) and the installed AICore version when the native module is
 * present. `verification` reports which stage the answer came from, so a caller can require a
 * device-verified flag before enabling something that will fail if the guess is wrong.
 *
 * Every Pro-exclusive or platform-gated hook reads from here, so the SDK never claims hardware that
 * is missing. Verification is attempted once and its failure is surfaced rather than swallowed:
 * a hook that silently fell back to the model table would be indistinguishable from one that
 * confirmed the device, which is exactly the ambiguity this file exists to remove.
 */

import { useMemo } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import PixelNative from 'pixel-native';
import { resolveCapabilities, verifyCapabilities, type DeviceCapabilities } from '../core/capabilities';
import { logEvent, logError, type TelemetrySource } from '../core/observability';

const MODULE = 'useCapabilities';

let logged = false;

export interface CapabilitiesState extends DeviceCapabilities {
  /** `hardware` once PackageManager confirmed the flags, `derived` while they come from the model table. */
  source: TelemetrySource;
  /** Why device verification failed, if it did. Null when it succeeded or was not attempted. */
  error: string | null;
}

/**
 * Resolved device capabilities. Memoised for the app lifetime, because the answer cannot change
 * without the process restarting.
 *
 * @example
 * ```typescript
 * const caps = useCapabilities();
 * if (!caps.hasHiLight) hideHiLightCard();
 * if (caps.verification === 'device' && caps.hasUWB) enableRanging();
 * ```
 */
export function useCapabilities(): CapabilitiesState {
  return useMemo(() => {
    const base = resolveCapabilities(
      Device.modelName,
      Platform.OS === 'android' ? Device.platformApiLevel : null,
      Device.isDevice,
    );

    let caps = base;
    let error: string | null = null;

    if (PixelNative) {
      try {
        caps = verifyCapabilities(base, PixelNative);
      } catch (e) {
        // Keep the model-table answer, but say that it was not confirmed.
        error = logError(MODULE, 'device verification failed', e, { model: base.modelName }).message;
      }
    }

    const source: TelemetrySource = caps.verification === 'device' ? 'hardware' : 'derived';

    if (!logged) {
      logged = true;
      logEvent(MODULE, 'resolved', {
        ...(caps as unknown as Record<string, unknown>),
        source,
        verificationError: error,
      });
    }

    return { ...caps, source, error };
  }, []);
}

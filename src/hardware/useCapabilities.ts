/**
 * @file useCapabilities.ts
 * @description Single source of truth for "what does this Pixel actually have?".
 * Resolves from the device model table, then upgrades to device-verified PackageManager feature
 * flags (UWB, NFC, BLE channel sounding, Wi-Fi RTT, satellite, StrongBox, NPU) and the installed
 * AICore version when the PixelNative module is present. Every Pro-exclusive or platform-gated hook
 * reads from here so the SDK never claims hardware that is missing.
 */

import { useMemo } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import PixelNative from '../../modules/pixel-native';
import { resolveCapabilities, verifyCapabilities, type DeviceCapabilities } from '../core/capabilities';
import { logEvent } from '../core/observability';

let logged = false;

/**
 * Hook returning resolved device capabilities. Memoised for the app lifetime.
 *
 * @example
 * ```typescript
 * const caps = useCapabilities();
 * if (!caps.hasThermometer) hideThermometerCard();
 * if (caps.verification === 'device' && caps.hasUWB) enableRanging();
 * ```
 */
export function useCapabilities(): DeviceCapabilities {
  return useMemo(() => {
    const base = resolveCapabilities(
      Device.modelName,
      Platform.OS === 'android' ? Device.platformApiLevel : null,
      Device.isDevice,
    );
    const caps = PixelNative ? verifyCapabilities(base, PixelNative) : base;
    if (!logged) {
      logged = true;
      logEvent('useCapabilities', 'resolved', caps as unknown as Record<string, unknown>);
    }
    return caps;
  }, []);
}

/**
 * @file useCapabilities.ts
 * @description Single source of truth for "what does this Pixel actually have?".
 * Every Pro-exclusive or platform-gated hook reads from here so the SDK never claims
 * hardware that is missing (e.g. the thermometer on Pixel 11 Pro) or an API that is
 * below the device's Android level.
 */

import { useMemo } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { resolveCapabilities, type DeviceCapabilities } from '../core/capabilities';

/**
 * Hook returning resolved device capabilities. Values are derived synchronously from
 * `expo-device` and memoised for the app lifetime; they never change at runtime.
 *
 * @example
 * ```typescript
 * const caps = useCapabilities();
 * if (!caps.hasThermometer) hideThermometerCard();
 * if (caps.geminiNanoTier === 'nano-v4') enableThinkingMode();
 * ```
 */
export function useCapabilities(): DeviceCapabilities {
  return useMemo(
    () =>
      resolveCapabilities(
        Device.modelName,
        Platform.OS === 'android' ? Device.platformApiLevel : null,
        Device.isDevice,
      ),
    [],
  );
}

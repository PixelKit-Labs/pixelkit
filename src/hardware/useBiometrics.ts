/**
 * @file useBiometrics.ts
 * @description Biometric hardware verification for Pixel under-display Fingerprint and Face Unlock.
 * Connects to Android BiometricPrompt backed by the Titan M2 hardware security module.
 */

import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { BiometricState } from '../core/types';

/**
 * Hook to inspect biometric hardware availability, enrolled credentials, and prompt for secure authentication.
 *
 * @returns Object indicating sensor status and providing an `authenticate()` method.
 *
 * @example
 * ```typescript
 * const { hasHardware, isEnrolled, authenticate } = useBiometrics();
 * const verified = await authenticate("Unlock sensitive AI memory vault");
 * if (verified) {
 *   // Proceed with protected action
 * }
 * ```
 */
export function useBiometrics() {
  const [state, setState] = useState<BiometricState>({
    hasHardware: false,
    isEnrolled: false,
    supportedTypes: [],
  });

  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

        const typeLabels = types.map(t => {
          if (t === LocalAuthentication.AuthenticationType.FINGERPRINT) return 'Fingerprint';
          if (t === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) return 'Face Unlock';
          return 'Iris';
        });

        setState({
          hasHardware,
          isEnrolled,
          supportedTypes: typeLabels,
        });
      } catch {
        setState({ hasHardware: false, isEnrolled: false, supportedTypes: [] });
      }
    };

    checkBiometrics();
  }, []);

  /**
   * Prompts the user with Android BiometricPrompt.
   * @param promptMessage Descriptive reason shown to the user on the system modal.
   * @returns Promise resolving to `true` if authentication succeeded, `false` otherwise.
   */
  const authenticate = async (promptMessage: string = 'Verify identity with Pixel Biometrics'): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Device Passcode',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch {
      return false;
    }
  };

  return {
    ...state,
    authenticate,
  };
}

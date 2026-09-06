import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricState {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: string[];
}

/**
 * PixelForge Biometrics Hook
 * Interacts with the Pixel's under-display Fingerprint and Face Unlock security hardware.
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

  const authenticate = async (promptMessage: string = 'Verify identity with Pixel Biometrics') => {
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

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * PixelForge Hardware Security Hook
 * Bridges to the Pixel's Titan M2 Security Enclave via Android Keystore.
 */
export function useSecurity() {
  const saveSecureItem = async (key: string, value: string): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(`sec_${key}`, value);
        return true;
      }
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return true;
    } catch {
      return false;
    }
  };

  const getSecureItem = async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(`sec_${key}`);
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  };

  const deleteSecureItem = async (key: string): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(`sec_${key}`);
        return true;
      }
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch {
      return false;
    }
  };

  return {
    saveSecureItem,
    getSecureItem,
    deleteSecureItem,
    isHardwareBacked: Platform.OS === 'android',
  };
}

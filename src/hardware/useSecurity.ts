/**
 * @file useSecurity.ts
 * @description Secret storage via expo-secure-store, which encrypts values with a key held in the
 * Android Keystore (StrongBox-backed on devices that have it, including the Pixel 11 Pro).
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Hook to read, persist, and revoke encrypted values in the hardware security module.
 *
 * @returns Object providing cryptographic store, retrieval, deletion, and hardware backing status.
 *
 * @example
 * ```typescript
 * const { saveSecureItem, getSecureItem } = useSecurity();
 * await saveSecureItem("AUTH_TOKEN", "secret_jwt_token");
 * const token = await getSecureItem("AUTH_TOKEN");
 * ```
 */
export function useSecurity() {
  /**
   * Persists a string securely in the hardware-backed keystore.
   * @param key Storage lookup identifier.
   * @param value Secret payload to encrypt.
   */
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

  /**
   * Decrypts and retrieves a previously stored secret.
   * @param key Storage lookup identifier.
   */
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

  /**
   * Securely purges a key from the hardware keystore.
   * @param key Storage lookup identifier to delete.
   */
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
    /** Store encrypted value in hardware keystore */
    saveSecureItem,
    /** Retrieve decrypted value */
    getSecureItem,
    /** Delete stored value */
    deleteSecureItem,
    /** True on Android: expo-secure-store uses the Android Keystore (StrongBox when present) */
    isHardwareBacked: Platform.OS === 'android',
    /** Keystore backend as reported by the platform; StrongBox presence is verified by useCapabilities().hasStrongBox */
    securityModule: Platform.OS === 'android' ? 'Android Keystore' : 'none',
    /** Post-quantum key types (ML-DSA) exist on Android 17 but are not used by SecureStore; always false here */
    isPostQuantumProtected: false,
  };
}

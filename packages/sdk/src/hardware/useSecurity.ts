/**
 * @file useSecurity.ts
 * @description Secret storage through `expo-secure-store`, which encrypts values with a key held in
 * the Android Keystore (StrongBox-backed on devices that have it, including the Pixel 11 Pro).
 *
 * Secret values are never logged. Events record the key name, the operation and whether it
 * succeeded, which is enough to debug a storage problem without putting the secret in logcat.
 */

import { useCallback, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { logEvent, logError, traced, type TelemetrySource } from '../core/observability';

const MODULE = 'useSecurity';

export function useSecurity() {
  const [error, setError] = useState<string | null>(null);
  const [lastOperation, setLastOperation] = useState<string | null>(null);

  const isHardwareBacked = Platform.OS === 'android';
  const source: TelemetrySource = isHardwareBacked ? 'hardware' : 'unavailable';

  /** Encrypts and stores a value. The value itself never reaches the log. */
  const saveSecureItem = useCallback(async (key: string, value: string): Promise<boolean> => {
    setError(null);
    try {
      await traced(MODULE, 'save', async () => {
        if (Platform.OS === 'web') {
          localStorage.setItem(`sec_${key}`, value);
          return;
        }
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      }, { key, bytes: value.length });
      setLastOperation(`saved ${key}`);
      return true;
    } catch (e) {
      setError(logError(MODULE, 'save failed', e, { key }).message);
      return false;
    }
  }, []);

  /** Decrypts and returns a stored value, or null when there is nothing under that key. */
  const getSecureItem = useCallback(async (key: string): Promise<string | null> => {
    setError(null);
    try {
      const value = await traced(MODULE, 'read', async () => {
        if (Platform.OS === 'web') return localStorage.getItem(`sec_${key}`);
        return SecureStore.getItemAsync(key);
      }, { key });
      logEvent(MODULE, 'read result', { key, found: value != null });
      setLastOperation(`read ${key}`);
      return value;
    } catch (e) {
      setError(logError(MODULE, 'read failed', e, { key }).message);
      return null;
    }
  }, []);

  const deleteSecureItem = useCallback(async (key: string): Promise<boolean> => {
    setError(null);
    try {
      await traced(MODULE, 'delete', async () => {
        if (Platform.OS === 'web') {
          localStorage.removeItem(`sec_${key}`);
          return;
        }
        await SecureStore.deleteItemAsync(key);
      }, { key });
      setLastOperation(`deleted ${key}`);
      return true;
    } catch (e) {
      setError(logError(MODULE, 'delete failed', e, { key }).message);
      return false;
    }
  }, []);

  return {
    /** Store an encrypted value. Returns false and sets `error` on failure. */
    saveSecureItem,
    /** Retrieve a decrypted value, or null when absent. */
    getSecureItem,
    /** Remove a stored value. */
    deleteSecureItem,
    /** True on Android, where the encryption key lives in the Keystore. */
    isHardwareBacked,
    /** Keystore backend the platform reports. StrongBox presence is verified by `useCapabilities().hasStrongBox`. */
    securityModule: isHardwareBacked ? 'Android Keystore' : 'none',
    /** Android 17 has post-quantum key types but SecureStore does not use them. Always false. */
    isPostQuantumProtected: false,
    /** Last failure message, or null. */
    error,
    /** Description of the last operation, for a diagnostics panel. Never contains the value. */
    lastOperation,
    source,
  };
}

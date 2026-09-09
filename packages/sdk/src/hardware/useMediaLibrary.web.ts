/**
 * @file useMediaLibrary.web.ts
 * @description Web fallback for useMediaLibrary.
 * expo-media-library is native-only; this reports unavailable without crashing web bundles.
 */

import { useState } from 'react';
import type { SavedMedia } from './useMediaLibrary';
export type { SavedMedia };

export function useMediaLibrary() {
  const [permissionGranted] = useState<boolean>(false);
  const [hasLimitedAccess] = useState<boolean>(false);
  const [isSaving] = useState<boolean>(false);
  const [isLoading] = useState<boolean>(false);
  const [recent] = useState<SavedMedia[]>([]);

  return {
    hasPermission: false,
    permissionGranted,
    hasLimitedAccess,
    isSaving,
    isLoading,
    lastSaved: null as SavedMedia | null,
    recent,
    error: 'Media library is not available in web browsers' as string | null,
    source: 'unavailable' as const,
    save: async () => null,
    loadRecent: async () => [],
    requestPermission: async () => false,
    refresh: async () => {},
  };
}

import { GoogleGenAI } from '@google/genai';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_KEY_STORAGE_KEY = 'PIXELFORGE_GEMINI_API_KEY';

export async function getStoredApiKey(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(API_KEY_STORAGE_KEY) || process.env.EXPO_PUBLIC_GEMINI_API_KEY || null;
    }
    const secureKey = await SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
    return secureKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || null;
  } catch {
    return process.env.EXPO_PUBLIC_GEMINI_API_KEY || null;
  }
}

export async function saveApiKey(key: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
      return true;
    }
    await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, key);
    return true;
  } catch {
    return false;
  }
}

export function createGeminiClient(apiKey: string) {
  return new GoogleGenAI({ apiKey });
}

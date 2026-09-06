/**
 * @file useVisionAI.ts
 * @description Camera / gallery capture with Gemini multimodal analysis. The description and labels
 * come from the model as structured JSON (`responseJsonSchema`), not from hard-coded strings. Without
 * an API key the hook records the image and returns an error; nothing is simulated.
 */

import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Type } from '@google/genai';
import { VisionAnalysisResult } from '../core/types';
import { getStoredApiKey, createGeminiClient, GEMINI_MODEL, NO_API_KEY_MESSAGE } from './geminiClient';
import { logEvent, recordMetric } from '../core/observability';

const MODULE = 'useVisionAI';

export function useVisionAI() {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VisionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const captureAndAnalyze = async (useCamera: boolean = true): Promise<VisionAnalysisResult | null> => {
    setError(null);
    try {
      let result: ImagePicker.ImagePickerResult;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { setError('Camera permission denied'); return null; }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, base64: true });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, base64: true });
      }
      if (result.canceled || !result.assets?.length) return null;

      const asset = result.assets[0];
      setSelectedImageUri(asset.uri);
      logEvent(MODULE, 'image', { width: asset.width, height: asset.height, mime: asset.mimeType });

      const apiKey = await getStoredApiKey();
      if (!apiKey || !asset.base64) {
        setError(NO_API_KEY_MESSAGE);
        setAnalysis(null);
        return null;
      }

      setIsAnalyzing(true);
      const start = performance.now();
      const client = createGeminiClient(apiKey);
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: asset.mimeType || 'image/jpeg', data: asset.base64 } },
            { text: 'Describe this image in two concise sentences and list the 3 to 5 most important objects or subjects as short labels.' },
          ],
        }],
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              labels: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 1, maxItems: 5 },
            },
            required: ['description', 'labels'],
          },
        },
      });
      const parsed = JSON.parse(response.text ?? '{}') as { description?: string; labels?: string[] };
      const elapsedMs = Math.round(performance.now() - start);
      const res: VisionAnalysisResult = {
        description: parsed.description ?? '(no description)',
        labels: parsed.labels ?? [],
        latencyMs: elapsedMs,
        timestamp: Date.now(),
      };
      setAnalysis(res);
      recordMetric(MODULE, 'latencyMs', elapsedMs, 'hardware');
      logEvent(MODULE, 'analysis', { model: GEMINI_MODEL, latencyMs: elapsedMs, labels: res.labels.length });
      return res;
    } catch (e: any) {
      const message = e?.message ?? 'analysis failed';
      setError(message);
      logEvent(MODULE, 'error', { message }, 'error');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    selectedImageUri,
    analysis,
    isAnalyzing,
    /** Last error (permission, missing key, API) */
    error,
    captureAndAnalyze,
    model: GEMINI_MODEL,
  };
}

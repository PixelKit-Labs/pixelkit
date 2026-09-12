/**
 * @file useEmbeddings.ts
 * @description On-device text vector embeddings and semantic cosine similarity scoring
 * executed on the Google Tensor EdgeTPU via ML Kit / LiteRT.
 *
 * Adheres to the Zero-Simulation Principle: returns empty vectors and source: 'unavailable'
 * if the local model weights are absent or unsupported.
 */

import { useState, useEffect, useCallback } from 'react';
import PixelNano, { isPixelNanoAvailable } from '@pixelkit-labs/mlkit';
import { logEvent, logError, recordMetric, type TelemetrySource } from '../core/observability';

const MODULE = 'useEmbeddings';
export const EMBEDDING_DIMENSION = 512;

export interface EmbeddingsTelemetry {
  /** Whether the on-device text embedding model is installed and ready for inference. */
  isAvailable: boolean;
  /** Whether an embedding inference operation is actively running on the NPU/TPU. */
  isLoading: boolean;
  /** Dimension size of the output embedding vector (512 or 768). */
  vectorDimension: number;
  /** Error message if embedding generation failed. */
  error: string | null;
  /** Provenance of the data: 'hardware' or 'unavailable'. */
  source: TelemetrySource;
  /** Computes a normalized float vector embedding for the provided text. */
  embed: (text: string) => Promise<number[]>;
  /** Computes cosine similarity between two float vectors (-1.0 to 1.0). */
  cosineSimilarity: (vecA: number[], vecB: number[]) => number;
}

import { computeCosineSimilarity } from '../core/embeddingsMath';
export { computeCosineSimilarity };

export function useEmbeddings(): EmbeddingsTelemetry {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const source: TelemetrySource = isPixelNanoAvailable && isAvailable ? 'hardware' : 'unavailable';

  useEffect(() => {
    if (!PixelNano) {
      setIsAvailable(false);
      return;
    }

    try {
      const avail = PixelNano.isEmbeddingModelAvailable();
      setIsAvailable(avail);
      recordMetric(MODULE, 'isEmbeddingModelAvailable', avail, 'hardware');
      logEvent(MODULE, 'checked embedding model availability', { available: avail });
    } catch (e: any) {
      logError(MODULE, 'check embedding availability failed', e);
      setIsAvailable(false);
    }
  }, []);

  const embed = useCallback(async (text: string): Promise<number[]> => {
    if (!PixelNano) {
      setError('PixelNano module unavailable');
      return [];
    }
    if (!text || text.trim().length === 0) {
      return [];
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await PixelNano.generateEmbedding(text);
      setIsLoading(false);
      recordMetric(MODULE, 'embeddingLatencyMs', res.latencyMs, 'hardware');
      logEvent(MODULE, 'generated embedding', {
        dim: res.dimension,
        latencyMs: res.latencyMs,
      });
      return res.embedding ?? [];
    } catch (e: any) {
      setIsLoading(false);
      const err = logError(MODULE, 'generateEmbedding failed', e);
      setError(err.message);
      return [];
    }
  }, []);

  const cosineSimilarity = useCallback((vecA: number[], vecB: number[]): number => {
    return computeCosineSimilarity(vecA, vecB);
  }, []);

  return {
    isAvailable,
    isLoading,
    vectorDimension: EMBEDDING_DIMENSION,
    error,
    source,
    embed,
    cosineSimilarity,
  };
}

/**
 * @file useGenAITasks.ts
 * @description Dedicated on-device GenAI task clients powered by ML Kit and AICore.
 * Provides specialized, low-latency task modules:
 * - Summarization: distill articles and conversation transcripts into concise bullet points.
 * - Proofreading: polish grammar, punctuation, and wording on-device.
 * - Rewriting: transform text tone (elaborate, emojify, shorten, friendly, professional, rephrase).
 * - Image Description: generate fast contextual descriptions and labels on-device.
 *
 * All operations execute directly on the Tensor G6 TPU via AICore with full hardware observability.
 */

import { useState, useCallback } from 'react';
import PixelNano, {
  type SummarizeOptions,
  type SummarizeResult,
  type ProofreadResult,
  type RewriteResult,
  type ImageDescriptionResult,
} from '@pixelkit-labs/mlkit';
import { logEvent, recordMetric, type TelemetrySource } from '../core/observability';

const MODULE = 'useGenAITasks';

export type TaskTone = 'elaborate' | 'emojify' | 'shorten' | 'friendly' | 'professional' | 'rephrase';

export function useGenAITasks() {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [summaryResult, setSummaryResult] = useState<SummarizeResult | null>(null);
  const [proofreadResult, setProofreadResult] = useState<ProofreadResult | null>(null);
  const [rewriteResult, setRewriteResult] = useState<RewriteResult | null>(null);
  const [imageDescriptionResult, setImageDescriptionResult] = useState<ImageDescriptionResult | null>(null);

  const source: TelemetrySource = PixelNano ? 'hardware' : 'unavailable';

  /**
   * Summarizes an article or chat transcript on-device using AICore.
   */
  const summarize = useCallback(
    async (text: string, options?: SummarizeOptions): Promise<SummarizeResult | null> => {
      if (!PixelNano) {
        setError('PixelNano module is unavailable in this environment');
        return null;
      }
      setIsRunning(true);
      setError(null);
      try {
        const res = await PixelNano.summarize(text, options);
        setSummaryResult(res);
        recordMetric(MODULE, 'summarizeLatencyMs', res.latencyMs, 'hardware');
        logEvent(MODULE, 'summarize', { latencyMs: res.latencyMs, engine: res.engine });
        return res;
      } catch (e: any) {
        const msg = e?.message ?? 'Summarization failed';
        setError(msg);
        logEvent(MODULE, 'summarize error', { message: msg }, 'error');
        return null;
      } finally {
        setIsRunning(false);
      }
    },
    []
  );

  /**
   * Proofreads text on-device, returning corrected text and improvement suggestions.
   */
  const proofread = useCallback(async (text: string): Promise<ProofreadResult | null> => {
    if (!PixelNano) {
      setError('PixelNano module is unavailable in this environment');
      return null;
    }
    setIsRunning(true);
    setError(null);
    try {
      const res = await PixelNano.proofread(text);
      setProofreadResult(res);
      recordMetric(MODULE, 'proofreadLatencyMs', res.latencyMs, 'hardware');
      logEvent(MODULE, 'proofread', { latencyMs: res.latencyMs, engine: res.engine });
      return res;
    } catch (e: any) {
      const msg = e?.message ?? 'Proofreading failed';
      setError(msg);
      logEvent(MODULE, 'proofread error', { message: msg }, 'error');
      return null;
    } finally {
      setIsRunning(false);
    }
  }, []);

  /**
   * Rewrites text into the specified tone or style on-device.
   */
  const rewrite = useCallback(
    async (text: string, tone: TaskTone = 'professional'): Promise<RewriteResult | null> => {
      if (!PixelNano) {
        setError('PixelNano module is unavailable in this environment');
        return null;
      }
      setIsRunning(true);
      setError(null);
      try {
        const res = await PixelNano.rewrite(text, tone);
        setRewriteResult(res);
        recordMetric(MODULE, 'rewriteLatencyMs', res.latencyMs, 'hardware');
        logEvent(MODULE, 'rewrite', { tone, latencyMs: res.latencyMs, engine: res.engine });
        return res;
      } catch (e: any) {
        const msg = e?.message ?? 'Rewriting failed';
        setError(msg);
        logEvent(MODULE, 'rewrite error', { message: msg }, 'error');
        return null;
      } finally {
        setIsRunning(false);
      }
    },
    []
  );

  /**
   * Describes an image (base64 or file uri) on-device using local multimodal capabilities.
   */
  const describeImage = useCallback(
    async (
      imageInput: string,
      style: 'detailed' | 'caption' | 'labels' | 'concise' = 'concise'
    ): Promise<ImageDescriptionResult | null> => {
      if (!PixelNano) {
        setError('PixelNano module is unavailable in this environment');
        return null;
      }
      setIsRunning(true);
      setError(null);
      try {
        const res = await PixelNano.describeImage(imageInput, style);
        setImageDescriptionResult(res);
        recordMetric(MODULE, 'describeImageLatencyMs', res.latencyMs, 'hardware');
        logEvent(MODULE, 'describeImage', { style, latencyMs: res.latencyMs, engine: res.engine });
        return res;
      } catch (e: any) {
        const msg = e?.message ?? 'Image description failed';
        setError(msg);
        logEvent(MODULE, 'describeImage error', { message: msg }, 'error');
        return null;
      } finally {
        setIsRunning(false);
      }
    },
    []
  );

  return {
    isRunning,
    error,
    source,
    summaryResult,
    proofreadResult,
    rewriteResult,
    imageDescriptionResult,
    summarize,
    proofread,
    rewrite,
    describeImage,
  };
}

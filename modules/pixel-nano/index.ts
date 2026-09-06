/**
 * @file modules/pixel-nano/index.ts
 * @description TypeScript bridge for the PixelNano Expo Module: Gemini Nano on-device inference through the
 * ML Kit GenAI Prompt API (AICore). Resolves to `null` on web, in Expo Go, or on builds without the module,
 * so `useGeminiNano` reports `source: 'unavailable'` instead of inventing a reply.
 */

import { NativeModule, requireOptionalNativeModule } from 'expo';

/** AICore feature status for the Prompt API on this device (ML Kit `FeatureStatus`). */
export type NanoStatus = 'available' | 'downloadable' | 'downloading' | 'unavailable';

export type NanoModelInfo = {
  status: NanoStatus;
  /** Model name AICore reports (e.g. a Gemini Nano build id), null when the API does not answer */
  baseModelName: string | null;
  /** Input + output token budget for one request */
  tokenLimit: number | null;
  thinkingModeAvailable: boolean | null;
  systemPromptAvailable: boolean | null;
  structuredOutputAvailable: boolean | null;
  cachingAvailable: boolean | null;
  aicoreVersion: string | null;
  releaseStage: 'stable' | 'preview';
  preference: 'full' | 'fast';
};

export type NanoOptions = {
  /** Sent as a SystemInstruction part; needs `systemPromptAvailable` */
  systemInstruction?: string;
  /** 0..1 */
  temperature?: number;
  topK?: number;
  candidateCount?: number;
  /** Output cap; the model's `tokenLimit` covers input + output */
  maxOutputTokens?: number;
  seed?: number;
  /** Thinking mode; only honoured when `thinkingModeAvailable` */
  thinking?: boolean;
  /** One JPEG/PNG as base64 (no data: prefix). The Prompt API request builder takes one image. */
  imageBase64?: string;
};

export type NanoResult = {
  text: string;
  finishReason: 'STOP' | 'MAX_TOKENS' | 'OTHER' | 'UNKNOWN';
  thoughts: string[];
  /** Wall time of the AICore call measured in the module */
  latencyMs: number;
  /** Time to the first streamed token; null for non-streaming calls */
  firstTokenMs: number | null;
};

export type DownloadProgressEvent = { phase: 'started' | 'progress' | 'completed'; bytes?: number };
export type TokenEvent = { requestId: string; text: string };

type Events = {
  onDownloadProgress(e: DownloadProgressEvent): void;
  onToken(e: TokenEvent): void;
  onThought(e: TokenEvent): void;
};

declare class PixelNanoModule extends NativeModule<Events> {
  checkStatus(): Promise<NanoStatus>;
  getModelInfo(): Promise<NanoModelInfo>;
  setModelConfig(stage: 'stable' | 'preview', preference: 'full' | 'fast'): void;
  download(): Promise<NanoStatus>;
  /** Resolves with the warm-up wall time in ms */
  warmup(): Promise<number>;
  countTokens(prompt: string, options?: NanoOptions): Promise<number>;
  generate(prompt: string, options?: NanoOptions): Promise<NanoResult>;
  stream(requestId: string, prompt: string, options?: NanoOptions): Promise<NanoResult>;
  close(): void;
}

const PixelNano = requireOptionalNativeModule<PixelNanoModule>('PixelNano');

export const isPixelNanoAvailable = PixelNano != null;

export default PixelNano;

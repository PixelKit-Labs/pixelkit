/**
 * @file useGemini.ts
 * @description Conversational Gemini (cloud) chat with real multi-turn history via `ai.chats`.
 * There is no simulated fallback: without an API key `sendMessage` appends an error message that
 * tells the user how to configure one. Token counts come from the API's usageMetadata.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Chat } from '@google/genai';
import { AIMessage } from '../core/types';
import {
  getStoredApiKey,
  createGeminiClient,
  listAvailableModels,
  DEFAULT_MODELS,
  GEMINI_MODEL,
  NO_API_KEY_MESSAGE,
} from './geminiClient';
import { logEvent, recordMetric } from '../core/observability';

const MODULE = 'useGemini';

export const DEFAULT_GEMINI_SYSTEM_INSTRUCTION =
  'You are PixelKit, a concise hardware and AI assistant running on a Google Pixel 11 Pro. Answer in a few sentences unless asked for detail.';

export function useGemini() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [model, setModel] = useState<string>(GEMINI_MODEL);
  const [availableModels, setAvailableModels] = useState<string[]>(DEFAULT_MODELS);
  const [temperature, setTemperature] = useState<number>(0.4);
  const [topP, setTopP] = useState<number>(0.95);
  const [topK, setTopK] = useState<number>(40);
  const [maxOutputTokens, setMaxOutputTokens] = useState<number>(2048);
  const [systemInstruction, setSystemInstruction] = useState<string>(DEFAULT_GEMINI_SYSTEM_INSTRUCTION);
  const [thinkingBudget, setThinkingBudget] = useState<number>(0);

  const chatRef = useRef<Chat | null>(null);

  useEffect(() => {
    getStoredApiKey().then(k => {
      setApiKeyState(k);
      logEvent(MODULE, 'api key', { configured: !!k });
      if (k) {
        listAvailableModels(k).then(models => {
          if (models.length > 0) setAvailableModels(models);
        });
      }
    });
  }, []);

  const setApiKey = useCallback((key: string | null) => {
    setApiKeyState(key);
    chatRef.current = null; // new key → new session
    if (key) {
      listAvailableModels(key).then(models => {
        if (models.length > 0) setAvailableModels(models);
      });
    }
  }, []);

  const setSelectedModel = useCallback((newModel: string) => {
    setModel(newModel);
    chatRef.current = null; // reset chat session for new model
  }, []);

  const sendMessage = useCallback(async (userPrompt: string): Promise<void> => {
    const prompt = userPrompt.trim();
    if (!prompt) return;

    setMessages(prev => [...prev, { id: `user_${Date.now()}`, role: 'user', content: prompt, timestamp: Date.now() }]);

    if (!apiKey) {
      setMessages(prev => [...prev, { id: `err_${Date.now()}`, role: 'system', content: NO_API_KEY_MESSAGE, timestamp: Date.now() }]);
      logEvent(MODULE, 'sendMessage without key', undefined, 'warn');
      return;
    }

    setIsLoading(true);
    const start = performance.now();
    try {
      if (!chatRef.current) {
        const config: any = {
          systemInstruction: systemInstruction.trim() || DEFAULT_GEMINI_SYSTEM_INSTRUCTION,
          temperature,
          topP,
          topK,
          maxOutputTokens,
        };
        if (thinkingBudget > 0) {
          config.thinkingConfig = { thinkingBudget };
        }
        chatRef.current = createGeminiClient(apiKey).chats.create({
          model,
          config,
        });
      }
      const response = await chatRef.current.sendMessage({ message: prompt });
      const elapsedMs = Math.round(performance.now() - start);
      const tokens = response.usageMetadata?.totalTokenCount;
      setMessages(prev => [...prev, {
        id: `model_${Date.now()}`,
        role: 'model',
        content: response.text ?? '(empty response)',
        timestamp: Date.now(),
        latencyMs: elapsedMs,
        tokenCount: tokens,
      }]);
      recordMetric(MODULE, 'latencyMs', elapsedMs, 'hardware');
      logEvent(MODULE, 'reply', { model, latencyMs: elapsedMs, tokens });
    } catch (err: any) {
      const message = err?.message ?? 'Unknown error';
      setMessages(prev => [...prev, { id: `err_${Date.now()}`, role: 'system', content: `Gemini error: ${message}`, timestamp: Date.now() }]);
      logEvent(MODULE, 'error', { message }, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, model, temperature, topP, topK, maxOutputTokens, systemInstruction, thinkingBudget]);

  const clearMessages = useCallback((): void => {
    setMessages([]);
    chatRef.current = null;
  }, []);

  return {
    /** Conversation so far. `system` role entries are local errors, not model output. */
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    hasApiKey: !!apiKey,
    setApiKey,
    model,
    setSelectedModel,
    availableModels,
    temperature,
    setTemperature,
    topP,
    setTopP,
    topK,
    setTopK,
    maxOutputTokens,
    setMaxOutputTokens,
    systemInstruction,
    setSystemInstruction,
    thinkingBudget,
    setThinkingBudget,
  };
}

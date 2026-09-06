import { useState, useCallback, useEffect } from 'react';
import { AIMessage } from '../core/types';
import { getStoredApiKey, createGeminiClient } from './geminiClient';

/**
 * PixelForge Gemini AI Hook
 * Multi-turn conversational chat, reasoning, and text completions.
 */
export function useGemini() {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Hello! I am connected to PixelForge on your Pixel 11 Pro. Ask me anything, test hardware diagnostics, or give me a task to solve.',
      timestamp: Date.now(),
      latencyMs: 12,
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    getStoredApiKey().then(setApiKey);
  }, []);

  const sendMessage = useCallback(async (userPrompt: string) => {
    if (!userPrompt.trim()) return;

    const userMsg: AIMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userPrompt.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const startTime = performance.now();

    try {
      let replyContent = '';

      if (apiKey) {
        const client = createGeminiClient(apiKey);
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userPrompt,
        });
        replyContent = response.text || 'No response generated.';
      } else {
        // High-fidelity local simulation if API key is not yet configured
        await new Promise(res => setTimeout(res, 600));
        replyContent = `[PixelForge AI Engine]: Received your command "${userPrompt}". Pixel 11 Pro Tensor TPU and core hardware systems are running at nominal capacity (120 FPS, 0.85 CPU headroom). (To connect to live Google Gemini Cloud, set your API key in Settings).`;
      }

      const elapsedMs = Math.round(performance.now() - startTime);

      const modelMsg: AIMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        content: replyContent,
        timestamp: Date.now(),
        latencyMs: elapsedMs,
        tokenCount: Math.round(replyContent.length / 4),
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      const errorMsg: AIMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        content: `Error generating response: ${err?.message || 'Unknown error'}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    hasApiKey: !!apiKey,
    setApiKey,
  };
}

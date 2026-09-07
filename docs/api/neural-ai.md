# Neural & AI API Reference 🧠
> **Gemini in the cloud, Gemini Nano on-device, ML Kit vision and language, speech in and out**

This document covers conversational reasoning, on-device generative tasks, speech recognition and synthesis, multimodal vision, and hardware-secured API key storage. Each entry documents its **Inputs** (arguments, with defaults), its **Outputs** (every returned field) and its **Functions** (what each callable takes and returns).

---

## 📑 Module Index

* [`useGemini`](#usegemini) - Multi-turn cloud chat with full generation parameters
* [`useGeminiNano`](#usegemininano) - Gemini Nano on-device (ML Kit GenAI Prompt API on AICore)
* [`useGenAITasks`](#usegenaitasks) - On-device summarize, proofread, rewrite, describe
* [`useNaturalLanguageAI`](#usenaturallanguageai) - Offline translation, language ID, smart reply, entities
* [`useSpeechAI`](#usespeechai) - On-device and cloud speech recognition
* [`useSpeech`](#usespeech) - Text to speech on the platform engine
* [`useVisionAI`](#usevisionai) - ML Kit on-device vision plus Gemini scene analysis
* [`geminiClient`](#geminiclient) - Key storage, model listing, client factory

---

## `useGemini`

Official Google Gen AI SDK (`@google/genai`) on **`gemini-3.8-flash`** with real multi-turn history via `ai.chats.create()` and a system instruction. **There is no simulated fallback**: without an API key, `sendMessage` appends a `system`-role message containing `NO_API_KEY_MESSAGE`. Token counts come from the API's `usageMetadata`.

Changing the model, the key, or any generation parameter resets the chat session, because those settings are fixed when the session is created.

### Signature
```typescript
function useGemini(): {
  messages: AIMessage[];
  isLoading: boolean;
  hasApiKey: boolean;
  model: string;
  availableModels: string[];
  temperature: number; topP: number; topK: number; maxOutputTokens: number;
  systemInstruction: string; thinkingBudget: number;
  error: string | null;
  source: TelemetrySource;
  sendMessage: (userPrompt: string) => Promise<void>;
  clearMessages: () => void;
  setApiKey: (key: string | null) => void;
  setSelectedModel: (model: string) => void;
  setTemperature: (n: number) => void; setTopP: (n: number) => void; setTopK: (n: number) => void;
  setMaxOutputTokens: (n: number) => void;
  setSystemInstruction: (text: string) => void;
  setThinkingBudget: (tokens: number) => void;
};
```

### Inputs
`useGemini()` takes no arguments. It loads the stored key on mount and, when one exists, fetches the live model list. Everything else is set through the setters below, which are the hook's real inputs.

### Outputs
| Field | Type | Description |
| :--- | :--- | :--- |
| `messages` | `AIMessage[]` | The conversation: `{ id, role, content, timestamp, latencyMs?, tokenCount? }`. Model replies carry the measured round-trip latency and the API's total token count. **`role: 'system'` entries are local errors, not model output.** |
| `isLoading` | `boolean` | `true` while a request is in flight. |
| `hasApiKey` | `boolean` | Whether a key is loaded from SecureStore or the environment. Without it, sending appends the "no key" message. |
| `model` | `string` | Model id in use, `'gemini-3.8-flash'` by default. |
| `availableModels` | `string[]` | Models the API lists for this key, filtered to Gemini text models. Falls back to a curated default list when offline or unconfigured. |
| `temperature` | `number` | Sampling temperature sent with the session, default `0.4`. |
| `topP` | `number` | Nucleus sampling cutoff, default `0.95`. |
| `topK` | `number` | Top-k sampling cutoff, default `40`. |
| `maxOutputTokens` | `number` | Ceiling on reply length, default `2048`. |
| `systemInstruction` | `string` | The instruction the session was created with. Defaults to the PixelKit assistant instruction. |
| `thinkingBudget` | `number` | Thinking tokens requested, default `0` (off). Above zero, `thinkingConfig` is sent with the session. |
| `error` | `string \| null` | Latest failure message, or `null`. Failures are also logged and counted. |
| `source` | `TelemetrySource` | Cloud model: reachable only with a key and a network route. |

### Functions
| Function | Inputs | Returns | Description |
| :--- | :--- | :--- | :--- |
| `sendMessage(userPrompt)` | `userPrompt: string` — the user's turn; empty or whitespace-only input is ignored | `Promise<void>` — the reply lands in `messages`; errors land there too, as a `system` entry | Appends the user turn, creates the chat session on first use, and sends. Records latency and token count on the reply. |
| `clearMessages()` | none | `void` | Empties `messages` **and** resets the chat session, so the next turn starts with no history. |
| `setApiKey(key)` | `key: string \| null` — the API key, or `null` to clear it | `void` | Swaps the key, resets the session and refreshes `availableModels`. Persisting the key is `saveApiKey()`'s job. |
| `setSelectedModel(model)` | `model: string` — an id from `availableModels` | `void` | Switches model and resets the session. |
| `setTemperature(n)` | `n: number` — typically 0–2; lower is more deterministic | `void` | Takes effect on the next session. |
| `setTopP(n)` | `n: number` — 0–1 | `void` | Nucleus sampling cutoff. |
| `setTopK(n)` | `n: number` — positive integer | `void` | Top-k sampling cutoff. |
| `setMaxOutputTokens(n)` | `n: number` — token ceiling for a reply | `void` | Longer replies cost more and take longer. |
| `setSystemInstruction(text)` | `text: string` — the standing instruction; empty falls back to the default | `void` | Sets the model's behaviour for new sessions. |
| `setThinkingBudget(tokens)` | `tokens: number` — thinking tokens; `0` disables thinking | `void` | Only sent when above zero. |

### Example
```tsx
import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useGemini, useHiLight, HapticButton } from './src';

export function AssistantChat() {
  const gemini = useGemini();
  const hilight = useHiLight();
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    hilight.triggerGeminiPulse(4000);   // cyan while the model is thinking
    await gemini.sendMessage(text);
  };

  return (
    <View>
      {gemini.messages.map(m => <Text key={m.id}>[{m.role}]: {m.content}</Text>)}
      <TextInput value={input} onChangeText={setInput} placeholder="Ask assistant…" />
      <HapticButton title="Send" onPress={handleSend} disabled={gemini.isLoading} />
    </View>
  );
}
```

---

## `useGeminiNano`

Gemini Nano on-device through the local `modules/pixel-nano` Expo Module, which wraps `com.google.mlkit:genai-prompt` (the ML Kit GenAI Prompt API on AICore). Status, base model name, token limit and feature flags come from `GenerativeModel`; latency and time-to-first-token are measured around the native call; token counts come from the on-device tokenizer.

AICore keeps no conversation state, so `buildNanoTurn()` re-sends a capped transcript (6,000 characters, newest turns first) with the system instruction. **There is no cloud fallback and no simulated reply**: when the model is not `available`, `sendMessage` appends a `system`-role error.

Requires a dev client or release APK on a device with AICore (Pixel 9 and later; verified on Pixel 11 Pro). On web and in Expo Go the module resolves to `null` and `source` is `'unavailable'`.

### Signature
```typescript
function useGeminiNano(): {
  status: 'available' | 'downloadable' | 'downloading' | 'unavailable';
  isAvailable: boolean;
  info: NanoModelInfo | null;
  messages: AIMessage[]; partial: string; thoughts: string[];
  lastLatencyMs: number | null; lastFirstTokenMs: number | null;
  lastOutputTokens: number | null; lastDecodeTokensPerSec: number | null;
  downloadedBytes: number | null; isDownloading: boolean;
  isWarmingUp: boolean; warmupMs: number | null;
  isGenerating: boolean; error: string | null; source: TelemetrySource;
  temperature: number; topK: number; candidateCount: number; maxOutputTokens: number;
  thinkingMode: boolean; systemInstruction: string;
  setTemperature: (n: number) => void; setTopK: (n: number) => void;
  setCandidateCount: (n: number) => void; setMaxOutputTokens: (n: number) => void;
  setThinkingMode: (on: boolean) => void; setSystemInstruction: (text: string) => void;
  refresh: () => Promise<void>;
  download: () => Promise<NanoStatus>;
  warmup: () => Promise<number | null>;
  countTokens: (prompt: string, options?: NanoOptions) => Promise<number | null>;
  generate: (prompt: string, options?: NanoOptions) => Promise<NanoResult>;
  sendMessage: (userPrompt: string) => Promise<void>;
  clearMessages: () => void;
  setModelConfig: (stage: 'stable' | 'preview', preference: 'full' | 'fast') => Promise<void>;
  summarize: (text: string, options?: SummarizeOptions) => Promise<SummarizeResult>;
  proofread: (text: string, options?: Record<string, any>) => Promise<ProofreadResult>;
  rewrite: (text: string, tone?: TaskTone) => Promise<RewriteResult>;
};
```

### Inputs
`useGeminiNano()` takes no arguments. It reads model info on mount and subscribes to download progress. Generation parameters are held as state and applied to every call; per-call overrides go in the `NanoOptions` argument of `generate` and `countTokens`.

| `NanoOptions` field | Type | Description |
| :--- | :--- | :--- |
| `systemInstruction` | `string` | Sent as a `SystemInstruction` part when AICore supports it. |
| `temperature` | `number` | Sampling temperature. |
| `topK` | `number` | Top-k sampling cutoff. |
| `candidateCount` | `number` | How many candidates to generate. |
| `maxOutputTokens` | `number` | Ceiling on the reply length. |
| `seed` | `number` | Fixes sampling for a reproducible result. |
| `thinking` | `boolean` | Enables thinking mode where the model supports it; thoughts arrive on `onThought`. |
| `imageBase64` | `string` | One image part, for a multimodal prompt. |

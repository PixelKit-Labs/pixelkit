# Neural & AI API Reference 🧠
> **Google gemini-3.8-flash, Voice Speech-to-Text, Multimodal Vision, and Titan M3 Keystore**

This document covers conversational reasoning, speech audio transcription, multimodal camera scene inspection, and hardware-secured API key management.

---

## 📑 Module Index

* [`useGemini`](#usegemini) - Multi-Turn Conversational Reasoning & Streaming
* [`useGeminiNano`](#usegemininano) - Gemini Nano on-device (ML Kit GenAI Prompt API on AICore)
* [`useSpeechAI`](#usespeechai) - Microphone recording & Gemini transcription
* [`useVisionAI`](#usevisionai) - Multimodal Camera Scene & Document Analysis
* [`geminiClient`](#geminiclient) - Titan M3 Encrypted Credential Management

---

## `useGemini`

Official Google Gen AI SDK integration (`@google/genai` 2.21) on **`gemini-3.8-flash`** (`GEMINI_MODEL` in `geminiClient.ts`) with real multi-turn history via `ai.chats.create()` and a system instruction. **There is no simulated fallback**: without an API key, `sendMessage` appends a `system`-role message containing `NO_API_KEY_MESSAGE` and logs `sendMessage without key`. Token counts come from the API's `usageMetadata`.

### Signature
```typescript
function useGemini(): {
  messages: AIMessage[];                 // role 'system' entries are local errors, not model output
  isLoading: boolean;
  sendMessage: (prompt: string) => Promise<void>;
  clearMessages: () => void;             // also resets the chat session
  hasApiKey: boolean;
  setApiKey: (key: string | null) => void;
  model: string;                         // 'gemini-3.8-flash'
};
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `messages` | `AIMessage[]` | Multi-turn chat history; model replies carry `latencyMs` and API `tokenCount` |
| `isLoading` | `boolean` | True while a request is in flight |
| `hasApiKey` | `boolean` | Whether a key is loaded from SecureStore |
| `model` | `string` | Cloud model id in use |

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
    // Pulse camera bar LED ring in cyan while reasoning
    hilight.triggerGeminiPulse(4000);
    await gemini.sendMessage(text);
  };

  return (
    <View>
      {gemini.messages.map(m => (
        <Text key={m.id}>[{m.role}]: {m.content}</Text>
      ))}
      <TextInput value={input} onChangeText={setInput} placeholder="Ask assistant..." />
      <HapticButton title="Send" onPress={handleSend} disabled={gemini.isLoading} />
    </View>
  );
}
```

---

## `useGeminiNano`

Gemini Nano on-device through the local `modules/pixel-nano` Expo Module, which wraps `com.google.mlkit:genai-prompt:1.0.0-beta4` (ML Kit GenAI Prompt API on AICore). Status, base model name, token limit and feature flags (system prompt, thinking mode, structured output, caching) are read from `GenerativeModel`. Latency and time-to-first-token are measured around the native call; output token counts come from the on-device tokenizer (`countTokens`). AICore keeps no history, so `buildNanoTurn()` re-sends a capped transcript with the system instruction. **There is no cloud fallback and no simulated reply**: when the model is not `available`, `sendMessage` appends a `system`-role error.

Requires the dev client or a release APK on a device with AICore (Pixel 9 and later; verified on Pixel 11 Pro). On web and in Expo Go the module resolves to `null` and `source` is `'unavailable'`.

### Signature
```typescript
function useGeminiNano(): {
  status: 'available' | 'downloadable' | 'downloading' | 'unavailable';
  isAvailable: boolean;
  info: NanoModelInfo | null;            // baseModelName, tokenLimit, thinkingModeAvailable, systemPromptAvailable, …
  messages: AIMessage[];                 // role 'system' entries are local errors
  partial: string;                       // streamed text for the in-flight reply
  thoughts: string[];                    // thinking-mode output when enabled and supported
  lastLatencyMs: number | null;          // hardware
  lastFirstTokenMs: number | null;       // hardware
  lastOutputTokens: number | null;       // on-device tokenizer
  lastDecodeTokensPerSec: number | null; // derived: output tokens ÷ time after first token
  downloadedBytes: number | null; isDownloading: boolean; isWarmingUp: boolean; warmupMs: number | null;
  isGenerating: boolean; error: string | null;
  source: 'hardware' | 'unavailable';
  refresh(): Promise<void>;
  download(): Promise<NanoStatus>;
  warmup(): Promise<number | null>;
  countTokens(prompt: string, options?: NanoOptions): Promise<number | null>;
  generate(prompt: string, options?: NanoOptions): Promise<NanoResult>;
  sendMessage(prompt: string): Promise<void>;
  clearMessages(): void;
  setModelConfig(stage: 'stable' | 'preview', preference: 'full' | 'fast'): Promise<void>;
};
```

### Native module (`modules/pixel-nano`)
| Function | ML Kit call | Notes |
| :--- | :--- | :--- |
| `checkStatus()` | `GenerativeModel.checkStatus()` | `FeatureStatus` int mapped to a string |
| `getModelInfo()` | `getBaseModelName`, `getTokenLimit`, `isThinkingModeAvailable`, `isSystemPromptAvailable`, `isStructuredOutputFeatureAvailable`, `isCachingFeatureAvailable` | each field null when AICore does not answer |
| `download()` | `download(): Flow<DownloadStatus>` | progress as `onDownloadProgress` events |
| `warmup()` | `warmup()` | returns wall time in ms |
| `countTokens(prompt, options)` | `countTokens(request)` | on-device tokenizer |
| `generate(prompt, options)` | `generateContent(request)` | single shot |
| `stream(requestId, prompt, options)` | `generateContent(request, StreamingCallback)` | `onToken` / `onThought` events tagged with `requestId` |
| `setModelConfig(stage, preference)` | `Generation.getClient(generationConfig { modelConfig { … } })` | `ModelReleaseStage.STABLE|PREVIEW`, `ModelPreference.FULL|FAST` |

Options map to `GenerateContentRequest.Builder`: `systemInstruction` (a `SystemInstruction` part), `temperature`, `topK`, `candidateCount`, `maxOutputTokens`, `seed`, `thinking` (`enableThinking`), `imageBase64` (one `ImagePart`). Errors surface as `E_NANO_<ErrorCode>` (`NOT_AVAILABLE`, `BUSY`, `REQUEST_TOO_LARGE`, `BACKGROUND_USE_BLOCKED`, …).

Build note: genai-prompt beta4 is compiled with Kotlin 2.3 while Expo 57 builds with Kotlin 2.1.20. The module passes `-Xskip-metadata-version-check` for its own compile and pins every `kotlin-stdlib` artifact in the build to the project's Kotlin version (see `modules/pixel-nano/android/build.gradle`).

### Usage
```tsx
import { useGeminiNano, HapticButton } from './src';

export function OnDeviceAssistant() {
  const nano = useGeminiNano();
  return (
    <View>
      <Text>Gemini Nano: {nano.status} · {nano.info?.baseModelName ?? '—'} · limit {nano.info?.tokenLimit ?? '—'} tokens</Text>
      {nano.status === 'downloadable' && <HapticButton title="Download model" onPress={() => nano.download()} />}
      <HapticButton title="Ask on-device" onPress={() => nano.sendMessage('Summarise the thermal state')} disabled={!nano.isAvailable} />
      {nano.partial ? <Text>{nano.partial}</Text> : null}
      <Text>{nano.lastLatencyMs ?? '—'} ms · first token {nano.lastFirstTokenMs ?? '—'} ms · {nano.lastDecodeTokensPerSec ?? '—'} tok/s</Text>
    </View>
  );
}
```

---

## `useSpeechAI`

Voice capture through `useAudio` (expo-audio, 16 kHz mono via the `voice_recognition` source, verified in `dumpsys audio` as `src:VOICE_RECOGNITION pack:com.pixelkit.sdk`) and transcription through Gemini audio understanding (`gemini-3.8-flash`). **No simulated transcript**: without a key the recording is kept (`lastRecordingUri`) and `error` is set to `NO_API_KEY_MESSAGE`. On-device streaming recognition (ML Kit GenAI Speech Recognition) is the planned replacement; see `docs/guides/voice.md`.

### Signature
```typescript
function useSpeechAI(): {
  isListening: boolean;
  isTranscribing: boolean;
  voiceDecibels: number;                              // dBFS
  lastTranscript: SpeechTranscriptionResult | null;   // confidence is null (Gemini does not report one)
  lastRecordingUri: string | null;
  error: string | null;
  startListening: () => Promise<boolean>;
  stopListeningAndTranscribe: () => Promise<SpeechTranscriptionResult | null>;
  model: string;
};
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `isListening` | `boolean` | True while audio is actively streaming from mic |
| `isTranscribing` | `boolean` | True while converting speech audio into text tokens |
| `voiceDecibels` | `number` | Real-time sound level in dBFS (-160 to 0) |
| `lastTranscript` | `SpeechTranscriptionResult` | Text transcript, confidence score, and latency |

### Example
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useSpeechAI, useGemini, HapticButton } from './src';

export function VoiceCommander() {
  const speech = useSpeechAI();
  const gemini = useGemini();

  const handleVoice = async () => {
    if (speech.isListening) {
      const res = await speech.stopListeningAndTranscribe();
      if (res?.transcript) {
        gemini.sendMessage(res.transcript);
      }
    } else {
      await speech.startListening();
    }
  };

  return (
    <View>
      <HapticButton
        title={speech.isListening ? `Listening (${speech.voiceDecibels} dB)... Tap to Finish` : "Start Voice"}
        onPress={handleVoice}
        variant={speech.isListening ? "danger" : "primary"}
      />
    </View>
  );
}
```

---

## `useVisionAI`

Captures a photo (camera or gallery via expo-image-picker) and sends it to Gemini with a JSON response schema (`responseJsonSchema`), so **the description and labels come from the model**, not from hard-coded strings. Without a key the image is kept and `error` is set; nothing is simulated.

### Signature
```typescript
function useVisionAI(): {
  isAnalyzing: boolean;
  analysis: VisionAnalysisResult | null;      // { description, labels[], latencyMs, timestamp }
  selectedImageUri: string | null;
  error: string | null;                        // permission, missing key, or API error
  captureAndAnalyze: (useCamera?: boolean) => Promise<VisionAnalysisResult | null>;
  model: string;
};
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `isAnalyzing` | `boolean` | True while the multimodal request is in flight |
| `analysis` | `VisionAnalysisResult` | Model-generated description and 1–5 labels, with latency |
| `selectedImageUri` | `string \| null` | Local file URI of the captured photo |
| `error` | `string \| null` | Why the last call produced no analysis |

---

## `geminiClient`

Provides secure storage and initialization utilities:
* `getStoredApiKey(): Promise<string | null>`: Pulls encrypted key from Titan M3.
* `saveApiKey(apiKey: string): Promise<boolean>`: Encrypts key into Titan M3.
* `createGeminiClient(apiKey: string): GoogleGenAI`: Instantiates the official Google Gen AI client.

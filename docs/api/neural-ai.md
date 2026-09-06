# Neural & AI API Reference 🧠
> **Google Gemini 2.5 Flash, Voice Speech-to-Text, Multimodal Vision, and Titan M3 Keystore**

This document covers conversational reasoning, speech audio transcription, multimodal camera scene inspection, and hardware-secured API key management.

---

## 📑 Module Index

* [`useGemini`](#usegemini) - Multi-Turn Conversational Reasoning & Streaming
* [`useSpeechAI`](#usespeechai) - Quad-Mic Speech-to-Text Transcription Pipeline
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

## `useSpeechAI`

Voice capture through `useAudio` (expo-audio, 16 kHz mono via the `voice_recognition` source, verified in `dumpsys audio` as `src:VOICE_RECOGNITION pack:com.pixelforge.sdk`) and transcription through Gemini audio understanding (`gemini-3.8-flash`). **No simulated transcript**: without a key the recording is kept (`lastRecordingUri`) and `error` is set to `NO_API_KEY_MESSAGE`. On-device streaming recognition (ML Kit GenAI Speech Recognition) is the planned replacement; see `docs/guides/voice.md`.

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

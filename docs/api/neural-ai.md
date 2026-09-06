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

Official Google Gen AI SDK integration (`@google/genai`) configured for Gemini 2.5 Flash with fallback simulation and hardware-backed API key resolution.

### Signature
```typescript
function useGemini(): {
  messages: AIMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (prompt: string) => Promise<string>;
  clearHistory: () => void;
  apiKey: string | null;
  setApiKey: (key: string) => Promise<void>;
};
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `messages` | `AIMessage[]` | Multi-turn chat message history |
| `isLoading` | `boolean` | True while neural reasoning tokens stream |
| `error` | `string \| null` | API or network error description |
| `apiKey` | `string \| null` | Masked API key loaded from Titan M3 Keystore |

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

Acoustic voice recording using the Pixel multi-mic beamforming array with real-time decibel metering and speech-to-text transcription.

### Signature
```typescript
function useSpeechAI(): {
  isListening: boolean;
  isTranscribing: boolean;
  voiceDecibels: number;
  lastTranscript: SpeechTranscriptionResult | null;
  startListening: () => Promise<void>;
  stopListeningAndTranscribe: () => Promise<SpeechTranscriptionResult | null>;
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

Takes raw photo buffers from the camera or photo picker and routes multimodal prompts directly to Gemini Vision.

### Signature
```typescript
function useVisionAI(): {
  isAnalyzing: boolean;
  analysisResult: VisionAnalysisResult | null;
  lastImageUri: string | null;
  captureAndAnalyze: (useCameraSource?: boolean, customPrompt?: string) => Promise<VisionAnalysisResult | null>;
  clearAnalysis: () => void;
};
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `isAnalyzing` | `boolean` | True while multimodal vision model runs |
| `analysisResult` | `VisionAnalysisResult` | Scene description, detected object labels, and latency |
| `lastImageUri` | `string \| null` | Local file URI of the captured photo |

---

## `geminiClient`

Provides secure storage and initialization utilities:
* `getStoredApiKey(): Promise<string | null>`: Pulls encrypted key from Titan M3.
* `saveApiKey(apiKey: string): Promise<boolean>`: Encrypts key into Titan M3.
* `createGeminiClient(apiKey: string): GoogleGenAI`: Instantiates the official Google Gen AI client.

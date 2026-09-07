# Neural & AI API Reference 🧠
> **Google gemini-3.8-flash, Voice Speech-to-Text, Multimodal Vision, and Titan M3 Keystore**

This document covers conversational reasoning, speech audio transcription, multimodal camera scene inspection, and hardware-secured API key management.

---

## 📑 Module Index

* [`useGemini`](#usegemini) - Multi-Turn Conversational Reasoning & Streaming
* [`useGeminiNano`](#usegemininano) - Gemini Nano on-device (ML Kit GenAI Prompt API on AICore)
* [`useGenAITasks`](#usegenaitasks) - Dedicated On-Device GenAI Task Clients (Summarize, Proofread, Rewrite)
* [`useNaturalLanguageAI`](#usenaturallanguageai) - 58-Language Offline Machine Translation, Language ID & Entity Extraction
* [`useSpeechAI`](#usespeechai) - Dual-Mode ASI Offline & Gemini Cloud Speech Recognition
* [`useVisionAI`](#usevisionai) - Google ML Kit On-Device Vision Suite & Multimodal Scene Analysis
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

## `useGenAITasks`

Dedicated on-device GenAI task clients powered by ML Kit and AICore. Executes directly on the Tensor G6 TPU with hardware-measured latency.

### Signature
```typescript
function useGenAITasks(): {
  isRunning: boolean;
  error: string | null;
  summaryResult: SummarizeResult | null;
  proofreadResult: ProofreadResult | null;
  rewriteResult: RewriteResult | null;
  imageDescriptionResult: ImageDescriptionResult | null;
  summarize: (text: string, options?: SummarizeOptions) => Promise<SummarizeResult | null>;
  proofread: (text: string) => Promise<ProofreadResult | null>;
  rewrite: (text: string, tone?: TaskTone) => Promise<RewriteResult | null>;
  describeImage: (input: string, style?: 'detailed' | 'caption' | 'labels' | 'concise') => Promise<ImageDescriptionResult | null>;
  source: 'hardware' | 'unavailable';
};
```

---

## `useNaturalLanguageAI`

Comprehensive on-device natural language intelligence operating completely offline:
* **Machine Translation**: Offline neural translation across 58 language pairs.
* **Language Identification**: Sub-10ms language identification across 50+ languages with candidate probability distribution.
* **Smart Reply Generation**: Context-aware conversational reply suggestions.
* **Entity Extraction**: Regex and neural extraction of dates, addresses, flight numbers, monetary amounts, and shipment tracking codes.

### Signature
```typescript
function useNaturalLanguageAI(): {
  isProcessing: boolean;
  error: string | null;
  languageResult: LanguageIdResult | null;
  translationResult: TranslationResult | null;
  smartReplyResult: SmartReplyResult | null;
  entityResult: EntityExtractionResult | null;
  identifyLanguage: (text: string) => Promise<LanguageIdResult | null>;
  translate: (text: string, sourceLang?: string, targetLang?: string) => Promise<TranslationResult | null>;
  suggestReplies: (history: Array<{ text: string; timestamp?: number; isLocalUser?: boolean; sender?: string }>) => Promise<SmartReplyResult | null>;
  extractEntities: (text: string) => Promise<EntityExtractionResult | null>;
  source: 'hardware' | 'unavailable';
};
```

---

## `useVisionAI`

Combines Google ML Kit on-device computer vision with Google Gemini 3.8 multimodal scene understanding:
* **Text Recognition v2 (OCR)**: Extracts structured text blocks and lines from documents or physical signs on-device.
* **Barcode & QR Scanning**: Low-latency decoding of 1D and 2D barcode formats on-device.
* **Image Labeling**: Fast classification of visual entities and environments on-device.
* **Face & 3D Mesh Detection**: Real-time facial landmark tracking, smile/eye open metrics, and 468-point 3D contour meshes on-device.
* **Object Detection & Tracking**: Bounding box spatial coordinates and tracking IDs on-device.
* **Gemini Multimodal Scene Analysis**: Cloud multi-sentence scene synthesis and structured label extraction via JSON schema.

### Signature
```typescript
function useVisionAI(): {
  // Cloud Gemini
  isAnalyzing: boolean;
  analysis: VisionAnalysisResult | null;
  selectedImageUri: string | null;
  selectedImageBase64: string | null;
  captureAndAnalyze: (useCamera?: boolean) => Promise<VisionAnalysisResult | null>;
  pickImage: (useCamera?: boolean) => Promise<{ uri: string; base64?: string } | null>;
  // On-Device ML Kit
  isOnDeviceProcessing: boolean;
  barcodeResult: BarcodeScanResult | null;
  ocrResult: TextRecognitionResult | null;
  facesResult: FaceDetectionResult | null;
  faceMeshResult: FaceMeshResult | null;
  labelsResult: ImageLabelResult | null;
  objectsResult: ObjectDetectionResult | null;
  poseResult: PoseDetectionResult | null;
  selfieResult: SelfieSegmentationResult | null;
  subjectResult: SubjectSegmentationResult | null;
  digitalInkResult: DigitalInkResult | null;
  scanBarcodes: (input: string) => Promise<BarcodeScanResult | null>;
  recognizeText: (input: string) => Promise<TextRecognitionResult | null>;
  detectFaces: (input: string) => Promise<FaceDetectionResult | null>;
  detectFaceMesh: (input: string) => Promise<FaceMeshResult | null>;
  labelImage: (input: string) => Promise<ImageLabelResult | null>;
  detectObjects: (input: string) => Promise<ObjectDetectionResult | null>;
  detectPose: (input: string) => Promise<PoseDetectionResult | null>;
  segmentSelfie: (input: string) => Promise<SelfieSegmentationResult | null>;
  segmentSubject: (input: string) => Promise<SubjectSegmentationResult | null>;
  recognizeDigitalInk: (strokes: Array<Array<{ x: number; y: number; t?: number }>>, languageTag?: string) => Promise<DigitalInkResult | null>;
  source: 'hardware' | 'unavailable';
  error: string | null;
  model: string;
};
```

## `geminiClient`

Provides secure storage and initialization utilities:
* `getStoredApiKey(): Promise<string | null>`: Pulls encrypted key from Titan M3.
* `saveApiKey(apiKey: string): Promise<boolean>`: Encrypts key into Titan M3.
* `createGeminiClient(apiKey: string): GoogleGenAI`: Instantiates the official Google Gen AI client.

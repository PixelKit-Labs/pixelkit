# On-Device AI with Gemini Nano 4 (AICore + ML Kit GenAI) 🧠

> Build the `pixel-nano` local Expo Module that bridges the **ML Kit GenAI Prompt API** to React Native, then wrap it in a `useGeminiNano` hook with cloud fallback. Target: Pixel 11 / 11 Pro / 11 Pro XL / 11 Pro Fold (Gemini Nano tier `nano-v4`). Works on Pixel 9 and 10 with `nano-v3`.

---

## 1. How the stack fits together

```text
React Native (Hermes)
  useGeminiNano()  ───►  modules/pixel-nano/src/index.ts   (requireNativeModule('PixelNano'))
                              │ JSI
                         PixelNanoModule.kt  (Expo Modules API, Kotlin coroutines)
                              │
                         com.google.mlkit:genai-prompt   (Generation.getClient())
                              │ IPC
                         AICore system service  (model mgmt, safety filters, LoRA, TPU dispatch)
                              │
                         Gemini Nano 4 on Tensor G6 TPU
```

Facts that drive the design:

| Fact | Consequence |
| :--- | :--- |
| Model weights are owned by **AICore**, delivered via Private Compute Services. | Your app never bundles or downloads weights. You call `checkStatus()` and, if `DOWNLOADABLE`, `download()` and show progress. |
| **Single-turn only.** AICore has no server-side history. | Keep chat history in JS and prepend a compact transcript to each prompt. Cap it so the whole request stays under ~4,000 tokens. |
| **Foreground only.** AICore rejects background inference. | Never call it from a background task. Fall back to cloud there. |
| **Per-app quota.** Excess concurrency returns `ErrorCode.BUSY`. | Serialise requests through one queue in the module. |
| Structured output uses compile-time **Kotlin `@Generable` classes**. | You cannot pass an arbitrary JSON schema from JS. Ship a small library of generic typed shapes (see section 6). |
| Unlocked bootloader disables GenAI APIs. | Detect and report `UNAVAILABLE` gracefully. |
| No emulator support. | Test on a physical Pixel; use the cloud path in emulators. |

---

## 2. Project setup

### 2.1 Dependencies and build properties

```bash
npm i expo-build-properties expo-dev-client
npx create-expo-module@latest --local     # prompt: name "pixel-nano", Android package "expo.modules.pixelnano"
```

`app.json` additions (see [guides README](./README.md#3-build-prerequisites-shared-by-all-three-guides) for the full block): `compileSdkVersion` / `targetSdkVersion` **37**, `minSdkVersion` **26**.

### 2.2 Gradle dependencies for the module

`modules/pixel-nano/android/build.gradle`:

```groovy
plugins { id "com.google.devtools.ksp" }   // needed for the structured-output schema compiler

dependencies {
  implementation "com.google.mlkit:genai-prompt:1.0.0-beta4"          // beta4 (2026-07-21): Nano v4 + streaming fixes
  implementation "com.google.mlkit:genai-schema:1.0.0-alpha1"         // @Generable / @Guide annotations
  ksp            "com.google.mlkit:genai-schema-compiler:1.0.0-alpha1" // generates the schema at build time
  // Optional: feature APIs (same AICore backend, tuned prompts)
  implementation "com.google.mlkit:genai-summarization:1.0.0-beta1"
  implementation "com.google.mlkit:genai-image-description:1.0.0-beta1"
  implementation "com.google.mlkit:genai-speech-recognition:1.0.0-alpha1"
}
```

Version history that matters (from the [ML Kit release notes](https://developers.google.com/ml-kit/release-notes)): beta1 (Jan 2026) graduated Prompt API to beta; beta2 (Apr 2026) added **model selection**; beta3 (Jul 14 2026) added **multi-image input**, **System Instructions**, **Thinking Mode**, **Structured Output** and raised output to **4,096 tokens**; beta4 (Jul 21 2026) fixed Gemini Nano **v4** compatibility and `generateContentStream()`. The get-started page still prints `beta2`; trust the release notes. Prompt API is beta, Structured Output and the schema compiler are alpha, so pin versions and re-verify on every ML Kit release.

### 2.3 Manifest

`modules/pixel-nano/android/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <!-- Only needed if you ALSO ship LiteRT / NNAPI models that hit the NPU directly (Android 17 rule). -->
  <uses-feature android:name="android.hardware.neural_processing_unit" android:required="false" />
</manifest>
```

### 2.4 ProGuard / R8 keep rules (required for structured output)

`modules/pixel-nano/android/proguard-rules.pro` and reference it from the module's `build.gradle` via `consumerProguardFiles`:

```proguard
# Keep every class annotated for structured output and its members. The annotation package
# comes from the genai-schema artifact; confirm the FQCN in your IDE after adding the dependency.
-keep @com.google.mlkit.genai.schema.Generable class * { *; }
-keepclassmembers class * { @com.google.mlkit.genai.schema.Guide *; }
```

---

## 3. The Kotlin module

`modules/pixel-nano/android/src/main/java/expo/modules/pixelnano/PixelNanoModule.kt`

```kotlin
package expo.modules.pixelnano

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import androidx.core.os.bundleOf
import com.google.mlkit.genai.common.FeatureStatus
import com.google.mlkit.genai.common.DownloadStatus
import com.google.mlkit.genai.prompt.Generation
import com.google.mlkit.genai.prompt.GenerativeModel
import com.google.mlkit.genai.prompt.ImagePart
import com.google.mlkit.genai.prompt.TextPart
import com.google.mlkit.genai.prompt.generateContentRequest
import com.google.mlkit.genai.prompt.StreamingCallback
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.exception.CodedException
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class NanoUnavailableException(status: String) :
  CodedException("E_NANO_UNAVAILABLE", "Gemini Nano is $status on this device", null)

class PixelNanoModule : Module() {
  private var model: GenerativeModel? = null
  private val gate = Mutex() // AICore enforces per-app quota; serialise requests.

  private fun client(): GenerativeModel =
    model ?: Generation.getClient().also { model = it }

  private fun statusName(s: FeatureStatus) = when (s) {
    FeatureStatus.AVAILABLE -> "available"
    FeatureStatus.DOWNLOADABLE -> "downloadable"
    FeatureStatus.DOWNLOADING -> "downloading"
    else -> "unavailable"
  }

  override fun definition() = ModuleDefinition {
    Name("PixelNano")

    Events("onDownloadProgress", "onToken", "onThought", "onStreamEnd", "onStreamError")

    // ── Availability ────────────────────────────────────────────────────────
    AsyncFunction("checkStatus") Coroutine { ->
      statusName(client().checkStatus())
    }

    AsyncFunction("download") Coroutine { ->
      client().download().collect { s ->
        when (s) {
          is DownloadStatus.DownloadStarted ->
            sendEvent("onDownloadProgress", bundleOf("phase" to "started", "bytes" to 0L))
          is DownloadStatus.DownloadProgress ->
            sendEvent("onDownloadProgress", bundleOf("phase" to "progress", "bytes" to s.totalBytesDownloaded))
          is DownloadStatus.DownloadCompleted ->
            sendEvent("onDownloadProgress", bundleOf("phase" to "completed"))
          is DownloadStatus.DownloadFailed ->
            throw CodedException("E_NANO_DOWNLOAD", s.e.message ?: "download failed", s.e)
        }
      }
      statusName(client().checkStatus())
    }

    // ── Single-shot generation (text, optional single image) ────────────────
    AsyncFunction("generate") Coroutine { prompt: String, options: Map<String, Any?>? ->
      gate.withLock {
        ensureAvailable()
        val req = buildRequest(prompt, options)
        val res = client().generateContent(req)
        val cand = res.candidates.firstOrNull()
        mapOf(
          "text" to (cand?.text ?: ""),
          "finishReason" to (cand?.finishReason?.name ?: "UNKNOWN"),
          "thoughts" to res.thoughtProcess.map { it.text }
        )
      }
    }

    // ── Streaming generation: tokens (and thoughts) arrive as events ────────
    AsyncFunction("stream") Coroutine { requestId: String, prompt: String, options: Map<String, Any?>? ->
      gate.withLock {
        ensureAvailable()
        val req = buildRequest(prompt, options)
        try {
          client().generateContent(req, object : StreamingCallback {
            override fun onNewText(additionalText: String) {
              sendEvent("onToken", bundleOf("requestId" to requestId, "text" to additionalText))
            }
            override fun onNewThought(additionalThought: String) {
              sendEvent("onThought", bundleOf("requestId" to requestId, "text" to additionalThought))
            }
          })
          sendEvent("onStreamEnd", bundleOf("requestId" to requestId))
        } catch (e: Exception) {
          sendEvent("onStreamError", bundleOf("requestId" to requestId, "message" to (e.message ?: "stream failed")))
        }
      }
    }

    OnDestroy { model?.close(); model = null }
  }

  private suspend fun ensureAvailable() {
    val s = client().checkStatus()
    if (s != FeatureStatus.AVAILABLE) throw NanoUnavailableException(statusName(s))
  }

  private fun buildRequest(prompt: String, options: Map<String, Any?>?) =
    generateContentRequest(*parts(prompt, options)) {
      (options?.get("systemInstruction") as? String)?.let { systemInstruction = SystemInstruction(it) } // Beta, Nano V3+
      (options?.get("temperature") as? Double)?.let { temperature = it.toFloat() }
      (options?.get("topK") as? Double)?.let { topK = it.toInt() }
      (options?.get("candidateCount") as? Double)?.let { candidateCount = it.toInt() }
      (options?.get("maxOutputTokens") as? Double)?.let { maxOutputTokens = it.toInt() } // ≤ 4096 since beta3
      enableThinking = options?.get("thinking") == true
    }

  /** Order: images first (any number since beta3), then the text prompt. */
  private fun parts(prompt: String, options: Map<String, Any?>?): Array<Any> {
    val list = mutableListOf<Any>()
    @Suppress("UNCHECKED_CAST")
    val images = (options?.get("imagesBase64") as? List<String>)
      ?: (options?.get("imageBase64") as? String)?.let { listOf(it) }
      ?: emptyList()
    for (b64 in images) {
      val bytes = Base64.decode(b64, Base64.DEFAULT)
      val bmp: Bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
      list += ImagePart(bmp)
    }
    list += TextPart(prompt)
    return list.toTypedArray()
  }
}
```

Add `import com.google.mlkit.genai.prompt.SystemInstruction` to the imports.

### 3.1 Choosing the model track (AICore Developer Preview)

Since beta2 the Prompt API lets the app pick which on-device model AICore serves. Testers enrolled in the [AICore Developer Preview](https://developers.google.com/ml-kit/genai/aicore-dev-preview) can target Gemma 4 preview builds, and Google states that code written against Gemma 4 runs unchanged on Gemini Nano 4 devices:

```kotlin
val previewConfig = generationConfig {
  modelConfig = ModelConfig {
    releaseTrack = ModelReleaseTrack.PREVIEW   // STABLE for production
    preference   = ModelPreference.FULL        // E4B-class quality; use the fast preference for E2B-class latency
  }
}
```

Expose this as `PixelNano.setModelTrack('stable' | 'preview', 'full' | 'fast')` so the AI Lab screen can A/B the tracks. Ship with `STABLE`. Preview models can be slower, less accurate, and return `BUSY` more often.

Notes:

- `generateContentRequest(vararg parts) { config }` is the documented builder; `ImagePart(bitmap)` + `TextPart(text)` is the documented multimodal form. Order image first, text second.
- `enableThinking = true` is only honoured on Nano V4 and higher, so on Pixel 9/10 you will get an empty `thoughts` array.
- The Prompt API's streaming form documented alongside thinking mode is the `StreamingCallback` overload; a `generateContentStream(...)`. Flow variant also exists. Either is fine; the callback maps naturally to Expo events.
- Expo Modules' `AsyncFunction(...) Coroutine { }` runs on a module-owned dispatcher, so calling suspend ML Kit APIs directly is safe.

---

## 4. The TypeScript bridge

`modules/pixel-nano/src/index.ts`

```ts
import { NativeModule, requireNativeModule } from 'expo';

export type NanoStatus = 'available' | 'downloadable' | 'downloading' | 'unavailable';

export type NanoOptions = {
  systemInstruction?: string; // Beta, Nano V3+. Keep under ~150 words; not recommended with prefix caching
  temperature?: number;       // 0..1, default model-defined
  topK?: number;
  candidateCount?: number;
  maxOutputTokens?: number;   // ≤ 4096
  thinking?: boolean;         // Gemini Nano V4+ only
  imageBase64?: string;       // single JPEG/PNG, keep ≤ 1024px on the long edge
  imagesBase64?: string[];    // multi-image (Prompt API beta3+); all images count against the ~4K-token input budget
};

export type NanoResult = { text: string; finishReason: string; thoughts: string[] };

type Events = {
  onDownloadProgress(e: { phase: 'started' | 'progress' | 'completed'; bytes?: number }): void;
  onToken(e: { requestId: string; text: string }): void;
  onThought(e: { requestId: string; text: string }): void;
  onStreamEnd(e: { requestId: string }): void;
  onStreamError(e: { requestId: string; message: string }): void;
};

declare class PixelNanoModule extends NativeModule<Events> {
  checkStatus(): Promise<NanoStatus>;
  download(): Promise<NanoStatus>;
  generate(prompt: string, options?: NanoOptions): Promise<NanoResult>;
  stream(requestId: string, prompt: string, options?: NanoOptions): Promise<void>;
}

export default requireNativeModule<PixelNanoModule>('PixelNano');
```

---

## 5. The `useGeminiNano` hook

`src/ai/useGeminiNano.ts` — mirrors the shape of `useGemini` so screens can swap between them.

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import PixelNano, { type NanoOptions, type NanoStatus } from '../../modules/pixel-nano/src';

export type NanoTier = 'nano-v4' | 'nano-v3' | 'unknown';

export function detectNanoTier(): NanoTier {
  const m = Device.modelName ?? '';
  if (/Pixel 11/i.test(m)) return 'nano-v4';
  if (/Pixel (9|10)/i.test(m)) return 'nano-v3';
  return 'unknown';
}

export function useGeminiNano() {
  const [status, setStatus] = useState<NanoStatus>('unavailable');
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [thoughts, setThoughts] = useState<string[]>([]);
  const tier = useRef<NanoTier>(detectNanoTier()).current;

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    PixelNano.checkStatus().then(setStatus).catch(() => setStatus('unavailable'));
    const sub = PixelNano.addListener('onDownloadProgress', e => {
      if (e.phase === 'progress' && e.bytes != null) setDownloadedBytes(e.bytes);
      if (e.phase === 'completed') setStatus('available');
    });
    return () => sub.remove();
  }, []);

  const ensureReady = useCallback(async () => {
    const s = await PixelNano.checkStatus();
    if (s === 'downloadable') {
      setStatus('downloading');
      const after = await PixelNano.download();
      setStatus(after);
      return after === 'available';
    }
    setStatus(s);
    return s === 'available';
  }, []);

  const generate = useCallback(async (prompt: string, options?: NanoOptions) => {
    setIsGenerating(true);
    setThoughts([]);
    try {
      const res = await PixelNano.generate(prompt, options);
      setThoughts(res.thoughts);
      return res;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /** Streams tokens; resolves with the full text. */
  const stream = useCallback(
    (prompt: string, onToken: (t: string) => void, options?: NanoOptions) =>
      new Promise<string>((resolve, reject) => {
        const requestId = `nano_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        let full = '';
        const subs = [
          PixelNano.addListener('onToken', e => { if (e.requestId === requestId) { full += e.text; onToken(e.text); } }),
          PixelNano.addListener('onThought', e => { if (e.requestId === requestId) setThoughts(p => [...p, e.text]); }),
          PixelNano.addListener('onStreamEnd', e => { if (e.requestId === requestId) { cleanup(); resolve(full); } }),
          PixelNano.addListener('onStreamError', e => { if (e.requestId === requestId) { cleanup(); reject(new Error(e.message)); } }),
        ];
        const cleanup = () => { subs.forEach(s => s.remove()); setIsGenerating(false); };
        setIsGenerating(true);
        setThoughts([]);
        PixelNano.stream(requestId, prompt, options).catch(err => { cleanup(); reject(err); });
      }),
    [],
  );

  return { status, tier, downloadedBytes, isGenerating, thoughts, ensureReady, generate, stream };
}
```

### 5.1 Multi-turn on a single-turn engine

AICore does not keep history. Put **behaviour** in `systemInstruction` (a first-class request part since beta3) and re-send a compact **transcript** inside the prompt:

```ts
const MAX_HISTORY_CHARS = 6000; // ≈1,500 tokens, leaves room for the answer under the 4K cap

export function buildNanoTurn(history: { role: 'user' | 'model'; text: string }[], user: string) {
  let transcript = '';
  for (let i = history.length - 1; i >= 0; i--) {
    const line = `${history[i].role === 'user' ? 'User' : 'Assistant'}: ${history[i].text}\n`;
    if (transcript.length + line.length > MAX_HISTORY_CHARS) break;
    transcript = line + transcript;
  }
  return `${transcript}User: ${user}\nAssistant:`;
}

// usage
await nano.generate(buildNanoTurn(history, text), {
  systemInstruction: 'You are PixelForge, a concise hardware assistant. Answer in two sentences or fewer.',
});
```

Google's guidance: keep system instructions under ~150 words, and do not combine them with the experimental `prefixCaching` option.

---

## 6. Structured output (Alpha)

Structured output is Kotlin-only and compile-time. Declare a **small library of reusable shapes** in the module and select one by name from JS.

```kotlin
// modules/pixel-nano/android/src/main/java/expo/modules/pixelnano/Shapes.kt
import com.google.mlkit.genai.prompt.Generable
import com.google.mlkit.genai.prompt.Guide

@Generable("A decision about which tool to call, or none")
data class ToolChoice(
  @Guide(description = "Exact name of one registered tool, or \"none\"") val tool: String,
  @Guide(description = "JSON object string with the tool arguments, or \"{}\"") val argumentsJson: String,
  @Guide(description = "One sentence telling the user what you are doing") val say: String,
)

@Generable("A short classification result")
data class Classification(
  @Guide(description = "The chosen label") val label: String,
  @Guide(description = "Confidence from 0 to 100", minimum = 0.0, maximum = 100.0) val confidence: Double,
)

@Generable("Extracted key facts")
data class KeyFacts(
  @Guide(description = "3 to 6 short bullet facts", minItems = 3, maxItems = 6) val facts: List<String>,
)
```

Add to the module definition:

```kotlin
AsyncFunction("generateStructured") Coroutine { shape: String, prompt: String, options: Map<String, Any?>? ->
  gate.withLock {
    ensureAvailable()
    val base = buildRequest(prompt, options)
    val outputClass = when (shape) {
      "ToolChoice" -> ToolChoice::class
      "Classification" -> Classification::class
      "KeyFacts" -> KeyFacts::class
      else -> throw CodedException("E_NANO_SHAPE", "Unknown shape $shape", null)
    }
    val typed = client().generateContent(
      generateTypedContentRequest(generateContentRequest = base, outputClass = outputClass)
    )
    val cand = typed.candidates.firstOrNull()
    mapOf(
      "finishReason" to (cand?.finishReason?.name ?: "UNKNOWN"),
      "json" to (cand?.response?.let { com.google.gson.Gson().toJson(it) } ?: "null")
    )
  }
}
```

Finish reasons you must handle: `STOP`, `MAX_TOKENS`, `PARSE_CLASS_ERROR`, `STRUCTURE_NOT_ANNOTATED`, `STRUCTURE_VALUES_INVALID`, `OTHER`. On anything but `STOP`, retry once with a lower `temperature` (0.1) and a tighter prompt, then fall back to cloud.

On the JS side validate with `zod` before trusting the result; the alpha parser is strict but the model can still put nonsense inside a valid string.

Supported field types: `String` (`description`, `enumValues`), `Int`/`Long`/`Double`/`Float` (`minimum`, `maximum`), `Boolean`, `List<T>` (`minItems`, `maxItems`). No nested circular references.

---

## 7. Thinking mode (Beta, Nano V4+)

Set `thinking: true` in options. The module already forwards `enableThinking` and surfaces `thoughtProcess` / `onNewThought`. UX rules that make it feel native on Pixel:

1. Render thoughts in a collapsed "Thinking…" row; stream the answer below it.
2. Drive `useHiLight().setMode('gemini_thinking')` while thoughts stream, `'glow'` when the first answer token lands, `off` on `onStreamEnd`.
3. Fire `useHaptics().selection()` once on first answer token, never per token.
4. Thinking costs latency and tokens against the same 4K budget; only enable for reasoning tasks (planning, maths, multi-constraint extraction).

---

## 8. Hybrid routing: Nano first, cloud fallback

Firebase AI Logic offers `InferenceMode.PREFER_ON_DEVICE` natively for Kotlin apps. In React Native, implement the same policy in one place so every feature gets it for free.

`src/ai/router.ts`

```ts
import { useGeminiNano } from './useGeminiNano';
import { createGeminiClient, getStoredApiKey } from './geminiClient';

export type InferenceMode = 'prefer_on_device' | 'only_on_device' | 'prefer_cloud' | 'only_cloud';

const NANO_MAX_CHARS = 12000;                 // ~3,000 English words, ML Kit's stated ceiling
const CLOUD_MODEL = 'gemini-3.8-flash';

export function useHybridGenerate(mode: InferenceMode = 'prefer_on_device') {
  const nano = useGeminiNano();

  async function cloud(prompt: string, imageBase64?: string) {
    const key = await getStoredApiKey();
    if (!key) throw new Error('No Gemini API key in Titan M3 SecureStore');
    const ai = createGeminiClient(key);
    const parts: any[] = [];
    if (imageBase64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });
    parts.push({ text: prompt });
    const res = await ai.models.generateContent({ model: CLOUD_MODEL, contents: [{ role: 'user', parts }] });
    return { text: res.text ?? '', source: 'cloud' as const };
  }

  async function onDevice(prompt: string, imageBase64?: string) {
    const ok = await nano.ensureReady();
    if (!ok) throw new Error(`nano:${nano.status}`);
    const r = await nano.generate(prompt, { imageBase64 });
    return { text: r.text, source: 'on-device' as const, thoughts: r.thoughts };
  }

  return async function generate(prompt: string, imageBase64?: string) {
    const fitsNano = prompt.length <= NANO_MAX_CHARS;
    switch (mode) {
      case 'only_on_device': return onDevice(prompt, imageBase64);
      case 'only_cloud':     return cloud(prompt, imageBase64);
      case 'prefer_cloud':
        try { return await cloud(prompt, imageBase64); } catch { return onDevice(prompt, imageBase64); }
      case 'prefer_on_device':
      default:
        if (!fitsNano) return cloud(prompt, imageBase64);
        try { return await onDevice(prompt, imageBase64); }
        catch (e) {
          // E_NANO_UNAVAILABLE, BUSY quota, background, unlocked bootloader → cloud
          return cloud(prompt, imageBase64);
        }
    }
  };
}
```

Always surface `source` in the UI ("On-device · Gemini Nano 4" vs "Cloud · Gemini 3.8 Flash"). Users on Pixel expect to know when data left the phone.

---

## 9. Feature APIs (pre-tuned, same backend)

For the four canned tasks, ML Kit's feature APIs give better quality than a hand-written prompt and are supported on far more devices than the Prompt API:

| API | Artifact | Use in PixelForge |
| :--- | :--- | :--- |
| Summarization | `genai-summarization` | Summarise sensor logs, chat threads, docs |
| Proofreading | `genai-proofreading` | Fix dictated text from `useSpeechAI` |
| Rewriting | `genai-rewriting` | Tone shift for notifications / replies |
| Image Description | `genai-image-description` | Alt text for `useCamera` captures without cloud |
| Speech Recognition | `genai-speech-recognition` | See the [Voice guide](./voice.md) |

Expose them from the same module as `summarize(text, {style})`, `describeImage(base64)`, following the identical `checkStatus → download → run` lifecycle.

---

## 10. Testing on the Pixel

```bash
# Is AICore present and which Nano tier?
adb shell pm list packages | grep -E "aicore|privatecompute"
adb shell dumpsys package com.google.android.aicore | grep versionName

# Watch inference + download
adb logcat -s AICore:* MLKit:* PixelNano:*

# Force-foreground check: put the app in background and call generate → expect E_NANO_UNAVAILABLE / busy
```

Checklist before you call it done:

- [ ] `checkStatus` transitions `downloadable → downloading → available` with progress bytes in the UI.
- [ ] A 1,000-word prompt returns; a 4,000-word prompt routes to cloud without error.
- [ ] Image + text prompt works with a 1024px JPEG; larger images are downscaled in JS first (`expo-image-manipulator`).
- [ ] `thinking: true` produces thoughts on Pixel 11, empty array on Pixel 9/10.
- [ ] Structured output `ToolChoice` parses for 20 consecutive prompts with `temperature: 0.2`.
- [ ] Airplane mode: `prefer_on_device` still answers; `prefer_cloud` falls back to Nano.
- [ ] Docs updated: `docs/api/neural-ai.md`, `docs/HARDWARE_API.md`, `README.md` matrix, `DocsScreen.tsx` entry for `useGeminiNano`.

---

## 11. Sources

- [Prompt API get started](https://developers.google.com/ml-kit/genai/prompt/android/get-started) · [Structured output](https://developers.google.com/ml-kit/genai/prompt/android/structured-output) · [Thinking mode](https://developers.google.com/ml-kit/genai/prompt/android/thinking-mode) · [GenAI overview & device list](https://developers.google.com/ml-kit/genai) · [ML Kit release notes](https://developers.google.com/ml-kit/release-notes)
- [Gemini Nano on Android (AICore architecture)](https://developer.android.com/ai/gemini-nano) · [Hybrid inference](https://developer.android.com/ai/hybrid) · [Firebase AI Logic hybrid Android](https://firebase.google.com/docs/ai-logic/hybrid/android/get-started)
- [Expo Modules API](https://docs.expo.dev/modules/module-api/) · [Local modules](https://docs.expo.dev/modules/get-started/)
- [Android Developers: Enhance your app for the new Pixel lineup (Gemini Nano 4)](https://android-developers.googleblog.com/2026/08/pixel-app-experience-made-by-google.html)

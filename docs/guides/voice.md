# Voice: Speech In, Speech Out, and Live Voice Agents 🎙️

> Three voice tiers for the Pixel 11 Pro: (1) **on-device streaming speech-to-text** with ML Kit GenAI Speech Recognition (Advanced mode is Pixel 10/11 exclusive), (2) **realtime bidirectional voice agents** with the Gemini Live API over WebSockets using ephemeral tokens, and (3) **text-to-speech** on device (`expo-speech`) or with Gemini TTS. Plus the HiLight / haptic status language Google's own Gemini uses.

---

## 1. Pick the tier

| Need | Tier | Model / API | Network | Latency to first word |
| :--- | :--- | :--- | :--- | :--- |
| Dictation, voice commands, captions | **1. On-device STT** | `com.google.mlkit:genai-speech-recognition` (Gemini Nano, Advanced mode) | No | ~200 ms partials |
| Fallback STT on any Android 12+ | 1b | `android.speech.SpeechRecognizer` on-device | No | ~300 ms |
| Batch transcription with speakers | 1c | `gemini-3.5-transcribe` (cloud) | Yes | file-based |
| Talk to an agent that can act (tools), interrupt it, hear it | **2. Live API** | `gemini-3.1-flash-live-preview` | Yes (WSS) | ~500 ms |
| Read text aloud offline | **3. TTS local** | `expo-speech` (Android TTS engine) | No | ~100 ms |
| Studio-quality, controllable voice | 3b | `gemini-3.1-flash-tts-preview` | Yes | ~600 ms |

Audio formats you will meet: **16 kHz, mono, 16-bit little-endian PCM** into every Google speech API; **24 kHz, mono, 16-bit PCM** out of the Live API and Gemini TTS.

---

## 2. Capture: microphone access done right on Pixel

### 2.1 Permissions and audio mode (expo-audio)

`expo-av` is legacy in SDK 57. Use `expo-audio`.

```ts
import { requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';

export async function prepareMic() {
  const { granted } = await requestRecordingPermissionsAsync();
  if (!granted) throw new Error('RECORD_AUDIO denied');
  await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
}
```

### 2.2 File recording for batch transcription (expo-audio)

```ts
import { useAudioRecorder, useAudioRecorderState, RecordingPresets } from 'expo-audio';

const SPEECH_16K = {
  ...RecordingPresets.LOW_QUALITY,
  android: { extension: '.m4a', outputFormat: 'mpeg4', audioEncoder: 'aac', sampleRate: 16000, numberOfChannels: 1, bitRate: 48000 },
  isMeteringEnabled: true,
} as const;

export function useDictationRecorder() {
  const recorder = useAudioRecorder(SPEECH_16K);
  const state = useAudioRecorderState(recorder);          // isRecording, durationMillis, metering (dBFS)
  const start = async () => { await recorder.prepareToRecordAsync(); recorder.record(); };
  const stop = async () => { await recorder.stop(); return recorder.uri; };
  return { start, stop, state };
}
```

`state.metering` drives the `SensorVisualizer` waveform and the HiLight `pulse` brightness.

### 2.3 Realtime PCM streaming (native, in the `pixel-nano` module)

`expo-audio` records to files; the Live API needs a PCM stream. Add an `AudioRecord` loop to the same Expo Module. Use `VOICE_RECOGNITION` so the Pixel's multi-mic noise suppression is applied.

```kotlin
// modules/pixel-nano/android/src/main/java/expo/modules/pixelnano/PcmMic.kt
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Base64
import kotlin.concurrent.thread

class PcmMic(private val emit: (ByteArray) -> Unit) {
  private var record: AudioRecord? = null
  @Volatile private var running = false

  fun start(sampleRate: Int = 16000) {
    val minBuf = AudioRecord.getMinBufferSize(sampleRate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
    val buf = maxOf(minBuf, sampleRate / 10 * 2) // 100 ms chunks → ~3,200 bytes at 16 kHz
    record = AudioRecord(MediaRecorder.AudioSource.VOICE_RECOGNITION, sampleRate,
      AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, buf * 2).also { it.startRecording() }
    running = true
    thread(name = "PcmMic") {
      val chunk = ByteArray(buf)
      while (running) {
        val n = record?.read(chunk, 0, chunk.size) ?: -1
        if (n > 0) emit(chunk.copyOf(n))
      }
    }
  }

  fun stop() { running = false; record?.run { stop(); release() }; record = null }
}
```

Module additions:

```kotlin
private var mic: PcmMic? = null

Events("onPcmChunk")
Function("startPcmMic") { sampleRate: Int ->
  mic?.stop()
  mic = PcmMic { bytes -> sendEvent("onPcmChunk", bundleOf("base64" to Base64.encodeToString(bytes, Base64.NO_WRAP))) }
  mic!!.start(sampleRate)
}
Function("stopPcmMic") { mic?.stop(); mic = null }
```

And a matching `AudioTrack` player for 24 kHz PCM output:

```kotlin
import android.media.AudioAttributes
import android.media.AudioTrack

class PcmSpeaker(sampleRate: Int = 24000) {
  private val track = AudioTrack.Builder()
    .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ASSISTANT).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
    .setAudioFormat(AudioFormat.Builder().setEncoding(AudioFormat.ENCODING_PCM_16BIT).setSampleRate(sampleRate).setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build())
    .setBufferSizeInBytes(sampleRate * 2) // 1 s
    .setTransferMode(AudioTrack.MODE_STREAM).build().also { it.play() }
  fun write(pcm: ByteArray) = track.write(pcm, 0, pcm.size)
  fun flush() { track.pause(); track.flush(); track.play() }   // barge-in: drop queued audio instantly
  fun release() = track.release()
}
```

```kotlin
private var speaker: PcmSpeaker? = null
Function("speakerStart") { rate: Int -> speaker?.release(); speaker = PcmSpeaker(rate) }
Function("speakerWrite") { base64: String -> speaker?.write(Base64.decode(base64, Base64.NO_WRAP)) }
Function("speakerFlush") { speaker?.flush() }
Function("speakerStop") { speaker?.release(); speaker = null }
```

`USAGE_ASSISTANT` routes through the same audio policy Google's Gemini uses, so Bluetooth LE Audio earbuds and the phone speaker behave as users expect. On **Android 17** this usage gets its own **Assistant volume stream**, decoupled from media volume, so users can mute music while still hearing your agent. `AudioManager.MODE_ASSISTANT_CONVERSATION` exists for apps holding the assistant role; regular apps should not set it.

---

## 3. Tier 1: On-device speech-to-text (ML Kit GenAI Speech Recognition)

**Facts:** artifact `com.google.mlkit:genai-speech-recognition:1.0.0-alpha1`, minSdk 26. **Basic** mode works on API 31+. **Advanced** mode (Gemini Nano, more languages, better accuracy) is **Pixel 10 and Pixel 11** only. Not available on unlocked bootloaders. Results stream as partials that later become final.

### 3.1 Kotlin (module additions)

```kotlin
import com.google.mlkit.genai.speech.AudioSource
import com.google.mlkit.genai.speech.SpeechRecognition
import com.google.mlkit.genai.speech.SpeechRecognizer
import com.google.mlkit.genai.speech.SpeechRecognizerOptions
import com.google.mlkit.genai.speech.SpeechRecognizerRequest
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers

private var stt: SpeechRecognizer? = null
private var sttJob: Job? = null
private val scope = CoroutineScope(Dispatchers.Default)

Events("onTranscript", "onSttError", "onSttDownload")

AsyncFunction("sttStatus") Coroutine { locale: String, preferAdvanced: Boolean ->
  val r = sttClient(locale, preferAdvanced)
  statusName(r.checkStatus())
}

AsyncFunction("sttDownload") Coroutine { locale: String, preferAdvanced: Boolean ->
  sttClient(locale, preferAdvanced).download().collect { sendEvent("onSttDownload", bundleOf("state" to it.toString())) }
  statusName(sttClient(locale, preferAdvanced).checkStatus())
}

Function("sttStart") { locale: String, preferAdvanced: Boolean ->
  val r = sttClient(locale, preferAdvanced)
  sttJob?.cancel()
  sttJob = scope.launch {
    try {
      r.startRecognition(SpeechRecognizerRequest(audioSource = AudioSource.fromMic())).collect { res ->
        sendEvent("onTranscript", bundleOf("text" to res.text, "isFinal" to res.isFinal))
      }
    } catch (e: Exception) {
      sendEvent("onSttError", bundleOf("message" to (e.message ?: "stt failed")))
    }
  }
}

Function("sttStop") { sttJob?.cancel(); stt?.stopRecognition() }

OnDestroy { sttJob?.cancel(); stt?.close(); stt = null }

private fun sttClient(locale: String, preferAdvanced: Boolean): SpeechRecognizer =
  stt ?: SpeechRecognition.getClient(
    SpeechRecognizerOptions.builder()
      .setLocale(java.util.Locale.forLanguageTag(locale))
      .setPreferredMode(if (preferAdvanced) SpeechRecognizerOptions.Mode.ADVANCED else SpeechRecognizerOptions.Mode.BASIC)
      .build()
  ).also { stt = it }
```

Confirm the exact option/response property names against the current [Speech Recognition API reference](https://developers.google.com/ml-kit/genai/speech-recognition/android) when you compile; the API is alpha. For file input use `AudioSource.fromPfd(parcelFileDescriptor)` with raw headerless 16 kHz mono PCM16 fed at real-time rate (~32 KB/s).

### 3.2 `useSpeechToText` hook

```ts
// src/ai/useSpeechToText.ts
import { useCallback, useEffect, useState } from 'react';
import PixelNano from '../../modules/pixel-nano/src';

export function useSpeechToText(locale = 'en-US') {
  const [partial, setPartial] = useState('');
  const [finals, setFinals] = useState<string[]>([]);
  const [isListening, setListening] = useState(false);
  const [status, setStatus] = useState<'unknown' | 'available' | 'downloadable' | 'downloading' | 'unavailable'>('unknown');

  useEffect(() => {
    const a = PixelNano.addListener('onTranscript', e => {
      if (e.isFinal) { setFinals(f => [...f, e.text]); setPartial(''); } else setPartial(e.text);
    });
    const b = PixelNano.addListener('onSttError', () => setListening(false));
    return () => { a.remove(); b.remove(); };
  }, []);

  const ensureReady = useCallback(async () => {
    let s = await PixelNano.sttStatus(locale, true);
    if (s === 'downloadable') { setStatus('downloading'); s = await PixelNano.sttDownload(locale, true); }
    setStatus(s);
    return s === 'available';
  }, [locale]);

  const start = useCallback(async () => {
    if (!(await ensureReady())) throw new Error(`stt:${status}`);
    setFinals([]); setPartial(''); setListening(true);
    PixelNano.sttStart(locale, true);
  }, [ensureReady, locale, status]);

  const stop = useCallback(() => { PixelNano.sttStop(); setListening(false); return [...finals, partial].filter(Boolean).join(' ').trim(); }, [finals, partial]);

  return { partial, finals, transcript: [...finals, partial].join(' ').trim(), isListening, status, start, stop };
}
```

Wire `useSpeechAI` to prefer this and only fall back to the current cloud transcription when `status === 'unavailable'`.

### 3.3 Fallback 1b: Android `SpeechRecognizer` on device

For non-Pixel or Basic-mode-unavailable devices:

```kotlin
if (android.speech.SpeechRecognizer.isOnDeviceRecognitionAvailable(ctx)) {
  val sr = android.speech.SpeechRecognizer.createOnDeviceSpeechRecognizer(ctx)
  val intent = android.content.Intent(android.speech.RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
    putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE_MODEL, android.speech.RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
    putExtra(android.speech.RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
    putExtra(android.speech.RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
  }
  sr.setRecognitionListener(listener); sr.startListening(intent)
}
```

Same `onTranscript` event shape, so the hook does not change.

### 3.4 Fallback 1c: Cloud transcription

```ts
const res = await ai.models.generateContent({
  model: 'gemini-3.5-transcribe',
  contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'audio/mp4', data: base64 } }, { text: 'Transcribe with speaker labels.' }] }],
});
```

---

## 4. Tier 2: Realtime voice agent with the Gemini Live API

### 4.1 Security first: ephemeral tokens

Never put a long-lived Gemini key in the APK. Your backend mints a short-lived token; the app connects with it.

**Server (Node, `@google/genai`)**

```ts
import { GoogleGenAI, Modality } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { apiVersion: 'v1alpha' } });

export async function mintLiveToken() {
  const token = await ai.authTokens.create({
    config: {
      uses: 1,
      expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),          // session may last 30 min
      newSessionExpireTime: new Date(Date.now() + 60 * 1000).toISOString(),      // must connect within 60 s
      liveConnectConstraints: {
        model: 'gemini-3.1-flash-live-preview',
        config: { responseModalities: [Modality.AUDIO] },                        // token cannot be reused for text/other models
      },
    },
  });
  return token.name;
}
```

**Client**

```ts
const ai = new GoogleGenAI({ apiKey: tokenName, httpOptions: { apiVersion: 'v1alpha' } });
```

Store the token only in memory; if you must persist across a cold start, use `useSecurity().saveSecureItem()`.

### 4.2 The `useLiveVoiceAgent` hook

```ts
// src/ai/useLiveVoiceAgent.ts
import { useCallback, useRef, useState } from 'react';
import { GoogleGenAI, Modality, StartSensitivity, EndSensitivity, type LiveServerMessage, type Session } from '@google/genai';
import PixelNano from '../../modules/pixel-nano/src';
import { toFunctionDeclarations, runTool } from './tools/registry';

export type LiveState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

export function useLiveVoiceAgent(opts: { systemInstruction: string; voiceName?: string }) {
  const [state, setState] = useState<LiveState>('idle');
  const [userText, setUserText] = useState('');
  const [modelText, setModelText] = useState('');
  const session = useRef<Session | null>(null);
  const micSub = useRef<{ remove(): void } | null>(null);

  const connect = useCallback(async (tokenName: string) => {
    setState('connecting');
    const ai = new GoogleGenAI({ apiKey: tokenName, httpOptions: { apiVersion: 'v1alpha' } });

    session.current = await ai.live.connect({
      model: 'gemini-3.1-flash-live-preview',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: opts.voiceName ?? 'Kore' } } },
        systemInstruction: opts.systemInstruction,
        tools: [{ functionDeclarations: toFunctionDeclarations() }],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false,
            startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
            endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
            prefixPaddingMs: 40,
            silenceDurationMs: 500,
          },
        },
        contextWindowCompression: { slidingWindow: {} },
        sessionResumption: {},                    // server sends sessionResumptionUpdate handles
      },
      callbacks: {
        onopen: () => {
          PixelNano.speakerStart(24000);
          PixelNano.startPcmMic(16000);
          micSub.current = PixelNano.addListener('onPcmChunk', e =>
            session.current?.sendRealtimeInput({ audio: { data: e.base64, mimeType: 'audio/pcm;rate=16000' } }),
          );
          setState('listening');
        },
        onmessage: (m: LiveServerMessage) => void handle(m),
        onerror: () => setState('error'),
        onclose: () => { teardown(); setState('idle'); },
      },
    });
  }, [opts.systemInstruction, opts.voiceName]);

  async function handle(m: LiveServerMessage) {
    const sc = m.serverContent;
    if (sc?.interrupted) { PixelNano.speakerFlush(); setState('listening'); return; }   // barge-in
    if (sc?.inputTranscription?.text) setUserText(t => t + sc.inputTranscription!.text);
    if (sc?.outputTranscription?.text) setModelText(t => t + sc.outputTranscription!.text);
    for (const part of sc?.modelTurn?.parts ?? []) {
      if (part.inlineData?.data) { setState('speaking'); PixelNano.speakerWrite(part.inlineData.data); }
    }
    if (sc?.turnComplete) { setState('listening'); setModelText(''); setUserText(''); }

    if (m.toolCall?.functionCalls?.length) {
      setState('thinking');
      const calls = m.toolCall.functionCalls;
      const results = await Promise.all(calls.map(c => runTool(c.name!, c.args)));
      session.current?.sendToolResponse({
        functionResponses: calls.map((c, i) => ({ id: c.id, name: c.name!, response: results[i] as Record<string, unknown> })),
      });
    }
    if (m.goAway) { /* server will close soon; reconnect with the last sessionResumptionUpdate.newHandle */ }
  }

  function teardown() {
    micSub.current?.remove(); micSub.current = null;
    PixelNano.stopPcmMic(); PixelNano.speakerStop();
  }

  const disconnect = useCallback(() => { session.current?.close(); session.current = null; teardown(); setState('idle'); }, []);
  const sendText = useCallback((text: string) =>
    session.current?.sendClientContent({ turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true }), []);

  return { state, userText, modelText, connect, disconnect, sendText };
}
```

Details that separate "demo" from "top-notch":

- **Barge-in**: on `serverContent.interrupted` flush the `AudioTrack` immediately; otherwise the model keeps talking over the user for up to a second of buffered audio.
- **VAD tuning**: `START_SENSITIVITY_HIGH` + `silenceDurationMs: 500` feels snappy on Pixel's clean mic path; raise silence to 800 ms for slow speakers.
- **Session resumption**: store `m.sessionResumptionUpdate?.newHandle` and pass `sessionResumption: { handle }` on reconnect after `goAway` or a network blip.
- **Compression**: `contextWindowCompression.slidingWindow` keeps long sessions alive past the model's context limit.
- **Audio focus**: `USAGE_ASSISTANT` on the `AudioTrack`; request transient audio focus in the module when the speaker starts, abandon it on stop.
- **Bluetooth**: with LE Audio earbuds, `AudioRecord` follows the routed input automatically; do not force the built-in mic.
- **Background**: the Live socket dies when Android suspends the app. Show a foreground service notification if you need >30 s hands-free (add `FOREGROUND_SERVICE_MICROPHONE`).
- **Thinking**: for the 3.x live model you can pass `thinkingConfig: { thinkingLevel: 'low' }`; keep it low for voice latency.

### 4.3 Wake-word and hands-free

There is no public hotword API. Use a **push-to-talk** `HapticButton`, or the ML Kit STT stream (Tier 1) as a cheap local listener that connects the Live session only when a trigger phrase appears in `partial`.

---

## 5. Tier 3: Text-to-speech

### 5.1 On device (`expo-speech`)

```ts
import * as Speech from 'expo-speech';

export async function speakLocal(text: string, language = 'en-US') {
  const voices = await Speech.getAvailableVoicesAsync();
  const voice = voices.find(v => v.language === language && /network|enhanced|neural/i.test(v.identifier))?.identifier;
  return new Promise<void>(resolve =>
    Speech.speak(text, { language, voice, rate: 1.0, pitch: 1.0, onDone: resolve, onStopped: resolve, onError: () => resolve() }),
  );
}
```

Pixel ships Google's on-device neural voices; the regex above prefers them when present. Call `Speech.stop()` when the user starts talking.

### 5.2 Gemini TTS (cloud, controllable)

```ts
const res = await ai.models.generateContent({
  model: 'gemini-3.1-flash-tts-preview',
  contents: [{ role: 'user', parts: [{ text: 'Say warmly: Thermal headroom is nominal.' }] }],
  config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } },
});
const pcm24k = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
if (pcm24k) { PixelNano.speakerStart(24000); PixelNano.speakerWrite(pcm24k); }
```

Voices such as `Kore`, `Puck`, `Charon`, `Aoede` are shared between TTS and Live so an agent sounds identical whether it is reading a notification or conversing.

---

## 6. The Pixel status language: HiLight + haptics

Google's Gemini shows **listening → processing → responding** on the HiLight ring when the phone is face down. Third-party apps cannot drive the LEDs, so PixelKit mirrors the exact state machine on screen and through the LRA so the experience is consistent:

| Agent state | `useHiLight()` | `useHaptics()` | Screen |
| :--- | :--- | :--- | :--- |
| Connecting | `setMode('breathing')`, `#8AB4F8` | – | dim waveform |
| Listening | `setMode('glow')`, `#8AB4F8` | `selection` once on open | live meter from `metering` / PCM RMS |
| Thinking / tool call | `triggerGeminiPulse()` (`#00E5FF`) | – | "Thinking…" chip, tool name |
| Speaking | `setMode('pulse')`, `#00E5FF` | `light` on first audio chunk | output transcript |
| Interrupted | `setMode('glow')` | `selection` | clear model text |
| Error | `setMode('notification')`, `#F28B82` | `error` | retry button |

Implement it once as `useVoiceStatusFeedback(state)` and reuse it for Tier 1 dictation and Tier 2 agents.

---

## 7. Checklist

- [ ] `expo-av` removed from `useAudio` / `useSpeechAI`; `expo-audio` + config plugin in place.
- [ ] Tier 1 partials appear within 300 ms on Pixel 11 Pro; Advanced mode status logged; Basic fallback verified on a non-Pixel.
- [ ] Live agent: barge-in flushes audio; a tool call round-trips (`set_torch` audibly confirmed); session survives airplane-mode toggle via resumption handle.
- [ ] Ephemeral token minted server-side with `liveConnectConstraints`; no `AIza…` key in the bundle (`grep -r AIza dist/`).
- [ ] TTS stops when the user speaks; local and Gemini voices selectable in AI Lab.
- [ ] HiLight/haptic state table wired through `useVoiceStatusFeedback`.
- [ ] Docs updated: `docs/api/neural-ai.md` (`useSpeechToText`, `useLiveVoiceAgent`), `docs/api/system-media.md` (`useAudio` migration), `README.md` matrix, `DocsScreen.tsx`.

---

## 8. Sources

- [ML Kit GenAI Speech Recognition API](https://developers.google.com/ml-kit/genai/speech-recognition/android) · [Android on-device inference blog (July 2026)](https://android-developers.googleblog.com/2026/07/android-on-device-inference.html)
- [Gemini Live API overview](https://ai.google.dev/gemini-api/docs/live) · [Live API guide (config, VAD, resumption)](https://ai.google.dev/gemini-api/docs/live-guide) · [Ephemeral tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens) · [Models (live, tts, transcribe IDs)](https://ai.google.dev/gemini-api/docs/models)
- [expo-audio (SDK 57)](https://docs.expo.dev/versions/v57.0.0/sdk/audio/) · [expo-speech (SDK 57)](https://docs.expo.dev/versions/v57.0.0/sdk/speech/)
- [Android AudioRecord](https://developer.android.com/reference/android/media/AudioRecord) · [AudioTrack](https://developer.android.com/reference/android/media/AudioTrack) · [SpeechRecognizer on-device](https://developer.android.com/reference/android/speech/SpeechRecognizer#createOnDeviceSpeechRecognizer(android.content.Context))

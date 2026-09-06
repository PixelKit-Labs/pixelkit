/**
 * @file useSpeechAI.ts
 * @description Voice capture (expo-audio via useAudio) and transcription through Gemini's audio
 * understanding. Without an API key the recording is kept and an error is returned; there is no
 * simulated transcript. On-device streaming recognition (ML Kit GenAI Speech Recognition) is the
 * planned replacement; see docs/guides/voice.md.
 */

import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import { useAudio } from '../hardware/useAudio';
import { SpeechTranscriptionResult } from '../core/types';
import { getStoredApiKey, createGeminiClient, GEMINI_MODEL, NO_API_KEY_MESSAGE } from './geminiClient';
import { logEvent, recordMetric } from '../core/observability';

const MODULE = 'useSpeechAI';

export function useSpeechAI() {
  const audio = useAudio();
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [lastTranscript, setLastTranscript] = useState<SpeechTranscriptionResult | null>(null);
  const [lastRecordingUri, setLastRecordingUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);

  const startListening = async (): Promise<boolean> => {
    setError(null);
    const ok = await audio.startRecording();
    if (ok) setRecordingStartedAt(Date.now());
    else setError('Microphone unavailable or permission denied');
    return ok;
  };

  const stopListeningAndTranscribe = async (): Promise<SpeechTranscriptionResult | null> => {
    const uri = await audio.stopRecording();
    const durationSeconds = recordingStartedAt ? Number(((Date.now() - recordingStartedAt) / 1000).toFixed(1)) : 0;
    setRecordingStartedAt(null);
    if (!uri) { setError('No recording captured'); return null; }
    setLastRecordingUri(uri);
    logEvent(MODULE, 'recorded', { uri, durationSeconds });

    const apiKey = await getStoredApiKey();
    if (!apiKey) { setError(NO_API_KEY_MESSAGE); return null; }

    setIsTranscribing(true);
    const start = performance.now();
    try {
      const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const client = createGeminiClient(apiKey);
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{
          role: 'user',
          parts: [
            { text: 'Transcribe this speech verbatim. Return only the transcript text; if there is no speech return an empty string.' },
            { inlineData: { mimeType: 'audio/mp4', data: base64Audio } },
          ],
        }],
      });
      const transcript = (response.text ?? '').trim();
      const latencyMs = Math.round(performance.now() - start);
      const result: SpeechTranscriptionResult = {
        transcript,
        confidence: null,
        durationSeconds,
        latencyMs,
        language: 'auto',
      };
      setLastTranscript(result);
      recordMetric(MODULE, 'latencyMs', latencyMs, 'hardware');
      logEvent(MODULE, 'transcribed', { chars: transcript.length, latencyMs });
      return result;
    } catch (e: any) {
      const message = e?.message ?? 'transcription failed';
      setError(message);
      logEvent(MODULE, 'error', { message }, 'error');
      return null;
    } finally {
      setIsTranscribing(false);
    }
  };

  return {
    isListening: audio.isRecording,
    isTranscribing,
    /** Live microphone level in dBFS */
    voiceDecibels: audio.meteringDecibels,
    lastTranscript,
    lastRecordingUri,
    error,
    startListening,
    stopListeningAndTranscribe,
    model: GEMINI_MODEL,
  };
}

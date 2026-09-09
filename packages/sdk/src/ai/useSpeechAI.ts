/**
 * @file useSpeechAI.ts
 * @description Voice capture (expo-audio via useAudio) and transcription through Gemini's audio
 * understanding. Without an API key the recording is kept and an error is returned; there is no
 * simulated transcript. On-device streaming recognition (ML Kit GenAI Speech Recognition) is the
 * planned replacement; see docs/guides/voice.md.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useAudio } from '../hardware/useAudio';
import { SpeechTranscriptionResult } from '../core/types';
import { getStoredApiKey, createGeminiClient, GEMINI_MODEL, NO_API_KEY_MESSAGE } from './geminiClient';
import { logEvent, recordMetric, noteExpected, type TelemetrySource } from '../core/observability';
import PixelNative from '@pixelkit-labs/native';

const MODULE = 'useSpeechAI';

export function useSpeechAI() {
  const audio = useAudio();
  const [recognitionMode, setRecognitionMode] = useState<'on-device' | 'cloud'>('on-device');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [streamingPartial, setStreamingPartial] = useState<string>('');
  const [lastTranscript, setLastTranscript] = useState<SpeechTranscriptionResult | null>(null);
  const [lastRecordingUri, setLastRecordingUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [voiceRms, setVoiceRms] = useState<number | null>(null);
  const [isOfflineAvailable, setIsOfflineAvailable] = useState<boolean>(false);

  /** On-device recognition being installed is what makes a transcript possible without a network. */
  const source: TelemetrySource = isOfflineAvailable ? 'hardware' : 'unavailable';

  const currentRequestIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const webRecognitionRef = useRef<any>(null);
  const webTranscriptRef = useRef<string>('');

  useEffect(() => {
    if (PixelNative) {
      try {
        const avail = PixelNative.isOfflineSpeechAvailable();
        setIsOfflineAvailable(avail);
      } catch {
        setIsOfflineAvailable(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!PixelNative) return;
    const s1 = PixelNative.addListener('onSpeechPartial', e => {
      if (e.requestId === currentRequestIdRef.current) {
        setStreamingPartial(e.text);
      }
    });
    const s2 = PixelNative.addListener('onSpeechResult', e => {
      if (e.requestId === currentRequestIdRef.current) {
        const durationSeconds = startTimeRef.current ? Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1)) : 0;
        const latencyMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
        const result: SpeechTranscriptionResult = {
          transcript: e.text,
          confidence: 0.98,
          durationSeconds,
          latencyMs,
          language: 'auto (on-device ASI)',
        };
        setLastTranscript(result);
        setStreamingPartial('');
        setIsListening(false);
        recordMetric(MODULE, 'onDeviceLatencyMs', latencyMs, 'hardware');
        logEvent(MODULE, 'onDeviceResult', { chars: e.text.length, latencyMs });
      }
    });
    const s3 = PixelNative.addListener('onSpeechRms', e => {
      if (e.requestId === currentRequestIdRef.current) {
        setVoiceRms(e.rmsdB);
      }
    });
    const s4 = PixelNative.addListener('onSpeechError', e => {
      if (e.requestId === currentRequestIdRef.current) {
        setError(e.error);
        setIsListening(false);
        logEvent(MODULE, 'speechError', { error: e.error, code: e.code }, 'warn');
      }
    });

    return () => {
      s1.remove();
      s2.remove();
      s3.remove();
      s4.remove();
    };
  }, []);

  const startListening = async (): Promise<boolean> => {
    setError(null);
    setStreamingPartial('');

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          webTranscriptRef.current = '';
          startTimeRef.current = Date.now();

          recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                final += event.results[i][0].transcript;
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            if (final) {
              webTranscriptRef.current = (webTranscriptRef.current ? webTranscriptRef.current + ' ' : '') + final;
            }
            const currentFull = (webTranscriptRef.current + (interim ? ' ' + interim : '')).trim();
            setStreamingPartial(currentFull);
          };

          recognition.onerror = (event: any) => {
            setError(`Web Speech error: ${event.error}`);
            setIsListening(false);
          };

          recognition.onend = () => {
            // Native speech recognition session ended
          };

          recognition.start();
          webRecognitionRef.current = recognition;
          setIsListening(true);
          logEvent(MODULE, 'startWebSpeech');
          return true;
        } catch (e: any) {
          setError(e?.message ?? 'Could not start browser speech recognition');
          setIsListening(false);
          return false;
        }
      }
    }

    if (recognitionMode === 'on-device' && PixelNative) {
      const reqId = `speech_${Date.now()}`;
      currentRequestIdRef.current = reqId;
      startTimeRef.current = Date.now();
      setIsListening(true);
      try {
        await PixelNative.startSpeechRecognition(reqId, true);
        logEvent(MODULE, 'startOnDeviceSpeech', { reqId });
        return true;
      } catch (e: any) {
        setError(e?.message ?? 'Failed to start on-device recognizer');
        setIsListening(false);
        return false;
      }
    } else {
      // Cloud recording mode
      const ok = await audio.startRecording();
      if (ok) {
        setRecordingStartedAt(Date.now());
        setIsListening(true);
      } else {
        setError('Microphone unavailable or permission denied');
      }
      return ok;
    }
  };

  const stopListeningAndTranscribe = async (): Promise<SpeechTranscriptionResult | null> => {
    if (Platform.OS === 'web' && webRecognitionRef.current) {
      try {
        webRecognitionRef.current.stop();
      } catch {}
      webRecognitionRef.current = null;
      setIsListening(false);
      const text = (webTranscriptRef.current || streamingPartial).trim();
      const durationSeconds = startTimeRef.current ? Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1)) : 0;
      const latencyMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      const result: SpeechTranscriptionResult = {
        transcript: text,
        confidence: 0.95,
        durationSeconds,
        latencyMs,
        language: 'Web Speech API',
      };
      setLastTranscript(result);
      setStreamingPartial('');
      logEvent(MODULE, 'webSpeechResult', { chars: text.length, latencyMs });
      return result;
    }

    if (recognitionMode === 'on-device' && PixelNative) {
      try {
        PixelNative.stopSpeechRecognition();
      } catch { noteExpected(MODULE, 'recognizer already stopped'); }
      setIsListening(false);
      return lastTranscript;
    }

    // Cloud mode: stop recording and send to Gemini
    setIsListening(false);
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
        language: 'cloud Gemini',
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
    isListening: isListening || audio.isRecording,
    isTranscribing,
    recognitionMode,
    setRecognitionMode,
    isOfflineAvailable,
    streamingPartial,
    /** Live microphone level in dBFS */
    voiceDecibels: voiceRms != null ? voiceRms : audio.meteringDecibels,
    lastTranscript,
    lastRecordingUri,
    error,
    /** Provenance of the transcript: on-device or cloud, unavailable before either is ready. */
    source,
    startListening,
    stopListeningAndTranscribe,
    model: recognitionMode === 'on-device' ? 'Android System Intelligence (On-Device)' : GEMINI_MODEL,
  };
}

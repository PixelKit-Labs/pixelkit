/**
 * @file useAudio.ts
 * @description Multi-microphone acoustic recording and real-time decibel metering on `expo-audio`.
 * Replaces the legacy `expo-av` implementation (removed from the Expo SDK 57 package set).
 * Provides dBFS level updates (-160 dBFS silence to 0 dBFS clipping) for acoustic monitoring
 * and as the capture stage for `useSpeechAI`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type RecordingOptions,
} from 'expo-audio';

/** Mono AAC at 16 kHz: what every Google speech API expects, with metering enabled. */
const SPEECH_RECORDING: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 64000,
  android: {
    ...RecordingPresets.HIGH_QUALITY.android,
    audioSource: 'voice_recognition', // Pixel multi-mic noise suppression path
  },
};

const METER_INTERVAL_MS = 100;
const SILENCE_DBFS = -160;

/**
 * Hook to record audio and measure ambient sound levels via the device microphone array.
 *
 * @returns Object providing recording state, decibel levels, and start/stop controls.
 *
 * @example
 * ```typescript
 * const { isRecording, meteringDecibels, startRecording, stopRecording } = useAudio();
 * await startRecording();
 * console.log(`Ambient noise: ${meteringDecibels} dBFS`);
 * const fileUri = await stopRecording();
 * ```
 */
export function useAudio() {
  const recorder = useAudioRecorder(SPEECH_RECORDING);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [meteringDecibels, setMeteringDecibels] = useState<number>(SILENCE_DBFS);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const meterTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    requestRecordingPermissionsAsync()
      .then(({ granted }) => setPermissionGranted(granted))
      .catch(() => setPermissionGranted(false));
    return () => {
      if (meterTimer.current) clearInterval(meterTimer.current);
    };
  }, []);

  const stopMeter = () => {
    if (meterTimer.current) {
      clearInterval(meterTimer.current);
      meterTimer.current = null;
    }
  };

  /**
   * Starts microphone recording with continuous dBFS metering.
   * @returns Promise resolving to true when recording started, false on permission or hardware failure.
   */
  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      if (!permissionGranted) {
        const { granted } = await requestRecordingPermissionsAsync();
        setPermissionGranted(granted);
        if (!granted) return false;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);

      stopMeter();
      meterTimer.current = setInterval(() => {
        const status = recorder.getStatus();
        if (typeof status.metering === 'number' && Number.isFinite(status.metering)) {
          setMeteringDecibels(Math.round(status.metering));
        }
      }, METER_INTERVAL_MS);
      return true;
    } catch {
      setIsRecording(false);
      return false;
    }
  }, [permissionGranted, recorder]);

  /**
   * Stops the active recording and releases the microphone.
   * @returns Promise resolving to the local file URI of the recorded audio, or null.
   */
  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      stopMeter();
      if (!isRecording && !recorder.isRecording) return null;
      await recorder.stop();
      setIsRecording(false);
      setMeteringDecibels(SILENCE_DBFS);
      return recorder.uri;
    } catch {
      setIsRecording(false);
      return null;
    }
  }, [isRecording, recorder]);

  return {
    /** Whether the microphone is actively recording */
    isRecording,
    /** Real-time microphone acoustic level in dBFS (-160 to 0) */
    meteringDecibels,
    /** Alias of meteringDecibels kept for documentation compatibility */
    currentDecibels: meteringDecibels,
    /** Start recording and metering */
    startRecording,
    /** Stop recording and retrieve audio file URI */
    stopRecording,
    /** Whether microphone permission has been granted */
    permissionGranted,
  };
}

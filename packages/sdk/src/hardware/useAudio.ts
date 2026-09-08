/**
 * @file useAudio.ts
 * @description Microphone capture, level metering and playback on `expo-audio`.
 *
 * What this hook covers:
 * - Recording with pause and resume, an optional fixed duration, and live elapsed time.
 * - Two capture profiles: `speech` (16 kHz mono through the Pixel's `voice_recognition` path, which
 *   applies the platform's noise suppression) and `studio` (48 kHz stereo through `unprocessed`,
 *   the raw microphone signal with no platform processing).
 * - Level metering in dBFS (-160 silence to 0 clipping), a running peak, a 0..1 value for meters,
 *   and a silence flag against an adjustable threshold.
 * - Microphone input enumeration and selection, which on Android is how you choose between the
 *   built-in mic array and an attached USB or Bluetooth microphone.
 * - Playback of the last recording, plus output routing between the speaker and the earpiece.
 *
 * Everything reports real state from `expo-audio`. There is no simulated level: before the first
 * sample, `meteringDecibels` sits at the silence floor and `source` is `unavailable`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  type RecordingInput,
  type RecordingOptions,
} from 'expo-audio';
import { logEvent, recordMetric, type TelemetrySource, noteExpected } from '../core/observability';

const MODULE = 'useAudio';

/** Capture profile. `speech` feeds speech recognition; `studio` is the unprocessed signal. */
export type AudioQuality = 'speech' | 'studio';

/** Where playback is routed. Android switches this at the audio-mode level, not per player. */
export type AudioRoute = 'speaker' | 'earpiece';

/** 16 kHz mono AAC: what Google's speech APIs expect, through the Pixel noise-suppressed path. */
const SPEECH_RECORDING: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 64000,
  android: {
    ...RecordingPresets.HIGH_QUALITY.android,
    audioSource: 'voice_recognition',
  },
};

/** 48 kHz stereo AAC from the raw microphone, with no platform noise suppression applied. */
const STUDIO_RECORDING: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
  sampleRate: 48000,
  numberOfChannels: 2,
  bitRate: 256000,
  android: {
    ...RecordingPresets.HIGH_QUALITY.android,
    audioSource: 'unprocessed',
  },
};

const PROFILES: Record<AudioQuality, RecordingOptions> = {
  speech: SPEECH_RECORDING,
  studio: STUDIO_RECORDING,
};

const METER_INTERVAL_MS = 100;
/** expo-audio reports -160 dBFS for digital silence. */
const SILENCE_DBFS = -160;
/** Meters map this range to 0..1; below it the signal is inaudible in practice. */
const METER_FLOOR_DBFS = -60;
/** Default speech/silence boundary; quiet rooms sit near -50 dBFS. */
const DEFAULT_SILENCE_THRESHOLD_DBFS = -45;

/** Maps a dBFS reading onto 0..1 for a level meter. */
function toLevel(dbfs: number): number {
  if (!Number.isFinite(dbfs)) return 0;
  const clamped = Math.max(METER_FLOOR_DBFS, Math.min(0, dbfs));
  return Number(((clamped - METER_FLOOR_DBFS) / -METER_FLOOR_DBFS).toFixed(3));
}

export interface StartRecordingOptions {
  /** Stop automatically after this many seconds. */
  maxDurationSeconds?: number;
  /** Capture profile for this take; also becomes the active profile. */
  quality?: AudioQuality;
}

/**
 * Microphone capture, metering and playback.
 *
 * @example
 * ```typescript
 * const audio = useAudio();
 * await audio.startRecording({ quality: 'speech', maxDurationSeconds: 30 });
 * // audio.level drives a meter; audio.isSilent gates a "say something" hint
 * const uri = await audio.stopRecording();
 * await audio.playLastRecording();
 * ```
 */
export function useAudio() {
  const [quality, setQualityState] = useState<AudioQuality>('speech');
  const recorder = useAudioRecorder(PROFILES[quality]);
  const player = useAudioPlayer();

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [canRecord, setCanRecord] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);

  const [meteringDecibels, setMeteringDecibels] = useState<number>(SILENCE_DBFS);
  const [peakDecibels, setPeakDecibels] = useState<number>(SILENCE_DBFS);
  const [hasMeteredSample, setHasMeteredSample] = useState<boolean>(false);
  const [silenceThresholdDbfs, setSilenceThresholdDbfs] = useState<number>(DEFAULT_SILENCE_THRESHOLD_DBFS);

  const [inputs, setInputs] = useState<RecordingInput[]>([]);
  const [currentInputUid, setCurrentInputUid] = useState<string | null>(null);
  const [route, setRouteState] = useState<AudioRoute>('speaker');

  const [lastRecordingUri, setLastRecordingUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackPositionSeconds, setPlaybackPositionSeconds] = useState<number>(0);
  const [playbackDurationSeconds, setPlaybackDurationSeconds] = useState<number>(0);

  const [error, setError] = useState<string | null>(null);

  const meterTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Let the metering interval reach the latest state and stop handler without re-creating itself. */
  const isRecordingRef = useRef<boolean>(false);
  const stopRecordingRef = useRef<(() => Promise<string | null>) | null>(null);

  const source: TelemetrySource = hasMeteredSample ? 'hardware' : 'unavailable';
  const level = toLevel(meteringDecibels);
  const isSilent = !hasMeteredSample || meteringDecibels < silenceThresholdDbfs;

  useEffect(() => {
    requestRecordingPermissionsAsync()
      .then(({ granted }) => setPermissionGranted(granted))
      .catch(() => setPermissionGranted(false));
    return () => {
      if (meterTimer.current) clearInterval(meterTimer.current);
      if (playbackTimer.current) clearInterval(playbackTimer.current);
      if (autoStopTimer.current) clearTimeout(autoStopTimer.current);
    };
  }, []);

  const clearTimers = () => {
    if (meterTimer.current) { clearInterval(meterTimer.current); meterTimer.current = null; }
    if (autoStopTimer.current) { clearTimeout(autoStopTimer.current); autoStopTimer.current = null; }
  };

  /** Reads available microphones. Only valid once the recorder has been prepared. */
  const refreshInputs = useCallback((): RecordingInput[] => {
    try {
      const list = recorder.getAvailableInputs();
      setInputs(list);
      logEvent(MODULE, 'inputs', { count: list.length, names: list.map(i => i.name) });
      return list;
    } catch (e: any) {
      logEvent(MODULE, 'inputs unavailable', { message: e?.message }, 'warn');
      return [];
    }
  }, [recorder]);

  /** Selects a microphone by uid, from the list `refreshInputs()` returns. */
  const selectInput = useCallback((uid: string): boolean => {
    try {
      recorder.setInput(uid);
      setCurrentInputUid(uid);
      logEvent(MODULE, 'input selected', { uid });
      return true;
    } catch (e: any) {
      setError(e?.message ?? 'Could not select that microphone');
      return false;
    }
  }, [recorder]);

  /** Routes playback to the loudspeaker or the call earpiece. */
  const setRoute = useCallback(async (next: AudioRoute): Promise<void> => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldRouteThroughEarpiece: next === 'earpiece',
      });
      setRouteState(next);
      logEvent(MODULE, 'route', { route: next });
    } catch (e: any) {
      setError(e?.message ?? 'Could not change audio route');
    }
  }, []);

  /** Switches capture profile. Takes effect on the next recording. */
  const setQuality = useCallback((next: AudioQuality) => {
    setQualityState(next);
    logEvent(MODULE, 'quality', { quality: next });
  }, []);

  const startRecording = useCallback(async (options?: StartRecordingOptions): Promise<boolean> => {
    setError(null);
    const profile = options?.quality ?? quality;
    if (options?.quality && options.quality !== quality) setQualityState(options.quality);
    try {
      if (!permissionGranted) {
        const { granted } = await requestRecordingPermissionsAsync();
        setPermissionGranted(granted);
        if (!granted) {
          setError('Microphone permission denied');
          return false;
        }
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync(PROFILES[profile]);

      // Inputs and current input only resolve once the recorder is prepared.
      refreshInputs();
      recorder.getCurrentInput()
        .then(input => setCurrentInputUid(input?.uid ?? null))
        .catch(() => setCurrentInputUid(null));

      recorder.record(
        options?.maxDurationSeconds ? { forDuration: options.maxDurationSeconds } : undefined,
      );
      setIsRecording(true);
      setIsPaused(false);
      setPeakDecibels(SILENCE_DBFS);
      setHasMeteredSample(false);
      setDurationSeconds(0);

      clearTimers();
      meterTimer.current = setInterval(() => {
        const status = recorder.getStatus();
        setCanRecord(status.canRecord);
        if (typeof status.durationMillis === 'number') {
          setDurationSeconds(Number((status.durationMillis / 1000).toFixed(1)));
        }
        if (typeof status.metering === 'number' && Number.isFinite(status.metering)) {
          const db = Math.round(status.metering);
          setMeteringDecibels(db);
          setPeakDecibels(prev => (db > prev ? db : prev));
          setHasMeteredSample(true);
        }
        // The native recorder stops itself when forDuration elapses.
        if (!status.isRecording && isRecordingRef.current) {
          void stopRecordingRef.current?.();
        }
      }, METER_INTERVAL_MS);

      logEvent(MODULE, 'recording started', {
        quality: profile,
        maxDurationSeconds: options?.maxDurationSeconds ?? null,
      });
      return true;
    } catch (e: any) {
      setIsRecording(false);
      setError(e?.message ?? 'Could not start recording');
      logEvent(MODULE, 'record error', { message: e?.message }, 'error');
      return false;
    }
  }, [permissionGranted, quality, recorder, refreshInputs]);

  /** Pauses without finalising the file; `resumeRecording()` continues the same take. */
  const pauseRecording = useCallback((): boolean => {
    try {
      if (!isRecording || isPaused) return false;
      recorder.pause();
      setIsPaused(true);
      logEvent(MODULE, 'recording paused', { atSeconds: durationSeconds });
      return true;
    } catch (e: any) {
      setError(e?.message ?? 'Could not pause');
      return false;
    }
  }, [durationSeconds, isPaused, isRecording, recorder]);

  const resumeRecording = useCallback((): boolean => {
    try {
      if (!isRecording || !isPaused) return false;
      recorder.record();
      setIsPaused(false);
      logEvent(MODULE, 'recording resumed', { atSeconds: durationSeconds });
      return true;
    } catch (e: any) {
      setError(e?.message ?? 'Could not resume');
      return false;
    }
  }, [durationSeconds, isPaused, isRecording, recorder]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      clearTimers();
      if (!isRecording && !recorder.isRecording) return null;
      await recorder.stop();
      const uri = recorder.uri;
      setIsRecording(false);
      setIsPaused(false);
      setMeteringDecibels(SILENCE_DBFS);
      setLastRecordingUri(uri);
      if (durationSeconds > 0) recordMetric(MODULE, 'recordingSeconds', durationSeconds, 'hardware');
      logEvent(MODULE, 'recording stopped', { seconds: durationSeconds, peakDbfs: peakDecibels, uri: !!uri });
      return uri;
    } catch (e: any) {
      setIsRecording(false);
      setError(e?.message ?? 'Could not stop recording');
      return null;
    }
  }, [durationSeconds, isRecording, peakDecibels, recorder]);

  isRecordingRef.current = isRecording;
  stopRecordingRef.current = stopRecording;

  const stopPlaybackPolling = () => {
    if (playbackTimer.current) { clearInterval(playbackTimer.current); playbackTimer.current = null; }
  };

  /** Plays a recording; defaults to the most recent one. */
  const playLastRecording = useCallback(async (uri?: string): Promise<boolean> => {
    const target = uri ?? lastRecordingUri;
    if (!target) {
      setError('Nothing recorded yet');
      return false;
    }
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      player.replace(target);
      player.play();
      setIsPlaying(true);
      stopPlaybackPolling();
      playbackTimer.current = setInterval(() => {
        setPlaybackPositionSeconds(Number((player.currentTime ?? 0).toFixed(1)));
        setPlaybackDurationSeconds(Number((player.duration ?? 0).toFixed(1)));
        if (!player.playing) {
          setIsPlaying(false);
          stopPlaybackPolling();
        }
      }, 200);
      logEvent(MODULE, 'playback started', { uri: target });
      return true;
    } catch (e: any) {
      setError(e?.message ?? 'Could not play the recording');
      return false;
    }
  }, [lastRecordingUri, player]);

  const pausePlayback = useCallback(() => {
    try {
      player.pause();
      setIsPlaying(false);
      stopPlaybackPolling();
    } catch { noteExpected(MODULE, 'player released'); }
  }, [player]);

  const stopPlayback = useCallback(async () => {
    try {
      player.pause();
      await player.seekTo(0);
      setIsPlaying(false);
      setPlaybackPositionSeconds(0);
      stopPlaybackPolling();
    } catch { noteExpected(MODULE, 'player released'); }
  }, [player]);

  const seekPlayback = useCallback(async (seconds: number) => {
    try {
      await player.seekTo(Math.max(0, seconds));
      setPlaybackPositionSeconds(Number(seconds.toFixed(1)));
    } catch (e: any) {
      setError(e?.message ?? 'Could not seek');
    }
  }, [player]);

  return {
    // ── capture state ──
    /** Whether the microphone is open (true while paused as well) */
    isRecording,
    /** Whether the open take is paused */
    isPaused,
    /** Recorder reports it is able to start (from RecorderState.canRecord) */
    canRecord,
    /** Whether microphone permission has been granted */
    permissionGranted,
    /** Elapsed seconds of the current take */
    durationSeconds,
    /** Active capture profile */
    quality,

    // ── level ──
    /** Live level in dBFS, -160 silence to 0 clipping */
    meteringDecibels,
    /** Loudest dBFS seen during this take */
    peakDecibels,
    /** 0..1 mapping of the level for meters, floored at -60 dBFS */
    level,
    /** True until the level rises above `silenceThresholdDbfs` */
    isSilent,
    silenceThresholdDbfs,
    setSilenceThresholdDbfs,

    // ── inputs and routing ──
    /** Microphones the platform offers; populated once recording has been prepared */
    inputs,
    currentInputUid,
    /** Speaker or earpiece for playback */
    route,

    // ── playback ──
    /** File URI of the last completed recording */
    lastRecordingUri,
    isPlaying,
    playbackPositionSeconds,
    playbackDurationSeconds,

    /** 'hardware' once a real level sample has arrived, 'unavailable' before that */
    source,
    error,

    // ── actions ──
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    setQuality,
    refreshInputs,
    selectInput,
    setRoute,
    playLastRecording,
    pausePlayback,
    stopPlayback,
    seekPlayback,
  };
}

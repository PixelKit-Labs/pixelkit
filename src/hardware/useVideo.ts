/**
 * @file useVideo.ts
 * @description Video playback on `expo-video`, the SDK 57 replacement for the removed `expo-av`.
 *
 * Pairs with `useCamera().startRecording()`: record a clip, then hand `lastVideoUri` to `load()`
 * and play it back. The hook owns the player; a screen renders `<VideoView player={player} />`.
 *
 * Position and duration are polled four times a second while playing, which is enough for a
 * scrubber without waking the JS thread every frame. Everything reported comes from the player;
 * before a source loads, duration is 0 and `source` is `unavailable`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useVideoPlayer, type VideoPlayer, type VideoSource } from 'expo-video';
import { logEvent, type TelemetrySource } from '../core/observability';

const MODULE = 'useVideo';
const POLL_MS = 250;

export interface VideoLoadOptions {
  /** Start playing as soon as the source is ready. */
  autoplay?: boolean;
  /** Restart from the beginning when the end is reached. */
  loop?: boolean;
  /** Start muted. */
  muted?: boolean;
}

export function useVideo(initialSource: VideoSource = null) {
  const player: VideoPlayer = useVideoPlayer(initialSource, (p) => {
    p.timeUpdateEventInterval = 0.25;
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [positionSeconds, setPositionSeconds] = useState<number>(0);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [bufferedSeconds, setBufferedSeconds] = useState<number>(0);
  const [status, setStatus] = useState<string>('idle');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [playbackRate, setPlaybackRateState] = useState<number>(1);
  const [volume, setVolumeState] = useState<number>(1);
  const [hasSource, setHasSource] = useState<boolean>(initialSource != null);
  const [error, setError] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const source: TelemetrySource = hasSource ? 'hardware' : 'unavailable';

  useEffect(() => {
    timer.current = setInterval(() => {
      try {
        setIsPlaying(player.playing);
        setPositionSeconds(Number((player.currentTime ?? 0).toFixed(2)));
        setDurationSeconds(Number((player.duration ?? 0).toFixed(2)));
        setBufferedSeconds(Number((player.bufferedPosition ?? 0).toFixed(2)));
        setStatus(String(player.status ?? 'idle'));
      } catch {
        // Player released while the interval was in flight.
      }
    }, POLL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [player]);

  /** Swaps the source, for example the clip that `useCamera` just recorded. */
  const load = useCallback(async (next: VideoSource, options?: VideoLoadOptions): Promise<boolean> => {
    setError(null);
    try {
      await player.replaceAsync(next);
      setHasSource(next != null);
      if (options?.loop != null) { player.loop = options.loop; setIsLooping(options.loop); }
      if (options?.muted != null) { player.muted = options.muted; setIsMuted(options.muted); }
      if (options?.autoplay) player.play();
      logEvent(MODULE, 'source loaded', { autoplay: !!options?.autoplay });
      return true;
    } catch (e: any) {
      setError(e?.message ?? 'Could not load that video');
      logEvent(MODULE, 'load error', { message: e?.message }, 'error');
      return false;
    }
  }, [player]);

  const play = useCallback(() => {
    try { player.play(); setIsPlaying(true); } catch (e: any) { setError(e?.message ?? 'Play failed'); }
  }, [player]);

  const pause = useCallback(() => {
    try { player.pause(); setIsPlaying(false); } catch { /* released */ }
  }, [player]);

  const togglePlay = useCallback(() => {
    if (player.playing) pause(); else play();
  }, [player, play, pause]);

  /** Jumps to an absolute position in seconds. */
  const seekTo = useCallback((seconds: number) => {
    try {
      const target = Math.max(0, Math.min(seconds, player.duration || seconds));
      player.currentTime = target;
      setPositionSeconds(Number(target.toFixed(2)));
    } catch (e: any) {
      setError(e?.message ?? 'Seek failed');
    }
  }, [player]);

  /** Moves relative to the current position; negative rewinds. */
  const seekBy = useCallback((seconds: number) => {
    try { player.seekBy(seconds); } catch (e: any) { setError(e?.message ?? 'Seek failed'); }
  }, [player]);

  const replay = useCallback(() => {
    try { player.replay(); setIsPlaying(true); } catch { /* released */ }
  }, [player]);

  const setMuted = useCallback((muted: boolean) => {
    try { player.muted = muted; setIsMuted(muted); } catch { /* released */ }
  }, [player]);

  const setLoop = useCallback((loop: boolean) => {
    try { player.loop = loop; setIsLooping(loop); } catch { /* released */ }
  }, [player]);

  /** 1 is normal speed. Pitch is preserved by the player. */
  const setPlaybackRate = useCallback((rate: number) => {
    try {
      const clamped = Math.max(0.25, Math.min(4, rate));
      player.playbackRate = clamped;
      setPlaybackRateState(clamped);
    } catch { /* released */ }
  }, [player]);

  const setVolume = useCallback((value: number) => {
    try {
      const clamped = Math.max(0, Math.min(1, value));
      player.volume = clamped;
      setVolumeState(clamped);
    } catch { /* released */ }
  }, [player]);

  /** Keeps the screen awake while a video plays, so it does not dim mid-clip. */
  const setKeepScreenOn = useCallback((keep: boolean) => {
    try { player.keepScreenOnWhilePlaying = keep; } catch { /* released */ }
  }, [player]);

  /** Extracts frames as images at the given times, for a filmstrip or a poster. */
  const generateThumbnails = useCallback(async (times: number | number[]) => {
    try {
      return await player.generateThumbnailsAsync(times);
    } catch (e: any) {
      setError(e?.message ?? 'Could not generate thumbnails');
      return [];
    }
  }, [player]);

  return {
    /** Pass to `<VideoView player={player} />`. */
    player,

    /** Whether a source has been loaded. */
    hasSource,
    isPlaying,
    /** Seconds into the clip. */
    positionSeconds,
    /** Total length in seconds; 0 until the source reports it. */
    durationSeconds,
    /** How far ahead the player has buffered, useful for a remote source. */
    bufferedSeconds,
    /** Player status string, for example loading, readyToPlay or error. */
    status,
    isMuted,
    isLooping,
    playbackRate,
    volume,
    error,
    source,

    load,
    play,
    pause,
    togglePlay,
    seekTo,
    seekBy,
    replay,
    setMuted,
    setLoop,
    setPlaybackRate,
    setVolume,
    setKeepScreenOn,
    generateThumbnails,
  };
}

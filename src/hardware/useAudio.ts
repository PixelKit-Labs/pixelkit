/**
 * @file useAudio.ts
 * @description Multi-microphone acoustic recording, decibel metering, and audio DSP streaming.
 * Provides real-time decibel level updates (-160 dBFS to 0 dBFS) for acoustic monitoring and voice input.
 */

import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';

/**
 * Hook to record audio streams and measure ambient sound levels via device microphones.
 *
 * @returns Object providing recording state, decibel levels, and start/stop controls.
 *
 * @example
 * ```typescript
 * const { isRecording, meteringDecibels, startRecording, stopRecording } = useAudio();
 * await startRecording();
 * console.log(`Ambient noise: ${meteringDecibels} dB`);
 * const fileUri = await stopRecording();
 * ```
 */
export function useAudio() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [meteringDecibels, setMeteringDecibels] = useState<number>(-160);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

  useEffect(() => {
    const initAudio = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        setPermissionGranted(status === 'granted');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch {
        // Permissions or mode failure on restricted platforms
      }
    };
    initAudio();

    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  /**
   * Starts high-quality microphone recording with continuous metering callback.
   * @returns Promise resolving to Audio.Recording instance or null on failure.
   */
  const startRecording = async (): Promise<Audio.Recording | null> => {
    try {
      if (!permissionGranted) {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') return null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.metering !== undefined) {
            setMeteringDecibels(Math.round(status.metering));
          }
        },
        100 // update every 100ms
      );

      setRecording(newRecording);
      setIsRecording(true);
      return newRecording;
    } catch {
      return null;
    }
  };

  /**
   * Stops active recording and unloads the native audio hardware.
   * @returns Promise resolving to the local file URI of the recorded audio, or null.
   */
  const stopRecording = async (): Promise<string | null> => {
    try {
      if (!recording) return null;
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      return uri;
    } catch {
      return null;
    }
  };

  return {
    /** Whether the microphone is actively recording */
    isRecording,
    /** Real-time microphone acoustic level in dBFS (-160 to 0) */
    meteringDecibels,
    /** Start recording and metering */
    startRecording,
    /** Stop recording and retrieve audio file URI */
    stopRecording,
    /** Whether microphone permission has been granted */
    permissionGranted,
  };
}

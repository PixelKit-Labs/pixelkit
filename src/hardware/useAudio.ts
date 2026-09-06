import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';

/**
 * PixelForge Audio Engine
 * Handles low-latency audio effects, mic recording, and sound level metering.
 */
export function useAudio() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [meteringDecibels, setMeteringDecibels] = useState<number>(-160);
  const [permissionGranted, setPermissionGranted] = useState(false);

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
        // Permissions or mode failure
      }
    };
    initAudio();

    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const startRecording = async () => {
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
    isRecording,
    meteringDecibels,
    startRecording,
    stopRecording,
    permissionGranted,
  };
}

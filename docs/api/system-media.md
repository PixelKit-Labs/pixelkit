# System & Media API Reference 📱
> **Microphone Metering, 3,600 nits Super Actua Display, Pixelsnap Qi2.2 Battery, and MediaTek M90 Modem**

This document covers system telemetry, media capture, power, and wireless modem subsystems.

---

## 📑 Module Index

* [`useAudio`](#useaudio) - expo-audio recording (VOICE_RECOGNITION source) & dBFS metering
* [`useDisplay`](#usedisplay) - 3,600 nits Super Actua Display & Wake-Lock
* [`useDevice`](#usedevice) - Pixelsnap Qi2.2 25W Charging, Thermals & Battery Telemetry
* [`useNetwork`](#usenetwork) - MediaTek M90 Modem, Wi-Fi 7 & Satellite SOS
* [`useVideo`](#usevideo) - expo-video playback, seeking & frame thumbnails
* [`useMediaLibrary`](#usemedialibrary) - Saving captures to the device gallery
* [`useCellular`](#usecellular) - Carrier, radio generation & network codes

---

## `useAudio`

Microphone capture, level metering and playback, backed by **`expo-audio`** (the legacy `expo-av` package was removed in this project).

**Capture profiles.** `speech` records 16 kHz mono through the `voice_recognition` source, which is the path that applies the platform noise suppression and the format Google's speech APIs expect. `studio` records 48 kHz stereo through `unprocessed`, the raw microphone signal with no platform processing.

**Levels.** The recorder is polled every 100 ms. `meteringDecibels` is dBFS (-160 digital silence to 0 clipping) and `peakDecibels` holds the loudest value of the take. `level` maps the reading onto 0..1 with a floor at -60 dBFS, which is what a meter should be driven from; the dBFS scale is logarithmic and reads wrong on a bar. `isSilent` compares against `silenceThresholdDbfs` (-45 dBFS by default).

**Inputs.** `getAvailableInputs` is only valid once the recorder has been prepared, so `inputs` populates after recording starts. Selecting an input is how you switch to an attached USB or Bluetooth microphone on Android.

**Routing.** `setRoute` changes the audio mode, so it applies to the whole app rather than to one player.

### Signature
```typescript
type AudioQuality = 'speech' | 'studio';
type AudioRoute = 'speaker' | 'earpiece';

function useAudio(): {
  // capture state
  isRecording: boolean;            // true while paused as well
  isPaused: boolean;
  canRecord: boolean;              // RecorderState.canRecord
  permissionGranted: boolean;
  durationSeconds: number;
  quality: AudioQuality;

  // level
  meteringDecibels: number;        // dBFS -160..0
  currentDecibels: number;         // alias kept for older call sites
  peakDecibels: number;
  level: number;                   // 0..1, floored at -60 dBFS
  isSilent: boolean;
  silenceThresholdDbfs: number;
  setSilenceThresholdDbfs: (dbfs: number) => void;

  // inputs and routing
  inputs: RecordingInput[];        // { name, type, uid }
  currentInputUid: string | null;
  route: AudioRoute;

  // playback
  lastRecordingUri: string | null;
  isPlaying: boolean;
  playbackPositionSeconds: number;
  playbackDurationSeconds: number;

  source: TelemetrySource;         // 'hardware' once a real sample arrives
  error: string | null;

  // actions
  startRecording: (o?: { maxDurationSeconds?: number; quality?: AudioQuality }) => Promise<boolean>;
  pauseRecording: () => boolean;
  resumeRecording: () => boolean;
  stopRecording: () => Promise<string | null>;   // file URI
  setQuality: (q: AudioQuality) => void;
  refreshInputs: () => RecordingInput[];
  selectInput: (uid: string) => boolean;
  setRoute: (r: AudioRoute) => Promise<void>;
  playLastRecording: (uri?: string) => Promise<boolean>;
  pausePlayback: () => void;
  stopPlayback: () => Promise<void>;
  seekPlayback: (seconds: number) => Promise<void>;
};
```

### Example
```tsx
const audio = useAudio();

await audio.startRecording({ quality: 'speech', maxDurationSeconds: 30 });
// audio.level drives a meter; audio.isSilent gates a "say something" hint
const uri = await audio.stopRecording();
await audio.playLastRecording();
```

---

## `useCapabilities`

Single source of truth for what the current Pixel physically has and which Android platform APIs exist. Pure resolver lives in `src/core/capabilities.ts` (`resolveCapabilities(modelName, apiLevel, isDevice)`) so it can be unit tested; the hook memoises it for the app lifetime. Read it before rendering any Pro-exclusive feature.

### Signature
```typescript
function useCapabilities(): DeviceCapabilities;

interface DeviceCapabilities {
  modelName: string; isPhysicalDevice: boolean; isPixel: boolean;
  pixelGeneration: number | null; isProModel: boolean; isFoldable: boolean;
  androidApiLevel: number | null;
  hasHiLight: boolean;              // Pixel 11 Pro / Pro XL / Pro Fold (no public API; simulated)
  hasUWB: boolean;                  // Pro models since Pixel 6 Pro, all Folds
  hasTitanM3: boolean;              // Pixel 11 family
  geminiNanoTier: 'nano-v4' | 'nano-v3' | 'nano-v2' | 'none';
  supportsRangingApi: boolean;      // Android 16+ RangingManager
  supportsHapticEnvelopes: boolean; // Android 16+ envelope vibrations
  supportsAppFunctions: boolean;    // Android 16+
  supportsAndroid17Apis: boolean;   // Android 17+
}
```

### Example
```typescript
const caps = useCapabilities();
if (!caps.hasHiLight) hideHiLightCard();
if (caps.geminiNanoTier === 'nano-v4') enableThinkingMode();
```

---

## `useDisplay`

Real display telemetry from Android `Display` (active mode refresh rate, supported refresh rates, resolution, HDR types, ARR support) polled every 2 s because adaptive refresh rate changes it live, plus brightness (expo-brightness) and the wake lock (expo-keep-awake). `setPreferredRefreshRate()` sets the window's preferred rate; verified on Pixel 11 Pro via `dumpsys display` (`frameRateOverride {uid=… frameRateHz=60}` after preferring 60 Hz). Supported rates on Pixel 11 Pro: 120 / 60 / 40 / 30 / 24 / 20 / 15 / 10 / 5 / 2 / 1 Hz, HDR10 · HLG · HDR10+, `hasArrSupport = true`.

### Signature
```typescript
function useDisplay(): {
  isKeepAwake: boolean;
  toggleKeepAwake: () => Promise<void>;
  brightness: number;                          // 0..1
  setScreenBrightness: (val: number) => Promise<void>;
  setBrightness: (val: number) => Promise<void>;   // alias
  refreshRateHz: number;                       // active mode, 0 until read
  hasArrSupport: boolean | null;               // Android 16+
  supportedRefreshRates: number[];
  resolution: { width: number; height: number; densityDpi: number } | null;  // active mode
  hdrTypes: number[];                          // 1 Dolby Vision, 2 HDR10, 3 HLG, 4 HDR10+
  isHdr: boolean;
  maxLuminance: number | null;
  setPreferredRefreshRate: (hz: number) => Promise<boolean>;
  source: TelemetrySource;
};
```

> **Expo SDK 57 Note**: In Expo SDK 57, `activateKeepAwakeAsync(tag)` requires passing a string tag to prevent unhandled promise rejections.

---

## `useDevice`

Monitors battery health, charging status, PMIC telemetry, and Pixelsnap Qi2.2 25W magnetic wireless charging.

### Signature
```typescript
function useDevice(): DeviceTelemetry;
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `modelName` | `string` | Device model string (`"Pixel 11 Pro"`) |
| `brand` | `string` | Device brand (`"Google"`) |
| `osVersion` | `string` | Android version (`"Android 16"`) |
| `batteryLevel` | `number` | Remaining battery percentage (0–100) |
| `isCharging` | `boolean` | True if connected to AC or Pixelsnap wireless charger |
| `lowPowerMode` | `boolean` | True if Android Battery Saver is engaged |
| `networkType` | `string` | Primary network link (`"WIFI"`, `"CELLULAR"`) |
| `isConnected` | `boolean` | Internet route reachability |

---

## `useNetwork`

Interfaces with the MediaTek M90 modem for Wi-Fi 7 (802.11be), 5G Sub-6/mmWave, and Satellite SOS.

### Signature
```typescript
function useNetwork(): NetworkTelemetry & {
  refreshNetworkStatus: () => Promise<void>;
};
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `ipAddress` | `string \| null` | Device IP address string |
| `networkType` | `string` | Connection technology |
| `isConnected` | `boolean` | Online status |
| `isMetered` | `boolean` | True if carrier data billing is metered |
| `isAirplaneMode` | `boolean` | True if all radios are disabled |

---

## `useVideo`

Video playback on **`expo-video`**, the SDK 57 replacement for the removed `expo-av`. The natural partner to `useCamera().startRecording()`: record a clip, hand `lastVideoUri` to `load()`, play it back.

The hook owns the player and a screen renders the view with it. Position, duration, buffered position and status are polled four times a second, which is enough to drive a scrubber without waking the JS thread every frame. Values are read from the player rather than tracked locally, so a seek made elsewhere still shows up.

### Signature
```typescript
function useVideo(initialSource?: VideoSource): {
  player: VideoPlayer;                 // pass to <VideoView player={player} />
  hasSource: boolean;
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;             // 0 until the source reports it
  bufferedSeconds: number;
  status: string;                      // loading | readyToPlay | error
  isMuted: boolean; isLooping: boolean;
  playbackRate: number;                // 0.25..4, pitch preserved
  volume: number;
  error: string | null;
  source: TelemetrySource;
  load: (source: VideoSource, options?: { autoplay?: boolean; loop?: boolean; muted?: boolean }) => Promise<boolean>;
  play: () => void; pause: () => void; togglePlay: () => void; replay: () => void;
  seekTo: (seconds: number) => void; seekBy: (seconds: number) => void;
  setMuted: (b: boolean) => void; setLoop: (b: boolean) => void;
  setPlaybackRate: (rate: number) => void; setVolume: (v: number) => void;
  setKeepScreenOn: (keep: boolean) => void;
  generateThumbnails: (times: number | number[]) => Promise<VideoThumbnail[]>;
};
```

### Example
```tsx
import { VideoView } from 'expo-video';
import { useCamera, useVideo } from './src';

export function Playback() {
  const cam = useCamera();
  const video = useVideo();
  return (
    <View>
      <VideoView player={video.player} style={{ height: 220 }} />
      <HapticButton
        title="Play last recording"
        onPress={() => cam.lastVideoUri && video.load(cam.lastVideoUri, { autoplay: true })}
      />
      <Text>{video.positionSeconds} / {video.durationSeconds} s</Text>
    </View>
  );
}
```

> The view needs the `player` object. Passing a URI to `VideoView` renders nothing. Turn `setKeepScreenOn(false)` when playback ends, or the screen stays lit.

---

## `useMediaLibrary`

Saving captures into the user's gallery, on **`expo-media-library`**. Without this, a photo from `useCamera().takePicture()` or a clip from `startRecording()` sits in the app's cache directory and disappears when the system reclaims it.

SDK 57 uses the class API (`Asset.create`, `Album.create`, `Query`); the deprecated `createAssetAsync` helpers throw at runtime. `Asset` exposes async accessors, so the hook flattens each into a plain `SavedMedia` a list can render directly.

Permission is more than a yes or no on modern Android: access is granted per media type and the user may share only selected items, which is what `hasLimitedAccess` reports.

### Signature
```typescript
interface SavedMedia {
  id: string; uri: string; filename: string;
  width: number; height: number;
  durationSeconds: number | null;      // null for stills
  creationTime: number | null;
}

function useMediaLibrary(): {
  permissionGranted: boolean;
  hasLimitedAccess: boolean;           // Android 13+ partial share
  isSaving: boolean; isLoading: boolean;
  recent: SavedMedia[];                // newest first
  lastSaved: SavedMedia | null;
  error: string | null;
  source: TelemetrySource;
  requestPermission: (writeOnly?: boolean) => Promise<boolean>;
  save: (localUri: string, albumName?: string) => Promise<SavedMedia | null>;
  loadRecent: (limit?: number) => Promise<SavedMedia[]>;
  remove: (media: SavedMedia) => Promise<boolean>;
};
```

### Example
```tsx
const cam = useCamera();
const library = useMediaLibrary();

const shoot = async () => {
  const photo = await cam.takePicture();
  if (photo) await library.save(photo.uri, 'PixelKit');   // creates the album if needed
};
```

> Ask with `requestPermission(true)` when the app only needs to save; it is a smaller request than full library access.

---

## `useCellular`

Modem telemetry on **`expo-cellular`**. `useNetwork` can say the connection is cellular; this says whether it is 5G or 2G and which carrier is serving it, which is what you need before deciding to stream.

`generation` reflects the live data connection, so it changes as the device moves and reads `unknown` when no cellular data is attached, including on Wi-Fi. Carrier name and the network codes need `READ_PHONE_STATE` (declared in `app.json`); without it they stay `null` rather than being guessed at. The MCC/MNC pair identifies a carrier globally and is more reliable than matching the display name.

### Signature
```typescript
function useCellular(): {
  generation: 'unknown' | '2G' | '3G' | '4G' | '5G';
  is5G: boolean;
  carrierName: string | null;          // null without READ_PHONE_STATE
  isoCountryCode: string | null;
  mobileCountryCode: string | null;
  mobileNetworkCode: string | null;
  allowsVoip: boolean | null;
  permissionGranted: boolean;
  error: string | null;
  source: TelemetrySource;
  refresh: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
};
```

### Example
```tsx
const net = useNetwork();
const cell = useCellular();

if (!net.isConnected) return 'offline';
if (net.isMetered && !cell.is5G) return `on ${cell.generation}, ask before streaming`;
```

> Pair with `useNetwork().isMetered`: generation tells you how fast, metered tells you who pays.

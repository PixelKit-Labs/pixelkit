# pixelkit

The Google Pixel 11 Pro as React hooks: silicon telemetry, sensors, radios, security, and Gemini
running on the device itself.

```bash
npx expo install pixelkit pixel-native pixel-nano
```

```tsx
import { useCPU, useGemini, MetricCard } from 'pixelkit';

function Compute() {
  const cpu = useCPU();
  return <MetricCard label="Big core" value={cpu.cores[0]?.curMHz} unit="MHz" source={cpu.source} />;
}
```

## Read this before you install

**Android only.** Both native modules declare `platforms: ["android"]`. On iOS and web every
native-backed hook reports `unavailable`.

**It cannot run in Expo Go.** The hooks talk to two Kotlin Expo Modules that must be compiled in,
so you need a development build (`npx expo run:android`, or an EAS development profile). This is
not a limitation to work around; there is no JavaScript path to a thermal sensor.

**Nothing is simulated.** Every hook returns `source: 'hardware' | 'derived' | 'unavailable'`.
There is deliberately no `simulated` member, so a fabricated reading is not representable. A value
that cannot be read is `null` and `MetricCard` renders it as an em dash. Nothing is ever
substituted with a plausible default.

**Most of it is Pixel-specific.** 20 of the 33 hook modules read through `pixel-native`. On a
Samsung or a OnePlus the generic ones still work, and the rest report `unavailable` rather than
guessing. That is the design behaving correctly, not a bug: if you want a reading this package
cannot take, the honest fix is a native path, not a default.

## What is in it

| Area | Hooks |
| :--- | :--- |
| Silicon | `useCPU`, `useGPU`, `useTPU`, `useMemory`, `useADPF` |
| System | `useDevice`, `useDisplay`, `useNetwork`, `useCellular`, `useCapabilities` |
| Sensors | `useSensors`, `useLocation`, `useCamera`, `useVideo`, `useMediaLibrary`, `useAudio` |
| Actuators | `useHaptics`, `useTorch`, `useHiLight` |
| Radios | `useBLE`, `useNFC`, `useUWB`, `useRadios` |
| Security | `useBiometrics`, `useSecurity` |
| AI | `useGemini`, `useGeminiNano`, `useGenAITasks`, `useVisionAI`, `useNaturalLanguageAI`, `useSpeechAI`, `useSpeech` |

Plus the design system (`Colors`, `Type`, `MetricCard`, `HapticButton`, `ScreenScaffold`, `Decor`
primitives) and the observability layer (`traced`, `logError`, `useObservability`) that every hook
reports through.

## Observability

Every function that touches hardware, the network, a native module or the file system is wrapped
in `traced()`, so it is timed and correlated, and surfaces failure through an `error` field rather
than an empty catch. `useObservability()` gives you the event log, the slowest traces and the error
counts at runtime.

## Documentation

Full input and output tables for all 32 hooks, with a contract for every function:
[docs/HARDWARE_API.md](https://github.com/PixelKit-Labs/pixelkit/blob/master/docs/HARDWARE_API.md).

## Licence

MIT

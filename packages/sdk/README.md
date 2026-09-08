# @pixelkit-labs/sdk

An **on-device AI development kit** for the Google Pixel. Gemini Nano, ML Kit vision and document
scanning, offline translation across 58 languages, and speech both directions — as typed React
hooks for TypeScript, Expo and React Native, with the thermal and capability signals to know when
to run locally and when to fall back to cloud.

Telemetry, sensors, radios, security and cloud Gemini:

```bash
npx expo install @pixelkit-labs/sdk @pixelkit-labs/native
```

On-device ML - Gemini Nano, vision, natural language - is opt-in, because it puts 19 ML Kit
artifacts in your APK. Install it only if you want those hooks:

```bash
npx expo install @pixelkit-labs/mlkit
```

```tsx
import { useCPU, useGemini, MetricCard } from '@pixelkit-labs/sdk';
import { useGeminiNano } from '@pixelkit-labs/sdk/mlkit'; // only with @pixelkit-labs/mlkit installed

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

**Most of it is Pixel-specific.** 20 of the 33 hook modules read through `@pixelkit-labs/native`. On a
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
| AI (main entry) | `useGemini`, `useSpeechAI`, `useSpeech` |
| AI (`@pixelkit-labs/sdk/mlkit`) | `useGeminiNano`, `useGenAITasks`, `useVisionAI`, `useNaturalLanguageAI` |

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
[the documentation](https://github.com/PixelKit-Labs/pixelkit-docs).

## Licence

MIT

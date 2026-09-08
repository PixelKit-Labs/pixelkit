<p align="center">
  <img src="./PixelKit_readme.jpg" alt="PixelKit" width="640">
</p>

<h1 align="center">PixelKit</h1>

<p align="center">
  Google Pixel hardware as React hooks. Per-core CPU frequencies from cpufreq, battery temperature
  from the fuel gauge, the camera and microphone, every radio from NFC to ultra-wideband, biometrics
  and the hardware keystore, and Gemini Nano on-device.
  <br><br>
  Every value tells you where it came from. A reading the hardware cannot give you comes back
  <code>null</code> instead of a guess, so you always know whether a number is real.
</p>

<p align="center">
  <a href="https://github.com/PixelKit-Labs/pixelkit-docs">Documentation</a>
  &middot;
  <a href="https://github.com/PixelKit-Labs/pixelkit-template">Template</a>
  &middot;
  <a href="https://github.com/PixelKit-Labs/pixelkit-sdk/issues/new?labels=bug">Report a bug</a>
</p>

## Install

```bash
npx expo install pixelkit @pixelkit-labs/native
```

On-device ML is a separate install, because it adds 19 ML Kit artifacts to your APK:

```bash
npx expo install @pixelkit-labs/mlkit
```

```tsx
import { useCPU } from 'pixelkit';
import { useGeminiNano } from 'pixelkit/mlkit';

function Compute() {
  const cpu = useCPU();
  // cpu.source is 'hardware' | 'derived' | 'unavailable'; curMHz is null when it cannot be read
  return <Text>{cpu.cores[0]?.curMHz ?? '—'} MHz</Text>;
}
```

**Android only**, and you need to build it onto the device with `npx expo run:android`. It cannot
run in Expo Go: reading a thermal sensor takes native code compiled into the app, and Expo Go only
contains the native code Expo put in it.

## Provenance

Every hook returns a `source`:

| Value | Meaning |
| :--- | :--- |
| `hardware` | Read from a device API or sysfs during this run |
| `derived` | Computed from genuine readings, such as CPU share from process time over wall time |
| `unavailable` | Could not be read. The value is `null`. |

There is deliberately no `simulated` member. The type makes a fabricated reading unrepresentable,
which is the whole design: if a value cannot be measured you get a blank, and a control that depends
on it refuses rather than pretending.

On hardware that is not a Pixel, the generic hooks work and the rest report `unavailable`. That is
correct behaviour, not a fault — `npx @pixelkit-labs/cli doctor` will tell you which case you are in.

## Hooks

**Silicon and system** — `useCPU`, `useGPU`, `useMemory`, `useADPF`, `useTPU`, `useDevice`,
`useDisplay`, `useNetwork`, `useCellular`, `useCapabilities`

**Sensors and capture** — `useSensors`, `useLocation`, `useCamera`, `useVideo`, `useMediaLibrary`,
`useAudio`

**Actuators** — `useHaptics`, `useTorch`, `useHiLight`

**Radios** — `useBLE`, `useNFC`, `useUWB`, `useRadios`

**Security** — `useBiometrics`, `useSecurity`

**AI** — `useGemini`, `useSpeechAI`, `useSpeech`, and from `pixelkit/mlkit`: `useGeminiNano`,
`useGenAITasks`, `useVisionAI`, `useNaturalLanguageAI`

Inputs, outputs and a contract for every function are in the
[documentation](https://github.com/PixelKit-Labs/pixelkit-docs).

## Packages

| | |
| :--- | :--- |
| `pixelkit` | The hooks, types and observability layer |
| `@pixelkit-labs/native` | Kotlin Expo Module for telemetry and actuators. No third-party dependencies. |
| `@pixelkit-labs/mlkit` | Kotlin Expo Module for on-device ML Kit and Gemini Nano. Opt-in. |

They version in lockstep, and `pixelkit` pins the other two exactly.

## Repositories

- **[pixelkit-template](https://github.com/PixelKit-Labs/pixelkit-template)** — a working four-tab
  app demonstrating every hook on a real device. Press **Use this template** to start from it.
- **[pixelkit-docs](https://github.com/PixelKit-Labs/pixelkit-docs)** — the documentation site.
- **[pixelkit-cli](https://github.com/PixelKit-Labs/pixelkit-cli)** — `pixelkit doctor`.

## Developing

```bash
npm install
npm run typecheck
npm run build      # compiles all three packages to build/ with declarations
```

[CONTRIBUTING.md](./CONTRIBUTING.md) covers the two rules that fail a build rather than a review.

## Licence

MIT.

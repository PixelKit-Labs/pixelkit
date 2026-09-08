# @pixelkit-labs/native

Expo module (Kotlin) for Google Pixel telemetry and actuators: SoC identity, CPU clusters and
per-core frequencies, memory, thermal and ADPF headroom, display modes, GPU, torch, and haptic
envelopes.

**Zero third-party dependencies.** It reads Android framework APIs and the kernel directly, so it
adds nothing to your dependency graph. Its sibling [`@pixelkit-labs/mlkit`](https://www.npmjs.com/package/@pixelkit-labs/mlkit)
is a separate package precisely so that telemetry does not drag ML Kit in behind it.

**Android only. Requires a development build** — the module must be compiled in, so it does not
work in Expo Go. The TypeScript bridge uses `requireOptionalNativeModule`, so it resolves to `null`
rather than throwing when the native side is absent, letting callers report `unavailable`.

Normally installed as a dependency of [`pixelkit`](https://www.npmjs.com/package/pixelkit), which
wraps it in typed React hooks. Install it directly if you want the raw module.

```bash
npx expo install @pixelkit-labs/native
```

MIT

# pixel-native

Expo module (Kotlin) for Google Pixel telemetry and actuators: SoC identity, CPU clusters and
per-core frequencies, memory, thermal and ADPF headroom, display modes, GPU, torch, and haptic
envelopes.

**Android only. Requires a development build** — the module must be compiled in, so it does not
work in Expo Go. The TypeScript bridge uses `requireOptionalNativeModule`, so it resolves to
`null` rather than throwing when the native side is absent, letting callers report `unavailable`.

Normally installed as a dependency of [`pixelkit`](https://www.npmjs.com/package/pixelkit), which
wraps it in typed React hooks. Install it directly if you want the raw module.

```bash
npx expo install pixel-native
```

MIT

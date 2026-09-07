# pixel-nano

Expo module (Kotlin) for Gemini Nano on-device inference through the ML Kit GenAI Prompt API on
AICore.

**Android only. Requires a development build**, and a device with AICore and the Nano feature
downloaded. The TypeScript bridge uses `requireOptionalNativeModule`, so it resolves to `null`
rather than throwing when the native side is absent, letting callers report `unavailable`.

Normally installed as a dependency of [`pixelkit`](https://www.npmjs.com/package/pixelkit), which
wraps it in the `useGeminiNano` hook. Install it directly if you want the raw module.

```bash
npx expo install pixel-nano
```

MIT

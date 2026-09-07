# Security Policy

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private vulnerability reporting on this repository
(Security → Report a vulnerability), which notifies the maintainer without disclosing the problem.

Include what you found, how to reproduce it, and what an attacker could do with it. You will get an
acknowledgement; this is a small project maintained by one person, so please allow a few days.

## Supported versions

The latest published version only. This project is pre-1.0 and does not backport fixes.

## What PixelKit touches

Worth knowing when assessing a report:

- **Secrets** go through `useSecurity().saveSecureItem()` or `saveApiKey()`, which write to
  `expo-secure-store`, backed by the hardware-backed Android Keystore. Nothing is written to
  plaintext storage, and no key is ever committed. `.env.example` holds placeholders only.
- **The Gemini API key** you configure is sent to Google's Generative Language API and nowhere else.
  Cloud chat, grounding and token counting all go to that one endpoint.
- **Sensitive permissions** are requested at the point of use: location (BLE scanning requires it on
  Android), camera, microphone, biometrics, media library. The BLE scan does **not** carry
  `neverForLocation`.
- **On-device AI** runs through AICore and does not leave the device.
- **Telemetry** is read and displayed locally. PixelKit ships no analytics and makes no network
  calls of its own beyond the Gemini API you configure.

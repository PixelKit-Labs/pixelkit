# Releasing PixelKit

PixelKit itself is a template and is released as source: a tag and a GitHub release, no binary.
This runbook is for **shipping an app built from it** — and for the tagged source releases here,
whose gates are the same.

What has to be true before a build goes out, in the order it has to be true. Every command here
runs from the repo root on Windows with the Android SDK at `%LOCALAPPDATA%\Android\Sdk`.

---

## 1. Gates

None of these are advisory. A release that fails one is not a release.

```bash
npm run verify          # tsc --noEmit, then the parity check
npx expo-doctor         # 21 checks, including peer dependencies a release build needs
npx expo export -p android
```

`npm run verify` fails when a hook has no home screen, when a home screen never calls its hook,
when a documented function has no control anywhere without a waiver, or when a handler that takes
arguments is passed straight to `onPress`. `expo-doctor` is the one that catches the class of
problem you cannot see locally — a missing native peer dependency works in Expo Go and crashes in
a standalone build.

## 2. Version

Every change bumps the patch version and adds a `CHANGELOG.md` entry in the same commit. A release
decides whether that becomes a minor or a major, and that call is the maintainer's.

Three values move together:

| File | Field |
| :--- | :--- |
| `package.json` | `version` |
| `app.json` | `expo.version` |
| `app.json` | `expo.android.versionCode` — integer, +1 every build that could be installed |

`eas.json` sets `appVersionSource: "local"`, so these checked-in values are what ships. Do not turn
on `autoIncrement`: EAS would assign its own version code and the repo would stop describing what
is on the device.

## 3. On the device

The gates prove the code compiles and bundles. They do not prove the hardware paths work, and this
app is almost entirely hardware paths.

```bash
adb reverse tcp:8081 tcp:8081
npx expo start
```

Walk every section once, on a real Pixel, unlocked: Silicon (Compute · System · Network · Trace),
Sensors (Motion · Capture · Audio · Actuators · Radios · Security), AI Lab (Chat · Tasks · Vision ·
Language · Voice · Agents), Docs. Watch the provenance tags: a card that reads `HW` on a value the
device cannot actually produce is the bug this project exists to avoid.

```bash
adb logcat -s ReactNativeJS | grep PixelKit
```

## 4. Signing

**`android/` is generated and is not tracked.** `npx expo prebuild --clean` rewrites it, so nothing
you edit in `android/app/build.gradle` survives. Two consequences:

- For an **EAS build**, credentials live with EAS (`eas credentials`), which is the supported path
  and the one this repo is set up for.
- For a **local `assembleRelease`**, the generated Gradle config falls back to the debug keystore
  when no release keystore is configured. It will produce an APK, it will install, and it is
  **debug-signed** — never ship that. Pass a real keystore:

```bash
export PIXELKIT_RELEASE_KEYSTORE_PATH=/abs/path/to/upload.jks
export PIXELKIT_RELEASE_STORE_PASSWORD=…
export PIXELKIT_RELEASE_KEY_ALIAS=upload
export PIXELKIT_RELEASE_KEY_PASSWORD=…
cd android && ./gradlew assembleRelease
```

Verify what you built before you upload it:

```bash
"$LOCALAPPDATA/Android/Sdk/build-tools/<version>/apksigner" verify --print-certs \
  android/app/build/outputs/apk/release/app-release.apk
```

If the certificate says `CN=Android Debug`, stop.

## 5. Build

```bash
eas login
eas build -p android --profile preview      # APK, for a GitHub release or direct install
eas build -p android --profile production   # app bundle, for Play
```

`preview` and `production` differ only in artifact type; both are release builds.

## 6. GitHub release

```bash
git tag -a v<version> -m "PixelKit v<version>"
git push origin v<version>
gh release create v<version> --title "PixelKit v<version>" --notes-file <notes>
gh release upload v<version> path/to/app-release.apk
```

Release notes come from the `CHANGELOG.md` entry for that version — it is written for a reader, so
it does not need rewriting.

## 7. Play

Needed once, then kept current:

- **Privacy policy URL.** [`docs/PRIVACY.md`](https://github.com/PixelKit-Labs/pixelkit-template/blob/main/docs/PRIVACY.md) in the template is the text; host it and give Play
  the URL.
- **Data safety form.** The answers are in [`docs/store-listing.md`](https://github.com/PixelKit-Labs/pixelkit-template/blob/main/docs/store-listing.md) in the template, with
  the reasoning for each one.
- **Permission declarations.** `READ_PHONE_STATE` and the location permissions need a stated
  purpose; the same file has the wording and what actually uses each permission.
- **Listing copy and screenshots.** Copy is in the same file. Play requires screenshots; capture
  them from the device at release time rather than committing them, so they cannot go stale in the
  repository.

```bash
eas submit -p android --latest --profile production   # internal track
```

## 8. After

- Confirm the tag, the release and the installed `versionName` agree.
- `adb shell dumpsys package com.pixelkit.sdk | grep versionName`
- Open an issue for anything the device walk surfaced that did not block the release.

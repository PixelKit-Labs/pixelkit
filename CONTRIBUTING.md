# Contributing to PixelKit

Thanks for looking. Before you spend time on a change, two things are worth knowing, because they
are unusual and they are enforced by the build rather than by review.

## The two rules that will fail your PR

**1. Nothing is simulated.** Every hook returns `source: 'hardware' | 'derived' | 'unavailable'`.
There is deliberately no `simulated` member, so a fabricated reading is not representable in the
type system. A value that cannot be read is `null`, renders as an em dash, and its capability
reports `unavailable` so the control refuses rather than pretending.

If a feature cannot be driven for real, write the real path — a native module, a platform API — or
report it unavailable. A plausible default is worse than a blank, because a blank is honest.

**2. A function is not finished until it is documented.** JSDoc on the export saying what it does
and which platform API it uses, and the matching page in
[pixelkit-docs](https://github.com/PixelKit-Labs/pixelkit-docs) with every input, every returned
field and what failure looks like. A hook whose documentation lands in a later pull request is a
hook nobody can use.

The template repository runs a parity check against the published package: a hook this SDK exports
with nowhere to try it fails its build. Documentation is reviewed here.

## Adding a hook

1. Write it in `packages/pixelkit/src/hardware/` or `src/ai/`, wrapping every call that touches
   hardware, the network, a native module or the file system in `traced()` from
   `packages/pixelkit/src/core/observability.ts`. Surface failure through an `error` field. Never an
   empty catch.
2. Export it from `packages/pixelkit/src/index.ts`, or from `src/mlkit.ts` if it needs ML Kit.
3. Give it a home in `src/core/surface.ts`: the tab and section that demonstrates it.
4. Call it from that screen. The parity check verifies the screen actually does.
5. Document it in the four places above.
6. `npm run verify`.

## Before you open a PR

```bash
npm run typecheck
npm run build      # all three packages compile
npm pack --dry-run -w pixelkit -w @pixelkit/native -w @pixelkit/mlkit
```

Every change bumps the patch version and adds a `CHANGELOG.md` entry in the same commit. Run
`node scripts/sync-versions.js <version>` — it moves all four manifests and the Android
`versionCode` together, which matters because `pixelkit` pins its native modules exactly.

## What you need to run it

An Android device. **PixelKit cannot run in Expo Go** — the hooks talk to two Kotlin Expo Modules
that have to be compiled in, so you need a development build (`npx expo run:android`).

Most of it is Pixel-specific. On other hardware the generic hooks work and the rest report
`unavailable`. That is the design working, not a bug.

## Reporting a bug

Include the device, the Android version, whether you are on a development build, and the `source`
value the hook returned. `source: 'unavailable'` on a non-Pixel is usually correct behaviour rather
than a fault, and saying which device you are on saves a round trip.

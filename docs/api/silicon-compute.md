# Silicon & Compute API Reference 💻
> **Tensor G6 CPU, PowerVR GPU, on-device AI stack, memory, and ADPF thermals, all read from the device**

Every hook in this document reads real Android platform state through the local **PixelNative** Expo Module (`modules/pixel-native`). Nothing is fabricated: when a value cannot be read it is `null` and the hook's `source` reports `'unavailable'`. See [Observability](#observability--provenance) for the provenance model.

---

## 📑 Module Index

* [`useCPU`](#usecpu) - Core topology, cpufreq, governor, app CPU share
* [`useGPU`](#usegpu) - GL/Vulkan identity and Choreographer frame pacing
* [`useTPU`](#usetpu) - AICore / Gemini Nano stack detection
* [`useMemory`](#usememory) - ActivityManager memory, heaps, low-memory flag
* [`useADPF`](#useadpf) - Thermal headroom, thermal status, SystemHealth CPU/GPU headroom
* [Observability & provenance](#observability--provenance)
* [PixelNative module](#pixelnative-module)

---

## `useCPU`

Reads the CPU topology from `/proc/cpuinfo` (per-core Arm part ids mapped to names such as `Arm C1-Ultra`, `Arm C1-Pro`) and cpufreq sysfs (`cpuinfo_max_freq`, `scaling_cur_freq`, `scaling_governor`). Android does not expose whole-system `/proc/stat` to apps, so the two load signals are (a) cluster frequency utilisation and (b) this app's own CPU share.

Verified on Pixel 11 Pro: `1x Arm C1-Ultra @ 4.11 GHz + 4x Arm C1-Pro @ 3.38 GHz + 2x Arm C1-Pro @ 2.65 GHz`, governor `sched_pixel`.

### Signature
```typescript
function useCPU(): {
  coreTopology: string;                 // built from real cluster data
  coreCount: number;
  cpuLoadPercent: number | null;        // avg current/max frequency across cores (HW)
  appCpuPercent: number | null;         // process CPU time / wall time / cores (DERIVED)
  cores: { index: number; part: string | null; name: string | null; curMHz: number | null; maxMHz: number | null; minMHz: number | null }[];
  clusters: { part: string | null; name: string | null; maxMHz: number | null; count: number }[];
  governorMode: string;                 // e.g. "sched_pixel"; read-only
  lastBenchmarkDurationMs: number | null;
  isBenchmarking: boolean;
  benchmarkCPU: () => Promise<number>;  // JS single-thread prime sieve (real compute, not a system benchmark)
  source: TelemetrySource;
};
```

### Example
```tsx
const { coreTopology, cpuLoadPercent, cores, benchmarkCPU } = useCPU();
<Text>{coreTopology}</Text>
<Text>{cpuLoadPercent ?? '—'}% · {cores.map(c => c.curMHz).join('/')} MHz</Text>
```

---

## `useGPU`

GPU identity comes from an offscreen EGL context (`GL_RENDERER`, `GL_VENDOR`, `GL_VERSION`) plus the `android.hardware.vulkan.version` feature. Frame pacing is measured on the UI thread with `Choreographer` in 1 s windows: presented FPS, average and max frame interval, jank frames (interval > 1.5× the display's expected frame time). GPU memory is not exposed by Android and is always `null`.

Verified on Pixel 11 Pro: `ANGLE (Imagination Technologies, Vulkan 1.4.317 (PowerVR C-Series CXTP-48-1536 MC1))`, 114 FPS presented in a 120 Hz mode.

### Signature
```typescript
function useGPU(): {
  gpuRenderer: string | null;
  gpuVendor: string | null;
  graphicsApi: string | null;           // "OpenGL ES 3.2 … / Vulkan 1.4"
  frameRenderTimeMs: number | null;     // avg UI-thread frame interval, last 1 s
  maxFrameMs: number | null;
  measuredFps: number | null;
  droppedFrameCount: number;            // cumulative jank frames
  jankFramesLastSecond: number;
  targetBudgetMs: number;               // 8.33 at 120 Hz, 16.67 at 60 Hz
  isStuttering: boolean;
  gpuMemoryUsageMB: null;
  source: TelemetrySource;
};
```

---

## `useTPU`

The Tensor TPU is only reachable through AICore (Gemini Nano via ML Kit) or LiteRT. This hook reports what is verifiably installed and leaves inference metrics `null` until the `pixel-nano` module exists. `benchmarkTPU()` runs a real 256×256 JS matmul and reports it as **CPU fallback**, clearly labelled.

Verified on Pixel 11 Pro: AICore `0.release.prod_aicore_20260723.00_RC11`, Private Compute Services `1.0.release.962568596`. Requires the `<queries>` declaration in the module manifest (Android 11+ package visibility).

### Signature
```typescript
function useTPU(): {
  aicoreInstalled: boolean;
  aicoreVersion: string | null;
  privateComputeServicesVersion: string | null;
  hasNpuFeature: boolean | null;        // android.hardware.neural_processing_unit
  activeDelegate: 'Tensor TPU' | 'NPU' | 'GPU' | 'CPU Fallback';
  isHardwareAccelerated: false;         // this hook runs nothing on the TPU; see useGeminiNano
  lastInferenceLatencyMs: number | null;
  throughputTokensPerSec: number | null;
  memoryFootprintMB: number | null;
  cpuFallbackLatencyMs: number | null;
  isBenchmarking: boolean;
  benchmarkTPU: () => Promise<TPUAcceleration>;
  source: TelemetrySource;
};
```

---

## `useMemory`

`ActivityManager.getMemoryInfo` (total, available, low-memory threshold and flag), the Java heap (`Runtime`) and the native heap (`Debug.getNativeHeapAllocatedSize`), polled every 2 s. `purgeCaches()` requests a GC and re-reads; it does not pretend to free system RAM.

### Signature
```typescript
function useMemory(): {
  totalRAMMB: number;
  usedRAMMB: number;                    // total − available (includes reclaimable caches)
  freeRAMMB: number;
  isLowMemory: boolean;                 // kernel low-memory flag
  lowMemoryThresholdMB: number;
  appJavaHeapMB: number;
  appJavaHeapMaxMB: number;
  appNativeHeapMB: number;
  purgeCaches: () => void;
  source: TelemetrySource;
};
```

---

## `useADPF`

* `PowerManager.getThermalHeadroom(0)`: 0.0 cool → 1.0 severe throttling, polled every **10 s** (Google's minimum; faster polling returns NaN), plus `getThermalHeadroomThresholds()` on Android 15+.
* `PowerManager` thermal status via a live `OnThermalStatusChangedListener` (`nominal | light | moderate | severe | critical`).
* Android 16+ `SystemHealthManager.getCpuHeadroom / getGpuHeadroom` (reflection, `null` when the device does not report them).
* `targetFps` from the display mode, `currentFps` from Choreographer.

Verified on Pixel 11 Pro: headroom 0.55 at status NONE; thresholds `{1: 0.8, 2: 0.933, 3: 1.0, 4: 1.05, 5: 1.233, 6: 1.667}`.

### Signature
```typescript
function useADPF(): {
  thermalHeadroom: number | null;
  thermalThresholds: Record<string, number> | null;
  thermalStatus: 'nominal' | 'light' | 'moderate' | 'severe' | 'critical';
  thermalStatusCode: number;            // PowerManager.THERMAL_STATUS_*
  cpuHeadroom: number | null;           // 0..1 remaining, Android 16+
  gpuHeadroom: number | null;
  targetFps: number | null;
  currentFps: number | null;
  reportWorkDuration: (actualMs: number, targetMs?: number) => 'WITHIN_BUDGET' | 'BOOST_REQUESTED';
  source: TelemetrySource;
};
```

---

## Observability & provenance

`src/core/observability.ts` gives every reading a **source**:

| `TelemetrySource` | Meaning |
| :--- | :--- |
| `hardware` | Read from an Android API or sensor |
| `derived` | Computed from hardware readings (e.g. app CPU share) |
| `simulated` | Placeholder until a native path exists; must be labelled in UI |
| `unavailable` | The API/hardware is absent; value is `null` |

APIs: `logEvent(module, event, data?, level?)` (console-logged with the `[PixelForge]` prefix so `adb logcat -s ReactNativeJS | grep PixelForge` shows them), `recordMetric(module, metric, value, source)`, `useObservability()` (events + latest metrics + per-module source summary, ≤4 Hz), `getSourceSummary()`. `MetricCard` renders the `source` prop as a footer tag.

---

## PixelNative module

`modules/pixel-native` (Kotlin, Expo Modules API, autolinked from `./modules`). Requires a development build; on web/Expo Go the TS bridge resolves to `null` and hooks report `unavailable`.

| Function | Android API |
| :--- | :--- |
| `getSocInfo()` | `Build.SOC_MODEL`, `SDK_INT_FULL`, security patch |
| `hasSystemFeature(name)`, `getPackageVersion(pkg)` | `PackageManager` (+ `<queries>` for AICore/PCS) |
| `getCpuInfo()`, `getCpuLoad()` | `/proc/cpuinfo`, cpufreq sysfs, `Process.getElapsedCpuTime` |
| `getMemoryInfo()`, `requestGc()` | `ActivityManager.MemoryInfo`, `Runtime`, `Debug` |
| `getThermal()` + `onThermalStatus` event | `PowerManager` thermal APIs, `SystemHealthManager` (16+) |
| `getDisplayInfo()`, `setPreferredRefreshRate(hz)` | `Display` modes/HDR/ARR, `WindowManager.LayoutParams.preferredRefreshRate` |
| `getGpuInfo()` + `onFrameStats` event | EGL/GLES query, Vulkan feature version, `Choreographer` |
| `getTorchInfo()`, `setTorch(on, level?)` + `onTorchState` | `CameraManager.setTorchMode`, `turnOnTorchWithStrengthLevel` (13+) |
| `getHapticsInfo()`, `playEnvelope(points)`, `playPrimitives(steps)`, `cancelVibration()` | `Vibrator`, `VibrationEffect.BasicEnvelopeBuilder` (16+), `Composition` |

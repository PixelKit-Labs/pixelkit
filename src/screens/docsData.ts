/**
 * @file docsData.ts
 * @description Content for the in-app Docs tab, kept apart from its presentation.
 *
 * Every entry documents one exported hook: what it is for in plain language, how it works
 * underneath, the arguments it takes, the values it returns, and the functions it gives you.
 * Each function carries its own contract too: `inputs` describes every argument with its default
 * and units, and `output` says what the call resolves to and what a failure looks like.
 * Field names and types are copied from the hook's actual return object, so this file is the
 * documentation contract. If a hook's surface changes, this file changes with it.
 */

import { Colors } from '../theme/colors';

/** One documented value: a return field, a hook argument, or a callable. */
export interface DocField {
  name: string;
  /** TypeScript type as the hook really declares it. */
  type: string;
  /** One sentence on what it means and when it matters. */
  desc: string;
  /** For a callable: every argument it accepts, with its default and units. */
  inputs?: DocField[];
  /** For a callable: what it resolves to, and what a failure looks like. */
  output?: string;
}

export interface DocModule {
  id: string;
  name: string;
  category: 'silicon' | 'pro' | 'ai' | 'sensors' | 'radios' | 'system';
  /** Hardware or service this maps onto. */
  chipBadge: string;
  badgeColor: string;
  /** One line shown before the card is opened. */
  summary: string;
  /** What the hook is for, in plain language. */
  plain: string;
  /** How it works: the APIs underneath and the limits that follow from them. */
  description: string;
  signature: string;
  /** Arguments the hook accepts. */
  params: DocField[];
  /** Values it returns. */
  returns: DocField[];
  /** Functions it returns. */
  actions: DocField[];
  example: string;
  /** Guidance for a coding agent working against this hook. */
  agentNote: string;
}

const SILICON = '#B794FF';
const PRO = Colors.dark.tensorGlow;
const AI = Colors.dark.tensorGlow;
const SENSOR = Colors.dark.primary;
const RADIO = Colors.dark.success;
const SYSTEM = Colors.dark.warning;

/** Returned by every hardware-backed hook; documented once and referenced everywhere. */
const SOURCE_FIELD: DocField = {
  name: 'source',
  type: "'hardware' | 'derived' | 'unavailable'",
  desc: "Where the numbers came from. There is no 'simulated' value: a reading is real, derived from real readings, or unavailable.",
};

export const DOC_MODULES: DocModule[] = [
  // ─────────────────────────────── Silicon & compute ───────────────────────────────
  {
    id: 'useCPU',
    name: 'useCPU',
    category: 'silicon',
    chipBadge: 'Tensor G6 · /proc/cpuinfo + cpufreq',
    badgeColor: SILICON,
    summary: 'What the CPU is and how hard it is working right now.',
    plain:
      'Tells you the shape of the processor (how many cores, which type, how fast each one can go) and how busy it is at this instant. Use it to decide whether the phone has room for heavy work, or to show a live performance readout.',
    description:
      'Core identity comes from /proc/cpuinfo and per-core frequencies from the cpufreq sysfs tree, both read through the PixelNative module. Two different load signals are reported and they mean different things: cpuLoadPercent is how close the cores are running to their maximum clock, read from hardware; appCpuPercent is this app\'s own share of CPU time, computed from process time over wall time. Android does not let apps read system-wide /proc/stat, so a true "system load" figure does not exist here and is not invented.',
    signature: 'useCPU(): CPUState',
    params: [],
    returns: [
      { name: 'coreTopology', type: 'string', desc: 'Readable summary of the clusters, for example "1x Arm C1-Ultra @ 4.11 GHz + 4x Arm C1-Pro @ 3.38 GHz".' },
      { name: 'coreCount', type: 'number', desc: 'Cores visible to this process. Seven on the Tensor G6.' },
      { name: 'cpuLoadPercent', type: 'number | null', desc: 'How close the cores are to their maximum clock, averaged. Null when the sysfs files cannot be read.' },
      { name: 'appCpuPercent', type: 'number | null', desc: "This app's own CPU usage. Null on the very first sample because it needs two readings." },
      { name: 'cores', type: '{ index, part, name, curMHz, maxMHz, minMHz }[]', desc: 'Per-core detail, including the frequency each core is running at right now.' },
      { name: 'clusters', type: '{ part, name, maxMHz, count }[]', desc: 'Cores grouped by type, which is how you tell the big cores from the efficiency ones.' },
      { name: 'governorMode', type: 'string', desc: 'Kernel scheduling policy for cpu0, "sched_pixel" on this device. Read-only without root.' },
      { name: 'lastBenchmarkDurationMs', type: 'number | null', desc: 'Milliseconds the last benchmark took. Null until you run one.' },
      { name: 'isBenchmarking', type: 'boolean', desc: 'True while the benchmark is running, so you can disable the button.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'benchmarkCPU()',
        type: '() => Promise<number>',
        desc: 'Runs a real single-threaded prime sieve on the JS thread. It measures Hermes single-thread throughput, not the system, and blocks the UI while it runs.',
        output: 'Resolves with the run duration in milliseconds, which is also written to lastBenchmarkDurationMs. Lower is faster.',
      },
    ],
    example: `import { useCPU } from './src';

function CPUWidget() {
  const { coreTopology, cpuLoadPercent, cores, benchmarkCPU } = useCPU();
  return (
    <View>
      <Text>{coreTopology}</Text>
      <Text>{cpuLoadPercent ?? '—'}% · {cores.map(c => c.curMHz).join('/')} MHz</Text>
      <Button title="Run benchmark" onPress={() => benchmarkCPU()} />
    </View>
  );
}`,
    agentNote:
      'Values are null until the native module answers; never substitute a default. cpuLoadPercent is frequency utilisation, not scheduler load, so do not label it "CPU usage".',
  },
  {
    id: 'useGPU',
    name: 'useGPU',
    category: 'silicon',
    chipBadge: 'PowerVR CXTP-48-1536 · Vulkan 1.4',
    badgeColor: SILICON,
    summary: 'Which GPU this is, and whether your frames are arriving on time.',
    plain:
      'Identifies the graphics chip and measures how smoothly the interface is drawing. If animations feel rough, this tells you whether frames are actually being missed and by how much.',
    description:
      'The renderer, vendor and OpenGL version are read through a real offscreen EGL context; the Vulkan version comes from the android.hardware.vulkan.version system feature. Frame timing is measured on the UI thread with Choreographer in one-second windows: average and worst frame interval, frames presented per second, and a jank count for frames that took more than 1.5x the expected interval. Android does not expose GPU memory usage to apps, so that field is always null rather than estimated.',
    signature: 'useGPU(): GPUState',
    params: [],
    returns: [
      { name: 'gpuRenderer', type: 'string | null', desc: 'GPU name from the driver. Null until the EGL context has been created.' },
      { name: 'gpuVendor', type: 'string | null', desc: 'Driver vendor string.' },
      { name: 'graphicsApi', type: 'string | null', desc: 'OpenGL ES version and, where present, the Vulkan version.' },
      { name: 'frameRenderTimeMs', type: 'number | null', desc: 'Average gap between presented frames over the last second. Compare against targetBudgetMs.' },
      { name: 'maxFrameMs', type: 'number | null', desc: 'Worst single frame in that window, which is what a user actually perceives as a stutter.' },
      { name: 'measuredFps', type: 'number | null', desc: 'Frames actually presented per second, not the display mode.' },
      { name: 'droppedFrameCount', type: 'number', desc: 'Running total of janky frames since the hook mounted.' },
      { name: 'jankFramesLastSecond', type: 'number', desc: 'Janky frames in the most recent window only.' },
      { name: 'targetBudgetMs', type: 'number', desc: 'Time available per frame at the current refresh rate: 8.33 ms at 120 Hz, 16.67 ms at 60 Hz.' },
      { name: 'isStuttering', type: 'boolean', desc: 'True when the average frame is running more than 1.5x over budget.' },
      { name: 'gpuMemoryUsageMB', type: 'null', desc: 'Always null. Android does not expose this to apps.' },
      SOURCE_FIELD,
    ],
    actions: [],
    example: `import { useGPU } from './src';

function GPUHUD() {
  const { measuredFps, frameRenderTimeMs, targetBudgetMs, isStuttering } = useGPU();
  return (
    <Text style={{ color: isStuttering ? '#F25C55' : '#46D786' }}>
      {measuredFps ?? '—'} FPS · {frameRenderTimeMs ?? '—'} / {targetBudgetMs} ms
    </Text>
  );
}`,
    agentNote:
      'Check isStuttering before adding animation work. Frame timing measures the UI thread, so heavy JS shows up here even when the GPU is idle.',
  },
  {
    id: 'useTPU',
    name: 'useTPU',
    category: 'silicon',
    chipBadge: 'AICore · Gemini Nano host',
    badgeColor: AI,
    summary: 'Whether the on-device AI stack is installed and usable.',
    plain:
      'Answers one question: can this phone run AI locally? It checks that the system services which host on-device models are present, and reports their versions. It does not run inference itself.',
    description:
      "The Tensor TPU is only reachable through AICore (Gemini Nano, via ML Kit) or LiteRT, so this hook reports what is verifiably installed rather than guessing at hardware. AICore and Private Compute Services versions come from PackageManager, which needs a <queries> entry to see them at all. Inference timings deliberately stay null here; real measured latency lives in useGeminiNano. benchmarkTPU runs a genuine matrix multiplication on the JS thread and is labelled CPU fallback, because that is what it is.",
    signature: 'useTPU(): TPUState',
    params: [],
    returns: [
      { name: 'aicoreInstalled', type: 'boolean', desc: 'Whether AICore, the system service that hosts Gemini Nano, is present.' },
      { name: 'aicoreVersion', type: 'string | null', desc: 'Installed AICore build. Useful when a model feature depends on a minimum version.' },
      { name: 'privateComputeServicesVersion', type: 'string | null', desc: 'Version of the service that delivers model weights privately.' },
      { name: 'hasNpuFeature', type: 'boolean | null', desc: 'Whether the device declares a neural processing unit feature. False on this Pixel, which does not declare it.' },
      { name: 'activeDelegate', type: "'Tensor TPU' | 'NPU' | 'GPU' | 'CPU Fallback'", desc: 'What last executed work from this hook. Only ever CPU fallback, because the benchmark is JS.' },
      { name: 'isHardwareAccelerated', type: 'boolean', desc: 'Always false here. This hook runs nothing on the TPU.' },
      { name: 'lastInferenceLatencyMs', type: 'number | null', desc: 'Always null by design. Use useGeminiNano for real on-device latency.' },
      { name: 'cpuFallbackLatencyMs', type: 'number | null', desc: 'Duration of the last JS matrix multiplication, in milliseconds.' },
      { name: 'isBenchmarking', type: 'boolean', desc: 'True while the fallback benchmark runs.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'benchmarkTPU()',
        type: '() => Promise<TPUAcceleration>',
        desc: 'Runs a 256x256 float matrix multiply in JavaScript and reports it explicitly as a CPU fallback. No part of it touches the TPU.',
        output: 'Resolves with { activeDelegate: "CPU Fallback", isHardwareAccelerated: false, lastInferenceLatencyMs, throughputTokensPerSec: null, memoryFootprintMB: null }. Label it as a CPU number wherever you show it.',
      },
    ],
    example: `import { useTPU } from './src';

function AIStack() {
  const { aicoreInstalled, aicoreVersion, cpuFallbackLatencyMs, benchmarkTPU } = useTPU();
  return (
    <View>
      <Text>AICore: {aicoreInstalled ? aicoreVersion : 'not installed'}</Text>
      <Text>CPU matmul: {cpuFallbackLatencyMs ?? '—'} ms</Text>
      <Button title="Run CPU fallback benchmark" onPress={() => benchmarkTPU()} />
    </View>
  );
}`,
    agentNote:
      'Check aicoreInstalled before offering on-device AI. Never present cpuFallbackLatencyMs as TPU performance; it is a JavaScript number.',
  },
  {
    id: 'useMemory',
    name: 'useMemory',
    category: 'silicon',
    chipBadge: 'ActivityManager · 12 GB LPDDR5X',
    badgeColor: SILICON,
    summary: 'System RAM, this app\'s heaps, and how close the system is to killing you.',
    plain:
      'Shows how much memory the phone has left and how much this app is holding. The important field is isLowMemory: when it turns true, Android is close to killing background apps and you should release caches.',
    description:
      "System totals come from ActivityManager.getMemoryInfo, polled every two seconds: total RAM, available RAM, the low-memory threshold and the kernel's own low-memory flag. App figures come from Runtime for the Java heap and Debug.getNativeHeapAllocatedSize for the native heap, which is where Hermes, decoded images and JSI allocations live. purgeCaches requests a garbage collection and re-reads; it does not claim to free system RAM, because an app cannot do that.",
    signature: 'useMemory(): MemoryState',
    params: [],
    returns: [
      { name: 'totalRAMMB', type: 'number', desc: 'Physical RAM the system reports, about 11,647 MB on a 12 GB device.' },
      { name: 'freeRAMMB', type: 'number', desc: 'Memory currently available to start new work.' },
      { name: 'usedRAMMB', type: 'number', desc: 'Total minus available. Includes reclaimable caches, so it reads higher than you might expect.' },
      { name: 'isLowMemory', type: 'boolean', desc: 'Kernel low-memory flag. When true, free buffers now.' },
      { name: 'lowMemoryThresholdMB', type: 'number', desc: 'The level at which the system starts killing background processes.' },
      { name: 'appJavaHeapMB', type: 'number', desc: "This app's Java heap in use." },
      { name: 'appJavaHeapMaxMB', type: 'number', desc: 'Ceiling for that heap. Crossing it throws OutOfMemoryError.' },
      { name: 'appNativeHeapMB', type: 'number', desc: 'Native allocations: the JS engine, decoded bitmaps, native modules.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'purgeCaches()',
        type: '() => void',
        desc: 'Requests a garbage collection and re-reads the numbers. Advisory only; the runtime decides when to collect, and it can never free system RAM.',
        output: 'Returns nothing. The refreshed reading lands in the hook fields, and the amount reclaimed is logged as freedMB.',
      },
    ],
    example: `import { useMemory } from './src';

function MemoryHUD() {
  const { freeRAMMB, isLowMemory, purgeCaches } = useMemory();
  return (
    <View>
      <Text>Free: {freeRAMMB} MB</Text>
      {isLowMemory && <Button title="Purge caches" onPress={purgeCaches} />}
    </View>
  );
}`,
    agentNote:
      'React to isLowMemory by dropping image buffers before starting large multimodal payloads. Do not treat usedRAMMB as a leak signal; it includes reclaimable cache.',
  },
  {
    id: 'useADPF',
    name: 'useADPF',
    category: 'silicon',
    chipBadge: 'PowerManager · SystemHealth',
    badgeColor: SYSTEM,
    summary: 'How much thermal room is left before the phone slows itself down.',
    plain:
      'Warns you before the phone gets hot enough to throttle. Check thermalHeadroom before starting sustained work such as camera capture or a long inference run, and back off as it climbs toward 1.',
    description:
      'thermalHeadroom comes from PowerManager.getThermalHeadroom and is sampled every ten seconds, which is the cadence Google specifies; polling faster returns NaN. A live thermal-status listener reports the coarse state from NONE through SHUTDOWN. On Android 16 and above, SystemHealthManager can also report CPU and GPU headroom, which stays null when the device does not provide it. Frame figures pair the display mode refresh rate as a target with the Choreographer-measured rate as the actual.',
    signature: 'useADPF(): ADPFState',
    params: [],
    returns: [
      { name: 'thermalHeadroom', type: 'number | null', desc: '0 is cool, 1 means throttling is imminent. The single number to gate heavy work on.' },
      { name: 'thermalThresholds', type: 'Record<string, number> | null', desc: 'Headroom values at which this specific device enters each thermal status.' },
      { name: 'thermalStatus', type: "'nominal' | 'light' | 'moderate' | 'severe' | 'critical'", desc: 'Coarse state, updated by a system listener rather than polling.' },
      { name: 'thermalStatusCode', type: 'number', desc: 'Raw PowerManager constant behind that label.' },
      { name: 'cpuHeadroom', type: 'number | null', desc: 'Android 16+ remaining CPU capacity. Null when the device does not report it.' },
      { name: 'gpuHeadroom', type: 'number | null', desc: 'Same for the GPU.' },
      { name: 'targetFps', type: 'number | null', desc: 'Refresh rate of the current display mode.' },
      { name: 'currentFps', type: 'number | null', desc: 'Frames actually presented, measured by Choreographer.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'reportWorkDuration(actualMs, targetMs?)',
        type: "(actualWorkDurationMs: number, targetDurationMs?: number) => 'WITHIN_BUDGET' | 'BOOST_REQUESTED'",
        desc: 'Pure helper that judges a measured piece of work against the frame budget. It computes a verdict for your own scheduling; it does not call the platform performance hint system.',
        inputs: [
          { name: 'actualWorkDurationMs', type: 'number', desc: 'How long the work you just did actually took, in milliseconds.' },
          { name: 'targetDurationMs', type: 'number | undefined', desc: 'Budget to judge it against. Defaults to 1000 / targetFps, or 8.33 ms before the refresh rate has been read.' },
        ],
        output: "'WITHIN_BUDGET' when the work fits the frame, 'BOOST_REQUESTED' when it overran and you should shed work.",
      },
    ],
    example: `import { useADPF } from './src';

async function runHeavyTask(adpf) {
  if ((adpf.thermalHeadroom ?? 0) > 0.8) return 'deferred: device is hot';
  // ... start the work
}`,
    agentNote:
      'Gate sustained workloads on thermalHeadroom, not on thermalStatus alone; the number moves before the label does.',
  },

  // ─────────────────────────────── Pixel Pro exclusives ───────────────────────────────
  {
    id: 'useHiLight',
    name: 'useHiLight',
    category: 'pro',
    chipBadge: 'HiLight · 8 LEDs (Pro)',
    badgeColor: PRO,
    summary: 'The eight-LED ring around the rear camera flash. Real LEDs or nothing.',
    plain:
      'Controls the coloured lights around the rear camera. Useful as a glanceable signal when the phone is face down: a colour for an incoming call, a pulse while an assistant is thinking. Either it drives the physical LEDs or it reports that it cannot; there is no on-screen substitute.',
    description:
      'Android 17 exposes the array as eight lights of type Light.LIGHT_TYPE_APPLICATION, but every lights session needs CONTROL_DEVICE_LIGHTS, which is signature|privileged and cannot be held by a normal app. PixelKit therefore ships a small Java daemon that runs as the adb shell user and listens on 127.0.0.1:11080; start it with npm run hilight:daemon. With the daemon up, availability is hardware and the calls drive real LEDs. Without it, availability is simulated: the colour and pattern state is still tracked and mirrored on screen with haptics, and nothing pretends the lights are on.',
    signature: 'useHiLight(): HiLightState',
    params: [],
    returns: [
      { name: 'availability', type: "'hardware' | 'unavailable' | 'unsupported'", desc: "Whether calls reach the LEDs ('hardware'), the daemon is not running ('unavailable'), or this device has no array." },
      { name: 'isHardwareSupported', type: 'boolean', desc: 'Whether this device physically has the LED array.' },
      { name: 'isDaemonConnected', type: 'boolean', desc: 'Whether the local daemon answered its last status check, polled every five seconds.' },
      { name: 'isActive', type: 'boolean', desc: 'Whether the ring is currently lit.' },
      { name: 'currentColor', type: 'string', desc: 'Active colour as a hex string.' },
      { name: 'mode', type: 'HiLightMode', desc: "Pattern label: off, glow, breathing, pulse, gemini_thinking, incoming_call or notification." },
      { name: 'brightness', type: 'number', desc: '0 to 1. The hardware has no brightness channel, so this scales the RGB values.' },
      { name: 'isFaceDownMode', type: 'boolean', desc: 'Whether glanceable face-down behaviour is engaged.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'refreshDaemonStatus()',
        type: '() => Promise<boolean>',
        desc: 'Re-checks the daemon immediately instead of waiting for the next five-second poll.',
        output: 'Resolves true when the daemon answered, false otherwise. The same value lands in isDaemonConnected.',
      },
      {
        name: 'setColor(hex)',
        type: '(hexColor: string) => void',
        desc: 'Sets a solid colour and turns the ring on, switching the mode from off to glow when needed.',
        inputs: [{ name: 'hexColor', type: 'string', desc: 'RGB hex string such as "#81C995". Sent to the daemon as-is, scaled by brightness.' }],
        output: 'Returns nothing. Nothing lights unless availability is hardware.',
      },
      {
        name: 'setMode(mode)',
        type: '(mode: HiLightMode) => void',
        desc: 'Switches the animation pattern.',
        inputs: [{ name: 'mode', type: 'HiLightMode', desc: "One of off, glow, breathing, pulse, gemini_thinking, incoming_call, notification. Passing 'off' extinguishes the ring." }],
        output: 'Returns nothing; mode and isActive update immediately.',
      },
      {
        name: 'setBrightness(level)',
        type: '(level: number) => void',
        desc: 'Scales the RGB values sent to the LEDs. The hardware has no separate brightness channel.',
        inputs: [{ name: 'level', type: 'number', desc: '0.0 to 1.0; values outside are clamped.' }],
        output: 'Returns nothing. Applied immediately when the ring is lit, stored otherwise.',
      },
      {
        name: 'triggerGeminiPulse(ms?)',
        type: '(durationMs?: number) => void',
        desc: 'Cyan gemini_thinking hold that clears itself. Pair it with a model call.',
        inputs: [{ name: 'durationMs', type: 'number | undefined', desc: 'How long to hold before clearing, in milliseconds. Defaults to 4000.' }],
        output: 'Returns nothing. A pending timer from an earlier call is cancelled first.',
      },
      {
        name: 'triggerContactAlert(hex, ms?)',
        type: '(hexColor: string, durationMs?: number) => void',
        desc: 'Coloured incoming_call hold for a caller or event, then clears itself.',
        inputs: [
          { name: 'hexColor', type: 'string', desc: 'RGB hex for the alert colour.' },
          { name: 'durationMs', type: 'number | undefined', desc: 'Hold time in milliseconds. Defaults to 5000.' },
        ],
        output: 'Returns nothing. Replaces any hold already running.',
      },
      {
        name: 'turnOff()',
        type: '() => void',
        desc: 'Clears the ring and cancels any pending auto-off timer.',
        output: 'Returns nothing; mode becomes off and isActive false.',
      },
      {
        name: 'toggle()',
        type: '() => void',
        desc: 'Switches between off and a default blue glow.',
        output: 'Returns nothing; isActive flips.',
      },
    ],
    example: `import { useHiLight } from './src';

function StatusRing() {
  const hilight = useHiLight();
  return (
    <View>
      <Text>{hilight.availability} · {hilight.mode}</Text>
      <Button title="Thinking pulse" onPress={() => hilight.triggerGeminiPulse(4000)} />
    </View>
  );
}`,
    agentNote:
      "Read availability before promising light. Only 'hardware' drives the LEDs; 'unavailable' means the daemon is not running and the control functions refuse rather than pretending.",
  },
  {
    id: 'useUWB',
    name: 'useUWB',
    category: 'pro',
    chipBadge: 'Ultra-Wideband (Pro)',
    badgeColor: PRO,
    summary: 'Ultra-wideband radio state, hardware ranging sessions, and spatial diagnostics.',
    plain:
      'Reports whether this phone has the short-range precision radio used for precision spatial tracking and car keys, and manages hardware ranging sessions via UwbManager and RangingManager.',
    description:
      'Chip presence, enabled state, chip id and ranging service readiness are queried from Android UwbManager and PackageManager through the native module, carrying source hardware. Hardware ranging sessions are initiated via startRanging(), exposing session diagnostics (session ID, protocol status, HAL direct vs declared feature) without mock placeholders.',
    signature: 'useUWB(): UWBState',
    params: [],
    returns: [
      { name: 'isSupported', type: 'boolean', desc: 'Whether the UWB chip exists on this device.' },
      { name: 'isEnabled', type: 'boolean', desc: 'Whether the radio is switched on in system settings.' },
      { name: 'chipId', type: 'string | null', desc: 'Chip identifier the platform reports, "default" on this Pixel.' },
      { name: 'rangingApiSupported', type: 'boolean', desc: 'Whether the Android 16 RangingManager feature is declared. False on this unit.' },
      { name: 'isRanging', type: 'boolean', desc: 'Whether a ranging session is actively running.' },
      { name: 'sessionInfo', type: 'UwbRangingResult | null', desc: 'Hardware session diagnostics: status, serviceName, technology, and timestamp.' },
      { name: 'sessionError', type: 'string | null', desc: 'Error message if session creation or ranging fails.' },
      { name: 'activeTargets', type: 'UWBSpatialTarget[]', desc: 'Tracked responder anchors and devices with distance and angles.' },
      { name: 'isSupportedOnDevice', type: 'boolean', desc: 'Alias of isSupported kept for older call sites.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'startRanging(sessionId?)',
        type: '(sessionId?: number) => Promise<boolean>',
        desc: 'Initiates a hardware UWB ranging session through UwbManager and RangingManager.',
        inputs: [{ name: 'sessionId', type: 'number | undefined', desc: 'Identifier for the session, default 1001. Use distinct ids for concurrent sessions.' }],
        output: 'Resolves true when the session opened; false with the reason in sessionError when the service is missing or the hardware refused. Diagnostics land in sessionInfo either way.',
      },
      {
        name: 'stopRanging()',
        type: '() => void',
        desc: 'Ends the active UWB ranging session. Safe to call when nothing is running.',
        output: 'Returns nothing; isRanging becomes false.',
      },
    ],
    example: `import { useUWB } from './src';

function Radar() {
  const { isSupported, isRanging, sessionInfo, startRanging, stopRanging } = useUWB();
  if (!isSupported) return <Text>No UWB radio</Text>;
  return (
    <View>
      <Text>Session: {sessionInfo?.status ?? 'Inactive'}</Text>
      <Button
        title={isRanging ? 'Stop session' : 'Start hardware session'}
        onPress={() => isRanging ? stopRanging() : startRanging(1001)}
      />
    </View>
  );
}`,
    agentNote:
      'UWB chip status and sessions are backed by physical hardware. Note that this preview build declares android.hardware.uwb but not android.hardware.ranging.',
  },

  // ─────────────────────────────── Neural & AI ───────────────────────────────
  {
    id: 'useGeminiNano',
    name: 'useGeminiNano',
    category: 'ai',
    chipBadge: 'AICore · ML Kit Prompt API',
    badgeColor: AI,
    summary: 'Gemini Nano running on the phone, with no network and no API key.',
    plain:
      'Chat with a model that runs entirely on the device. Nothing leaves the phone and it works offline, but the model is small and the context is short. Check status first: the weights are managed by the system and may need downloading once.',
    description:
      'Wraps the ML Kit GenAI Prompt API on AICore through the pixel-nano module. The model is owned by the system, not bundled with the app, so checkStatus can report that a download is required; download reports progress as it runs. AICore keeps no conversation history, so each turn re-sends a capped transcript built by buildNanoTurn. Latency and time to first token are measured around the native call, and output token counts come from the on-device tokenizer, so the performance figures are real rather than estimated. There is no cloud fallback: if the model is unavailable, sendMessage appends an error entry.',
    signature: 'useGeminiNano(): GeminiNanoState',
    params: [],
    returns: [
      { name: 'status', type: "'available' | 'downloadable' | 'downloading' | 'unavailable'", desc: 'Model readiness. Gate every call on this.' },
      { name: 'isAvailable', type: 'boolean', desc: 'Convenience for status === "available".' },
      { name: 'info', type: 'NanoModelInfo | null', desc: 'Base model name, token limit, and which features this build supports (system prompt, thinking mode, structured output, caching).' },
      { name: 'messages', type: 'AIMessage[]', desc: 'Conversation so far. Entries with role system are local errors, not model output.' },
      { name: 'partial', type: 'string', desc: 'Text streamed so far for the in-flight reply. Render this for a live typing effect.' },
      { name: 'thoughts', type: 'string[]', desc: 'Reasoning steps when thinking mode is enabled and supported.' },
      { name: 'isGenerating', type: 'boolean', desc: 'True while a reply is being produced.' },
      { name: 'downloadedBytes', type: 'number | null', desc: 'Progress while the model downloads.' },
      { name: 'isDownloading', type: 'boolean', desc: 'True during download.' },
      { name: 'warmupMs', type: 'number | null', desc: 'How long the last warm-up took to load the model into memory.' },
      { name: 'lastLatencyMs', type: 'number | null', desc: 'Wall time of the last call, measured natively.' },
      { name: 'lastFirstTokenMs', type: 'number | null', desc: 'Time to the first streamed token, which is what perceived responsiveness depends on.' },
      { name: 'lastOutputTokens', type: 'number | null', desc: 'Tokens produced, counted by the on-device tokenizer.' },
      { name: 'lastDecodeTokensPerSec', type: 'number | null', desc: 'Generation speed after the first token. Derived from the two figures above.' },
      { name: 'error', type: 'string | null', desc: 'Last failure message, for example a busy model or a request over the token limit.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'download()',
        type: '() => Promise<NanoStatus>',
        desc: 'Asks AICore to fetch the model weights.',
        output: 'Resolves with the status after the attempt, or "unavailable" when it failed. Progress arrives in downloadedBytes while it runs.',
      },
      {
        name: 'warmup()',
        type: '() => Promise<number | null>',
        desc: 'Loads the model into AICore ahead of the first prompt so the first reply is not slow.',
        output: 'Resolves with the wall time in milliseconds, or null when the warm-up failed. The same value lands in warmupMs.',
      },
      {
        name: 'sendMessage(text)',
        type: '(prompt: string) => Promise<void>',
        desc: 'Sends a chat turn with streaming, appending both the question and the reply to messages.',
        inputs: [{ name: 'prompt', type: 'string', desc: "The user's turn. Blank or whitespace-only input is ignored." }],
        output: 'Resolves when the reply is complete. Tokens accumulate in partial while it streams; failures arrive as a system-role entry in messages, never as a rejection.',
      },
      {
        name: 'generate(prompt, options?)',
        type: '(prompt: string, options?: NanoOptions) => Promise<NanoResult>',
        desc: 'One-shot generation outside the conversation, with optional per-call parameters.',
        inputs: [
          { name: 'prompt', type: 'string', desc: 'The complete prompt; no history is added.' },
          { name: 'options', type: 'NanoOptions | undefined', desc: 'Per-call overrides: systemInstruction, temperature, topK, candidateCount, maxOutputTokens, seed, thinking, imageBase64 for a multimodal turn.' },
        ],
        output: 'Resolves with { text, finishReason, thoughts, latencyMs, firstTokenMs }. Throws E_NANO_* on failure; there is no fallback.',
      },
      {
        name: 'countTokens(prompt, options?)',
        type: '(prompt: string, options?: NanoOptions) => Promise<number | null>',
        desc: 'Measures a prompt with the on-device tokenizer before sending it.',
        inputs: [
          { name: 'prompt', type: 'string', desc: 'Text exactly as it would be sent.' },
          { name: 'options', type: 'NanoOptions | undefined', desc: 'The same options the real call would use, since they affect the count.' },
        ],
        output: 'Resolves with the token count, or null when the tokenizer is unavailable. Compare it against info.tokenLimit.',
      },
      {
        name: 'clearMessages()',
        type: '() => void',
        desc: 'Empties the conversation and the thinking output.',
        output: 'Returns nothing. AICore keeps no history of its own, so this is the whole reset.',
      },
      {
        name: 'setModelConfig(stage, preference)',
        type: "(stage: 'stable' | 'preview', preference: 'full' | 'fast') => Promise<void>",
        desc: 'Chooses the model track AICore serves. The next call creates a new client.',
        inputs: [
          { name: 'stage', type: "'stable' | 'preview'", desc: 'Production build or the Developer Preview track. Preview models are slower and refuse more often.' },
          { name: 'preference', type: "'full' | 'fast'", desc: 'Full favours quality, fast favours latency.' },
        ],
        output: 'Resolves once the config is applied and status and info have been re-read.',
      },
      {
        name: 'refresh()',
        type: '() => Promise<void>',
        desc: 'Re-reads status and model facts from AICore.',
        output: 'Resolves once status and info have been updated. On failure status becomes unavailable and error is set.',
      },
    ],
    example: `import { useGeminiNano } from './src';

function OnDeviceChat() {
  const nano = useGeminiNano();
  if (nano.status === 'downloadable') return <Button title="Download model" onPress={() => nano.download()} />;
  return (
    <View>
      <Button title="Ask" onPress={() => nano.sendMessage('Summarise the thermal state')} disabled={!nano.isAvailable} />
      <Text>{nano.partial || nano.messages.at(-1)?.content}</Text>
      <Text>{nano.lastLatencyMs ?? '—'} ms · {nano.lastDecodeTokensPerSec ?? '—'} tok/s</Text>
    </View>
  );
}`,
    agentNote:
      'Always branch on status before calling. The model is foreground-only and single-turn, so keep the transcript short and send long or background work to the cloud hook.',
  },
  {
    id: 'useGemini',
    name: 'useGemini',
    category: 'ai',
    chipBadge: 'gemini-3.8-flash · ai.chats',
    badgeColor: AI,
    summary: 'Cloud Gemini chat with real multi-turn history.',
    plain:
      'Talks to the full Gemini model over the network. Much more capable than the on-device model, but it needs an API key and a connection. Replies carry real token counts and timings from the API.',
    description:
      'Wraps ai.chats.create from @google/genai on gemini-3.8-flash with a system instruction, so history is maintained by the SDK rather than re-sent by hand. Token counts come from the response usageMetadata and latency is measured around the call. There is no simulated fallback: without a key, sendMessage appends a system-role message explaining how to configure one. The key is read from SecureStore, never from source.',
    signature: 'useGemini(): GeminiState',
    params: [],
    returns: [
      { name: 'messages', type: 'AIMessage[]', desc: 'Conversation so far. Role system means a local error, not model output.' },
      { name: 'isLoading', type: 'boolean', desc: 'True while a reply is in flight.' },
      { name: 'hasApiKey', type: 'boolean', desc: 'Whether a key is configured. Check this before offering cloud features.' },
      { name: 'model', type: 'string', desc: 'Model id in use, gemini-3.8-flash.' },
    ],
    actions: [
      {
        name: 'sendMessage(prompt)',
        type: '(prompt: string) => Promise<void>',
        desc: 'Sends a turn and appends the reply with its latency and token count.',
        inputs: [{ name: 'prompt', type: 'string', desc: "The user's turn. Blank input is ignored." }],
        output: 'Resolves when the reply arrives. Without an API key it appends a system-role message explaining that instead; API errors arrive the same way rather than as a rejection.',
      },
      {
        name: 'clearMessages()',
        type: '() => void',
        desc: 'Clears the history and resets the chat session, so the next turn starts with no context.',
        output: 'Returns nothing.',
      },
      {
        name: 'setApiKey(key)',
        type: '(key: string | null) => void',
        desc: 'Swaps the key in memory and resets the chat session.',
        inputs: [{ name: 'key', type: 'string | null', desc: "The Gemini API key, or null to clear it. Persisting it is the job of saveApiKey()." }],
        output: 'Returns nothing. hasApiKey updates immediately and availableModels is refreshed in the background.',
      },
    ],
    example: `import { useGemini } from './src';

function Assistant() {
  const { messages, sendMessage, isLoading, hasApiKey } = useGemini();
  if (!hasApiKey) return <Text>Configure a Gemini API key first</Text>;
  return <Button title="Ask" onPress={() => sendMessage('Analyse current telemetry')} disabled={isLoading} />;
}`,
    agentNote:
      'Keys come from saveApiKey and live in SecureStore. Never hardcode one, and never fabricate a reply when the key is missing.',
  },
  {
    id: 'useSpeechAI',
    name: 'useSpeechAI',
    category: 'ai',
    chipBadge: 'Offline ASI · Gemini audio',
    badgeColor: AI,
    summary: 'Turning speech into text, on the device or in the cloud.',
    plain:
      'Records the user talking and returns what they said. It can work offline using the phone\'s own recogniser, or send the clip to Gemini for higher accuracy. Offline is faster and private; cloud handles harder audio.',
    description:
      'Capture runs through useAudio at 16 kHz mono on the voice_recognition source, which is the path that applies the platform noise suppression. In offline mode the native module drives Android System Intelligence streaming recognition and emits partial results as the user speaks. In cloud mode the finished clip is sent to Gemini audio understanding. Neither path fabricates a transcript: without a key, cloud mode keeps the recording and returns an error.',
    signature: 'useSpeechAI(): SpeechState',
    params: [],
    returns: [
      { name: 'isListening', type: 'boolean', desc: 'True while the microphone is capturing.' },
      { name: 'isTranscribing', type: 'boolean', desc: 'True while audio is being converted to text.' },
      { name: 'recognitionMode', type: "'offline' | 'cloud'", desc: 'Which engine will handle the next transcription.' },
      { name: 'isOfflineAvailable', type: 'boolean', desc: 'Whether on-device recognition is installed for the current language.' },
      { name: 'streamingPartial', type: 'string', desc: 'Live text as the user is still speaking, offline mode only.' },
      { name: 'voiceDecibels', type: 'number', desc: 'Current input level, for a meter or a speaking indicator.' },
      { name: 'lastTranscript', type: 'SpeechTranscriptionResult | null', desc: 'Final text with confidence, audio duration and latency.' },
      { name: 'lastRecordingUri', type: 'string | null', desc: 'File of the last capture, kept even when transcription fails.' },
      { name: 'error', type: 'string | null', desc: 'Why the last attempt failed.' },
      { name: 'model', type: 'string', desc: 'Engine used for the last cloud transcription.' },
    ],
    actions: [
      {
        name: 'startListening()',
        type: '() => Promise<boolean>',
        desc: 'Opens the microphone using the current recognitionMode: the on-device recognizer, or a recording for cloud transcription.',
        output: 'Resolves true when the microphone opened, false with the reason in error when permission was denied or the recognizer refused.',
      },
      {
        name: 'stopListeningAndTranscribe()',
        type: '() => Promise<SpeechTranscriptionResult | null>',
        desc: 'Closes the microphone and returns what was heard.',
        output: 'Resolves with { transcript, confidence, durationSeconds, latencyMs, language } — confidence is null for cloud transcripts — or null when nothing was captured or transcription failed. In cloud mode the audio file is kept in lastRecordingUri either way.',
      },
      {
        name: 'setRecognitionMode(mode)',
        type: "(mode: 'on-device' | 'cloud') => void",
        desc: 'Chooses the engine for the next run.',
        inputs: [{ name: 'mode', type: "'on-device' | 'cloud'", desc: 'On-device keeps audio on the phone and streams partials; cloud records first and needs an API key.' }],
        output: 'Returns nothing. model updates to name the engine that will be used.',
      },
    ],
    example: `import { useSpeechAI } from './src';

function VoiceButton() {
  const speech = useSpeechAI();
  const toggle = async () => {
    if (speech.isListening) {
      const result = await speech.stopListeningAndTranscribe();
      console.log(result?.transcript);
    } else {
      await speech.startListening();
    }
  };
  return <Button title={speech.isListening ? 'Stop' : 'Speak'} onPress={toggle} />;
}`,
    agentNote:
      'Prefer offline mode when isOfflineAvailable is true: it is lower latency and keeps audio on the device. Show streamingPartial so the user knows they are being heard.',
  },
  {
    id: 'useGenAITasks',
    name: 'useGenAITasks',
    category: 'ai',
    chipBadge: 'ML Kit GenAI · on-device',
    badgeColor: AI,
    summary: 'Four focused text tasks that run locally: summarise, proofread, rewrite, describe.',
    plain:
      'Purpose-built text helpers that run on the phone. Each does one job well and is faster and more reliable than prompting a general model for the same thing. No network, no key.',
    description:
      'Wraps the ML Kit GenAI task modules on AICore through pixel-nano: genai-summarization, genai-proofreading and genai-rewriting, plus image description. Because each task ships a tuned model rather than a free-form prompt, the output is more consistent than asking a chat model, and it works on more devices. Every call reports its own measured latency and the engine that served it.',
    signature: 'useGenAITasks(): GenAITasksState',
    params: [],
    returns: [
      { name: 'isRunning', type: 'boolean', desc: 'True while any task is executing.' },
      { name: 'summaryResult', type: 'SummarizeResult | null', desc: 'Bullet summary with latency and engine name.' },
      { name: 'proofreadResult', type: 'ProofreadResult | null', desc: 'Corrected text plus the individual suggestions.' },
      { name: 'rewriteResult', type: 'RewriteResult | null', desc: 'Rewritten text in the requested tone.' },
      { name: 'imageDescriptionResult', type: 'ImageDescriptionResult | null', desc: 'Generated description of a supplied image.' },
      { name: 'error', type: 'string | null', desc: 'Why the last task failed, for example the model not being downloaded.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'summarize(text, options?)',
        type: '(text: string, options?: SummarizeOptions) => Promise<SummarizeResult | null>',
        desc: 'Condenses an article or a conversation on-device. Nothing leaves the phone.',
        inputs: [
          { name: 'text', type: 'string', desc: 'The article or transcript to condense.' },
          { name: 'options', type: 'SummarizeOptions | undefined', desc: "inputType: 'article' or 'conversation' tells the model how to read it; outputType: 'one_bullet', 'two_bullets' or 'three_bullets' sets the length." },
        ],
        output: 'Resolves with { summary, latencyMs, engine, source }, or null on failure with the reason in error.',
      },
      {
        name: 'proofread(text)',
        type: '(text: string) => Promise<ProofreadResult | null>',
        desc: 'Fixes grammar, punctuation and wording. Good for cleaning up dictated text.',
        inputs: [{ name: 'text', type: 'string', desc: 'The text to correct.' }],
        output: 'Resolves with { correctedText, suggestions, latencyMs, engine, source } — suggestions lists the individual changes — or null on failure.',
      },
      {
        name: 'rewrite(text, tone?)',
        type: "(text: string, tone?: TaskTone) => Promise<RewriteResult | null>",
        desc: 'Rewrites text in a different tone or length while keeping the meaning.',
        inputs: [
          { name: 'text', type: 'string', desc: 'The text to transform.' },
          { name: 'tone', type: 'TaskTone | undefined', desc: "One of elaborate, emojify, shorten, friendly, professional, rephrase. Defaults to professional." },
        ],
        output: 'Resolves with { rewrittenText, suggestions, latencyMs, engine, source }, or null on failure.',
      },
      {
        name: 'describeImage(input, style?)',
        type: "(imageInput: string, style?: 'detailed' | 'caption' | 'labels' | 'concise') => Promise<ImageDescriptionResult | null>",
        desc: 'Describes an image locally. Useful for alt text without a network round-trip.',
        inputs: [
          { name: 'imageInput', type: 'string', desc: 'A file URI or a base64 image.' },
          { name: 'style', type: 'string | undefined', desc: 'detailed, caption, labels or concise. Defaults to concise.' },
        ],
        output: 'Resolves with { description, finishReason, latencyMs, engine, source }, or null on failure.',
      },
    ],
    example: `import { useGenAITasks } from './src';

async function tidy(dictated: string, tasks) {
  const fixed = await tasks.proofread(dictated);
  const short = await tasks.summarize(fixed.correctedText, { outputType: 'two_bullets' });
  return short.summary;
}`,
    agentNote:
      'Reach for these before prompting a chat model for the same job: they are faster, run offline and give steadier output. Handle the model-not-downloaded error.',
  },
  {
    id: 'useNaturalLanguageAI',
    name: 'useNaturalLanguageAI',
    category: 'ai',
    chipBadge: 'ML Kit NLP · 58 languages',
    badgeColor: AI,
    summary: 'Translation, language detection, smart replies and entity extraction, all offline.',
    plain:
      'Language tools that work without a connection: translate between 58 languages, work out what language some text is in, suggest replies to a conversation, and pull out things like dates, addresses and tracking numbers.',
    description:
      'Wraps the ML Kit language stack through pixel-nano: language-id, translate, smart-reply and entity-extraction. Translation models download per language pair on first use and then run entirely offline, which is why the first call for a new pair is slower. Smart reply takes a short conversation history and proposes replies. Entity extraction returns typed spans with their positions in the original string.',
    signature: 'useNaturalLanguageAI(): NaturalLanguageState',
    params: [],
    returns: [
      { name: 'isProcessing', type: 'boolean', desc: 'True while any language operation runs.' },
      { name: 'languageResult', type: 'LanguageIdResult | null', desc: 'Detected BCP-47 code plus alternatives with confidence scores.' },
      { name: 'translationResult', type: 'TranslationResult | null', desc: 'Translated text with the source and target languages.' },
      { name: 'smartReplyResult', type: 'SmartReplyResult | null', desc: 'Suggested replies for the supplied conversation.' },
      { name: 'entityResult', type: 'EntityExtractionResult | null', desc: 'Typed entities with their start and end offsets.' },
      { name: 'error', type: 'string | null', desc: 'Why the last operation failed.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'identifyLanguage(text)',
        type: '(text: string) => Promise<LanguageIdResult | null>',
        desc: 'Detects the language of a sample. Run it before translating when the source is unknown.',
        inputs: [{ name: 'text', type: 'string', desc: 'A sample; a few words is usually enough.' }],
        output: 'Resolves with { languageCode, possibleLanguages, latencyMs, source } — languageCode is null when nothing was confident enough — or null on failure.',
      },
      {
        name: 'translate(text, from?, to?)',
        type: '(text: string, sourceLang?: string, targetLang?: string) => Promise<TranslationResult | null>',
        desc: 'Translates offline. The first call for a language pair downloads that model, so it is slower than the ones after it.',
        inputs: [
          { name: 'text', type: 'string', desc: 'The text to translate.' },
          { name: 'sourceLang', type: 'string | undefined', desc: "BCP-47 language code of the input. Defaults to 'en'." },
          { name: 'targetLang', type: 'string | undefined', desc: "BCP-47 language code to translate into. Defaults to 'es'." },
        ],
        output: 'Resolves with { translatedText, sourceLanguage, targetLanguage, latencyMs, source }, or null on failure.',
      },
      {
        name: 'suggestReplies(history)',
        type: '(history: { text: string; timestamp?: number; isLocalUser?: boolean; sender?: string }[]) => Promise<SmartReplyResult | null>',
        desc: 'Proposes short replies for the end of a conversation.',
        inputs: [{ name: 'history', type: 'Array<{ text, timestamp?, isLocalUser?, sender? }>', desc: "Messages in order. isLocalUser marks this user's own messages, so the model replies to the other party." }],
        output: 'Resolves with { suggestions, status, latencyMs, source }. suggestions is empty when the model has nothing confident to offer; null on failure.',
      },
      {
        name: 'extractEntities(text)',
        type: '(text: string) => Promise<EntityExtractionResult | null>',
        desc: 'Finds dates, addresses, money, phone numbers, flight numbers and tracking codes.',
        inputs: [{ name: 'text', type: 'string', desc: 'The text to scan.' }],
        output: 'Resolves with { entities, latencyMs, source }; each entity carries type, text and the start and end offsets into your input. Null on failure.',
      },
    ],
    example: `import { useNaturalLanguageAI } from './src';

async function localise(text: string, nlp) {
  const { languageCode } = await nlp.identifyLanguage(text);
  if (!languageCode || languageCode === 'en') return text;
  const out = await nlp.translate(text, languageCode, 'en');
  return out.translatedText;
}`,
    agentNote:
      'Warn the user that a first translation for a new language pair downloads a model. Do not assume identifyLanguage succeeds; languageCode can be null for very short input.',
  },
  {
    id: 'useVisionAI',
    name: 'useVisionAI',
    category: 'ai',
    chipBadge: 'ML Kit Vision + Gemini multimodal',
    badgeColor: AI,
    summary: 'Nine on-device vision capabilities, plus cloud scene understanding.',
    plain:
      'Everything image-related in one hook. Locally it can read text, scan barcodes, find faces and poses, label objects and cut out the subject. For open-ended questions about a picture it can also send the image to Gemini.',
    description:
      'The on-device half wraps the ML Kit vision models through pixel-nano and runs without a network: barcode scanning, text recognition v2, face detection with landmarks and head angles, 468-point face mesh, image labelling, object detection with tracking, 33-point pose detection, selfie and subject segmentation, and digital ink recognition. The cloud half sends a captured or picked image to Gemini and asks for a description plus structured labels. Each on-device call reports its own latency.',
    signature: 'useVisionAI(): VisionState',
    params: [],
    returns: [
      { name: 'selectedImageUri', type: 'string | null', desc: 'Image currently loaded, from the camera or the picker.' },
      { name: 'analysis', type: 'VisionAnalysisResult | null', desc: 'Cloud description and labels with latency.' },
      { name: 'isAnalyzing', type: 'boolean', desc: 'True during a cloud call.' },
      { name: 'isOnDeviceProcessing', type: 'boolean', desc: 'True during any local vision call.' },
      { name: 'ocrResult', type: 'TextRecognitionResult | null', desc: 'Recognised text with per-block bounding boxes.' },
      { name: 'barcodeResult', type: 'BarcodeScanResult | null', desc: 'Decoded barcodes with format and position.' },
      { name: 'facesResult', type: 'FaceDetectionResult | null', desc: 'Faces with head angles, smile and eye-open probabilities.' },
      { name: 'faceMeshResult', type: 'FaceMeshResult | null', desc: '468-point mesh for close-range faces.' },
      { name: 'labelsResult', type: 'ImageLabelResult | null', desc: 'Concept labels with confidence.' },
      { name: 'objectsResult', type: 'ObjectDetectionResult | null', desc: 'Detected objects with tracking ids across frames.' },
      { name: 'poseResult', type: 'PoseDetectionResult | null', desc: '33 skeletal landmarks with in-frame likelihood.' },
      { name: 'selfieResult', type: 'SelfieSegmentationResult | null', desc: 'Person-versus-background mask dimensions.' },
      { name: 'subjectResult', type: 'SubjectSegmentationResult | null', desc: 'Foreground subject cut-out result.' },
      { name: 'digitalInkResult', type: 'DigitalInkResult | null', desc: 'Handwriting candidates from stroke input.' },
      { name: 'error', type: 'string | null', desc: 'Why the last call failed.' },
      { name: 'model', type: 'string', desc: 'Cloud model used for scene analysis.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'captureAndAnalyze(useCamera?)',
        type: '(useCamera?: boolean) => Promise<VisionAnalysisResult | null>',
        desc: 'Takes or picks a photo and sends it to Gemini for a description and labels.',
        inputs: [{ name: 'useCamera', type: 'boolean | undefined', desc: 'True opens the camera and asks for permission, false opens the library. Defaults to true.' }],
        output: 'Resolves with { description, labels, latencyMs, timestamp }, or null when the user cancelled, no API key is configured, or the call failed.',
      },
      {
        name: 'pickImage(useCamera?)',
        type: '(useCamera?: boolean) => Promise<{ uri: string; base64?: string } | null>',
        desc: 'Opens the camera or the library and loads an image without analysing it.',
        inputs: [{ name: 'useCamera', type: 'boolean | undefined', desc: 'True for the camera, false for the library. Defaults to true.' }],
        output: 'Resolves with the file URI and base64 copy, also stored in selectedImageUri and selectedImageBase64. Null when cancelled or permission was refused.',
      },
      {
        name: 'recognizeText(image)',
        type: '(imageInput: string) => Promise<TextRecognitionResult | null>',
        desc: 'Reads text from an image, on the device.',
        inputs: [{ name: 'imageInput', type: 'string', desc: 'A file URI or a base64 image.' }],
        output: 'Resolves with { text, blocks, latencyMs, source }; blocks keep the line and bounding-box structure. Null on failure.',
      },
      {
        name: 'scanBarcodes(image)',
        type: '(imageInput: string) => Promise<BarcodeScanResult | null>',
        desc: 'Finds and decodes 1D and 2D codes, including QR.',
        inputs: [{ name: 'imageInput', type: 'string', desc: 'A file URI or a base64 image.' }],
        output: 'Resolves with { barcodes, latencyMs, source }; each barcode carries rawValue, displayValue, format, valueType and a bounding box. Null on failure.',
      },
      {
        name: 'detectFaces(image)',
        type: '(imageInput: string) => Promise<FaceDetectionResult | null>',
        desc: 'Locates faces and their attributes.',
        inputs: [{ name: 'imageInput', type: 'string', desc: 'A file URI or a base64 image.' }],
        output: 'Resolves with { faces, latencyMs, source }; each face carries a tracking id, head Euler angles, a bounding box, and smile and eye-open probabilities that are null when classification is off. Null on failure.',
      },
      {
        name: 'detectObjects(image)',
        type: '(imageInput: string) => Promise<ObjectDetectionResult | null>',
        desc: 'Detects and tracks objects with labels.',
        inputs: [{ name: 'imageInput', type: 'string', desc: 'A file URI or a base64 image.' }],
        output: 'Resolves with { objects, latencyMs, source }; each object carries a tracking id, a bounding box and labels with confidences. Null on failure.',
      },
      {
        name: 'detectPose(image)',
        type: '(imageInput: string) => Promise<PoseDetectionResult | null>',
        desc: 'Estimates body pose landmarks.',
        inputs: [{ name: 'imageInput', type: 'string', desc: 'A file URI or a base64 image.' }],
        output: 'Resolves with { landmarks, latencyMs, source } — 33 landmarks, each with a type, x, y and an in-frame likelihood. Null on failure.',
      },
      {
        name: 'segmentSubject(image)',
        type: '(imageInput: string) => Promise<SubjectSegmentationResult | null>',
        desc: 'Separates the main subject from the background.',
        inputs: [{ name: 'imageInput', type: 'string', desc: 'A file URI or a base64 image.' }],
        output: 'Resolves with { subjectsCount, foregroundConfidence, latencyMs, source }. Null on failure.',
      },
    ],
    example: `import { useVisionAI } from './src';

async function readLabel(uri: string, vision) {
  const ocr = await vision.recognizeText(uri);   // stays on the device
  return ocr.text;
}`,
    agentNote:
      'Prefer the on-device calls: they are faster, work offline and never send the image anywhere. Only use captureAndAnalyze when the question is genuinely open-ended.',
  },

  // ─────────────────────────────── Sensors & actuators ───────────────────────────────
  {
    id: 'useSensors',
    name: 'useSensors',
    category: 'sensors',
    chipBadge: 'IMU · barometer · light',
    badgeColor: SENSOR,
    summary: 'Motion, orientation, air pressure and ambient light, streaming live.',
    plain:
      'A live feed from the phone\'s motion and environment sensors: how it is being tilted and moved, which way is north, the air pressure, and how bright the room is. Set the interval to trade smoothness against battery.',
    description:
      'Streams from expo-sensors: accelerometer and gyroscope for the six-axis IMU, magnetometer for heading, barometer for pressure, and the ambient light sensor. Relative altitude is computed from pressure with the international hypsometric formula, so it is a derived value and drifts with weather. The sampling interval applies to all streams; shorter intervals cost battery and wake the sensor hub more often.',
    signature: 'useSensors(intervalMs?: number): SensorTelemetry',
    params: [
      { name: 'updateIntervalMs', type: 'number', desc: 'Sampling period in milliseconds for the IMU, magnetometer and barometer, defaulting to 100; the light sensor samples at twice this. Use 16 to 33 for animation, 500 or more for background monitoring. Changing it re-subscribes every sensor.' },
    ],
    returns: [
      { name: 'accelerometer', type: '{ x, y, z }', desc: 'Acceleration in g, including gravity. This is how you detect tilt and shake.' },
      { name: 'gyroscope', type: '{ x, y, z }', desc: 'Rotation rate in radians per second.' },
      { name: 'magnetometer', type: '{ x, y, z }', desc: 'Magnetic field in microtesla, used for compass heading.' },
      { name: 'barometer', type: '{ pressure, relativeAltitude? }', desc: 'Pressure in hectopascal, plus an altitude estimate derived from it.' },
      { name: 'lightLux', type: 'number | undefined', desc: 'Ambient brightness in lux. Undefined until the first sample arrives.' },
      { name: 'isAvailable', type: 'boolean', desc: 'Whether the sensors are present and streaming.' },
    ],
    actions: [],
    example: `import { useSensors } from './src';

function Level() {
  const { accelerometer, lightLux } = useSensors(100);
  return <Text>tilt {accelerometer.x.toFixed(2)} · {lightLux ?? '—'} lux</Text>;
}`,
    agentNote:
      'Do not poll at 16 ms unless something is animating from it. relativeAltitude is derived from pressure, so treat it as relative, never as a GPS altitude.',
  },
  {
    id: 'useHaptics',
    name: 'useHaptics',
    category: 'sensors',
    chipBadge: 'LRA · Android 16 envelopes',
    badgeColor: SENSOR,
    summary: 'Vibration, from simple taps to custom-shaped waveforms.',
    plain:
      'Makes the phone buzz. Standard patterns cover ordinary taps and confirmations. On this device you can also design your own vibration shape, rising and falling in intensity, which is how you make a distinctive feel rather than a generic buzz.',
    description:
      'Standard patterns come from expo-haptics. Beyond that, the native module reports the actual vibrator hardware: whether amplitude can be varied, its resonant frequency, and which composition primitives it supports. Android 16 envelope effects are built with BasicEnvelopeBuilder from intensity and sharpness control points and must finish at zero intensity. This Pixel supports them, which is how the thinking ramp and alert pulses are produced.',
    signature: 'useHaptics(): HapticsState',
    params: [],
    returns: [
      { name: 'hasAmplitudeControl', type: 'boolean | null', desc: 'Whether vibration strength can be varied rather than just on and off.' },
      { name: 'envelopeSupported', type: 'boolean', desc: 'Whether custom envelope waveforms can be played.' },
      { name: 'resonantFrequencyHz', type: 'number | null', desc: 'The frequency at which the actuator is most efficient. Around 134 Hz here.' },
      { name: 'supportedPrimitives', type: 'string[]', desc: 'Composition building blocks the hardware provides, such as click, tick, thud and rise.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'selection()',
        type: '() => Promise<void>',
        desc: 'Faint tick for moving between options: sliders, wheel pickers, tab changes.',
        output: 'Resolves once dispatched. No-op on web; failures are logged rather than thrown.',
      },
      {
        name: 'light() / medium() / heavy()',
        type: '() => Promise<void>',
        desc: 'Impact taps of increasing weight, for presses, reveals and destructive confirmations.',
        output: 'Resolves once dispatched. No-op on web.',
      },
      {
        name: 'success() / warning() / error()',
        type: '() => Promise<void>',
        desc: 'Notification patterns that carry meaning: a double pulse, a buzz, a triple pulse. Use them consistently.',
        output: 'Resolves once dispatched. No-op on web.',
      },
      {
        name: 'playEnvelope(points, sharpness?)',
        type: '(points: EnvelopePoint[], initialSharpness?: number) => boolean',
        desc: 'Plays a custom waveform on Android 16 and later. Check envelopeSupported first.',
        inputs: [
          { name: 'points', type: '{ intensity: number; sharpness: number; durationMs: number }[]', desc: 'Steps of the curve; intensity and sharpness are 0 to 1. The envelope must end at intensity 0, which the module appends for you.' },
          { name: 'initialSharpness', type: 'number | undefined', desc: 'Sharpness to start from, 0 to 1.' },
        ],
        output: 'Returns true when the effect was dispatched, false when envelopes are unsupported or the call failed. It never throws.',
      },
      {
        name: 'playPrimitives(steps)',
        type: '(steps: PrimitiveStep[]) => boolean',
        desc: 'Chains hardware primitives into a composition, Android 11 and later.',
        inputs: [{ name: 'steps', type: '{ primitive: string; scale?: number; delayMs?: number }[]', desc: 'primitive is one of supportedPrimitives; scale sets strength 0 to 1; delayMs is the gap before that step.' }],
        output: 'Returns true when the composition was dispatched, false when the native module is absent or the call failed.',
      },
      {
        name: 'cancel()',
        type: '() => void',
        desc: 'Stops any vibration immediately, including an envelope or composition in progress.',
        output: 'Returns nothing.',
      },
    ],
    example: `import { useHaptics, HapticEnvelopes } from './src';

function Confirm() {
  const { success, playEnvelope, envelopeSupported } = useHaptics();
  const onDone = () => envelopeSupported ? playEnvelope(HapticEnvelopes.thinkingRamp) : success();
  return <Button title="Done" onPress={onDone} />;
}`,
    agentNote:
      'Attach haptics to every touchable, preferably through HapticButton. Check envelopeSupported before using envelopes and fall back to a standard pattern.',
  },
  {
    id: 'useCamera',
    name: 'useCamera',
    category: 'sensors',
    chipBadge: 'expo-camera · photo & video',
    badgeColor: SENSOR,
    summary: 'Lens, zoom, flash and torch, plus taking photos and recording video.',
    plain:
      'Drives the camera and captures from it. Give it a camera view to hold on to and it can take a still or record a clip, both of which land as real files you can play back, save to the gallery or send to a model. Note that the Pixel Camera app\'s own colour Looks and long-range zoom are not available to other apps.',
    description:
      "The hook owns a ref to a CameraView and drives it, so a screen only renders the view and attaches cameraRef and handleCameraReady. takePicture resolves with a file, its dimensions and optionally base64 for the AI hooks; startRecording resolves when the recording ends, either because you called stopRecording or because a duration or size limit was reached. Two things the API does not make obvious: zoom is a 0 to 1 fraction of the lens range rather than an optical multiplier, so a \"5x\" figure does not map onto it; and Camera Looks, Super Res Zoom and the low-light video mode belong to the Pixel Camera app and cannot be driven from here, so selectedLook is a label for your own interface.",
    signature: 'useCamera(): CameraState',
    params: [],
    returns: [
      { name: 'cameraRef', type: 'RefObject<CameraView | null>', desc: 'Attach to your CameraView. Capture fails without it.' },
      { name: 'viewProps', type: '{ facing, zoom, flash, enableTorch, mode }', desc: 'Spread onto the view so it reflects this hook\'s state.' },
      { name: 'facing', type: "'back' | 'front'", desc: 'Which camera is active.' },
      { name: 'zoomFactor', type: 'number', desc: 'Zoom as a 0 to 1 fraction of the lens range, not an optical multiplier.' },
      { name: 'flashMode', type: "'auto' | 'on' | 'off'", desc: 'Whether the flash fires at capture.' },
      { name: 'isTorchOn', type: 'boolean', desc: 'Continuous light, as distinct from the capture-time flash.' },
      { name: 'mode', type: "'picture' | 'video'", desc: 'View configuration. Recording requires video.' },
      { name: 'isReady', type: 'boolean', desc: 'Whether the preview is running and capture is possible.' },
      { name: 'hasPermission', type: 'boolean', desc: 'Whether camera permission was granted.' },
      { name: 'isCapturing', type: 'boolean', desc: 'True while a still is being taken.' },
      { name: 'lastPhoto', type: 'CapturedPhoto | null', desc: 'Most recent still: uri, width, height and optional base64 and exif.' },
      { name: 'isRecording', type: 'boolean', desc: 'True while video is recording.' },
      { name: 'recordingSeconds', type: 'number', desc: 'Elapsed seconds of the current recording.' },
      { name: 'lastVideoUri', type: 'string | null', desc: 'File of the most recent clip. Hand this to useVideo to play it back.' },
      { name: 'availableLenses', type: 'string[]', desc: 'Lens identifiers the device reports, once the preview is running.' },
      { name: 'availablePictureSizes', type: 'string[]', desc: 'Picture sizes the device supports.' },
      { name: 'selectedLook', type: 'CameraLook', desc: 'Label only. Looks are a Pixel Camera app feature and are not applied here.' },
      { name: 'error', type: 'string | null', desc: 'Why the last capture failed.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'handleCameraReady()',
        type: '() => Promise<void>',
        desc: "Pass to the view's onCameraReady. Lens and picture-size lists only resolve once the preview is running, so they are read here.",
        output: 'Resolves once isReady is set and availableLenses and availablePictureSizes have been filled.',
      },
      {
        name: 'takePicture(options?)',
        type: '(options?: TakePictureOptions) => Promise<CapturedPhoto | null>',
        desc: 'Takes a still into the app cache. Use useMediaLibrary().save() to keep it.',
        inputs: [
          { name: 'options.quality', type: 'number | undefined', desc: 'JPEG quality 0 to 1. Defaults to 0.85.' },
          { name: 'options.base64', type: 'boolean | undefined', desc: 'Also return the image as base64, which is what the AI hooks consume. Defaults to false.' },
          { name: 'options.exif', type: 'boolean | undefined', desc: 'Include EXIF metadata. Defaults to false.' },
          { name: 'options.shutterSound', type: 'boolean | undefined', desc: 'Play the shutter sound where the platform allows suppressing it. Defaults to true.' },
        ],
        output: 'Resolves with { uri, width, height, base64?, exif? }, or null when the view is not mounted or the capture failed, with the reason in error.',
      },
      {
        name: 'startRecording(options?)',
        type: '(options?: StartRecordingOptions) => Promise<string | null>',
        desc: 'Records video, switching the view to video mode first.',
        inputs: [
          { name: 'options.maxDurationSeconds', type: 'number | undefined', desc: 'Stop automatically after this many seconds.' },
          { name: 'options.maxFileSizeBytes', type: 'number | undefined', desc: 'Stop automatically at this file size.' },
          { name: 'options.mirror', type: 'boolean | undefined', desc: 'Mirror the recording, matching what the user saw on a front-facing preview.' },
        ],
        output: 'Resolves with the video file URI when recording ends — through stopRecording() or a limit — or null on failure. recordingSeconds ticks while it runs.',
      },
      {
        name: 'stopRecording()',
        type: '() => void',
        desc: 'Ends the recording. No-op when nothing is recording.',
        output: 'Returns nothing; the promise from startRecording resolves with the video file.',
      },
      {
        name: 'toggleFacing()',
        type: '() => void',
        desc: 'Switches between the front and rear camera.',
        output: 'Returns nothing; facing flips and viewProps carries it to the view.',
      },
      {
        name: 'setZoom(fraction)',
        type: '(fraction: number) => void',
        desc: 'Sets zoom as a fraction of the lens range, not an optical multiplier.',
        inputs: [{ name: 'fraction', type: 'number', desc: '0 to 1; values outside are clamped. Do not pass 5 for "5x".' }],
        output: 'Returns nothing; zoomFactor updates and viewProps carries it to the view.',
      },
      {
        name: 'setZoomStep(step, total?)',
        type: '(step: number, totalSteps?: number) => void',
        desc: 'Evenly spaced zoom stops, for a control with discrete positions.',
        inputs: [
          { name: 'step', type: 'number', desc: 'Which stop to select, clamped to 0..totalSteps.' },
          { name: 'totalSteps', type: 'number | undefined', desc: 'How many stops there are. Defaults to 4.' },
        ],
        output: 'Returns nothing; sets zoomFactor to step / totalSteps.',
      },
      {
        name: 'setFlash(mode)',
        type: "(mode: 'auto' | 'on' | 'off') => void",
        desc: 'Chooses flash behaviour for the next capture, as distinct from the continuous torch.',
        inputs: [{ name: 'mode', type: "'auto' | 'on' | 'off'", desc: 'auto lets the camera decide by scene brightness.' }],
        output: 'Returns nothing; flashMode updates.',
      },
      {
        name: 'toggleTorch()',
        type: '() => void',
        desc: 'Turns the continuous light on or off through the preview. For torch without a preview, use useTorch.',
        output: 'Returns nothing; isTorchOn flips.',
      },
      {
        name: 'setMode(mode)',
        type: "(mode: 'picture' | 'video') => void",
        desc: 'Switches the view between stills and video.',
        inputs: [{ name: 'mode', type: "'picture' | 'video'", desc: 'Recording requires video; startRecording switches it for you.' }],
        output: 'Returns nothing; mode and viewProps update.',
      },
      {
        name: 'pausePreview() / resumePreview()',
        type: '() => Promise<void>',
        desc: 'Freezes or restarts the preview without tearing the camera down.',
        output: 'Resolves once applied. Silently no-ops when the view has been unmounted.',
      },
    ],
    example: `import { CameraView } from 'expo-camera';
import { useCamera } from './src';

function Capture() {
  const cam = useCamera();
  if (!cam.hasPermission) return <Text>Camera permission needed</Text>;
  return (
    <View>
      <CameraView ref={cam.cameraRef} onCameraReady={cam.handleCameraReady} {...cam.viewProps} style={{ flex: 1 }} />
      <Button title="Photo" onPress={() => cam.takePicture({ base64: true })} />
      <Button
        title={cam.isRecording ? \`Stop (\${cam.recordingSeconds}s)\` : 'Record'}
        onPress={() => cam.isRecording ? cam.stopRecording() : cam.startRecording({ maxDurationSeconds: 60 })}
      />
    </View>
  );
}`,
    agentNote:
      'Attach cameraRef to a mounted CameraView before calling capture, or it fails. zoom is 0..1, not a multiplier; do not pass 5 for "5x". Captures land in cache, so use useMediaLibrary().save() to keep them.',
  },
  {
    id: 'useTorch',
    name: 'useTorch',
    category: 'sensors',
    chipBadge: 'CameraManager torch',
    badgeColor: SENSOR,
    summary: 'The rear flashlight, including variable brightness and an SOS strobe.',
    plain:
      'Turns the rear light on and off. On this phone the brightness is adjustable in steps rather than just on or off. The state follows the system, so if the user toggles the torch from Quick Settings this hook notices.',
    description:
      'Backed by CameraManager.setTorchMode, with turnOnTorchWithStrengthLevel on Android 13 and above for variable brightness. A registered torch callback means external changes are reflected rather than the hook holding a stale belief. Nothing is simulated: when the native module is absent, isAvailable is false and every action rejects instead of pretending.',
    signature: 'useTorch(): TorchState',
    params: [],
    returns: [
      { name: 'isAvailable', type: 'boolean', desc: 'Whether a rear flash unit exists and the native module is present.' },
      { name: 'isTorchOn', type: 'boolean', desc: 'Whether the light is on, according to the system callback.' },
      { name: 'isStrobing', type: 'boolean', desc: 'Whether the SOS strobe is running.' },
      { name: 'maxStrengthLevel', type: 'number | null', desc: 'Number of brightness steps, 21 on this device. Null when variable brightness is unsupported.' },
      { name: 'error', type: 'string | null', desc: 'Why the last action failed, for example the camera being in use.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'setTorch(on, level?)',
        type: '(on: boolean, strengthLevel?: number) => Promise<boolean>',
        desc: 'Switches the rear LED, optionally at a specific brightness.',
        inputs: [
          { name: 'on', type: 'boolean', desc: 'Desired state.' },
          { name: 'strengthLevel', type: 'number | undefined', desc: '1 to maxStrengthLevel, honoured on Android 13 and later and ignored below it. Omit for the device default.' },
        ],
        output: 'Resolves true when the call was accepted, false when the hardware is unavailable or the call threw, with the reason in error.',
      },
      {
        name: 'toggleTorch()',
        type: '() => Promise<boolean>',
        desc: 'Flips the current state, stopping any strobe first.',
        output: 'Resolves with the state the torch is in afterwards.',
      },
      {
        name: 'startStrobe(intervalMs?)',
        type: '(intervalMs?: number) => void',
        desc: 'Toggles the hardware torch on a timer.',
        inputs: [{ name: 'intervalMs', type: 'number | undefined', desc: 'Half-period in milliseconds. Defaults to 150 and is clamped to at least 120, because the camera HAL needs roughly 50 to 100 ms per switch.' }],
        output: 'Returns nothing; isStrobing becomes true. Replaces any strobe already running.',
      },
      {
        name: 'stopStrobe()',
        type: '() => void',
        desc: 'Cancels the strobe timer and switches the LED off.',
        output: 'Returns nothing; isStrobing becomes false.',
      },
    ],
    example: `import { useTorch } from './src';

function Flashlight() {
  const { isTorchOn, maxStrengthLevel, setTorch, toggleTorch } = useTorch();
  return (
    <View>
      <Button title={isTorchOn ? 'Off' : 'On'} onPress={toggleTorch} />
      <Button title="Half" onPress={() => setTorch(true, Math.ceil((maxStrengthLevel ?? 2) / 2))} />
    </View>
  );
}`,
    agentNote:
      'The torch competes with the camera; a capture session can take it away. Always surface error rather than assuming the call worked.',
  },

  // ─────────────────────────────── Radios & security ───────────────────────────────
  {
    id: 'useBiometrics',
    name: 'useBiometrics',
    category: 'radios',
    chipBadge: 'BiometricPrompt',
    badgeColor: RADIO,
    summary: 'Fingerprint and face authentication.',
    plain:
      'Asks the user to prove who they are with their fingerprint or face. Check that hardware exists and that something is actually enrolled before you offer it, otherwise the prompt will fail.',
    description:
      'Uses the platform BiometricPrompt through expo-local-authentication, which on a Pixel is backed by the hardware security module. The two checks matter separately: a device can have the sensor but no enrolled credential, in which case authentication cannot succeed and you should fall back to a passcode path.',
    signature: 'useBiometrics(): BiometricState & { authenticate }',
    params: [],
    returns: [
      { name: 'hasHardware', type: 'boolean', desc: 'Whether a biometric sensor exists.' },
      { name: 'isEnrolled', type: 'boolean', desc: 'Whether the user has registered a fingerprint or face. Without this, prompts fail.' },
      { name: 'supportedTypes', type: 'string[]', desc: 'Which modalities are available, such as fingerprint or face.' },
    ],
    actions: [
      {
        name: 'authenticate(promptMessage?)',
        type: '(promptMessage?: string) => Promise<boolean>',
        desc: 'Shows the system biometric prompt with a device-passcode fallback.',
        inputs: [{ name: 'promptMessage', type: 'string | undefined', desc: 'The line shown in the system sheet. Defaults to "Verify identity with Pixel Biometrics".' }],
        output: 'Resolves true only on success. A cancel or a mismatch resolves false without setting error; missing hardware or no enrolment resolves false and sets error. lastResult tells the three apart.',
      },
    ],
    example: `import { useBiometrics } from './src';

function Unlock() {
  const { hasHardware, isEnrolled, authenticate } = useBiometrics();
  if (!hasHardware || !isEnrolled) return <Text>Use a passcode instead</Text>;
  return <Button title="Unlock" onPress={() => authenticate('Confirm your identity')} />;
}`,
    agentNote:
      'Always provide a non-biometric path. Never treat a false result as an attack; a cancel and a failure look the same here.',
  },
  {
    id: 'useSecurity',
    name: 'useSecurity',
    category: 'radios',
    chipBadge: 'SecureStore · Android Keystore',
    badgeColor: RADIO,
    summary: 'Encrypted storage for secrets, backed by hardware.',
    plain:
      'Where API keys and tokens belong. Values are encrypted with a key the operating system holds in secure hardware, so they are not readable from app storage. Never put a secret anywhere else.',
    description:
      'Wraps expo-secure-store, which encrypts values using a key held in the Android Keystore and, on devices that have it, StrongBox. Whether this device actually has StrongBox is verified separately by useCapabilities().hasStrongBox. Android 17 does have post-quantum key types, but SecureStore does not use them, so isPostQuantumProtected is false rather than implying protection that is not there.',
    signature: 'useSecurity(): SecurityState',
    params: [],
    returns: [
      { name: 'isHardwareBacked', type: 'boolean', desc: 'True on Android, where the encryption key lives in the Keystore.' },
      { name: 'securityModule', type: 'string', desc: 'Backend name the platform reports, "Android Keystore" here.' },
      { name: 'isPostQuantumProtected', type: 'boolean', desc: 'Always false. SecureStore uses classical AES; do not claim otherwise.' },
    ],
    actions: [
      {
        name: 'saveSecureItem(key, value)',
        type: '(key: string, value: string) => Promise<boolean>',
        desc: 'Encrypts and stores a value. This is the only sanctioned place for a secret.',
        inputs: [
          { name: 'key', type: 'string', desc: 'Storage key: alphanumerics, dot, dash and underscore.' },
          { name: 'value', type: 'string', desc: 'The secret itself. It is never written to the log.' },
        ],
        output: 'Resolves true on success, false with the reason in error on failure.',
      },
      {
        name: 'getSecureItem(key)',
        type: '(key: string) => Promise<string | null>',
        desc: 'Decrypts and returns a stored value.',
        inputs: [{ name: 'key', type: 'string', desc: 'The key used when saving.' }],
        output: 'Resolves with the value, or null when nothing is stored under that key or the read failed.',
      },
      {
        name: 'deleteSecureItem(key)',
        type: '(key: string) => Promise<boolean>',
        desc: 'Removes a stored value.',
        inputs: [{ name: 'key', type: 'string', desc: 'The key to delete.' }],
        output: 'Resolves true when the delete completed, false with the reason in error otherwise.',
      },
    ],
    example: `import { useSecurity } from './src';

async function storeKey(value: string, security) {
  await security.saveSecureItem('MY_API_KEY', value);
}`,
    agentNote:
      'Never write a secret to plain storage, a log line, or source. Use this hook or saveApiKey, and do not describe the storage as post-quantum.',
  },
  {
    id: 'useBLE',
    name: 'useBLE',
    category: 'radios',
    chipBadge: 'Bluetooth 5.4 LE',
    badgeColor: RADIO,
    summary: 'Bluetooth adapter state, Channel Sounding, bonded devices, and active BLE peripheral discovery.',
    plain:
      'Reports whether Bluetooth is on, which devices are already paired, whether this phone supports Channel Sounding, and performs live RF peripheral discovery with real RSSI values.',
    description:
      'Adapter state, Channel Sounding support and the bonded device list are read from Android BluetoothAdapter through the native module with source hardware. Live peripheral discovery scans for nearby BLE beacons using Android BluetoothLeScanner, returning verified MAC addresses, RSSI (dBm), and log-distance path loss distance estimations.',
    signature: 'useBLE(): BLEState',
    params: [],
    returns: [
      { name: 'isSupported', type: 'boolean', desc: 'Whether the device has Bluetooth Low Energy.' },
      { name: 'isEnabled', type: 'boolean', desc: 'Whether Bluetooth is switched on in settings.' },
      { name: 'state', type: "'ON' | 'OFF' | 'TURNING_ON' | 'TURNING_OFF'", desc: 'Adapter state, including the transitional values.' },
      { name: 'channelSounding', type: 'boolean', desc: 'Whether Bluetooth 5.4 Channel Sounding, used for accurate distance, is supported.' },
      { name: 'bondedDevices', type: 'BondedDevice[]', desc: 'Devices already paired with this phone. Real data.' },
      { name: 'isScanning', type: 'boolean', desc: 'Whether a BLE scan is running.' },
      { name: 'peripherals', type: 'BLEPeripheral[]', desc: 'Discovered nearby BLE peripherals with genuine RSSI and distance estimate.' },
      { name: 'scanError', type: 'string | null', desc: 'Error message if scanning fails to start or times out.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'startScan(timeoutMs?)',
        type: '(timeoutMs?: number) => Promise<boolean>',
        desc: 'Begins physical Bluetooth Low Energy discovery through BluetoothLeScanner.',
        inputs: [{ name: 'timeoutMs', type: 'number | undefined', desc: 'How long to scan before stopping automatically, in milliseconds. Defaults to 10000.' }],
        output: 'Resolves true when the scan started; false with the reason in scanError otherwise. Results appear in peripherals, polled every 500 ms.',
      },
      {
        name: 'stopScan()',
        type: '() => void',
        desc: 'Stops active BLE discovery and clears the auto-stop timer.',
        output: 'Returns nothing; a final results sync runs first, so nothing already discovered is lost.',
      },
    ],
    example: `import { useBLE } from './src';

function Bluetooth() {
  const { isEnabled, bondedDevices, peripherals, isScanning, startScan, stopScan } = useBLE();
  return (
    <View>
      <Text>{isEnabled ? \`\${bondedDevices.length} paired · \${peripherals.length} discovered\` : 'Bluetooth off'}</Text>
      <Button
        title={isScanning ? 'Stop scan' : 'Scan for peripherals'}
        onPress={() => isScanning ? stopScan() : startScan(8000)}
      />
    </View>
  );
}`,
    agentNote:
      'BLE scanning uses Android BluetoothLeScanner directly on physical hardware. Call startScan with a finite timeout to preserve battery.',
  },
  {
    id: 'useNFC',
    name: 'useNFC',
    category: 'radios',
    chipBadge: 'NfcAdapter reader mode · NDEF',
    badgeColor: RADIO,
    summary: 'Reading and writing real NFC tags through reader mode.',
    plain:
      'Reads tags you touch to the back of the phone and can write text to them. Start the reader, hold a tag against the upper third of the phone, and the tag arrives with its identifier, capacity and decoded contents. Writing works the same way: queue the text, then present the tag.',
    description:
      "Enables NfcAdapter reader mode on the foreground Activity through the native module. Every tag entering the field raises an event carrying its identifier, supported technologies, NDEF capacity, writability and decoded records; text records have their language prefix stripped and URI records are resolved. Two platform constraints are surfaced rather than hidden: reader mode is bound to the Activity, so it stops when the app is backgrounded and must be started again on resume; and a tag is only readable while physically in the field, so a read either happens in that window or reports why it did not.",
    signature: 'useNFC(): NFCState',
    params: [],
    returns: [
      { name: 'isSupported', type: 'boolean', desc: 'Whether this device has an NFC radio.' },
      { name: 'isEnabled', type: 'boolean', desc: 'Whether NFC is switched on in system settings.' },
      { name: 'observeModeSupported', type: 'boolean', desc: 'Whether Android 15 Observe Mode is available, which lets an app watch reader field activity.' },
      { name: 'antennaState', type: "'ENABLED' | 'DISABLED' | 'UNAVAILABLE'", desc: 'Current antenna state.' },
      { name: 'isReading', type: 'boolean', desc: 'Whether reader mode is running. Stops when the app leaves the foreground.' },
      { name: 'lastScannedTag', type: 'ScannedTag | null', desc: 'The last physical tag read: id, technologies, capacity, writability and decoded NDEF records.' },
      { name: 'tagCount', type: 'number', desc: 'How many tags have been read this session.' },
      { name: 'pendingWrite', type: 'string | null', desc: 'Text waiting to be written to the next tag presented.' },
      { name: 'lastWriteOk', type: 'boolean | null', desc: 'Whether the last queued write succeeded. Null before any attempt.' },
      { name: 'error', type: 'string | null', desc: 'Why the last operation failed, for example a read-only tag or one too small for the message.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'startReader()',
        type: '() => Promise<boolean>',
        desc: 'Enables NFC reader mode on the foreground Activity.',
        output: 'Resolves true when reader mode started; false with the reason in error when the device has no radio, NFC is switched off, or the build has no reader. Tags then arrive in lastScannedTag.',
      },
      {
        name: 'stopReader()',
        type: '() => Promise<void>',
        desc: 'Disables reader mode and releases the Activity binding.',
        output: 'Resolves once released; isReading becomes false and any pending write is dropped.',
      },
      {
        name: 'writeText(text)',
        type: '(text: string) => Promise<boolean>',
        desc: 'Queues a text record for the next tag presented. The reader must already be running.',
        inputs: [{ name: 'text', type: 'string', desc: 'The NDEF text record to write.' }],
        output: 'Resolves true when the write was queued, not when it completed; the outcome arrives later in lastWriteOk. False with the reason in error when it could not be queued.',
      },
      {
        name: 'clearTag()',
        type: '() => void',
        desc: 'Clears the last read from state, for a "scan another" control.',
        output: 'Returns nothing; lastScannedTag and lastWriteOk become null.',
      },
    ],
    example: `import { useNFC } from './src';

function TagReader() {
  const nfc = useNFC();
  if (!nfc.isSupported) return <Text>No NFC radio</Text>;
  if (!nfc.isEnabled) return <Text>Turn NFC on in settings</Text>;
  return (
    <View>
      <Button
        title={nfc.isReading ? 'Stop reader' : 'Start reader'}
        onPress={() => nfc.isReading ? nfc.stopReader() : nfc.startReader()}
      />
      <Button title="Write a tag" onPress={() => nfc.writeText('hello from PixelKit')} />
      {nfc.lastScannedTag && (
        <Text>
          {nfc.lastScannedTag.id} · {nfc.lastScannedTag.records.length} records · {nfc.lastScannedTag.payload}
        </Text>
      )}
    </View>
  );
}`,
    agentNote:
      'Reader mode needs a foreground Activity, so restart it on resume rather than assuming it survived. Writing needs the reader running first, and the result arrives with the next tag event as lastWriteOk.',
  },
  {
    id: 'useRadios',
    name: 'useRadios',
    category: 'radios',
    chipBadge: 'Unified radio telemetry',
    badgeColor: RADIO,
    summary: 'Every radio subsystem in one read.',
    plain:
      'A single snapshot of all the wireless hardware: NFC, Bluetooth, ultra-wideband, Wi-Fi precise ranging and satellite messaging. Use this for a status overview instead of calling four separate hooks.',
    description:
      'One native call gathers state from NfcAdapter, BluetoothManager, UwbManager, WifiRttManager and PackageManager, refreshed every five seconds. Everything here is read from the platform, so the whole object carries source hardware. It overlaps with useNFC, useBLE and useUWB on purpose: those add per-radio actions, this one is purely for reading state.',
    signature: 'useRadios(): RadioTelemetry',
    params: [],
    returns: [
      { name: 'nfc', type: '{ supported, enabled, observeModeSupported, antennaState }', desc: 'NFC controller state.' },
      { name: 'bluetooth', type: '{ supported, bleSupported, enabled, state, channelSounding, bondedDevices }', desc: 'Adapter state plus paired devices and Channel Sounding support.' },
      { name: 'uwb', type: '{ supported, enabled, chipId, rangingApiSupported }', desc: 'Ultra-wideband chip state.' },
      { name: 'wifiRtt', type: '{ supported, available }', desc: 'Wi-Fi round-trip-time ranging, used for indoor positioning.' },
      { name: 'satellite', type: '{ supported }', desc: 'Whether satellite messaging is available on this device.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'refresh()',
        type: '() => void',
        desc: 'Forces an immediate re-read instead of waiting for the next five-second poll.',
        output: 'Returns nothing; the nfc, bluetooth, uwb, wifiRtt and satellite blocks update. Call it after sending the user to Settings.',
      },
    ],
    example: `import { useRadios } from './src';

function RadioPanel() {
  const radios = useRadios();
  return <Text>NFC {radios.nfc.enabled ? 'on' : 'off'} · UWB {radios.uwb.enabled ? 'on' : 'off'}</Text>;
}`,
    agentNote:
      'Use this for a status overview and the individual hooks when you need to act. All fields here are real platform reads.',
  },
  {
    id: 'useLocation',
    name: 'useLocation',
    category: 'radios',
    chipBadge: 'Multi-band GNSS',
    badgeColor: RADIO,
    summary: 'Position, altitude, heading and speed from the satellite receiver.',
    plain:
      'Where the phone is, how accurate that is, which way it is pointing and how fast it is moving. Always check accuracy before trusting a fix, and check permission before assuming you will get one at all.',
    description:
      'Streams from expo-location using the high-accuracy provider, which on a Pixel uses the dual-band receiver. The accuracy value is the radius in metres that the platform believes the position lies within; indoors it can be tens of metres and should gate any decision made from the coordinates. Heading and speed are only meaningful while actually moving.',
    signature: 'useLocation(): LocationTelemetry & { refreshLocation }',
    params: [],
    returns: [
      { name: 'latitude', type: 'number', desc: 'Decimal degrees north.' },
      { name: 'longitude', type: 'number', desc: 'Decimal degrees east.' },
      { name: 'altitude', type: 'number | null', desc: 'Metres above sea level, less reliable than the horizontal position.' },
      { name: 'accuracy', type: 'number | null', desc: 'Radius in metres the fix is confident within. Check this before trusting the position.' },
      { name: 'heading', type: 'number | null', desc: 'Direction of travel in degrees, meaningful only while moving.' },
      { name: 'speed', type: 'number | null', desc: 'Ground speed in metres per second.' },
      { name: 'hasPermission', type: 'boolean', desc: 'Whether fine location permission was granted.' },
    ],
    actions: [
      {
        name: 'refreshLocation()',
        type: '() => Promise<boolean>',
        desc: 'Requests permission if needed and takes a fresh highest-accuracy fix.',
        output: 'Resolves true when a fix arrived, false when permission was denied or the fix failed, with the reason in error. Coordinates never reach the log.',
      },
    ],
    example: `import { useLocation } from './src';

function Position() {
  const { latitude, longitude, accuracy, hasPermission } = useLocation();
  if (!hasPermission) return <Text>Location permission needed</Text>;
  return <Text>{latitude.toFixed(5)}, {longitude.toFixed(5)} ±{accuracy ?? '—'} m</Text>;
}`,
    agentNote:
      'Never present coordinates without their accuracy. Request permission in response to a user action, not on mount.',
  },

  // ─────────────────────────────── System & media ───────────────────────────────
  {
    id: 'useCapabilities',
    name: 'useCapabilities',
    category: 'system',
    chipBadge: 'PackageManager verified',
    badgeColor: SYSTEM,
    summary: 'What this particular phone actually has.',
    plain:
      'The first hook to call. It answers "does this device have that?" so your interface can hide features the phone does not support, instead of showing a control that will fail.',
    description:
      'Resolution starts from a model table keyed on the device name, then upgrades to real PackageManager feature checks when the native module is present, at which point verification changes from model-table to device. Fields that can only be answered by the device are null until that upgrade happens. Note two results on this Pixel that are easy to assume wrongly: it does not declare a neural processing unit feature, and it does not declare the ranging feature.',
    signature: 'useCapabilities(): DeviceCapabilities',
    params: [],
    returns: [
      { name: 'modelName', type: 'string', desc: 'Marketing model name, for example "Pixel 11 Pro".' },
      { name: 'isPixel / isProModel / isFoldable', type: 'boolean', desc: 'Device family flags used to gate Pro-only features.' },
      { name: 'pixelGeneration', type: 'number | null', desc: 'Generation number, 11 here. Null on non-Pixel hardware.' },
      { name: 'androidApiLevel', type: 'number | null', desc: 'API level, 37 for Android 17. Null on web.' },
      { name: 'verification', type: "'device' | 'model-table'", desc: 'Whether flags were confirmed against the device or inferred from the model name. Prefer acting on device.' },
      { name: 'hasHiLight', type: 'boolean', desc: 'Whether the LED array is present.' },
      { name: 'hasUWB', type: 'boolean', desc: 'Whether an ultra-wideband radio is present.' },
      { name: 'hasNFC / hasBleChannelSounding / hasWifiRtt / hasSatelliteTelephony', type: 'boolean | null', desc: 'Radio features confirmed from PackageManager. Null before device verification.' },
      { name: 'hasStrongBox', type: 'boolean | null', desc: 'Whether keys can be held in the dedicated secure element.' },
      { name: 'hasNpuFeature', type: 'boolean | null', desc: 'Whether a neural processing unit feature is declared. False on this device.' },
      { name: 'geminiNanoTier', type: "'nano-v4' | 'nano-v3' | 'nano-v2' | 'none'", desc: 'Which on-device model generation to expect.' },
      { name: 'aicoreVersion', type: 'string | null', desc: 'Installed AICore build when the native module can read it.' },
      { name: 'supportsRangingApi / supportsHapticEnvelopes / supportsAppFunctions / supportsAndroid17Apis', type: 'boolean', desc: 'Platform API availability gates.' },
    ],
    actions: [],
    example: `import { useCapabilities } from './src';

function ProFeatures() {
  const caps = useCapabilities();
  return (
    <View>
      <Text>{caps.modelName} · API {caps.androidApiLevel} · {caps.verification}</Text>
      {caps.hasHiLight && <HiLightCard />}
      {caps.hasUWB && <UWBCard />}
    </View>
  );
}`,
    agentNote:
      'Never hardcode a device assumption; read this first. Treat null as unknown rather than false, and prefer acting once verification is device.',
  },
  {
    id: 'useAudio',
    name: 'useAudio',
    category: 'system',
    chipBadge: 'expo-audio · capture & playback',
    badgeColor: SYSTEM,
    summary: 'Microphone recording with levels and input choice, plus playback.',
    plain:
      'Records from the microphone and plays recordings back. It gives you a live loudness reading for meters and speaking indicators, lets you pause and resume a take, choose which microphone to use, and pick between a speech profile and an unprocessed studio profile.',
    description:
      'Built on expo-audio. The speech profile records 16 kHz mono through the voice_recognition source, which is the path that applies the platform noise suppression and is what speech APIs expect; the studio profile records 48 kHz stereo through unprocessed, the raw microphone with no platform processing. Levels are read every 100 ms from the recorder status in dBFS, where -160 is digital silence and 0 is clipping; level maps that onto 0 to 1 with a floor at -60 dBFS so meters behave sensibly. Microphone enumeration only works once the recorder has been prepared, which is why inputs populate after recording starts. Playback routing between speaker and earpiece is an audio-mode setting, so it applies to the whole app.',
    signature: 'useAudio(): AudioState',
    params: [],
    returns: [
      { name: 'isRecording', type: 'boolean', desc: 'Whether the microphone is open. Stays true while paused.' },
      { name: 'isPaused', type: 'boolean', desc: 'Whether the current take is paused.' },
      { name: 'canRecord', type: 'boolean', desc: 'Whether the recorder reports it is ready to start.' },
      { name: 'permissionGranted', type: 'boolean', desc: 'Whether microphone permission has been granted.' },
      { name: 'durationSeconds', type: 'number', desc: 'Elapsed seconds of the current take.' },
      { name: 'quality', type: "'speech' | 'studio'", desc: 'Active capture profile.' },
      { name: 'meteringDecibels', type: 'number', desc: 'Live level in dBFS, -160 silence to 0 clipping.' },
      { name: 'peakDecibels', type: 'number', desc: 'Loudest level seen during this take, for a peak indicator.' },
      { name: 'level', type: 'number', desc: '0 to 1 version of the level, floored at -60 dBFS. Use this to drive a meter.' },
      { name: 'isSilent', type: 'boolean', desc: 'True while the level sits below the silence threshold. Useful for a "say something" hint.' },
      { name: 'silenceThresholdDbfs', type: 'number', desc: 'Boundary between silence and speech, -45 dBFS by default.' },
      { name: 'inputs', type: 'RecordingInput[]', desc: 'Microphones the platform offers, populated once recording has been prepared.' },
      { name: 'currentInputUid', type: 'string | null', desc: 'Which microphone is selected.' },
      { name: 'route', type: "'speaker' | 'earpiece'", desc: 'Where playback is sent.' },
      { name: 'lastRecordingUri', type: 'string | null', desc: 'File of the last completed recording.' },
      { name: 'isPlaying', type: 'boolean', desc: 'Whether playback is running.' },
      { name: 'playbackPositionSeconds', type: 'number', desc: 'Playback position, for a scrubber.' },
      { name: 'playbackDurationSeconds', type: 'number', desc: 'Length of the audio being played.' },
      { name: 'error', type: 'string | null', desc: 'Why the last action failed.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'startRecording(options?)',
        type: '(options?: { maxDurationSeconds?: number; quality?: AudioQuality }) => Promise<boolean>',
        desc: 'Requests permission if needed, prepares the profile and opens the microphone with metering at 10 Hz.',
        inputs: [
          { name: 'options.maxDurationSeconds', type: 'number | undefined', desc: 'Stop automatically after this many seconds; the recorder finalises the file itself.' },
          { name: 'options.quality', type: "'speech' | 'studio' | undefined", desc: 'Profile for this take, which also becomes the active profile. speech is 16 kHz mono noise-suppressed, studio is 48 kHz stereo unprocessed.' },
        ],
        output: 'Resolves true when recording started, false with the reason in error when permission was denied or the recorder refused.',
      },
      {
        name: 'pauseRecording()',
        type: '() => boolean',
        desc: 'Pauses without finalising the file, so resumeRecording continues the same take.',
        output: 'Returns true when the take was paused, false when nothing was recording or it was already paused.',
      },
      {
        name: 'resumeRecording()',
        type: '() => boolean',
        desc: 'Continues the same take after a pause.',
        output: 'Returns true when recording resumed, false when there was nothing paused.',
      },
      {
        name: 'stopRecording()',
        type: '() => Promise<string | null>',
        desc: 'Finalises the take and stops metering.',
        output: 'Resolves with the recorded file URI, also stored in lastRecordingUri, or null when nothing was recording or the stop failed.',
      },
      {
        name: 'setQuality(quality)',
        type: "(quality: 'speech' | 'studio') => void",
        desc: 'Chooses the capture profile for the next recording, not the current one.',
        inputs: [{ name: 'quality', type: "'speech' | 'studio'", desc: 'speech records 16 kHz mono through the noise-suppressed voice path; studio records 48 kHz stereo unprocessed.' }],
        output: 'Returns nothing; quality updates immediately.',
      },
      {
        name: 'refreshInputs()',
        type: '() => RecordingInput[]',
        desc: 'Re-reads the available microphones. Only valid once a recording has been prepared.',
        output: 'Returns the list, also written to inputs. Empty when the platform cannot answer.',
      },
      {
        name: 'selectInput(uid)',
        type: '(uid: string) => boolean',
        desc: 'Switches to a specific microphone, such as an attached USB or Bluetooth one.',
        inputs: [{ name: 'uid', type: 'string', desc: 'A uid from the inputs list.' }],
        output: 'Returns true when the platform accepted it, false with the reason in error otherwise.',
      },
      {
        name: 'setRoute(route)',
        type: "(route: 'speaker' | 'earpiece') => Promise<void>",
        desc: 'Sends playback to the loudspeaker or the call earpiece, at the audio-mode level.',
        inputs: [{ name: 'route', type: "'speaker' | 'earpiece'", desc: 'earpiece is the quiet, held-to-the-ear path.' }],
        output: 'Resolves once the audio mode is applied; on failure route is unchanged and error is set.',
      },
      {
        name: 'playLastRecording(uri?)',
        type: '(uri?: string) => Promise<boolean>',
        desc: 'Plays a recording and starts position polling five times a second.',
        inputs: [{ name: 'uri', type: 'string | undefined', desc: 'A specific file to play. Defaults to lastRecordingUri.' }],
        output: 'Resolves true when playback started, false when there is nothing to play or the player refused.',
      },
      {
        name: 'pausePlayback()',
        type: '() => void',
        desc: 'Pauses playback where it is.',
        output: 'Returns nothing; isPlaying becomes false and position polling stops.',
      },
      {
        name: 'stopPlayback()',
        type: '() => Promise<void>',
        desc: 'Stops playback and rewinds to the start.',
        output: 'Resolves once rewound; playbackPositionSeconds returns to 0.',
      },
      {
        name: 'seekPlayback(seconds)',
        type: '(seconds: number) => Promise<void>',
        desc: 'Jumps to a position in the file being played.',
        inputs: [{ name: 'seconds', type: 'number', desc: 'Absolute position; negatives are clamped to 0.' }],
        output: 'Resolves once the seek completes; playbackPositionSeconds updates.',
      },
    ],
    example: `import { useAudio } from './src';

function Recorder() {
  const audio = useAudio();
  return (
    <View>
      <Button
        title={audio.isRecording ? 'Stop' : 'Record'}
        onPress={() => audio.isRecording ? audio.stopRecording() : audio.startRecording({ maxDurationSeconds: 30 })}
      />
      <View style={{ width: 200 * audio.level, height: 4, backgroundColor: '#6FDCF2' }} />
      <Text>{audio.durationSeconds}s · peak {audio.peakDecibels} dBFS</Text>
      {audio.lastRecordingUri && <Button title="Play" onPress={() => audio.playLastRecording()} />}
    </View>
  );
}`,
    agentNote:
      'Use level for meters, not meteringDecibels, because the dBFS scale is logarithmic and looks wrong on a bar. Use the speech profile for anything heading to speech recognition.',
  },
  {
    id: 'useDisplay',
    name: 'useDisplay',
    category: 'system',
    chipBadge: 'LTPO OLED · ARR',
    badgeColor: SYSTEM,
    summary: 'Refresh rate, HDR capability, brightness and the screen wake lock.',
    plain:
      'Reads what the screen is doing and lets you influence it. The refresh rate changes constantly on this panel to save power, so it is re-read live rather than assumed.',
    description:
      'Display mode, supported refresh rates, HDR types and resolution come from the Android Display object through the native module, re-read every two seconds because adaptive refresh rate changes the active mode continuously. Brightness uses expo-brightness and the wake lock uses expo-keep-awake. setPreferredRefreshRate requests a rate; the platform may ignore it, so read refreshRateHz back rather than assuming it took.',
    signature: 'useDisplay(): DisplayState',
    params: [],
    returns: [
      { name: 'refreshRateHz', type: 'number', desc: 'Rate the panel is running at right now. Changes on its own with adaptive refresh.' },
      { name: 'hasArrSupport', type: 'boolean | null', desc: 'Whether adaptive refresh rate is supported.' },
      { name: 'supportedRefreshRates', type: 'number[]', desc: 'Every rate the panel can drive, down to 1 Hz on this device.' },
      { name: 'resolution', type: '{ width, height, densityDpi } | null', desc: 'Physical resolution and density of the active mode.' },
      { name: 'hdrTypes', type: 'number[]', desc: 'Supported HDR formats: 1 Dolby Vision, 2 HDR10, 3 HLG, 4 HDR10+.' },
      { name: 'isHdr', type: 'boolean', desc: 'Whether the panel reports HDR capability at all.' },
      { name: 'maxLuminance', type: 'number | null', desc: 'Peak luminance the panel reports, when it reports one.' },
      { name: 'brightness', type: 'number', desc: 'Current screen brightness from 0 to 1.' },
      { name: 'isKeepAwake', type: 'boolean', desc: 'Whether this app is currently holding the screen on.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'setPreferredRefreshRate(hz)',
        type: '(rateHz: number) => Promise<boolean>',
        desc: 'Asks the system for a refresh rate for this window, for example 120 during an animation and 60 otherwise.',
        inputs: [{ name: 'rateHz', type: 'number', desc: 'A rate from supportedRefreshRates.' }],
        output: 'Resolves true when the request was applied. It is a request, not a guarantee: the system may pick another mode.',
      },
      {
        name: 'setScreenBrightness(value)',
        type: '(value: number) => Promise<void>',
        desc: 'Sets the brightness of this app window.',
        inputs: [{ name: 'value', type: 'number', desc: '0 to 1; values outside are clamped.' }],
        output: 'Resolves once applied. No-op on web; on failure brightness is left unchanged.',
      },
      {
        name: 'toggleKeepAwake()',
        type: '() => Promise<void>',
        desc: 'Acquires or releases a tagged screen wake lock, so the display does not dim during a long read or capture.',
        output: 'Resolves once the lock state has flipped; isKeepAwake reflects it. Release it when you no longer need it.',
      },
    ],
    example: `import { useDisplay } from './src';

function DisplayPanel() {
  const display = useDisplay();
  return (
    <View>
      <Text>{display.refreshRateHz} Hz{display.hasArrSupport ? ' · adaptive' : ''}</Text>
      <Button title="Prefer 120 Hz" onPress={() => display.setPreferredRefreshRate(120)} />
    </View>
  );
}`,
    agentNote:
      'Do not cache refreshRateHz; it moves. Always release the wake lock when the screen no longer needs to stay on, or you will drain the battery.',
  },
  {
    id: 'useDevice',
    name: 'useDevice',
    category: 'system',
    chipBadge: 'Battery · PMIC · power telemetry',
    badgeColor: SYSTEM,
    summary: 'Device identity, battery level, thermistor temperature, voltage, current, and wattage.',
    plain:
      'Facts about the phone, its hardware identity, and its real physical power state: battery level, fuel gauge thermistor temperature, instantaneous cell voltage and current flow, wattage draw/charging rate, health status, and lifetime charge cycles.',
    description:
      'Identity comes from expo-device, live power state from expo-battery listeners, and deep physical battery telemetry from the native fuel gauge PMIC via PixelNative.getBatteryTelemetry(). batteryTemperatureC reads the actual lithium pack NTC thermistor in 0.1 °C units. batteryVoltageMv and batteryCurrentMa give the cell terminal voltage and live current draw (negative discharging, positive charging); batteryPowerWatts computes real-time wattage (V × I). On Android 14+, batteryCycleCount reads lifetime charge cycles from the PMIC EEPROM. Nothing is simulated: unavailable readings are null.',
    signature: 'useDevice(): DeviceTelemetry & { batteryPercent, batteryTemperatureC, batteryVoltageMv, batteryCurrentMa, batteryCurrentAvgMa, batteryPowerWatts, batteryHealth, batteryCycleCount, batteryChargeCounterMah, batteryEnergyCounterMwh, batteryTechnology, pluggedSource, batteryTelemetry, hasRead, error, source, refresh }',
    params: [],
    returns: [
      { name: 'modelName', type: 'string', desc: 'Commercial model name (e.g. "Pixel 11 Pro").' },
      { name: 'brand', type: 'string', desc: 'Hardware manufacturer brand (e.g. "Google").' },
      { name: 'osVersion', type: 'string', desc: 'Android release string.' },
      { name: 'batteryLevel', type: 'number', desc: 'Charge remaining as integer percentage, 0 to 100.' },
      { name: 'batteryPercent', type: 'number | null', desc: 'Honest charge percentage, null until the platform answers.' },
      { name: 'isCharging', type: 'boolean', desc: 'Whether a charger is attached (AC, USB, wireless or dock).' },
      { name: 'lowPowerMode', type: 'boolean', desc: 'Whether Battery Saver is active. Treat as a direct instruction to do less work.' },
      { name: 'networkType', type: 'string', desc: 'Active network connection type (e.g. "WIFI", "CELLULAR").' },
      { name: 'isConnected', type: 'boolean', desc: 'Whether a working, reachable internet route exists.' },
      { name: 'totalMemoryMB', type: 'number | undefined', desc: 'Total system LPDDR5X RAM in MB, when the platform reports it.' },
      { name: 'batteryTemperatureC', type: 'number | null', desc: 'Real physical battery temperature in °C from the fuel gauge NTC thermistor.' },
      { name: 'batteryVoltageMv', type: 'number | null', desc: 'Instantaneous battery cell terminal voltage in millivolts (e.g. 4120 mV).' },
      { name: 'batteryCurrentMa', type: 'number | null', desc: 'Instantaneous current flow in mA (negative discharging, positive charging).' },
      { name: 'batteryCurrentAvgMa', type: 'number | null', desc: 'Rolling average current flow in mA from the fuel gauge.' },
      { name: 'batteryPowerWatts', type: 'number | null', desc: 'Real-time power consumption or fast-charging rate in Watts (V × |I|).' },
      { name: 'batteryHealth', type: "'GOOD' | 'OVERHEAT' | 'DEAD' | 'OVER_VOLTAGE' | 'UNSPECIFIED_FAILURE' | 'COLD' | 'UNKNOWN' | null", desc: 'Hardware battery health state reported by the PMIC.' },
      { name: 'batteryCycleCount', type: 'number | null', desc: 'Lifetime charge cycle count stored in the battery EEPROM (Android 14+).' },
      { name: 'batteryChargeCounterMah', type: 'number | null', desc: 'Remaining battery charge capacity in milliampere-hours (mAh).' },
      { name: 'batteryEnergyCounterMwh', type: 'number | null', desc: 'Remaining stored energy in milliwatt-hours (mWh).' },
      { name: 'batteryTechnology', type: 'string | null', desc: 'Battery cell chemistry string (e.g. "Li-ion").' },
      { name: 'pluggedSource', type: "'AC' | 'USB' | 'WIRELESS' | 'DOCK' | 'NONE' | null", desc: 'Specific power supply source when charging.' },
      { name: 'batteryTelemetry', type: 'BatteryTelemetry | null', desc: 'Full native battery telemetry structure including probed thermal zones.' },
      { name: 'hasRead', type: 'boolean', desc: 'Whether any power, battery, or network value has been successfully read.' },
      { name: 'error', type: 'string | null', desc: 'Error message if the last telemetry read failed, null otherwise.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'refresh',
        type: '() => Promise<void>',
        desc: 'Re-reads device power, PMIC battery fuel gauge, and network connectivity.',
        inputs: [],
        output: 'Promise<void> — Resolves once all battery, electrical, and network states are refreshed.',
      },
    ],
    example: `import { useDevice } from './src';

function PowerHUD() {
  const { batteryPercent, batteryTemperatureC, batteryVoltageMv, batteryPowerWatts, isCharging, refresh } = useDevice();
  return (
    <View>
      <Text>Battery: {batteryPercent}% {isCharging ? '(charging)' : ''}</Text>
      <Text>Temp: {batteryTemperatureC != null ? \`\${batteryTemperatureC.toFixed(1)} °C\` : '—'}</Text>
      <Text>Voltage: {batteryVoltageMv ?? '—'} mV</Text>
      <Text>Rate: {batteryPowerWatts != null ? \`\${batteryPowerWatts.toFixed(2)} W\` : '—'}</Text>
    </View>
  );
}`,
    agentNote:
      'Respect lowPowerMode: reduce sensor intervals and defer heavy work when true. Use batteryTemperatureC and batteryVoltageMv for real battery hardware metrics rather than simulating values.',
  },
  {
    id: 'useNetwork',
    name: 'useNetwork',
    category: 'system',
    chipBadge: 'expo-network',
    badgeColor: SYSTEM,
    summary: 'Connection type, address and whether traffic actually goes anywhere.',
    plain:
      'Whether the phone is online, how it is connected, and whether that connection costs money. Check isConnected before any network call, and isMetered before a large download.',
    description:
      'Reads from expo-network: interface type, IP address, reachability and airplane mode. Being connected to Wi-Fi is not the same as having internet, which is why isConnected reflects a usable route rather than merely an attached interface. isMetered marks connections where the user pays per byte, typically cellular or a hotspot.',
    signature: 'useNetwork(): NetworkTelemetry & { refreshNetwork }',
    params: [],
    returns: [
      { name: 'networkType', type: 'string', desc: 'WIFI, CELLULAR, NONE or UNKNOWN.' },
      { name: 'ipAddress', type: 'string | null', desc: 'Address on the current interface.' },
      { name: 'isConnected', type: 'boolean', desc: 'Whether a usable internet route exists, not merely an attached interface.' },
      { name: 'isMetered', type: 'boolean', desc: 'Whether the user pays for this traffic. Gate large transfers on it.' },
      { name: 'isAirplaneMode', type: 'boolean', desc: 'Whether airplane mode is on.' },
    ],
    actions: [
      {
        name: 'refreshNetwork()',
        type: '() => Promise<void>',
        desc: 'Re-runs the connectivity check immediately, for example when the app returns to the foreground.',
        output: 'Resolves once the read completes. Each sub-read fails independently, so one missing value does not blank the rest.',
      },
    ],
    example: `import { useNetwork } from './src';

async function upload(net) {
  if (!net.isConnected) return 'offline';
  if (net.isMetered) return 'ask the user before using mobile data';
  // ... proceed
}`,
    agentNote:
      'Check isConnected before every network call and isMetered before anything large. Never assume Wi-Fi means free or fast.',
  },
  {
    id: 'useVideo',
    name: 'useVideo',
    category: 'system',
    chipBadge: 'expo-video · playback',
    badgeColor: SYSTEM,
    summary: 'Playing video back, with position, seeking and thumbnails.',
    plain:
      'Plays a video file or stream. The natural partner to the camera: record a clip, hand the file to load(), and play it. It tracks position and duration so you can draw a scrubber, and can pull out frames as images for a poster or filmstrip.',
    description:
      'Wraps expo-video, the SDK 57 replacement for the removed expo-av. The hook owns the player and a screen renders VideoView with it. Position, duration, buffered position and status are polled four times a second, which is enough for a scrubber without waking the JS thread every frame. Everything reported comes from the player rather than being tracked locally, so a seek made elsewhere still shows up.',
    signature: 'useVideo(initialSource?: VideoSource): VideoState',
    params: [
      { name: 'initialSource', type: 'VideoSource', desc: 'Optional file URI, remote URL or bundled asset to load on mount. Defaults to null.' },
    ],
    returns: [
      { name: 'player', type: 'VideoPlayer', desc: 'Pass to <VideoView player={player} />. The view renders nothing without it.' },
      { name: 'hasSource', type: 'boolean', desc: 'Whether a source has been loaded.' },
      { name: 'isPlaying', type: 'boolean', desc: 'Whether playback is running.' },
      { name: 'positionSeconds', type: 'number', desc: 'Seconds into the clip. Drives a scrubber.' },
      { name: 'durationSeconds', type: 'number', desc: 'Total length. 0 until the source reports it.' },
      { name: 'bufferedSeconds', type: 'number', desc: 'How far ahead the player has buffered, which matters for a remote source.' },
      { name: 'status', type: 'string', desc: 'Player status, for example loading, readyToPlay or error.' },
      { name: 'isMuted', type: 'boolean', desc: 'Whether audio is muted.' },
      { name: 'isLooping', type: 'boolean', desc: 'Whether the clip restarts at the end.' },
      { name: 'playbackRate', type: 'number', desc: 'Speed multiplier; 1 is normal. Pitch is preserved.' },
      { name: 'volume', type: 'number', desc: 'Player volume from 0 to 1.' },
      { name: 'error', type: 'string | null', desc: 'Why the last operation failed.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'load(source, options?)',
        type: '(next: VideoSource, options?: { autoplay?: boolean; loop?: boolean; muted?: boolean }) => Promise<boolean>',
        desc: 'Swaps the player source, for example the clip useCamera just recorded.',
        inputs: [
          { name: 'next', type: 'VideoSource', desc: 'A file URI, a remote URL, a required asset, or null to clear.' },
          { name: 'options.autoplay', type: 'boolean | undefined', desc: 'Start playing as soon as the source is ready.' },
          { name: 'options.loop', type: 'boolean | undefined', desc: 'Restart from the beginning at the end.' },
          { name: 'options.muted', type: 'boolean | undefined', desc: 'Start muted.' },
        ],
        output: 'Resolves true when the source was replaced, false with the reason in error otherwise.',
      },
      {
        name: 'play() / pause() / togglePlay()',
        type: '() => void',
        desc: 'Transport controls for the player this hook owns.',
        output: 'Returns nothing; isPlaying updates on the next poll or immediately, and error is set when the player refused.',
      },
      {
        name: 'seekTo(seconds)',
        type: '(seconds: number) => void',
        desc: 'Jumps to an absolute position.',
        inputs: [{ name: 'seconds', type: 'number', desc: 'Position in seconds, clamped to 0 and the clip duration.' }],
        output: 'Returns nothing; positionSeconds updates immediately.',
      },
      {
        name: 'seekBy(seconds)',
        type: '(seconds: number) => void',
        desc: 'Moves relative to the current position.',
        inputs: [{ name: 'seconds', type: 'number', desc: 'Offset in seconds; negative rewinds.' }],
        output: 'Returns nothing; on failure error is set.',
      },
      {
        name: 'replay()',
        type: '() => void',
        desc: 'Restarts from the beginning and plays.',
        output: 'Returns nothing; positionSeconds returns to 0.',
      },
      {
        name: 'setMuted(muted) / setLoop(loop)',
        type: '(value: boolean) => void',
        desc: 'Toggles mute and looping.',
        inputs: [{ name: 'value', type: 'boolean', desc: 'True mutes, or makes the clip restart at the end.' }],
        output: 'Returns nothing; isMuted and isLooping reflect it. Muting does not change volume.',
      },
      {
        name: 'setPlaybackRate(rate)',
        type: '(rate: number) => void',
        desc: 'Sets playback speed with pitch preserved.',
        inputs: [{ name: 'rate', type: 'number', desc: 'Clamped between 0.25 and 4; 1 is normal speed.' }],
        output: 'Returns nothing; playbackRate reflects the clamped value.',
      },
      {
        name: 'setVolume(value)',
        type: '(value: number) => void',
        desc: 'Sets player volume, independently of mute.',
        inputs: [{ name: 'value', type: 'number', desc: '0 to 1; values outside are clamped.' }],
        output: 'Returns nothing; volume updates.',
      },
      {
        name: 'setKeepScreenOn(keep)',
        type: '(keep: boolean) => void',
        desc: 'Stops the screen dimming mid-clip.',
        inputs: [{ name: 'keep', type: 'boolean', desc: 'True while a video is playing; release it afterwards.' }],
        output: 'Returns nothing.',
      },
      {
        name: 'generateThumbnails(times)',
        type: '(times: number | number[]) => Promise<VideoThumbnail[]>',
        desc: 'Extracts frames as images, for a filmstrip or a poster.',
        inputs: [{ name: 'times', type: 'number | number[]', desc: 'One position in seconds, or several.' }],
        output: 'Resolves with the extracted frames, or an empty array on failure with the reason in error.',
      },
    ],
    example: `import { VideoView } from 'expo-video';
import { useCamera, useVideo } from './src';

function Playback() {
  const cam = useCamera();
  const video = useVideo();

  return (
    <View>
      <VideoView player={video.player} style={{ height: 220 }} />
      <Button
        title="Play last recording"
        disabled={!cam.lastVideoUri}
        onPress={() => cam.lastVideoUri && video.load(cam.lastVideoUri, { autoplay: true })}
      />
      <Text>{video.positionSeconds} / {video.durationSeconds} s</Text>
    </View>
  );
}`,
    agentNote:
      'The view needs the player object; passing a URI to VideoView does nothing. Turn keepScreenOn off when playback ends or the screen stays lit.',
  },
  {
    id: 'useSpeech',
    name: 'useSpeech',
    category: 'ai',
    chipBadge: 'expo-speech · text to speech',
    badgeColor: AI,
    summary: 'Speaking text aloud with the voices the phone has installed.',
    plain:
      'Reads text out loud. This is the output half of voice: useSpeechAI listens, this one talks back. Which voices exist depends on what the user has downloaded in system settings, so check the list rather than assuming a language is available.',
    description:
      'Wraps expo-speech, which drives the platform speech service. speak resolves when the engine finishes, so utterances can be awaited in sequence rather than overlapping. Text longer than maxInputLength is rejected rather than silently truncated, because a cut-off sentence is worse than an error. The hook stops the engine on unmount so speech does not continue after the screen is gone.',
    signature: 'useSpeech(): SpeechState',
    params: [],
    returns: [
      { name: 'isSpeaking', type: 'boolean', desc: 'Whether the engine is talking.' },
      { name: 'isPaused', type: 'boolean', desc: 'Whether speech is paused rather than stopped.' },
      { name: 'voices', type: 'Voice[]', desc: 'Installed voices, each with an identifier, name, language and quality.' },
      { name: 'voice', type: 'string | null', desc: 'Selected voice identifier, or null for the system default.' },
      { name: 'rate', type: 'number', desc: 'Speaking speed; 1 is normal.' },
      { name: 'pitch', type: 'number', desc: 'Voice pitch; 1 is normal.' },
      { name: 'maxInputLength', type: 'number', desc: 'Longest string the engine accepts in one call.' },
      { name: 'lastSpokenText', type: 'string | null', desc: 'Text of the most recent utterance.' },
      { name: 'error', type: 'string | null', desc: 'Why the last utterance failed.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'speak(text, options?)',
        type: '(text: string, options?: SpeakOptions) => Promise<void>',
        desc: 'Speaks the text on the platform engine. Await it to sequence utterances instead of overlapping them.',
        inputs: [
          { name: 'text', type: 'string', desc: 'What to say. Trimmed first; blank resolves immediately. Longer than maxInputLength is rejected, not truncated.' },
          { name: 'options.language', type: 'string | undefined', desc: 'BCP-47 tag such as en-GB. Defaults to the system language.' },
          { name: 'options.voice', type: 'string | undefined', desc: 'Identifier from voices; overrides language when both are given.' },
          { name: 'options.rate', type: 'number | undefined', desc: 'Speaking speed; 1 is normal. Falls back to the hook rate.' },
          { name: 'options.pitch', type: 'number | undefined', desc: 'Voice pitch; 1 is normal. Falls back to the hook pitch.' },
          { name: 'options.volume', type: 'number | undefined', desc: '0 to 1 for this utterance.' },
        ],
        output: 'Resolves when the engine finishes or is stopped. Rejects when the text is too long or the engine errors, with the message also in error.',
      },
      {
        name: 'stop()',
        type: '() => Promise<void>',
        desc: 'Stops speaking immediately and discards the queue.',
        output: 'Resolves once stopped; isSpeaking and isPaused become false. Any pending speak promise resolves rather than rejecting.',
      },
      {
        name: 'pause() / resume()',
        type: '() => Promise<void>',
        desc: 'Suspends and continues an utterance. Not supported by every engine.',
        output: 'Resolves once applied; where the engine does not support it, error explains that and isPaused is unchanged.',
      },
      {
        name: 'checkSpeaking()',
        type: '() => Promise<boolean>',
        desc: 'Asks the engine directly rather than trusting the local flag.',
        output: 'Resolves with the engine answer, which is also written to isSpeaking. False when the engine cannot be reached.',
      },
      {
        name: 'refreshVoices()',
        type: '() => Promise<Voice[]>',
        desc: 'Re-reads installed voices, which changes when the user downloads one in system settings.',
        output: 'Resolves with the list, also written to voices. Empty array on failure, with the reason in error.',
      },
      {
        name: 'voicesForLanguage(languageTag)',
        type: '(languageTag: string) => Voice[]',
        desc: 'Filters the installed voices to one language, so you can offer a real choice.',
        inputs: [{ name: 'languageTag', type: 'string', desc: "A prefix such as 'en' or a full tag such as 'en-GB'. Matched case-insensitively." }],
        output: 'Returns the matching voices; empty when none are installed for that language.',
      },
      {
        name: 'setVoice(id) / setRate(n) / setPitch(n)',
        type: '(value: string | null | number) => void',
        desc: 'Defaults applied to later calls to speak, unless that call overrides them.',
        inputs: [{ name: 'value', type: 'string | null | number', desc: 'A voice identifier from voices, or null for the system default; for rate and pitch, 1 is normal.' }],
        output: 'Returns nothing; voice, rate and pitch update.',
      },
    ],
    example: `import { useSpeech, useGeminiNano } from './src';

function TalkBack() {
  const speech = useSpeech();
  const nano = useGeminiNano();

  const answer = async () => {
    const reply = await nano.generate('Describe the thermal state in one sentence.');
    await speech.speak(reply.text, { rate: 0.95 });
  };
  return <Button title="Ask and speak" onPress={answer} />;
}`,
    agentNote:
      'Await speak rather than firing several in a row, or they queue unpredictably. Check voices before promising a language; coverage depends on what the user installed.',
  },
  {
    id: 'useMediaLibrary',
    name: 'useMediaLibrary',
    category: 'system',
    chipBadge: 'expo-media-library · gallery',
    badgeColor: SYSTEM,
    summary: 'Saving captures to the gallery, and reading what is there.',
    plain:
      'Puts a photo or video into the user\'s own gallery, where it survives and other apps can see it. Without this a capture sits in the app\'s cache and disappears when the system needs space. Also lists recent items and can delete one.',
    description:
      'Wraps expo-media-library. SDK 57 uses the class API (Asset.create, Album.create, Query) rather than the deprecated createAssetAsync helpers, which now throw at runtime. Asset fields are async accessors, so the hook flattens each into a plain SavedMedia object that a list can render directly. Permission is more subtle than a yes or no on modern Android: access is granted per media type, and the user can share only selected items, which is what hasLimitedAccess reports.',
    signature: 'useMediaLibrary(): MediaLibraryState',
    params: [],
    returns: [
      { name: 'permissionGranted', type: 'boolean', desc: 'Whether library access was granted.' },
      { name: 'hasLimitedAccess', type: 'boolean', desc: 'Android 13+: the user shared only selected items, so the library is not fully visible.' },
      { name: 'isSaving', type: 'boolean', desc: 'True while a file is being written.' },
      { name: 'isLoading', type: 'boolean', desc: 'True while the library is being read.' },
      { name: 'recent', type: 'SavedMedia[]', desc: 'Newest items from the last loadRecent call, most recent first.' },
      { name: 'lastSaved', type: 'SavedMedia | null', desc: 'The item this app most recently wrote.' },
      { name: 'error', type: 'string | null', desc: 'Why the last operation failed.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'requestPermission(writeOnly?)',
        type: '(writeOnly?: boolean) => Promise<boolean>',
        desc: 'Asks for media library access.',
        inputs: [{ name: 'writeOnly', type: 'boolean | undefined', desc: 'True asks only for write access, for an app that saves but never browses. Defaults to false.' }],
        output: 'Resolves true when granted. hasLimitedAccess becomes true when the user shared only selected items, so a grant is not full access.',
      },
      {
        name: 'save(localUri, albumName?)',
        type: '(localUri: string, albumName?: string) => Promise<SavedMedia | null>',
        desc: 'Copies a capture out of the app cache into the user media store, where it survives.',
        inputs: [
          { name: 'localUri', type: 'string', desc: 'The file useCamera or useAudio returned.' },
          { name: 'albumName', type: 'string | undefined', desc: 'Album to file it under. Created when it does not exist.' },
        ],
        output: 'Resolves with { id, uri, filename, width, height, durationSeconds, creationTime }, or null when permission was denied or the write failed.',
      },
      {
        name: 'loadRecent(limit?)',
        type: '(limit?: number) => Promise<SavedMedia[]>',
        desc: 'Reads the newest items in the library, newest first.',
        inputs: [{ name: 'limit', type: 'number | undefined', desc: 'How many items to read. Defaults to 20.' }],
        output: 'Resolves with the items, also written to recent. Empty array when permission was denied.',
      },
      {
        name: 'remove(media)',
        type: '(media: SavedMedia) => Promise<boolean>',
        desc: 'Deletes an item from the device. The system may show its own confirmation.',
        inputs: [{ name: 'media', type: 'SavedMedia', desc: 'An item from recent or lastSaved.' }],
        output: 'Resolves true when the item was deleted, and it is dropped from recent.',
      },
    ],
    example: `import { useCamera, useMediaLibrary } from './src';

function Keep() {
  const cam = useCamera();
  const library = useMediaLibrary();

  const shoot = async () => {
    const photo = await cam.takePicture();
    if (photo) await library.save(photo.uri, 'PixelKit');
  };
  return <Button title="Capture and keep" onPress={shoot} />;
}`,
    agentNote:
      'A capture is not kept until you call save; cache files are collected by the system. Ask with writeOnly when you only need to save, and handle hasLimitedAccess rather than assuming the whole library is readable.',
  },
  {
    id: 'useCellular',
    name: 'useCellular',
    category: 'system',
    chipBadge: 'expo-cellular · modem',
    badgeColor: SYSTEM,
    summary: 'Carrier, radio generation and network codes from the modem.',
    plain:
      'Tells you whether the phone is on 5G or something slower, and which carrier is serving it. useNetwork can only say the connection is cellular; this says what kind, which is what you need before deciding to stream or download something large.',
    description:
      'Wraps expo-cellular. generation reflects the current data connection, so it changes as the phone moves and reads unknown when there is no cellular data attached, including on Wi-Fi. Carrier name and the mobile country and network codes need the phone-state permission on Android; without it they stay null rather than being guessed. The country and network codes together identify a carrier globally, which is more reliable than matching on the display name.',
    signature: 'useCellular(): CellularState',
    params: [],
    returns: [
      { name: 'generation', type: "'unknown' | '2G' | '3G' | '4G' | '5G'", desc: 'Radio generation of the current data connection.' },
      { name: 'is5G', type: 'boolean', desc: 'Convenience for generation === "5G".' },
      { name: 'carrierName', type: 'string | null', desc: 'Carrier display name. Null without the phone-state permission.' },
      { name: 'isoCountryCode', type: 'string | null', desc: 'ISO country of the SIM.' },
      { name: 'mobileCountryCode', type: 'string | null', desc: 'First half of the global carrier identifier.' },
      { name: 'mobileNetworkCode', type: 'string | null', desc: 'Second half. Match on this pair rather than the display name.' },
      { name: 'allowsVoip', type: 'boolean | null', desc: 'Whether the carrier permits voice over IP. Null when undetermined.' },
      { name: 'permissionGranted', type: 'boolean', desc: 'Whether the phone-state permission was granted.' },
      { name: 'error', type: 'string | null', desc: 'Why the last read failed.' },
      SOURCE_FIELD,
    ],
    actions: [
      {
        name: 'refresh()',
        type: '() => Promise<void>',
        desc: 'Re-reads everything the platform answers without prompting.',
        output: 'Resolves once generation, carrier and network codes have been updated. Values that need the phone-state permission stay null without it.',
      },
      {
        name: 'requestPermission()',
        type: '() => Promise<boolean>',
        desc: 'Asks for the phone-state permission, which unlocks carrier name and network codes on Android.',
        output: 'Resolves true when granted, and refreshes automatically. Generation is readable without it.',
      },
    ],
    example: `import { useCellular, useNetwork } from './src';

function ShouldStream() {
  const net = useNetwork();
  const cell = useCellular();
  if (!net.isConnected) return <Text>Offline</Text>;
  if (net.isMetered && !cell.is5G) return <Text>On {cell.generation}, ask before streaming</Text>;
  return <Text>Fine to stream</Text>;
}`,
    agentNote:
      'Pair with useNetwork().isMetered: generation tells you how fast, metered tells you who pays. Do not request phone state unless you actually need the carrier.',
  },
];

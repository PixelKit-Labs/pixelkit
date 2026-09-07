/**
 * @file docsData.ts
 * @description Content for the in-app Docs tab, kept apart from its presentation.
 *
 * Every entry documents one exported hook: what it is for in plain language, how it works
 * underneath, the arguments it takes, the values it returns, and the functions it gives you.
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
  type: "'hardware' | 'derived' | 'simulated' | 'unavailable'",
  desc: 'Where the numbers came from. Show this to the user; never present unavailable data as real.',
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
      { name: 'benchmarkCPU()', type: '() => Promise<number>', desc: 'Runs a real single-threaded prime sieve on the JS thread and resolves with its duration in milliseconds. Blocks the UI while it runs.' },
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
      { name: 'benchmarkTPU()', type: '() => Promise<TPUAcceleration>', desc: 'Runs a 256x256 float matrix multiply in JavaScript and reports it explicitly as a CPU-fallback measurement.' },
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
      { name: 'purgeCaches()', type: '() => void', desc: 'Requests a garbage collection and re-reads the numbers. Advisory only; the runtime decides when to actually collect.' },
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
      { name: 'reportWorkDuration()', type: '(ms: number) => void', desc: 'Tells the platform performance hint system how long a frame of work took, so it can scale clocks appropriately.' },
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
    summary: 'The eight-LED ring around the rear camera flash.',
    plain:
      'Controls the coloured lights around the rear camera. Useful as a glanceable signal when the phone is face down: a colour for an incoming call, a pulse while an assistant is thinking. Whether it lights physically depends on availability.',
    description:
      'Android 17 exposes the array as eight lights of type Light.LIGHT_TYPE_APPLICATION, but every lights session needs CONTROL_DEVICE_LIGHTS, which is signature|privileged and cannot be held by a normal app. PixelKit therefore ships a small Java daemon that runs as the adb shell user and listens on 127.0.0.1:11080; start it with npm run hilight:daemon. With the daemon up, availability is hardware and the calls drive real LEDs. Without it, availability is simulated: the colour and pattern state is still tracked and mirrored on screen with haptics, and nothing pretends the lights are on.',
    signature: 'useHiLight(): HiLightState',
    params: [],
    returns: [
      { name: 'availability', type: "'hardware' | 'simulated' | 'unsupported'", desc: 'Whether calls reach real LEDs, are mirrored on screen, or the device has no array.' },
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
      { name: 'refreshDaemonStatus()', type: '() => Promise<boolean>', desc: 'Re-checks the daemon immediately instead of waiting for the next poll.' },
      { name: 'setColor(hex)', type: '(hexColor: string) => void', desc: 'Sets a solid colour and turns the ring on.' },
      { name: 'setMode(mode)', type: '(mode: HiLightMode) => void', desc: 'Switches pattern; passing off extinguishes the ring.' },
      { name: 'setBrightness(level)', type: '(level: number) => void', desc: 'Scales output between 0 and 1.' },
      { name: 'triggerGeminiPulse(ms?)', type: '(durationMs?: number) => void', desc: 'Cyan hold for the duration, then clears itself. Pair with a model call.' },
      { name: 'triggerContactAlert(hex, ms?)', type: '(hexColor: string, durationMs?: number) => void', desc: 'Coloured hold for a caller or event, then clears itself.' },
      { name: 'turnOff()', type: '() => void', desc: 'Clears the ring and cancels any pending timer.' },
      { name: 'toggle()', type: '() => void', desc: 'Switches between off and a default colour.' },
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
      'Read availability before promising light. Only hardware drives the LEDs; simulated is an on-screen mirror and must be labelled as such.',
  },
  {
    id: 'useUWB',
    name: 'useUWB',
    category: 'pro',
    chipBadge: 'Ultra-Wideband (Pro)',
    badgeColor: PRO,
    summary: 'Ultra-wideband radio state, and simulated spatial targets.',
    plain:
      'Reports whether this phone has the short-range precision radio used for things like finding a tag or unlocking a car, and whether it is switched on. The chip facts are real; the tracked targets are placeholders until ranging sessions are implemented.',
    description:
      'Chip presence, enabled state and chip id are queried from Android UwbManager and PackageManager through the native module, and carry source hardware. Ranging itself needs the Android 16 RangingManager session API, which is not wired yet, so activeTargets is simulated and clearly labelled. Note that this device does not declare the android.hardware.ranging feature, which is what rangingApiSupported reflects.',
    signature: 'useUWB(): UWBState',
    params: [],
    returns: [
      { name: 'isSupported', type: 'boolean', desc: 'Whether the UWB chip exists on this device.' },
      { name: 'isEnabled', type: 'boolean', desc: 'Whether the radio is switched on in system settings.' },
      { name: 'chipId', type: 'string | null', desc: 'Chip identifier the platform reports, "default" on this Pixel.' },
      { name: 'rangingApiSupported', type: 'boolean', desc: 'Whether the Android 16 RangingManager feature is declared. False on this unit.' },
      { name: 'isRanging', type: 'boolean', desc: 'Whether a ranging session is running.' },
      { name: 'activeTargets', type: 'UWBSpatialTarget[]', desc: 'Distance, azimuth, elevation and quality per target. Simulated today.' },
      { name: 'isSupportedOnDevice', type: 'boolean', desc: 'Alias of isSupported kept for older call sites.' },
      SOURCE_FIELD,
    ],
    actions: [
      { name: 'startRanging()', type: '() => Promise<void>', desc: 'Begins a simulated ranging session and populates activeTargets.' },
      { name: 'stopRanging()', type: '() => void', desc: 'Ends the session and clears targets.' },
    ],
    example: `import { useUWB } from './src';

function Radar() {
  const { isSupported, activeTargets, startRanging } = useUWB();
  if (!isSupported) return <Text>No UWB radio</Text>;
  return <Button title="Start ranging (simulated)" onPress={startRanging} />;
}`,
    agentNote:
      'Chip fields are real; distances are not. Label any UI built on activeTargets as simulated until RangingManager lands.',
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
      { name: 'download()', type: '() => Promise<NanoStatus>', desc: 'Asks the system to fetch the model weights; progress arrives in downloadedBytes.' },
      { name: 'warmup()', type: '() => Promise<number | null>', desc: 'Loads the model ahead of the first prompt so the first reply is not slow.' },
      { name: 'sendMessage(text)', type: '(prompt: string) => Promise<void>', desc: 'Sends a chat turn with streaming, appending both the question and the reply to messages.' },
      { name: 'generate(prompt, options?)', type: '(prompt, options?) => Promise<NanoResult>', desc: 'One-shot generation outside the conversation, with optional image and sampling controls.' },
      { name: 'countTokens(prompt)', type: '(prompt, options?) => Promise<number | null>', desc: 'Measures a prompt against the token limit before sending it.' },
      { name: 'clearMessages()', type: '() => void', desc: 'Empties the conversation.' },
      { name: 'setModelConfig(stage, pref)', type: "(stage: 'stable' | 'preview', preference: 'full' | 'fast') => Promise<void>", desc: 'Chooses the model track and whether to favour quality or latency.' },
      { name: 'refresh()', type: '() => Promise<void>', desc: 'Re-reads status and model facts from the system.' },
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
      { name: 'sendMessage(prompt)', type: '(prompt: string) => Promise<void>', desc: 'Sends a turn and appends the reply with its latency and token count.' },
      { name: 'clearMessages()', type: '() => void', desc: 'Clears history and starts a fresh chat session.' },
      { name: 'setApiKey(key)', type: '(key: string | null) => void', desc: 'Swaps the key and resets the session.' },
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
      { name: 'startListening()', type: '() => Promise<boolean>', desc: 'Requests permission if needed and opens the microphone.' },
      { name: 'stopListeningAndTranscribe()', type: '() => Promise<SpeechTranscriptionResult | null>', desc: 'Closes the microphone and resolves with the transcript.' },
      { name: 'setRecognitionMode(mode)', type: "(mode: 'offline' | 'cloud') => void", desc: 'Chooses the engine for the next run.' },
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
      { name: 'summarize(text, options?)', type: "(text, { inputType, outputType }?) => Promise<SummarizeResult>", desc: 'Condenses an article or a conversation into one, two or three bullets.' },
      { name: 'proofread(text)', type: '(text: string) => Promise<ProofreadResult>', desc: 'Fixes grammar, punctuation and wording. Good for cleaning up dictated text.' },
      { name: 'rewrite(text, tone)', type: "(text, tone: 'elaborate' | 'emojify' | 'shorten' | 'friendly' | 'professional' | 'rephrase') => Promise<RewriteResult>", desc: 'Restates the same content in a different register.' },
      { name: 'describeImage(input, style?)', type: "(imageInput, style?) => Promise<ImageDescriptionResult>", desc: 'Describes an image locally. Useful for alt text without a network call.' },
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
      { name: 'identifyLanguage(text)', type: '(text: string) => Promise<LanguageIdResult>', desc: 'Detects the language, with confidence. Run this before translating unknown input.' },
      { name: 'translate(text, from, to)', type: '(text, sourceLang, targetLang) => Promise<TranslationResult>', desc: 'Translates offline. The first call for a pair downloads its model.' },
      { name: 'suggestReplies(history)', type: '(history: { text, isLocalUser?, timestamp? }[]) => Promise<SmartReplyResult>', desc: 'Proposes short replies from recent messages.' },
      { name: 'extractEntities(text)', type: '(text: string) => Promise<EntityExtractionResult>', desc: 'Finds dates, addresses, money, phone numbers, flight and tracking numbers.' },
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
      { name: 'captureAndAnalyze(useCamera)', type: '(fromCamera: boolean) => Promise<void>', desc: 'Takes or picks a photo and sends it to Gemini for description and labels.' },
      { name: 'pickImage()', type: '() => Promise<string | null>', desc: 'Opens the picker and loads an image without analysing it.' },
      { name: 'recognizeText(image)', type: '(imageInput: string) => Promise<TextRecognitionResult>', desc: 'Reads text from an image, on the device.' },
      { name: 'scanBarcodes(image)', type: '(imageInput: string) => Promise<BarcodeScanResult>', desc: 'Finds and decodes 1D and 2D codes.' },
      { name: 'detectFaces(image)', type: '(imageInput: string) => Promise<FaceDetectionResult>', desc: 'Locates faces and their attributes.' },
      { name: 'detectObjects(image)', type: '(imageInput: string) => Promise<ObjectDetectionResult>', desc: 'Detects and tracks objects with labels.' },
      { name: 'detectPose(image)', type: '(imageInput: string) => Promise<PoseDetectionResult>', desc: 'Estimates body pose landmarks.' },
      { name: 'segmentSubject(image)', type: '(imageInput: string) => Promise<SubjectSegmentationResult>', desc: 'Separates the main subject from the background.' },
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
      { name: 'intervalMs', type: 'number', desc: 'Sampling period in milliseconds, defaulting to 200. Use 16 to 33 for animation, 500 or more for background monitoring.' },
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
      { name: 'selection()', type: '() => Promise<void>', desc: 'Faint tick for moving between options.' },
      { name: 'light() / medium() / heavy()', type: '() => Promise<void>', desc: 'Impact taps of increasing weight for presses and confirmations.' },
      { name: 'success() / warning() / error()', type: '() => Promise<void>', desc: 'Notification patterns that carry meaning; use them consistently.' },
      { name: 'playEnvelope(points, sharpness?)', type: '(points, initialSharpness?) => Promise<void>', desc: 'Plays a custom waveform from intensity and time control points. Must end at zero.' },
      { name: 'playPrimitives(steps)', type: '(steps) => Promise<void>', desc: 'Chains hardware primitives with scale and delay into a composition.' },
      { name: 'cancel()', type: '() => Promise<void>', desc: 'Stops any vibration immediately.' },
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
      { name: 'handleCameraReady()', type: '() => Promise<void>', desc: 'Pass to the view\'s onCameraReady so lens and size lists can be read.' },
      { name: 'takePicture(options?)', type: '({ quality?, base64?, exif?, shutterSound? }?) => Promise<CapturedPhoto | null>', desc: 'Takes a still and resolves with the file. Pass base64 when feeding it to a model.' },
      { name: 'startRecording(options?)', type: '({ maxDurationSeconds?, maxFileSizeBytes?, mirror? }?) => Promise<string | null>', desc: 'Records video; resolves with the file when recording ends. Switches the view to video mode.' },
      { name: 'stopRecording()', type: '() => void', desc: 'Ends the recording, which resolves the promise from startRecording.' },
      { name: 'toggleFacing()', type: '() => void', desc: 'Switches between the front and rear camera.' },
      { name: 'setZoom(fraction)', type: '(fraction: number) => void', desc: 'Sets zoom as a 0 to 1 fraction of the lens range.' },
      { name: 'setZoomStep(step, total?)', type: '(step: number, totalSteps?: number) => void', desc: 'Evenly spaced zoom stops, for a control with discrete steps.' },
      { name: 'setFlash(mode)', type: "(mode: 'auto' | 'on' | 'off') => void", desc: 'Chooses flash behaviour for the next capture.' },
      { name: 'toggleTorch()', type: '() => void', desc: 'Turns the continuous light on or off.' },
      { name: 'setMode(mode)', type: "(mode: 'picture' | 'video') => void", desc: 'Switches the view between stills and video.' },
      { name: 'pausePreview() / resumePreview()', type: '() => Promise<void>', desc: 'Freezes or restarts the preview without tearing the camera down.' },
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
      { name: 'setTorch(on, level?)', type: '(on: boolean, strengthLevel?: number) => Promise<void>', desc: 'Switches the light, optionally at a specific brightness step.' },
      { name: 'toggleTorch()', type: '() => Promise<void>', desc: 'Flips the current state.' },
      { name: 'startStrobe()', type: '() => Promise<void>', desc: 'Begins an SOS pattern.' },
      { name: 'stopStrobe()', type: '() => Promise<void>', desc: 'Stops the pattern and turns the light off.' },
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
      { name: 'authenticate(reason)', type: '(promptMessage: string) => Promise<boolean>', desc: 'Shows the system prompt and resolves true only on success. The reason string is displayed to the user.' },
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
      { name: 'saveSecureItem(key, value)', type: '(key: string, value: string) => Promise<boolean>', desc: 'Encrypts and stores a value. This is the only sanctioned place for secrets.' },
      { name: 'getSecureItem(key)', type: '(key: string) => Promise<string | null>', desc: 'Decrypts and returns a stored value, or null.' },
      { name: 'deleteSecureItem(key)', type: '(key: string) => Promise<boolean>', desc: 'Removes a stored value.' },
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
    summary: 'Bluetooth adapter state, paired devices, and a simulated scan.',
    plain:
      'Reports whether Bluetooth is on, which devices are already paired, and whether this phone supports the newer precise-distance feature. Scanning for nearby devices is not real yet and is labelled as simulated.',
    description:
      'Adapter state, Channel Sounding support and the bonded device list are read from Android BluetoothAdapter through the native module and carry source hardware. Live peripheral discovery needs a dedicated BLE library that is not linked yet, so peripherals and their signal strengths are simulated and every surface that shows them says so.',
    signature: 'useBLE(): BLEState',
    params: [],
    returns: [
      { name: 'isSupported', type: 'boolean', desc: 'Whether the device has Bluetooth Low Energy.' },
      { name: 'isEnabled', type: 'boolean', desc: 'Whether Bluetooth is switched on in settings.' },
      { name: 'state', type: "'ON' | 'OFF' | 'TURNING_ON' | 'TURNING_OFF'", desc: 'Adapter state, including the transitional values.' },
      { name: 'channelSounding', type: 'boolean', desc: 'Whether Bluetooth 5.4 Channel Sounding, used for accurate distance, is supported.' },
      { name: 'bondedDevices', type: 'BondedDevice[]', desc: 'Devices already paired with this phone. Real data.' },
      { name: 'isScanning', type: 'boolean', desc: 'Whether a scan is running.' },
      { name: 'peripherals', type: 'BLEPeripheral[]', desc: 'Discovered devices with signal strength. Simulated today.' },
      SOURCE_FIELD,
    ],
    actions: [
      { name: 'startScan()', type: '() => void', desc: 'Starts a simulated discovery scan.' },
      { name: 'stopScan()', type: '() => void', desc: 'Stops the scan.' },
    ],
    example: `import { useBLE } from './src';

function Bluetooth() {
  const { isEnabled, bondedDevices } = useBLE();
  return <Text>{isEnabled ? \`\${bondedDevices.length} paired\` : 'Bluetooth off'}</Text>;
}`,
    agentNote:
      'bondedDevices is real, peripherals is not. Label any nearby-device interface as simulated until a BLE library is linked.',
  },
  {
    id: 'useNFC',
    name: 'useNFC',
    category: 'radios',
    chipBadge: 'NfcAdapter · Observe Mode',
    badgeColor: RADIO,
    summary: 'NFC radio state, with simulated tag reads.',
    plain:
      'Tells you whether the contactless radio is present and switched on. Actually reading a tag is not implemented yet, so the scan returns placeholder data that is labelled simulated.',
    description:
      'Adapter presence, enabled state, antenna state and Android 15 Observe Mode support are read from NfcAdapter through the native module, with source hardware. Tag reading and writing need a dedicated NFC library, so lastScannedTag comes from a simulation and is marked as such everywhere it appears.',
    signature: 'useNFC(): NFCState',
    params: [],
    returns: [
      { name: 'isSupported', type: 'boolean', desc: 'Whether this device has NFC.' },
      { name: 'isEnabled', type: 'boolean', desc: 'Whether the radio is switched on in settings.' },
      { name: 'observeModeSupported', type: 'boolean', desc: 'Whether Android 15 Observe Mode is available, which lets an app watch reader field activity.' },
      { name: 'antennaState', type: "'ENABLED' | 'DISABLED' | 'UNAVAILABLE'", desc: 'Current antenna state.' },
      { name: 'isScanning', type: 'boolean', desc: 'Whether tag discovery is running.' },
      { name: 'lastScannedTag', type: 'NFCTag | null', desc: 'Most recent tag payload. Simulated today.' },
      SOURCE_FIELD,
    ],
    actions: [
      { name: 'startScan()', type: '() => void', desc: 'Begins simulated tag discovery.' },
      { name: 'stopScan()', type: '() => void', desc: 'Stops discovery.' },
    ],
    example: `import { useNFC } from './src';

function Nfc() {
  const { isEnabled, lastScannedTag, startScan } = useNFC();
  if (!isEnabled) return <Text>Turn on NFC</Text>;
  return <Button title="Scan (simulated)" onPress={startScan} />;
}`,
    agentNote:
      'Radio state is real, tag payloads are not. Do not build a real workflow on lastScannedTag yet.',
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
      { name: 'refresh()', type: '() => void', desc: 'Forces an immediate re-read instead of waiting for the next poll.' },
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
      { name: 'refreshLocation()', type: '() => Promise<void>', desc: 'Forces a fresh high-accuracy fix instead of waiting for the next update.' },
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
      { name: 'startRecording(options?)', type: '({ maxDurationSeconds?, quality? }?) => Promise<boolean>', desc: 'Requests permission if needed and starts a take, optionally stopping itself after a set number of seconds.' },
      { name: 'pauseRecording()', type: '() => boolean', desc: 'Pauses without finalising the file.' },
      { name: 'resumeRecording()', type: '() => boolean', desc: 'Continues the same take after a pause.' },
      { name: 'stopRecording()', type: '() => Promise<string | null>', desc: 'Finalises the take and resolves with the file URI.' },
      { name: 'setQuality(q)', type: "(quality: 'speech' | 'studio') => void", desc: 'Chooses the capture profile for the next take.' },
      { name: 'refreshInputs()', type: '() => RecordingInput[]', desc: 'Re-reads the available microphones. Only valid after the recorder is prepared.' },
      { name: 'selectInput(uid)', type: '(uid: string) => boolean', desc: 'Switches to a specific microphone, such as an attached USB one.' },
      { name: 'setRoute(route)', type: "(route: 'speaker' | 'earpiece') => Promise<void>", desc: 'Sends playback to the loudspeaker or the call earpiece.' },
      { name: 'playLastRecording(uri?)', type: '(uri?: string) => Promise<boolean>', desc: 'Plays the most recent recording, or a specific file.' },
      { name: 'pausePlayback()', type: '() => void', desc: 'Pauses playback in place.' },
      { name: 'stopPlayback()', type: '() => Promise<void>', desc: 'Stops playback and rewinds to the start.' },
      { name: 'seekPlayback(seconds)', type: '(seconds: number) => Promise<void>', desc: 'Jumps to a position.' },
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
      { name: 'setPreferredRefreshRate(hz)', type: '(hz: number) => Promise<void>', desc: 'Requests a refresh rate. Advisory; read refreshRateHz back to see what happened.' },
      { name: 'setScreenBrightness(v)', type: '(value: number) => Promise<void>', desc: 'Sets brightness from 0 to 1 for this app.' },
      { name: 'toggleKeepAwake()', type: '() => void', desc: 'Holds the screen on or releases it. Release it when you no longer need it.' },
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
    chipBadge: 'Battery · power · identity',
    badgeColor: SYSTEM,
    summary: 'Device identity, battery level and charging state.',
    plain:
      'Basic facts about the phone and its power: which model it is, how much battery is left, whether it is charging, and whether battery saver is on. Use battery saver as a signal to do less work.',
    description:
      'Identity comes from expo-device and power state from expo-battery, with listeners so the values update as the battery drains or a charger is attached rather than being read once. lowPowerMode reflects Android Battery Saver, which is a strong hint to reduce polling, animation and background work.',
    signature: 'useDevice(): DeviceTelemetry',
    params: [],
    returns: [
      { name: 'modelName', type: 'string', desc: 'Commercial model name.' },
      { name: 'brand', type: 'string', desc: 'Manufacturer.' },
      { name: 'osVersion', type: 'string', desc: 'Android release string.' },
      { name: 'batteryLevel', type: 'number', desc: 'Charge remaining, 0 to 100.' },
      { name: 'isCharging', type: 'boolean', desc: 'Whether a charger is attached.' },
      { name: 'lowPowerMode', type: 'boolean', desc: 'Whether Battery Saver is on. Treat as an instruction to do less.' },
      { name: 'networkType', type: 'string', desc: 'Active connection type.' },
      { name: 'isConnected', type: 'boolean', desc: 'Whether there is a working internet route.' },
      { name: 'totalMemoryMB', type: 'number | undefined', desc: 'Total RAM, when the platform reports it.' },
    ],
    actions: [],
    example: `import { useDevice } from './src';

function Battery() {
  const { batteryLevel, isCharging, lowPowerMode } = useDevice();
  return <Text>{batteryLevel}%{isCharging ? ' charging' : ''}{lowPowerMode ? ' · saver' : ''}</Text>;
}`,
    agentNote:
      'Respect lowPowerMode: reduce sensor intervals and defer heavy work when it is true.',
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
      { name: 'refreshNetwork()', type: '() => Promise<void>', desc: 'Re-runs the connectivity check immediately.' },
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
      { name: 'load(source, options?)', type: '(source, { autoplay?, loop?, muted? }?) => Promise<boolean>', desc: 'Swaps the source, for example the clip the camera just recorded.' },
      { name: 'play() / pause() / togglePlay()', type: '() => void', desc: 'Transport controls.' },
      { name: 'seekTo(seconds)', type: '(seconds: number) => void', desc: 'Jumps to an absolute position, clamped to the duration.' },
      { name: 'seekBy(seconds)', type: '(seconds: number) => void', desc: 'Moves relative to now; negative rewinds.' },
      { name: 'replay()', type: '() => void', desc: 'Restarts from the beginning.' },
      { name: 'setMuted(b) / setLoop(b)', type: '(value: boolean) => void', desc: 'Toggles mute and looping.' },
      { name: 'setPlaybackRate(rate)', type: '(rate: number) => void', desc: 'Sets speed between 0.25 and 4.' },
      { name: 'setVolume(v)', type: '(value: number) => void', desc: 'Sets volume from 0 to 1.' },
      { name: 'setKeepScreenOn(b)', type: '(keep: boolean) => void', desc: 'Stops the screen dimming mid-clip. Release it when playback ends.' },
      { name: 'generateThumbnails(times)', type: '(times: number | number[]) => Promise<VideoThumbnail[]>', desc: 'Extracts frames as images for a poster or filmstrip.' },
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
      { name: 'speak(text, options?)', type: '(text, { language?, voice?, rate?, pitch?, volume? }?) => Promise<void>', desc: 'Speaks the text and resolves when the engine finishes. Rejects if the text is too long.' },
      { name: 'stop()', type: '() => Promise<void>', desc: 'Stops immediately and discards the queue.' },
      { name: 'pause() / resume()', type: '() => Promise<void>', desc: 'Suspends and continues. Not supported on every engine.' },
      { name: 'checkSpeaking()', type: '() => Promise<boolean>', desc: 'Asks the engine directly rather than trusting the local flag.' },
      { name: 'refreshVoices()', type: '() => Promise<Voice[]>', desc: 'Re-reads installed voices, which changes when the user downloads one.' },
      { name: 'voicesForLanguage(tag)', type: '(languageTag: string) => Voice[]', desc: 'Filters the list to one language, for example every English voice.' },
      { name: 'setVoice / setRate / setPitch', type: '(value) => void', desc: 'Defaults applied to later calls to speak.' },
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
      { name: 'requestPermission(writeOnly?)', type: '(writeOnly?: boolean) => Promise<boolean>', desc: 'Asks for access. Pass true when the app only needs to save, which is a smaller ask.' },
      { name: 'save(localUri, album?)', type: '(localUri: string, albumName?: string) => Promise<SavedMedia | null>', desc: 'Copies a capture into the gallery, creating the album if it does not exist.' },
      { name: 'loadRecent(limit?)', type: '(limit?: number) => Promise<SavedMedia[]>', desc: 'Reads the newest items, 20 by default.' },
      { name: 'remove(media)', type: '(media: SavedMedia) => Promise<boolean>', desc: 'Deletes an item. The system may show its own confirmation.' },
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
      { name: 'refresh()', type: '() => Promise<void>', desc: 'Re-reads everything the platform answers without prompting.' },
      { name: 'requestPermission()', type: '() => Promise<boolean>', desc: 'Asks for phone state, which unlocks carrier and network codes.' },
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

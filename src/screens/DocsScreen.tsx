/**
 * @file DocsScreen.tsx
 * @description Interactive documentation browser and AI Guidance Hub.
 * Provides live on-device API references, hardware silicon mappings,
 * copyable code snippets, and operational primers for AI coding agents on Pixel 11 Pro.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useHaptics } from '../hardware/useHaptics';
import { HapticButton } from '../components/HapticButton';
import { Colors } from '../theme/colors';

interface DocModule {
  id: string;
  name: string;
  category: 'silicon' | 'pro' | 'ai' | 'sensors' | 'radios' | 'system';
  chipBadge: string;
  badgeColor: string;
  summary: string;
  description: string;
  signature: string;
  returns: string[];
  example: string;
  aiTip: string;
}

const DOC_MODULES: DocModule[] = [
  // Silicon & Compute
  {
    id: 'useCPU',
    name: 'useCPU',
    category: 'silicon',
    chipBadge: 'Tensor G6 · /proc/cpuinfo + cpufreq',
    badgeColor: '#B794FF',
    summary: 'Real 7-core topology (1x C1-Ultra 4.11 GHz + 4x C1-Pro 3.38 GHz + 2x C1-Pro 2.65 GHz), per-core MHz, governor, and load.',
    description: 'Reads core part ids from /proc/cpuinfo and frequencies from cpufreq sysfs through the PixelNative module. cpuLoadPercent is cluster frequency utilisation (HW); appCpuPercent is this process\'s CPU share (DERIVED). Android hides system /proc/stat, so no system load is invented. benchmarkCPU runs a real JS prime sieve.',
    signature: 'useCPU(): CPUState',
    returns: [
      'coreTopology: string  // built from real clusters',
      'coreCount: number',
      'cpuLoadPercent: number | null  // HW',
      'appCpuPercent: number | null   // DERIVED',
      'cores: { index, name, curMHz, maxMHz }[]',
      'governorMode: string  // e.g. "sched_pixel"',
      'benchmarkCPU(): Promise<number>',
      "source: 'hardware' | 'unavailable'",
    ],
    example: `import { useCPU } from './src';

function CPUWidget() {
  const { coreTopology, cpuLoadPercent, cores, benchmarkCPU } = useCPU();
  return (
    <View>
      <Text>{coreTopology}</Text>
      <Text>{cpuLoadPercent ?? '—'}% · {cores.map(c => c.curMHz).join('/')} MHz</Text>
      <Button title="JS benchmark" onPress={() => benchmarkCPU()} />
    </View>
  );
}`,
    aiTip: 'AI Tip: Values are null until the PixelNative module answers; never substitute a default number. cpuLoadPercent is frequency utilisation, not scheduler load.',
  },
  {
    id: 'useGPU',
    name: 'useGPU',
    category: 'silicon',
    chipBadge: 'PowerVR CXTP-48-1536 · Vulkan 1.4',
    badgeColor: '#B794FF',
    summary: 'GPU identity from EGL and real Choreographer frame pacing (presented FPS, avg/max frame interval, jank).',
    description: 'GL_RENDERER/GL_VENDOR/GL_VERSION are read through an offscreen EGL context and the Vulkan version from the system feature. Frame timing is measured on the UI thread with Choreographer in 1 s windows. GPU memory is not exposed by Android and is null.',
    signature: 'useGPU(): GPUState',
    returns: [
      'gpuRenderer: string | null',
      'graphicsApi: string | null',
      'frameRenderTimeMs: number | null  // avg interval, last 1 s',
      'measuredFps: number | null',
      'droppedFrameCount: number  // cumulative jank',
      'targetBudgetMs: number  // 8.33 @ 120 Hz',
      'isStuttering: boolean',
      'gpuMemoryUsageMB: null',
    ],
    example: `import { useGPU } from './src';

function GPUHUD() {
  const { frameRenderTimeMs, measuredFps, targetBudgetMs, isStuttering } = useGPU();
  return (
    <Text style={{ color: isStuttering ? '#FF8FA3' : '#7CE3A6' }}>
      {measuredFps ?? '—'} FPS · {frameRenderTimeMs ?? '—'} ms / {targetBudgetMs} ms
    </Text>
  );
}`,
    aiTip: 'AI Tip: Inspect isStuttering when rendering complex Canvas or SVG animations. If true, downsample rendering complexity.',
  },
  {
    id: 'useTPU',
    name: 'useTPU',
    category: 'silicon',
    chipBadge: 'AICore · Gemini Nano host',
    badgeColor: Colors.dark.tensorGlow,
    summary: 'Detects the on-device AI stack (AICore, Private Compute Services, NPU flag). Inference itself lives in useGeminiNano; the metrics here stay null.',
    description: 'The TPU is only reachable through AICore (ML Kit GenAI) or LiteRT, so this hook reports what is verifiably installed and refuses to invent latency numbers. benchmarkTPU() runs a real 256×256 JS matmul and reports it as CPU Fallback.',
    signature: 'useTPU(): TPUState',
    returns: [
      'aicoreInstalled: boolean',
      'aicoreVersion: string | null',
      'privateComputeServicesVersion: string | null',
      'hasNpuFeature: boolean | null',
      'lastInferenceLatencyMs: number | null  // always null here; see useGeminiNano',
      'cpuFallbackLatencyMs: number | null',
      'benchmarkTPU(): Promise<TPUAcceleration>',
    ],
    example: `import { useTPU } from './src';

function AIStack() {
  const { aicoreInstalled, aicoreVersion, cpuFallbackLatencyMs, benchmarkTPU } = useTPU();
  return (
    <View>
      <Text>AICore: {aicoreInstalled ? aicoreVersion : 'not installed'}</Text>
      <Text>CPU matmul: {cpuFallbackLatencyMs ?? '—'} ms</Text>
      <Button title="CPU fallback benchmark" onPress={() => benchmarkTPU()} />
    </View>
  );
}`,
    aiTip: 'AI Tip: Check aicoreInstalled before offering on-device AI. Do not present cpuFallbackLatencyMs as TPU performance.',
  },
  {
    id: 'useMemory',
    name: 'useMemory',
    category: 'silicon',
    chipBadge: 'ActivityManager · 12 GB LPDDR5X',
    badgeColor: '#B794FF',
    summary: 'Real system RAM (total/available/LMK threshold), this app\'s Java and native heaps, and a GC request.',
    description: 'ActivityManager.getMemoryInfo polled every 2 s plus Runtime and Debug heap readings. purgeCaches() requests a garbage collection and re-reads; it never pretends to free system RAM.',
    signature: 'useMemory(): MemoryState',
    returns: [
      'totalRAMMB / usedRAMMB / freeRAMMB: number',
      'isLowMemory: boolean  // kernel flag',
      'lowMemoryThresholdMB: number',
      'appJavaHeapMB / appJavaHeapMaxMB / appNativeHeapMB: number',
      'purgeCaches(): void',
      "source: 'hardware' | 'unavailable'",
    ],
    example: `import { useMemory } from './src';

function MemoryHUD() {
  const { freeRAMMB, isLowMemory, purgeCaches } = useMemory();
  return (
    <View>
      <Text>Free RAM: {freeRAMMB} MB</Text>
      {isLowMemory && <Button title="Purge Caches" onPress={purgeCaches} />}
    </View>
  );
}`,
    aiTip: 'AI Tip: If isLowMemory is true, purge image buffers and cache before initiating large AI multimodal payloads.',
  },
  {
    id: 'useADPF',
    name: 'useADPF',
    category: 'silicon',
    chipBadge: 'PowerManager · SystemHealth',
    badgeColor: '#F7C66A',
    summary: 'Real thermal headroom (10 s poll), live thermal status, Android 16+ CPU/GPU headroom, display target FPS and measured FPS.',
    description: 'PowerManager.getThermalHeadroom (0 cool → 1 throttling) and its thresholds, a thermal status listener, SystemHealthManager CPU/GPU headroom when the device reports it, and Choreographer FPS against the display mode.',
    signature: 'useADPF(): ADPFState',
    returns: [
      'thermalHeadroom: number | null',
      'thermalThresholds: Record<string, number> | null',
      "thermalStatus: 'nominal' | 'light' | 'moderate' | 'severe' | 'critical'",
      'cpuHeadroom / gpuHeadroom: number | null  // Android 16+',
      'targetFps / currentFps: number | null',
      "reportWorkDuration(ms): 'WITHIN_BUDGET' | 'BOOST_REQUESTED'",
    ],
    example: `import { useADPF } from './src';

function ThermalMonitor() {
  const { thermalStatus, thermalHeadroom, currentFps, targetFps } = useADPF();
  return (
    <Text>{thermalStatus} · headroom {thermalHeadroom ?? '—'} · {currentFps ?? '—'}/{targetFps ?? '—'} FPS</Text>
  );
}`,
    aiTip: 'AI Tip: If thermalStatus is "severe" or "critical", throttle sensor sampling and postpone background inference.',
  },

  // Pro Exclusives
  {
    id: 'useHiLight',
    name: 'useHiLight',
    category: 'pro',
    chipBadge: 'HiLight Ring (Pro Exclusive)',
    badgeColor: Colors.dark.tensorGlow,
    summary: 'Virtual state for the eight-LED HiLight array. Google ships no third-party path; the LEDs are gated by a privileged permission, so the app mirrors the intended colour and pattern on screen.',
    description: 'The array is exposed by Android 17 as eight Light.LIGHT_TYPE_APPLICATION lights (RGB + animation, 33 ms update period) but every session needs CONTROL_DEVICE_LIGHTS, which only shell, root or a Shizuku helper holds. availability is "simulated" on Pixel 11 Pro-class devices and "unsupported" elsewhere. See docs/research/HILIGHT_LED_ARRAY.md for the measured facts and the planned Shizuku path.',
    signature: 'useHiLight(): HiLightState',
    returns: [
      'isActive: boolean',
      'currentColor: string',
      'mode: HiLightMode',
      'brightness: number (0.0 to 1.0)',
      'triggerGeminiPulse(durationMs?: number): void',
      'triggerContactAlert(colorHex: string, durationMs?: number): void',
      'setColor(hex: string): void',
      'toggle(): void',
    ],
    example: `import { useHiLight } from './src';

function StatusRing() {
  const hilight = useHiLight();
  return (
    <View>
      <Text>HiLight Status: {hilight.mode}</Text>
      <Button title="Gemini AI Pulse" onPress={() => hilight.triggerGeminiPulse(4000)} />
      <Button title="Contact Alert" onPress={() => hilight.triggerContactAlert('#81C995', 4000)} />
    </View>
  );
}`,
    aiTip: 'AI Tip: Call triggerGeminiPulse() whenever Gemini AI begins generating tokens or executing tool calls for glanceable signaling.',
  },
  {
    id: 'useUWB',
    name: 'useUWB',
    category: 'pro',
    chipBadge: 'UWB radio present · SIMULATED',
    badgeColor: '#4785FF',
    summary: 'UWB distance and angle-of-arrival targets. The radio is verified present; ranging is simulated until the Android 16 RangingManager path lands.',
    description: 'Returns distance (m), azimuth and elevation per target. useCapabilities().hasUWB is device-verified; activeTargets are simulated values and are labelled SIMULATED in the UI.',
    signature: 'useUWB(): UWBState',
    returns: [
      'isSupported: boolean',
      'isRanging: boolean',
      'activeTargets: UWBTarget[]',
      'startRanging(): Promise<void>',
      'stopRanging(): void',
    ],
    example: `import { useUWB } from './src';

function SpatialRadar() {
  const { activeTargets, isRanging, startRanging } = useUWB();
  return (
    <View>
      {activeTargets.map(t => (
        <Text key={t.id}>{t.name}: {t.distanceMeters.toFixed(2)}m (Azimuth: {t.azimuthDegrees}°)</Text>
      ))}
      <Button title={isRanging ? "Ranging Active" : "Start UWB"} onPress={startRanging} />
    </View>
  );
}`,
    aiTip: 'AI Tip: UWB provides true spatial vectors. Combine distanceMeters and azimuthDegrees for 2D spatial positioning.',
  },

  // AI & Neural
  {
    id: 'useGeminiNano',
    name: 'useGeminiNano',
    category: 'ai',
    chipBadge: 'AICore · ML Kit Prompt API',
    badgeColor: Colors.dark.tensorGlow,
    summary: 'Gemini Nano on-device through the PixelNano module. Status, model name, token limit and feature flags come from AICore; latency, first-token time and token counts are measured on the device.',
    description: 'Wraps com.google.mlkit:genai-prompt (1.0.0-beta4) in modules/pixel-nano. checkStatus/getModelInfo read AICore, download() streams progress, stream() emits tokens as events. AICore keeps no history, so buildNanoTurn() re-sends a capped transcript with the system instruction. No cloud fallback and no simulated reply: when the model is unavailable the hook appends a system-role error.',
    signature: 'useGeminiNano(): GeminiNanoState',
    returns: [
      "status: 'available' | 'downloadable' | 'downloading' | 'unavailable'",
      'info: { baseModelName, tokenLimit, thinkingModeAvailable, systemPromptAvailable, … } | null',
      'messages: AIMessage[] · partial: string  // streaming text',
      'lastLatencyMs · lastFirstTokenMs · lastOutputTokens · lastDecodeTokensPerSec',
      'download() · warmup() · countTokens(prompt) · generate(prompt, options)',
      'sendMessage(text) · clearMessages() · setModelConfig(stage, preference)',
      "source: 'hardware' | 'unavailable'",
    ],
    example: `import { useGeminiNano } from './src';

function OnDeviceAssistant() {
  const nano = useGeminiNano();
  return (
    <View>
      <Text>Gemini Nano: {nano.status} · {nano.info?.baseModelName ?? '—'}</Text>
      {nano.status === 'downloadable' && <Button title="Download model" onPress={() => nano.download()} />}
      <Button title="Ask on-device" onPress={() => nano.sendMessage('Summarise the thermal state')} disabled={!nano.isAvailable} />
      <Text>{nano.partial || nano.messages.at(-1)?.content}</Text>
      <Text>{nano.lastLatencyMs ?? '—'} ms · {nano.lastDecodeTokensPerSec ?? '—'} tok/s</Text>
    </View>
  );
}`,
    aiTip: 'AI Tip: Check status before offering on-device answers and never fall back to a canned string. AICore is foreground-only and single-turn; keep the transcript short and route background work to the cloud hook.',
  },
  {
    id: 'useGemini',
    name: 'useGemini',
    category: 'ai',
    chipBadge: 'gemini-3.8-flash · ai.chats',
    badgeColor: Colors.dark.tensorGlow,
    summary: 'Multi-turn Gemini chat with a system instruction, API-reported token counts, and the key loaded from SecureStore. No simulated replies.',
    description: 'Wraps @google/genai ai.chats.create() on gemini-3.8-flash. Without an API key, sendMessage appends a system-role error message; with a key, replies carry latencyMs and usageMetadata token counts.',
    signature: 'useGemini(): GeminiState',
    returns: [
      'messages: AIMessage[]  // system role = local error',
      'isLoading: boolean',
      'sendMessage(text: string): Promise<void>',
      'clearMessages(): void',
      'hasApiKey: boolean · setApiKey(key | null)',
      'model: string',
    ],
    example: `import { useGemini } from './src';

function Assistant() {
  const { messages, sendMessage, isLoading } = useGemini();
  return (
    <View>
      {messages.map(m => <Text key={m.id}>[{m.role}]: {m.content}</Text>)}
      <Button title="Ask AI" onPress={() => sendMessage("Analyze current telemetry")} />
    </View>
  );
}`,
    aiTip: 'AI Tip: Keys come from saveApiKey() (SecureStore). Never hardcode a Gemini key, and never fake a reply when the key is missing.',
  },
  {
    id: 'useSpeechAI',
    name: 'useSpeechAI',
    category: 'ai',
    chipBadge: 'expo-audio → Gemini audio',
    badgeColor: Colors.dark.tensorGlow,
    summary: 'Records 16 kHz mono through the voice_recognition source and transcribes with Gemini. Error without an API key; nothing simulated.',
    description: 'Uses useAudio for capture (dBFS metering) and gemini-3.8-flash audio input for transcription. Keeps lastRecordingUri and sets error when no key is configured. On-device ML Kit speech recognition is planned.',
    signature: 'useSpeechAI(): SpeechAIState',
    returns: [
      'isListening: boolean',
      'voiceDecibels: number',
      'startListening(): Promise<void>',
      'stopListeningAndTranscribe(): Promise<SpeechResult | null>',
    ],
    example: `import { useSpeechAI, useGemini } from './src';

function VoiceBot() {
  const speech = useSpeechAI();
  const gemini = useGemini();

  const handleVoice = async () => {
    if (speech.isListening) {
      const res = await speech.stopListeningAndTranscribe();
      if (res?.transcript) gemini.sendMessage(res.transcript);
    } else {
      await speech.startListening();
    }
  };

  return <Button title={speech.isListening ? "Stop & Transcribe" : "Speak"} onPress={handleVoice} />;
}`,
    aiTip: 'AI Tip: Pipe speech.stopListeningAndTranscribe() directly into gemini.sendMessage() for voice agent loops.',
  },
  {
    id: 'useVisionAI',
    name: 'useVisionAI',
    category: 'ai',
    chipBadge: 'Multimodal Vision Engine',
    badgeColor: Colors.dark.tensorGlow,
    summary: 'Camera snapshot capture and multimodal scene perception via Gemini Vision.',
    description: 'Connects the camera optical feed directly to Gemini Multimodal reasoning. Downsamples images for optimal token consumption and returns structured scene observations.',
    signature: 'useVisionAI(): VisionAIState',
    returns: [
      'isAnalyzing: boolean',
      'analysis: VisionAnalysis | null',
      'captureAndAnalyze(cameraRef, prompt?): Promise<VisionAnalysis | null>',
    ],
    example: `import { useVisionAI } from './src';

function VisionWidget({ cameraRef }: { cameraRef: any }) {
  const { captureAndAnalyze, isAnalyzing, analysis } = useVisionAI();
  return (
    <View>
      <Button title="Analyze Scene" onPress={() => captureAndAnalyze(cameraRef)} />
      {analysis && <Text>{analysis.description}</Text>}
    </View>
  );
}`,
    aiTip: 'AI Tip: Pass custom prompts into captureAndAnalyze(cameraRef, "Find all objects and text") for targeted tasks.',
  },

  // Sensors & Actuators
  {
    id: 'useSensors',
    name: 'useSensors',
    category: 'sensors',
    chipBadge: '6-Axis IMU & Barometer',
    badgeColor: '#81C995',
    summary: 'Continuous 6-axis motion, compass heading, photodiode light, and barometric altitude.',
    description: 'Monitors accelerometer, gyroscope, magnetometer, ambient light, and air pressure. Calculates relative altitude using the international hypsometric barometric equation.',
    signature: 'useSensors(intervalMs?: number): SensorsState',
    returns: [
      'accelerometer: SensorData',
      'gyroscope: SensorData',
      'magnetometer: SensorData',
      'barometer: BarometerData { pressure, relativeAltitude }',
      'lightSensor: { illuminance }',
    ],
    example: `import { useSensors } from './src';

function SensorHUD() {
  const { barometer, accelerometer } = useSensors(100);
  return (
    <View>
      <Text>Altitude: {barometer.relativeAltitude}m ({barometer.pressure} hPa)</Text>
      <Text>Accel Z: {accelerometer.z.toFixed(2)} m/s²</Text>
    </View>
  );
}`,
    aiTip: 'AI Tip: Default to 100ms or 200ms intervals to avoid unnecessary battery drain and thermal rise.',
  },
  {
    id: 'useHaptics',
    name: 'useHaptics',
    category: 'sensors',
    chipBadge: 'LRA 134.4 Hz · PWLE v2 envelopes',
    badgeColor: '#7CE3A6',
    summary: 'Pixel tactile patterns plus Android 16 envelope effects and primitive compositions with the vibrator\'s real capabilities.',
    description: 'Standard patterns via expo-haptics. Through PixelNative: resonant frequency, amplitude control, supported primitives, playEnvelope() (BasicEnvelopeBuilder, Android 16+) and playPrimitives() (Composition). Presets in HapticEnvelopes: thinkingRamp, doublePulse, spring.',
    signature: 'useHaptics(): HapticsState',
    returns: [
      'selection | light | medium | heavy | success | warning | error(): Promise<void>',
      'playEnvelope(points, initialSharpness?): boolean  // Android 16+',
      'playPrimitives(steps): boolean',
      'envelopeSupported: boolean',
      'resonantFrequencyHz: number | null',
      'supportedPrimitives: string[]',
    ],
    example: `import { useHaptics } from './src';

function TactileCard() {
  const { light, success } = useHaptics();
  return (
    <TouchableOpacity onPress={() => { light(); success(); }}>
      <Text>Tap for Physical Feedback</Text>
    </TouchableOpacity>
  );
}`,
    aiTip: 'AI Tip: Follow the Physical Sensation Rule: attach selection() to sliders, light() to buttons, and success() to completions.',
  },
  {
    id: 'useCamera',
    name: 'useCamera',
    category: 'sensors',
    chipBadge: 'expo-camera · Looks are UI state',
    badgeColor: '#81C995',
    summary: 'Lens, zoom, flash and permission state over expo-camera. Camera Looks and 120x zoom belong to the Pixel Camera app and are represented here as UI state only.',
    description: 'expo-camera does not expose Pixel Camera features (Camera Looks, Super Res Zoom, Video Boost). selectedLook and maxZoomFactor are app-side state, not hardware pipeline control; real extension probing needs a CameraX 1.6+ module.',
    signature: 'useCamera(): CameraState',
    returns: [
      'hasPermission: boolean',
      'lensType: "front" | "back"',
      'zoomFactor: number  // expo-camera zoom',
      'maxZoomFactor: number  // app-side ceiling',
      'selectedLook: CameraLook',
      'isUltraLowLightVideoActive: boolean',
      'setLook(look: CameraLook): void',
      'setZoom(ratio: number): void',
    ],
    example: `import { useCamera } from './src';

function CameraControl() {
  const { zoomFactor, setZoom, setLook } = useCamera();
  return (
    <View>
      <Button title="Zoom 5x" onPress={() => setZoom(5)} />
      <Button title="Apply Editorial Look" onPress={() => setLook('Editorial')} />
    </View>
  );
}`,
    aiTip: 'AI Tip: Camera Looks are applied at the sensor tone-mapping level before capture, yielding authentic non-HDR aesthetics.',
  },
  {
    id: 'useTorch',
    name: 'useTorch',
    category: 'sensors',
    chipBadge: 'CameraManager · 21 levels',
    badgeColor: '#7CE3A6',
    summary: 'Real rear flash control via CameraManager.setTorchMode with Android 13+ variable brightness; state follows the system torch callback.',
    description: 'Drives the rear camera flash through the PixelNative module. isTorchOn mirrors CameraManager.TorchCallback so Quick Settings changes are reflected. Pixel 11 Pro exposes 21 strength levels. Strobe toggles the hardware at ≥120 ms.',
    signature: 'useTorch(): TorchState',
    returns: [
      'isAvailable: boolean',
      'isTorchOn: boolean  // from system callback',
      'isStrobing: boolean',
      'maxStrengthLevel: number | null',
      'setTorch(on, strengthLevel?): Promise<boolean>',
      'toggleTorch(): Promise<boolean>',
      'startStrobe(intervalMs?): void / stopStrobe(): void',
      "source: 'hardware' | 'unavailable'",
    ],
    example: `import { useTorch } from './src';

function Flashlight() {
  const { isTorchOn, toggleTorch, startStrobe } = useTorch();
  return (
    <View>
      <Button title={isTorchOn ? "Torch OFF" : "Torch ON"} onPress={toggleTorch} />
      <Button title="SOS Strobe" onPress={startStrobe} />
    </View>
  );
}`,
    aiTip: 'AI Tip: Ensure stopStrobe() is invoked during unmount cleanup to avoid leaving the LED pulsing indefinitely.',
  },

  // Radios & Security
  {
    id: 'useBiometrics',
    name: 'useBiometrics',
    category: 'radios',
    chipBadge: 'Ultrasonic fingerprint · face',
    badgeColor: '#C2E7FF',
    summary: 'Ultrasonic under-display fingerprint and Class 3 3D Face Unlock.',
    description: 'expo-local-authentication over BiometricPrompt. On the Pixel 11 Pro this drives the ultrasonic under-display fingerprint sensor and face unlock; verified via BiometricService logs.',
    signature: 'useBiometrics(): BiometricsState',
    returns: [
      'hasHardware: boolean',
      'isEnrolled: boolean',
      'biometricType: string',
      'authenticate(prompt: string): Promise<boolean>',
    ],
    example: `import { useBiometrics } from './src';

function AuthButton() {
  const { authenticate } = useBiometrics();
  const handleAuth = async () => {
    const ok = await authenticate("Verify Identity");
    if (ok) console.log("Unlocked!");
  };
  return <Button title="Unlock Vault" onPress={handleAuth} />;
}`,
    aiTip: 'AI Tip: Always check isEnrolled before invoking authenticate() to avoid throwing missing enrollment errors.',
  },
  {
    id: 'useSecurity',
    name: 'useSecurity',
    category: 'radios',
    chipBadge: 'Android Keystore · StrongBox',
    badgeColor: '#6FDCF2',
    summary: 'Secret storage through expo-secure-store, encrypted with an Android Keystore key (StrongBox on Pixel 11 Pro).',
    description: 'saveSecureItem/getSecureItem/deleteSecureItem wrap expo-secure-store with WHEN_UNLOCKED_THIS_DEVICE_ONLY. StrongBox presence is reported by useCapabilities().hasStrongBox. No post-quantum algorithms are used.',
    signature: 'useSecurity(): SecurityState',
    returns: [
      'saveSecureItem(key, value): Promise<boolean>',
      'getSecureItem(key): Promise<string | null>',
      'deleteSecureItem(key): Promise<boolean>',
      'isHardwareBacked: boolean',
      "securityModule: 'Android Keystore' | 'none'",
      'isPostQuantumProtected: false',
    ],
    example: `import { useSecurity } from './src';

function KeyManager() {
  const { saveSecureItem } = useSecurity();
  return <Button title="Save key" onPress={() => saveSecureItem("api_key", "secret_123")} />;
}`,
    aiTip: 'AI Tip: Store every secret through saveSecureItem. Do not describe the keystore as post-quantum; SecureStore uses classical AES keys.',
  },
  {
    id: 'useBLE',
    name: 'useBLE',
    category: 'radios',
    chipBadge: 'Bluetooth 5.4 LE',
    badgeColor: '#C2E7FF',
    summary: 'Bluetooth Low Energy scanning, peripheral discovery, and RSSI proximity tracking.',
    description: 'Scans for nearby BLE beacons, tags, and accessories with signal strength tracking.',
    signature: 'useBLE(): BLEState',
    returns: [
      'isScanning: boolean',
      'peripherals: BLEPeripheral[]',
      'startScan(): Promise<void>',
      'stopScan(): void',
    ],
    example: `import { useBLE } from './src';

function BeaconScanner() {
  const { peripherals, isScanning, startScan } = useBLE();
  return (
    <View>
      <Button title={isScanning ? "Scanning..." : "Scan BLE"} onPress={startScan} />
      {peripherals.map(p => <Text key={p.id}>{p.name} ({p.rssi} dBm)</Text>)}
    </View>
  );
}`,
    aiTip: 'AI Tip: RSSI is logarithmic. Distance estimates are approximations; pair with UWB for true cm accuracy.',
  },
  {
    id: 'useNFC',
    name: 'useNFC',
    category: 'radios',
    chipBadge: 'NFC NDEF Controller',
    badgeColor: '#C2E7FF',
    summary: 'Contactless smart tag detection and NDEF record decoding.',
    description: 'Detects and reads RFID tags and NFC smart cards touched to the back of the Pixel 11 Pro.',
    signature: 'useNFC(): NFCState',
    returns: [
      'isSupported: boolean',
      'isScanning: boolean',
      'lastScannedTag: NFCTag | null',
      'startScan(): Promise<void>',
    ],
    example: `import { useNFC } from './src';

function NFCReader() {
  const { lastScannedTag, startScan } = useNFC();
  return (
    <View>
      <Button title="Scan NFC Tag" onPress={startScan} />
      {lastScannedTag && <Text>Tag ID: {lastScannedTag.id} Payload: {lastScannedTag.payload}</Text>}
    </View>
  );
}`,
    aiTip: 'AI Tip: Prompt the user to touch the tag against the upper third of the rear phone glass.',
  },
  {
    id: 'useLocation',
    name: 'useLocation',
    category: 'radios',
    chipBadge: 'Dual-Band GNSS (L1/L5)',
    badgeColor: '#C2E7FF',
    summary: 'Dual-band GNSS (L1/L5) position, altitude, heading and speed via expo-location.',
    description: 'expo-location fixes with reported accuracy in metres. Accuracy depends on the fix; no centimetre claims.',
    signature: 'useLocation(): LocationState',
    returns: [
      'latitude: number',
      'longitude: number',
      'altitude: number',
      'heading: number',
      'speed: number',
      'accuracy: number',
    ],
    example: `import { useLocation } from './src';

function LocationHUD() {
  const { latitude, longitude, altitude, speed } = useLocation();
  return <Text>Coords: {latitude.toFixed(5)}, {longitude.toFixed(5)} | Alt: {altitude}m</Text>;
}`,
    aiTip: 'AI Tip: Check location accuracy before relying on tight geographical geofences.',
  },

  // System & Media
  {
    id: 'useCapabilities',
    name: 'useCapabilities',
    category: 'system',
    chipBadge: 'Device Identity',
    badgeColor: '#C4EED0',
    summary: 'Resolves what this Pixel physically has and which Android 16/17 APIs exist.',
    description: 'Single source of truth read by every Pro-exclusive hook. Derives HiLight, UWB, Titan M3 presence and the expected Gemini Nano tier from the device model, and gates Android 16/17 platform APIs (RangingManager, haptic envelopes, AppFunctions) from the API level. Pure resolver in src/core/capabilities.ts.',
    signature: 'useCapabilities(): DeviceCapabilities',
    returns: [
      'modelName: string, isPixel: boolean, pixelGeneration: number | null',
      'isProModel: boolean, isFoldable: boolean, androidApiLevel: number | null',
      'hasHiLight, hasUWB, hasTitanM3: boolean',
      "geminiNanoTier: 'nano-v4' | 'nano-v3' | 'nano-v2' | 'none'",
      'supportsRangingApi, supportsHapticEnvelopes, supportsAppFunctions, supportsAndroid17Apis: boolean',
    ],
    example: `import { useCapabilities } from './src';

function ProFeatures() {
  const caps = useCapabilities();
  return (
    <View>
      <Text>{caps.modelName} · API {caps.androidApiLevel} · {caps.geminiNanoTier}</Text>
      {caps.hasHiLight && <HiLightCard />}
    </View>
  );
}`,
    aiTip: 'AI Tip: Never hard-code "Pixel 11 Pro" assumptions. Read useCapabilities() first; the Pixel 11 Pro has no thermometer, and HiLight needs a privileged permission.',
  },
  {
    id: 'useAudio',
    name: 'useAudio',
    category: 'system',
    chipBadge: 'Multi-Mic Array (expo-audio)',
    badgeColor: '#E3E2E6',
    summary: 'Acoustic recording (16 kHz mono, voice_recognition source) and real-time dBFS metering.',
    description: 'Records audio with expo-audio and provides 100 ms dBFS sound pressure readings. Output is the mono 16 kHz AAC that Google speech APIs expect, captured through the voice_recognition source so Pixel noise suppression applies.',
    signature: 'useAudio(): AudioState',
    returns: [
      'isRecording: boolean',
      'meteringDecibels: number  // alias: currentDecibels',
      'permissionGranted: boolean',
      'startRecording(): Promise<boolean>',
      'stopRecording(): Promise<string | null>',
    ],
    example: `import { useAudio } from './src';

function SoundMeter() {
  const { currentDecibels, isRecording, startRecording, stopRecording } = useAudio();
  return (
    <View>
      <Text>Sound Level: {currentDecibels} dBFS</Text>
      <Button title={isRecording ? "Stop" : "Record"} onPress={isRecording ? stopRecording : startRecording} />
    </View>
  );
}`,
    aiTip: 'AI Tip: Decibel readings are normalized to dBFS where 0 is peak clipping and -160 is silence.',
  },
  {
    id: 'useDisplay',
    name: 'useDisplay',
    category: 'system',
    chipBadge: '1-120 Hz ARR · HDR10/HLG/HDR10+',
    badgeColor: '#E3E2E6',
    summary: 'Real display mode: live refresh rate, supported rates, resolution, HDR, ARR support, preferred-rate control, wake lock and brightness.',
    description: 'Reads android.view.Display every 2 s (ARR changes the rate live) through PixelNative. setPreferredRefreshRate() sets the window preferred rate, verified in dumpsys display as a frameRateOverride for this uid.',
    signature: 'useDisplay(): DisplayState',
    returns: [
      'refreshRateHz: number  // active mode',
      'hasArrSupport: boolean | null',
      'supportedRefreshRates: number[]',
      'resolution: { width, height, densityDpi } | null',
      'hdrTypes: number[] / isHdr / maxLuminance',
      'setPreferredRefreshRate(hz): Promise<boolean>',
      'isKeepAwake / toggleKeepAwake()',
      'brightness / setScreenBrightness(v)',
    ],
    example: `import { useDisplay } from './src';

function DisplayHUD() {
  const { isKeepAwake, toggleKeepAwake } = useDisplay();
  return <Button title={isKeepAwake ? "WakeLock Active" : "Enable WakeLock"} onPress={toggleKeepAwake} />;
}`,
    aiTip: 'AI Tip: In Expo SDK 57, always provide a tag to activateKeepAwakeAsync(tag) to avoid unhandled rejections.',
  },
  {
    id: 'useDevice',
    name: 'useDevice',
    category: 'system',
    chipBadge: 'Android HAL & PMIC',
    badgeColor: '#E3E2E6',
    summary: 'Battery percentage, charging status, device thermals, and model specs.',
    description: 'Queries Android Power Management IC for exact battery percentages, charging states, and hardware model strings.',
    signature: 'useDevice(): DeviceState',
    returns: [
      'batteryLevel: number',
      'isCharging: boolean',
      'modelName: string',
      'osVersion: string',
    ],
    example: `import { useDevice } from './src';

function DeviceHUD() {
  const { batteryLevel, isCharging, modelName } = useDevice();
  return <Text>{modelName}: {Math.round(batteryLevel * 100)}% {isCharging ? "⚡" : ""}</Text>;
}`,
    aiTip: 'AI Tip: Battery level is a float between 0.0 and 1.0; multiply by 100 for percentage.',
  },
  {
    id: 'useNetwork',
    name: 'useNetwork',
    category: 'system',
    chipBadge: 'Wi-Fi 7 & 5G Modem',
    badgeColor: '#E3E2E6',
    summary: 'IP address inspection, connection type, cellular status, and airplane mode.',
    description: 'Provides real-time network connectivity data including local IP address and connection type.',
    signature: 'useNetwork(): NetworkState',
    returns: [
      'ipAddress: string',
      'networkType: string',
      'isConnected: boolean',
      'isAirplaneMode: boolean',
    ],
    example: `import { useNetwork } from './src';

function NetHUD() {
  const { ipAddress, networkType, isConnected } = useNetwork();
  return <Text>{networkType} ({ipAddress}) - {isConnected ? "Online" : "Offline"}</Text>;
}`,
    aiTip: 'AI Tip: Always check isConnected before dispatching network-dependent requests.',
  },
];

type CategoryFilter = 'all' | 'primer' | 'silicon' | 'pro' | 'ai' | 'sensors' | 'radios' | 'system';

export const DocsScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const { selection, success, light } = useHaptics();

  const handleCopy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    await success();
    setCopiedNotification(`Copied: ${label}`);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  const filteredModules = useMemo(() => {
    return DOC_MODULES.filter((mod) => {
      const matchesCategory =
        selectedCategory === 'all' || mod.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.chipBadge.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.aiTip.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const toggleExpand = (id: string) => {
    light();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const SYSTEM_PROMPT_DIRECTIVE = `You are building an application using the PixelForge SDK on a Google Pixel 11 Pro.
Always adhere to these requirements:
1. Import all hardware and AI hooks directly from './src' (e.g. useCPU, useSensors, useGemini, useHaptics).
2. Attach tactile haptic feedback (useHaptics) to all user interactions: selection for navigation, light for taps, success for completed actions, error for failures.
3. Respect the 8.33ms 120Hz frame budget. Use useADPF() to check thermal state before heavy workloads.
4. Use true OLED black (#0E1119) for backgrounds via Colors.dark.background.
5. Store sensitive keys exclusively through useSecurity().saveSecureItem() (SecureStore, Android Keystore).
6. For Expo SDK 57 compatibility: expo-keep-awake uses activateKeepAwakeAsync(tag) / deactivateKeepAwake(tag).`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Banner */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PixelForge Documentation ⚡</Text>
        <Text style={styles.headerSubtitle}>
          Complete Hardware & AI API Reference for Google Pixel 11 Pro
        </Text>
      </View>

      {/* Copy Notification Toast */}
      {copiedNotification && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✓ {copiedNotification}</Text>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search 24 hooks, silicon chips, or AI tips..."
          placeholderTextColor={Colors.dark.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              selection();
            }}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsRow}
        contentContainerStyle={styles.chipsContent}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            selectedCategory === 'all' && styles.chipActive,
          ]}
          onPress={() => {
            setSelectedCategory('all');
            selection();
          }}
        >
          <Text
            style={[
              styles.chipText,
              selectedCategory === 'all' && styles.chipTextActive,
            ]}
          >
            All ({DOC_MODULES.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            selectedCategory === 'primer' && styles.chipActivePrimer,
          ]}
          onPress={() => {
            setSelectedCategory('primer');
            selection();
          }}
        >
          <Text
            style={[
              styles.chipText,
              selectedCategory === 'primer' && styles.chipTextActivePrimer,
            ]}
          >
            🤖 AI Primer & Rules
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            selectedCategory === 'silicon' && styles.chipActive,
          ]}
          onPress={() => {
            setSelectedCategory('silicon');
            selection();
          }}
        >
          <Text
            style={[
              styles.chipText,
              selectedCategory === 'silicon' && styles.chipTextActive,
            ]}
          >
            Silicon & Compute (5)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            selectedCategory === 'pro' && styles.chipActivePro,
          ]}
          onPress={() => {
            setSelectedCategory('pro');
            selection();
          }}
        >
          <Text
            style={[
              styles.chipText,
              selectedCategory === 'pro' && styles.chipTextActivePro,
            ]}
          >
            Pro Exclusives (3)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            selectedCategory === 'ai' && styles.chipActiveAI,
          ]}
          onPress={() => {
            setSelectedCategory('ai');
            selection();
          }}
        >
          <Text
            style={[
              styles.chipText,
              selectedCategory === 'ai' && styles.chipTextActiveAI,
            ]}
          >
            Neural & AI (3)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            selectedCategory === 'sensors' && styles.chipActive,
          ]}
          onPress={() => {
            setSelectedCategory('sensors');
            selection();
          }}
        >
          <Text
            style={[
              styles.chipText,
              selectedCategory === 'sensors' && styles.chipTextActive,
            ]}
          >
            Sensors & Actuators (4)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            selectedCategory === 'radios' && styles.chipActive,
          ]}
          onPress={() => {
            setSelectedCategory('radios');
            selection();
          }}
        >
          <Text
            style={[
              styles.chipText,
              selectedCategory === 'radios' && styles.chipTextActive,
            ]}
          >
            Radios & Security (5)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chip,
            selectedCategory === 'system' && styles.chipActive,
          ]}
          onPress={() => {
            setSelectedCategory('system');
            selection();
          }}
        >
          <Text
            style={[
              styles.chipText,
              selectedCategory === 'system' && styles.chipTextActive,
            ]}
          >
            System & Media (4)
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* AI PRIMER SECTION (Shown when 'primer' or 'all' selected) */}
      {(selectedCategory === 'primer' || (selectedCategory === 'all' && searchQuery === '')) && (
        <View style={styles.primerCard}>
          <View style={styles.primerHeaderRow}>
            <Text style={styles.primerTitle}>🤖 AI Primer & Operational Rules</Text>
            <View style={styles.primerBadge}>
              <Text style={styles.primerBadgeText}>AI GUIDE</Text>
            </View>
          </View>

          <Text style={styles.primerBody}>
            When an AI agent writes code for the Pixel 11 Pro, it must follow the
            <Text style={{ fontWeight: '700', color: Colors.dark.primary }}> 5 Golden Rules</Text>:
          </Text>

          <View style={styles.rulesList}>
            <Text style={styles.ruleItem}>
              <Text style={styles.ruleNum}>1. Single Import: </Text>
              Always import from <Text style={styles.codeInline}>./src</Text>. Never re-implement raw listeners.
            </Text>
            <Text style={styles.ruleItem}>
              <Text style={styles.ruleNum}>2. Tactile Feedback: </Text>
              Attach <Text style={styles.codeInline}>useHaptics</Text> to every touchable element.
            </Text>
            <Text style={styles.ruleItem}>
              <Text style={styles.ruleNum}>3. Thermal & Frame Budget: </Text>
              Check <Text style={styles.codeInline}>useADPF()</Text> and respect the 8.33ms 120Hz budget.
            </Text>
            <Text style={styles.ruleItem}>
              <Text style={styles.ruleNum}>4. True OLED Black: </Text>
              Style backgrounds with <Text style={styles.codeInline}>#0E1119</Text> to turn off pixels.
            </Text>
            <Text style={styles.ruleItem}>
              <Text style={styles.ruleNum}>5. Secure Storage: </Text>
              Persist all secret keys via <Text style={styles.codeInline}>useSecurity().saveSecureItem()</Text>.
            </Text>
          </View>

          <View style={styles.promptBox}>
            <Text style={styles.promptBoxTitle}>AI System Prompt Directive</Text>
            <Text style={styles.promptBoxCode}>{SYSTEM_PROMPT_DIRECTIVE}</Text>
            <HapticButton
              title="Copy AI System Prompt"
              onPress={() => handleCopy(SYSTEM_PROMPT_DIRECTIVE, 'AI System Prompt Directive')}
              variant="secondary"
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      )}

      {/* MODULES LIST */}
      {selectedCategory !== 'primer' && (
        <View style={styles.modulesSection}>
          <Text style={styles.sectionHeader}>
            {selectedCategory === 'all'
              ? `Hardware & AI Modules (${filteredModules.length})`
              : `Modules (${filteredModules.length})`}
          </Text>

          {filteredModules.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No modules match "{searchQuery}"</Text>
            </View>
          ) : (
            filteredModules.map((mod) => {
              const isExpanded = expandedId === mod.id;
              return (
                <View key={mod.id} style={styles.moduleCard}>
                  {/* Top Card Bar */}
                  <TouchableOpacity
                    onPress={() => toggleExpand(mod.id)}
                    style={styles.moduleCardHeader}
                    activeOpacity={0.7}
                  >
                    <View style={styles.moduleNameRow}>
                      <Text style={styles.moduleName}>{mod.name}()</Text>
                      <View
                        style={[
                          styles.chipBadge,
                          { borderColor: mod.badgeColor },
                        ]}
                      >
                        <Text
                          style={[styles.chipBadgeText, { color: mod.badgeColor }]}
                        >
                          {mod.chipBadge}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.moduleSummary}>{mod.summary}</Text>
                    <View style={styles.expandRow}>
                      <Text style={styles.expandText}>
                        {isExpanded ? '▲ Collapse Details' : '▼ Expand Code & AI Tip'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <Text style={styles.expandedDesc}>{mod.description}</Text>

                      {/* Signature */}
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Signature:</Text>
                        <Text style={styles.metaValue}>{mod.signature}</Text>
                      </View>

                      {/* Returns */}
                      <View style={styles.returnsBlock}>
                        <Text style={styles.metaLabel}>Key Return Properties:</Text>
                        {mod.returns.map((ret, idx) => (
                          <Text key={idx} style={styles.returnItem}>
                            • {ret}
                          </Text>
                        ))}
                      </View>

                      {/* Code Example */}
                      <View style={styles.codeSnippetContainer}>
                        <View style={styles.snippetHeaderRow}>
                          <Text style={styles.snippetHeaderTitle}>TypeScript Recipe</Text>
                          <TouchableOpacity
                            onPress={() => handleCopy(mod.example, `${mod.name} recipe`)}
                            style={styles.snippetCopyButton}
                          >
                            <Text style={styles.snippetCopyText}>📋 Copy</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.codeSnippetText}>{mod.example}</Text>
                      </View>

                      {/* AI Agent Tip */}
                      <View style={styles.aiTipBox}>
                        <Text style={styles.aiTipText}>💡 {mod.aiTip}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          PixelForge SDK ⚡ Expo SDK 57 • React 19 • React Native 0.86 • Google Pixel 11 Pro
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  toast: {
    backgroundColor: Colors.dark.success,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  toastText: {
    color: '#0E1119',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: Colors.dark.text,
    fontSize: 14,
  },
  clearButton: {
    padding: 6,
  },
  clearButtonText: {
    color: Colors.dark.textMuted,
    fontSize: 14,
  },
  chipsRow: {
    marginBottom: 16,
  },
  chipsContent: {
    paddingRight: 8,
  },
  chip: {
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  chipActive: {
    backgroundColor: Colors.dark.primaryContainer,
    borderColor: Colors.dark.primary,
  },
  chipActivePrimer: {
    backgroundColor: `${Colors.dark.tensorGlow}25`,
    borderColor: Colors.dark.tensorGlow,
  },
  chipActivePro: {
    backgroundColor: `${Colors.dark.warning}25`,
    borderColor: Colors.dark.warning,
  },
  chipActiveAI: {
    backgroundColor: `${Colors.dark.accent}25`,
    borderColor: Colors.dark.accent,
  },
  chipText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.dark.text,
    fontWeight: '700',
  },
  chipTextActivePrimer: {
    color: Colors.dark.tensorGlow,
    fontWeight: '700',
  },
  chipTextActivePro: {
    color: Colors.dark.warning,
    fontWeight: '700',
  },
  chipTextActiveAI: {
    color: Colors.dark.secondary,
    fontWeight: '700',
  },
  primerCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.tensorGlow,
    padding: 16,
    marginBottom: 20,
  },
  primerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  primerTitle: {
    color: Colors.dark.tensorGlow,
    fontSize: 17,
    fontWeight: '800',
  },
  primerBadge: {
    backgroundColor: `${Colors.dark.tensorGlow}20`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.tensorGlow,
  },
  primerBadgeText: {
    color: Colors.dark.tensorGlow,
    fontSize: 10,
    fontWeight: '800',
  },
  primerBody: {
    color: Colors.dark.text,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  rulesList: {
    backgroundColor: Colors.dark.background,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  ruleItem: {
    color: Colors.dark.text,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  ruleNum: {
    color: Colors.dark.primary,
    fontWeight: '700',
  },
  codeInline: {
    color: Colors.dark.tensorGlow,
    fontFamily: 'monospace',
  },
  promptBox: {
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  promptBoxTitle: {
    color: Colors.dark.secondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  promptBoxCode: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'monospace',
  },
  modulesSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.dark.textMuted,
    fontSize: 14,
  },
  moduleCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    marginBottom: 12,
    overflow: 'hidden',
  },
  moduleCardHeader: {
    padding: 14,
  },
  moduleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  moduleName: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  chipBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.dark.surface,
  },
  chipBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  moduleSummary: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  expandRow: {
    marginTop: 8,
  },
  expandText: {
    color: Colors.dark.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  expandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.cardBorder,
    backgroundColor: Colors.dark.surface,
  },
  expandedDesc: {
    color: Colors.dark.text,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 10,
  },
  metaRow: {
    marginBottom: 8,
  },
  metaLabel: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: Colors.dark.primary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  returnsBlock: {
    marginBottom: 10,
  },
  returnItem: {
    color: Colors.dark.text,
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  codeSnippetContainer: {
    backgroundColor: Colors.dark.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 10,
    marginBottom: 10,
  },
  snippetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.cardBorder,
    paddingBottom: 4,
  },
  snippetHeaderTitle: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  snippetCopyButton: {
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  snippetCopyText: {
    color: Colors.dark.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  codeSnippetText: {
    color: Colors.dark.text,
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 15,
  },
  aiTipBox: {
    backgroundColor: `${Colors.dark.warning}15`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${Colors.dark.warning}40`,
    padding: 10,
  },
  aiTipText: {
    color: Colors.dark.warning,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 20,
  },
  footerText: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});

# Function Calling & Hardware Tools 🛠️

> One tool registry, three execution paths. PixelForge hooks (torch, haptics, HiLight, camera, sensors, location…) register as tools once. Cloud Gemini calls them with native function calling, Gemini Nano calls them on device via structured output, and the system Gemini assistant calls them through Android **AppFunctions**.

---

## 1. Architecture

```text
                 ┌─────────────────────────────────────────────┐
                 │  src/ai/tools/registry.ts                   │
                 │  defineTool({ name, description, schema,    │
                 │               execute })  ← wraps a hook    │
                 └───────┬───────────────┬───────────────┬─────┘
                         │               │               │
        toFunctionDeclarations()  toNanoToolPrompt()  (mirrored in Kotlin)
                         │               │               │
                         ▼               ▼               ▼
              ┌────────────────┐ ┌───────────────┐ ┌─────────────────────────┐
              │ Cloud Gemini   │ │ Gemini Nano 4 │ │ Android AppFunctions    │
              │ gemini-3.8-flash│ │ ToolChoice    │ │ @AppFunction service    │
              │ functionCalls[]│ │ structured out│ │ called by Gemini app    │
              └────────────────┘ └───────────────┘ └─────────────────────────┘
```

| Path | When | Latency | Needs network | Multi-step |
| :--- | :--- | :--- | :--- | :--- |
| Cloud function calling | Conversational agents, tools that need cloud data, parallel calls | 400–1500 ms | Yes | Yes, native loop |
| On-device tool selection | Offline quick actions ("turn on the torch", "check thermals") | 150–600 ms | No | You loop in JS |
| AppFunctions | User talks to **Gemini the assistant**, not your app | n/a | n/a | Assistant orchestrates |

---

## 2. The tool registry

`src/ai/tools/registry.ts`

```ts
import { z } from 'zod';
import { Type, type FunctionDeclaration, type Schema } from '@google/genai';

export type ToolDef<I extends z.ZodTypeAny = z.ZodTypeAny> = {
  name: string;                       // snake_case, unique
  description: string;                // one sentence, imperative; the model reads this
  schema: I;                          // zod input schema
  execute: (input: z.infer<I>) => Promise<unknown>;
  /** false = hide from Nano (too complex for a 4K-token prompt) */
  onDevice?: boolean;
};

const tools = new Map<string, ToolDef>();

export function defineTool<I extends z.ZodTypeAny>(def: ToolDef<I>) {
  tools.set(def.name, def as ToolDef);
  return def;
}
export function getTool(name: string) { return tools.get(name); }
export function listTools(opts?: { onDevice?: boolean }) {
  return [...tools.values()].filter(t => opts?.onDevice ? t.onDevice !== false : true);
}

/** zod → Gemini Schema (subset used by hardware tools). */
export function zodToGeminiSchema(s: z.ZodTypeAny): Schema {
  if (s instanceof z.ZodString)  return { type: Type.STRING, description: s.description };
  if (s instanceof z.ZodNumber)  return { type: Type.NUMBER, description: s.description };
  if (s instanceof z.ZodBoolean) return { type: Type.BOOLEAN, description: s.description };
  if (s instanceof z.ZodEnum)    return { type: Type.STRING, enum: s.options as string[], description: s.description };
  if (s instanceof z.ZodArray)   return { type: Type.ARRAY, items: zodToGeminiSchema(s.element), description: s.description };
  if (s instanceof z.ZodOptional || s instanceof z.ZodDefault) return zodToGeminiSchema(s._def.innerType);
  if (s instanceof z.ZodObject) {
    const shape = s.shape as Record<string, z.ZodTypeAny>;
    const required = Object.entries(shape).filter(([, v]) => !(v instanceof z.ZodOptional) && !(v instanceof z.ZodDefault)).map(([k]) => k);
    return {
      type: Type.OBJECT,
      description: s.description,
      properties: Object.fromEntries(Object.entries(shape).map(([k, v]) => [k, zodToGeminiSchema(v)])),
      required,
    };
  }
  return { type: Type.STRING };
}

export function toFunctionDeclarations(defs = listTools()): FunctionDeclaration[] {
  return defs.map(t => ({ name: t.name, description: t.description, parameters: zodToGeminiSchema(t.schema) }));
}

/** Validates + runs; always returns a JSON-serialisable object for the model. */
export async function runTool(name: string, rawArgs: unknown) {
  const t = getTool(name);
  if (!t) return { error: `unknown_tool:${name}` };
  const parsed = t.schema.safeParse(rawArgs ?? {});
  if (!parsed.success) return { error: 'invalid_arguments', issues: parsed.error.issues };
  try { return { ok: true, result: await t.execute(parsed.data) }; }
  catch (e: any) { return { error: e?.message ?? 'tool_failed' }; }
}
```

### 2.1 Registering PixelForge hardware as tools

Hooks are React-scoped, so register tools from a component that owns the hooks (e.g. `AILabScreen`) and keep the registry module-level.

```ts
// src/ai/tools/hardwareTools.ts
import { z } from 'zod';
import { defineTool } from './registry';
import type { useTorch } from '../../hardware/useTorch';
import type { useHaptics } from '../../hardware/useHaptics';
import type { HiLightState } from '../../hardware/useHiLight';
import type { useADPF } from '../../hardware/useADPF';

type Torch = ReturnType<typeof useTorch>;     // { isTorchOn, isStrobing, toggleTorch, startStrobe, stopStrobe }
type Haptics = ReturnType<typeof useHaptics>; // { triggerHaptic(type), selection(), light(), ... }
type ADPF = ReturnType<typeof useADPF>;       // { cpuHeadroom, gpuHeadroom, thermalStatus, targetFps, currentFps, reportWorkDuration }

export function registerHardwareTools(h: { torch: Torch; haptics: Haptics; hilight: HiLightState; adpf: ADPF }) {
  defineTool({
    name: 'set_torch',
    description: 'Turn the rear LED flashlight on or off, optionally as an emergency strobe.',
    schema: z.object({ on: z.boolean(), strobe: z.boolean().optional().describe('Emergency SOS strobe pattern') }),
    execute: async ({ on, strobe }) => {
      if (strobe) { await h.torch.startStrobe(); return { on: true, strobe: true }; }
      if (h.torch.isStrobing) await h.torch.stopStrobe();
      if (on !== h.torch.isTorchOn) await h.torch.toggleTorch();   // hook exposes a toggle, so reconcile to the requested state
      return { on, strobe: false };
    },
  });

  defineTool({
    name: 'haptic',
    description: 'Play a tactile haptic pattern on the linear resonant actuator.',
    schema: z.object({ pattern: z.enum(['selection', 'light', 'medium', 'heavy', 'success', 'warning', 'error']) }),
    execute: async ({ pattern }) => { await h.haptics.triggerHaptic(pattern); return { played: pattern }; },
  });

  defineTool({
    name: 'set_hilight',
    description: 'Set the rear camera-bar HiLight LED ring colour and animation (simulated on-screen if unsupported).',
    schema: z.object({
      mode: z.enum(['off', 'glow', 'breathing', 'pulse', 'gemini_thinking', 'incoming_call', 'notification']),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    }),
    execute: async ({ mode, color }) => { if (color) h.hilight.setColor(color); h.hilight.setMode(mode); return { mode, color: color ?? h.hilight.currentColor }; },
  });

  defineTool({
    name: 'get_thermal_headroom',
    description: 'Read Android Dynamic Performance Framework CPU/GPU headroom, thermal status and current FPS.',
    schema: z.object({}),
    onDevice: true,
    execute: async () => ({
      cpuHeadroom: h.adpf.cpuHeadroom,
      gpuHeadroom: h.adpf.gpuHeadroom,
      thermalStatus: h.adpf.thermalStatus,
      currentFps: h.adpf.currentFps,
    }),
  });
}
```

Naming rules the models respond to: verbs for actions (`set_`, `start_`, `stop_`), `get_` for reads, one sentence descriptions, enums instead of free strings, and **no tool that both reads and mutates**.

---

## 3. Path A: Cloud Gemini native function calling (`@google/genai` 2.21)

The installed SDK exposes `config.tools[].functionDeclarations`, `response.functionCalls`, `FunctionCallingConfigMode`, and `ai.chats`. The JavaScript SDK does **not** execute functions for you (the `automaticFunctionCalling` type exists but the loop is Python-only), so you run the loop.

### 3.1 One-shot agentic loop

```ts
// src/ai/agent/cloudAgent.ts
import { FunctionCallingConfigMode, type Content, type GoogleGenAI } from '@google/genai';
import { toFunctionDeclarations, runTool } from '../tools/registry';

const MODEL = 'gemini-3.8-flash';
const MAX_STEPS = 6;

export async function runCloudAgent(ai: GoogleGenAI, system: string, history: Content[], userText: string, onStep?: (s: string) => void) {
  const contents: Content[] = [...history, { role: 'user', parts: [{ text: userText }] }];
  const tools = [{ functionDeclarations: toFunctionDeclarations() }];

  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: system,
        tools,
        toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } },
        temperature: 0.2,
      },
    });

    const calls = res.functionCalls ?? [];
    const modelContent = res.candidates?.[0]?.content;
    if (modelContent) contents.push(modelContent);          // keep the model's own turn (incl. functionCall parts)

    if (calls.length === 0) return { text: res.text ?? '', contents };

    // Parallel calls arrive together; execute concurrently, answer in the same order.
    const results = await Promise.all(calls.map(c => runTool(c.name!, c.args)));
    calls.forEach((c, i) => onStep?.(`${c.name}(${JSON.stringify(c.args)}) → ${JSON.stringify(results[i])}`));

    contents.push({
      role: 'user',
      parts: calls.map((c, i) => ({
        functionResponse: { id: c.id, name: c.name!, response: results[i] as Record<string, unknown> },
      })),
    });
  }
  return { text: 'Stopped: too many tool steps.', contents };
}
```

Key details:

- **Always push the model's turn back** (`res.candidates[0].content`) before the `functionResponse` turn. Dropping it breaks parallel-call matching.
- `functionResponse.response` must be a JSON **object**, never a bare string. `runTool` guarantees that.
- `id` is present on calls from 3.x models; pass it back when present.
- Compositional calls (call B depends on A) just need more loop iterations; `MAX_STEPS` protects the battery.

### 3.2 Forcing or restricting tools

```ts
toolConfig: {
  functionCallingConfig: {
    mode: FunctionCallingConfigMode.ANY,           // must call a tool
    allowedFunctionNames: ['set_torch', 'haptic'], // from this subset only
  },
}
```

Use `ANY` for "quick action" buttons where a text answer is a failure, `NONE` to temporarily disable tools mid-conversation, `AUTO` otherwise.

### 3.3 Streaming with tools

```ts
const stream = await ai.models.generateContentStream({ model: MODEL, contents, config: { tools } });
let calls: any[] = [];
for await (const chunk of stream) {
  if (chunk.text) onToken(chunk.text);
  if (chunk.functionCalls?.length) calls = calls.concat(chunk.functionCalls);
}
// then execute `calls` exactly as in 3.1
```

### 3.4 Chat sessions

`ai.chats.create({ model, config: { tools, systemInstruction } })` keeps history for you. `chat.sendMessage({ message })` returns the same `functionCalls`; reply with `chat.sendMessage({ message: [{ functionResponse }] })`. Use chats for the AI Lab screen; use raw `contents` (3.1) when you need to persist history in `useSecurity`.

### 3.5 Structured output without tools

For extraction rather than action, prefer `responseJsonSchema`:

```ts
const res = await ai.models.generateContent({
  model: MODEL,
  contents: prompt,
  config: { responseMimeType: 'application/json', responseJsonSchema: zodToJsonSchema(MySchema) },
});
const data = MySchema.parse(JSON.parse(res.text!));
```

---

## 4. Path B: On-device tool selection with Gemini Nano

Today ML Kit's Prompt API has **no tool-execution path and no function-calling parameter**. Gemini Nano is trained to emit tool calls, so you close the loop yourself. Two techniques, use them in this order:

> **Roadmap note (verify before building):** Google's AICore Developer Preview announcement says Gemma 4 has native tool calling and that "tool calling, structured output, system prompts, thinking" are coming to the Prompt API during the preview, with Gemma 4 code running unchanged on Gemini Nano 4 devices. Structured output, system instructions and thinking landed in beta3 (July 2026); tool calling had not as of September 2026. Keep `runTool` and the registry as the single execution point so a native `functionCalls`-style response from Nano can replace `ToolChoice` parsing without touching tool code.

### 4.1 Structured output `ToolChoice` (reliable)

The `ToolChoice` `@Generable` class from the [on-device guide](./on-device-ai-gemini-nano.md#6-structured-output-alpha) is designed for this.

```ts
// src/ai/agent/nanoAgent.ts
import PixelNano from '../../../modules/pixel-nano/src';
import { listTools, runTool } from '../tools/registry';

export function toNanoToolPrompt(userText: string) {
  const catalog = listTools({ onDevice: true })
    .map(t => `- ${t.name}: ${t.description} args=${JSON.stringify(zodToExample(t.schema))}`)
    .join('\n');
  return [
    'You control phone hardware. Pick at most one tool for the request, or "none".',
    'Tools:', catalog,
    'Rules: use only listed tool names; argumentsJson must be valid JSON matching args; keep "say" under 12 words.',
    `Request: ${userText}`,
  ].join('\n');
}

export async function runNanoAgent(userText: string) {
  const { json, finishReason } = await PixelNano.generateStructured('ToolChoice', toNanoToolPrompt(userText), { temperature: 0.2 });
  if (finishReason !== 'STOP') throw new Error(`nano_structured:${finishReason}`);
  const choice = JSON.parse(json) as { tool: string; argumentsJson: string; say: string };
  if (choice.tool === 'none') return { say: choice.say, result: null };
  let args: unknown = {};
  try { args = JSON.parse(choice.argumentsJson || '{}'); } catch { /* fall through with {} */ }
  const result = await runTool(choice.tool, args);
  return { say: choice.say, tool: choice.tool, result };
}
```

`zodToExample` builds a tiny example object from the schema (`{ on: true, sos: false }`), which Nano copies far more reliably than a JSON-schema dump.

### 4.2 Parse `tool_code` text (fallback)

Without structured output, Nano tends to emit its training convention as plain text:

```text
tool_code
set_torch(on=True)
```

Handle it defensively:

```ts
const TOOL_CODE = /tool_code\s*\n?\s*([a-z_][a-z0-9_]*)\((.*?)\)/is;
export function parseToolCode(text: string) {
  const m = TOOL_CODE.exec(text);
  if (!m) return null;
  const name = m[1];
  const args: Record<string, unknown> = {};
  for (const kv of m[2].split(',').map(s => s.trim()).filter(Boolean)) {
    const [k, v] = kv.split('=').map(s => s.trim());
    args[k] = v === 'True' ? true : v === 'False' ? false : /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v.replace(/^['"]|['"]$/g, '');
  }
  return { name, args };
}
```

### 4.3 Guardrails for on-device tools

- Only expose **idempotent, reversible** tools to Nano (`onDevice: true`); never payments, deletes, sends.
- Confirm destructive-ish actions with a haptic `warning` and an on-screen chip before executing.
- Log `{ tool, args, source: 'nano' }` locally for the debug HUD; nothing leaves the device.
- If `ToolChoice` fails twice, route the same text to Path A.

---

## 5. Path C: Expose PixelForge to the system Gemini assistant with AppFunctions

AppFunctions (Android 16+, Jetpack `androidx.appfunctions` 1.0.0-alpha10) let **agent apps** such as Gemini discover and execute functions your app publishes, like an on-device MCP server. Integration with Gemini itself is in private preview (trusted testers, as of mid-2026), but the platform API and `adb` tooling are usable today, so build and verify now.

### 5.1 Gradle (in the `pixel-nano` module or a dedicated `pixel-appfunctions` module)

```groovy
plugins { id "com.google.devtools.ksp" }
dependencies {
  implementation "androidx.appfunctions:appfunctions:1.0.0-alpha10"
  ksp "androidx.appfunctions:appfunctions-compiler:1.0.0-alpha10"
}
```

Requires `compileSdk` ≥ 36 (we use 37). `android skills add appfunctions` installs Google's agent skill that scaffolds and migrates this code.

### 5.2 Declare functions

```kotlin
package expo.modules.pixelnano.appfunctions

import androidx.annotation.RequiresApi
import androidx.appfunctions.AppFunction
import androidx.appfunctions.AppFunctionSerializable
import androidx.appfunctions.service.AppFunctionService
import androidx.appfunctions.service.AppFunctionServiceEntryPoint

@AppFunctionSerializable
data class TorchParams(val on: Boolean, val sos: Boolean = false)

@AppFunctionSerializable
data class HardwareStatus(val batteryPct: Int, val thermalHeadroom: Double, val torchOn: Boolean)

@RequiresApi(36)
@AppFunctionServiceEntryPoint(
  serviceName = "PixelForgeAppFunctionService",
  appFunctionXmlFileName = "pixelforge_app_functions",
)
abstract class BasePixelForgeAppFunctionService : AppFunctionService() {

  /**
   * Turn the phone's rear flashlight on or off. Use sos=true for an emergency strobe.
   */
  @AppFunction(isDescribedByKDoc = true)
  suspend fun setTorch(params: TorchParams): Boolean = HardwareBridge.setTorch(params.on, params.sos)

  /**
   * Read battery percentage, thermal headroom (0-1) and flashlight state.
   */
  @AppFunction(isDescribedByKDoc = true)
  suspend fun getHardwareStatus(): HardwareStatus = HardwareBridge.status()
}
```

`HardwareBridge` is a plain Kotlin object that talks to `CameraManager.setTorchMode`, `BatteryManager` and `PowerManager.getThermalHeadroom` directly. AppFunctions run **without your React Native UI**, so they must not depend on JS. Mirror the JS registry's tool names and descriptions so the two catalogues stay identical.

### 5.3 Manifest

```xml
<service
  android:name=".appfunctions.PixelForgeAppFunctionService"
  android:permission="android.permission.BIND_APP_FUNCTION_SERVICE"
  android:exported="true"
  tools:targetApi="36">
  <property android:name="android.app.appfunctions.schema" android:value="app_functions_schema.xsd" />
  <property android:name="android.app.appfunctions.v2" android:value="pixelforge_app_functions.xml" />
  <intent-filter>
    <action android:name="android.app.appfunctions.AppFunctionService" />
  </intent-filter>
</service>
<property android:name="android.app.appfunctions.app_metadata" android:resource="@xml/app_metadata" />
```

Add this through an Expo config plugin (`withAndroidManifest`) so `expo prebuild --clean` never wipes it.

### 5.4 Runtime enable/disable and verification

```kotlin
AppFunctionManager.getInstance(context)?.setAppFunctionEnabled(
  BasePixelForgeAppFunctionServiceIds.SET_TORCH_ID,
  AppFunctionManager.APP_FUNCTION_STATE_ENABLED,
)
```

```bash
adb shell cmd app_function list-app-functions | grep --after-context 10 com.pixelforge.sdk
adb shell "cmd app_function execute-app-function \
  --package com.pixelforge.sdk \
  --function 'expo.modules.pixelnano.appfunctions.BasePixelForgeAppFunctionService#setTorch' \
  --parameters '{\"params\": {\"on\": true, \"sos\": false}}'"
```

If your app is also an **agent** (PixelForge's Delta Bot calling other apps), request `android.permission.EXECUTE_APP_FUNCTIONS` and use `AppFunctionManager` to enumerate and execute other apps' functions, then feed them into the registry as cloud tools.

---

## 6. Choosing a path at runtime

```ts
export async function handleUserIntent(text: string, ctx: { online: boolean; nanoReady: boolean; ai?: GoogleGenAI }) {
  const short = text.length < 240;
  if (ctx.nanoReady && short) {
    try { return await runNanoAgent(text); } catch { /* fall through */ }
  }
  if (ctx.online && ctx.ai) return runCloudAgent(ctx.ai, SYSTEM_PROMPT, [], text);
  return { say: 'Offline and this request needs the cloud.', result: null };
}
```

---

## 7. Checklist

- [ ] Every hardware hook used by AI is registered through `defineTool`, nowhere else.
- [ ] Tool descriptions are one sentence; arguments use enums; reads and writes are separate tools.
- [ ] Cloud loop pushes the model turn before `functionResponse`, caps steps, handles parallel calls.
- [ ] Nano path uses `ToolChoice` first, `tool_code` regex second, cloud third.
- [ ] AppFunctions service listed by `adb shell cmd app_function list-app-functions`.
- [ ] Docs updated per the mandatory rule: `docs/api/neural-ai.md`, `docs/ai-guidance/recipes.md`, `DocsScreen.tsx`.

---

## 8. Sources

- [Gemini API function calling](https://ai.google.dev/gemini-api/docs/function-calling) · [Structured output](https://ai.google.dev/gemini-api/docs/structured-output) · [Models](https://ai.google.dev/gemini-api/docs/models)
- [ML Kit Prompt API](https://developers.google.com/ml-kit/genai/prompt/android) · [Structured output (alpha)](https://developers.google.com/ml-kit/genai/prompt/android/structured-output) · [Firebase hybrid capability table (no on-device function calling)](https://firebase.google.com/docs/ai-logic/hybrid/android/get-started)
- [AppFunctions overview](https://developer.android.com/ai/appfunctions) · [Add AppFunctions](https://developer.android.com/ai/appfunctions/add-appfunctions) · [9to5Google: AppFunctions & Gemini](https://9to5google.com/2026/02/25/android-appfunctions-gemini/)

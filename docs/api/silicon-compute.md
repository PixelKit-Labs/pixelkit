# Silicon & Compute API Reference 💻
> **Tensor G6 7-Core Cluster, PowerVR Vulkan GPU, Tensor TPU, LPDDR5X RAM, and ADPF Thermals**

This document covers all compute and hardware acceleration hooks in PixelForge.

---

## 📑 Module Index

* [`useCPU`](#usecpu) - Tensor G6 7-Core Cluster & Benchmarking
* [`useGPU`](#usegpu) - 120Hz LTPO Frame Pacing & Vulkan Metrics
* [`useTPU`](#usetpu) - Neural Processing Unit & Token Throughput
* [`useMemory`](#usememory) - LPDDR5X RAM & Low Memory Killer (LMK) Protection
* [`useADPF`](#useadpf) - Android Dynamic Performance Framework & Thermals

---

## `useCPU`

Interfaces with the Google Tensor G6 ("Malibu") 7-core asymmetrical cluster fabricated on TSMC 2nm (N2).

### Signature
```typescript
function useCPU(): CPUTelemetry & {
  isBenchmarking: boolean;
  benchmarkCPU: (iterations?: number) => Promise<number>;
  setGovernor: (mode: 'performance' | 'balanced' | 'powersave') => void;
};
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `coreTopology` | `string` | Architecture description (`1x Prime C1-Ultra + 4x C-1 Pro + 2x C-1 Pro`) |
| `coreCount` | `number` | Total CPU execution cores (`7`) |
| `cpuLoadPercent` | `number` | Dynamic CPU load percentage (0–100%) |
| `governorMode` | `'performance' \| 'balanced' \| 'powersave'` | Active CPU frequency scheduler mode |
| `nodeProcess` | `string` | Semiconductor manufacturing node (`"TSMC 2nm (N2)"`) |
| `lastBenchmarkDurationMs` | `number` | Execution time of the last compute benchmark |
| `isBenchmarking` | `boolean` | Whether a compute benchmark is currently executing |

### Methods
* `benchmarkCPU(): Promise<number>`: Executes a multi-threaded integer factorization benchmark.
* `setGovernor(mode): void`: Adjusts simulated thread scheduler profiles.

### Example
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useCPU, HapticButton } from './src';

export function CPUStats() {
  const { coreCount, cpuLoadPercent, nodeProcess, benchmarkCPU, isBenchmarking } = useCPU();

  return (
    <View>
      <Text>Tensor G6 ({nodeProcess}): {coreCount} Cores</Text>
      <Text>Load: {cpuLoadPercent}%</Text>
      <HapticButton
        title={isBenchmarking ? "Benchmarking..." : "Run Compute Benchmark"}
        onPress={benchmarkCPU}
      />
    </View>
  );
}
```

---

## `useGPU`

Monitors real-time GPU frame pacing against the strict 8.33ms render budget of the 120Hz Super Actua LTPO display.

### Signature
```typescript
function useGPU(): GPUTelemetry & {
  targetBudgetMs: number;
  isStuttering: boolean;
};
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `gpuRenderer` | `string` | Graphics renderer identification (`PowerVR / IMG CXTP`) |
| `graphicsApi` | `string` | Active graphics API (`Vulkan 1.3` / `OpenGL ES 3.2`) |
| `frameRenderTimeMs` | `number` | Average frame render time in milliseconds |
| `targetBudgetMs` | `number` | Frame render budget for 120 FPS (`8.33 ms`) |
| `droppedFrameCount` | `number` | Count of dropped frames in the current window |
| `gpuMemoryUsageMB` | `number` | Estimated GPU VRAM utilization |
| `isStuttering` | `boolean` | True if frame render time exceeds 8.33ms |

---

## `useTPU`

Tracks hardware neural acceleration on the Google Tensor TPU (NNAPI, LiteRT / XNNPACK).

### Signature
```typescript
function useTPU(): TPUAcceleration & {
  isBenchmarking: boolean;
  benchmarkTPU: (tensorSize?: number) => Promise<number>;
};
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `activeDelegate` | `'Tensor TPU' \| 'NPU' \| 'GPU' \| 'CPU Fallback'` | Active hardware delegate |
| `isHardwareAccelerated` | `boolean` | True if workloads execute on dedicated TPU silicon |
| `lastInferenceLatencyMs` | `number` | Latency of the most recent neural pass in ms |
| `throughputTokensPerSec` | `number` | Estimated token throughput (~45–90 tokens/sec) |
| `memoryFootprintMB` | `number` | Memory allocated to model weights |

---

## `useMemory`

Monitors LPDDR5X unified physical RAM, free memory, and provides cache purging to prevent Low Memory Killer (LMK) aborts.

### Signature
```typescript
function useMemory(): MemoryTelemetry & {
  purgeCaches: () => void;
};
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `totalRAMMB` | `number` | Total physical RAM (e.g. `16384 MB` on 512GB/1TB models) |
| `usedRAMMB` | `number` | Currently allocated memory |
| `freeRAMMB` | `number` | Available free headroom |
| `isLowMemory` | `boolean` | True if memory pressure triggers LMK warnings |

---

## `useADPF`

Queries the Android Dynamic Performance Framework kernel subsystem for thermal headroom and power budgets.

### Signature
```typescript
function useADPF(): PerformanceHeadroom & {
  reportWorkDuration: (actualDurationMs: number) => void;
};
```

### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `cpuHeadroom` | `number` | CPU capacity remaining (0.0 to 1.0) |
| `gpuHeadroom` | `number` | GPU capacity remaining (0.0 to 1.0) |
| `thermalStatus` | `'nominal' \| 'light' \| 'moderate' \| 'severe' \| 'critical'` | Kernel thermal throttling state |
| `targetFps` | `number` | Display refresh target (`120`) |
| `currentFps` | `number` | Rendered frames per second |

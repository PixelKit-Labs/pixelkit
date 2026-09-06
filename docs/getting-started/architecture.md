# Pixel 11 Pro Silicon & System Architecture ⚡
> **Hardware Specifications, TSMC 2nm Process, Tensor G6 Malibu, and Titan M3**

This document outlines the silicon engineering and hardware subsystem design of the **Google Pixel 11 Pro** and how PixelForge interfaces with each layer.

---

## 🔬 Silicon Subsystem Overview

| Component | Chipset / Hardware | Key Specifications |
| :--- | :--- | :--- |
| **SoC** | Google Tensor G6 ("Malibu") | Fabricated on TSMC 2nm (N2) node |
| **CPU** | Custom 7-Core Cluster | 1x ARM C1-Ultra @ 4.11 GHz, 4x C-1 Pro @ 3.38 GHz, 2x C-1 Pro @ 2.65 GHz |
| **GPU** | PowerVR / IMG CXTP | Vulkan 1.3 / OpenGL ES 3.2, 8.33ms 120 FPS frame budget |
| **TPU / NPU**| Google Tensor TPU | +50% neural compute power, LiteRT / NNAPI delegates |
| **RAM** | LPDDR5X Unified | 12 GB (256GB models) or 16 GB (512GB / 1TB models) |
| **Security**| Google Titan M3 + Android Keystore | StrongBox keystore (verified); Google states PQC secure boot; SecureStore uses classical AES |
| **Modem** | MediaTek M90 | Wi-Fi 7 (802.11be), 5G Sub-6/mmWave, Direct-to-Cell Satellite SOS |
| **Display** | Super Actua LTPO OLED | 3,600 nits peak, 1-120Hz variable refresh, anti-scratch glass |
| **Actuators**| Linear Resonant Actuator (LRA) | Precision mechanical tactile click profiles |
| **Visual Bar**| HiLight LED Ring | Rear camera bar multi-color notification & Gemini AI status ring |
| **Camera** | Triple Optical System | 50MP Wide, 48MP Ultrawide, 48MP 5x Periscope |
| **Spatial** | Ultra-Wideband (UWB) | Ranging & Angle-of-Arrival (simulated until RangingManager) |
| **Power** | Pixelsnap Qi2.2 | 25W magnetic wireless charging (MagSafe accessory compatible) |

---

## 🏛️ Tensor G6 "Malibu" Microarchitecture

The Tensor G6 was engineered by Google's gChips team to resolve thermal dissipation constraints:

### 1. Asymmetrical 7-Core Topology
Unlike typical 8-core chips, the G6 drops one power-hungry core in favor of an optimized 1+4+2 layout:
* **1x ARM C1-Ultra Prime Core** (up to 4.11 GHz): Reserved for single-threaded bursts, UI transitions, and urgent interrupt handling.
* **4x ARM C-1 Pro Performance Cores** (up to 3.38 GHz): Executes heavy sustained multi-threading, image signal processing (ISP), and physics engines.
* **2x ARM C-1 Pro Efficiency Cores** (up to 2.65 GHz): Handles sensor telemetry loops, background timers, audio decibel polling, and idle standby.

### 2. TSMC 2nm (N2) Node
Fabricated on TSMC's 2nm process node, delivering approximately 20% higher power efficiency and 25% faster web/app responsiveness over 3nm silicon.

### 3. MediaTek M90 Modem
Replaces previous Samsung Exynos modems, eliminating thermal buildup and drain during cellular standby. Adds Direct-to-Cell Satellite SOS support.

---

## 🛡️ Titan M3 Security Coprocessor & Keystore

The **Titan M3** coprocessor introduces quantum-resistant algorithms to mobile hardware:
* **Quantum-Resistant Secure Boot**: Protects OS kernel verification against quantum computing attack vectors.
* **Hardware KeyStore**: StrongBox-backed isolated enclave with encrypted cryptographic storage via `useSecurity().saveSecureItem()`.
* **Biometric Vault**: Protects under-display ultrasonic fingerprint and Class 3 3D Face Unlock vectors.

---

## 💡 HiLight Camera Bar Glanceable Notification System

Integrated into the camera flash visor, **HiLight** replaces the legacy infrared thermopile on the Pixel 11 Pro:
* **Face-Down Glanceable Mode**: Delivers glanceable status when the phone is resting on a desk.
* **Gemini AI Breathing Glow**: Cycles cyan light pulses while Google Gemini generates reasoning tokens.
* **Contact Color Alerts**: Custom color-coded pulses for VIP contacts and urgent alerts.

---

## ⚡ React Native & Hermes Runtime Bridge

```
[ JavaScript / TypeScript Application Code ]
                     │
                     ▼
[ Hermes Virtual Machine (AOT Bytecode .hbc) ]
                     │
                     ▼
[ React Native Fabric Renderer & TurboModules (0.86) ]
                     │
                     ▼
[ Expo SDK 57 Android Native Modules & C++ JSI ]
                     │
                     ▼
[ Android 15/16 HAL (Hardware Abstraction Layer) ]
                     │
  ┌──────────────┬───┴──────────┬──────────────┬──────────────┐
  ▼              ▼              ▼              ▼              ▼
Tensor G6      PowerVR        Titan M3       CameraX        Sensors
CPU / TPU      GPU            Keystore       Zoom           IMU / UWB
```

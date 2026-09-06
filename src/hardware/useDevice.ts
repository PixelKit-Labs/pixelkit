import { useState, useEffect } from 'react';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import { DeviceTelemetry } from '../core/types';

/**
 * PixelForge Device Telemetry Hook
 * Reports hardware model, battery levels, charging state, and network connectivity.
 */
export function useDevice(): DeviceTelemetry {
  const [telemetry, setTelemetry] = useState<DeviceTelemetry>({
    modelName: Device.modelName || 'Pixel 11 Pro',
    brand: Device.brand || 'Google',
    osVersion: Device.osVersion || 'Android 16',
    batteryLevel: 1.0,
    isCharging: false,
    lowPowerMode: false,
    networkType: 'WIFI',
    isConnected: true,
    totalMemoryMB: Device.totalMemory ? Math.round(Device.totalMemory / (1024 * 1024)) : 12288,
  });

  useEffect(() => {
    let batteryLevelSub: any;
    let batteryStateSub: any;

    const fetchDeviceStatus = async () => {
      try {
        const [batteryLevel, batteryState, lowPower, networkState] = await Promise.all([
          Battery.getBatteryLevelAsync().catch(() => 1.0),
          Battery.getBatteryStateAsync().catch(() => Battery.BatteryState.UNPLUGGED),
          Battery.isLowPowerModeEnabledAsync().catch(() => false),
          Network.getNetworkStateAsync().catch(() => ({ isConnected: true, type: Network.NetworkStateType.WIFI })),
        ]);

        setTelemetry(prev => ({
          ...prev,
          batteryLevel: Math.round(batteryLevel * 100),
          isCharging: batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL,
          lowPowerMode: lowPower,
          networkType: networkState.type || 'UNKNOWN',
          isConnected: !!networkState.isConnected,
        }));

        batteryLevelSub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
          setTelemetry(prev => ({ ...prev, batteryLevel: Math.round(batteryLevel * 100) }));
        });

        batteryStateSub = Battery.addBatteryStateListener(({ batteryState }) => {
          setTelemetry(prev => ({
            ...prev,
            isCharging: batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL,
          }));
        });
      } catch {
        // Fallback for environments where battery/network listeners are restricted
      }
    };

    fetchDeviceStatus();

    return () => {
      batteryLevelSub?.remove();
      batteryStateSub?.remove();
    };
  }, []);

  return telemetry;
}

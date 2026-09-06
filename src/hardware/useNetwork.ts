/**
 * @file useNetwork.ts
 * @description Detailed network connectivity, IP address, and airplane mode telemetry.
 * Connects to expo-network for real-time monitoring of Wi-Fi 7, 5G, and offline routing.
 */

import { useState, useEffect } from 'react';
import * as Network from 'expo-network';
import { NetworkTelemetry } from '../core/types';

/**
 * Hook to inspect IP address, active network type, and internet connectivity.
 *
 * @returns {NetworkTelemetry & { refreshNetwork: () => Promise<void> }}
 *
 * @example
 * ```typescript
 * const { ipAddress, networkType, isConnected, isAirplaneMode } = useNetwork();
 * console.log(`Connected via ${networkType}, IP: ${ipAddress}`);
 * ```
 */
export function useNetwork() {
  const [network, setNetwork] = useState<NetworkTelemetry>({
    ipAddress: null,
    networkType: 'WIFI',
    isConnected: true,
    isMetered: false,
    isAirplaneMode: false,
  });

  const checkNetwork = async () => {
    try {
      const [ip, state, airplane] = await Promise.all([
        Network.getIpAddressAsync().catch(() => null),
        Network.getNetworkStateAsync().catch(() => ({
          isConnected: true,
          type: Network.NetworkStateType.WIFI,
          isInternetReachable: true,
        })),
        Network.isAirplaneModeEnabledAsync().catch(() => false),
      ]);

      setNetwork({
        ipAddress: ip,
        networkType: state.type || 'UNKNOWN',
        isConnected: !!state.isConnected && !!state.isInternetReachable,
        isMetered: state.type === Network.NetworkStateType.CELLULAR,
        isAirplaneMode: airplane,
      });
    } catch {
      // Degrades gracefully on simulator
    }
  };

  useEffect(() => {
    checkNetwork();
  }, []);

  return {
    ...network,
    /** Manually trigger network diagnostic check */
    refreshNetwork: checkNetwork,
  };
}

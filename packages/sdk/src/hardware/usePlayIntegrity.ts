/**
 * @file usePlayIntegrity.ts
 * @description Titan M2 Hardware Key Attestation & Google Play Integrity integration.
 * Verified on Pixel 11 Pro: `feature:android.hardware.strongbox_keystore` (version 400),
 * `feature:android.hardware.hardware_keystore` (version 500), `feature:android.hardware.keystore.app_attest_key`,
 * and Google Play Services 26.32+ on Android 17.
 * Nothing is simulated: queries actual device hardware security module (HSM) and KeyStore attestation.
 */

import { useCallback, useEffect, useState } from 'react';
import PixelNative, {
  type PlayIntegrityInfo,
  type HardwareAttestationResult,
} from '@pixelkit-labs/native';
import { logEvent, recordMetric, type TelemetrySource } from '../core/observability';

const MODULE = 'usePlayIntegrity';

export { type PlayIntegrityInfo, type HardwareAttestationResult };

export interface PlayIntegrityState {
  /** Whether hardware attestation and Play Integrity are supported on device */
  isSupported: boolean;
  /** Whether Titan M2 hardware StrongBox security chip is present */
  hasStrongBox: boolean;
  /** StrongBox KeyMint version (400 on Pixel 11 Pro) */
  strongBoxVersion: number | null;
  /** Hardware KeyStore version (500 on Android 17 / Pixel 11 Pro) */
  hardwareKeystoreVersion: number | null;
  /** Whether device supports individual key attestation (android.hardware.keystore.app_attest_key) */
  hasAppAttestKey: boolean;
  /** Whether device satisfies Android hardware security model */
  securityModelCompatible: boolean;
  /** Whether Google Play Services is available and active */
  playServicesAvailable: boolean;
  /** Google Play Services version string */
  playServicesVersion: string | null;
  /** Hardware integrity tier verdict */
  deviceIntegrity: 'MEETS_STRONG_INTEGRITY' | 'MEETS_DEVICE_INTEGRITY' | 'MEETS_BASIC_INTEGRITY' | 'UNVERIFIED';
  /** Whether a cryptographic attestation operation is running */
  isAttesting: boolean;
  /** Result of last hardware key attestation */
  lastAttestation: HardwareAttestationResult | null;
  /** Latest error if attestation failed */
  error: string | null;
  /** Telemetry provenance */
  source: TelemetrySource;
  /** Request hardware-backed key attestation from Titan M2 StrongBox KeyStore */
  requestAttestation: (challenge?: string) => Promise<HardwareAttestationResult | null>;
  /** Re-probe device security features and Play Integrity status */
  refresh: () => PlayIntegrityInfo | null;
}

/**
 * Hook to inspect Titan M2 hardware security attributes, evaluate Play Integrity verdicts,
 * and execute hardware-backed cryptographic key attestation on Google Pixel devices.
 *
 * @example
 * ```typescript
 * const { isSupported, hasStrongBox, deviceIntegrity, requestAttestation } = usePlayIntegrity();
 *
 * const onVerifyHardware = async () => {
 *   const attestation = await requestAttestation("app_session_nonce_123");
 *   console.log("Titan M2 Key Attested:", attestation?.securityLevel);
 * };
 * ```
 */
export function usePlayIntegrity(): PlayIntegrityState {
  const [data, setData] = useState<PlayIntegrityInfo | null>(null);
  const [isAttesting, setIsAttesting] = useState<boolean>(false);
  const [lastAttestation, setLastAttestation] = useState<HardwareAttestationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback((): PlayIntegrityInfo | null => {
    if (!PixelNative) {
      logEvent(MODULE, 'native module absent; play integrity unavailable', undefined, 'warn');
      return null;
    }
    try {
      const info = PixelNative.getPlayIntegrityInfo();
      setData(info);
      if (info.error) {
        setError(info.error);
      } else {
        setError(null);
      }
      recordMetric(MODULE, 'isSupported', info.isSupported ? 1 : 0, info.isSupported ? 'hardware' : 'unavailable');
      recordMetric(MODULE, 'hasStrongBox', info.hasStrongBox ? 1 : 0, info.hasStrongBox ? 'hardware' : 'unavailable');
      recordMetric(MODULE, 'strongBoxVersion', info.strongBoxVersion ?? 0, info.hasStrongBox ? 'hardware' : 'unavailable');
      logEvent(MODULE, 'play integrity queried', {
        isSupported: info.isSupported,
        hasStrongBox: info.hasStrongBox,
        strongBoxVersion: info.strongBoxVersion,
        hardwareKeystoreVersion: info.hardwareKeystoreVersion,
        deviceIntegrity: info.deviceIntegrity,
      });
      return info;
    } catch (e: any) {
      const msg = e?.message ?? 'getPlayIntegrityInfo failed';
      setError(msg);
      logEvent(MODULE, 'getPlayIntegrityInfo error', { error: msg }, 'error');
      return null;
    }
  }, []);

  const requestAttestation = useCallback(
    async (challenge?: string): Promise<HardwareAttestationResult | null> => {
      if (!PixelNative) {
        setError('Native module not available');
        return null;
      }
      setIsAttesting(true);
      setError(null);
      const startMs = Date.now();
      try {
        const result = await PixelNative.attestHardwareKey(challenge ?? null);
        setLastAttestation(result);
        const durationMs = Date.now() - startMs;
        recordMetric(MODULE, 'attestationDurationMs', durationMs, 'hardware');
        logEvent(MODULE, 'hardware key attestation generated', {
          algorithm: result.algorithm,
          securityLevel: result.securityLevel,
          isStrongBoxBacked: result.isStrongBoxBacked,
          durationMs,
        });
        return result;
      } catch (e: any) {
        const msg = e?.message ?? 'Key attestation failed';
        setError(msg);
        logEvent(MODULE, 'key attestation error', { error: msg }, 'error');
        return null;
      } finally {
        setIsAttesting(false);
      }
    },
    []
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isHardware = Boolean(PixelNative && data?.isSupported);

  return {
    isSupported: data?.isSupported ?? false,
    hasStrongBox: data?.hasStrongBox ?? false,
    strongBoxVersion: data?.strongBoxVersion ?? null,
    hardwareKeystoreVersion: data?.hardwareKeystoreVersion ?? null,
    hasAppAttestKey: data?.hasAppAttestKey ?? false,
    securityModelCompatible: data?.securityModelCompatible ?? false,
    playServicesAvailable: data?.playServicesAvailable ?? false,
    playServicesVersion: data?.playServicesVersion ?? null,
    deviceIntegrity: data?.deviceIntegrity ?? 'UNVERIFIED',
    isAttesting,
    lastAttestation,
    error,
    source: isHardware ? 'hardware' : 'unavailable',
    requestAttestation,
    refresh,
  };
}

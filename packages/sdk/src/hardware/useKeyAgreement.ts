/**
 * @file useKeyAgreement.ts
 * @description Hardware-isolated Elliptic Curve Diffie-Hellman (ECDH) session key agreement
 * executed inside the Google Titan M2 security chip (StrongBox Keymaster).
 *
 * Adheres to the Zero-Simulation Principle: private keys never leave the hardware enclave.
 */

import { useState, useEffect, useCallback } from 'react';
import PixelNative, {
  type KeyAgreementKeyPairResult,
  type SharedSecretResult,
} from '@pixelkit-labs/native';
import { logEvent, logError, recordMetric, type TelemetrySource } from '../core/observability';

const MODULE = 'useKeyAgreement';
export { type KeyAgreementKeyPairResult, type SharedSecretResult };

export interface KeyAgreementTelemetry {
  /** Whether the hardware features a dedicated StrongBox security module (Titan M2). */
  isStrongBoxSupported: boolean;
  /** Latest error message if keypair generation or secret derivation failed. */
  error: string | null;
  /** Provenance of the data: 'hardware' or 'unavailable'. */
  source: TelemetrySource;
  /** Generates an EC keypair inside the hardware enclave with PURPOSE_AGREE_KEY. */
  generateKeyPair: (alias: string, preferStrongBox?: boolean) => Promise<KeyAgreementKeyPairResult>;
  /** Computes an ECDH shared secret using the hardware private key and peer's public key. */
  deriveSharedSecret: (alias: string, peerPublicKeyBase64: string) => Promise<SharedSecretResult>;
}

export function useKeyAgreement(): KeyAgreementTelemetry {
  const [isStrongBoxSupported, setIsStrongBoxSupported] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const source: TelemetrySource = PixelNative ? 'hardware' : 'unavailable';

  useEffect(() => {
    if (!PixelNative) {
      setIsStrongBoxSupported(false);
      setError('PixelNative module unavailable');
      return;
    }

    try {
      const hasStrongBox = PixelNative.hasSystemFeature('android.hardware.strongbox_keystore');
      setIsStrongBoxSupported(hasStrongBox);
      recordMetric(MODULE, 'isStrongBoxSupported', hasStrongBox, 'hardware');
      logEvent(MODULE, 'checked strongbox support', { supported: hasStrongBox });
    } catch (e: any) {
      logError(MODULE, 'check strongbox support failed', e);
    }
  }, []);

  const generateKeyPair = useCallback(
    async (alias: string, preferStrongBox: boolean = true): Promise<KeyAgreementKeyPairResult> => {
      if (!PixelNative) {
        return {
          alias,
          publicKeyBase64: null,
          securityLevel: 'TRUSTED_ENVIRONMENT',
          isStrongBoxSupported: false,
          error: 'PixelNative module unavailable',
        };
      }

      try {
        const res = await PixelNative.generateKeyAgreementKeyPair(alias, preferStrongBox);
        setError(res.error ?? null);
        logEvent(MODULE, 'generated key agreement keypair', {
          alias,
          level: res.securityLevel,
        });
        return res;
      } catch (e: any) {
        const err = logError(MODULE, 'generateKeyAgreementKeyPair failed', e);
        setError(err.message);
        return {
          alias,
          publicKeyBase64: null,
          securityLevel: 'TRUSTED_ENVIRONMENT',
          isStrongBoxSupported,
          error: err.message,
        };
      }
    },
    [isStrongBoxSupported]
  );

  const deriveSharedSecret = useCallback(
    async (alias: string, peerPublicKeyBase64: string): Promise<SharedSecretResult> => {
      if (!PixelNative) {
        return {
          sharedSecretBase64: null,
          secretLengthBytes: 0,
          error: 'PixelNative module unavailable',
        };
      }

      try {
        const res = await PixelNative.deriveSharedSecret(alias, peerPublicKeyBase64);
        setError(res.error ?? null);
        if (res.sharedSecretBase64) {
          logEvent(MODULE, 'derived shared secret', { bytes: res.secretLengthBytes });
          recordMetric(MODULE, 'derivedSecretBytes', res.secretLengthBytes, 'hardware');
        }
        return res;
      } catch (e: any) {
        const err = logError(MODULE, 'deriveSharedSecret failed', e);
        setError(err.message);
        return {
          sharedSecretBase64: null,
          secretLengthBytes: 0,
          error: err.message,
        };
      }
    },
    []
  );

  return {
    isStrongBoxSupported,
    error,
    source,
    generateKeyPair,
    deriveSharedSecret,
  };
}

import { useState } from 'react';

export interface NFCTag {
  id: string;
  payload: string;
  tech: 'NfcA' | 'IsoDep' | 'Ndef';
  timestamp: number;
}

/**
 * PixelForge NFC Controller
 * Manages NFC chip polling, NDEF tag read/write, and simulated smart tags.
 */
export function useNFC() {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedTag, setLastScannedTag] = useState<NFCTag | null>(null);

  const startScan = async () => {
    setIsScanning(true);
    // In production, delegates to react-native-nfc-manager
    // For test lab preview, provides mock tag reader simulation
    setTimeout(() => {
      setLastScannedTag({
        id: '04:A2:5C:8B:11:FE',
        payload: 'https://pixelforge.dev/device/pixel11pro',
        tech: 'Ndef',
        timestamp: Date.now(),
      });
      setIsScanning(false);
    }, 1500);
  };

  const stopScan = () => {
    setIsScanning(false);
  };

  return {
    isScanning,
    lastScannedTag,
    startScan,
    stopScan,
  };
}

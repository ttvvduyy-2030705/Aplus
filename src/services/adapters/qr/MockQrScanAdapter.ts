import type {QrScanAdapter} from './QrScanAdapter';

const qrCapabilities = {
  supportsRemoteUnlock: true,
  supportsFingerprint: true,
  supportsFace: true,
  supportsCard: true,
  supportsNfc: true,
  supportsRemoteControl: true,
  supportsGateway: true,
  supportsOta: true,
};

export const MockQrScanAdapter: QrScanAdapter = {
  async openScanner() {
    await wait(240);
    const suffix = String(Date.now()).slice(-5);
    return {
      rawValue: `APLUS-LOCK|serial=APL-QR-${suffix}|model=Aplus L5 Pro`,
      deviceId: `qr-lock-${suffix}`,
      serial: `APL-QR-${suffix}`,
      model: 'Aplus L5 Pro',
      name: `Aplus QR Lock ${suffix}`,
      capabilities: qrCapabilities,
    };
  },
};

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

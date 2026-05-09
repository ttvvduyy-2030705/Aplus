import type {QrScanAdapter} from './QrScanAdapter';

export const MockQrScanAdapter: QrScanAdapter = {
  async openScanner() {
    await wait(240);
    return {rawValue: 'APLUS-LOCK-MOCK-QR-001', deviceId: 'lock-main-001'};
  },
};

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

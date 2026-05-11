import type {BleAdapter, BleDevice} from './BleAdapter';

const fullCapabilities = {
  supportsRemoteUnlock: true,
  supportsFingerprint: true,
  supportsFace: true,
  supportsCard: true,
  supportsNfc: true,
  supportsRemoteControl: true,
  supportsGateway: true,
  supportsOta: true,
};

const basicCapabilities = {
  supportsRemoteUnlock: true,
  supportsFingerprint: true,
  supportsFace: false,
  supportsCard: true,
  supportsNfc: false,
  supportsRemoteControl: true,
  supportsGateway: true,
  supportsOta: true,
};

const mockDevices: BleDevice[] = [
  {id: 'ble-lock-001', name: 'Aplus Lock BLE 001', rssi: -48, serial: 'APL-BLE-001', model: 'Aplus L5 Pro', capabilities: fullCapabilities},
  {id: 'ble-lock-002', name: 'Aplus Lock BLE 002', rssi: -66, serial: 'APL-BLE-002', model: 'Aplus Hotel Card Pro', capabilities: basicCapabilities},
];

export const MockBleAdapter: BleAdapter = {
  async scanLocks() {
    await wait(300);
    return mockDevices;
  },
  async connect(deviceId: string) {
    await wait(250);
    return {connected: true, deviceId};
  },
  async disconnect() {
    await wait(120);
  },
};

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

import type {BleAdapter, BleDevice} from './BleAdapter';

const mockDevices: BleDevice[] = [
  {id: 'ble-lock-001', name: 'Aplus Lock BLE 001', rssi: -48},
  {id: 'ble-lock-002', name: 'Aplus Lock BLE 002', rssi: -66},
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
  return new Promise(resolve => setTimeout(resolve, ms));
}

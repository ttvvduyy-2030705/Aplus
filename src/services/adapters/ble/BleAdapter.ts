export type BleDevice = {
  id: string;
  name: string;
  rssi?: number;
};

export interface BleAdapter {
  scanLocks(): Promise<BleDevice[]>;
  connect(deviceId: string): Promise<{connected: boolean; deviceId: string}>;
  disconnect(deviceId: string): Promise<void>;
}

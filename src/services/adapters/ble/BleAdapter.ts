import type {LockCapabilities} from '@/types/lock';

export type BleDevice = {
  id: string;
  name: string;
  rssi?: number;
  serial?: string;
  model?: string;
  capabilities?: LockCapabilities;
};

export interface BleAdapter {
  scanLocks(): Promise<BleDevice[]>;
  connect(deviceId: string): Promise<{connected: boolean; deviceId: string}>;
  disconnect(deviceId: string): Promise<void>;
}

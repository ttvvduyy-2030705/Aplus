import type {LockCapabilities} from '@/types/lock';

export type QrScanResult = {
  rawValue: string;
  deviceId?: string;
  serial?: string;
  model?: string;
  name?: string;
  capabilities?: LockCapabilities;
};

export interface QrScanAdapter {
  openScanner(): Promise<QrScanResult>;
}

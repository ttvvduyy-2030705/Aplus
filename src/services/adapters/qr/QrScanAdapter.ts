export type QrScanResult = {
  rawValue: string;
  deviceId?: string;
};

export interface QrScanAdapter {
  openScanner(): Promise<QrScanResult>;
}

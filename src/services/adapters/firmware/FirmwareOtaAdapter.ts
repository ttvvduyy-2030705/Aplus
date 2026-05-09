export type FirmwarePackage = {
  version: string;
  sizeMb: number;
  required: boolean;
};

export interface FirmwareOtaAdapter {
  checkUpdate(lockId: string): Promise<FirmwarePackage | undefined>;
  startUpdate(lockId: string, version: string): Promise<{jobId: string}>;
  getProgress(jobId: string): Promise<{percent: number; status: 'running' | 'done' | 'failed'}>;
}

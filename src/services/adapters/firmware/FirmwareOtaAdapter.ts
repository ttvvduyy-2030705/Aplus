export type FirmwarePackage = {
  version: string;
  sizeMb: number;
  required: boolean;
};

export type FirmwareOtaProgressStatus = 'running' | 'installing' | 'rebooting' | 'done' | 'failed';

export interface FirmwareOtaAdapter {
  checkUpdate(lockId: string, currentVersion?: string): Promise<FirmwarePackage | undefined>;
  startUpdate(lockId: string, version: string): Promise<{jobId: string}>;
  getProgress(jobId: string): Promise<{percent: number; status: FirmwareOtaProgressStatus; message: string}>;
}

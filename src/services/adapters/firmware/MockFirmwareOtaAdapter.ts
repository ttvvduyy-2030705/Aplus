import type {FirmwareOtaAdapter} from './FirmwareOtaAdapter';

export const MockFirmwareOtaAdapter: FirmwareOtaAdapter = {
  async checkUpdate() {
    await wait(260);
    return {version: '1.0.1-mock', sizeMb: 3.8, required: false};
  },
  async startUpdate(lockId: string, version: string) {
    await wait(260);
    return {jobId: `ota-${lockId}-${version}`};
  },
  async getProgress() {
    await wait(180);
    return {percent: 100, status: 'done'};
  },
};

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

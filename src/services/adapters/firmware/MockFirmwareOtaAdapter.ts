import type {FirmwareOtaAdapter, FirmwareOtaProgressStatus} from './FirmwareOtaAdapter';

type OtaJob = {
  jobId: string;
  lockId: string;
  version: string;
  pollCount: number;
  fail: boolean;
};

const jobs = new Map<string, OtaJob>();

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function compareVersion(version: string): number[] {
  return version
    .replace(/[^0-9.].*$/, '')
    .split('.')
    .map(part => Number(part) || 0);
}

function isBehind(currentVersion: string, latestVersion: string) {
  const current = compareVersion(currentVersion);
  const latest = compareVersion(latestVersion);
  for (let index = 0; index < Math.max(current.length, latest.length); index += 1) {
    const currentPart = current[index] ?? 0;
    const latestPart = latest[index] ?? 0;
    if (currentPart < latestPart) {
      return true;
    }
    if (currentPart > latestPart) {
      return false;
    }
  }
  return false;
}

function statusForPoll(pollCount: number, fail: boolean): {percent: number; status: FirmwareOtaProgressStatus; message: string} {
  if (fail && pollCount >= 4) {
    return {percent: 58, status: 'failed', message: 'Gateway trả lỗi mock trong lúc cài đặt. Giữ firmware cũ.'};
  }
  if (pollCount <= 1) {
    return {percent: 18, status: 'running', message: 'Đang tải gói OTA từ server mock.'};
  }
  if (pollCount === 2) {
    return {percent: 44, status: 'running', message: 'Đã tải gói, đang kiểm tra checksum.'};
  }
  if (pollCount === 3) {
    return {percent: 72, status: 'installing', message: 'Đang ghi firmware vào thiết bị.'};
  }
  if (pollCount === 4) {
    return {percent: 91, status: 'rebooting', message: 'Thiết bị reboot, không xoá lock khỏi app.'};
  }
  return {percent: 100, status: 'done', message: 'OTA thành công và thiết bị online lại.'};
}

export const MockFirmwareOtaAdapter: FirmwareOtaAdapter = {
  async checkUpdate(lockId, currentVersion = '1.0.0-mock') {
    await wait(260);
    const latestVersion = lockId.includes('office') ? '1.2.0-mock' : lockId.includes('hotel') ? '1.1.0-mock' : '1.0.2-mock';
    if (!isBehind(currentVersion, latestVersion)) {
      return undefined;
    }
    return {version: latestVersion, sizeMb: latestVersion.startsWith('1.2') ? 6.4 : 3.8, required: currentVersion.includes('0.9')};
  },
  async startUpdate(lockId: string, version: string) {
    await wait(260);
    const jobId = `ota-${lockId}-${version}-${Date.now()}`;
    jobs.set(jobId, {jobId, lockId, version, pollCount: 0, fail: lockId.includes('fail')});
    return {jobId};
  },
  async getProgress(jobId: string) {
    await wait(180);
    const job = jobs.get(jobId);
    if (!job) {
      return {percent: 0, status: 'failed', message: 'Không tìm thấy OTA job.'};
    }
    job.pollCount += 1;
    jobs.set(jobId, job);
    return statusForPoll(job.pollCount, job.fail);
  },
};

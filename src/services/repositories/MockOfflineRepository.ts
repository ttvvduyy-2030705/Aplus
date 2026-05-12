import {MockCredentialRepository} from './MockCredentialRepository';
import {MockLockRepository} from './MockLockRepository';
import type {CredentialType} from '@/types/credential';
import type {AccessRecord, AplusLock} from '@/types/lock';
import type {ConflictResolution, OfflineCacheItem, OfflineSummary, SyncConflict, SyncQueueJob, SyncQueueJobStatus, SyncQueueJobType} from '@/types/offline';

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const day = 1000 * 60 * 60 * 24;
let lastSyncAt = Date.now() - 1000 * 60 * 9;
let cachedAt = Date.now() - 1000 * 60 * 18;

let jobs: SyncQueueJob[] = [
  {
    id: 'offline-job-rename-520',
    type: 'rename_lock',
    title: 'Đổi tên khóa Căn hộ 520',
    description: 'Offline safe · đổi tên sẽ sync khi online, nhưng server có thay đổi mới hơn nên cần resolve conflict.',
    status: 'conflict',
    offlineSafe: true,
    attempts: 1,
    lockId: 'lock-home-520',
    lockName: 'Căn hộ 520',
    createdAt: Date.now() - 1000 * 60 * 42,
    updatedAt: Date.now() - 1000 * 60 * 19,
    payload: {localName: 'Căn hộ 520 - cửa chính', serverName: 'Căn hộ 520'},
    conflictId: 'offline-conflict-rename-520',
  },
  {
    id: 'offline-job-note-record',
    type: 'record_note',
    title: 'Ghi chú bản ghi mở khóa',
    description: 'Offline safe · lưu ghi chú kiểm tra sự cố vào record gần nhất.',
    status: 'pending',
    offlineSafe: true,
    attempts: 0,
    recordId: 'record-remote-success-520',
    lockId: 'lock-home-520',
    lockName: 'Căn hộ 520',
    createdAt: Date.now() - 1000 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 24,
    payload: {note: 'Đã xác minh khách thuê mở hợp lệ khi mất mạng.'},
  },
  {
    id: 'offline-job-draft-nfc',
    type: 'draft_credential',
    title: 'Draft NFC cho khách thuê',
    description: 'Offline safe · chỉ tạo draft credential, không cấp quyền phần cứng khi offline.',
    status: 'pending',
    offlineSafe: true,
    attempts: 0,
    credentialType: 'nfc',
    lockId: 'lock-home-1208',
    lockName: 'Cửa chính A1208',
    createdAt: Date.now() - 1000 * 60 * 14,
    updatedAt: Date.now() - 1000 * 60 * 14,
    payload: {ownerId: 'person-tenant-520'},
  },
  {
    id: 'offline-job-remote-blocked',
    type: 'remote_unlock_blocked',
    title: 'Remote unlock offline bị chặn',
    description: 'Không offline safe · lệnh mở khóa từ xa không được queue khi mất mạng.',
    status: 'failed',
    offlineSafe: false,
    attempts: 1,
    lockId: 'lock-hotel-0701',
    lockName: 'Phòng khách sạn 701',
    createdAt: Date.now() - 1000 * 60 * 8,
    updatedAt: Date.now() - 1000 * 60 * 8,
    payload: {reason: 'Remote unlock offline is blocked'},
    errorMessage: 'Remote unlock offline bị chặn để tránh sai trạng thái khóa.',
    result: 'blocked',
  },
];

let conflicts: SyncConflict[] = [
  {
    id: 'offline-conflict-rename-520',
    jobId: 'offline-job-rename-520',
    entity: 'locks',
    entityId: 'lock-home-520',
    title: 'Tên khóa bị thay đổi ở server',
    localValue: 'Căn hộ 520 - cửa chính',
    serverValue: 'Căn hộ 520',
    policy: 'manual',
    status: 'open',
    createdAt: Date.now() - 1000 * 60 * 19,
    note: 'Server có update mới hơn trong lúc thiết bị offline.',
  },
];

function cloneJob(job: SyncQueueJob): SyncQueueJob {
  return {...job, payload: {...job.payload}};
}

function cloneConflict(conflict: SyncConflict): SyncConflict {
  return {...conflict};
}

function jobTone(status: SyncQueueJobStatus): 'success' | 'failed' | 'blocked' | 'pending' {
  if (status === 'success') {
    return 'success';
  }
  if (status === 'failed' || status === 'cancelled') {
    return 'failed';
  }
  if (status === 'conflict') {
    return 'blocked';
  }
  return 'pending';
}

function buildSummary(isOffline: boolean): OfflineSummary {
  return {
    cacheItems: 6,
    cachedRecords: 0,
    pendingJobs: jobs.filter(job => job.status === 'pending' || job.status === 'running').length,
    successJobs: jobs.filter(job => job.status === 'success').length,
    failedJobs: jobs.filter(job => job.status === 'failed').length,
    conflictJobs: jobs.filter(job => job.status === 'conflict').length,
    cancelledJobs: jobs.filter(job => job.status === 'cancelled').length,
    lastSyncAt,
    isOffline,
  };
}

function makeRecord(lock: AplusLock | undefined, job: SyncQueueJob, result: 'success' | 'failed' | 'blocked' = 'success'): AccessRecord {
  const now = Date.now();
  return {
    id: `record-offline-${job.id}-${now}`,
    lockId: lock?.id ?? job.lockId ?? 'offline-cache',
    lockName: lock?.name ?? job.lockName ?? 'Offline cache',
    roomName: lock?.roomName ?? 'Offline Queue',
    method: 'System',
    result: result === 'success' ? 'success' : result === 'blocked' ? 'blocked' : 'failed',
    actorName: 'Admin Aplus',
    message: `${job.title} · ${jobTone(job.status)}`,
    createdAt: now,
  };
}

async function applySuccessfulJob(job: SyncQueueJob) {
  const lock = job.lockId ? await MockLockRepository.getLockById(job.lockId) : undefined;
  if (job.type === 'rename_lock' && job.lockId) {
    await MockLockRepository.updateLockRuntimeState(job.lockId, {
      name: String(job.payload.localName ?? lock?.name ?? job.lockName ?? 'Aplus Lock'),
      syncState: 'synced',
      lastActivity: 'Offline sync · đổi tên khóa',
    });
  }
  if (job.type === 'record_note' && job.recordId) {
    await MockLockRepository.saveAccessRecordNote(job.recordId, String(job.payload.note ?? 'Offline note synced'));
  }
  if (job.type === 'draft_credential') {
    await MockCredentialRepository.createDraftCredential({
      type: (job.credentialType ?? 'password') as CredentialType,
      ownerId: String(job.payload.ownerId ?? 'person-owner-admin'),
      lockId: job.lockId,
      lockName: job.lockName,
    });
  }
  if (job.type === 'revoke_credential' && job.credentialId) {
    await MockCredentialRepository.revokeCredential(job.credentialId, 'Offline sync');
  }
  await MockLockRepository.addAccessRecord(makeRecord(lock, {...job, status: 'success'}, 'success'));
}

export const MockOfflineRepository = {
  async refreshCache(isOffline = false): Promise<{summary: OfflineSummary; cache: OfflineCacheItem[]; jobs: SyncQueueJob[]; conflicts: SyncConflict[]}> {
    const [homes, rooms, locks, records, credentials, alerts] = await Promise.all([
      MockLockRepository.getHomes(),
      MockLockRepository.getRooms(),
      MockLockRepository.getLocks(),
      MockLockRepository.getAccessRecords(),
      MockCredentialRepository.getCredentials(),
      MockLockRepository.getAlerts(),
    ]);
    cachedAt = Date.now();
    const cache: OfflineCacheItem[] = [
      {entity: 'homes', title: 'Homes/buildings', description: 'Danh sách nhà, tòa nhà và counters gần nhất.', count: homes.length, lastCachedAt: cachedAt, status: homes.length ? 'fresh' : 'empty'},
      {entity: 'rooms', title: 'Rooms/floors', description: 'Phòng, tầng, assignment và dữ liệu PMS liên quan.', count: rooms.length, lastCachedAt: cachedAt, status: rooms.length ? 'fresh' : 'empty'},
      {entity: 'locks', title: 'Locks', description: 'Lock detail, online state, pin, gateway và capability.', count: locks.length, lastCachedAt: cachedAt, status: locks.length ? 'fresh' : 'empty'},
      {entity: 'records', title: 'Records', description: 'Lịch sử mở khóa gần nhất để xem khi mất mạng.', count: records.length, lastCachedAt: cachedAt, status: records.length ? 'fresh' : 'empty'},
      {entity: 'credentials', title: 'Credentials', description: 'Password/card/face/fingerprint/NFC summary cache.', count: credentials.length, lastCachedAt: cachedAt, status: credentials.length ? 'fresh' : 'empty'},
      {entity: 'alerts', title: 'Alerts', description: 'Cảnh báo gần nhất, unread state và ticket link.', count: alerts.length, lastCachedAt: cachedAt, status: alerts.length ? 'fresh' : 'empty'},
    ];
    return {summary: {...buildSummary(isOffline), cachedRecords: records.length}, cache, jobs: jobs.map(cloneJob), conflicts: conflicts.map(cloneConflict)};
  },

  async getJobs(): Promise<SyncQueueJob[]> {
    await wait(90);
    return jobs.map(cloneJob);
  },

  async getConflicts(): Promise<SyncConflict[]> {
    await wait(90);
    return conflicts.map(cloneConflict);
  },

  async createDemoJob(type: SyncQueueJobType, lockId?: string): Promise<SyncQueueJob> {
    await wait(120);
    const lock = lockId ? await MockLockRepository.getLockById(lockId) : (await MockLockRepository.getLocks())[0];
    const now = Date.now();
    const base = {
      id: `offline-job-${type}-${now}`,
      type,
      status: 'pending' as const,
      attempts: 0,
      lockId: lock?.id,
      lockName: lock?.name,
      createdAt: now,
      updatedAt: now,
      payload: {},
    };
    let job: SyncQueueJob;
    if (type === 'rename_lock') {
      job = {...base, title: 'Đổi tên khóa offline', description: 'Offline safe · đổi tên lock, có thể phát sinh conflict nếu server mới hơn.', offlineSafe: true, payload: {localName: `${lock?.name ?? 'Aplus Lock'} · Offline`, serverName: lock?.name}};
    } else if (type === 'record_note') {
      const record = (await MockLockRepository.getAccessRecords(lock?.id))[0];
      job = {...base, title: 'Ghi chú record offline', description: 'Offline safe · ghi chú bản ghi và sync lại khi có mạng.', offlineSafe: true, recordId: record?.id, payload: {note: 'Ghi chú tạo khi offline.'}};
    } else if (type === 'draft_credential') {
      job = {...base, title: 'Draft credential offline', description: 'Offline safe · tạo draft credential, chưa gửi xuống khóa.', offlineSafe: true, credentialType: 'password', payload: {ownerId: 'person-owner-admin'}};
    } else if (type === 'revoke_credential') {
      const credential = (await MockCredentialRepository.getCredentials(lock?.id)).find(item => item.status !== 'revoked');
      job = {...base, title: 'Revoke credential pending', description: 'Offline safe · đánh dấu pending revoke rồi sync khi online.', offlineSafe: true, credentialId: credential?.id, payload: {revokedBy: 'Admin Aplus'}};
    } else if (type === 'remote_unlock_blocked') {
      job = {...base, title: 'Remote unlock offline bị chặn', description: 'Không offline safe · không queue lệnh mở khóa từ xa khi mất mạng.', offlineSafe: false, status: 'failed', attempts: 1, payload: {reason: 'Remote unlock offline is blocked'}, errorMessage: 'Remote unlock offline bị chặn.'};
    } else {
      job = {...base, title: 'Room note offline', description: 'Offline safe · ghi chú phòng và chờ sync.', offlineSafe: true, payload: {note: 'Kiểm tra phòng khi offline.'}};
    }
    jobs.unshift(job);
    return cloneJob(job);
  },

  async retryJob(jobId: string, isOffline = false): Promise<SyncQueueJob | undefined> {
    await wait(320);
    const job = jobs.find(item => item.id === jobId);
    if (!job || job.status === 'cancelled' || job.status === 'success') {
      return job ? cloneJob(job) : undefined;
    }
    job.attempts += 1;
    job.updatedAt = Date.now();
    if (job.type === 'remote_unlock_blocked' || !job.offlineSafe) {
      job.status = 'failed';
      job.errorMessage = 'Remote unlock offline bị chặn. Hãy online và gửi lệnh realtime thay vì queue.';
      await MockLockRepository.addAccessRecord(makeRecord(undefined, job, 'blocked'));
      return cloneJob(job);
    }
    if (isOffline) {
      job.status = 'pending';
      job.errorMessage = 'Thiết bị vẫn offline. Job được giữ trong queue an toàn.';
      return cloneJob(job);
    }
    if (job.type === 'rename_lock' && !job.conflictId && job.attempts === 1) {
      const conflict: SyncConflict = {
        id: `offline-conflict-${job.id}`,
        jobId: job.id,
        entity: 'locks',
        entityId: job.lockId ?? 'unknown-lock',
        title: 'Server có tên khóa mới hơn',
        localValue: String(job.payload.localName ?? 'Local name'),
        serverValue: String(job.payload.serverName ?? job.lockName ?? 'Server name'),
        policy: 'manual',
        status: 'open',
        createdAt: Date.now(),
      };
      conflicts.unshift(conflict);
      job.status = 'conflict';
      job.conflictId = conflict.id;
      job.errorMessage = 'Cần resolve conflict trước khi sync.';
      return cloneJob(job);
    }
    job.status = 'running';
    await applySuccessfulJob(job);
    job.status = 'success';
    job.errorMessage = undefined;
    job.updatedAt = Date.now();
    lastSyncAt = job.updatedAt;
    return cloneJob(job);
  },

  async retryAll(isOffline = false): Promise<SyncQueueJob[]> {
    const targets = jobs.filter(job => job.status === 'pending' || job.status === 'failed');
    for (const job of targets) {
      await this.retryJob(job.id, isOffline);
    }
    return jobs.map(cloneJob);
  },

  async cancelJob(jobId: string): Promise<SyncQueueJob | undefined> {
    await wait(120);
    const job = jobs.find(item => item.id === jobId);
    if (!job || job.status === 'success') {
      return job ? cloneJob(job) : undefined;
    }
    job.status = 'cancelled';
    job.updatedAt = Date.now();
    job.errorMessage = 'Đã hủy khỏi sync queue.';
    return cloneJob(job);
  },

  async resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<SyncConflict | undefined> {
    await wait(180);
    const conflict = conflicts.find(item => item.id === conflictId);
    if (!conflict) {
      return undefined;
    }
    conflict.status = 'resolved';
    conflict.resolution = resolution;
    conflict.resolvedAt = Date.now();
    const job = jobs.find(item => item.id === conflict.jobId);
    if (job) {
      job.status = 'pending';
      job.errorMessage = undefined;
      job.updatedAt = Date.now();
      if (resolution === 'keepServer') {
        job.payload.localName = conflict.serverValue;
      }
      if (resolution === 'mergeManual') {
        job.payload.localName = `${conflict.serverValue} / ${conflict.localValue}`;
      }
    }
    return cloneConflict(conflict);
  },
};

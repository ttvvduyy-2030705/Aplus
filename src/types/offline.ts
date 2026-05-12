import type {CredentialType} from './credential';
import type {AccessRecordResult} from './lock';

export type OfflineCacheEntity = 'homes' | 'rooms' | 'locks' | 'records' | 'credentials' | 'alerts';
export type OfflineCacheStatus = 'fresh' | 'stale' | 'empty';

export type OfflineCacheItem = {
  entity: OfflineCacheEntity;
  title: string;
  description: string;
  count: number;
  lastCachedAt: number;
  status: OfflineCacheStatus;
};

export type SyncQueueJobType =
  | 'rename_lock'
  | 'record_note'
  | 'draft_credential'
  | 'revoke_credential'
  | 'room_note'
  | 'remote_unlock_blocked';

export type SyncQueueJobStatus = 'pending' | 'running' | 'success' | 'failed' | 'conflict' | 'cancelled';

export type SyncQueueJob = {
  id: string;
  type: SyncQueueJobType;
  title: string;
  description: string;
  status: SyncQueueJobStatus;
  offlineSafe: boolean;
  attempts: number;
  lockId?: string;
  lockName?: string;
  recordId?: string;
  credentialId?: string;
  credentialType?: CredentialType;
  createdAt: number;
  updatedAt: number;
  payload: Record<string, string | number | boolean | undefined>;
  result?: AccessRecordResult;
  errorMessage?: string;
  conflictId?: string;
};

export type ConflictPolicy = 'serverWins' | 'clientWins' | 'manual';
export type ConflictResolution = 'keepServer' | 'useLocal' | 'mergeManual';
export type SyncConflictStatus = 'open' | 'resolved';

export type SyncConflict = {
  id: string;
  jobId: string;
  entity: OfflineCacheEntity;
  entityId: string;
  title: string;
  localValue: string;
  serverValue: string;
  policy: ConflictPolicy;
  status: SyncConflictStatus;
  createdAt: number;
  resolvedAt?: number;
  resolution?: ConflictResolution;
  note?: string;
};

export type OfflineSummary = {
  cacheItems: number;
  cachedRecords: number;
  pendingJobs: number;
  successJobs: number;
  failedJobs: number;
  conflictJobs: number;
  cancelledJobs: number;
  lastSyncAt?: number;
  isOffline: boolean;
};

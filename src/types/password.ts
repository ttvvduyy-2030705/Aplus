import type {SyncState} from './common';

export type PasswordKind = 'permanent' | 'temporary' | 'oneTime' | 'recurring' | 'staff' | 'guest';
export type PasswordStatus = 'active' | 'paused' | 'used' | 'expired' | 'revoked' | 'pendingSync' | 'pendingRevoke';

export type ScheduleRule = {
  enabled: boolean;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  timezone: string;
  note?: string;
};

export type PasswordCredential = {
  id: string;
  lockId: string;
  lockName: string;
  roomName: string;
  ownerId: string;
  ownerName: string;
  title: string;
  code: string;
  kind: PasswordKind;
  status: PasswordStatus;
  syncState: SyncState;
  validFrom: number;
  validTo?: number;
  scheduleRule?: ScheduleRule;
  createdAt: number;
  updatedAt: number;
  useCount: number;
  maxUseCount?: number;
  lastUsedAt?: number;
  revokedAt?: number;
  revokedBy?: string;
  pauseReason?: string;
};

export type PasswordPolicy = {
  minLength: number;
  maxLength: number;
  digitsOnly: boolean;
  allowDuplicateInSameLock: boolean;
};

export type PasswordSummary = {
  total: number;
  active: number;
  pending: number;
  revoked: number;
  expired: number;
  used: number;
};

export type CreatePasswordInput = {
  lockId: string;
  ownerId: string;
  title: string;
  code: string;
  kind: PasswordKind;
  validFrom: number;
  validTo?: number;
  scheduleRule?: ScheduleRule;
  offline: boolean;
};

export type PasswordValidationResult = {
  ok: boolean;
  message?: string;
};

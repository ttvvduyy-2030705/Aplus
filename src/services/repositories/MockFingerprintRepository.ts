import {MockCredentialRepository} from './MockCredentialRepository';
import {MockLockRepository} from './MockLockRepository';
import type {AccessRecord} from '@/types/lock';
import type {FingerprintCredential, FingerprintEnrollmentInput, FingerprintOwnerChangeInput, FingerprintRenameInput} from '@/types/fingerprint';

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const day = 1000 * 60 * 60 * 24;
const now = Date.now();

let fingerprints: FingerprintCredential[] = [
  {
    id: 'fingerprint-admin-520',
    credentialId: 'cred-fingerprint-admin-520',
    lockId: 'lock-home-520',
    lockName: 'Căn hộ 520',
    roomName: 'Căn hộ 520',
    ownerId: 'person-owner-admin',
    ownerName: 'Admin Aplus',
    label: 'Ngón trỏ phải · Admin',
    status: 'active',
    syncState: 'synced',
    templateRef: {
      templateId: 'tpl-fp-admin-520',
      deviceRef: 'APL-HOME-0520:slot:001',
      algorithm: 'mock-minutiae-v1',
      createdAt: now - day * 28,
    },
    qualityScore: 92,
    useCount: 18,
    lastUsedAt: now - 1000 * 60 * 24,
    createdAt: now - day * 28,
    updatedAt: now - 1000 * 60 * 24,
  },
  {
    id: 'fingerprint-it-server',
    credentialId: 'cred-fingerprint-it-server',
    lockId: 'lock-office-server',
    lockName: 'Phòng server',
    roomName: 'Server Room',
    ownerId: 'person-staff-it',
    ownerName: 'Nhân sự IT',
    label: 'Vân tay kỹ thuật IT',
    status: 'active',
    syncState: 'synced',
    templateRef: {
      templateId: 'tpl-fp-it-server',
      deviceRef: 'APL-OFFICE-SRV:slot:004',
      algorithm: 'mock-minutiae-v1',
      createdAt: now - day * 14,
    },
    qualityScore: 88,
    useCount: 7,
    lastUsedAt: now - 1000 * 60 * 80,
    createdAt: now - day * 14,
    updatedAt: now - 1000 * 60 * 80,
  },
];

function cloneFingerprint(item: FingerprintCredential): FingerprintCredential {
  return {...item, templateRef: {...item.templateRef}};
}

function activeDuplicate(input: FingerprintEnrollmentInput) {
  return fingerprints.find(item => item.lockId === input.lockId && item.ownerId === input.owner.id && (item.status === 'active' || item.status === 'pendingSync'));
}

function makeRecord(item: FingerprintCredential, result: AccessRecord['result'], message: string, failureReason?: string): AccessRecord {
  return {
    id: `record-fingerprint-${item.id}-${Date.now()}`,
    lockId: item.lockId,
    lockName: item.lockName,
    roomName: item.roomName,
    method: 'Fingerprint',
    result,
    credentialId: item.credentialId,
    personId: item.ownerId,
    userId: item.ownerId,
    sourceIp: result === 'success' ? 'fingerprint-reader://local' : 'fingerprint-reader://blocked',
    deviceName: `${item.lockName} · Fingerprint reader`,
    actorName: item.ownerName,
    message,
    failureReason,
    createdAt: Date.now(),
  };
}

export const MockFingerprintRepository = {
  async getFingerprints(lockId?: string): Promise<FingerprintCredential[]> {
    await wait(120);
    return fingerprints
      .filter(item => !lockId || item.lockId === lockId)
      .sort((left, right) => Number(right.status === 'active') - Number(left.status === 'active') || right.updatedAt - left.updatedAt)
      .map(cloneFingerprint);
  },

  async getFingerprintById(fingerprintId: string): Promise<FingerprintCredential | undefined> {
    await wait(80);
    const item = fingerprints.find(fingerprint => fingerprint.id === fingerprintId);
    return item ? cloneFingerprint(item) : undefined;
  },

  async checkDuplicate(input: FingerprintEnrollmentInput): Promise<FingerprintCredential | undefined> {
    await wait(90);
    const duplicate = activeDuplicate(input);
    return duplicate ? cloneFingerprint(duplicate) : undefined;
  },

  async completeEnrollment(input: FingerprintEnrollmentInput): Promise<FingerprintCredential> {
    await wait(220);
    const duplicate = activeDuplicate(input);
    if (duplicate) {
      throw new Error('Người nhận đã có vân tay active trên khóa này. Không tạo bản ghi trùng.');
    }

    const createdAt = Date.now();
    const qualityScore = input.qualityScore ?? 91;
    const lock = await MockLockRepository.getLockById(input.lockId);
    const serial = lock?.serial ?? input.lockId;
    const credentialId = `cred-fingerprint-${input.lockId}-${input.owner.id}-${String(createdAt).slice(-6)}`;
    const fingerprint: FingerprintCredential = {
      id: `fingerprint-${input.lockId}-${input.owner.id}-${String(createdAt).slice(-6)}`,
      credentialId,
      lockId: input.lockId,
      lockName: input.lockName,
      roomName: input.roomName,
      ownerId: input.owner.id,
      ownerName: input.owner.fullName,
      label: input.label?.trim() || `Vân tay · ${input.owner.fullName}`,
      status: input.offline || lock?.connectionState === 'offline' ? 'pendingSync' : 'active',
      syncState: input.offline || lock?.connectionState === 'offline' ? 'pending' : 'synced',
      templateRef: {
        templateId: `tpl-fp-${String(createdAt).slice(-8)}`,
        deviceRef: `${serial}:slot:${String(Math.floor(Math.random() * 90) + 10)}`,
        algorithm: 'mock-minutiae-v1',
        createdAt,
      },
      qualityScore,
      useCount: 0,
      createdAt,
      updatedAt: createdAt,
    };

    fingerprints.unshift(fingerprint);
    await MockCredentialRepository.upsertFingerprintCredential({
      credentialId,
      fingerprintId: fingerprint.id,
      title: fingerprint.label,
      ownerId: fingerprint.ownerId,
      ownerName: fingerprint.ownerName,
      lockId: fingerprint.lockId,
      lockName: fingerprint.lockName,
      roomName: fingerprint.roomName,
      status: fingerprint.status,
      syncState: fingerprint.syncState,
      templateId: fingerprint.templateRef.templateId,
    });
    if (lock) {
      await MockLockRepository.updateLockRuntimeState(lock.id, {
        activeCredentialCount: lock.activeCredentialCount + 1,
        lastActivity: `Thêm vân tay · ${input.owner.fullName}`,
        lastSeenAt: lock.connectionState === 'offline' ? lock.lastSeenAt : 'Vừa xong',
      });
    }
    await MockLockRepository.addAccessRecord(makeRecord(fingerprint, 'success', `Enrollment vân tay hoàn tất cho ${fingerprint.ownerName}`));
    return cloneFingerprint(fingerprint);
  },

  async renameFingerprint(input: FingerprintRenameInput): Promise<FingerprintCredential | undefined> {
    await wait(120);
    let updated: FingerprintCredential | undefined;
    fingerprints = fingerprints.map(item => {
      if (item.id !== input.fingerprintId) {
        return item;
      }
      updated = {...item, label: input.label.trim() || item.label, updatedAt: Date.now()};
      return updated;
    });
    if (updated) {
      await MockCredentialRepository.upsertFingerprintCredential({
        credentialId: updated.credentialId,
        fingerprintId: updated.id,
        title: updated.label,
        ownerId: updated.ownerId,
        ownerName: updated.ownerName,
        lockId: updated.lockId,
        lockName: updated.lockName,
        roomName: updated.roomName,
        status: updated.status,
        syncState: updated.syncState,
        templateId: updated.templateRef.templateId,
      });
    }
    return updated ? cloneFingerprint(updated) : undefined;
  },

  async changeOwner(input: FingerprintOwnerChangeInput): Promise<FingerprintCredential | undefined> {
    await wait(140);
    let updated: FingerprintCredential | undefined;
    fingerprints = fingerprints.map(item => {
      if (item.id !== input.fingerprintId) {
        return item;
      }
      updated = {
        ...item,
        ownerId: input.owner.id,
        ownerName: input.owner.fullName,
        label: item.label.includes('·') ? `Vân tay · ${input.owner.fullName}` : item.label,
        updatedAt: Date.now(),
      };
      return updated;
    });
    if (updated) {
      await MockCredentialRepository.upsertFingerprintCredential({
        credentialId: updated.credentialId,
        fingerprintId: updated.id,
        title: updated.label,
        ownerId: updated.ownerId,
        ownerName: updated.ownerName,
        lockId: updated.lockId,
        lockName: updated.lockName,
        roomName: updated.roomName,
        status: updated.status,
        syncState: updated.syncState,
        templateId: updated.templateRef.templateId,
      });
      await MockLockRepository.addAccessRecord(makeRecord(updated, 'success', `Đổi owner vân tay sang ${updated.ownerName}`));
    }
    return updated ? cloneFingerprint(updated) : undefined;
  },

  async revokeFingerprint(fingerprintId: string, revokedBy = 'Admin Aplus'): Promise<FingerprintCredential | undefined> {
    await wait(150);
    let updated: FingerprintCredential | undefined;
    fingerprints = fingerprints.map(item => {
      if (item.id !== fingerprintId) {
        return item;
      }
      updated = {...item, status: 'revoked', syncState: 'synced', revokedAt: Date.now(), revokedBy, updatedAt: Date.now()};
      return updated;
    });
    if (updated) {
      await MockCredentialRepository.revokeCredential(updated.credentialId, revokedBy);
      await MockLockRepository.addAccessRecord(makeRecord(updated, 'blocked', `Thu hồi vân tay ${updated.label}`, 'Fingerprint revoked'));
      const lock = await MockLockRepository.getLockById(updated.lockId);
      if (lock) {
        await MockLockRepository.updateLockRuntimeState(lock.id, {activeCredentialCount: Math.max(0, lock.activeCredentialCount - 1), lastActivity: `Thu hồi vân tay · ${updated.ownerName}`});
      }
    }
    return updated ? cloneFingerprint(updated) : undefined;
  },

  async simulateUse(fingerprintId: string): Promise<FingerprintCredential | undefined> {
    await wait(130);
    let updated: FingerprintCredential | undefined;
    fingerprints = fingerprints.map(item => {
      if (item.id !== fingerprintId) {
        return item;
      }
      updated = {...item, useCount: item.useCount + 1, lastUsedAt: Date.now(), updatedAt: Date.now()};
      return updated;
    });
    if (updated) {
      const result = updated.status === 'active' || updated.status === 'pendingSync' ? 'success' : 'blocked';
      await MockLockRepository.addAccessRecord(makeRecord(updated, result, result === 'success' ? `Mở khóa bằng vân tay ${updated.ownerName}` : `Vân tay bị từ chối: ${updated.label}`, result === 'success' ? undefined : 'Fingerprint inactive'));
    }
    return updated ? cloneFingerprint(updated) : undefined;
  },
};

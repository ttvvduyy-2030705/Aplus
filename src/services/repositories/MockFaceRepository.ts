import {MockCredentialRepository} from './MockCredentialRepository';
import {MockLockRepository} from './MockLockRepository';
import type {Person} from '@/types/credential';
import type {AccessRecord} from '@/types/lock';
import type {FaceCredential, FaceEnrollmentInput, FaceOwnerChangeInput, FaceRenameInput} from '@/types/face';

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const day = 1000 * 60 * 60 * 24;
const now = Date.now();

let faces: FaceCredential[] = [
  {
    id: 'face-admin-520',
    credentialId: 'cred-face-admin-520',
    lockId: 'lock-home-520',
    lockName: 'Căn hộ 520',
    roomName: 'Căn hộ 520',
    ownerId: 'person-owner-admin',
    ownerName: 'Admin Aplus',
    label: 'Face Unlock · Admin',
    status: 'active',
    syncState: 'synced',
    templateRef: {
      templateId: 'tpl-face-admin-520',
      deviceRef: 'APL-HOME-0520:camera:face:001',
      algorithm: 'mock-face-vector-v1',
      poseSet: ['front', 'left', 'right'],
      liveness: 'mock-pass',
      createdAt: now - day * 21,
    },
    qualityScore: 94,
    useCount: 9,
    lastUsedAt: now - 1000 * 60 * 70,
    createdAt: now - day * 21,
    updatedAt: now - 1000 * 60 * 70,
  },
];

function cloneFace(item: FaceCredential): FaceCredential {
  return {...item, templateRef: {...item.templateRef, poseSet: [...item.templateRef.poseSet]}};
}

function activeDuplicate(input: FaceEnrollmentInput) {
  return faces.find(item => item.lockId === input.lockId && item.ownerId === input.owner.id && (item.status === 'active' || item.status === 'pendingSync'));
}

function makeRecord(item: FaceCredential, result: AccessRecord['result'], message: string, failureReason?: string): AccessRecord {
  return {
    id: `record-face-${item.id}-${Date.now()}`,
    lockId: item.lockId,
    lockName: item.lockName,
    roomName: item.roomName,
    method: 'Face',
    result,
    credentialId: item.credentialId,
    personId: item.ownerId,
    userId: item.ownerId,
    sourceIp: result === 'success' ? 'face-camera://local' : 'face-camera://blocked',
    deviceName: `${item.lockName} · Face camera`,
    actorName: item.ownerName,
    message,
    failureReason,
    createdAt: Date.now(),
  };
}

async function upsertCredential(face: FaceCredential) {
  await MockCredentialRepository.upsertFaceCredential({
    credentialId: face.credentialId,
    faceId: face.id,
    title: face.label,
    ownerId: face.ownerId,
    ownerName: face.ownerName,
    lockId: face.lockId,
    lockName: face.lockName,
    roomName: face.roomName,
    status: face.status,
    syncState: face.syncState,
    templateId: face.templateRef.templateId,
  });
}

export const MockFaceRepository = {
  async getFaces(lockId?: string): Promise<FaceCredential[]> {
    await wait(120);
    return faces
      .filter(item => !lockId || item.lockId === lockId)
      .sort((left, right) => Number(right.status === 'active') - Number(left.status === 'active') || right.updatedAt - left.updatedAt)
      .map(cloneFace);
  },

  async getFaceById(faceId: string): Promise<FaceCredential | undefined> {
    await wait(80);
    const item = faces.find(face => face.id === faceId);
    return item ? cloneFace(item) : undefined;
  },

  async checkDuplicate(input: FaceEnrollmentInput): Promise<FaceCredential | undefined> {
    await wait(90);
    const duplicate = activeDuplicate(input);
    return duplicate ? cloneFace(duplicate) : undefined;
  },

  async completeEnrollment(input: FaceEnrollmentInput): Promise<FaceCredential> {
    await wait(240);
    const duplicate = activeDuplicate(input);
    if (duplicate) {
      throw new Error('Người nhận đã có Face Unlock active trên khóa này. Không tạo bản ghi trùng.');
    }

    const lock = await MockLockRepository.getLockById(input.lockId);
    if (!lock?.capabilities.supportsFace) {
      throw new Error('Model khóa này không hỗ trợ Face Unlock.');
    }
    if (!lock.permission.canManageCredentials) {
      throw new Error('Tài khoản hiện tại không có quyền thêm Face Unlock.');
    }

    const createdAt = Date.now();
    const qualityScore = input.qualityScore ?? 93;
    const serial = lock.serial ?? input.lockId;
    const credentialId = `cred-face-${input.lockId}-${input.owner.id}-${String(createdAt).slice(-6)}`;
    const face: FaceCredential = {
      id: `face-${input.lockId}-${input.owner.id}-${String(createdAt).slice(-6)}`,
      credentialId,
      lockId: input.lockId,
      lockName: input.lockName,
      roomName: input.roomName,
      ownerId: input.owner.id,
      ownerName: input.owner.fullName,
      label: input.label?.trim() || `Face Unlock · ${input.owner.fullName}`,
      status: input.offline || lock.connectionState === 'offline' ? 'pendingSync' : 'active',
      syncState: input.offline || lock.connectionState === 'offline' ? 'pending' : 'synced',
      templateRef: {
        templateId: `tpl-face-${String(createdAt).slice(-8)}`,
        deviceRef: `${serial}:camera:face:${String(Math.floor(Math.random() * 90) + 10)}`,
        algorithm: 'mock-face-vector-v1',
        poseSet: ['front', 'left', 'right'],
        liveness: qualityScore >= 76 ? 'mock-pass' : 'mock-fail',
        createdAt,
      },
      qualityScore,
      useCount: 0,
      createdAt,
      updatedAt: createdAt,
    };

    faces.unshift(face);
    await upsertCredential(face);
    await MockLockRepository.updateLockRuntimeState(lock.id, {
      activeCredentialCount: lock.activeCredentialCount + 1,
      lastActivity: `Thêm Face Unlock · ${input.owner.fullName}`,
      lastSeenAt: lock.connectionState === 'offline' ? lock.lastSeenAt : 'Vừa xong',
    });
    await MockLockRepository.addAccessRecord(makeRecord(face, 'success', `Enrollment Face Unlock hoàn tất cho ${face.ownerName}`));
    return cloneFace(face);
  },

  async renameFace(input: FaceRenameInput): Promise<FaceCredential | undefined> {
    await wait(120);
    let updated: FaceCredential | undefined;
    faces = faces.map(item => {
      if (item.id !== input.faceId) {
        return item;
      }
      updated = {...item, label: input.label.trim() || item.label, updatedAt: Date.now()};
      return updated;
    });
    if (updated) {
      await upsertCredential(updated);
    }
    return updated ? cloneFace(updated) : undefined;
  },

  async changeOwner(input: FaceOwnerChangeInput): Promise<FaceCredential | undefined> {
    await wait(140);
    let updated: FaceCredential | undefined;
    faces = faces.map(item => {
      if (item.id !== input.faceId) {
        return item;
      }
      updated = {
        ...item,
        ownerId: input.owner.id,
        ownerName: input.owner.fullName,
        label: item.label.includes('·') ? `Face Unlock · ${input.owner.fullName}` : item.label,
        updatedAt: Date.now(),
      };
      return updated;
    });
    if (updated) {
      await upsertCredential(updated);
      await MockLockRepository.addAccessRecord(makeRecord(updated, 'success', `Đổi owner Face Unlock sang ${updated.ownerName}`));
    }
    return updated ? cloneFace(updated) : undefined;
  },

  async revokeFace(faceId: string, revokedBy = 'Admin Aplus'): Promise<FaceCredential | undefined> {
    await wait(150);
    let updated: FaceCredential | undefined;
    faces = faces.map(item => {
      if (item.id !== faceId) {
        return item;
      }
      updated = {...item, status: 'revoked', syncState: 'synced', revokedAt: Date.now(), revokedBy, updatedAt: Date.now()};
      return updated;
    });
    if (updated) {
      await MockCredentialRepository.revokeCredential(updated.credentialId, revokedBy);
      await MockLockRepository.addAccessRecord(makeRecord(updated, 'blocked', `Thu hồi Face Unlock ${updated.label}`, 'Face credential revoked'));
      const lock = await MockLockRepository.getLockById(updated.lockId);
      if (lock) {
        await MockLockRepository.updateLockRuntimeState(lock.id, {activeCredentialCount: Math.max(0, lock.activeCredentialCount - 1), lastActivity: `Thu hồi Face Unlock · ${updated.ownerName}`});
      }
    }
    return updated ? cloneFace(updated) : undefined;
  },

  async simulateUse(faceId: string): Promise<FaceCredential | undefined> {
    await wait(130);
    let updated: FaceCredential | undefined;
    faces = faces.map(item => {
      if (item.id !== faceId) {
        return item;
      }
      updated = {...item, useCount: item.useCount + 1, lastUsedAt: Date.now(), updatedAt: Date.now()};
      return updated;
    });
    if (updated) {
      const result = updated.status === 'active' || updated.status === 'pendingSync' ? 'success' : 'blocked';
      await MockLockRepository.addAccessRecord(makeRecord(updated, result, result === 'success' ? `Mở khóa bằng Face Unlock ${updated.ownerName}` : `Face Unlock bị từ chối: ${updated.label}`, result === 'success' ? undefined : 'Face credential inactive'));
    }
    return updated ? cloneFace(updated) : undefined;
  },
};

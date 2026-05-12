import {MockLockRepository} from './MockLockRepository';
import type {AplusLock} from '@/types/lock';
import type {CreateLockTransferInput, LockOwnership, LockTransfer, LockTransferStatus, TransferAuditEntry, TransferRecipient} from '@/types/transfer';

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const ACCEPT_HOST = 'https://lock.aplus.mock/transfer';

const knownRecipients: TransferRecipient[] = [
  {id: 'recipient-owner-new-01', fullName: 'Nguyễn Minh Anh', phone: '0912345678', email: 'minhanh@example.com', existingUser: true},
  {id: 'recipient-tenant-701', fullName: 'Trần Gia Bảo', phone: '0987654321', email: 'giabao@example.com', existingUser: true},
  {id: 'recipient-new-owner', fullName: 'Chủ sở hữu mới', phone: '0909888777', email: 'owner.new@example.com', existingUser: false},
];

let ownerships: LockOwnership[] = [];
let transfers: LockTransfer[] = [];

function token() {
  return `TRF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
}

function recipientFromInput(name: string, account: string): TransferRecipient {
  const normalized = account.trim().toLowerCase();
  const found = knownRecipients.find(item => item.email?.toLowerCase() === normalized || item.phone.replace(/\s/g, '') === normalized.replace(/\s/g, ''));
  if (found) {
    return {...found};
  }
  const looksLikeEmail = normalized.includes('@');
  return {
    id: `recipient-${Date.now()}`,
    fullName: name.trim() || (looksLikeEmail ? normalized.split('@')[0] : 'Người nhận mới'),
    phone: looksLikeEmail ? 'Chưa cập nhật' : account.trim(),
    email: looksLikeEmail ? normalized : undefined,
    existingUser: false,
  };
}

function snapshotLock(lock: AplusLock) {
  return {
    lockId: lock.id,
    lockName: lock.name,
    serial: lock.serial,
    roomName: lock.roomName,
    connectionState: lock.connectionState,
    batteryPercent: lock.batteryPercent,
  };
}

async function getLocksByIds(lockIds: string[]) {
  const allLocks = await MockLockRepository.getLocks('all');
  return lockIds.map(lockId => allLocks.find(lock => lock.id === lockId)).filter((lock): lock is AplusLock => Boolean(lock));
}

function audit(transferId: string, action: TransferAuditEntry['action'], actorName: string, message: string): TransferAuditEntry {
  return {
    id: `transfer-audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    transferId,
    action,
    actorName,
    message,
    createdAt: Date.now(),
  };
}

function cloneTransfer(transfer: LockTransfer): LockTransfer {
  return {
    ...transfer,
    lockIds: [...transfer.lockIds],
    locks: transfer.locks.map(lock => ({...lock})),
    recipient: {...transfer.recipient},
    audit: transfer.audit.map(item => ({...item})),
  };
}

function cloneOwnership(item: LockOwnership): LockOwnership {
  return {...item};
}

async function ensureOwnerships() {
  if (ownerships.length > 0) {
    return;
  }
  const locks = await MockLockRepository.getLocks('all');
  ownerships = locks.map(lock => ({
    lockId: lock.id,
    lockName: lock.name,
    ownerId: 'admin-aplus-001',
    ownerName: 'Aplus Admin',
    ownerPhone: '0900000000',
    roleLabel: 'Owner',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
  }));
}

async function writeTransferRecord(transfer: LockTransfer, result: 'success' | 'blocked', message: string) {
  for (const lock of transfer.locks) {
    await MockLockRepository.addAccessRecord({
      id: `record-transfer-${Date.now()}-${lock.lockId}-${Math.random().toString(16).slice(2, 6)}`,
      lockId: lock.lockId,
      lockName: lock.lockName,
      roomName: lock.roomName,
      method: 'System',
      result,
      userId: transfer.fromOwnerId,
      actorName: transfer.fromOwnerName,
      message,
      sourceIp: '10.0.0.18',
      deviceName: 'Aplus Owner Console',
      createdAt: Date.now(),
    });
  }
}

function updateStatus(transferId: string, status: LockTransferStatus, patch: Partial<LockTransfer>) {
  transfers = transfers.map(item => item.id === transferId ? {...item, status, ...patch} : item);
  return transfers.find(item => item.id === transferId);
}

export const MockLockTransferRepository = {
  async getRecipients(): Promise<TransferRecipient[]> {
    await wait(100);
    return knownRecipients.map(item => ({...item}));
  },

  async getOwnerships(): Promise<LockOwnership[]> {
    await ensureOwnerships();
    await wait(120);
    return ownerships.map(cloneOwnership);
  },

  async getTransfers(): Promise<LockTransfer[]> {
    await ensureOwnerships();
    await wait(160);
    return transfers.map(cloneTransfer).sort((a, b) => b.createdAt - a.createdAt);
  },

  async createTransfer(input: CreateLockTransferInput): Promise<LockTransfer> {
    await ensureOwnerships();
    await wait(280);
    const locks = await getLocksByIds(input.lockIds);
    if (!locks.length) {
      throw new Error('Không tìm thấy khóa để chuyển quyền.');
    }
    const ownedLockIds = new Set(ownerships.filter(item => item.ownerId === input.fromOwnerId).map(item => item.lockId));
    const notOwned = locks.filter(lock => !ownedLockIds.has(lock.id));
    if (notOwned.length > 0) {
      throw new Error(`Owner hiện tại không sở hữu: ${notOwned.map(lock => lock.name).join(', ')}.`);
    }
    const now = Date.now();
    const transferToken = token();
    const transfer: LockTransfer = {
      id: `transfer-${now}-${Math.random().toString(16).slice(2, 8)}`,
      lockIds: locks.map(lock => lock.id),
      locks: locks.map(snapshotLock),
      fromOwnerId: input.fromOwnerId,
      fromOwnerName: input.fromOwnerName,
      recipient: recipientFromInput(input.recipientName, input.recipientAccount),
      status: 'pending',
      verifyMethod: input.verifyMethod,
      previousOwnerPolicy: input.previousOwnerPolicy,
      token: transferToken,
      acceptUrl: `${ACCEPT_HOST}/${transferToken}`,
      createdAt: now,
      expiresAt: now + Math.max(1, input.expiresInHours) * 60 * 60 * 1000,
      audit: [],
    };
    transfer.audit.push(audit(transfer.id, 'created', input.fromOwnerName, `Owner đã tạo yêu cầu chuyển ${locks.length} khóa.`));
    transfer.audit.push(audit(transfer.id, 'verified', input.fromOwnerName, `Đã xác minh bằng ${input.verifyMethod === 'appPin' ? 'App PIN' : input.verifyMethod === 'otp' ? 'OTP' : 'biometric mock'}.`));
    transfers.unshift(transfer);
    await writeTransferRecord(transfer, 'success', `Tạo yêu cầu chuyển quyền khóa cho ${transfer.recipient.fullName}.`);
    return cloneTransfer(transfer);
  },

  async acceptTransfer(transferId: string): Promise<LockTransfer | undefined> {
    await ensureOwnerships();
    await wait(260);
    const transfer = transfers.find(item => item.id === transferId);
    if (!transfer) {
      return undefined;
    }
    if (transfer.status !== 'pending') {
      return cloneTransfer(transfer);
    }
    if (Date.now() > transfer.expiresAt) {
      return this.expireTransfer(transferId);
    }
    const now = Date.now();
    ownerships = ownerships.map(item => transfer.lockIds.includes(item.lockId)
      ? {
          ...item,
          ownerId: transfer.recipient.id,
          ownerName: transfer.recipient.fullName,
          ownerPhone: transfer.recipient.phone,
          roleLabel: 'Owner',
          updatedAt: now,
        }
      : item);
    const updated = updateStatus(transferId, 'completed', {
      acceptedAt: now,
      completedAt: now,
      audit: [...transfer.audit, audit(transfer.id, 'accepted', transfer.recipient.fullName, 'Người nhận đã chấp nhận chuyển quyền. Owner mới đã được cập nhật.')],
    });
    if (updated) {
      await writeTransferRecord(updated, 'success', `Hoàn tất chuyển quyền cho ${updated.recipient.fullName}.`);
      return cloneTransfer(updated);
    }
    return undefined;
  },

  async expireTransfer(transferId: string): Promise<LockTransfer | undefined> {
    await wait(180);
    const transfer = transfers.find(item => item.id === transferId);
    if (!transfer) {
      return undefined;
    }
    if (transfer.status !== 'pending') {
      return cloneTransfer(transfer);
    }
    const updated = updateStatus(transferId, 'expired', {
      audit: [...transfer.audit, audit(transfer.id, 'expired', 'System', 'Yêu cầu đã hết hạn, quyền sở hữu không đổi.')],
    });
    if (updated) {
      await writeTransferRecord(updated, 'blocked', `Transfer expired cho ${updated.recipient.fullName}. Quyền sở hữu không đổi.`);
      return cloneTransfer(updated);
    }
    return undefined;
  },

  async cancelTransfer(transferId: string, actorName: string): Promise<LockTransfer | undefined> {
    await wait(180);
    const transfer = transfers.find(item => item.id === transferId);
    if (!transfer) {
      return undefined;
    }
    if (transfer.status !== 'pending') {
      return cloneTransfer(transfer);
    }
    const updated = updateStatus(transferId, 'cancelled', {
      cancelledAt: Date.now(),
      audit: [...transfer.audit, audit(transfer.id, 'cancelled', actorName, 'Owner đã hủy yêu cầu chuyển quyền.')],
    });
    return updated ? cloneTransfer(updated) : undefined;
  },
};

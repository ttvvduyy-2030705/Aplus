import {canGrantRole, getPermissionSet, getRoleLabel} from '@/services/credential/credentialCatalog';
import {MockCredentialRepository} from './MockCredentialRepository';
import {MockLockRepository} from './MockLockRepository';
import type {AccessRecord} from '@/types/lock';
import type {CredentialStatus, Person, PersonRole} from '@/types/credential';
import type {CreatePhoneAuthorizationInput, PairRemoteInput, PhoneAuthorization, RemoteCredential, RemotePhoneSummary} from '@/types/remote';

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const day = 1000 * 60 * 60 * 24;
const currentActorName = 'Admin Aplus';
const currentActorRole: PersonRole = 'Owner';

let remotes: RemoteCredential[] = [
  {
    id: 'remote-520-owner',
    serial: 'RM-A520-001',
    model: 'Aplus Remote R2',
    batteryPercent: 92,
    ownerId: 'person-owner-admin',
    ownerName: 'Admin Aplus',
    lockId: 'lock-home-520',
    lockName: 'Căn hộ 520',
    roomName: 'Căn hộ 520',
    scopeLabel: 'Aplus Smart Home · Căn hộ 520',
    status: 'active',
    syncState: 'synced',
    createdAt: Date.now() - day * 18,
    lastUsedAt: Date.now() - 1000 * 60 * 80,
  },
  {
    id: 'remote-hotel-701-staff',
    serial: 'RM-H701-007',
    model: 'Aplus Remote Hotel Mini',
    batteryPercent: 64,
    ownerId: 'person-subadmin-hotel',
    ownerName: 'Quản lý khách sạn',
    lockId: 'lock-hotel-0701',
    lockName: 'Phòng khách sạn 701',
    roomName: 'Phòng 701',
    scopeLabel: 'Aplus Boutique Hotel · Phòng 701',
    status: 'active',
    syncState: 'synced',
    createdAt: Date.now() - day * 9,
  },
  {
    id: 'remote-old-802',
    serial: 'RM-H802-OLD',
    model: 'Aplus Remote R1',
    batteryPercent: 12,
    ownerId: 'person-guest-expired',
    ownerName: 'Khách hết hạn',
    lockId: 'lock-hotel-0802',
    lockName: 'Phòng khách sạn 802',
    roomName: 'Phòng 802',
    scopeLabel: 'Aplus Boutique Hotel · Phòng 802',
    status: 'revoked',
    syncState: 'synced',
    createdAt: Date.now() - day * 60,
    revokedAt: Date.now() - day * 3,
    revokedBy: currentActorName,
  },
];

let phoneAuthorizations: PhoneAuthorization[] = [
  {
    id: 'phone-auth-tenant-520',
    account: 'tenant520@aplus.vn',
    displayName: 'Khách thuê căn 520',
    role: 'Tenant',
    lockId: 'lock-home-520',
    lockName: 'Căn hộ 520',
    roomName: 'Căn hộ 520',
    scopeLabel: 'Aplus Smart Home · Căn hộ 520',
    permissions: getPermissionSet('Tenant'),
    channel: 'link',
    status: 'accepted',
    token: 'PHONE-TENANT-520',
    inviteUrl: 'https://aplus.lock/phone/PHONE-TENANT-520',
    qrPayload: 'APLUS_PHONE_AUTH:PHONE-TENANT-520:Tenant:lock-home-520',
    createdAt: Date.now() - day * 25,
    expiresAt: Date.now() + day * 60,
    acceptedAt: Date.now() - day * 24,
    credentialId: 'cred-phone-phone-auth-tenant-520',
  },
  {
    id: 'phone-auth-cleaner-pending',
    account: '0900000802',
    displayName: 'Dọn phòng ca chiều',
    role: 'Cleaner',
    lockId: 'lock-hotel-0802',
    lockName: 'Phòng khách sạn 802',
    roomName: 'Phòng 802',
    scopeLabel: 'Aplus Boutique Hotel · Phòng 802',
    permissions: getPermissionSet('Cleaner'),
    channel: 'qr',
    status: 'pending',
    token: 'PHONE-CLEAN-802',
    inviteUrl: 'https://aplus.lock/phone/PHONE-CLEAN-802',
    qrPayload: 'APLUS_PHONE_AUTH:PHONE-CLEAN-802:Cleaner:lock-hotel-0802',
    createdAt: Date.now() - 1000 * 60 * 40,
    expiresAt: Date.now() + day,
  },
];

function cloneRemote(remote: RemoteCredential): RemoteCredential {
  return {...remote};
}

function clonePhone(auth: PhoneAuthorization): PhoneAuthorization {
  return {...auth, permissions: {...auth.permissions}};
}

function toCredentialStatus(status: RemoteCredential['status'] | PhoneAuthorization['status']): CredentialStatus {
  if (status === 'active' || status === 'accepted') {
    return 'active';
  }
  if (status === 'pendingSync' || status === 'pending') {
    return 'pendingSync';
  }
  if (status === 'expired') {
    return 'expired';
  }
  if (status === 'unsupported') {
    return 'unsupported';
  }
  return 'revoked';
}

function buildPhoneToken(role: PersonRole) {
  return `PHONE-${role.toUpperCase()}-${String(Date.now()).slice(-6)}`;
}

async function getOwner(ownerId: string): Promise<Person> {
  const people = await MockCredentialRepository.getPeople();
  return people.find(person => person.id === ownerId) ?? people[0];
}

function activeOrPending(remote: RemoteCredential) {
  return remote.status === 'active' || remote.status === 'pendingSync';
}

function phoneStillPending(auth: PhoneAuthorization) {
  return auth.status === 'pending' && auth.expiresAt > Date.now();
}

async function addRecord(record: Omit<AccessRecord, 'id' | 'createdAt'>) {
  const next: AccessRecord = {
    id: `record-batch09-${Date.now()}-${Math.round(Math.random() * 999)}`,
    createdAt: Date.now(),
    ...record,
  };
  await MockLockRepository.addAccessRecord(next);
  return next;
}

export const MockRemoteAccessRepository = {
  async getRemoteCredentials(lockId?: string) {
    await wait(120);
    return remotes.filter(remote => !lockId || remote.lockId === lockId).map(cloneRemote);
  },

  async getPhoneAuthorizations(lockId?: string) {
    await wait(120);
    const now = Date.now();
    phoneAuthorizations = phoneAuthorizations.map(item => item.status === 'pending' && item.expiresAt <= now ? {...item, status: 'expired'} : item);
    return phoneAuthorizations.filter(item => !lockId || item.lockId === lockId).map(clonePhone);
  },

  async getSummary(lockId?: string): Promise<RemotePhoneSummary> {
    const [remoteList, phoneList] = await Promise.all([this.getRemoteCredentials(lockId), this.getPhoneAuthorizations(lockId)]);
    return {
      remotesTotal: remoteList.length,
      remotesActive: remoteList.filter(item => item.status === 'active' || item.status === 'pendingSync').length,
      remotesRevoked: remoteList.filter(item => item.status === 'revoked').length,
      phoneTotal: phoneList.length,
      phonePending: phoneList.filter(item => item.status === 'pending').length,
      phoneAccepted: phoneList.filter(item => item.status === 'accepted').length,
      phoneRevoked: phoneList.filter(item => item.status === 'revoked' || item.status === 'expired').length,
    };
  },

  async pairRemote(input: PairRemoteInput) {
    await wait(220);
    const lock = await MockLockRepository.getLockById(input.lockId);
    if (!lock) {
      throw new Error('Không tìm thấy khóa để pair remote.');
    }
    if (!lock.permission.canManageCredentials) {
      throw new Error('Tài khoản hiện tại không có quyền cấp remote.');
    }
    if (!lock.capabilities.supportsRemoteControl) {
      throw new Error('Model khóa này không hỗ trợ remote vật lý.');
    }
    if (remotes.some(remote => remote.serial.trim().toLowerCase() === input.serial.trim().toLowerCase() && activeOrPending(remote))) {
      throw new Error('Remote serial đã tồn tại hoặc đang active trong hệ thống.');
    }
    const owner = await getOwner(input.ownerId);
    const status: RemoteCredential['status'] = lock.connectionState === 'offline' ? 'pendingSync' : 'active';
    const remote: RemoteCredential = {
      id: `remote-${Date.now()}`,
      serial: input.serial.trim().toUpperCase(),
      model: input.model.trim() || 'Aplus Remote R2',
      batteryPercent: Math.min(100, Math.max(1, input.batteryPercent)),
      ownerId: owner.id,
      ownerName: owner.fullName,
      lockId: lock.id,
      lockName: lock.name,
      roomName: lock.roomName,
      scopeLabel: `${lock.homeName} · ${lock.roomName}`,
      status,
      syncState: status === 'active' ? 'synced' : 'pending',
      createdAt: Date.now(),
    };
    remotes.unshift(remote);
    await MockCredentialRepository.upsertAccessCredential({
      id: `cred-remote-${remote.id}`,
      type: 'remote',
      title: `${remote.model} · ${remote.serial}`,
      ownerId: remote.ownerId,
      ownerName: remote.ownerName,
      lockId: remote.lockId,
      lockName: remote.lockName,
      scopeLabel: remote.scopeLabel,
      status: toCredentialStatus(remote.status),
      syncState: remote.syncState,
      capabilityKey: 'supportsRemoteControl',
    });
    await MockLockRepository.updateLockRuntimeState(lock.id, {
      activeCredentialCount: lock.activeCredentialCount + 1,
      lastActivity: 'Pair remote vật lý · vừa xong',
      syncState: status === 'active' ? 'synced' : 'pending',
    });
    await addRecord({
      lockId: lock.id,
      lockName: lock.name,
      roomName: lock.roomName,
      method: 'System',
      result: status === 'active' ? 'success' : 'timeout',
      credentialId: `cred-remote-${remote.id}`,
      personId: remote.ownerId,
      actorName: currentActorName,
      message: status === 'active' ? `Đã pair remote ${remote.serial} cho ${remote.ownerName}.` : `Remote ${remote.serial} chờ đồng bộ vì khóa offline.`,
      deviceName: remote.model,
    });
    return cloneRemote(remote);
  },

  async revokeRemote(remoteId: string, revokedBy = currentActorName) {
    await wait(150);
    let updated: RemoteCredential | undefined;
    remotes = remotes.map(remote => {
      if (remote.id !== remoteId) {
        return remote;
      }
      updated = {...remote, status: 'revoked', syncState: 'synced', revokedAt: Date.now(), revokedBy};
      return updated;
    });
    if (!updated) {
      return undefined;
    }
    await MockCredentialRepository.revokeCredential(`cred-remote-${updated.id}`, revokedBy);
    await addRecord({
      lockId: updated.lockId,
      lockName: updated.lockName,
      roomName: updated.roomName,
      method: 'System',
      result: 'success',
      credentialId: `cred-remote-${updated.id}`,
      personId: updated.ownerId,
      actorName: revokedBy,
      message: `Đã thu hồi remote ${updated.serial}.`,
      deviceName: updated.model,
    });
    return cloneRemote(updated);
  },

  async useRemote(remoteId: string) {
    await wait(120);
    const remote = remotes.find(item => item.id === remoteId);
    if (!remote) {
      return undefined;
    }
    const lock = await MockLockRepository.getLockById(remote.lockId);
    if (!lock) {
      return undefined;
    }
    const success = remote.status === 'active' && lock.connectionState !== 'offline';
    remote.lastUsedAt = Date.now();
    const record = await addRecord({
      lockId: lock.id,
      lockName: lock.name,
      roomName: lock.roomName,
      method: 'App Remote Unlock',
      result: success ? 'success' : 'blocked',
      credentialId: `cred-remote-${remote.id}`,
      personId: remote.ownerId,
      actorName: remote.ownerName,
      message: success ? `Remote ${remote.serial} mở khóa thành công.` : `Remote ${remote.serial} bị chặn vì ${remote.status !== 'active' ? 'đã thu hồi/hết hạn' : 'khóa offline'}.`,
      failureReason: success ? undefined : remote.status !== 'active' ? 'remote_revoked_or_not_active' : 'lock_offline',
      deviceName: remote.model,
      batteryPercentAtEvent: lock.batteryPercent,
      gatewayName: lock.gatewayName,
    });
    if (success) {
      await MockLockRepository.updateLockRuntimeState(lock.id, {
        isLocked: false,
        doorState: 'open',
        lastActivity: `Remote ${remote.serial} mở · vừa xong`,
      });
    }
    return record;
  },

  async createPhoneAuthorization(input: CreatePhoneAuthorizationInput) {
    await wait(180);
    const lock = await MockLockRepository.getLockById(input.lockId);
    if (!lock) {
      throw new Error('Không tìm thấy khóa để ủy quyền điện thoại.');
    }
    if (!lock.permission.canManageCredentials) {
      throw new Error('Tài khoản hiện tại không có quyền mời user.');
    }
    if (input.role === 'Owner' || !canGrantRole(currentActorRole, input.role)) {
      throw new Error(`Không thể cấp role ${getRoleLabel(input.role)} cao hơn quyền hiện tại.`);
    }
    if (phoneAuthorizations.some(item => item.lockId === lock.id && item.account.trim().toLowerCase() === input.account.trim().toLowerCase() && (phoneStillPending(item) || item.status === 'accepted'))) {
      throw new Error('Tài khoản/điện thoại này đã có invite hoặc quyền active trên khóa.');
    }
    const token = buildPhoneToken(input.role);
    const auth: PhoneAuthorization = {
      id: `phone-auth-${Date.now()}`,
      account: input.account.trim(),
      displayName: input.displayName?.trim() || input.account.trim(),
      role: input.role,
      lockId: lock.id,
      lockName: lock.name,
      roomName: lock.roomName,
      scopeLabel: `${lock.homeName} · ${lock.roomName}`,
      permissions: getPermissionSet(input.role),
      channel: input.channel,
      status: 'pending',
      token,
      inviteUrl: `https://aplus.lock/phone/${token}`,
      qrPayload: `APLUS_PHONE_AUTH:${token}:${input.role}:${lock.id}`,
      createdAt: Date.now(),
      expiresAt: Date.now() + day * Math.max(1, input.expiresInDays),
    };
    phoneAuthorizations.unshift(auth);
    await addRecord({
      lockId: lock.id,
      lockName: lock.name,
      roomName: lock.roomName,
      method: 'System',
      result: 'success',
      actorName: currentActorName,
      message: `Đã tạo lời mời điện thoại cho ${auth.displayName} (${getRoleLabel(auth.role)}).`,
      deviceName: 'Phone authorization invite',
    });
    return clonePhone(auth);
  },

  async acceptPhoneAuthorization(authId: string) {
    await wait(150);
    let updated: PhoneAuthorization | undefined;
    phoneAuthorizations = phoneAuthorizations.map(item => {
      if (item.id !== authId) {
        return item;
      }
      if (item.status !== 'pending' || item.expiresAt <= Date.now()) {
        updated = {...item, status: 'expired'};
        return updated;
      }
      updated = {...item, status: 'accepted', acceptedAt: Date.now(), credentialId: `cred-phone-${item.id}`};
      return updated;
    });
    if (!updated || updated.status !== 'accepted') {
      return updated ? clonePhone(updated) : undefined;
    }
    await MockCredentialRepository.upsertAccessCredential({
      id: `cred-phone-${updated.id}`,
      type: 'phone',
      title: `Phone auth · ${updated.displayName}`,
      ownerId: `phone-user-${updated.id}`,
      ownerName: updated.displayName,
      lockId: updated.lockId,
      lockName: updated.lockName,
      scopeLabel: updated.scopeLabel,
      status: 'active',
      syncState: 'synced',
    });
    const lock = await MockLockRepository.getLockById(updated.lockId);
    if (lock) {
      await MockLockRepository.updateLockRuntimeState(lock.id, {
        activeCredentialCount: lock.activeCredentialCount + 1,
        lastActivity: `Phone auth accepted · ${updated.displayName}`,
      });
      await addRecord({
        lockId: lock.id,
        lockName: lock.name,
        roomName: lock.roomName,
        method: 'System',
        result: 'success',
        credentialId: `cred-phone-${updated.id}`,
        actorName: updated.displayName,
        message: `${updated.displayName} đã accept quyền điện thoại (${getRoleLabel(updated.role)}).`,
        deviceName: 'Phone authorization accepted',
      });
    }
    return clonePhone(updated);
  },

  async revokePhoneAuthorization(authId: string, revokedBy = currentActorName) {
    await wait(120);
    let updated: PhoneAuthorization | undefined;
    phoneAuthorizations = phoneAuthorizations.map(item => {
      if (item.id !== authId) {
        return item;
      }
      updated = {...item, status: 'revoked', revokedAt: Date.now()};
      return updated;
    });
    if (!updated) {
      return undefined;
    }
    if (updated.credentialId) {
      await MockCredentialRepository.revokeCredential(updated.credentialId, revokedBy);
    }
    await addRecord({
      lockId: updated.lockId,
      lockName: updated.lockName,
      roomName: updated.roomName,
      method: 'System',
      result: 'success',
      credentialId: updated.credentialId,
      actorName: revokedBy,
      message: `Đã thu hồi quyền điện thoại của ${updated.displayName}.`,
      deviceName: 'Phone authorization revoked',
    });
    return clonePhone(updated);
  },
};

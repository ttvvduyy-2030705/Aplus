import {MockNfcAdapter} from '@/services/adapters/nfc/MockNfcAdapter';
import {MockCredentialRepository} from './MockCredentialRepository';
import {MockLockRepository} from './MockLockRepository';
import type {AccessRecord} from '@/types/lock';
import type {CreateNfcCredentialInput, MobileCardPolicy, NfcCredential, NfcCredentialStatus, NfcSummary} from '@/types/nfc';

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const day = 1000 * 60 * 60 * 24;
const currentActorName = 'Admin Aplus';

let policy: MobileCardPolicy = {
  requireScreenLock: true,
  requireBiometricOrPin: true,
  allowOfflineUse: false,
  maxOfflineHours: 0,
  revokeOnDeviceLost: true,
};

let nfcCredentials: NfcCredential[] = [
  {
    id: 'nfc-tenant-1208',
    mobileCardId: 'MOB-A1208-TENANT',
    deviceName: 'iPhone 15 Pro · Tenant',
    phoneModel: 'iPhone 15 Pro',
    ownerId: 'person-tenant-520',
    ownerName: 'Khách thuê căn 520',
    lockId: 'lock-home-1208',
    lockName: 'Cửa chính A1208',
    roomName: 'Căn A1208',
    scopeLabel: 'Aplus Smart Home · Căn A1208',
    status: 'pendingSync',
    syncState: 'pending',
    deviceSupport: 'supported',
    lockSupported: true,
    createdAt: Date.now() - 1000 * 60 * 28,
    expiresAt: Date.now() + day * 60,
  },
  {
    id: 'nfc-old-701',
    mobileCardId: 'MOB-H701-OLD',
    deviceName: 'Galaxy S21 cũ',
    phoneModel: 'Samsung Galaxy S21',
    ownerId: 'person-subadmin-hotel',
    ownerName: 'Quản lý khách sạn',
    lockId: 'lock-hotel-0701',
    lockName: 'Phòng khách sạn 701',
    roomName: 'Phòng 701',
    scopeLabel: 'Aplus Boutique Hotel · Phòng 701',
    status: 'revoked',
    syncState: 'synced',
    deviceSupport: 'supported',
    lockSupported: true,
    createdAt: Date.now() - day * 45,
    revokedAt: Date.now() - day * 2,
    revokedBy: currentActorName,
    lostDevice: true,
  },
];

function cloneCredential(item: NfcCredential): NfcCredential {
  return {...item};
}

function toCredentialStatus(status: NfcCredentialStatus) {
  if (status === 'active') {
    return 'active' as const;
  }
  if (status === 'pendingSync') {
    return 'pendingSync' as const;
  }
  if (status === 'unsupported') {
    return 'unsupported' as const;
  }
  return 'revoked' as const;
}

function canUse(item: NfcCredential) {
  return item.status === 'active' || item.status === 'pendingSync';
}

async function addRecord(item: NfcCredential, result: AccessRecord['result'], message: string, failureReason?: string) {
  const record: AccessRecord = {
    id: `record-batch20-${Date.now()}-${Math.round(Math.random() * 999)}`,
    lockId: item.lockId,
    lockName: item.lockName,
    roomName: item.roomName,
    method: 'NFC',
    result,
    credentialId: `cred-nfc-${item.id}`,
    personId: item.ownerId,
    sourceIp: 'mock-nfc-hce',
    deviceName: item.deviceName,
    failureReason,
    batteryPercentAtEvent: undefined,
    gatewayName: 'Mobile NFC adapter',
    actorName: item.ownerName,
    message,
    createdAt: Date.now(),
  };
  await MockLockRepository.addAccessRecord(record);
  return record;
}

async function syncCredential(item: NfcCredential) {
  return MockCredentialRepository.upsertAccessCredential({
    id: `cred-nfc-${item.id}`,
    type: 'nfc',
    title: `${item.deviceName} · ${item.mobileCardId}`,
    ownerId: item.ownerId,
    ownerName: item.ownerName,
    lockId: item.lockId,
    lockName: item.lockName,
    scopeLabel: item.scopeLabel,
    status: toCredentialStatus(item.status),
    syncState: item.syncState,
    capabilityKey: 'supportsNfc',
    expiresAt: item.expiresAt,
  });
}

export const MockNfcRepository = {
  async getNfcCredentials(lockId?: string) {
    await wait(120);
    return nfcCredentials.filter(item => !lockId || item.lockId === lockId).map(cloneCredential);
  },

  async getSummary(lockId?: string): Promise<NfcSummary> {
    const list = await this.getNfcCredentials(lockId);
    return {
      total: list.length,
      active: list.filter(item => item.status === 'active').length,
      pending: list.filter(item => item.status === 'pendingSync').length,
      unsupported: list.filter(item => item.status === 'unsupported').length,
      revoked: list.filter(item => item.status === 'revoked').length,
      lostDevices: list.filter(item => item.lostDevice).length,
    };
  },

  async getMobileCardPolicy() {
    await wait(80);
    return {...policy};
  },

  async updateMobileCardPolicy(patch: Partial<MobileCardPolicy>) {
    await wait(120);
    policy = {...policy, ...patch};
    return {...policy};
  },

  async createNfcCredential(input: CreateNfcCredentialInput) {
    await wait(180);
    const lock = await MockLockRepository.getLockById(input.lockId);
    if (!lock) {
      throw new Error('Không tìm thấy khóa để tạo NFC credential.');
    }
    if (!lock.permission.canManageCredentials) {
      throw new Error('Tài khoản hiện tại không có quyền cấp NFC/mobile card.');
    }
    if (!lock.capabilities.supportsNfc) {
      const unsupported: NfcCredential = {
        id: `nfc-unsupported-${Date.now()}`,
        mobileCardId: `MOB-UNSUPPORTED-${String(Date.now()).slice(-6)}`,
        deviceName: input.deviceName.trim() || 'Mobile device',
        phoneModel: input.phoneModel.trim() || 'Unknown phone',
        ownerId: input.ownerId,
        ownerName: 'Unknown',
        lockId: lock.id,
        lockName: lock.name,
        roomName: lock.roomName,
        scopeLabel: `${lock.homeName} · ${lock.roomName}`,
        status: 'unsupported',
        syncState: 'error',
        deviceSupport: 'supported',
        lockSupported: false,
        createdAt: Date.now(),
      };
      nfcCredentials.unshift(unsupported);
      return cloneCredential(unsupported);
    }

    MockNfcAdapter.setForcedUnsupported(Boolean(input.forcePhoneUnsupported));
    const support = await MockNfcAdapter.checkSupport();
    const people = await MockCredentialRepository.getPeople();
    const owner = people.find(person => person.id === input.ownerId) ?? people[0];
    const deviceName = input.deviceName.trim() || `${support.phoneSupported ? 'Aplus Mobile' : 'Unsupported phone'} · ${owner.avatarLabel}`;
    const phoneModel = input.phoneModel.trim() || 'Mock NFC phone';
    const activeDuplicate = nfcCredentials.find(item => item.ownerId === owner.id && item.lockId === lock.id && item.deviceName.toLowerCase() === deviceName.toLowerCase() && canUse(item));
    if (activeDuplicate) {
      throw new Error('Điện thoại này đã có NFC credential active/pending cho khóa đã chọn.');
    }

    const status: NfcCredentialStatus = !support.phoneSupported || !support.nfcEnabled ? 'unsupported' : lock.connectionState === 'offline' ? 'pendingSync' : 'active';
    const nfc: NfcCredential = {
      id: `nfc-${Date.now()}`,
      mobileCardId: `MOB-${lock.serial.replace(/[^A-Z0-9]/gi, '').slice(-6)}-${String(Date.now()).slice(-6)}`.toUpperCase(),
      deviceName,
      phoneModel,
      ownerId: owner.id,
      ownerName: owner.fullName,
      lockId: lock.id,
      lockName: lock.name,
      roomName: lock.roomName,
      scopeLabel: `${lock.homeName} · ${lock.roomName}`,
      status,
      syncState: status === 'active' ? 'synced' : status === 'unsupported' ? 'failed' : 'pending',
      deviceSupport: support.phoneSupported ? 'supported' : 'unsupported',
      lockSupported: true,
      createdAt: Date.now(),
      expiresAt: Date.now() + day * Math.max(1, input.validDays),
    };

    if (status !== 'unsupported') {
      await MockNfcAdapter.provisionMobileCard(nfc);
    }
    nfcCredentials.unshift(nfc);
    await syncCredential(nfc);
    await addRecord(nfc, status === 'unsupported' ? 'blocked' : 'success', status === 'unsupported' ? `NFC unsupported cho ${nfc.deviceName}` : `Đăng ký NFC/mobile card cho ${nfc.ownerName}`, status === 'unsupported' ? 'NFC unsupported' : undefined);
    return cloneCredential(nfc);
  },

  async revokeNfcCredential(id: string, lostDevice = false) {
    await wait(160);
    let updated: NfcCredential | undefined;
    nfcCredentials = nfcCredentials.map(item => {
      if (item.id !== id) {
        return item;
      }
      updated = {...item, status: 'revoked', syncState: 'synced', revokedAt: Date.now(), revokedBy: currentActorName, lostDevice};
      return updated;
    });
    if (updated) {
      await MockNfcAdapter.disableMobileCard(updated.mobileCardId);
      await syncCredential(updated);
      await MockCredentialRepository.revokeCredential(`cred-nfc-${updated.id}`, currentActorName);
      await addRecord(updated, 'blocked', lostDevice ? `Thu hồi NFC do mất điện thoại ${updated.deviceName}` : `Thu hồi NFC/mobile card ${updated.deviceName}`, lostDevice ? 'Lost device' : 'NFC revoked');
    }
    return updated ? cloneCredential(updated) : undefined;
  },

  async simulateNfcUse(id: string) {
    await wait(140);
    let updated: NfcCredential | undefined;
    nfcCredentials = nfcCredentials.map(item => {
      if (item.id !== id) {
        return item;
      }
      updated = {...item, lastUsedAt: Date.now()};
      return updated;
    });
    if (!updated) {
      return undefined;
    }
    const result: AccessRecord['result'] = canUse(updated) ? 'success' : 'blocked';
    await addRecord(updated, result, result === 'success' ? `Mở khóa bằng NFC/mobile card ${updated.ownerName}` : `NFC/mobile card bị từ chối: ${updated.deviceName}`, result === 'success' ? undefined : 'NFC credential inactive');
    return cloneCredential(updated);
  },
};

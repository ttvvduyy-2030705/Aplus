import {credentialTypeOptions, permissionMatrix} from '@/services/credential/credentialCatalog';
import type {Credential, CredentialStatus, CredentialType, Person} from '@/types/credential';

const people: Person[] = [
  {
    id: 'person-owner-admin',
    fullName: 'Admin Aplus',
    phone: '0900 000 001',
    email: 'admin@aplus.vn',
    role: 'Owner',
    avatarLabel: 'AD',
    scopeLabel: 'Toàn hệ thống',
    active: true,
  },
  {
    id: 'person-subadmin-hotel',
    fullName: 'Quản lý khách sạn',
    phone: '0900 000 102',
    email: 'hotel@aplus.vn',
    role: 'SubAdmin',
    avatarLabel: 'QL',
    scopeLabel: 'Aplus Boutique Hotel',
    active: true,
  },
  {
    id: 'person-staff-it',
    fullName: 'Nhân sự IT',
    phone: '0900 000 203',
    role: 'Staff',
    avatarLabel: 'IT',
    scopeLabel: 'Aplus Office · Tầng 8',
    active: true,
  },
  {
    id: 'person-tenant-520',
    fullName: 'Khách thuê căn 520',
    phone: '0900 000 520',
    role: 'Tenant',
    avatarLabel: 'KT',
    scopeLabel: 'Căn hộ 520',
    active: true,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 60,
  },
  {
    id: 'person-cleaner-01',
    fullName: 'Dọn phòng ca sáng',
    phone: '0900 000 801',
    role: 'Cleaner',
    avatarLabel: 'DP',
    scopeLabel: 'Khách sạn · Tầng 7-8',
    active: true,
  },
  {
    id: 'person-guest-expired',
    fullName: 'Khách hết hạn',
    phone: '0900 999 999',
    role: 'Guest',
    avatarLabel: 'GH',
    scopeLabel: 'Phòng 802',
    active: false,
    expiresAt: Date.now() - 1000 * 60 * 60 * 24,
  },
];

let credentials: Credential[] = [
  {
    id: 'cred-pin-520-admin',
    type: 'password',
    title: 'PIN quản trị 520',
    ownerId: 'person-owner-admin',
    ownerName: 'Admin Aplus',
    lockId: 'lock-home-520',
    lockName: 'Căn hộ 520',
    scope: {lockId: 'lock-home-520', label: 'Căn hộ 520'},
    status: 'active',
    syncState: 'synced',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
  },
  {
    id: 'cred-card-hotel-701',
    type: 'card',
    title: 'Thẻ khách phòng 701',
    ownerId: 'person-subadmin-hotel',
    ownerName: 'Quản lý khách sạn',
    lockId: 'lock-hotel-0701',
    lockName: 'Phòng khách sạn 701',
    scope: {lockId: 'lock-hotel-0701', label: 'Phòng 701'},
    status: 'active',
    syncState: 'synced',
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 2,
    capabilityKey: 'supportsCard',
  },
  {
    id: 'cred-face-office-revoked',
    type: 'face',
    title: 'Face cũ phòng server',
    ownerId: 'person-staff-it',
    ownerName: 'Nhân sự IT',
    lockId: 'lock-office-server',
    lockName: 'Phòng server',
    scope: {lockId: 'lock-office-server', label: 'Server Room'},
    status: 'revoked',
    syncState: 'synced',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 50,
    revokedAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    revokedBy: 'Admin Aplus',
    capabilityKey: 'supportsFace',
  },
  {
    id: 'cred-nfc-1208-pending',
    type: 'nfc',
    title: 'NFC điện thoại A1208',
    ownerId: 'person-tenant-520',
    ownerName: 'Khách thuê căn 520',
    lockId: 'lock-home-1208',
    lockName: 'Cửa chính A1208',
    scope: {lockId: 'lock-home-1208', label: 'Căn A1208'},
    status: 'pendingSync',
    syncState: 'pending',
    createdAt: Date.now() - 1000 * 60 * 20,
    capabilityKey: 'supportsNfc',
  },
];

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clonePerson(person: Person): Person {
  return {...person};
}

function cloneCredential(credential: Credential): Credential {
  return {...credential, scope: {...credential.scope}};
}

export const MockCredentialRepository = {
  async getCredentialTypes() {
    await wait(100);
    return credentialTypeOptions.map(item => ({...item}));
  },

  async getPeople() {
    await wait(160);
    return people.map(clonePerson);
  },

  async getPermissionMatrix() {
    await wait(80);
    return permissionMatrix.map(item => ({...item, permissions: {...item.permissions}, canGrantRoles: [...item.canGrantRoles]}));
  },

  async getCredentials(lockId?: string) {
    await wait(180);
    return credentials
      .filter(item => !lockId || item.lockId === lockId)
      .map(cloneCredential);
  },

  async getCredentialSummary(lockId?: string) {
    await wait(120);
    const list = credentials.filter(item => !lockId || item.lockId === lockId);
    const countBy = (status: CredentialStatus) => list.filter(item => item.status === status).length;
    return {
      total: list.length,
      active: countBy('active'),
      pending: list.filter(item => item.status === 'pendingSync' || item.status === 'pendingRevoke').length,
      revoked: countBy('revoked'),
      unsupported: countBy('unsupported'),
    };
  },

  async createDraftCredential(input: {type: CredentialType; ownerId: string; lockId?: string; lockName?: string}) {
    await wait(180);
    const owner = people.find(item => item.id === input.ownerId) ?? people[0];
    const option = credentialTypeOptions.find(item => item.type === input.type);
    const credential: Credential = {
      id: `cred-draft-${input.type}-${Date.now()}`,
      type: input.type,
      title: `${option?.title ?? input.type} · ${owner.fullName}`,
      ownerId: owner.id,
      ownerName: owner.fullName,
      lockId: input.lockId,
      lockName: input.lockName,
      scope: {lockId: input.lockId, label: input.lockName ?? 'Phạm vi sẽ chọn ở flow tiếp theo'},
      status: 'draft',
      syncState: 'pending',
      createdAt: Date.now(),
      capabilityKey: option?.requiredCapability,
    };
    credentials.unshift(credential);
    return cloneCredential(credential);
  },

  async revokeCredential(credentialId: string, revokedBy = 'Admin Aplus') {
    await wait(160);
    credentials = credentials.map(item => item.id === credentialId ? {...item, status: 'revoked', syncState: 'synced', revokedAt: Date.now(), revokedBy} : item);
    return credentials.find(item => item.id === credentialId);
  },
};

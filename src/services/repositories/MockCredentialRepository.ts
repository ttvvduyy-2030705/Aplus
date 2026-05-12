import {canGrantRole, credentialTypeOptions, getPermissionSet, permissionMatrix} from '@/services/credential/credentialCatalog';
import type {CreateInviteInput, Credential, CredentialStatus, CredentialType, InviteStatus, MemberFilter, MemberProfile, Membership, Person, StaffSummary, TenancyEmployment, UserInvite} from '@/types/credential';
import type {SyncState} from '@/types/common';
import type {PasswordStatus} from '@/types/password';

const now = Date.now();
const day = 1000 * 60 * 60 * 24;
const currentActorRole = 'Owner' as const;

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
    createdAt: now - day * 180,
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
    createdAt: now - day * 90,
  },
  {
    id: 'person-staff-it',
    fullName: 'Nhân sự IT',
    phone: '0900 000 203',
    email: 'it@aplus.vn',
    role: 'Staff',
    avatarLabel: 'IT',
    scopeLabel: 'Aplus Office · Tầng 8',
    active: true,
    createdAt: now - day * 66,
  },
  {
    id: 'person-tenant-520',
    fullName: 'Khách thuê căn 520',
    phone: '0900 000 520',
    email: 'tenant520@aplus.vn',
    role: 'Tenant',
    avatarLabel: 'KT',
    scopeLabel: 'Căn hộ 520',
    active: true,
    createdAt: now - day * 25,
    expiresAt: now + day * 60,
  },
  {
    id: 'person-cleaner-01',
    fullName: 'Dọn phòng ca sáng',
    phone: '0900 000 801',
    role: 'Cleaner',
    avatarLabel: 'DP',
    scopeLabel: 'Khách sạn · Tầng 7-8',
    active: true,
    createdAt: now - day * 32,
  },
  {
    id: 'person-security-night',
    fullName: 'Bảo vệ ca đêm',
    phone: '0900 000 911',
    email: 'security@aplus.vn',
    role: 'Security',
    avatarLabel: 'BV',
    scopeLabel: 'Tòa nhà Aplus',
    active: true,
    createdAt: now - day * 10,
  },
  {
    id: 'person-guest-expired',
    fullName: 'Khách hết hạn',
    phone: '0900 999 999',
    role: 'Guest',
    avatarLabel: 'GH',
    scopeLabel: 'Phòng 802',
    active: false,
    createdAt: now - day * 9,
    expiresAt: now - day,
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
    createdAt: Date.now() - day * 12,
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
    expiresAt: Date.now() + day * 2,
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
    createdAt: Date.now() - day * 50,
    revokedAt: Date.now() - day * 4,
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

let memberships: Membership[] = [
  {id: 'membership-owner', personId: 'person-owner-admin', role: 'Owner', scopeType: 'system', scopeLabel: 'Toàn hệ thống', permissions: getPermissionSet('Owner'), status: 'active', startsAt: now - day * 180, credentialIds: ['cred-pin-520-admin']},
  {id: 'membership-hotel', personId: 'person-subadmin-hotel', role: 'SubAdmin', scopeType: 'home', scopeId: 'home-hotel', scopeLabel: 'Aplus Boutique Hotel', permissions: {...getPermissionSet('SubAdmin'), addKey: false}, status: 'active', startsAt: now - day * 90, credentialIds: ['cred-card-hotel-701']},
  {id: 'membership-it', personId: 'person-staff-it', role: 'Staff', scopeType: 'floor', scopeId: 'office-floor-8', scopeLabel: 'Aplus Office · Tầng 8', permissions: getPermissionSet('Staff'), status: 'active', startsAt: now - day * 66, credentialIds: ['cred-face-office-revoked']},
  {id: 'membership-tenant-520', personId: 'person-tenant-520', role: 'Tenant', scopeType: 'lock', scopeId: 'lock-home-520', scopeLabel: 'Căn hộ 520', permissions: getPermissionSet('Tenant'), status: 'active', startsAt: now - day * 25, expiresAt: now + day * 60, credentialIds: ['cred-nfc-1208-pending']},
  {id: 'membership-cleaner', personId: 'person-cleaner-01', role: 'Cleaner', scopeType: 'floor', scopeId: 'hotel-floor-7-8', scopeLabel: 'Khách sạn · Tầng 7-8', permissions: getPermissionSet('Cleaner'), status: 'active', startsAt: now - day * 32, credentialIds: []},
  {id: 'membership-security', personId: 'person-security-night', role: 'Security', scopeType: 'building', scopeId: 'building-aplus', scopeLabel: 'Tòa nhà Aplus', permissions: getPermissionSet('Security'), status: 'active', startsAt: now - day * 10, credentialIds: []},
  {id: 'membership-guest-expired', personId: 'person-guest-expired', role: 'Guest', scopeType: 'room', scopeId: 'room-802', scopeLabel: 'Phòng 802', permissions: getPermissionSet('Guest'), status: 'expired', startsAt: now - day * 9, expiresAt: now - day, credentialIds: []},
];

let relations: TenancyEmployment[] = [
  {id: 'rel-hotel-manager', personId: 'person-subadmin-hotel', type: 'employment', title: 'Quản lý vận hành', scopeLabel: 'Aplus Boutique Hotel', startsAt: now - day * 90, status: 'active', note: 'Được xem records, phòng và nhân sự trong phạm vi khách sạn.'},
  {id: 'rel-staff-it', personId: 'person-staff-it', type: 'employment', title: 'Nhân viên kỹ thuật IT', scopeLabel: 'Aplus Office', startsAt: now - day * 66, status: 'active', note: 'Không được cấp quyền mới nếu thiếu addKey.'},
  {id: 'rel-tenant-520', personId: 'person-tenant-520', type: 'tenancy', title: 'Hợp đồng thuê căn hộ', scopeLabel: 'Căn hộ 520', startsAt: now - day * 25, endsAt: now + day * 60, status: 'active', note: 'Hết hạn thuê phải revoke toàn bộ credential liên quan.'},
  {id: 'rel-guest-expired', personId: 'person-guest-expired', type: 'tenancy', title: 'Khách lưu trú đã checkout', scopeLabel: 'Phòng 802', startsAt: now - day * 9, endsAt: now - day, status: 'expired'},
];

let invites: UserInvite[] = [
  {
    id: 'invite-staff-cleaner',
    account: 'cleaner2@aplus.vn',
    role: 'Cleaner',
    scopeType: 'floor',
    scopeLabel: 'Khách sạn · Tầng 6',
    channel: 'link',
    status: 'pending',
    token: 'APLUS-CLEANER2',
    inviteUrl: 'https://aplus.lock/invite/APLUS-CLEANER2',
    qrPayload: 'APLUS_LOCK_INVITE:APLUS-CLEANER2:Cleaner',
    createdAt: now - 1000 * 60 * 45,
    expiresAt: now + day * 2,
  },
];

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function clonePerson(person: Person): Person {
  return {...person};
}

function cloneCredential(credential: Credential): Credential {
  return {...credential, scope: {...credential.scope}};
}

function cloneMembership(membership: Membership): Membership {
  return {...membership, permissions: {...membership.permissions}, credentialIds: [...membership.credentialIds]};
}

function cloneRelation(relation: TenancyEmployment): TenancyEmployment {
  return {...relation};
}

function cloneInvite(invite: UserInvite): UserInvite {
  return {...invite};
}

function mapPasswordStatusToCredentialStatus(status: PasswordStatus): CredentialStatus {
  if (status === 'pendingSync') {
    return 'pendingSync';
  }
  if (status === 'pendingRevoke') {
    return 'pendingRevoke';
  }
  if (status === 'revoked') {
    return 'revoked';
  }
  if (status === 'expired' || status === 'used') {
    return 'expired';
  }
  return 'active';
}

function currentMembershipStatus(person: Person, membership: Membership) {
  if (!person.active || membership.status === 'revoked') {
    return 'revoked' as const;
  }
  if (membership.expiresAt && membership.expiresAt < Date.now()) {
    return 'expired' as const;
  }
  return membership.status;
}

function getProfiles(): MemberProfile[] {
  return people.map(person => {
    const membership = memberships.find(item => item.personId === person.id) ?? {
      id: `membership-${person.id}`,
      personId: person.id,
      role: person.role,
      scopeType: 'system' as const,
      scopeLabel: person.scopeLabel,
      permissions: getPermissionSet(person.role),
      status: person.active ? 'active' as const : 'revoked' as const,
      startsAt: person.createdAt ?? Date.now(),
      expiresAt: person.expiresAt,
      credentialIds: [],
    };
    const personCredentials = credentials.filter(item => item.ownerId === person.id);
    return {
      person: clonePerson(person),
      membership: {...cloneMembership(membership), status: currentMembershipStatus(person, membership)},
      relation: relations.find(item => item.personId === person.id),
      activeCredentialCount: personCredentials.filter(item => item.status === 'active' || item.status === 'pendingSync').length,
      revokedCredentialCount: personCredentials.filter(item => item.status === 'revoked' || item.status === 'pendingRevoke' || item.status === 'expired').length,
      canCurrentUserGrant: canGrantRole(currentActorRole, person.role),
    };
  });
}

function refreshPersonScope(personId: string, scopeLabel: string, role: Person['role'], active: boolean, expiresAt?: number) {
  const index = people.findIndex(item => item.id === personId);
  if (index >= 0) {
    people[index] = {...people[index], role, scopeLabel, active, expiresAt};
  }
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

  async getMemberProfiles(filter?: MemberFilter) {
    await wait(160);
    const query = filter?.query?.trim().toLowerCase();
    return getProfiles()
      .filter(profile => !filter?.role || filter.role === 'all' || profile.person.role === filter.role)
      .filter(profile => !filter?.status || filter.status === 'all' || profile.membership.status === filter.status)
      .filter(profile => !query || [profile.person.fullName, profile.person.phone, profile.person.email ?? '', profile.membership.scopeLabel, profile.relation?.title ?? ''].some(value => value.toLowerCase().includes(query)))
      .map(profile => ({...profile, person: clonePerson(profile.person), membership: cloneMembership(profile.membership), relation: profile.relation ? cloneRelation(profile.relation) : undefined}));
  },

  async getMemberProfileById(personId: string) {
    await wait(100);
    const profile = getProfiles().find(item => item.person.id === personId);
    return profile ? {...profile, person: clonePerson(profile.person), membership: cloneMembership(profile.membership), relation: profile.relation ? cloneRelation(profile.relation) : undefined} : undefined;
  },

  async getStaffSummary(): Promise<StaffSummary> {
    await wait(80);
    const profiles = getProfiles();
    const active = profiles.filter(item => item.membership.status === 'active');
    return {
      total: profiles.length,
      subAdmins: active.filter(item => item.person.role === 'SubAdmin').length,
      staff: active.filter(item => item.person.role === 'Staff' || item.person.role === 'Cleaner' || item.person.role === 'Security').length,
      tenants: active.filter(item => item.person.role === 'Tenant').length,
      guests: active.filter(item => item.person.role === 'Guest').length,
      expiringSoon: active.filter(item => item.membership.expiresAt && item.membership.expiresAt < Date.now() + day * 14).length,
      pendingInvites: invites.filter(item => item.status === 'pending').length,
    };
  },

  async getInvites(status?: InviteStatus | 'all') {
    await wait(100);
    return invites.filter(item => !status || status === 'all' || item.status === status).map(cloneInvite);
  },

  async createInvite(input: CreateInviteInput) {
    await wait(160);
    if (input.role === 'Owner' || !canGrantRole(currentActorRole, input.role)) {
      throw new Error('Tài khoản hiện tại không được cấp role này. Owner không được mời trực tiếp qua link.');
    }
    const token = `APLUS-${input.role.toUpperCase()}-${String(Date.now()).slice(-6)}`;
    const invite: UserInvite = {
      id: `invite-${Date.now()}`,
      account: input.account,
      role: input.role,
      scopeType: input.scopeType,
      scopeLabel: input.scopeLabel,
      channel: input.channel,
      status: 'pending',
      token,
      inviteUrl: `https://aplus.lock/invite/${token}`,
      qrPayload: `APLUS_LOCK_INVITE:${token}:${input.role}:${input.scopeLabel}`,
      createdAt: Date.now(),
      expiresAt: Date.now() + day * Math.max(1, input.expiresInDays),
    };
    invites.unshift(invite);
    return cloneInvite(invite);
  },

  async acceptInvite(inviteId: string) {
    await wait(150);
    const invite = invites.find(item => item.id === inviteId);
    if (!invite || invite.status !== 'pending' || invite.expiresAt < Date.now()) {
      return undefined;
    }
    invite.status = 'accepted';
    invite.acceptedAt = Date.now();
    const personId = `person-invite-${Date.now()}`;
    const labelSource = invite.account.split('@')[0] || 'US';
    const person: Person = {
      id: personId,
      fullName: `User ${labelSource}`,
      phone: invite.account.includes('@') ? 'Chưa cập nhật' : invite.account,
      email: invite.account.includes('@') ? invite.account : undefined,
      role: invite.role,
      avatarLabel: labelSource.slice(0, 2).toUpperCase(),
      scopeLabel: invite.scopeLabel,
      active: true,
      createdAt: Date.now(),
    };
    people.unshift(person);
    memberships.unshift({
      id: `membership-${personId}`,
      personId,
      role: invite.role,
      scopeType: invite.scopeType,
      scopeLabel: invite.scopeLabel,
      permissions: getPermissionSet(invite.role),
      status: 'active',
      startsAt: Date.now(),
      expiresAt: invite.role === 'Guest' || invite.role === 'Tenant' ? invite.expiresAt : undefined,
      credentialIds: [],
    });
    if (invite.role === 'Tenant' || invite.role === 'Guest') {
      relations.unshift({id: `rel-${personId}`, personId, type: 'tenancy', title: invite.role === 'Tenant' ? 'Hợp đồng thuê mock' : 'Khách lưu trú mock', scopeLabel: invite.scopeLabel, startsAt: Date.now(), endsAt: invite.expiresAt, status: 'active'});
    } else {
      relations.unshift({id: `rel-${personId}`, personId, type: 'employment', title: 'Nhân sự được mời mock', scopeLabel: invite.scopeLabel, startsAt: Date.now(), status: 'active'});
    }
    return cloneInvite(invite);
  },

  async revokeInvite(inviteId: string) {
    await wait(100);
    const invite = invites.find(item => item.id === inviteId);
    if (invite && invite.status === 'pending') {
      invite.status = 'revoked';
      invite.revokedAt = Date.now();
    }
    return invite ? cloneInvite(invite) : undefined;
  },

  async revokeMemberAndCredentials(personId: string, revokedBy = 'Admin Aplus') {
    await wait(180);
    const nowTs = Date.now();
    const person = people.find(item => item.id === personId);
    if (!person || person.role === 'Owner') {
      return undefined;
    }
    person.active = false;
    credentials = credentials.map(item => item.ownerId === personId && item.status !== 'revoked'
      ? {...item, status: 'revoked', syncState: 'synced', revokedAt: nowTs, revokedBy}
      : item);
    memberships = memberships.map(item => item.personId === personId ? {...item, status: 'revoked', revokedAt: nowTs, revokedBy} : item);
    relations = relations.map(item => item.personId === personId ? {...item, status: 'ended', endsAt: item.endsAt ?? nowTs} : item);
    const membership = memberships.find(item => item.personId === personId);
    if (membership) {
      refreshPersonScope(personId, membership.scopeLabel, membership.role, false, membership.expiresAt);
    }
    return this.getMemberProfileById(personId);
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
    memberships = memberships.map(item => item.personId === owner.id ? {...item, credentialIds: [credential.id, ...item.credentialIds]} : item);
    return cloneCredential(credential);
  },

  async upsertAccessCredential(input: {
    id: string;
    type: CredentialType;
    title: string;
    ownerId: string;
    ownerName: string;
    lockId?: string;
    lockName?: string;
    scopeLabel: string;
    status: CredentialStatus;
    syncState: SyncState;
    capabilityKey?: Credential['capabilityKey'];
    expiresAt?: number;
  }) {
    await wait(80);
    const nextCredential: Credential = {
      id: input.id,
      type: input.type,
      title: input.title,
      ownerId: input.ownerId,
      ownerName: input.ownerName,
      lockId: input.lockId,
      lockName: input.lockName,
      scope: {lockId: input.lockId, label: input.scopeLabel},
      status: input.status,
      syncState: input.syncState,
      createdAt: Date.now(),
      expiresAt: input.expiresAt,
      capabilityKey: input.capabilityKey,
    };

    let found = false;
    credentials = credentials.map(item => {
      if (item.id !== input.id) {
        return item;
      }
      found = true;
      return {...item, ...nextCredential, createdAt: item.createdAt};
    });
    if (!found) {
      credentials.unshift(nextCredential);
      memberships = memberships.map(item => item.personId === input.ownerId ? {...item, credentialIds: [input.id, ...item.credentialIds]} : item);
    }
    return cloneCredential(credentials.find(item => item.id === input.id) ?? nextCredential);
  },

  async revokeCredential(credentialId: string, revokedBy = 'Admin Aplus') {
    await wait(160);
    credentials = credentials.map(item => item.id === credentialId ? {...item, status: 'revoked', syncState: 'synced', revokedAt: Date.now(), revokedBy} : item);
    return credentials.find(item => item.id === credentialId);
  },

  async upsertPasswordCredential(input: {
    passwordId: string;
    title: string;
    ownerId: string;
    ownerName: string;
    lockId: string;
    lockName: string;
    roomName: string;
    status: PasswordStatus;
    syncState: SyncState;
    expiresAt?: number;
  }) {
    await wait(80);
    const credentialId = `cred-password-${input.passwordId}`;
    const nextCredential: Credential = {
      id: credentialId,
      type: 'password',
      title: input.title,
      ownerId: input.ownerId,
      ownerName: input.ownerName,
      lockId: input.lockId,
      lockName: input.lockName,
      scope: {lockId: input.lockId, label: input.roomName || input.lockName},
      status: mapPasswordStatusToCredentialStatus(input.status),
      syncState: input.syncState,
      createdAt: Date.now(),
      expiresAt: input.expiresAt,
    };

    let found = false;
    credentials = credentials.map(item => {
      if (item.id !== credentialId) {
        return item;
      }
      found = true;
      return {...item, ...nextCredential, createdAt: item.createdAt};
    });
    if (!found) {
      credentials.unshift(nextCredential);
      memberships = memberships.map(item => item.personId === input.ownerId ? {...item, credentialIds: [credentialId, ...item.credentialIds]} : item);
    }
    return cloneCredential(found ? credentials.find(item => item.id === credentialId)! : nextCredential);
  },

  async updatePasswordCredentialStatus(passwordId: string, status: PasswordStatus, syncState: SyncState, revokedBy?: string) {
    await wait(80);
    const credentialId = `cred-password-${passwordId}`;
    let updated: Credential | undefined;
    credentials = credentials.map(item => {
      if (item.id !== credentialId) {
        return item;
      }
      updated = {
        ...item,
        status: mapPasswordStatusToCredentialStatus(status),
        syncState,
        revokedAt: status === 'revoked' || status === 'pendingRevoke' ? Date.now() : item.revokedAt,
        revokedBy: status === 'revoked' || status === 'pendingRevoke' ? revokedBy ?? 'Admin Aplus' : item.revokedBy,
      };
      return updated;
    });
    return updated ? cloneCredential(updated) : undefined;
  },
};

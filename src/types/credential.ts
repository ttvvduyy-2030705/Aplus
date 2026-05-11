import type {AplusIconName} from '@/components/base/AplusIcon';
import type {AppRouteName} from '@/navigation/routes';
import type {SyncState} from './common';
import type {LockCapabilities, LockPermission} from './lock';

export type CredentialType =
  | 'password'
  | 'fingerprint'
  | 'face'
  | 'card'
  | 'remote'
  | 'phone'
  | 'nfc'
  | 'admin'
  | 'combination';

export type CredentialStatus = 'active' | 'pendingSync' | 'pendingRevoke' | 'revoked' | 'expired' | 'unsupported' | 'draft';
export type PersonRole = 'Owner' | 'SubAdmin' | 'Staff' | 'Tenant' | 'Guest' | 'Cleaner' | 'Security';
export type PermissionAction = 'unlock' | 'remoteUnlock' | 'addKey' | 'records' | 'rooms' | 'staff' | 'reports' | 'settings';

export type CredentialTypeOption = {
  type: CredentialType;
  title: string;
  description: string;
  icon: AplusIconName;
  targetRoute: AppRouteName;
  requiredCapability?: keyof LockCapabilities;
  requiredPermission?: keyof LockPermission;
  sensitive?: boolean;
};

export type Person = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: PersonRole;
  avatarLabel: string;
  scopeLabel: string;
  active: boolean;
  createdAt?: number;
  expiresAt?: number;
};

export type PermissionSet = Record<PermissionAction, boolean>;

export type PermissionMatrixEntry = {
  role: PersonRole;
  label: string;
  permissions: PermissionSet;
  canGrantRoles: PersonRole[];
};

export type MembershipStatus = 'active' | 'pendingInvite' | 'expired' | 'revoked';
export type MembershipScopeType = 'system' | 'home' | 'building' | 'floor' | 'room' | 'lock';

export type Membership = {
  id: string;
  personId: string;
  role: PersonRole;
  scopeType: MembershipScopeType;
  scopeId?: string;
  scopeLabel: string;
  permissions: PermissionSet;
  status: MembershipStatus;
  startsAt: number;
  expiresAt?: number;
  revokedAt?: number;
  revokedBy?: string;
  credentialIds: string[];
};

export type TenancyEmployment = {
  id: string;
  personId: string;
  type: 'tenancy' | 'employment';
  title: string;
  scopeLabel: string;
  startsAt: number;
  endsAt?: number;
  status: 'active' | 'ended' | 'expired';
  note?: string;
};

export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';
export type InviteChannel = 'qr' | 'link' | 'email' | 'phone';

export type UserInvite = {
  id: string;
  account: string;
  role: PersonRole;
  scopeType: MembershipScopeType;
  scopeLabel: string;
  channel: InviteChannel;
  status: InviteStatus;
  token: string;
  inviteUrl: string;
  qrPayload: string;
  createdAt: number;
  expiresAt: number;
  acceptedAt?: number;
  revokedAt?: number;
};

export type MemberProfile = {
  person: Person;
  membership: Membership;
  relation?: TenancyEmployment;
  activeCredentialCount: number;
  revokedCredentialCount: number;
  canCurrentUserGrant: boolean;
};

export type StaffSummary = {
  total: number;
  subAdmins: number;
  staff: number;
  tenants: number;
  guests: number;
  expiringSoon: number;
  pendingInvites: number;
};

export type MemberFilter = {
  role?: PersonRole | 'all';
  status?: MembershipStatus | 'all';
  query?: string;
};

export type CreateInviteInput = {
  account: string;
  role: PersonRole;
  scopeType: MembershipScopeType;
  scopeLabel: string;
  channel: InviteChannel;
  expiresInDays: number;
};

export type CredentialScope = {
  homeId?: string;
  roomId?: string;
  lockId?: string;
  label: string;
};

export type Credential = {
  id: string;
  type: CredentialType;
  title: string;
  ownerId: string;
  ownerName: string;
  lockId?: string;
  lockName?: string;
  scope: CredentialScope;
  status: CredentialStatus;
  syncState: SyncState;
  createdAt: number;
  expiresAt?: number;
  capabilityKey?: keyof LockCapabilities;
  revokedAt?: number;
  revokedBy?: string;
};

export type CapabilityCheckResult = {
  type: CredentialType;
  label: string;
  supported: boolean;
  permissionAllowed: boolean;
  enabled: boolean;
  message: string;
};

export type CredentialFlowContext = {
  lockId?: string;
  credentialType: CredentialType;
  recipientId?: string;
};

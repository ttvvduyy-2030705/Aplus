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
  expiresAt?: number;
};

export type PermissionSet = Record<PermissionAction, boolean>;

export type PermissionMatrixEntry = {
  role: PersonRole;
  label: string;
  permissions: PermissionSet;
  canGrantRoles: PersonRole[];
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

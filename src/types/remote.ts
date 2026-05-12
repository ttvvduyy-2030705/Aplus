import type {SyncState} from './common';
import type {InviteChannel, InviteStatus, PermissionSet, PersonRole} from './credential';

export type RemoteCredentialStatus = 'active' | 'pendingSync' | 'revoked' | 'expired' | 'unsupported';
export type RemotePairingStep = 'idle' | 'waiting' | 'scanning' | 'detected' | 'binding' | 'completed' | 'duplicate' | 'unsupported' | 'failed';

export type RemotePairingState = {
  step: RemotePairingStep;
  message: string;
  lastSerial?: string;
};

export type RemoteCredential = {
  id: string;
  serial: string;
  model: string;
  batteryPercent: number;
  ownerId: string;
  ownerName: string;
  lockId: string;
  lockName: string;
  roomName: string;
  scopeLabel: string;
  status: RemoteCredentialStatus;
  syncState: SyncState;
  createdAt: number;
  lastUsedAt?: number;
  revokedAt?: number;
  revokedBy?: string;
};

export type PairRemoteInput = {
  lockId: string;
  ownerId: string;
  serial: string;
  model: string;
  batteryPercent: number;
};

export type PhoneAuthorizationStatus = InviteStatus;
export type PhoneAuthorizationChannel = InviteChannel;

export type PhoneAuthorization = {
  id: string;
  account: string;
  displayName: string;
  role: PersonRole;
  lockId: string;
  lockName: string;
  roomName: string;
  scopeLabel: string;
  permissions: PermissionSet;
  channel: PhoneAuthorizationChannel;
  status: PhoneAuthorizationStatus;
  token: string;
  inviteUrl: string;
  qrPayload: string;
  createdAt: number;
  expiresAt: number;
  acceptedAt?: number;
  revokedAt?: number;
  credentialId?: string;
};

export type CreatePhoneAuthorizationInput = {
  lockId: string;
  account: string;
  displayName?: string;
  role: PersonRole;
  channel: PhoneAuthorizationChannel;
  expiresInDays: number;
};

export type RemotePhoneSummary = {
  remotesTotal: number;
  remotesActive: number;
  remotesRevoked: number;
  phoneTotal: number;
  phonePending: number;
  phoneAccepted: number;
  phoneRevoked: number;
};

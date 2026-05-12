import type {SyncState} from './common';

export type NfcCredentialStatus = 'active' | 'unsupported' | 'revoked' | 'pendingSync';
export type NfcDeviceSupportStatus = 'supported' | 'unsupported' | 'permissionRequired';
export type NfcProvisionStep = 'idle' | 'checking' | 'writingSecureElement' | 'syncingLock' | 'completed' | 'failed';

export type NfcAdapterSupport = {
  phoneSupported: boolean;
  nfcEnabled: boolean;
  secureElementAvailable: boolean;
  hceAvailable: boolean;
  message: string;
};

export type NfcCredential = {
  id: string;
  mobileCardId: string;
  deviceName: string;
  phoneModel: string;
  ownerId: string;
  ownerName: string;
  lockId: string;
  lockName: string;
  roomName: string;
  scopeLabel: string;
  status: NfcCredentialStatus;
  syncState: SyncState;
  deviceSupport: NfcDeviceSupportStatus;
  lockSupported: boolean;
  createdAt: number;
  expiresAt?: number;
  lastUsedAt?: number;
  revokedAt?: number;
  revokedBy?: string;
  lostDevice?: boolean;
};

export type MobileCardPolicy = {
  requireScreenLock: boolean;
  requireBiometricOrPin: boolean;
  allowOfflineUse: boolean;
  maxOfflineHours: number;
  revokeOnDeviceLost: boolean;
};

export type NfcProvisionState = {
  step: NfcProvisionStep;
  message: string;
  error?: string;
};

export type CreateNfcCredentialInput = {
  ownerId: string;
  lockId: string;
  deviceName: string;
  phoneModel: string;
  validDays: number;
  forcePhoneUnsupported?: boolean;
};

export type NfcSummary = {
  total: number;
  active: number;
  pending: number;
  unsupported: number;
  revoked: number;
  lostDevices: number;
};

export type NfcAdapter = {
  checkSupport: () => Promise<NfcAdapterSupport>;
  provisionMobileCard: (credential: NfcCredential) => Promise<{secureElementRef: string}>;
  disableMobileCard: (mobileCardId: string) => Promise<boolean>;
};

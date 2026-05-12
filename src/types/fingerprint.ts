import type {CredentialStatus, Person} from './credential';
import type {SyncState} from './common';

export type FingerprintEnrollPhase =
  | 'waiting'
  | 'scanning1'
  | 'scanning2'
  | 'scanning3'
  | 'qualityLow'
  | 'duplicate'
  | 'completed'
  | 'failed';

export type FingerprintScanStep = {
  index: 1 | 2 | 3;
  status: 'waiting' | 'scanning' | 'passed' | 'qualityLow' | 'duplicate' | 'failed';
  qualityScore?: number;
  message: string;
  scannedAt?: number;
};

export type BiometricTemplateRef = {
  templateId: string;
  deviceRef: string;
  algorithm: 'mock-minutiae-v1';
  createdAt: number;
};

export type FingerprintCredential = {
  id: string;
  credentialId: string;
  lockId: string;
  lockName: string;
  roomName: string;
  ownerId: string;
  ownerName: string;
  label: string;
  status: CredentialStatus;
  syncState: SyncState;
  templateRef: BiometricTemplateRef;
  qualityScore: number;
  useCount: number;
  lastUsedAt?: number;
  createdAt: number;
  updatedAt: number;
  revokedAt?: number;
  revokedBy?: string;
};

export type FingerprintEnrollmentInput = {
  lockId: string;
  lockName: string;
  roomName: string;
  owner: Person;
  label?: string;
  offline?: boolean;
  qualityScore?: number;
};

export type FingerprintEnrollState = {
  phase: FingerprintEnrollPhase;
  scanCount: number;
  qualityScore?: number;
  duplicateCredentialId?: string;
  error?: string;
  steps: FingerprintScanStep[];
};

export type FingerprintRenameInput = {
  fingerprintId: string;
  label: string;
};

export type FingerprintOwnerChangeInput = {
  fingerprintId: string;
  owner: Person;
};

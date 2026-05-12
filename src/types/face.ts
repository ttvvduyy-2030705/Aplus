import type {SyncState} from './common';
import type {CredentialStatus, Person} from './credential';

export type FaceEnrollPhase = 'waiting' | 'front' | 'left' | 'right' | 'verifying' | 'completed' | 'duplicate' | 'failed';
export type FaceScanDirection = 'front' | 'left' | 'right';
export type FaceScanStepStatus = 'pending' | 'scanning' | 'passed' | 'failed';

export type FaceScanStep = {
  direction: FaceScanDirection;
  label: string;
  status: FaceScanStepStatus;
  qualityScore?: number;
  message: string;
};

export type FaceTemplateRef = {
  templateId: string;
  deviceRef: string;
  algorithm: 'mock-face-vector-v1';
  poseSet: FaceScanDirection[];
  liveness: 'mock-pass' | 'mock-fail';
  createdAt: number;
};

export type FaceCredential = {
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
  templateRef: FaceTemplateRef;
  qualityScore: number;
  useCount: number;
  lastUsedAt?: number;
  createdAt: number;
  updatedAt: number;
  revokedAt?: number;
  revokedBy?: string;
};

export type FaceEnrollmentInput = {
  lockId: string;
  lockName: string;
  roomName: string;
  owner: Person;
  label?: string;
  qualityScore?: number;
  offline?: boolean;
};

export type FaceRenameInput = {
  faceId: string;
  label: string;
};

export type FaceOwnerChangeInput = {
  faceId: string;
  owner: Person;
};

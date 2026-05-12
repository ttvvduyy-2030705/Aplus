import type {SyncState} from './common';

export type CardIssuerDeviceStatus = 'online' | 'offline' | 'busy';
export type ProjectCardKind = 'installation' | 'time' | 'emergency' | 'cellPhone' | 'batch';
export type ProjectCardStatus = 'draft' | 'pendingAuth' | 'issued' | 'active' | 'expired' | 'revoked' | 'failed';
export type BatchIssueStatus = 'draft' | 'previewed' | 'issuing' | 'completed' | 'failed' | 'rolledBack';

export type CardIssuerDevice = {
  id: string;
  name: string;
  serial: string;
  location: string;
  status: CardIssuerDeviceStatus;
  batteryPercent: number;
  firmwareVersion: string;
  lastSeenAt: number;
};

export type InstallationCardJob = {
  id: string;
  issuerDeviceId: string;
  title: string;
  lockIds: string[];
  lockNames: string[];
  status: ProjectCardStatus;
  createdAt: number;
  completedAt?: number;
  syncState: SyncState;
  auditId?: string;
};

export type TimeCalibrationCard = {
  id: string;
  issuerDeviceId: string;
  lockId: string;
  lockName: string;
  timezone: string;
  timezoneOffsetMinutes: number;
  status: ProjectCardStatus;
  createdAt: number;
  calibratedAt?: number;
  syncState: SyncState;
};

export type EmergencyCard = {
  id: string;
  issuerDeviceId: string;
  cardId: string;
  lockId: string;
  lockName: string;
  roomName: string;
  ownerId: string;
  ownerName: string;
  kind: 'emergency' | 'cellPhone';
  status: ProjectCardStatus;
  validFrom: number;
  validTo: number;
  authMethod: 'appPin' | 'biometric' | 'otp';
  createdAt: number;
  revokedAt?: number;
  syncState: SyncState;
};

export type BatchIssuePreviewRow = {
  rowNo: number;
  cardId: string;
  lockId: string;
  ownerId: string;
  kind: 'staff' | 'tenant' | 'guest' | 'cleaner' | 'security';
  validDays: number;
  ok: boolean;
  errors: string[];
};

export type BatchIssueJob = {
  id: string;
  title: string;
  status: BatchIssueStatus;
  rows: BatchIssuePreviewRow[];
  issuedCount: number;
  failedCount: number;
  rollbackAvailable: boolean;
  createdAt: number;
  completedAt?: number;
  rolledBackAt?: number;
};

export type CardIssuerSummary = {
  issuerDevices: number;
  onlineDevices: number;
  installationJobs: number;
  timeCards: number;
  activeEmergencyCards: number;
  batchJobs: number;
  pendingAudit: number;
};

export type CreateEmergencyCardInput = {
  issuerDeviceId: string;
  lockId: string;
  ownerId: string;
  kind: 'emergency' | 'cellPhone';
  validMinutes: number;
  authMethod: 'appPin' | 'biometric' | 'otp';
  authCode: string;
};

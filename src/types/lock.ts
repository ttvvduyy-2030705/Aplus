import type {SyncState} from './common';

export type LockConnectionState = 'online' | 'offline' | 'bluetooth-only' | 'syncing';
export type BatteryState = 'good' | 'medium' | 'low' | 'critical';
export type LockDomainType = 'home' | 'hotel' | 'office';
export type LockFilterType = 'all' | LockDomainType;

export type AplusHome = {
  id: string;
  name: string;
  type: LockDomainType;
  address: string;
  totalLocks: number;
  onlineLocks: number;
  alertCount: number;
};

export type LockCapabilities = {
  supportsRemoteUnlock: boolean;
  supportsFingerprint: boolean;
  supportsFace: boolean;
  supportsCard: boolean;
  supportsNfc: boolean;
  supportsRemoteControl: boolean;
  supportsGateway: boolean;
  supportsOta: boolean;
};

export type LockSettings = {
  remoteUnlockEnabled: boolean;
  autoLockEnabled: boolean;
  autoLockSeconds: number;
  soundEnabled: boolean;
  doorLeftOpenAlertSeconds: number;
  lowBatteryThreshold: number;
};

export type LockPermission = {
  canRemoteUnlock: boolean;
  canLock: boolean;
  canManageCredentials: boolean;
  canViewRecords: boolean;
  canChangeSettings: boolean;
};

export type AplusLock = {
  id: string;
  serial: string;
  name: string;
  homeId: string;
  homeName: string;
  homeType: LockDomainType;
  buildingName?: string;
  floorName?: string;
  roomName: string;
  roomNo: string;
  address: string;
  connectionState: LockConnectionState;
  isLocked: boolean;
  doorState: 'closed' | 'open' | 'left-open' | 'unknown';
  batteryPercent: number;
  batteryState: BatteryState;
  signalPercent: number;
  gatewayOnline: boolean;
  gatewayName?: string;
  firmwareVersion: string;
  hardwareModel?: string;
  lastActivity: string;
  lastSeenAt: string;
  alertCount: number;
  activeCredentialCount: number;
  syncState: SyncState;
  capabilities: LockCapabilities;
  settings: LockSettings;
  permission: LockPermission;
};

export type LockDashboardSummary = {
  totalLocks: number;
  onlineLocks: number;
  offlineLocks: number;
  lowBatteryLocks: number;
  alertLocks: number;
  pendingSyncLocks: number;
};

export type LockCommandType = 'remoteUnlock' | 'lock' | 'unlock';
export type LockCommandStatus = 'pending' | 'sent' | 'ack' | 'success' | 'timeout' | 'failed';
export type LockCommandScenario = 'success' | 'timeout' | 'failed';
export type LockCommandAuthMethod = 'pin' | 'biometric' | 'mock-admin';

export type LockCommandStep = {
  status: LockCommandStatus;
  label: string;
  message: string;
  at: number;
};

export type LockCommand = {
  id: string;
  lockId: string;
  type: LockCommandType;
  scenario: LockCommandScenario;
  authMethod: LockCommandAuthMethod;
  status: LockCommandStatus;
  createdAt: number;
  updatedAt: number;
  commandCode: string;
  steps: LockCommandStep[];
  errorMessage?: string;
};

export type AccessRecordMethod = 'App Remote Unlock' | 'App Lock' | 'PIN' | 'Card' | 'Fingerprint' | 'Face' | 'System';
export type AccessRecordResult = 'success' | 'failed' | 'timeout' | 'blocked';

export type AccessRecord = {
  id: string;
  lockId: string;
  lockName: string;
  roomName: string;
  method: AccessRecordMethod;
  result: AccessRecordResult;
  commandId?: string;
  actorName: string;
  message: string;
  createdAt: number;
};

export type RemoteUnlockCheck = {
  canProceed: boolean;
  checks: Array<{
    key: string;
    label: string;
    passed: boolean;
    message: string;
  }>;
};

import type {SyncState} from './common';

export type AccessRuleStatus = 'active' | 'paused' | 'revoked' | 'expired' | 'draft';
export type AccessFactor = 'pin' | 'card' | 'fingerprint' | 'face' | 'app';
export type CombinationRuleType = 'pin_card' | 'app_fingerprint' | 'face_pin' | 'card_fingerprint';
export type RuleRiskLevel = 'safe' | 'warning' | 'danger';
export type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

export type RuleTimeWindow = {
  daysOfWeek: Weekday[];
  startTime: string;
  endTime: string;
  timezone: string;
  startsAt: number;
  endsAt?: number;
};

export type CombinationRule = {
  id: string;
  type: CombinationRuleType;
  title: string;
  factors: AccessFactor[];
  lockId: string;
  lockName: string;
  roomName: string;
  ownerId: string;
  ownerName: string;
  status: AccessRuleStatus;
  schedule: RuleTimeWindow;
  riskLevel: RuleRiskLevel;
  riskWarnings: string[];
  createdAt: number;
  updatedAt: number;
  syncState: SyncState;
  credentialId?: string;
  lastUsedAt?: number;
};

export type CombinationRuleInput = {
  type: CombinationRuleType;
  lockId: string;
  ownerId: string;
  daysOfWeek: Weekday[];
  startTime: string;
  endTime: string;
  timezone: string;
  startsAt?: number;
  endsAt?: number;
};

export type CombinationSimulationInput = {
  ruleId: string;
  providedFactors: AccessFactor[];
};

export type CombinationSimulationResult = {
  allowed: boolean;
  missingFactors: AccessFactor[];
  message: string;
  recordId?: string;
};

export type NormallyOpenOutsideMode = 'autoLock' | 'manualLock' | 'keepLastState';

export type NormallyOpenSchedule = {
  id: string;
  title: string;
  lockId: string;
  lockName: string;
  roomName: string;
  status: AccessRuleStatus;
  schedule: RuleTimeWindow;
  outsideMode: NormallyOpenOutsideMode;
  riskLevel: RuleRiskLevel;
  riskWarnings: string[];
  createdAt: number;
  updatedAt: number;
  lastAppliedAt?: number;
  syncState: SyncState;
};

export type NormallyOpenInput = {
  title: string;
  lockId: string;
  daysOfWeek: Weekday[];
  startTime: string;
  endTime: string;
  timezone: string;
  outsideMode: NormallyOpenOutsideMode;
  startsAt?: number;
  endsAt?: number;
};

export type ClassScheduleStatus = 'active' | 'conflict' | 'paused' | 'importError';
export type ClassScheduleType = 'class' | 'shift';

export type ClassSchedule = {
  id: string;
  type: ClassScheduleType;
  title: string;
  ownerName: string;
  lockId: string;
  lockName: string;
  roomName: string;
  schedule: RuleTimeWindow;
  status: ClassScheduleStatus;
  conflictReason?: string;
  createdAt: number;
  updatedAt: number;
};

export type ScheduleExceptionType = 'holiday' | 'roomChange' | 'manualClose' | 'extraOpen';

export type ScheduleException = {
  id: string;
  type: ScheduleExceptionType;
  title: string;
  lockId: string;
  lockName: string;
  date: string;
  fromTime?: string;
  toTime?: string;
  note?: string;
  createdAt: number;
};

export type ClassScheduleImportRow = {
  row: number;
  title: string;
  lockId: string;
  roomName: string;
  daysOfWeek: Weekday[];
  startTime: string;
  endTime: string;
  status: 'valid' | 'error';
  message: string;
};

export type AccessRuleSummary = {
  combinationActive: number;
  normallyOpenActive: number;
  classSchedulesActive: number;
  warnings: number;
  conflicts: number;
};

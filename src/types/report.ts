import type {AccessRecordMethod, AccessRecordResult, LockFilterType} from './lock';

export type ReportDateRange = 'today' | 'week' | 'month' | 'all';
export type ReportExportFormat = 'csv' | 'json' | 'pdf';

export type AnalyticsFilter = {
  dateRange: ReportDateRange;
  homeType: LockFilterType | 'all';
  lockId?: string;
  method?: AccessRecordMethod | 'all';
  result?: AccessRecordResult | 'all';
  query?: string;
};

export type AnalyticsSummary = {
  opensToday: number;
  opensWeek: number;
  opensMonth: number;
  failedCount: number;
  alertCount: number;
  lowBatteryCount: number;
  activeCredentialCount: number;
  totalRecords: number;
};

export type MethodBreakdown = {
  method: AccessRecordMethod;
  count: number;
  successCount: number;
  failedCount: number;
  percentage: number;
};

export type UserBreakdown = {
  actorName: string;
  count: number;
  successCount: number;
  failedCount: number;
};

export type RiskLock = {
  lockId: string;
  lockName: string;
  roomName: string;
  homeName: string;
  homeType: LockFilterType;
  riskScore: number;
  failedCount: number;
  alertCount: number;
  lowBattery: boolean;
  activeCredentialCount: number;
  lastActivity: string;
};

export type TimeSeriesPoint = {
  id: string;
  label: string;
  timestamp: number;
  unlockCount: number;
  failedCount: number;
  alertCount: number;
};

export type ReportExport = {
  format: ReportExportFormat;
  fileName: string;
  mimeType: string;
  content: string;
  createdAt: number;
  rowCount: number;
};

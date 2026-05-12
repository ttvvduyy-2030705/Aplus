import type {AplusIconName} from '@/components/base/AplusIcon';
import type {AppRouteName} from '@/navigation/routes';
import type {CredentialType} from './credential';

export type QaCheckStatus = 'pass' | 'warning' | 'fail' | 'manual';

export type QaCheckCategory =
  | 'route'
  | 'permission'
  | 'capability'
  | 'offline'
  | 'realtime'
  | 'backend'
  | 'security'
  | 'release';

export type QaCheckItem = {
  id: string;
  category: QaCheckCategory;
  title: string;
  description: string;
  status: QaCheckStatus;
  evidence: string;
  route?: AppRouteName;
  icon: AplusIconName;
};

export type QaRouteCoverageItem = {
  ui: string;
  name: string;
  route?: AppRouteName;
  batch: string;
  status: QaCheckStatus;
  note: string;
};

export type ReleaseGuardItem = {
  id: string;
  title: string;
  risk: 'critical' | 'high' | 'medium' | 'low';
  status: QaCheckStatus;
  description: string;
  remediation: string;
};

export type DeviceCapabilityMatrixRow = {
  model: string;
  exampleLockId: string;
  exampleLockName: string;
  fingerprint: boolean;
  face: boolean;
  card: boolean;
  nfc: boolean;
  remote: boolean;
  gateway: boolean;
  ota: boolean;
  blockedFlows: CredentialType[];
};

export type QaSummary = {
  total: number;
  pass: number;
  warning: number;
  fail: number;
  manual: number;
  releaseReady: boolean;
  updatedAt: number;
};

export type ReleaseReadinessReport = {
  summary: QaSummary;
  checks: QaCheckItem[];
  routes: QaRouteCoverageItem[];
  guards: ReleaseGuardItem[];
  capabilityMatrix: DeviceCapabilityMatrixRow[];
};

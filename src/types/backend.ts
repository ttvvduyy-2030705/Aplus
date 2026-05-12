export type BackendEnvironment = 'local' | 'privateCloud' | 'cloud';
export type BackendStatus = 'healthy' | 'warning' | 'offline';
export type ApiKeyScope = 'read' | 'write' | 'admin' | 'webhook' | 'pms' | 'hr' | 'miniapp';
export type WebhookEventType = 'lock.event' | 'credential.created' | 'credential.revoked' | 'alert.created' | 'booking.checked_in' | 'booking.checked_out';

export type BackendEndpointGroup = {
  id: string;
  title: string;
  basePath: string;
  methods: string[];
  description: string;
  protected: boolean;
};

export type BackendConfig = {
  id: string;
  environment: BackendEnvironment;
  baseUrl: string;
  serverLabel: string;
  region: string;
  backupEnabled: boolean;
  failoverEnabled: boolean;
  releaseSafe: boolean;
  lastBackupAt?: string;
  updatedAt: number;
};

export type BackendHealthCheck = {
  status: BackendStatus;
  latencyMs: number;
  database: BackendStatus;
  mqtt: BackendStatus;
  websocket: BackendStatus;
  storage: BackendStatus;
  message: string;
  checkedAt: number;
};

export type ApiKeyRecord = {
  id: string;
  name: string;
  maskedKey: string;
  scopes: ApiKeyScope[];
  createdAt: number;
  lastUsedAt?: number;
  revokedAt?: number;
};

export type WebhookSubscription = {
  id: string;
  name: string;
  targetUrl: string;
  events: WebhookEventType[];
  secretMasked: string;
  active: boolean;
  lastDeliveryStatus: 'success' | 'failed' | 'never';
  lastDeliveryAt?: number;
};

export type OpenApiIntegration = {
  id: string;
  name: string;
  type: 'PMS' | 'HR' | 'CampusCard' | 'MiniApp' | 'Webhook';
  status: 'connected' | 'pending' | 'disabled';
  description: string;
  requiredScopes: ApiKeyScope[];
};

export type BackendSchemaTable = {
  name: string;
  purpose: string;
  primaryKey: string;
  relationships: string[];
};

export type BackendAuditLog = {
  id: string;
  actor: string;
  action: string;
  target: string;
  risk: 'low' | 'medium' | 'high';
  at: number;
};

export type DeploymentProfile = {
  id: string;
  title: string;
  description: string;
  checklist: string[];
};

export type BackendIntegrationSummary = {
  config: BackendConfig;
  health: BackendHealthCheck;
  endpointGroups: BackendEndpointGroup[];
  apiKeys: ApiKeyRecord[];
  webhooks: WebhookSubscription[];
  integrations: OpenApiIntegration[];
  schema: BackendSchemaTable[];
  auditLogs: BackendAuditLog[];
  deploymentProfiles: DeploymentProfile[];
};

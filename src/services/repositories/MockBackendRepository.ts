import type {
  ApiKeyRecord,
  ApiKeyScope,
  BackendAuditLog,
  BackendConfig,
  BackendEndpointGroup,
  BackendEnvironment,
  BackendHealthCheck,
  BackendIntegrationSummary,
  BackendSchemaTable,
  DeploymentProfile,
  OpenApiIntegration,
  WebhookEventType,
  WebhookSubscription,
} from '@/types/backend';

const now = Date.now();

let config: BackendConfig = {
  id: 'backend-aplus-demo',
  environment: 'privateCloud',
  baseUrl: 'https://api.aplus-lock.local/v1',
  serverLabel: 'Aplus Lock Private Cloud',
  region: 'VN-SGN-01',
  backupEnabled: true,
  failoverEnabled: true,
  releaseSafe: true,
  lastBackupAt: 'Hôm nay 02:00',
  updatedAt: now - 3600_000,
};

let health: BackendHealthCheck = {
  status: 'healthy',
  latencyMs: 42,
  database: 'healthy',
  mqtt: 'healthy',
  websocket: 'healthy',
  storage: 'healthy',
  message: 'Mock backend sẵn sàng, không dùng localhost trong release.',
  checkedAt: now - 180_000,
};

const endpointGroups: BackendEndpointGroup[] = [
  {id: 'auth', title: 'Auth API', basePath: '/auth', methods: ['POST /login', 'POST /register', 'POST /otp/verify', 'POST /logout'], description: 'Đăng nhập, OTP, refresh session và revoke trusted device.', protected: false},
  {id: 'homes', title: 'Homes / Rooms API', basePath: '/homes', methods: ['GET /homes', 'GET /rooms', 'POST /rooms', 'PATCH /rooms/:id'], description: 'Cơ sở, tầng, phòng và gán khóa theo phạm vi vận hành.', protected: true},
  {id: 'locks', title: 'Locks API', basePath: '/locks', methods: ['GET /locks', 'GET /locks/:id', 'PATCH /locks/:id/settings', 'POST /locks/:id/pairing'], description: 'Danh sách khóa, trạng thái realtime, setting phần cứng và pairing.', protected: true},
  {id: 'credentials', title: 'Credentials API', basePath: '/credentials', methods: ['POST /passwords', 'POST /cards', 'POST /fingerprints', 'POST /faces', 'POST /credentials/:id/revoke'], description: 'Password, card, fingerprint, face, NFC, phone auth và revoke.', protected: true},
  {id: 'commands', title: 'Commands API', basePath: '/commands', methods: ['POST /commands/remote-unlock', 'GET /commands/:id', 'POST /commands/:id/cancel'], description: 'Command lifecycle pending/sent/ack/success/timeout/fail.', protected: true},
  {id: 'records', title: 'Records / Alerts / Reports API', basePath: '/records', methods: ['GET /records', 'GET /alerts', 'PATCH /alerts/:id/resolve', 'GET /reports/summary'], description: 'Audit trail, records, alarm center và analytics export.', protected: true},
  {id: 'openapi', title: 'Open API', basePath: '/open-api', methods: ['POST /webhooks', 'POST /pms/bookings', 'POST /campus-card/sync', 'POST /miniapp/unlock'], description: 'Tích hợp PMS, HR, campus one-card, mini app unlock và webhook.', protected: true},
];

let apiKeys: ApiKeyRecord[] = [
  {id: 'key-pms', name: 'PMS Integration Key', maskedKey: 'ak_live_pms_••••_9F2A', scopes: ['read', 'write', 'pms', 'webhook'], createdAt: now - 8 * 86400_000, lastUsedAt: now - 900_000},
  {id: 'key-hr', name: 'HR / Staff Sync Key', maskedKey: 'ak_live_hr_••••_14C0', scopes: ['read', 'write', 'hr'], createdAt: now - 6 * 86400_000, lastUsedAt: now - 4 * 3600_000},
  {id: 'key-miniapp', name: 'Mini App Unlock Key', maskedKey: 'ak_live_mini_••••_0B77', scopes: ['read', 'miniapp'], createdAt: now - 3 * 86400_000},
];

let webhooks: WebhookSubscription[] = [
  {id: 'wh-alert', name: 'Alert webhook', targetUrl: 'https://ops.example.com/aplus/alerts', events: ['alert.created', 'lock.event'], secretMasked: 'whsec_••••_ALRT', active: true, lastDeliveryStatus: 'success', lastDeliveryAt: now - 600_000},
  {id: 'wh-pms', name: 'PMS booking webhook', targetUrl: 'https://pms.example.com/aplus/events', events: ['booking.checked_in', 'booking.checked_out', 'credential.revoked'], secretMasked: 'whsec_••••_PMS', active: true, lastDeliveryStatus: 'failed', lastDeliveryAt: now - 3600_000},
];

const integrations: OpenApiIntegration[] = [
  {id: 'pms', name: 'PMS / Hotel booking', type: 'PMS', status: 'connected', description: 'Đẩy booking, check-in tạo quyền, check-out revoke credential.', requiredScopes: ['read', 'write', 'pms']},
  {id: 'hr', name: 'HR / Staff worker sync', type: 'HR', status: 'pending', description: 'Đồng bộ nhân sự, ca làm, cleaner/security và revoke khi nghỉ việc.', requiredScopes: ['read', 'write', 'hr']},
  {id: 'campus', name: 'Campus one-card', type: 'CampusCard', status: 'disabled', description: 'Đồng bộ thẻ campus, time card và phân quyền theo lớp/khu vực.', requiredScopes: ['read', 'write']},
  {id: 'miniapp', name: 'Mini app unlock', type: 'MiniApp', status: 'connected', description: 'Mở khóa qua mini app bằng token ngắn hạn, rate limit và audit.', requiredScopes: ['read', 'miniapp']},
];

const schema: BackendSchemaTable[] = [
  {name: 'users', purpose: 'Tài khoản, role và trusted devices', primaryKey: 'id', relationships: ['memberships', 'credentials', 'audit_logs']},
  {name: 'homes / buildings / floors / rooms', purpose: 'Cấu trúc vận hành nhà, khách sạn, văn phòng', primaryKey: 'id', relationships: ['locks', 'bookings', 'memberships']},
  {name: 'locks', purpose: 'Thiết bị khóa, gateway, firmware, capability', primaryKey: 'lock_id', relationships: ['rooms', 'credentials', 'commands', 'records', 'alerts']},
  {name: 'credentials', purpose: 'Password/card/face/fingerprint/NFC/phone/remote', primaryKey: 'credential_id', relationships: ['locks', 'users', 'records']},
  {name: 'commands', purpose: 'Command lifecycle và command result', primaryKey: 'command_id', relationships: ['locks', 'records', 'events']},
  {name: 'records / alerts / tickets', purpose: 'Audit, lịch sử mở khóa, alarm center và xử lý sự cố', primaryKey: 'record_id / alert_id', relationships: ['locks', 'credentials', 'tickets']},
];

let auditLogs: BackendAuditLog[] = [
  {id: 'audit-1', actor: 'Owner', action: 'Rotated PMS API key', target: 'PMS Integration Key', risk: 'medium', at: now - 7200_000},
  {id: 'audit-2', actor: 'System', action: 'Webhook delivery failed', target: 'PMS booking webhook', risk: 'medium', at: now - 3600_000},
  {id: 'audit-3', actor: 'Admin', action: 'Updated baseUrl', target: 'Private Cloud', risk: 'high', at: now - 86400_000},
];

const deploymentProfiles: DeploymentProfile[] = [
  {id: 'local', title: 'Local server', description: 'Dùng cho demo/lab/hardware testing. Không dùng localhost trong release.', checklist: ['LAN IP cố định hoặc DNS nội bộ', 'Backup SQLite/Postgres theo lịch', 'MQTT broker nội bộ', 'Không hardcode secret trong app']},
  {id: 'private-cloud', title: 'Private cloud', description: 'Khuyến nghị cho khách sạn/căn hộ lớn cần dữ liệu riêng.', checklist: ['HTTPS bắt buộc', 'DB backup + restore test', 'Failover endpoint', 'Audit log immutable']},
  {id: 'cloud', title: 'Aplus cloud', description: 'Cloud deployment mock cho open API/webhook và realtime monitor.', checklist: ['Rate limit theo API key', 'Secret rotation', 'Webhook retry/dedupe', 'Monitoring WebSocket/MQTT']},
];

function delay<T>(value: T, ms = 180): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

function buildHealthForConfig(nextConfig: BackendConfig): BackendHealthCheck {
  const isLocalhost = /localhost|127\.0\.0\.1/i.test(nextConfig.baseUrl);
  const status: BackendHealthCheck['status'] = isLocalhost || !nextConfig.releaseSafe ? 'warning' : 'healthy';
  return {
    status,
    latencyMs: nextConfig.environment === 'local' ? 18 : nextConfig.environment === 'privateCloud' ? 42 : 68,
    database: status,
    mqtt: nextConfig.failoverEnabled ? 'healthy' : 'warning',
    websocket: 'healthy',
    storage: nextConfig.backupEnabled ? 'healthy' : 'warning',
    message: isLocalhost ? 'Base URL đang là localhost/127.0.0.1, release guard sẽ chặn.' : status === 'healthy' ? 'Backend mock sẵn sàng cho app/open API.' : 'Cần bật backup/failover và kiểm tra secret trước release.',
    checkedAt: Date.now(),
  };
}

export const MockBackendRepository = {
  async getSummary(): Promise<BackendIntegrationSummary> {
    return delay({
      config,
      health,
      endpointGroups,
      apiKeys,
      webhooks,
      integrations,
      schema,
      auditLogs,
      deploymentProfiles,
    });
  },

  async updateConfig(patch: Partial<BackendConfig>): Promise<BackendConfig> {
    config = {
      ...config,
      ...patch,
      updatedAt: Date.now(),
      releaseSafe: patch.baseUrl ? !/localhost|127\.0\.0\.1/i.test(patch.baseUrl) : patch.releaseSafe ?? config.releaseSafe,
    };
    health = buildHealthForConfig(config);
    auditLogs = [{id: `audit-${Date.now()}`, actor: 'Owner', action: 'Updated backend config', target: config.baseUrl, risk: 'high', at: Date.now()}, ...auditLogs].slice(0, 20);
    return delay(config);
  },

  async runHealthCheck(): Promise<BackendHealthCheck> {
    health = buildHealthForConfig(config);
    return delay(health, 300);
  },

  async rotateApiKey(keyId: string): Promise<ApiKeyRecord[]> {
    apiKeys = apiKeys.map(item => item.id === keyId ? {...item, maskedKey: `${item.maskedKey.split('_••••_')[0]}_••••_${Math.random().toString(16).slice(2, 6).toUpperCase()}`, createdAt: Date.now(), lastUsedAt: undefined} : item);
    auditLogs = [{id: `audit-${Date.now()}`, actor: 'Owner', action: 'Rotated API key', target: keyId, risk: 'high', at: Date.now()}, ...auditLogs].slice(0, 20);
    return delay(apiKeys);
  },

  async createApiKey(name: string, scopes: ApiKeyScope[]): Promise<ApiKeyRecord[]> {
    apiKeys = [{id: `key-${Date.now()}`, name: name || 'New integration key', maskedKey: `ak_live_new_••••_${Math.random().toString(16).slice(2, 6).toUpperCase()}`, scopes, createdAt: Date.now()}, ...apiKeys];
    auditLogs = [{id: `audit-${Date.now()}`, actor: 'Owner', action: 'Created API key', target: name || 'New integration key', risk: 'high', at: Date.now()}, ...auditLogs].slice(0, 20);
    return delay(apiKeys);
  },

  async revokeApiKey(keyId: string): Promise<ApiKeyRecord[]> {
    apiKeys = apiKeys.map(item => item.id === keyId ? {...item, revokedAt: Date.now()} : item);
    auditLogs = [{id: `audit-${Date.now()}`, actor: 'Owner', action: 'Revoked API key', target: keyId, risk: 'high', at: Date.now()}, ...auditLogs].slice(0, 20);
    return delay(apiKeys);
  },

  async toggleWebhook(webhookId: string): Promise<WebhookSubscription[]> {
    webhooks = webhooks.map(item => item.id === webhookId ? {...item, active: !item.active, lastDeliveryAt: Date.now(), lastDeliveryStatus: item.active ? 'never' : 'success'} : item);
    auditLogs = [{id: `audit-${Date.now()}`, actor: 'Owner', action: 'Toggled webhook', target: webhookId, risk: 'medium', at: Date.now()}, ...auditLogs].slice(0, 20);
    return delay(webhooks);
  },

  async addWebhook(name: string, targetUrl: string, events: WebhookEventType[]): Promise<WebhookSubscription[]> {
    webhooks = [{id: `wh-${Date.now()}`, name: name || 'New webhook', targetUrl, events, secretMasked: `whsec_••••_${Math.random().toString(16).slice(2, 6).toUpperCase()}`, active: true, lastDeliveryStatus: 'never'}, ...webhooks];
    auditLogs = [{id: `audit-${Date.now()}`, actor: 'Owner', action: 'Created webhook', target: targetUrl, risk: 'medium', at: Date.now()}, ...auditLogs].slice(0, 20);
    return delay(webhooks);
  },

  async testWebhook(webhookId: string): Promise<WebhookSubscription[]> {
    webhooks = webhooks.map(item => item.id === webhookId ? {...item, lastDeliveryAt: Date.now(), lastDeliveryStatus: item.active ? 'success' : 'failed'} : item);
    auditLogs = [{id: `audit-${Date.now()}`, actor: 'System', action: 'Webhook test delivery', target: webhookId, risk: 'low', at: Date.now()}, ...auditLogs].slice(0, 20);
    return delay(webhooks);
  },
};

import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {BaseScreen} from '@/components/base/BaseScreen';
import {StatusChip} from '@/components/base/StatusChip';
import {OfflineBanner} from '@/components/feedback/OfflineBanner';
import {useLanguage} from '@/i18n/LanguageContext';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {MockBackendRepository} from '@/services/repositories/MockBackendRepository';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {
  ApiKeyRecord,
  ApiKeyScope,
  BackendConfig,
  BackendEnvironment,
  BackendHealthCheck,
  BackendIntegrationSummary,
  WebhookEventType,
  WebhookSubscription,
} from '@/types/backend';

type SectionKey = 'server' | 'api' | 'openapi' | 'security' | 'docs';

type Copy = {
  title: string;
  subtitle: string;
  server: string;
  api: string;
  openapi: string;
  security: string;
  docs: string;
  runHealth: string;
  saveServer: string;
  createKey: string;
  addWebhook: string;
  test: string;
  rotate: string;
  revoke: string;
  active: string;
  disabled: string;
  releaseGuard: string;
  noLocalhost: string;
  backup: string;
  failover: string;
  apiSpec: string;
  integrationGuide: string;
  schema: string;
  deployment: string;
};

const copy: Record<'vi' | 'en', Copy> = {
  vi: {
    title: 'Backend & tích hợp',
    subtitle: 'UI-64/65/50 · API, local/cloud, Open API, webhook và release guard',
    server: 'Server Local/Cloud',
    api: 'API nội bộ',
    openapi: 'Open API',
    security: 'Bảo mật',
    docs: 'Tài liệu',
    runHealth: 'Kiểm tra server',
    saveServer: 'Lưu cấu hình',
    createKey: 'Tạo API key',
    addWebhook: 'Thêm webhook',
    test: 'Test',
    rotate: 'Rotate',
    revoke: 'Revoke',
    active: 'Đang bật',
    disabled: 'Đã tắt',
    releaseGuard: 'Release guard',
    noLocalhost: 'Không dùng localhost khi release',
    backup: 'Backup',
    failover: 'Failover',
    apiSpec: 'API_SPEC.md',
    integrationGuide: 'INTEGRATION_GUIDE.md',
    schema: 'BACKEND_SCHEMA.md',
    deployment: 'LOCAL_CLOUD_DEPLOYMENT.md',
  },
  en: {
    title: 'Backend & integrations',
    subtitle: 'UI-64/65/50 · API, local/cloud, Open API, webhooks and release guard',
    server: 'Local/Cloud server',
    api: 'Internal API',
    openapi: 'Open API',
    security: 'Security',
    docs: 'Docs',
    runHealth: 'Run health check',
    saveServer: 'Save server config',
    createKey: 'Create API key',
    addWebhook: 'Add webhook',
    test: 'Test',
    rotate: 'Rotate',
    revoke: 'Revoke',
    active: 'Active',
    disabled: 'Disabled',
    releaseGuard: 'Release guard',
    noLocalhost: 'No localhost in release',
    backup: 'Backup',
    failover: 'Failover',
    apiSpec: 'API_SPEC.md',
    integrationGuide: 'INTEGRATION_GUIDE.md',
    schema: 'BACKEND_SCHEMA.md',
    deployment: 'LOCAL_CLOUD_DEPLOYMENT.md',
  },
};

const sectionKeys: SectionKey[] = ['server', 'api', 'openapi', 'security', 'docs'];
const environmentOptions: BackendEnvironment[] = ['local', 'privateCloud', 'cloud'];
const scopeOptions: ApiKeyScope[] = ['read', 'write', 'admin', 'webhook', 'pms', 'hr', 'miniapp'];
const webhookEvents: WebhookEventType[] = ['lock.event', 'credential.created', 'credential.revoked', 'alert.created', 'booking.checked_in', 'booking.checked_out'];

function environmentLabel(value: BackendEnvironment, language: 'vi' | 'en') {
  const map: Record<BackendEnvironment, {vi: string; en: string}> = {
    local: {vi: 'Local server', en: 'Local server'},
    privateCloud: {vi: 'Private cloud', en: 'Private cloud'},
    cloud: {vi: 'Aplus cloud', en: 'Aplus cloud'},
  };
  return map[value][language];
}

function statusTone(status?: BackendHealthCheck['status']): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (status === 'healthy') {
    return 'success';
  }
  if (status === 'warning') {
    return 'warning';
  }
  if (status === 'offline') {
    return 'danger';
  }
  return 'muted';
}

function timeLabel(value?: number) {
  if (!value) {
    return 'Never';
  }
  const diff = Math.max(0, Date.now() - value);
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.round(hours / 24)}d ago`;
}

function SectionTab({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={[styles.sectionTab, active ? styles.sectionTabActive : null]}>
      <AplusText variant="caption" color={active ? theme.colors.text : theme.colors.textMuted} style={styles.sectionTabText}>{label}</AplusText>
    </Pressable>
  );
}

function EnvironmentPicker({value, onChange, language}: {value: BackendEnvironment; onChange: (value: BackendEnvironment) => void; language: 'vi' | 'en'}) {
  return (
    <View style={styles.rowWrap}>
      {environmentOptions.map(option => (
        <Pressable key={option} onPress={() => onChange(option)} style={[styles.choiceChip, value === option ? styles.choiceChipActive : null]}>
          <AplusText variant="caption" color={value === option ? theme.colors.text : theme.colors.textMuted}>{environmentLabel(option, language)}</AplusText>
        </Pressable>
      ))}
    </View>
  );
}

function ScopePicker({selected, onToggle}: {selected: ApiKeyScope[]; onToggle: (scope: ApiKeyScope) => void}) {
  return (
    <View style={styles.rowWrap}>
      {scopeOptions.map(scope => {
        const active = selected.includes(scope);
        return (
          <Pressable key={scope} onPress={() => onToggle(scope)} style={[styles.choiceChip, active ? styles.choiceChipActive : null]}>
            <AplusText variant="caption" color={active ? theme.colors.text : theme.colors.textMuted}>{scope}</AplusText>
          </Pressable>
        );
      })}
    </View>
  );
}

function ServerSection({summary, draft, setDraft, onSave, onHealth, strings, language, saving}: {
  summary: BackendIntegrationSummary;
  draft: BackendConfig;
  setDraft: (next: BackendConfig) => void;
  onSave: () => void;
  onHealth: () => void;
  strings: Copy;
  language: 'vi' | 'en';
  saving: boolean;
}) {
  const health = summary.health;
  const releaseBlocked = /localhost|127\.0\.0\.1/i.test(draft.baseUrl) || !draft.releaseSafe;
  return (
    <View style={styles.sectionStack}>
      <AplusCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <AplusIcon name="gateway" size={38} color={theme.colors.primary} boxed boxSize={66} />
          <View style={styles.flex}>
            <AplusText variant="title">{strings.server}</AplusText>
            <AplusText variant="caption">{language === 'vi' ? 'Đổi baseUrl/local/private cloud mà không sửa UI. Release guard chặn localhost/API key lộ.' : 'Switch baseUrl/local/private cloud without changing UI. Release guard blocks localhost and exposed keys.'}</AplusText>
          </View>
        </View>
        <View style={styles.rowWrap}>
          <StatusChip label={health.status.toUpperCase()} tone={statusTone(health.status)} />
          <StatusChip label={`${health.latencyMs}ms`} tone="info" />
          <StatusChip label={releaseBlocked ? 'Release blocked' : strings.noLocalhost} tone={releaseBlocked ? 'danger' : 'success'} />
        </View>
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">{language === 'vi' ? 'Cấu hình server' : 'Server configuration'}</AplusText>
        <EnvironmentPicker value={draft.environment} onChange={environment => setDraft({...draft, environment})} language={language} />
        <AplusTextField label="Base URL" value={draft.baseUrl} onChangeText={baseUrl => setDraft({...draft, baseUrl})} autoCapitalize="none" leftIcon="gateway" />
        <AplusTextField label={language === 'vi' ? 'Tên server' : 'Server label'} value={draft.serverLabel} onChangeText={serverLabel => setDraft({...draft, serverLabel})} leftIcon="settings" />
        <AplusTextField label="Region" value={draft.region} onChangeText={region => setDraft({...draft, region})} leftIcon="signal" />
        <View style={styles.rowWrap}>
          <AplusButton title={draft.backupEnabled ? `${strings.backup}: ON` : `${strings.backup}: OFF`} variant={draft.backupEnabled ? 'secondary' : 'ghost'} leftIcon="sync" onPress={() => setDraft({...draft, backupEnabled: !draft.backupEnabled})} />
          <AplusButton title={draft.failoverEnabled ? `${strings.failover}: ON` : `${strings.failover}: OFF`} variant={draft.failoverEnabled ? 'secondary' : 'ghost'} leftIcon="shield" onPress={() => setDraft({...draft, failoverEnabled: !draft.failoverEnabled})} />
        </View>
        <View style={styles.actionsRow}>
          <AplusButton title={strings.saveServer} leftIcon="check" onPress={onSave} loading={saving} />
          <AplusButton title={strings.runHealth} leftIcon="refresh" variant="secondary" onPress={onHealth} loading={saving} />
        </View>
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">UI-65 · Realtime/MQTT status monitor</AplusText>
        <View style={styles.healthGrid}>
          <HealthItem label="Database" status={health.database} />
          <HealthItem label="MQTT" status={health.mqtt} />
          <HealthItem label="WebSocket" status={health.websocket} />
          <HealthItem label="Storage" status={health.storage} />
        </View>
        <AplusText variant="caption">{health.message}</AplusText>
      </AplusCard>
    </View>
  );
}

function HealthItem({label, status}: {label: string; status: BackendHealthCheck['status']}) {
  return (
    <View style={styles.healthItem}>
      <AplusText variant="caption">{label}</AplusText>
      <StatusChip label={status} tone={statusTone(status)} />
    </View>
  );
}

function ApiSection({summary, onRotate, onRevoke, onCreate, strings, language, saving}: {
  summary: BackendIntegrationSummary;
  onRotate: (keyId: string) => void;
  onRevoke: (keyId: string) => void;
  onCreate: (name: string, scopes: ApiKeyScope[]) => void;
  strings: Copy;
  language: 'vi' | 'en';
  saving: boolean;
}) {
  const [newKeyName, setNewKeyName] = useState('Partner integration');
  const [selectedScopes, setSelectedScopes] = useState<ApiKeyScope[]>(['read', 'write', 'webhook']);
  const toggleScope = (scope: ApiKeyScope) => setSelectedScopes(prev => prev.includes(scope) ? prev.filter(item => item !== scope) : [...prev, scope]);

  return (
    <View style={styles.sectionStack}>
      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">{strings.api}</AplusText>
        <AplusText variant="caption">{language === 'vi' ? 'API cho auth, homes, rooms, locks, credentials, records, alerts, reports và commands.' : 'APIs for auth, homes, rooms, locks, credentials, records, alerts, reports and commands.'}</AplusText>
        {summary.endpointGroups.map(group => (
          <View key={group.id} style={styles.endpointRow}>
            <View style={styles.flex}>
              <AplusText variant="body" style={styles.bold}>{group.title}</AplusText>
              <AplusText variant="caption">{group.basePath} · {group.description}</AplusText>
              <AplusText variant="caption" numberOfLines={2}>{group.methods.join('  ·  ')}</AplusText>
            </View>
            <StatusChip label={group.protected ? 'JWT/API key' : 'public'} tone={group.protected ? 'success' : 'info'} />
          </View>
        ))}
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">API keys</AplusText>
        <AplusTextField label={language === 'vi' ? 'Tên key mới' : 'New key name'} value={newKeyName} onChangeText={setNewKeyName} leftIcon="key" />
        <ScopePicker selected={selectedScopes} onToggle={toggleScope} />
        <AplusButton title={strings.createKey} leftIcon="plus" onPress={() => onCreate(newKeyName, selectedScopes)} disabled={!selectedScopes.length} loading={saving} />
        {summary.apiKeys.map(key => <ApiKeyCard key={key.id} item={key} onRotate={onRotate} onRevoke={onRevoke} strings={strings} saving={saving} />)}
      </AplusCard>
    </View>
  );
}

function ApiKeyCard({item, onRotate, onRevoke, strings, saving}: {item: ApiKeyRecord; onRotate: (keyId: string) => void; onRevoke: (keyId: string) => void; strings: Copy; saving: boolean}) {
  const revoked = Boolean(item.revokedAt);
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <AplusIcon name="key" size={22} color={revoked ? theme.colors.textMuted : theme.colors.primary} boxed />
        <View style={styles.flex}>
          <AplusText variant="body" style={styles.bold}>{item.name}</AplusText>
          <AplusText variant="caption">{item.maskedKey} · {item.scopes.join(', ')}</AplusText>
          <AplusText variant="caption">Last used: {timeLabel(item.lastUsedAt)}</AplusText>
        </View>
        <StatusChip label={revoked ? 'revoked' : 'active'} tone={revoked ? 'danger' : 'success'} />
      </View>
      <View style={styles.actionsRow}>
        <AplusButton title={strings.rotate} variant="secondary" leftIcon="refresh" onPress={() => onRotate(item.id)} disabled={revoked || saving} />
        <AplusButton title={strings.revoke} variant="danger" leftIcon="revoked" onPress={() => onRevoke(item.id)} disabled={revoked || saving} />
      </View>
    </View>
  );
}

function OpenApiSection({summary, onToggleWebhook, onAddWebhook, onTestWebhook, strings, language, saving}: {
  summary: BackendIntegrationSummary;
  onToggleWebhook: (webhookId: string) => void;
  onAddWebhook: (name: string, url: string, events: WebhookEventType[]) => void;
  onTestWebhook: (webhookId: string) => void;
  strings: Copy;
  language: 'vi' | 'en';
  saving: boolean;
}) {
  const [name, setName] = useState('Partner webhook');
  const [url, setUrl] = useState('https://partner.example.com/aplus/events');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEventType[]>(['lock.event', 'alert.created']);
  const toggleEvent = (event: WebhookEventType) => setSelectedEvents(prev => prev.includes(event) ? prev.filter(item => item !== event) : [...prev, event]);

  return (
    <View style={styles.sectionStack}>
      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">{strings.openapi}</AplusText>
        <AplusText variant="caption">{language === 'vi' ? 'Tích hợp PMS, HR/student-worker, campus one-card, mini app unlock, webhook và API key.' : 'Integrations for PMS, HR/student-worker, campus one-card, mini app unlock, webhooks and API keys.'}</AplusText>
        {summary.integrations.map(integration => (
          <View key={integration.id} style={styles.endpointRow}>
            <AplusIcon name={integration.type === 'PMS' ? 'hotel' : integration.type === 'MiniApp' ? 'phone' : 'gateway'} size={22} color={theme.colors.primary} boxed />
            <View style={styles.flex}>
              <AplusText variant="body" style={styles.bold}>{integration.name}</AplusText>
              <AplusText variant="caption">{integration.description}</AplusText>
              <AplusText variant="caption">Scopes: {integration.requiredScopes.join(', ')}</AplusText>
            </View>
            <StatusChip label={integration.status} tone={integration.status === 'connected' ? 'success' : integration.status === 'pending' ? 'warning' : 'muted'} />
          </View>
        ))}
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">Webhooks</AplusText>
        <AplusTextField label="Name" value={name} onChangeText={setName} leftIcon="bell" />
        <AplusTextField label="Target URL" value={url} onChangeText={setUrl} autoCapitalize="none" leftIcon="gateway" />
        <View style={styles.rowWrap}>
          {webhookEvents.map(event => {
            const active = selectedEvents.includes(event);
            return (
              <Pressable key={event} onPress={() => toggleEvent(event)} style={[styles.choiceChip, active ? styles.choiceChipActive : null]}>
                <AplusText variant="caption" color={active ? theme.colors.text : theme.colors.textMuted}>{event}</AplusText>
              </Pressable>
            );
          })}
        </View>
        <AplusButton title={strings.addWebhook} leftIcon="plus" onPress={() => onAddWebhook(name, url, selectedEvents)} disabled={!url || !selectedEvents.length} loading={saving} />
        {summary.webhooks.map(webhook => <WebhookCard key={webhook.id} item={webhook} onToggle={onToggleWebhook} onTest={onTestWebhook} strings={strings} saving={saving} />)}
      </AplusCard>
    </View>
  );
}

function WebhookCard({item, onToggle, onTest, strings, saving}: {item: WebhookSubscription; onToggle: (id: string) => void; onTest: (id: string) => void; strings: Copy; saving: boolean}) {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <AplusIcon name="bell" size={22} color={item.active ? theme.colors.primary : theme.colors.textMuted} boxed />
        <View style={styles.flex}>
          <AplusText variant="body" style={styles.bold}>{item.name}</AplusText>
          <AplusText variant="caption">{item.targetUrl}</AplusText>
          <AplusText variant="caption">{item.events.join(', ')} · {item.secretMasked}</AplusText>
        </View>
        <StatusChip label={item.active ? strings.active : strings.disabled} tone={item.active ? 'success' : 'muted'} />
      </View>
      <View style={styles.actionsRow}>
        <AplusButton title={strings.test} variant="secondary" leftIcon="refresh" onPress={() => onTest(item.id)} disabled={saving} />
        <AplusButton title={item.active ? strings.disabled : strings.active} variant={item.active ? 'ghost' : 'secondary'} leftIcon="check" onPress={() => onToggle(item.id)} disabled={saving} />
        <StatusChip label={item.lastDeliveryStatus} tone={item.lastDeliveryStatus === 'success' ? 'success' : item.lastDeliveryStatus === 'failed' ? 'danger' : 'muted'} />
      </View>
    </View>
  );
}

function SecuritySection({summary, strings, language}: {summary: BackendIntegrationSummary; strings: Copy; language: 'vi' | 'en'}) {
  return (
    <View style={styles.sectionStack}>
      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">{strings.releaseGuard}</AplusText>
        <View style={styles.guardGrid}>
          <GuardItem label={strings.noLocalhost} passed={!/localhost|127\.0\.0\.1/i.test(summary.config.baseUrl)} />
          <GuardItem label="API key not exposed" passed={summary.apiKeys.every(key => key.maskedKey.includes('••••'))} />
          <GuardItem label="Audit log" passed={summary.auditLogs.length > 0} />
          <GuardItem label="Rate limit / secret rotation" passed />
          <GuardItem label={strings.backup} passed={summary.config.backupEnabled} />
          <GuardItem label={strings.failover} passed={summary.config.failoverEnabled} />
        </View>
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">{language === 'vi' ? 'Audit log bảo mật' : 'Security audit log'}</AplusText>
        {summary.auditLogs.map(log => (
          <View key={log.id} style={styles.endpointRow}>
            <AplusIcon name="shield" size={22} color={log.risk === 'high' ? theme.colors.danger : log.risk === 'medium' ? theme.colors.warning : theme.colors.success} boxed />
            <View style={styles.flex}>
              <AplusText variant="body" style={styles.bold}>{log.action}</AplusText>
              <AplusText variant="caption">{log.actor} · {log.target} · {timeLabel(log.at)}</AplusText>
            </View>
            <StatusChip label={log.risk} tone={log.risk === 'high' ? 'danger' : log.risk === 'medium' ? 'warning' : 'success'} />
          </View>
        ))}
      </AplusCard>
    </View>
  );
}

function GuardItem({label, passed}: {label: string; passed: boolean}) {
  return (
    <View style={styles.guardItem}>
      <AplusIcon name={passed ? 'check' : 'close'} size={18} color={passed ? theme.colors.success : theme.colors.danger} />
      <AplusText variant="caption" color={passed ? theme.colors.success : theme.colors.danger}>{label}</AplusText>
    </View>
  );
}

function DocsSection({summary, strings, language}: {summary: BackendIntegrationSummary; strings: Copy; language: 'vi' | 'en'}) {
  return (
    <View style={styles.sectionStack}>
      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">{language === 'vi' ? 'Đầu ra tài liệu Batch 23' : 'Batch 23 documentation outputs'}</AplusText>
        {[strings.apiSpec, strings.integrationGuide, strings.schema, strings.deployment].map(item => (
          <View key={item} style={styles.docRow}>
            <AplusIcon name="command" size={20} color={theme.colors.primary} boxed />
            <View style={styles.flex}>
              <AplusText variant="body" style={styles.bold}>{item}</AplusText>
              <AplusText variant="caption">docs/backend/{item}</AplusText>
            </View>
            <StatusChip label="included" tone="success" />
          </View>
        ))}
      </AplusCard>
      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">Backend schema</AplusText>
        {summary.schema.map(table => (
          <View key={table.name} style={styles.endpointRow}>
            <AplusIcon name="matrix" size={22} color={theme.colors.primary} boxed />
            <View style={styles.flex}>
              <AplusText variant="body" style={styles.bold}>{table.name}</AplusText>
              <AplusText variant="caption">PK: {table.primaryKey}</AplusText>
              <AplusText variant="caption">{table.purpose}</AplusText>
              <AplusText variant="caption">Relations: {table.relationships.join(', ')}</AplusText>
            </View>
          </View>
        ))}
      </AplusCard>
      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">Local / Cloud deployment</AplusText>
        {summary.deploymentProfiles.map(profile => (
          <View key={profile.id} style={styles.itemCard}>
            <AplusText variant="body" style={styles.bold}>{profile.title}</AplusText>
            <AplusText variant="caption">{profile.description}</AplusText>
            {profile.checklist.map(item => <AplusText key={item} variant="caption">• {item}</AplusText>)}
          </View>
        ))}
      </AplusCard>
    </View>
  );
}

export function BackendIntegrationScreen() {
  const navigation = useAplusNavigation();
  const {language} = useLanguage();
  const strings = copy[language];
  const {isOffline} = useAppState();
  const [summary, setSummary] = useState<BackendIntegrationSummary>();
  const [draft, setDraft] = useState<BackendConfig>();
  const [section, setSection] = useState<SectionKey>('server');
  const [saving, setSaving] = useState(false);

  const loadSummary = async () => {
    const data = await MockBackendRepository.getSummary();
    setSummary(data);
    setDraft(data.config);
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const counts = useMemo(() => ({
    endpoints: summary?.endpointGroups.length ?? 0,
    keys: summary?.apiKeys.filter(key => !key.revokedAt).length ?? 0,
    webhooks: summary?.webhooks.filter(webhook => webhook.active).length ?? 0,
  }), [summary]);

  const refreshAll = async () => {
    setSaving(true);
    await loadSummary();
    setSaving(false);
  };

  const saveConfig = async () => {
    if (!draft) {
      return;
    }
    setSaving(true);
    await MockBackendRepository.updateConfig(draft);
    await loadSummary();
    setSaving(false);
  };

  const runHealth = async () => {
    setSaving(true);
    await MockBackendRepository.runHealthCheck();
    await loadSummary();
    setSaving(false);
  };

  const rotateKey = async (keyId: string) => {
    setSaving(true);
    await MockBackendRepository.rotateApiKey(keyId);
    await loadSummary();
    setSaving(false);
  };

  const revokeKey = async (keyId: string) => {
    setSaving(true);
    await MockBackendRepository.revokeApiKey(keyId);
    await loadSummary();
    setSaving(false);
  };

  const createKey = async (name: string, scopes: ApiKeyScope[]) => {
    setSaving(true);
    await MockBackendRepository.createApiKey(name, scopes);
    await loadSummary();
    setSaving(false);
  };

  const toggleWebhook = async (webhookId: string) => {
    setSaving(true);
    await MockBackendRepository.toggleWebhook(webhookId);
    await loadSummary();
    setSaving(false);
  };

  const addWebhook = async (name: string, url: string, events: WebhookEventType[]) => {
    setSaving(true);
    await MockBackendRepository.addWebhook(name, url, events);
    await loadSummary();
    setSaving(false);
  };

  const testWebhook = async (webhookId: string) => {
    setSaving(true);
    await MockBackendRepository.testWebhook(webhookId);
    await loadSummary();
    setSaving(false);
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={strings.title} subtitle={strings.subtitle} canGoBack={navigation.canGoBack} onBack={navigation.goBack} showLogo />
      <OfflineBanner visible={isOffline} />

      <AplusCard style={styles.summaryCard}>
        <View style={styles.heroRow}>
          <AplusIcon name="gateway" size={40} color={theme.colors.primary} boxed boxSize={72} />
          <View style={styles.flex}>
            <AplusText variant="hero">Batch 23</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>{language === 'vi' ? 'Backend API, database, local/cloud server, Open API và tích hợp ngoài.' : 'Backend API, database, local/cloud server, Open API and external integrations.'}</AplusText>
          </View>
        </View>
        <View style={styles.rowWrap}>
          <StatusChip label={`${counts.endpoints} API groups`} tone="info" />
          <StatusChip label={`${counts.keys} active keys`} tone="success" />
          <StatusChip label={`${counts.webhooks} webhooks`} tone="info" />
          <StatusChip label={summary?.health.status ?? 'loading'} tone={statusTone(summary?.health.status)} />
        </View>
        <AplusButton title={language === 'vi' ? 'Tải lại mock backend' : 'Reload mock backend'} leftIcon="refresh" variant="secondary" onPress={refreshAll} loading={saving && !summary} />
      </AplusCard>

      <View style={styles.sectionTabs}>
        {sectionKeys.map(key => <SectionTab key={key} label={strings[key]} active={section === key} onPress={() => setSection(key)} />)}
      </View>

      {summary && draft ? (
        <>
          {section === 'server' ? <ServerSection summary={summary} draft={draft} setDraft={setDraft} onSave={saveConfig} onHealth={runHealth} strings={strings} language={language} saving={saving} /> : null}
          {section === 'api' ? <ApiSection summary={summary} onRotate={rotateKey} onRevoke={revokeKey} onCreate={createKey} strings={strings} language={language} saving={saving} /> : null}
          {section === 'openapi' ? <OpenApiSection summary={summary} onToggleWebhook={toggleWebhook} onAddWebhook={addWebhook} onTestWebhook={testWebhook} strings={strings} language={language} saving={saving} /> : null}
          {section === 'security' ? <SecuritySection summary={summary} strings={strings} language={language} /> : null}
          {section === 'docs' ? <DocsSection summary={summary} strings={strings} language={language} /> : null}
        </>
      ) : (
        <AplusCard style={styles.cardGap}>
          <AplusText variant="subtitle">Loading backend mock...</AplusText>
        </AplusCard>
      )}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  flex: {
    flex: 1,
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
  summaryCard: {
    gap: theme.spacing.lg,
    backgroundColor: '#101014',
    borderColor: theme.colors.borderStrong,
  },
  heroCard: {
    gap: theme.spacing.lg,
    backgroundColor: '#101014',
    borderColor: theme.colors.borderStrong,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  sectionTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  sectionTab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTabActive: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  sectionTabText: {
    fontWeight: theme.typography.weight.bold,
  },
  sectionStack: {
    gap: theme.spacing.lg,
  },
  cardGap: {
    gap: theme.spacing.md,
  },
  choiceChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  choiceChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  healthItem: {
    flexBasis: '46%',
    flexGrow: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  endpointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemCard: {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  guardGrid: {
    gap: theme.spacing.sm,
  },
  guardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
});

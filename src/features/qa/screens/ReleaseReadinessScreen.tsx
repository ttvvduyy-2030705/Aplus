import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {BaseScreen} from '@/components/base/BaseScreen';
import {StatusChip} from '@/components/base/StatusChip';
import {useLanguage} from '@/i18n/LanguageContext';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {MockQaRepository} from '@/services/repositories/MockQaRepository';
import {theme} from '@/theme/theme';
import type {AppRouteName} from '@/navigation/routes';
import type {DeviceCapabilityMatrixRow, QaCheckItem, QaCheckStatus, ReleaseGuardItem, ReleaseReadinessReport} from '@/types/qa';

type TabKey = 'checks' | 'routes' | 'guards' | 'capability';

type LocaleText = {
  title: string;
  subtitle: string;
  rerun: string;
  checks: string;
  routes: string;
  guards: string;
  capability: string;
  releaseReady: string;
  notReady: string;
  pass: string;
  warning: string;
  fail: string;
  manual: string;
  updated: string;
  evidence: string;
  open: string;
  mappedRoutes: string;
  blockedFlows: string;
  noBlockedFlows: string;
  remediation: string;
  requiredDocs: string;
};

const copy: Record<'vi' | 'en', LocaleText> = {
  vi: {
    title: 'QA & sẵn sàng bàn giao',
    subtitle: 'Batch 26 · test UI-00 đến UI-70, permission, capability, offline, realtime, release guard',
    rerun: 'Chạy lại kiểm tra',
    checks: 'Checklist',
    routes: 'Route/UI',
    guards: 'Release guard',
    capability: 'Capability',
    releaseReady: 'Có thể bàn giao mock',
    notReady: 'Chưa sẵn sàng',
    pass: 'Pass',
    warning: 'Cảnh báo',
    fail: 'Fail',
    manual: 'Cần test tay',
    updated: 'Cập nhật',
    evidence: 'Bằng chứng',
    open: 'Mở màn',
    mappedRoutes: 'UI đã map',
    blockedFlows: 'Flow bị chặn',
    noBlockedFlows: 'Không có flow bị chặn',
    remediation: 'Cách xử lý',
    requiredDocs: 'Tài liệu bắt buộc đã thêm: README_TESTING.md, QA_CHECKLIST.md, RELEASE_GUARD.md, DEVICE_CAPABILITY_MATRIX.md',
  },
  en: {
    title: 'QA & release readiness',
    subtitle: 'Batch 26 · test UI-00 to UI-70, permission, capability, offline, realtime, release guard',
    rerun: 'Run checks again',
    checks: 'Checklist',
    routes: 'Routes/UI',
    guards: 'Release guard',
    capability: 'Capability',
    releaseReady: 'Mock handoff ready',
    notReady: 'Not ready',
    pass: 'Pass',
    warning: 'Warning',
    fail: 'Fail',
    manual: 'Manual test',
    updated: 'Updated',
    evidence: 'Evidence',
    open: 'Open screen',
    mappedRoutes: 'Mapped UI',
    blockedFlows: 'Blocked flows',
    noBlockedFlows: 'No blocked flows',
    remediation: 'Remediation',
    requiredDocs: 'Required docs added: README_TESTING.md, QA_CHECKLIST.md, RELEASE_GUARD.md, DEVICE_CAPABILITY_MATRIX.md',
  },
};

function statusTone(status: QaCheckStatus): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (status === 'pass') return 'success';
  if (status === 'warning') return 'warning';
  if (status === 'fail') return 'danger';
  if (status === 'manual') return 'info';
  return 'muted';
}

function statusLabel(status: QaCheckStatus, strings: LocaleText) {
  if (status === 'pass') return strings.pass;
  if (status === 'warning') return strings.warning;
  if (status === 'fail') return strings.fail;
  return strings.manual;
}

function TabButton({active, title, onPress}: {active: boolean; title: string; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active ? styles.tabButtonActive : null]}>
      <AplusText variant="caption" color={active ? theme.colors.text : theme.colors.textMuted} style={active ? styles.bold : undefined}>{title}</AplusText>
    </Pressable>
  );
}

function CheckCard({item, strings, onOpen}: {item: QaCheckItem; strings: LocaleText; onOpen: (route: AppRouteName) => void}) {
  return (
    <AplusCard style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <AplusIcon name={item.icon} size={22} color={theme.colors.primary} boxed />
        <View style={styles.itemTitleBlock}>
          <AplusText variant="body" style={styles.bold}>{item.title}</AplusText>
          <AplusText variant="caption">{item.description}</AplusText>
        </View>
        <StatusChip label={statusLabel(item.status, strings)} tone={statusTone(item.status)} />
      </View>
      <AplusText variant="caption" color={theme.colors.textMuted}>{strings.evidence}: {item.evidence}</AplusText>
      {item.route ? <AplusButton title={strings.open} variant="ghost" rightIcon="chevron" onPress={() => onOpen(item.route as AppRouteName)} /> : null}
    </AplusCard>
  );
}

function GuardCard({item, strings}: {item: ReleaseGuardItem; strings: LocaleText}) {
  return (
    <AplusCard style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <AplusIcon name="shield" size={22} color={item.risk === 'critical' ? theme.colors.danger : theme.colors.primary} boxed />
        <View style={styles.itemTitleBlock}>
          <AplusText variant="body" style={styles.bold}>{item.title}</AplusText>
          <AplusText variant="caption">{item.description}</AplusText>
        </View>
        <StatusChip label={statusLabel(item.status, strings)} tone={statusTone(item.status)} />
      </View>
      <StatusChip label={item.risk.toUpperCase()} tone={item.risk === 'critical' || item.risk === 'high' ? 'danger' : 'warning'} />
      <AplusText variant="caption" color={theme.colors.textMuted}>{strings.remediation}: {item.remediation}</AplusText>
    </AplusCard>
  );
}

function CapabilityCard({item, strings}: {item: DeviceCapabilityMatrixRow; strings: LocaleText}) {
  const flags = [
    ['Fingerprint', item.fingerprint],
    ['Face', item.face],
    ['Card', item.card],
    ['NFC', item.nfc],
    ['Remote', item.remote],
    ['Gateway', item.gateway],
    ['OTA', item.ota],
  ] as const;
  return (
    <AplusCard style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <AplusIcon name="capability" size={22} color={theme.colors.primary} boxed />
        <View style={styles.itemTitleBlock}>
          <AplusText variant="body" style={styles.bold}>{item.model}</AplusText>
          <AplusText variant="caption">{item.exampleLockName} · {item.exampleLockId}</AplusText>
        </View>
      </View>
      <View style={styles.wrapRow}>
        {flags.map(([label, enabled]) => <StatusChip key={label} label={label} tone={enabled ? 'success' : 'muted'} />)}
      </View>
      <AplusText variant="caption" color={theme.colors.textMuted}>
        {strings.blockedFlows}: {item.blockedFlows.length ? item.blockedFlows.join(', ') : strings.noBlockedFlows}
      </AplusText>
    </AplusCard>
  );
}

export function ReleaseReadinessScreen() {
  const navigation = useAplusNavigation();
  const {language} = useLanguage();
  const strings = copy[language === 'en' ? 'en' : 'vi'];
  const [activeTab, setActiveTab] = useState<TabKey>('checks');
  const [report, setReport] = useState<ReleaseReadinessReport>();
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await MockQaRepository.getReleaseReadinessReport();
      setReport(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const statusCards = useMemo(() => {
    if (!report) return [];
    return [
      {label: strings.pass, value: report.summary.pass, tone: 'success' as const},
      {label: strings.warning, value: report.summary.warning, tone: 'warning' as const},
      {label: strings.fail, value: report.summary.fail, tone: 'danger' as const},
      {label: strings.manual, value: report.summary.manual, tone: 'info' as const},
    ];
  }, [report, strings.fail, strings.manual, strings.pass, strings.warning]);

  const openRoute = (route: AppRouteName) => {
    if (route === 'ReleaseReadiness') {
      return;
    }
    if (route === 'CommandLifecycle') {
      navigation.navigate('Activity');
      return;
    }
    if (route === 'ReportDrilldown') {
      navigation.navigate('Reports');
      return;
    }
    if (route === 'RecipientPicker') {
      navigation.navigate('CredentialHub', undefined);
      return;
    }
    if (route === 'PasswordDetail' || route === 'PasswordSchedule') {
      navigation.navigate('PasswordManager', undefined);
      return;
    }
    if (route === 'RoomDetail' || route === 'RoomEdit') {
      navigation.navigate('RoomManagement');
      return;
    }
    if (route === 'AlertDetail' || route === 'TicketCreate') {
      navigation.navigate('AlarmCenter', undefined);
      return;
    }
    if (route === 'HardwareDetail' || route === 'DeviceDiagnostic') {
      navigation.navigate('DeviceSettings', undefined);
      return;
    }
    navigation.navigate(route);
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={strings.title} subtitle={strings.subtitle} showBack />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroTop}>
          <AplusIcon name="check" size={42} color={theme.colors.primary} boxed boxSize={72} />
          <View style={styles.itemTitleBlock}>
            <AplusText variant="hero">Batch 26</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>{strings.requiredDocs}</AplusText>
            {report ? (
              <View style={styles.wrapRow}>
                <StatusChip label={report.summary.releaseReady ? strings.releaseReady : strings.notReady} tone={report.summary.releaseReady ? 'success' : 'warning'} />
                <StatusChip label={`${strings.mappedRoutes}: ${report.routes.length}/71`} tone="info" />
              </View>
            ) : null}
          </View>
        </View>
        <AplusButton title={strings.rerun} onPress={load} loading={loading} leftIcon="refresh" />
      </AplusCard>

      {report ? (
        <View style={styles.statsRow}>
          {statusCards.map(card => (
            <AplusCard key={card.label} style={styles.statCard}>
              <AplusText variant="caption">{card.label}</AplusText>
              <AplusText variant="subtitle" color={card.tone === 'danger' ? theme.colors.danger : card.tone === 'warning' ? theme.colors.warning : theme.colors.text}>{card.value}</AplusText>
            </AplusCard>
          ))}
        </View>
      ) : null}

      <View style={styles.tabRow}>
        <TabButton active={activeTab === 'checks'} title={strings.checks} onPress={() => setActiveTab('checks')} />
        <TabButton active={activeTab === 'routes'} title={strings.routes} onPress={() => setActiveTab('routes')} />
        <TabButton active={activeTab === 'guards'} title={strings.guards} onPress={() => setActiveTab('guards')} />
        <TabButton active={activeTab === 'capability'} title={strings.capability} onPress={() => setActiveTab('capability')} />
      </View>

      {!report ? <AplusText variant="body">Loading...</AplusText> : null}

      {report && activeTab === 'checks' ? report.checks.map(item => <CheckCard key={item.id} item={item} strings={strings} onOpen={openRoute} />) : null}

      {report && activeTab === 'routes' ? report.routes.map(item => (
        <AplusCard key={item.ui} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <AplusIcon name="check" size={20} color={theme.colors.primary} boxed />
            <View style={styles.itemTitleBlock}>
              <AplusText variant="body" style={styles.bold}>{item.ui} · {item.name}</AplusText>
              <AplusText variant="caption">Batch {item.batch} · {item.note}</AplusText>
            </View>
            <StatusChip label={statusLabel(item.status, strings)} tone={statusTone(item.status)} />
          </View>
          {item.route ? <AplusButton title={`${strings.open}: ${item.route}`} variant="ghost" onPress={() => openRoute(item.route as AppRouteName)} /> : null}
        </AplusCard>
      )) : null}

      {report && activeTab === 'guards' ? report.guards.map(item => <GuardCard key={item.id} item={item} strings={strings} />) : null}

      {report && activeTab === 'capability' ? report.capabilityMatrix.map(item => <CapabilityCard key={item.exampleLockId} item={item} strings={strings} />) : null}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  heroCard: {
    gap: theme.spacing.lg,
    backgroundColor: '#101014',
    borderColor: theme.colors.borderStrong,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statCard: {
    flexBasis: '22%',
    flexGrow: 1,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tabButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  tabButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(225,29,46,0.16)',
  },
  itemCard: {
    gap: theme.spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  itemTitleBlock: {
    flex: 1,
    gap: 4,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
});

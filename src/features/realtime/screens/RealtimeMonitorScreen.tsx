import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {BaseScreen} from '@/components/base/BaseScreen';
import {StatusChip} from '@/components/base/StatusChip';
import {OfflineBanner} from '@/components/feedback/OfflineBanner';
import {useLanguage} from '@/i18n/LanguageContext';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {MockRealtimeRepository} from '@/services/repositories/MockRealtimeRepository';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {AplusLock} from '@/types/lock';
import type {RealtimeConnectionStatus, RealtimeEvent, RealtimeEventScenario, RealtimeSnapshot} from '@/types/realtime';

type Copy = {
  title: string;
  subtitle: string;
  connect: string;
  disconnect: string;
  backendOff: string;
  backendOn: string;
  refresh: string;
  createCommand: string;
  eventFeed: string;
  subscriptions: string;
  pendingCommands: string;
  monitor: string;
  lockState: string;
  batteryLow: string;
  doorLeftOpen: string;
  tamper: string;
  gatewayOffline: string;
  commandSuccess: string;
  commandTimeout: string;
  commandFailed: string;
  noEvents: string;
  lastEvent: string;
  topics: string;
  reconnect: string;
  duplicates: string;
  viewRecords: string;
  viewAlerts: string;
};

const copy: Record<'vi' | 'en', Copy> = {
  vi: {
    title: 'Realtime / MQTT monitor',
    subtitle: 'UI-65 · WebSocket/MQTT, event, command result và đồng bộ Home/Records/Alerts',
    connect: 'Kết nối realtime',
    disconnect: 'Ngắt kết nối',
    backendOff: 'Tắt backend mock',
    backendOn: 'Bật backend mock',
    refresh: 'Tải lại',
    createCommand: 'Tạo pending command',
    eventFeed: 'Event realtime gần đây',
    subscriptions: 'Subscriptions',
    pendingCommands: 'Pending commands',
    monitor: 'Monitor',
    lockState: 'Lock state',
    batteryLow: 'Pin yếu',
    doorLeftOpen: 'Cửa mở lâu',
    tamper: 'Tamper',
    gatewayOffline: 'Gateway offline',
    commandSuccess: 'Command success',
    commandTimeout: 'Command timeout',
    commandFailed: 'Command failed',
    noEvents: 'Chưa có event. Bấm một action mock để phát realtime event.',
    lastEvent: 'Event cuối',
    topics: 'Topic đang subscribe',
    reconnect: 'Reconnect',
    duplicates: 'Duplicate',
    viewRecords: 'Xem Records',
    viewAlerts: 'Xem Alerts',
  },
  en: {
    title: 'Realtime / MQTT monitor',
    subtitle: 'UI-65 · WebSocket/MQTT, events, command results and Home/Records/Alerts sync',
    connect: 'Connect realtime',
    disconnect: 'Disconnect',
    backendOff: 'Turn backend mock off',
    backendOn: 'Turn backend mock on',
    refresh: 'Refresh',
    createCommand: 'Create pending command',
    eventFeed: 'Recent realtime events',
    subscriptions: 'Subscriptions',
    pendingCommands: 'Pending commands',
    monitor: 'Monitor',
    lockState: 'Lock state',
    batteryLow: 'Low battery',
    doorLeftOpen: 'Door left open',
    tamper: 'Tamper',
    gatewayOffline: 'Gateway offline',
    commandSuccess: 'Command success',
    commandTimeout: 'Command timeout',
    commandFailed: 'Command failed',
    noEvents: 'No events yet. Press a mock action to emit a realtime event.',
    lastEvent: 'Last event',
    topics: 'Subscribed topics',
    reconnect: 'Reconnect',
    duplicates: 'Duplicate',
    viewRecords: 'View Records',
    viewAlerts: 'View Alerts',
  },
};

function timeAgo(value?: number, language: 'vi' | 'en' = 'vi') {
  if (!value) {
    return language === 'vi' ? 'Chưa có' : 'Never';
  }
  const diff = Math.max(0, Date.now() - value);
  const seconds = Math.round(diff / 1000);
  if (seconds < 60) {
    return language === 'vi' ? 'vừa xong' : 'just now';
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

function connectionTone(status: RealtimeConnectionStatus): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (status === 'connected') {
    return 'success';
  }
  if (status === 'connecting') {
    return 'info';
  }
  if (status === 'reconnecting') {
    return 'warning';
  }
  return 'danger';
}

function eventTone(event: RealtimeEvent): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (event.ignoredAsDuplicate) {
    return 'muted';
  }
  if (event.type.includes('success') || event.type === 'lock_state' || event.type === 'gateway_online') {
    return 'success';
  }
  if (event.type.includes('timeout') || event.type === 'battery_low' || event.type === 'door_left_open') {
    return 'warning';
  }
  if (event.type.includes('failed') || event.type === 'tamper' || event.type === 'gateway_offline') {
    return 'danger';
  }
  return 'info';
}

function scenarioLabel(scenario: RealtimeEventScenario, strings: Copy) {
  const map: Record<RealtimeEventScenario, string> = {
    lockState: strings.lockState,
    batteryLow: strings.batteryLow,
    doorLeftOpen: strings.doorLeftOpen,
    tamper: strings.tamper,
    gatewayOffline: strings.gatewayOffline,
    commandSuccess: strings.commandSuccess,
    commandTimeout: strings.commandTimeout,
    commandFailed: strings.commandFailed,
  };
  return map[scenario];
}

function LockPicker({locks, selectedLockId, onSelect}: {locks: AplusLock[]; selectedLockId?: string; onSelect: (lockId: string) => void}) {
  return (
    <View style={styles.rowWrap}>
      {locks.slice(0, 8).map(lock => {
        const active = lock.id === selectedLockId;
        return (
          <Pressable key={lock.id} onPress={() => onSelect(lock.id)} style={[styles.lockChip, active ? styles.lockChipActive : null]}>
            <AplusText variant="caption" color={active ? theme.colors.text : theme.colors.textMuted}>{lock.roomName}</AplusText>
          </Pressable>
        );
      })}
    </View>
  );
}

function SummaryCard({snapshot, strings, language}: {snapshot: RealtimeSnapshot; strings: Copy; language: 'vi' | 'en'}) {
  const {summary} = snapshot;
  return (
    <AplusCard style={styles.heroCard}>
      <View style={styles.heroRow}>
        <AplusIcon name="gateway" size={42} color={theme.colors.primary} boxed boxSize={72} />
        <View style={styles.flex}>
          <AplusText variant="title">{strings.monitor}</AplusText>
          <AplusText variant="caption">{summary.serverUrl}</AplusText>
          <View style={styles.rowWrap}>
            <StatusChip label={summary.status.toUpperCase()} tone={connectionTone(summary.status)} />
            <StatusChip label={summary.transport.toUpperCase()} tone="info" />
            <StatusChip label={summary.backendOnline ? 'Backend online' : 'Backend off'} tone={summary.backendOnline ? 'success' : 'danger'} />
          </View>
        </View>
      </View>
      <View style={styles.statGrid}>
        <MiniStat label={strings.topics} value={String(summary.subscribedTopics)} />
        <MiniStat label={strings.pendingCommands} value={String(summary.pendingCommands)} />
        <MiniStat label={strings.lastEvent} value={timeAgo(summary.lastEventAt, language)} />
        <MiniStat label={strings.reconnect} value={String(summary.reconnectAttempts)} />
        <MiniStat label={strings.duplicates} value={String(summary.duplicateEvents)} />
      </View>
    </AplusCard>
  );
}

function MiniStat({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.miniStat}>
      <AplusText variant="caption">{label}</AplusText>
      <AplusText variant="subtitle">{value}</AplusText>
    </View>
  );
}

function EventRow({event, language}: {event: RealtimeEvent; language: 'vi' | 'en'}) {
  return (
    <AplusCard style={styles.eventCard}>
      <View style={styles.eventTop}>
        <View style={styles.flex}>
          <AplusText variant="body" style={styles.bold}>{event.type}</AplusText>
          <AplusText variant="caption">{event.roomName} · {event.topic}</AplusText>
        </View>
        <StatusChip label={event.ignoredAsDuplicate ? 'DEDUPED' : event.transport.toUpperCase()} tone={eventTone(event)} />
      </View>
      <View style={styles.rowWrap}>
        {typeof event.payload.commandCode === 'string' ? <StatusChip label={event.payload.commandCode} tone="info" /> : null}
        {typeof event.payload.batteryPercent === 'number' ? <StatusChip label={`${event.payload.batteryPercent}%`} tone="warning" /> : null}
        <StatusChip label={timeAgo(event.receivedAt, language)} tone="muted" />
      </View>
      <AplusText variant="caption">{String(event.payload.reason ?? '')}</AplusText>
    </AplusCard>
  );
}

export function RealtimeMonitorScreen({lockId}: {lockId?: string}) {
  const navigation = useAplusNavigation();
  const {language} = useLanguage();
  const strings = copy[language];
  const {locks, isOffline, reloadLocks, reloadAccessRecords, reloadAlerts} = useAppState();
  const [snapshot, setSnapshot] = useState<RealtimeSnapshot | undefined>();
  const [selectedLockId, setSelectedLockId] = useState(lockId ?? locks[0]?.id);
  const [loading, setLoading] = useState(false);

  const selectedLock = useMemo(() => locks.find(lock => lock.id === selectedLockId) ?? locks[0], [locks, selectedLockId]);

  const refreshAppState = useCallback(async () => {
    await Promise.all([reloadLocks(), reloadAccessRecords(), reloadAlerts()]);
  }, [reloadAccessRecords, reloadAlerts, reloadLocks]);

  const reload = useCallback(async () => {
    const next = await MockRealtimeRepository.getSnapshot();
    setSnapshot(next);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!selectedLockId && locks[0]?.id) {
      setSelectedLockId(locks[0].id);
    }
  }, [locks, selectedLockId]);

  const runAction = async (action: () => Promise<RealtimeSnapshot>) => {
    setLoading(true);
    try {
      const next = await action();
      setSnapshot(next);
      await refreshAppState();
    } finally {
      setLoading(false);
    }
  };

  const emitScenario = (scenario: RealtimeEventScenario) => {
    if (!selectedLock) {
      return;
    }
    runAction(() => MockRealtimeRepository.emitEvent(selectedLock.id, scenario));
  };

  const currentSnapshot = snapshot ?? {
    summary: {status: 'offline', transport: 'mqtt', serverUrl: 'mqtts://local.aplus.mock/realtime', subscribedTopics: 0, pendingCommands: 0, reconnectAttempts: 0, droppedEvents: 0, duplicateEvents: 0, backendOnline: false},
    events: [],
    subscriptions: [],
    pendingCommands: [],
  } as RealtimeSnapshot;

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={strings.title} subtitle={strings.subtitle} showBack showLogo />
      <OfflineBanner visible={isOffline} />

      <SummaryCard snapshot={currentSnapshot} strings={strings} language={language} />

      <AplusCard style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.flex}>
            <AplusText variant="subtitle">Context lock</AplusText>
            <AplusText variant="caption">{selectedLock ? `${selectedLock.name} · ${selectedLock.gatewayName ?? 'No gateway'}` : 'No lock'}</AplusText>
          </View>
          <StatusChip label={selectedLock?.connectionState ?? 'unknown'} tone={selectedLock?.connectionState === 'online' ? 'success' : 'warning'} />
        </View>
        <LockPicker locks={locks} selectedLockId={selectedLock?.id} onSelect={setSelectedLockId} />
      </AplusCard>

      <View style={styles.buttonGrid}>
        <AplusButton title={strings.connect} onPress={() => runAction(() => MockRealtimeRepository.connect())} loading={loading} leftIcon="wifi" style={styles.gridButton} />
        <AplusButton title={strings.disconnect} variant="secondary" onPress={() => runAction(() => MockRealtimeRepository.disconnect())} disabled={loading} leftIcon="close" style={styles.gridButton} />
        <AplusButton title={currentSnapshot.summary.backendOnline ? strings.backendOff : strings.backendOn} variant="ghost" onPress={() => runAction(() => MockRealtimeRepository.setBackendOnline(!currentSnapshot.summary.backendOnline))} disabled={loading} leftIcon="gateway" style={styles.gridButton} />
        <AplusButton title={strings.refresh} variant="secondary" onPress={() => runAction(() => MockRealtimeRepository.getSnapshot())} disabled={loading} leftIcon="refresh" style={styles.gridButton} />
      </View>

      <AplusCard style={styles.sectionCard}>
        <AplusText variant="subtitle">Mock events</AplusText>
        <View style={styles.buttonGrid}>
          {(['lockState', 'batteryLow', 'doorLeftOpen', 'tamper', 'gatewayOffline', 'commandSuccess', 'commandTimeout', 'commandFailed'] as RealtimeEventScenario[]).map(scenario => (
            <AplusButton key={scenario} title={scenarioLabel(scenario, strings)} variant={scenario.includes('command') ? 'secondary' : 'ghost'} onPress={() => emitScenario(scenario)} disabled={!selectedLock || loading || currentSnapshot.summary.status !== 'connected'} style={styles.gridButton} />
          ))}
        </View>
        <AplusButton title={strings.createCommand} variant="secondary" onPress={() => selectedLock && runAction(() => MockRealtimeRepository.createPendingCommand(selectedLock.id))} disabled={!selectedLock || loading} leftIcon="command" />
      </AplusCard>

      <AplusCard style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <AplusText variant="subtitle">{strings.pendingCommands}</AplusText>
            <AplusText variant="caption">ACK/success/fail/timeout cập nhật qua event.</AplusText>
          </View>
          <StatusChip label={String(currentSnapshot.pendingCommands.length)} tone="info" />
        </View>
        {currentSnapshot.pendingCommands.slice(0, 5).map(command => (
          <View key={command.id} style={styles.commandRow}>
            <View style={styles.flex}>
              <AplusText variant="body" style={styles.bold}>{command.commandCode}</AplusText>
              <AplusText variant="caption">{command.lockName} · {command.topic}</AplusText>
            </View>
            <StatusChip label={command.status.toUpperCase()} tone={command.status === 'success' ? 'success' : command.status === 'timeout' || command.status === 'failed' ? 'danger' : 'warning'} />
          </View>
        ))}
      </AplusCard>

      <AplusCard style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <AplusText variant="subtitle">{strings.subscriptions}</AplusText>
            <AplusText variant="caption">MQTT/WebSocket topic theo từng gateway/lock.</AplusText>
          </View>
          <StatusChip label={`${currentSnapshot.subscriptions.filter(item => item.active).length}/${currentSnapshot.subscriptions.length}`} tone="success" />
        </View>
        {currentSnapshot.subscriptions.slice(0, 8).map(subscription => (
          <View key={subscription.id} style={styles.subscriptionRow}>
            <View style={styles.flex}>
              <AplusText variant="body" style={styles.bold}>{subscription.lockName}</AplusText>
              <AplusText variant="caption">{subscription.topic}</AplusText>
            </View>
            <StatusChip label={subscription.transport.toUpperCase()} tone={subscription.active ? 'success' : 'muted'} />
          </View>
        ))}
      </AplusCard>

      <View style={styles.linkRow}>
        <AplusButton title={strings.viewRecords} variant="secondary" onPress={() => navigation.navigate('Activity')} leftIcon="history" style={styles.linkButton} />
        <AplusButton title={strings.viewAlerts} variant="secondary" onPress={() => navigation.navigate('AlarmCenter', selectedLock ? {lockId: selectedLock.id} : undefined)} leftIcon="alert" style={styles.linkButton} />
      </View>

      <View style={styles.sectionStack}>
        <AplusText variant="subtitle">{strings.eventFeed}</AplusText>
        {currentSnapshot.events.length ? currentSnapshot.events.slice(0, 12).map(event => <EventRow key={event.id} event={event} language={language} />) : (
          <AplusCard>
            <AplusText variant="caption">{strings.noEvents}</AplusText>
          </AplusCard>
        )}
      </View>
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
  heroCard: {
    gap: theme.spacing.lg,
    borderColor: theme.colors.borderStrong,
    backgroundColor: '#101014',
  },
  heroRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    alignItems: 'center',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  miniStat: {
    flexBasis: '30%',
    flexGrow: 1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  sectionCard: {
    gap: theme.spacing.md,
  },
  sectionStack: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  lockChip: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceStrong,
  },
  lockChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  gridButton: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  linkRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  linkButton: {
    flex: 1,
  },
  commandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.md,
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.md,
  },
  eventCard: {
    gap: theme.spacing.sm,
  },
  eventTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
});

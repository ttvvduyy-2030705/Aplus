import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {BaseScreen} from '@/components/base/BaseScreen';
import {StatusChip} from '@/components/base/StatusChip';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {Alert, AlertSeverity, AlertStatus} from '@/types/alert';

const severityFilters: Array<AlertSeverity | 'all'> = ['all', 'Critical', 'High', 'Medium', 'Low'];
const statusFilters: Array<AlertStatus | 'all'> = ['all', 'unread', 'read', 'resolved', 'ignored'];

function severityTone(severity: AlertSeverity) {
  if (severity === 'Critical') {
    return 'danger' as const;
  }
  if (severity === 'High' || severity === 'Medium') {
    return 'warning' as const;
  }
  return 'info' as const;
}

function statusTone(status: AlertStatus) {
  if (status === 'resolved') {
    return 'success' as const;
  }
  if (status === 'ignored') {
    return 'muted' as const;
  }
  if (status === 'unread') {
    return 'danger' as const;
  }
  return 'info' as const;
}

function alertTypeLabel(type: Alert['type']) {
  switch (type) {
    case 'battery_low':
      return 'Pin yếu';
    case 'door_left_open':
      return 'Cửa mở lâu';
    case 'tamper':
      return 'Cạy phá';
    case 'offline':
      return 'Offline';
    case 'failed_attempts':
      return 'Failed attempts';
    default:
      return type;
  }
}

function FilterPill({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) {
  return <AplusButton title={label} variant={active ? 'primary' : 'ghost'} onPress={onPress} style={styles.filterPill} />;
}

function AlertCard({alert}: {alert: Alert}) {
  const navigation = useAplusNavigation();
  const {resolveAlert, ignoreAlert} = useAppState();
  const closed = alert.status === 'resolved' || alert.status === 'ignored';
  return (
    <AplusCard style={[styles.alertCard, alert.status === 'unread' ? styles.unreadCard : null]}>
      <View style={styles.alertHeader}>
        <AplusIcon name="alert" size={28} color={alert.severity === 'Critical' ? theme.colors.danger : theme.colors.warning} boxed />
        <View style={styles.flexBlock}>
          <AplusText variant="subtitle">{alert.title}</AplusText>
          <AplusText variant="caption">{alert.lockName} · {alert.roomName} · {new Date(alert.lastEventAt).toLocaleString('vi-VN')}</AplusText>
        </View>
        <StatusChip label={alert.severity} tone={severityTone(alert.severity)} />
      </View>
      <AplusText variant="body" color={theme.colors.textMuted}>{alert.message}</AplusText>
      <View style={styles.chipRow}>
        <StatusChip label={statusLabel(alert.status)} tone={statusTone(alert.status)} />
        <StatusChip label={alertTypeLabel(alert.type)} tone="info" />
        <StatusChip label={`${alert.eventCount} event`} tone="muted" />
        {alert.ticketId ? <StatusChip label={alert.ticketId} tone="warning" /> : null}
      </View>
      <View style={styles.actionRow}>
        <AplusButton title="Chi tiết" leftIcon="alert" variant="secondary" onPress={() => navigation.navigate('AlertDetail', {alertId: alert.id})} style={styles.flexButton} />
        {!alert.ticketId ? <AplusButton title="Tạo ticket" leftIcon="plus" variant="ghost" onPress={() => navigation.navigate('TicketCreate', {alertId: alert.id})} style={styles.flexButton} /> : null}
      </View>
      {!closed ? (
        <View style={styles.actionRow}>
          <AplusButton title="Resolve" leftIcon="check" variant="ghost" onPress={() => resolveAlert(alert.id, 'Resolve nhanh từ Alarm Center.')} style={styles.flexButton} />
          <AplusButton title="Ignore" leftIcon="close" variant="ghost" onPress={() => ignoreAlert(alert.id, 'Bỏ qua sau khi xác minh.')} style={styles.flexButton} />
        </View>
      ) : null}
    </AplusCard>
  );
}

function statusLabel(status: AlertStatus) {
  switch (status) {
    case 'unread':
      return 'Unread';
    case 'read':
      return 'Read';
    case 'resolved':
      return 'Resolved';
    case 'ignored':
      return 'Ignored';
    default:
      return status;
  }
}

export function AlarmCenterScreen() {
  const navigation = useAplusNavigation();
  const {alerts, alertSummary, alertsLoading, reloadAlerts, reloadIncidentTickets} = useAppState();
  const [severity, setSeverity] = useState<AlertSeverity | 'all'>('all');
  const [status, setStatus] = useState<AlertStatus | 'all'>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    reloadAlerts();
    reloadIncidentTickets();
  }, [reloadAlerts, reloadIncidentTickets]);

  const filteredAlerts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return alerts.filter(alert => {
      const matchesSeverity = severity === 'all' || alert.severity === severity;
      const matchesStatus = status === 'all' || alert.status === status;
      const matchesQuery = !normalizedQuery
        || alert.lockName.toLowerCase().includes(normalizedQuery)
        || alert.roomName.toLowerCase().includes(normalizedQuery)
        || alert.title.toLowerCase().includes(normalizedQuery)
        || alert.message.toLowerCase().includes(normalizedQuery)
        || alert.ticketId?.toLowerCase().includes(normalizedQuery);
      return matchesSeverity && matchesStatus && matchesQuery;
    });
  }, [alerts, query, severity, status]);

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Trung tâm báo động" subtitle="UI-19 · Incident/Ticket/Push policy" showLogo canGoBack onBack={navigation.goBack} rightIcon="settings" rightLabel="Policy" onRightPress={() => navigation.navigate('NotificationPolicy', undefined)} />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <AplusIcon name="bell" size={44} color={alertSummary.critical > 0 || alertSummary.high > 0 ? theme.colors.warning : theme.colors.primary} boxed boxSize={76} />
          <View style={styles.flexBlock}>
            <AplusText variant="hero">{alertSummary.unread} cảnh báo mới</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>Dedupe cảnh báo, gắn ticket xử lý, SLA và push policy để không spam notification.</AplusText>
          </View>
        </View>
        <View style={styles.metricGrid}>
          <AplusCard style={styles.metricCard}><AplusText variant="caption">Critical</AplusText><AplusText variant="title" color={theme.colors.danger}>{alertSummary.critical}</AplusText></AplusCard>
          <AplusCard style={styles.metricCard}><AplusText variant="caption">High</AplusText><AplusText variant="title" color={theme.colors.warning}>{alertSummary.high}</AplusText></AplusCard>
          <AplusCard style={styles.metricCard}><AplusText variant="caption">Ticket mở</AplusText><AplusText variant="title">{alertSummary.ticketsOpen}</AplusText></AplusCard>
          <AplusCard style={styles.metricCard}><AplusText variant="caption">Resolved</AplusText><AplusText variant="title" color={theme.colors.success}>{alertSummary.resolved}</AplusText></AplusCard>
        </View>
        <AplusButton title="Tải lại cảnh báo" leftIcon="refresh" variant="secondary" loading={alertsLoading} onPress={() => reloadAlerts()} />
      </AplusCard>

      <AplusCard style={styles.filterCard}>
        <AplusTextField label="Tìm cảnh báo" leftIcon="alert" placeholder="Khóa, phòng, ticketId, nội dung" value={query} onChangeText={setQuery} />
        <AplusText variant="label">Severity</AplusText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {severityFilters.map(item => <FilterPill key={item} label={item === 'all' ? 'Tất cả' : item} active={severity === item} onPress={() => setSeverity(item)} />)}
        </ScrollView>
        <AplusText variant="label">Trạng thái</AplusText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {statusFilters.map(item => <FilterPill key={item} label={item === 'all' ? 'Tất cả' : statusLabel(item)} active={status === item} onPress={() => setStatus(item)} />)}
        </ScrollView>
      </AplusCard>

      {filteredAlerts.length === 0 ? (
        <AplusCard style={styles.alertCard}>
          <AplusText variant="subtitle">Không có cảnh báo phù hợp</AplusText>
          <AplusText variant="caption">Đổi filter hoặc tạo thao tác failed/offline/pin yếu để sinh alert qua dedupe.</AplusText>
        </AplusCard>
      ) : filteredAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {gap: theme.spacing.md, borderColor: theme.colors.borderStrong},
  heroRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg},
  flexBlock: {flex: 1, gap: theme.spacing.xs},
  metricGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md},
  metricCard: {flexBasis: '47%', flexGrow: 1, gap: theme.spacing.xs},
  filterCard: {gap: theme.spacing.md},
  filterRow: {gap: theme.spacing.sm, paddingRight: theme.spacing.xl},
  filterPill: {minHeight: 38, paddingHorizontal: theme.spacing.md},
  alertCard: {gap: theme.spacing.md},
  unreadCard: {borderColor: 'rgba(255,44,44,0.38)'},
  alertHeader: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  actionRow: {flexDirection: 'row', gap: theme.spacing.md},
  flexButton: {flex: 1},
});

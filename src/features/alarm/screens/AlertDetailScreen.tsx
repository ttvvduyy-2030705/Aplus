import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
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
import type {Alert, IncidentTicket} from '@/types/alert';

function severityTone(severity: Alert['severity']) {
  if (severity === 'Critical') {
    return 'danger' as const;
  }
  if (severity === 'High' || severity === 'Medium') {
    return 'warning' as const;
  }
  return 'info' as const;
}

function InfoRow({label, value}: {label: string; value?: string | number}) {
  return (
    <View style={styles.infoRow}>
      <AplusText variant="caption" color={theme.colors.textMuted}>{label}</AplusText>
      <AplusText variant="body" style={styles.infoValue}>{value ?? '—'}</AplusText>
    </View>
  );
}

function TicketRow({ticket}: {ticket: IncidentTicket}) {
  return (
    <AplusCard style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <AplusIcon name="command" size={22} color={theme.colors.primary} boxed />
        <View style={styles.flexBlock}>
          <AplusText variant="subtitle">{ticket.title}</AplusText>
          <AplusText variant="caption">{ticket.assignee} · hạn {new Date(ticket.dueAt).toLocaleString('vi-VN')}</AplusText>
        </View>
        <StatusChip label={ticket.priority} tone={severityTone(ticket.priority)} />
      </View>
      <AplusText variant="caption">{ticket.description}</AplusText>
      <View style={styles.chipRow}>
        <StatusChip label={ticket.status} tone={ticket.status === 'resolved' ? 'success' : 'warning'} />
        {ticket.attachmentNames.length > 0 ? <StatusChip label={`${ticket.attachmentNames.length} file`} tone="info" /> : null}
      </View>
    </AplusCard>
  );
}

export function AlertDetailScreen({alertId}: {alertId: string}) {
  const navigation = useAplusNavigation();
  const {getAlertDetail, markAlertRead, resolveAlert, ignoreAlert, reloadIncidentTickets, incidentTickets} = useAppState();
  const [alert, setAlert] = useState<Alert | undefined>();
  const [note, setNote] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  const load = async () => {
    const detail = await getAlertDetail(alertId);
    if (detail) {
      setAlert(detail);
      setNote(detail.note ?? '');
      await markAlertRead(alertId);
      await reloadIncidentTickets(alertId);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertId]);

  const closeAsResolved = async () => {
    setLoadingAction(true);
    const updated = await resolveAlert(alertId, note || 'Đã xử lý từ UI-40.');
    if (updated) {
      setAlert(updated);
      await reloadIncidentTickets(alertId);
    }
    setLoadingAction(false);
  };

  const ignore = async () => {
    setLoadingAction(true);
    const updated = await ignoreAlert(alertId, note || 'Bỏ qua sau khi xác minh từ UI-40.');
    if (updated) {
      setAlert(updated);
    }
    setLoadingAction(false);
  };

  if (!alert) {
    return (
      <BaseScreen contentStyle={styles.container}>
        <AplusHeader title="Không tìm thấy cảnh báo" canGoBack onBack={navigation.goBack} showLogo />
        <AplusCard style={styles.cardGap}>
          <AplusText variant="body">Không tìm thấy alertId: {alertId}</AplusText>
          <AplusButton title="Quay lại" onPress={navigation.goBack} />
        </AplusCard>
      </BaseScreen>
    );
  }

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Chi tiết cảnh báo" subtitle="UI-40 · Incident detail" canGoBack onBack={navigation.goBack} showLogo rightIcon="plus" rightLabel="Ticket" onRightPress={() => navigation.navigate('TicketCreate', {alertId})} />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <AplusIcon name="alert" size={44} color={alert.severity === 'Critical' ? theme.colors.danger : theme.colors.warning} boxed boxSize={76} />
          <View style={styles.flexBlock}>
            <AplusText variant="hero">{alert.title}</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>{alert.message}</AplusText>
            <View style={styles.chipRow}>
              <StatusChip label={alert.severity} tone={severityTone(alert.severity)} />
              <StatusChip label={alert.status} tone={alert.status === 'resolved' ? 'success' : alert.status === 'ignored' ? 'muted' : 'warning'} />
              <StatusChip label={`${alert.eventCount} event`} tone="info" />
            </View>
          </View>
        </View>
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">Thông tin truy vết</AplusText>
        <InfoRow label="lockId" value={alert.lockId} />
        <InfoRow label="Khóa" value={alert.lockName} />
        <InfoRow label="Phòng" value={alert.roomName} />
        <InfoRow label="Dedupe key" value={alert.dedupeKey} />
        <InfoRow label="Ticket" value={alert.ticketId} />
        <InfoRow label="Assignee" value={alert.assignee} />
        <InfoRow label="Tạo lúc" value={new Date(alert.createdAt).toLocaleString('vi-VN')} />
        <InfoRow label="Event gần nhất" value={new Date(alert.lastEventAt).toLocaleString('vi-VN')} />
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">Related records</AplusText>
        <View style={styles.chipRow}>
          {alert.relatedRecordIds.map(recordId => <StatusChip key={recordId} label={recordId} tone="info" />)}
        </View>
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">Ghi chú xử lý</AplusText>
        <AplusTextField label="Note" leftIcon="alert" multiline value={note} onChangeText={setNote} placeholder="Nhập ghi chú xử lý, nguyên nhân, người phụ trách..." />
        <View style={styles.actionRow}>
          <AplusButton title="Resolve" leftIcon="check" loading={loadingAction} onPress={closeAsResolved} style={styles.flexButton} />
          <AplusButton title="Ignore" leftIcon="close" variant="ghost" loading={loadingAction} onPress={ignore} style={styles.flexButton} />
        </View>
      </AplusCard>

      <View style={styles.actionRow}>
        <AplusButton title="Khóa liên quan" leftIcon="door" variant="secondary" onPress={() => navigation.navigate('LockDetail', {lockId: alert.lockId})} style={styles.flexButton} />
        <AplusButton title="Records" leftIcon="history" variant="secondary" onPress={() => navigation.navigate('Activity')} style={styles.flexButton} />
      </View>

      {incidentTickets.length > 0 ? (
        <View style={styles.listGap}>
          <AplusText variant="subtitle">Ticket xử lý</AplusText>
          {incidentTickets.map(ticket => <TicketRow key={ticket.id} ticket={ticket} />)}
        </View>
      ) : null}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {gap: theme.spacing.md, borderColor: theme.colors.borderStrong},
  heroRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg},
  flexBlock: {flex: 1, gap: theme.spacing.xs},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  cardGap: {gap: theme.spacing.md},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md, paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  infoValue: {flex: 1, textAlign: 'right', fontWeight: theme.typography.weight.semibold},
  actionRow: {flexDirection: 'row', gap: theme.spacing.md},
  flexButton: {flex: 1},
  ticketCard: {gap: theme.spacing.sm},
  ticketHeader: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md},
  listGap: {gap: theme.spacing.md},
});

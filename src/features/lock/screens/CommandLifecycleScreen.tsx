import React from 'react';
import {StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {StatusChip} from '@/components/base/StatusChip';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {LockCommandStatus, LockCommandType} from '@/types/lock';

const commandLabels: Record<LockCommandType, string> = {
  remoteUnlock: 'Mở khóa từ xa',
  lock: 'Khóa lại',
  unlock: 'Mở khóa',
};

function statusTone(status: LockCommandStatus): 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'success') {
    return 'success';
  }
  if (status === 'failed' || status === 'timeout') {
    return 'danger';
  }
  if (status === 'ack') {
    return 'info';
  }
  return 'warning';
}

function TimelineItem({active, done, label, message, time}: {active: boolean; done: boolean; label: string; message: string; time: string}) {
  return (
    <View style={styles.timelineRow}>
      <View style={[styles.timelineDot, done ? styles.timelineDone : null, active ? styles.timelineActive : null]}>
        {done ? <AplusIcon name="check" size={13} color={theme.colors.text} /> : null}
      </View>
      <View style={styles.timelineContent}>
        <AplusText variant="body" style={styles.bold}>{label}</AplusText>
        <AplusText variant="caption">{message}</AplusText>
        <AplusText variant="caption" color={theme.colors.textSubtle}>{time}</AplusText>
      </View>
    </View>
  );
}

export function CommandLifecycleScreen({lockId, commandId}: {lockId: string; commandId: string}) {
  const navigation = useAplusNavigation();
  const {findCommand, findLock, accessRecords} = useAppState();
  const lock = findLock(lockId);
  const command = findCommand(commandId);
  const record = accessRecords.find(item => item.commandId === commandId);

  if (!lock || !command) {
    return (
      <BaseScreen contentStyle={styles.container}>
        <AplusHeader title="Không tìm thấy command" canGoBack onBack={navigation.goBack} showLogo />
        <AplusCard style={styles.card}>
          <AplusText>Không tìm thấy commandId: {commandId}</AplusText>
          <AplusButton title="Về khóa" onPress={() => navigation.navigate('LockDetail', {lockId})} />
        </AplusCard>
      </BaseScreen>
    );
  }

  const finished = command.status === 'success' || command.status === 'failed' || command.status === 'timeout';
  const success = command.status === 'success';

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Command lifecycle" subtitle={`${commandLabels[command.type]} · ${lock.name}`} canGoBack onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name={success ? 'check' : finished ? 'close' : 'command'} size={54} color={success ? theme.colors.success : finished ? theme.colors.danger : theme.colors.primary} boxed boxSize={92} />
        <AplusText variant="hero" align="center">{success ? 'Thành công' : finished ? 'Không đổi trạng thái' : 'Đang xử lý'}</AplusText>
        <AplusText variant="body" align="center" color={theme.colors.textMuted}>Mã lệnh {command.commandCode}. Trạng thái khóa chỉ được cập nhật khi lifecycle kết thúc bằng Success.</AplusText>
        <View style={styles.chipRow}>
          <StatusChip label={command.status} tone={statusTone(command.status)} />
          <StatusChip label={command.scenario} tone="info" />
          <StatusChip label={command.authMethod} tone="warning" />
        </View>
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Timeline UI-38</AplusText>
        {command.steps.map((step, index) => (
          <TimelineItem
            key={`${step.status}-${step.at}`}
            active={index === command.steps.length - 1 && !finished}
            done={index < command.steps.length - 1 || finished}
            label={step.label}
            message={step.message}
            time={new Date(step.at).toLocaleTimeString('vi-VN')}
          />
        ))}
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Kết quả audit</AplusText>
        {record ? (
          <>
            <AplusText variant="body">{record.message}</AplusText>
            <AplusText variant="caption">{record.actorName} · {new Date(record.createdAt).toLocaleString('vi-VN')}</AplusText>
            <StatusChip label={`Record: ${record.result}`} tone={record.result === 'success' ? 'success' : record.result === 'timeout' ? 'warning' : 'danger'} />
          </>
        ) : (
          <AplusText variant="caption">Record sẽ xuất hiện khi command kết thúc Success/Timeout/Failed.</AplusText>
        )}
      </AplusCard>

      <View style={styles.actionsRow}>
        <AplusButton title="Về khóa" leftIcon="door" onPress={() => navigation.navigate('LockDetail', {lockId})} style={styles.flexButton} />
        <AplusButton title="Lịch sử" leftIcon="history" variant="secondary" onPress={() => navigation.reset('Activity')} style={styles.flexButton} />
      </View>
      {!success && finished ? <AplusButton title="Thử lại" leftIcon="refresh" variant="ghost" onPress={() => navigation.navigate('RemoteUnlock', {lockId})} /> : null}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  heroCard: {
    alignItems: 'center',
    gap: theme.spacing.md,
    borderColor: theme.colors.borderStrong,
  },
  card: {
    gap: theme.spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surfaceStrong,
    marginTop: 2,
  },
  timelineDone: {
    backgroundColor: theme.colors.primary,
  },
  timelineActive: {
    borderColor: theme.colors.warning,
    backgroundColor: theme.colors.primarySoft,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 2,
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flexButton: {
    flex: 1,
  },
});

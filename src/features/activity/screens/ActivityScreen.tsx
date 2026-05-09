import React, {useEffect} from 'react';
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
import type {AccessRecord} from '@/types/lock';

function resultTone(result: AccessRecord['result']): 'success' | 'warning' | 'danger' | 'info' {
  if (result === 'success') {
    return 'success';
  }
  if (result === 'timeout') {
    return 'warning';
  }
  if (result === 'blocked') {
    return 'info';
  }
  return 'danger';
}

function RecordRow({record}: {record: AccessRecord}) {
  const navigation = useAplusNavigation();
  return (
    <AplusCard style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <AplusIcon name={record.result === 'success' ? 'unlock' : 'alert'} size={24} color={record.result === 'success' ? theme.colors.success : theme.colors.warning} />
        <View style={styles.recordText}>
          <AplusText variant="body" style={styles.bold}>{record.lockName}</AplusText>
          <AplusText variant="caption">{record.roomName} · {record.method}</AplusText>
        </View>
        <StatusChip label={record.result} tone={resultTone(record.result)} />
      </View>
      <AplusText variant="caption">{record.message}</AplusText>
      <AplusText variant="caption" color={theme.colors.textSubtle}>{record.actorName} · {new Date(record.createdAt).toLocaleString('vi-VN')}</AplusText>
      <AplusButton title="Mở khóa liên quan" leftIcon="door" variant="ghost" onPress={() => navigation.navigate('LockDetail', {lockId: record.lockId})} />
    </AplusCard>
  );
}

export function ActivityScreen() {
  const {accessRecords, reloadAccessRecords} = useAppState();

  useEffect(() => {
    reloadAccessRecords();
  }, [reloadAccessRecords]);

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Lịch sử" subtitle="AccessRecord mock từ command lifecycle" showLogo />
      <AplusCard style={styles.heroCard}>
        <AplusIcon name="history" size={44} color={theme.colors.primary} boxed boxSize={76} />
        <View style={styles.recordText}>
          <AplusText variant="hero">Records</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>Batch 03 tạo record ngay sau mỗi command Success/Timeout/Failed; Batch 13 sẽ mở rộng filter/detail.</AplusText>
        </View>
      </AplusCard>

      {accessRecords.length === 0 ? (
        <AplusCard style={styles.emptyCard}>
          <AplusText variant="subtitle">Chưa có lịch sử</AplusText>
          <AplusText variant="caption">Hãy mở khóa từ xa thành công để tạo record mock.</AplusText>
        </AplusCard>
      ) : (
        <View style={styles.list}>
          {accessRecords.map(record => <RecordRow key={record.id} record={record} />)}
        </View>
      )}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    borderColor: theme.colors.borderStrong,
  },
  list: {
    gap: theme.spacing.md,
  },
  recordCard: {
    gap: theme.spacing.md,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  recordText: {
    flex: 1,
    gap: 2,
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
  emptyCard: {
    gap: theme.spacing.sm,
  },
});

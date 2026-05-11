import React, {useEffect, useMemo, useState} from 'react';
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
import type {AccessRecord} from '@/types/lock';

function resultTone(result?: AccessRecord['result']) {
  if (result === 'success') {
    return 'success' as const;
  }
  if (result === 'timeout') {
    return 'warning' as const;
  }
  if (result === 'blocked') {
    return 'info' as const;
  }
  return 'danger' as const;
}

function DetailRow({label, value}: {label: string; value?: string | number}) {
  if (value === undefined || value === '') {
    return null;
  }
  return (
    <View style={styles.detailRow}>
      <AplusText variant="caption" color={theme.colors.textMuted}>{label}</AplusText>
      <AplusText variant="body" style={styles.detailValue}>{String(value)}</AplusText>
    </View>
  );
}

export function RecordDetailScreen({recordId}: {recordId: string}) {
  const navigation = useAplusNavigation();
  const {accessRecords, findLock, getAccessRecordDetail, saveAccessRecordNote} = useAppState();
  const cachedRecord = useMemo(() => accessRecords.find(item => item.id === recordId), [accessRecords, recordId]);
  const [record, setRecord] = useState<AccessRecord | undefined>(cachedRecord);
  const [note, setNote] = useState(cachedRecord?.note ?? '');
  const [saving, setSaving] = useState(false);
  const lock = record ? findLock(record.lockId) : undefined;

  useEffect(() => {
    let mounted = true;
    getAccessRecordDetail(recordId).then(detail => {
      if (mounted && detail) {
        setRecord(detail);
        setNote(detail.note ?? '');
      }
    });
    return () => {
      mounted = false;
    };
  }, [getAccessRecordDetail, recordId]);

  const saveNote = async () => {
    setSaving(true);
    const result = await saveAccessRecordNote(recordId, note);
    if (result) {
      setRecord(prev => prev ? {...prev, note: result.note} : prev);
    }
    setSaving(false);
  };

  if (!record) {
    return (
      <BaseScreen contentStyle={styles.container}>
        <AplusHeader title="Chi tiết bản ghi" subtitle="UI-39" canGoBack onBack={navigation.goBack} showLogo />
        <AplusCard style={styles.cardGap}>
          <AplusText variant="body">Không tìm thấy recordId: {recordId}</AplusText>
          <AplusButton title="Quay lại" onPress={navigation.goBack} />
        </AplusCard>
      </BaseScreen>
    );
  }

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Chi tiết bản ghi" subtitle="UI-39 · Record detail" canGoBack onBack={navigation.goBack} showLogo rightIcon="door" onRightPress={() => navigation.navigate('LockDetail', {lockId: record.lockId})} />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <AplusIcon name={record.result === 'success' ? 'check' : 'alert'} size={38} color={record.result === 'success' ? theme.colors.success : theme.colors.warning} boxed boxSize={74} />
          <View style={styles.flexBlock}>
            <AplusText variant="hero">{record.lockName}</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>{record.roomName} · {record.method}</AplusText>
            <View style={styles.chipRow}>
              <StatusChip label={record.result} tone={resultTone(record.result)} />
              <StatusChip label={new Date(record.createdAt).toLocaleString('vi-VN')} tone="info" />
            </View>
          </View>
        </View>
        <AplusText variant="body">{record.message}</AplusText>
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">Liên kết truy vết</AplusText>
        <DetailRow label="lockId" value={record.lockId} />
        <DetailRow label="commandId" value={record.commandId} />
        <DetailRow label="credentialId" value={record.credentialId} />
        <DetailRow label="personId" value={record.personId} />
        <DetailRow label="userId" value={record.userId} />
        <DetailRow label="ticketId" value={record.ticketId} />
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">Nguồn & lý do</AplusText>
        <DetailRow label="Người/nguồn mở" value={record.actorName} />
        <DetailRow label="IP / source" value={record.sourceIp} />
        <DetailRow label="Thiết bị" value={record.deviceName} />
        <DetailRow label="Gateway" value={record.gatewayName ?? lock?.gatewayName} />
        <DetailRow label="Pin tại thời điểm event" value={record.batteryPercentAtEvent !== undefined ? `${record.batteryPercentAtEvent}%` : undefined} />
        <DetailRow label="Lý do fail" value={record.failureReason} />
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">Ghi chú xử lý</AplusText>
        <AplusTextField label="Record note" leftIcon="history" multiline value={note} onChangeText={setNote} placeholder="Nhập ghi chú xử lý hoặc kết quả xác minh..." />
        <AplusButton title="Lưu ghi chú" leftIcon="check" onPress={saveNote} loading={saving} />
      </AplusCard>

      <View style={styles.actionRow}>
        <AplusButton title="Khóa liên quan" leftIcon="door" variant="secondary" onPress={() => navigation.navigate('LockDetail', {lockId: record.lockId})} style={styles.flexButton} />
        <AplusButton title="Pin & điện năng" leftIcon="battery" variant="secondary" onPress={() => navigation.navigate('BatteryPower', {lockId: record.lockId})} style={styles.flexButton} />
      </View>
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
  detailRow: {flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md, paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  detailValue: {flex: 1, textAlign: 'right', fontWeight: theme.typography.weight.semibold},
  actionRow: {flexDirection: 'row', gap: theme.spacing.md},
  flexButton: {flex: 1},
});

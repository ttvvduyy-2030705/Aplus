import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {StatusChip} from '@/components/base/StatusChip';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {AccessRecord, AccessRecordMethod, AccessRecordResult} from '@/types/lock';

const methodFilters: Array<AccessRecordMethod | 'all'> = ['all', 'App Remote Unlock', 'PIN', 'Card', 'Fingerprint', 'Face', 'NFC', 'Gateway', 'Battery', 'System'];
const resultFilters: Array<AccessRecordResult | 'all'> = ['all', 'success', 'failed', 'timeout', 'blocked'];

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

function methodIcon(record: AccessRecord) {
  if (record.method === 'Battery') {
    return 'battery' as const;
  }
  if (record.method === 'Gateway') {
    return 'gateway' as const;
  }
  if (record.method === 'Card') {
    return 'card' as const;
  }
  if (record.method === 'PIN') {
    return 'pin' as const;
  }
  if (record.method === 'Fingerprint') {
    return 'fingerprint' as const;
  }
  if (record.method === 'Face') {
    return 'face' as const;
  }
  return record.result === 'success' ? 'unlock' as const : 'alert' as const;
}

function RecordRow({record}: {record: AccessRecord}) {
  const navigation = useAplusNavigation();
  return (
    <AplusCard style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <AplusIcon name={methodIcon(record)} size={24} color={record.result === 'success' ? theme.colors.success : theme.colors.warning} boxed />
        <View style={styles.recordText}>
          <AplusText variant="body" style={styles.bold}>{record.lockName}</AplusText>
          <AplusText variant="caption">{record.roomName} · {record.method} · {new Date(record.createdAt).toLocaleString('vi-VN')}</AplusText>
        </View>
        <StatusChip label={record.result} tone={resultTone(record.result)} />
      </View>
      <AplusText variant="caption">{record.message}</AplusText>
      <View style={styles.metaWrap}>
        <StatusChip label={record.actorName} tone="muted" />
        {record.credentialId ? <StatusChip label={record.credentialId} tone="info" /> : null}
        {record.commandId ? <StatusChip label={record.commandId} tone="info" /> : null}
        {record.ticketId ? <StatusChip label={record.ticketId} tone="warning" /> : null}
      </View>
      <View style={styles.actionRow}>
        <AplusButton title="Chi tiết" leftIcon="history" variant="secondary" onPress={() => navigation.navigate('RecordDetail', {recordId: record.id})} style={styles.flexButton} />
        <AplusButton title="Khóa" leftIcon="door" variant="ghost" onPress={() => navigation.navigate('LockDetail', {lockId: record.lockId})} style={styles.flexButton} />
      </View>
    </AplusCard>
  );
}

function FilterPill({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) {
  return (
    <AplusButton
      title={label}
      variant={active ? 'primary' : 'ghost'}
      onPress={onPress}
      style={styles.filterPill}
    />
  );
}

export function ActivityScreen() {
  const navigation = useAplusNavigation();
  const {accessRecords, reloadAccessRecords} = useAppState();
  const [method, setMethod] = useState<AccessRecordMethod | 'all'>('all');
  const [result, setResult] = useState<AccessRecordResult | 'all'>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    reloadAccessRecords();
  }, [reloadAccessRecords]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return accessRecords.filter(record => {
      const matchesMethod = method === 'all' || record.method === method;
      const matchesResult = result === 'all' || record.result === result;
      const matchesQuery = !normalizedQuery
        || record.lockName.toLowerCase().includes(normalizedQuery)
        || record.roomName.toLowerCase().includes(normalizedQuery)
        || record.actorName.toLowerCase().includes(normalizedQuery)
        || record.message.toLowerCase().includes(normalizedQuery)
        || record.credentialId?.toLowerCase().includes(normalizedQuery)
        || record.commandId?.toLowerCase().includes(normalizedQuery);
      return matchesMethod && matchesResult && matchesQuery;
    });
  }, [accessRecords, method, query, result]);

  const successCount = accessRecords.filter(record => record.result === 'success').length;
  const failedCount = accessRecords.filter(record => record.result === 'failed' || record.result === 'blocked' || record.result === 'timeout').length;
  const batteryCount = accessRecords.filter(record => record.method === 'Battery').length;

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Lịch sử mở khóa" subtitle="UI-10 · Records từ dữ liệu thật mock" showLogo rightIcon="matrix" rightLabel="Report" onRightPress={() => navigation.navigate('Reports')} />
      <AplusCard style={styles.heroCard}>
        <AplusIcon name="history" size={44} color={theme.colors.primary} boxed boxSize={76} />
        <View style={styles.recordText}>
          <AplusText variant="hero">Records</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>Truy vết người mở, phương thức, lockId, commandId, credentialId, IP/device, lý do fail và ghi chú xử lý.</AplusText>
        </View>
      </AplusCard>

      <View style={styles.actionRow}>
        <AplusButton title="Báo cáo" leftIcon="matrix" variant="secondary" onPress={() => navigation.navigate('Reports')} style={styles.flexButton} />
        <AplusButton title="Pin & điện năng" leftIcon="battery" variant="ghost" onPress={() => navigation.navigate('BatteryPower', undefined)} style={styles.flexButton} />
      </View>

      <View style={styles.metricGrid}>
        <AplusCard style={styles.metricCard}><AplusText variant="caption">Tổng record</AplusText><AplusText variant="title">{accessRecords.length}</AplusText></AplusCard>
        <AplusCard style={styles.metricCard}><AplusText variant="caption">Thành công</AplusText><AplusText variant="title" color={theme.colors.success}>{successCount}</AplusText></AplusCard>
        <AplusCard style={styles.metricCard}><AplusText variant="caption">Cần xử lý</AplusText><AplusText variant="title" color={theme.colors.warning}>{failedCount}</AplusText></AplusCard>
        <AplusCard style={styles.metricCard}><AplusText variant="caption">Pin</AplusText><AplusText variant="title" color={batteryCount > 0 ? theme.colors.warning : theme.colors.text}>{batteryCount}</AplusText></AplusCard>
      </View>

      <AplusCard style={styles.filterCard}>
        <AplusTextField label="Tìm kiếm" leftIcon="history" placeholder="Tên khóa, phòng, người mở, credentialId, commandId" value={query} onChangeText={setQuery} />
        <AplusText variant="label">Phương thức</AplusText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {methodFilters.map(item => <FilterPill key={item} label={item === 'all' ? 'Tất cả' : item} active={method === item} onPress={() => setMethod(item)} />)}
        </ScrollView>
        <AplusText variant="label">Kết quả</AplusText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {resultFilters.map(item => <FilterPill key={item} label={item === 'all' ? 'Tất cả' : item} active={result === item} onPress={() => setResult(item)} />)}
        </ScrollView>
      </AplusCard>

      {filteredRecords.length === 0 ? (
        <AplusCard style={styles.emptyCard}>
          <AplusText variant="subtitle">Không có record phù hợp</AplusText>
          <AplusText variant="caption">Đổi filter hoặc mở khóa/thử thao tác pin để tạo record mới.</AplusText>
        </AplusCard>
      ) : (
        <View style={styles.list}>
          {filteredRecords.map(record => <RecordRow key={record.id} record={record} />)}
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
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metricCard: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: theme.spacing.xs,
  },
  filterCard: {
    gap: theme.spacing.md,
  },
  filterRow: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.xl,
  },
  filterPill: {
    minHeight: 38,
    paddingHorizontal: theme.spacing.md,
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
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flexButton: {
    flex: 1,
  },
  emptyCard: {
    gap: theme.spacing.sm,
  },
});

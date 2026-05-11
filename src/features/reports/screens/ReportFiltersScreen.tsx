import React, {useMemo, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {BaseScreen} from '@/components/base/BaseScreen';
import {StatusChip} from '@/components/base/StatusChip';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {AccessRecordMethod, AccessRecordResult, LockFilterType} from '@/types/lock';
import type {AnalyticsFilter, ReportDateRange} from '@/types/report';

const ranges: ReportDateRange[] = ['today', 'week', 'month', 'all'];
const homeTypes: Array<LockFilterType | 'all'> = ['all', 'home', 'hotel', 'office'];
const methods: Array<AccessRecordMethod | 'all'> = ['all', 'App Remote Unlock', 'PIN', 'Card', 'Fingerprint', 'Face', 'Gateway', 'Battery', 'System'];
const results: Array<AccessRecordResult | 'all'> = ['all', 'success', 'failed', 'timeout', 'blocked'];

function Pill<T extends string>({label, value, active, onPress}: {label: string; value: T; active: boolean; onPress: (value: T) => void}) {
  return <AplusButton title={label} variant={active ? 'primary' : 'ghost'} onPress={() => onPress(value)} style={styles.pill} />;
}

export function ReportFiltersScreen() {
  const navigation = useAplusNavigation();
  const {analyticsFilter, locks, updateAnalyticsFilter} = useAppState();
  const [draft, setDraft] = useState<AnalyticsFilter>(analyticsFilter);
  const selectedLock = useMemo(() => locks.find(lock => lock.id === draft.lockId), [draft.lockId, locks]);

  const apply = async () => {
    await updateAnalyticsFilter(draft);
    navigation.navigate('Reports');
  };

  const clearLock = () => setDraft(prev => ({...prev, lockId: undefined}));

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Bộ lọc báo cáo nâng cao" subtitle="UI-59 · Filter cho Reports" canGoBack onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Thời gian</AplusText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {ranges.map(item => <Pill key={item} label={item === 'today' ? 'Hôm nay' : item === 'week' ? '7 ngày' : item === 'month' ? '30 ngày' : 'Tất cả'} value={item} active={draft.dateRange === item} onPress={value => setDraft(prev => ({...prev, dateRange: value}))} />)}
        </ScrollView>
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Loại cơ sở</AplusText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {homeTypes.map(item => <Pill key={item} label={item === 'all' ? 'Tất cả' : item === 'home' ? 'Nhà' : item === 'hotel' ? 'Khách sạn' : 'Văn phòng'} value={item} active={draft.homeType === item} onPress={value => setDraft(prev => ({...prev, homeType: value, lockId: undefined}))} />)}
        </ScrollView>
      </AplusCard>

      <AplusCard style={styles.card}>
        <View style={styles.rowBetween}>
          <AplusText variant="subtitle">Khóa cụ thể</AplusText>
          {selectedLock ? <StatusChip label={selectedLock.roomName} tone="info" /> : <StatusChip label="Tất cả" />}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lockRow}>
          <AplusButton title="Tất cả khóa" variant={!draft.lockId ? 'primary' : 'ghost'} onPress={clearLock} style={styles.lockPill} />
          {locks.filter(lock => draft.homeType === 'all' || lock.homeType === draft.homeType).map(lock => (
            <AplusButton key={lock.id} title={lock.name} variant={draft.lockId === lock.id ? 'primary' : 'ghost'} onPress={() => setDraft(prev => ({...prev, lockId: lock.id}))} style={styles.lockPill} />
          ))}
        </ScrollView>
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Phương thức</AplusText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {methods.map(item => <Pill key={item} label={item === 'all' ? 'Tất cả' : item} value={item} active={draft.method === item} onPress={value => setDraft(prev => ({...prev, method: value}))} />)}
        </ScrollView>
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Kết quả</AplusText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {results.map(item => <Pill key={item} label={item === 'all' ? 'Tất cả' : item} value={item} active={draft.result === item} onPress={value => setDraft(prev => ({...prev, result: value}))} />)}
        </ScrollView>
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusTextField label="Từ khóa" leftIcon="history" placeholder="Khóa, phòng, actor, commandId, credentialId" value={draft.query ?? ''} onChangeText={text => setDraft(prev => ({...prev, query: text}))} />
      </AplusCard>

      <View style={styles.actionRow}>
        <AplusButton title="Reset" leftIcon="refresh" variant="ghost" onPress={() => setDraft({dateRange: 'week', homeType: 'all', method: 'all', result: 'all', query: ''})} style={styles.flexButton} />
        <AplusButton title="Áp dụng filter" leftIcon="check" onPress={apply} style={styles.flexButton} />
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  card: {gap: theme.spacing.md},
  pillRow: {gap: theme.spacing.sm, paddingRight: theme.spacing.xl},
  pill: {minHeight: 38, paddingHorizontal: theme.spacing.md},
  lockRow: {gap: theme.spacing.sm, paddingRight: theme.spacing.xl},
  lockPill: {minHeight: 42, paddingHorizontal: theme.spacing.md},
  rowBetween: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md},
  actionRow: {flexDirection: 'row', gap: theme.spacing.md},
  flexButton: {flex: 1},
});

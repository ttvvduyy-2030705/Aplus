import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {OfflineBanner} from '@/components/feedback/OfflineBanner';
import {EmptyState} from '@/components/feedback/EmptyState';
import {ErrorState} from '@/components/feedback/ErrorState';
import {LoadingView} from '@/components/feedback/LoadingView';
import {HomeSummaryCard} from '@/features/home/components/HomeSummaryCard';
import {LockCard} from '@/features/home/components/LockCard';
import {LockFilterChip} from '@/features/home/components/LockFilterChip';
import {LockMetricCard} from '@/features/home/components/LockMetricCard';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {LockFilterType} from '@/types/lock';

const filterLabels: Array<{label: string; value: LockFilterType}> = [
  {label: 'Tất cả', value: 'all'},
  {label: 'Nhà', value: 'home'},
  {label: 'Khách sạn', value: 'hotel'},
  {label: 'Văn phòng', value: 'office'},
];

export function HomeScreen() {
  const navigation = useAplusNavigation();
  const {
    auth,
    homes,
    locks,
    dashboardSummary,
    selectedLockFilter,
    locksLoading,
    locksError,
    isOffline,
    reloadLocks,
    setLockFilter,
    addDemoLock,
    setOfflineMock,
  } = useAppState();

  const filterCounts = useMemo(() => {
    const counts: Record<LockFilterType, number> = {
      all: homes.reduce((total, home) => total + home.totalLocks, 0),
      home: homes.find(home => home.type === 'home')?.totalLocks ?? 0,
      hotel: homes.find(home => home.type === 'hotel')?.totalLocks ?? 0,
      office: homes.find(home => home.type === 'office')?.totalLocks ?? 0,
    };
    return counts;
  }, [homes]);

  const activeFilterLabel = filterLabels.find(item => item.value === selectedLockFilter)?.label ?? 'Tất cả';

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader
        title="Aplus Lock"
        subtitle={auth.user ? `Xin chào, ${auth.user.name}` : 'Home Dashboard'}
        showLogo
        rightLabel="Khoá"
        rightIcon="plus"
        onRightPress={() => navigation.navigate('Pairing')}
      />

      <OfflineBanner visible={isOffline} />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.heroTextBlock}>
            <AplusText variant="label">Home Dashboard</AplusText>
            <AplusText variant="hero">{dashboardSummary.totalLocks} khóa</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>
              Bộ lọc {activeFilterLabel} đang hiển thị đúng dữ liệu theo nhà, khách sạn và văn phòng.
            </AplusText>
          </View>
          <View style={styles.brandBadge}>
            <AplusIcon name="shield" size={30} color={theme.colors.primary} />
          </View>
        </View>
        <View style={styles.quickRow}>
          <AplusButton title={isOffline ? 'Online mock' : 'Offline mock'} leftIcon={isOffline ? 'wifi' : 'signal'} variant="secondary" onPress={() => setOfflineMock(!isOffline)} style={styles.quickButton} />
          <AplusButton title="Thêm demo" leftIcon="plus" variant="ghost" onPress={() => addDemoLock(selectedLockFilter)} style={styles.quickButton} />
        </View>
      </AplusCard>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {filterLabels.map(item => (
          <LockFilterChip
            key={item.value}
            label={item.label}
            value={item.value}
            active={selectedLockFilter === item.value}
            count={filterCounts[item.value]}
            onPress={setLockFilter}
          />
        ))}
      </ScrollView>

      <View style={styles.metricsGrid}>
        <LockMetricCard label="Online" value={dashboardSummary.onlineLocks} tone="success" icon="wifi" />
        <LockMetricCard label="Offline" value={dashboardSummary.offlineLocks} tone={dashboardSummary.offlineLocks > 0 ? 'danger' : 'normal'} icon="signal" />
        <LockMetricCard label="Pin yếu" value={dashboardSummary.lowBatteryLocks} tone={dashboardSummary.lowBatteryLocks > 0 ? 'warning' : 'normal'} icon="battery" />
        <LockMetricCard label="Cảnh báo" value={dashboardSummary.alertLocks} tone={dashboardSummary.alertLocks > 0 ? 'danger' : 'normal'} icon="alert" />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <AplusText variant="subtitle">Nhà / cơ sở</AplusText>
          <AplusText variant="caption">Dữ liệu native mock theo home/building/room/lock</AplusText>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.homeRow}>
        {homes.map(home => <HomeSummaryCard key={home.id} home={home} />)}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <View>
          <AplusText variant="subtitle">Danh sách khóa</AplusText>
          <AplusText variant="caption">Bấm khóa nào vào đúng Lock Detail của khóa đó</AplusText>
        </View>
        <AplusButton title="Tải lại" leftIcon="refresh" variant="ghost" onPress={() => reloadLocks(selectedLockFilter)} style={styles.reloadButton} />
      </View>

      {locksLoading ? <LoadingView /> : null}
      {locksError ? <ErrorState message={locksError} onRetry={() => reloadLocks(selectedLockFilter)} /> : null}
      {!locksLoading && !locksError && locks.length === 0 ? (
        <EmptyState
          title="Không có khóa trong bộ lọc này"
          message="Bạn có thể chuyển bộ lọc khác hoặc thêm khóa demo để kiểm tra luồng Home → Detail."
          actionLabel="Thêm khóa demo"
          onAction={() => addDemoLock(selectedLockFilter)}
        />
      ) : null}
      {!locksLoading && !locksError ? locks.map(lock => (
        <LockCard key={lock.id} lock={lock} onPress={() => navigation.navigate('LockDetail', {lockId: lock.id})} />
      )) : null}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  heroCard: {
    gap: theme.spacing.lg,
    backgroundColor: '#111015',
    borderColor: theme.colors.borderStrong,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  heroTextBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  brandBadge: {
    width: 54,
    height: 54,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  quickRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  quickButton: {
    flex: 1,
  },
  filterRow: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.xl,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  reloadButton: {
    minHeight: 38,
    paddingHorizontal: theme.spacing.md,
  },
  homeRow: {
    paddingRight: theme.spacing.xl,
  },
});

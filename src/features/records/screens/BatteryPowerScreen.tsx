import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {BaseScreen} from '@/components/base/BaseScreen';
import {StatusChip} from '@/components/base/StatusChip';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {BatteryReport} from '@/types/lock';

function batteryTone(report: BatteryReport) {
  if (report.batteryState === 'critical') {
    return 'danger' as const;
  }
  if (report.alertActive || report.batteryState === 'low') {
    return 'warning' as const;
  }
  return 'success' as const;
}

function BatteryTrend({report}: {report: BatteryReport}) {
  return (
    <View style={styles.trendRow}>
      {report.trend.map(point => (
        <View key={`${report.lockId}-${point.label}`} style={styles.trendColumn}>
          <View style={[styles.trendBar, {height: Math.max(14, point.percent)}]} />
          <AplusText variant="caption" align="center">{point.percent}%</AplusText>
          <AplusText variant="label" align="center">{point.label}</AplusText>
        </View>
      ))}
    </View>
  );
}

function BatteryCard({report}: {report: BatteryReport}) {
  const navigation = useAplusNavigation();
  return (
    <AplusCard style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <AplusIcon name="battery" size={30} color={report.alertActive ? theme.colors.warning : theme.colors.success} boxed />
        <View style={styles.flexBlock}>
          <AplusText variant="subtitle">{report.lockName}</AplusText>
          <AplusText variant="caption">{report.roomName} · Ngưỡng {report.threshold}% · còn khoảng {report.estimatedDaysRemaining} ngày</AplusText>
        </View>
        <StatusChip label={`${report.batteryPercent}%`} tone={batteryTone(report)} />
      </View>
      <BatteryTrend report={report} />
      <AplusText variant="caption">{report.recommendedAction}</AplusText>
      <View style={styles.metaWrap}>
        <StatusChip label={report.alertActive ? 'Alert active' : 'Normal'} tone={report.alertActive ? 'warning' : 'success'} />
        {report.lastAlertAt ? <StatusChip label={`Last alert ${new Date(report.lastAlertAt).toLocaleString('vi-VN')}`} tone="info" /> : null}
      </View>
      <View style={styles.actionRow}>
        <AplusButton title="Khóa" leftIcon="door" variant="secondary" onPress={() => navigation.navigate('LockDetail', {lockId: report.lockId})} style={styles.flexButton} />
        <AplusButton title="Record" leftIcon="history" variant="ghost" onPress={() => navigation.navigate('Activity')} style={styles.flexButton} />
      </View>
    </AplusCard>
  );
}

export function BatteryPowerScreen({lockId}: {lockId?: string}) {
  const navigation = useAplusNavigation();
  const {dashboardSummary, getBatteryReports, reloadAccessRecords, reloadLocks} = useAppState();
  const [reports, setReports] = useState<BatteryReport[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    const data = await getBatteryReports(lockId);
    setReports(data);
    await reloadAccessRecords();
    await reloadLocks('all');
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockId]);

  const activeAlerts = useMemo(() => reports.filter(report => report.alertActive).length, [reports]);
  const lowest = reports[0];

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Pin & điện năng" subtitle="UI-21 · BatteryReport" canGoBack onBack={navigation.goBack} showLogo rightIcon="refresh" onRightPress={loadReports} />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <AplusIcon name="battery" size={44} color={activeAlerts > 0 ? theme.colors.warning : theme.colors.success} boxed boxSize={76} />
          <View style={styles.flexBlock}>
            <AplusText variant="hero">{activeAlerts} cảnh báo pin</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>Pin thấp sẽ tự tạo AccessRecord method Battery và cập nhật badge cảnh báo ở Home.</AplusText>
            <View style={styles.metaWrap}>
              <StatusChip label={`${dashboardSummary.lowBatteryLocks} khóa pin yếu`} tone={dashboardSummary.lowBatteryLocks > 0 ? 'warning' : 'success'} />
              <StatusChip label={`${dashboardSummary.alertLocks} khóa có cảnh báo`} tone={dashboardSummary.alertLocks > 0 ? 'danger' : 'success'} />
            </View>
          </View>
        </View>
        {lowest ? <AplusText variant="caption">Thiết bị cần chú ý nhất: {lowest.lockName} · {lowest.batteryPercent}%.</AplusText> : null}
        <AplusButton title="Tải lại BatteryReport" leftIcon="refresh" variant="secondary" onPress={loadReports} loading={loading} />
      </AplusCard>

      {reports.length === 0 ? (
        <AplusCard style={styles.reportCard}>
          <AplusText variant="subtitle">Không có dữ liệu pin</AplusText>
          <AplusText variant="caption">Không tìm thấy lockId hoặc chưa có khóa trong repository.</AplusText>
        </AplusCard>
      ) : reports.map(report => <BatteryCard key={report.lockId} report={report} />)}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {gap: theme.spacing.md, borderColor: theme.colors.borderStrong},
  heroRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg},
  flexBlock: {flex: 1, gap: theme.spacing.xs},
  reportCard: {gap: theme.spacing.md},
  reportHeader: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md},
  trendRow: {flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.sm, paddingVertical: theme.spacing.md},
  trendColumn: {flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: theme.spacing.xs},
  trendBar: {width: '72%', borderRadius: theme.radius.sm, backgroundColor: theme.colors.primarySoft, borderWidth: 1, borderColor: theme.colors.borderStrong},
  metaWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  actionRow: {flexDirection: 'row', gap: theme.spacing.md},
  flexButton: {flex: 1},
});

import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {StatusChip} from '@/components/base/StatusChip';
import {BaseScreen} from '@/components/base/BaseScreen';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {MethodBreakdown, ReportExportFormat, RiskLock, TimeSeriesPoint} from '@/types/report';

function MetricCard({label, value, tone = 'muted'}: {label: string; value: string | number; tone?: 'success' | 'warning' | 'danger' | 'info' | 'muted'}) {
  const color = tone === 'success' ? theme.colors.success : tone === 'warning' ? theme.colors.warning : tone === 'danger' ? theme.colors.danger : tone === 'info' ? theme.colors.info : theme.colors.text;
  return (
    <AplusCard style={styles.metricCard}>
      <AplusText variant="caption">{label}</AplusText>
      <AplusText variant="title" color={color}>{value}</AplusText>
    </AplusCard>
  );
}

function MethodRow({item, maxCount}: {item: MethodBreakdown; maxCount: number}) {
  const widthPercent = Math.max(8, Math.round((item.count / Math.max(1, maxCount)) * 100));
  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownHeader}>
        <AplusText variant="body" style={styles.bold}>{item.method}</AplusText>
        <AplusText variant="caption">{item.count} lượt · {item.percentage}%</AplusText>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, {width: `${widthPercent}%`}]} />
      </View>
      <View style={styles.chipRow}>
        <StatusChip label={`Success ${item.successCount}`} tone="success" />
        <StatusChip label={`Fail ${item.failedCount}`} tone={item.failedCount > 0 ? 'warning' : 'muted'} />
      </View>
    </View>
  );
}

function RiskLockRow({item}: {item: RiskLock}) {
  const navigation = useAplusNavigation();
  const tone = item.riskScore >= 70 ? 'danger' : item.riskScore >= 40 ? 'warning' : 'info';
  return (
    <AplusCard style={styles.riskCard}>
      <View style={styles.rowBetween}>
        <View style={styles.flexText}>
          <AplusText variant="body" style={styles.bold}>{item.lockName}</AplusText>
          <AplusText variant="caption">{item.homeName} · {item.roomName}</AplusText>
        </View>
        <StatusChip label={`Risk ${item.riskScore}`} tone={tone} />
      </View>
      <View style={styles.chipRow}>
        <StatusChip label={`Failed ${item.failedCount}`} tone={item.failedCount > 0 ? 'warning' : 'muted'} />
        <StatusChip label={`Alert ${item.alertCount}`} tone={item.alertCount > 0 ? 'danger' : 'muted'} />
        <StatusChip label={`${item.activeCredentialCount} quyền`} tone="info" />
        {item.lowBattery ? <StatusChip label="Pin yếu" tone="warning" /> : null}
      </View>
      <AplusText variant="caption">{item.lastActivity}</AplusText>
      <View style={styles.actionRow}>
        <AplusButton title="Drilldown" leftIcon="matrix" variant="secondary" onPress={() => navigation.navigate('ReportDrilldown', {lockId: item.lockId})} style={styles.flexButton} />
        <AplusButton title="Khóa" leftIcon="door" variant="ghost" onPress={() => navigation.navigate('LockDetail', {lockId: item.lockId})} style={styles.flexButton} />
      </View>
    </AplusCard>
  );
}

function TimeSeriesMini({points}: {points: TimeSeriesPoint[]}) {
  const maxValue = Math.max(1, ...points.map(point => point.unlockCount + point.failedCount + point.alertCount));
  if (points.length === 0) {
    return <AplusText variant="caption">Chưa có dữ liệu timeseries.</AplusText>;
  }
  return (
    <View style={styles.seriesRow}>
      {points.map(point => {
        const height = Math.max(8, Math.round(((point.unlockCount + point.failedCount + point.alertCount) / maxValue) * 80));
        return (
          <View key={point.id} style={styles.seriesItem}>
            <View style={[styles.seriesBar, {height}]} />
            <AplusText variant="caption" numberOfLines={1}>{point.label}</AplusText>
          </View>
        );
      })}
    </View>
  );
}

export function ReportsScreen() {
  const navigation = useAplusNavigation();
  const {
    analyticsFilter,
    analyticsSummary,
    methodBreakdown,
    userBreakdown,
    riskLocks,
    reportTimeSeries,
    reportsLoading,
    lastReportExport,
    reloadAnalytics,
    exportAnalyticsReport,
  } = useAppState();
  const [exporting, setExporting] = useState<ReportExportFormat | undefined>();

  useEffect(() => {
    reloadAnalytics(analyticsFilter);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const maxMethodCount = useMemo(() => Math.max(1, ...methodBreakdown.map(item => item.count)), [methodBreakdown]);
  const hasData = Boolean(analyticsSummary && (analyticsSummary.totalRecords > 0 || riskLocks.length > 0));

  const exportReport = async (format: ReportExportFormat) => {
    setExporting(format);
    await exportAnalyticsReport(format);
    setExporting(undefined);
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Báo cáo dữ liệu" subtitle="UI-17 · Reports từ Records/Alerts/Battery" canGoBack onBack={navigation.goBack} showLogo rightIcon="settings" rightLabel="Filter" onRightPress={() => navigation.navigate('ReportFilters')} />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="matrix" size={40} color={theme.colors.primary} boxed boxSize={70} />
        <View style={styles.flexText}>
          <AplusText variant="hero">Reports</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>Tổng hợp KPI không hardcode: mở khóa, failed, cảnh báo, pin yếu và credential active.</AplusText>
          <View style={styles.chipRow}>
            <StatusChip label={`Range ${analyticsFilter.dateRange}`} tone="info" />
            <StatusChip label={`Home ${analyticsFilter.homeType}`} tone="muted" />
            {analyticsFilter.method && analyticsFilter.method !== 'all' ? <StatusChip label={analyticsFilter.method} tone="warning" /> : null}
          </View>
        </View>
      </AplusCard>

      <View style={styles.actionRow}>
        <AplusButton title="Filter nâng cao" leftIcon="settings" variant="secondary" onPress={() => navigation.navigate('ReportFilters')} style={styles.flexButton} />
        <AplusButton title="Refresh" leftIcon="refresh" variant="ghost" loading={reportsLoading} onPress={() => reloadAnalytics(analyticsFilter)} style={styles.flexButton} />
      </View>

      {analyticsSummary ? (
        <View style={styles.metricGrid}>
          <MetricCard label="Mở hôm nay" value={analyticsSummary.opensToday} tone="success" />
          <MetricCard label="Mở 7 ngày" value={analyticsSummary.opensWeek} tone="info" />
          <MetricCard label="Mở 30 ngày" value={analyticsSummary.opensMonth} tone="muted" />
          <MetricCard label="Failed/Blocked" value={analyticsSummary.failedCount} tone={analyticsSummary.failedCount > 0 ? 'warning' : 'success'} />
          <MetricCard label="Alert active" value={analyticsSummary.alertCount} tone={analyticsSummary.alertCount > 0 ? 'danger' : 'success'} />
          <MetricCard label="Pin yếu" value={analyticsSummary.lowBatteryCount} tone={analyticsSummary.lowBatteryCount > 0 ? 'warning' : 'success'} />
          <MetricCard label="Credential active" value={analyticsSummary.activeCredentialCount} tone="info" />
          <MetricCard label="Record" value={analyticsSummary.totalRecords} />
        </View>
      ) : null}

      {!hasData && !reportsLoading ? (
        <AplusCard style={styles.card}>
          <AplusText variant="subtitle">Không có dữ liệu báo cáo</AplusText>
          <AplusText variant="caption">Đổi filter hoặc tạo record từ Remote Unlock/Password/Alarm để kiểm thử empty state.</AplusText>
          <AplusButton title="Mở Records" leftIcon="history" variant="secondary" onPress={() => navigation.navigate('Activity')} />
        </AplusCard>
      ) : null}

      <AplusCard style={styles.card}>
        <View style={styles.rowBetween}>
          <AplusText variant="subtitle">Biểu đồ ngày/giờ</AplusText>
          <StatusChip label="TimeSeriesPoint" tone="info" />
        </View>
        <TimeSeriesMini points={reportTimeSeries} />
      </AplusCard>

      <AplusCard style={styles.card}>
        <View style={styles.rowBetween}>
          <AplusText variant="subtitle">Breakdown theo method</AplusText>
          <StatusChip label="MethodBreakdown" tone="info" />
        </View>
        {methodBreakdown.length === 0 ? <AplusText variant="caption">Chưa có method phù hợp filter.</AplusText> : methodBreakdown.map(item => <MethodRow key={item.method} item={item} maxCount={maxMethodCount} />)}
      </AplusCard>

      <AplusCard style={styles.card}>
        <View style={styles.rowBetween}>
          <AplusText variant="subtitle">Người dùng hoạt động nhiều</AplusText>
          <StatusChip label="Actor" tone="muted" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.userRow}>
          {userBreakdown.length === 0 ? <AplusText variant="caption">Chưa có actor phù hợp.</AplusText> : userBreakdown.map(user => (
            <AplusCard key={user.actorName} style={styles.userCard}>
              <AplusText variant="body" style={styles.bold} numberOfLines={1}>{user.actorName}</AplusText>
              <AplusText variant="title">{user.count}</AplusText>
              <AplusText variant="caption">OK {user.successCount} · Fail {user.failedCount}</AplusText>
            </AplusCard>
          ))}
        </ScrollView>
      </AplusCard>

      <View style={styles.sectionTitle}>
        <AplusText variant="subtitle">Khóa/phòng rủi ro</AplusText>
        <AplusText variant="caption">Drilldown sang Records / Alerts / Battery.</AplusText>
      </View>
      {riskLocks.length === 0 ? (
        <AplusCard style={styles.card}><AplusText variant="caption">Không có khóa rủi ro trong filter hiện tại.</AplusText></AplusCard>
      ) : riskLocks.map(item => <RiskLockRow key={item.lockId} item={item} />)}

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Export nội bộ</AplusText>
        <AplusText variant="caption">Mock export trả fileName/content trong state để backend sau này thay bằng file thật.</AplusText>
        <View style={styles.actionRow}>
          <AplusButton title="CSV" leftIcon="history" variant="secondary" loading={exporting === 'csv'} onPress={() => exportReport('csv')} style={styles.flexButton} />
          <AplusButton title="JSON" leftIcon="command" variant="secondary" loading={exporting === 'json'} onPress={() => exportReport('json')} style={styles.flexButton} />
          <AplusButton title="PDF" leftIcon="credential" variant="secondary" loading={exporting === 'pdf'} onPress={() => exportReport('pdf')} style={styles.flexButton} />
        </View>
        {lastReportExport ? (
          <AplusCard style={styles.exportCard}>
            <AplusText variant="body" style={styles.bold}>{lastReportExport.fileName}</AplusText>
            <AplusText variant="caption">{lastReportExport.mimeType} · {lastReportExport.rowCount} dòng · {new Date(lastReportExport.createdAt).toLocaleString('vi-VN')}</AplusText>
            <AplusText variant="caption" numberOfLines={4}>{lastReportExport.content}</AplusText>
          </AplusCard>
        ) : null}
      </AplusCard>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, borderColor: theme.colors.borderStrong},
  flexText: {flex: 1, gap: theme.spacing.xs},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  actionRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md},
  flexButton: {flexBasis: '30%', flexGrow: 1},
  metricGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md},
  metricCard: {flexBasis: '45%', flexGrow: 1, gap: theme.spacing.xs},
  card: {gap: theme.spacing.md},
  rowBetween: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md},
  breakdownRow: {gap: theme.spacing.sm, paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  breakdownHeader: {flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md},
  bold: {fontWeight: theme.typography.weight.bold},
  barTrack: {height: 10, borderRadius: theme.radius.pill, overflow: 'hidden', backgroundColor: theme.colors.surfaceStrong, borderWidth: 1, borderColor: theme.colors.border},
  barFill: {height: '100%', borderRadius: theme.radius.pill, backgroundColor: theme.colors.primary},
  riskCard: {gap: theme.spacing.md},
  seriesRow: {height: 116, flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.sm, paddingTop: theme.spacing.md},
  seriesItem: {flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: theme.spacing.xs},
  seriesBar: {width: '80%', minWidth: 10, borderRadius: theme.radius.md, backgroundColor: theme.colors.primary, borderWidth: 1, borderColor: theme.colors.borderStrong},
  userRow: {gap: theme.spacing.md, paddingRight: theme.spacing.xl},
  userCard: {width: 170, gap: theme.spacing.xs},
  sectionTitle: {gap: theme.spacing.xs},
  exportCard: {backgroundColor: theme.colors.surfaceStrong, gap: theme.spacing.xs},
});

import React, {useEffect, useMemo} from 'react';
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

function valueTone(value: number): 'success' | 'warning' | 'danger' | 'info' {
  if (value >= 70) {
    return 'danger';
  }
  if (value >= 40) {
    return 'warning';
  }
  if (value > 0) {
    return 'info';
  }
  return 'success';
}

export function ReportDrilldownScreen({lockId}: {lockId: string}) {
  const navigation = useAplusNavigation();
  const {analyticsFilter, riskLocks, accessRecords, alerts, locks, reloadAnalytics} = useAppState();

  useEffect(() => {
    reloadAnalytics({...analyticsFilter, lockId});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const lock = useMemo(() => locks.find(item => item.id === lockId), [lockId, locks]);
  const risk = useMemo(() => riskLocks.find(item => item.lockId === lockId), [lockId, riskLocks]);
  const records = useMemo(() => accessRecords.filter(record => record.lockId === lockId).slice(0, 6), [accessRecords, lockId]);
  const lockAlerts = useMemo(() => alerts.filter(alert => alert.lockId === lockId && alert.status !== 'resolved' && alert.status !== 'ignored'), [alerts, lockId]);

  if (!lock) {
    return (
      <BaseScreen contentStyle={styles.container}>
        <AplusHeader title="Không tìm thấy khóa" canGoBack onBack={navigation.goBack} showLogo />
        <AplusCard style={styles.card}>
          <AplusText variant="body">Không có lockId: {lockId}</AplusText>
          <AplusButton title="Quay lại" onPress={navigation.goBack} />
        </AplusCard>
      </BaseScreen>
    );
  }

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Drilldown theo khóa" subtitle="UI-58 · Records/Alerts/Battery liên quan" canGoBack onBack={navigation.goBack} showLogo rightIcon="settings" rightLabel="Filter" onRightPress={() => navigation.navigate('ReportFilters')} />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="matrix" size={42} color={theme.colors.primary} boxed boxSize={72} />
        <View style={styles.flexText}>
          <AplusText variant="hero">{lock.name}</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>{lock.homeName} · {lock.roomName}</AplusText>
          <View style={styles.chipRow}>
            <StatusChip label={lock.connectionState} tone={lock.connectionState === 'offline' ? 'danger' : 'success'} />
            <StatusChip label={`${lock.batteryPercent}% pin`} tone={lock.batteryPercent <= lock.settings.lowBatteryThreshold ? 'warning' : 'success'} />
            <StatusChip label={`${lock.activeCredentialCount} quyền`} tone="info" />
          </View>
        </View>
      </AplusCard>

      <View style={styles.metricGrid}>
        <AplusCard style={styles.metricCard}><AplusText variant="caption">Risk score</AplusText><AplusText variant="title" color={risk?.riskScore && risk.riskScore >= 40 ? theme.colors.warning : theme.colors.success}>{risk?.riskScore ?? 0}</AplusText></AplusCard>
        <AplusCard style={styles.metricCard}><AplusText variant="caption">Failed</AplusText><AplusText variant="title" color={risk?.failedCount ? theme.colors.warning : theme.colors.success}>{risk?.failedCount ?? 0}</AplusText></AplusCard>
        <AplusCard style={styles.metricCard}><AplusText variant="caption">Alert active</AplusText><AplusText variant="title" color={lockAlerts.length ? theme.colors.danger : theme.colors.success}>{lockAlerts.length}</AplusText></AplusCard>
        <AplusCard style={styles.metricCard}><AplusText variant="caption">Credential</AplusText><AplusText variant="title" color={theme.colors.info}>{lock.activeCredentialCount}</AplusText></AplusCard>
      </View>

      <AplusCard style={styles.card}>
        <View style={styles.rowBetween}>
          <AplusText variant="subtitle">Điểm rủi ro</AplusText>
          <StatusChip label={`Risk ${risk?.riskScore ?? 0}`} tone={valueTone(risk?.riskScore ?? 0)} />
        </View>
        <AplusText variant="body">{risk ? `Failed ${risk.failedCount}, Alert ${risk.alertCount}, pin yếu ${risk.lowBattery ? 'có' : 'không'}.` : 'Khóa chưa có dấu hiệu rủi ro trong filter hiện tại.'}</AplusText>
        <AplusText variant="caption">{lock.lastActivity}</AplusText>
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Drilldown nhanh</AplusText>
        <View style={styles.actionRow}>
          <AplusButton title="Records" leftIcon="history" variant="secondary" onPress={() => navigation.navigate('Activity')} style={styles.flexButton} />
          <AplusButton title="Alerts" leftIcon="alert" variant="secondary" onPress={() => navigation.navigate('AlarmCenter', {lockId})} style={styles.flexButton} />
          <AplusButton title="Battery" leftIcon="battery" variant="secondary" onPress={() => navigation.navigate('BatteryPower', {lockId})} style={styles.flexButton} />
          <AplusButton title="Lock detail" leftIcon="door" variant="ghost" onPress={() => navigation.navigate('LockDetail', {lockId})} style={styles.flexButton} />
        </View>
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Records gần nhất</AplusText>
        {records.length === 0 ? <AplusText variant="caption">Chưa có record cho khóa này.</AplusText> : records.map(record => (
          <AplusCard key={record.id} style={styles.innerCard}>
            <View style={styles.rowBetween}>
              <View style={styles.flexText}>
                <AplusText variant="body" style={styles.bold}>{record.method} · {record.actorName}</AplusText>
                <AplusText variant="caption">{new Date(record.createdAt).toLocaleString('vi-VN')}</AplusText>
              </View>
              <StatusChip label={record.result} tone={record.result === 'success' ? 'success' : 'warning'} />
            </View>
            <AplusText variant="caption">{record.message}</AplusText>
            <AplusButton title="Mở record" leftIcon="history" variant="ghost" onPress={() => navigation.navigate('RecordDetail', {recordId: record.id})} />
          </AplusCard>
        ))}
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Alerts active</AplusText>
        {lockAlerts.length === 0 ? <AplusText variant="caption">Không còn cảnh báo active.</AplusText> : lockAlerts.map(alert => (
          <AplusCard key={alert.id} style={styles.innerCard}>
            <View style={styles.rowBetween}>
              <AplusText variant="body" style={styles.bold}>{alert.title}</AplusText>
              <StatusChip label={alert.severity} tone={alert.severity === 'Critical' || alert.severity === 'High' ? 'danger' : 'warning'} />
            </View>
            <AplusText variant="caption">{alert.message}</AplusText>
            <AplusButton title="Chi tiết cảnh báo" leftIcon="alert" variant="ghost" onPress={() => navigation.navigate('AlertDetail', {alertId: alert.id})} />
          </AplusCard>
        ))}
      </AplusCard>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, borderColor: theme.colors.borderStrong},
  flexText: {flex: 1, gap: theme.spacing.xs},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  metricGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md},
  metricCard: {flexBasis: '45%', flexGrow: 1, gap: theme.spacing.xs},
  card: {gap: theme.spacing.md},
  innerCard: {gap: theme.spacing.sm, backgroundColor: theme.colors.surfaceStrong},
  rowBetween: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md},
  actionRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md},
  flexButton: {flexBasis: '44%', flexGrow: 1},
  bold: {fontWeight: theme.typography.weight.bold},
});

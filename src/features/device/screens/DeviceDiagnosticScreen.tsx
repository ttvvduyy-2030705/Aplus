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
import type {DeviceDiagnostic, DeviceDiagnosticIssue} from '@/types/lock';

function severityTone(issue: DeviceDiagnosticIssue) {
  if (issue.severity === 'critical') {
    return 'danger' as const;
  }
  if (issue.severity === 'warning') {
    return 'warning' as const;
  }
  return 'success' as const;
}

function healthTone(status?: DeviceDiagnostic['status']) {
  if (status === 'critical') {
    return 'danger' as const;
  }
  if (status === 'attention') {
    return 'warning' as const;
  }
  return 'success' as const;
}

function Metric({label, value, tone}: {label: string; value: string; tone?: 'success' | 'warning' | 'danger' | 'info' | 'muted'}) {
  return (
    <AplusCard style={styles.metricCard}>
      <AplusText variant="caption">{label}</AplusText>
      <AplusText variant="subtitle">{value}</AplusText>
      {tone ? <StatusChip label={tone} tone={tone} /> : null}
    </AplusCard>
  );
}

export function DeviceDiagnosticScreen({lockId}: {lockId: string}) {
  const navigation = useAplusNavigation();
  const {findLock, getDeviceDiagnostic} = useAppState();
  const lock = useMemo(() => findLock(lockId), [findLock, lockId]);
  const [diagnostic, setDiagnostic] = useState<DeviceDiagnostic | undefined>();
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    const result = await getDeviceDiagnostic(lockId);
    setDiagnostic(result);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockId, lock?.batteryPercent, lock?.connectionState, lock?.firmwareVersion]);

  if (!lock) {
    return (
      <BaseScreen>
        <AplusHeader title="Diagnostic sức khỏe khóa" subtitle="UI-44" canGoBack onBack={navigation.goBack} showLogo />
        <AplusCard style={styles.cardGap}>
          <AplusText variant="body">Không tìm thấy lockId: {lockId}</AplusText>
          <AplusButton title="Quay lại" onPress={navigation.goBack} />
        </AplusCard>
      </BaseScreen>
    );
  }

  const status = diagnostic?.status ?? 'healthy';
  const healthScore = diagnostic?.healthScore ?? 100;

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Diagnostic sức khỏe khóa" subtitle="UI-44 · Device health" canGoBack onBack={navigation.goBack} showLogo rightIcon="firmware" onRightPress={() => navigation.navigate('FirmwareOta', {lockId})} />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.scoreCircle}>
            <AplusText variant="hero">{healthScore}</AplusText>
            <AplusText variant="caption">/100</AplusText>
          </View>
          <View style={styles.flexBlock}>
            <AplusText variant="hero">{status === 'healthy' ? 'Khỏe mạnh' : status === 'attention' ? 'Cần chú ý' : 'Nghiêm trọng'}</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>{lock.name} · {lock.hardwareModel ?? 'Aplus Mock'}</AplusText>
            <View style={styles.chipRow}>
              <StatusChip label={status} tone={healthTone(status)} />
              <StatusChip label={diagnostic ? new Date(diagnostic.checkedAt).toLocaleTimeString('vi-VN') : 'Đang kiểm'} tone="info" />
            </View>
          </View>
        </View>
        <AplusButton title="Chạy diagnostic lại" leftIcon="refresh" variant="secondary" onPress={runDiagnostic} loading={loading} />
      </AplusCard>

      <View style={styles.metricGrid}>
        <Metric label="Gateway" value={diagnostic?.connection.gatewayOnline ? 'Online' : 'Offline'} tone={diagnostic?.connection.gatewayOnline ? 'success' : 'danger'} />
        <Metric label="Signal" value={`${diagnostic?.connection.signalPercent ?? lock.signalPercent}%`} tone={(diagnostic?.connection.signalPercent ?? lock.signalPercent) < 40 ? 'warning' : 'success'} />
      </View>
      <View style={styles.metricGrid}>
        <Metric label="Battery" value={`${diagnostic?.battery.percent ?? lock.batteryPercent}%`} tone={(diagnostic?.battery.percent ?? lock.batteryPercent) <= lock.settings.lowBatteryThreshold ? 'warning' : 'success'} />
        <Metric label="Firmware" value={diagnostic?.firmware.currentVersion ?? lock.firmwareVersion} tone={diagnostic?.firmware.updateAvailable ? 'warning' : 'success'} />
      </View>

      <AplusCard style={styles.cardGap}>
        <View style={styles.rowBetween}>
          <AplusText variant="subtitle">Mã lỗi & khuyến nghị</AplusText>
          <StatusChip label={`${diagnostic?.errorCodes.length ?? 0} codes`} tone={(diagnostic?.errorCodes.length ?? 0) > 1 ? 'warning' : 'success'} />
        </View>
        {(diagnostic?.issues ?? []).map(issue => (
          <View key={issue.code} style={styles.issueRow}>
            <AplusIcon name={issue.severity === 'ok' ? 'check' : 'alert'} size={22} color={issue.severity === 'ok' ? theme.colors.success : issue.severity === 'critical' ? theme.colors.danger : theme.colors.warning} boxed />
            <View style={styles.flexBlock}>
              <View style={styles.rowBetween}>
                <AplusText variant="body" style={styles.bold}>{issue.title}</AplusText>
                <StatusChip label={issue.code} tone={severityTone(issue)} />
              </View>
              <AplusText variant="caption">{issue.message}</AplusText>
            </View>
          </View>
        ))}
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">Diagnostic package mock</AplusText>
        <AplusText variant="caption">Bao gồm device info, recent commands, alert codes, OTA log và app version. Không chứa password, mã PIN thô, biometric template hoặc dữ liệu nhạy cảm.</AplusText>
        <View style={styles.actionRow}>
          <AplusButton title="Phần cứng" leftIcon="gateway" variant="secondary" onPress={() => navigation.navigate('HardwareDetail', {lockId})} style={styles.flexButton} />
          <AplusButton title="Cài đặt" leftIcon="settings" variant="secondary" onPress={() => navigation.navigate('DeviceSettings', {lockId})} style={styles.flexButton} />
        </View>
      </AplusCard>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  cardGap: {gap: theme.spacing.md},
  heroCard: {gap: theme.spacing.md, borderColor: theme.colors.borderStrong},
  heroRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg},
  scoreCircle: {width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.primarySoft},
  flexBlock: {flex: 1, gap: theme.spacing.xs},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  metricGrid: {flexDirection: 'row', gap: theme.spacing.md},
  metricCard: {flex: 1, gap: theme.spacing.sm},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md},
  issueRow: {flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong},
  bold: {fontWeight: theme.typography.weight.bold},
  actionRow: {flexDirection: 'row', gap: theme.spacing.md},
  flexButton: {flex: 1},
});

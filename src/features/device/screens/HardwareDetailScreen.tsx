import React, {useEffect, useState} from 'react';
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
import type {DeviceCapabilityMatrix} from '@/types/lock';

function InfoRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.infoRow}>
      <AplusText variant="caption" color={theme.colors.textMuted}>{label}</AplusText>
      <AplusText variant="body" style={styles.infoValue}>{value}</AplusText>
    </View>
  );
}

export function HardwareDetailScreen({lockId}: {lockId: string}) {
  const navigation = useAplusNavigation();
  const {findLock, getCapabilityMatrix} = useAppState();
  const lock = findLock(lockId);
  const [matrix, setMatrix] = useState<DeviceCapabilityMatrix | undefined>();

  useEffect(() => {
    let mounted = true;
    getCapabilityMatrix(lockId).then(result => {
      if (mounted) {
        setMatrix(result);
      }
    });
    return () => {
      mounted = false;
    };
  }, [getCapabilityMatrix, lockId]);

  if (!lock) {
    return (
      <BaseScreen>
        <AplusHeader title="Chi tiết phần cứng" subtitle="UI-42" canGoBack onBack={navigation.goBack} showLogo />
        <AplusCard style={styles.cardGap}>
          <AplusText variant="body">Không tìm thấy lockId: {lockId}</AplusText>
          <AplusButton title="Quay lại" onPress={navigation.goBack} />
        </AplusCard>
      </BaseScreen>
    );
  }

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Chi tiết phần cứng" subtitle="UI-42 · Hardware/Connection" canGoBack onBack={navigation.goBack} showLogo rightIcon="shield" onRightPress={() => navigation.navigate('DeviceDiagnostic', {lockId})} />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <AplusIcon name="gateway" size={48} color={theme.colors.primary} boxed boxSize={80} />
          <View style={styles.flexBlock}>
            <AplusText variant="hero">{lock.hardwareModel ?? 'Aplus Mock'}</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>{lock.name} · {lock.roomName}</AplusText>
            <View style={styles.chipRow}>
              <StatusChip label={lock.connectionState} tone={lock.connectionState === 'offline' ? 'danger' : 'success'} />
              <StatusChip label={`${lock.signalPercent}% signal`} tone={lock.signalPercent < 40 ? 'warning' : 'success'} />
              <StatusChip label={lock.gatewayOnline ? 'Gateway online' : 'Gateway offline'} tone={lock.gatewayOnline ? 'success' : 'danger'} />
            </View>
          </View>
        </View>
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">Thông tin thiết bị</AplusText>
        <InfoRow label="Serial" value={lock.serial} />
        <InfoRow label="Model" value={lock.hardwareModel ?? 'Aplus Mock'} />
        <InfoRow label="Firmware" value={lock.firmwareVersion} />
        <InfoRow label="Gateway" value={lock.gatewayName ?? 'Chưa bind gateway'} />
        <InfoRow label="Last seen" value={lock.lastSeenAt} />
        <InfoRow label="Battery" value={`${lock.batteryPercent}% · ${lock.batteryState}`} />
        <InfoRow label="Door sensor" value={lock.doorState} />
        <InfoRow label="Sync" value={lock.syncState} />
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <View style={styles.rowBetween}>
          <AplusText variant="subtitle">Capability matrix theo model</AplusText>
          <StatusChip label="UI-69" tone="info" />
        </View>
        {(matrix?.entries ?? []).map(entry => (
          <View key={entry.key} style={styles.capRow}>
            <View style={styles.flexBlock}>
              <AplusText variant="body" style={styles.bold}>{entry.label}</AplusText>
              <AplusText variant="caption">Route: {entry.routeHint}</AplusText>
            </View>
            <StatusChip label={entry.enabled ? 'Hỗ trợ' : 'Không hỗ trợ'} tone={entry.enabled ? 'success' : 'danger'} />
          </View>
        ))}
        <AplusButton title="Mở màn kiểm tra tương thích" leftIcon="capability" variant="secondary" onPress={() => navigation.navigate('CompatibilityCheck', {lockId})} />
      </AplusCard>

      <View style={styles.actionRow}>
        <AplusButton title="OTA" leftIcon="firmware" onPress={() => navigation.navigate('FirmwareOta', {lockId})} style={styles.flexButton} />
        <AplusButton title="Diagnostic" leftIcon="shield" variant="secondary" onPress={() => navigation.navigate('DeviceDiagnostic', {lockId})} style={styles.flexButton} />
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  cardGap: {gap: theme.spacing.md},
  heroCard: {gap: theme.spacing.md, borderColor: theme.colors.borderStrong},
  heroRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg},
  flexBlock: {flex: 1, gap: theme.spacing.xs},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  infoRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md, paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  infoValue: {flex: 1, textAlign: 'right', fontWeight: theme.typography.weight.semibold},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md},
  capRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surfaceStrong, borderWidth: 1, borderColor: theme.colors.border},
  bold: {fontWeight: theme.typography.weight.bold},
  actionRow: {flexDirection: 'row', gap: theme.spacing.md},
  flexButton: {flex: 1},
});

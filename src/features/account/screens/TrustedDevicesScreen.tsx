import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {ConfirmDialog} from '@/components/base/ConfirmDialog';
import {StatusChip} from '@/components/base/StatusChip';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {TrustedDevice} from '@/types/account';

function timeAgo(timestamp: number) {
  const diffMinutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  }
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) {
    return `${hours} giờ trước`;
  }
  return `${Math.round(hours / 24)} ngày trước`;
}

function riskTone(risk: TrustedDevice['risk']) {
  if (risk === 'suspicious') {
    return 'danger' as const;
  }
  if (risk === 'new') {
    return 'warning' as const;
  }
  return 'success' as const;
}

export function TrustedDevicesScreen() {
  const navigation = useAplusNavigation();
  const {trustedDevices, reloadAccountSecurity, revokeTrustedDevice, renameTrustedDevice, logoutMock} = useAppState();
  const [confirmDevice, setConfirmDevice] = useState<TrustedDevice | undefined>();
  const [renamingId, setRenamingId] = useState<string | undefined>();
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    reloadAccountSecurity();
  }, [reloadAccountSecurity]);

  const revoke = async () => {
    const device = confirmDevice;
    setConfirmDevice(undefined);
    if (!device) {
      return;
    }
    await revokeTrustedDevice(device.id);
    if (device.current) {
      await logoutMock(true);
      navigation.reset('Login');
    }
  };

  const startRename = (device: TrustedDevice) => {
    setRenamingId(device.id);
    setRenameValue(device.name);
  };

  const saveRename = async () => {
    if (!renamingId) {
      return;
    }
    await renameTrustedDevice(renamingId, renameValue);
    setRenamingId(undefined);
    setRenameValue('');
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Thiết bị tin cậy" subtitle="UI-62 · session, biometric và revoke" canGoBack onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Tổng quan đăng nhập</AplusText>
        <View style={styles.summaryGrid}>
          <Summary label="Tin cậy" value={String(trustedDevices.filter(device => device.trusted).length)} tone="success" />
          <Summary label="Rủi ro" value={String(trustedDevices.filter(device => device.risk === 'suspicious').length)} tone="danger" />
          <Summary label="Biometric" value={String(trustedDevices.filter(device => device.biometricEnabled).length)} tone="info" />
        </View>
      </AplusCard>

      <View style={styles.list}>
        {trustedDevices.map(device => (
          <AplusCard key={device.id} style={styles.deviceCard}>
            <View style={styles.deviceHeader}>
              <AplusIcon name={device.platform === 'web' ? 'office' : 'phone'} size={28} color={theme.colors.primary} boxed boxSize={54} />
              <View style={styles.deviceTitle}>
                <AplusText variant="subtitle">{device.name}</AplusText>
                <AplusText variant="caption">{device.model} · {device.locationHint}</AplusText>
              </View>
              <StatusChip label={device.current ? 'Hiện tại' : device.trusted ? 'Tin cậy' : 'Đã revoke'} tone={device.trusted ? 'success' : 'muted'} />
            </View>

            <View style={styles.metaGrid}>
              <Meta label="Lần cuối" value={timeAgo(device.lastActiveAt)} />
              <Meta label="Biometric" value={device.biometricEnabled ? 'Bật' : 'Tắt'} />
              <Meta label="Risk" value={device.risk} tone={riskTone(device.risk)} />
            </View>

            {renamingId === device.id ? (
              <View style={styles.renameBox}>
                <AplusTextField label="Tên thiết bị" leftIcon="phone" value={renameValue} onChangeText={setRenameValue} />
                <View style={styles.actionsRow}>
                  <AplusButton title="Huỷ" variant="secondary" onPress={() => setRenamingId(undefined)} style={styles.flexButton} />
                  <AplusButton title="Lưu tên" leftIcon="check" onPress={saveRename} style={styles.flexButton} />
                </View>
              </View>
            ) : (
              <View style={styles.actionsRow}>
                <AplusButton title="Đổi tên" variant="secondary" leftIcon="settings" onPress={() => startRename(device)} style={styles.flexButton} />
                <AplusButton title="Revoke" variant="danger" leftIcon="revoked" onPress={() => setConfirmDevice(device)} disabled={!device.trusted} style={styles.flexButton} />
              </View>
            )}
          </AplusCard>
        ))}
      </View>

      <ConfirmDialog
        visible={Boolean(confirmDevice)}
        title="Revoke thiết bị?"
        message={confirmDevice?.current ? 'Thiết bị hiện tại sẽ mất session và quay về Login.' : 'Thiết bị này sẽ mất quyền trusted device và biometric login.'}
        confirmText="Revoke"
        cancelText="Huỷ"
        destructive
        onCancel={() => setConfirmDevice(undefined)}
        onConfirm={revoke}
      />
    </BaseScreen>
  );
}

function Summary({label, value, tone}: {label: string; value: string; tone: 'success' | 'danger' | 'info'}) {
  return (
    <View style={styles.summaryItem}>
      <AplusText variant="caption" color={theme.colors.textSubtle}>{label}</AplusText>
      <AplusText variant="title">{value}</AplusText>
      <StatusChip label={label} tone={tone} />
    </View>
  );
}

function Meta({label, value, tone}: {label: string; value: string; tone?: 'success' | 'warning' | 'danger'}) {
  return (
    <View style={styles.metaItem}>
      <AplusText variant="caption" color={theme.colors.textSubtle}>{label}</AplusText>
      {tone ? <StatusChip label={value} tone={tone} /> : <AplusText variant="body">{value}</AplusText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  card: {
    gap: theme.spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  summaryItem: {
    flex: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceStrong,
  },
  list: {
    gap: theme.spacing.md,
  },
  deviceCard: {
    gap: theme.spacing.md,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  deviceTitle: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  metaGrid: {
    gap: theme.spacing.sm,
  },
  metaItem: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  renameBox: {
    gap: theme.spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flexButton: {
    flex: 1,
  },
});

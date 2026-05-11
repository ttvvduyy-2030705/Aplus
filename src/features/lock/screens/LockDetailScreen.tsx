import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {StatusChip} from '@/components/base/StatusChip';
import {QuickActionTile} from '@/features/lock/components/QuickActionTile';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {AplusLock} from '@/types/lock';

function connectionLabel(lock: AplusLock) {
  if (lock.connectionState === 'online' || lock.connectionState === 'syncing') {
    return lock.gatewayOnline ? 'Online qua Gateway' : 'Online cục bộ';
  }
  if (lock.connectionState === 'bluetooth-only') {
    return 'Bluetooth only';
  }
  return 'Offline';
}

function InfoRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.infoRow}>
      <AplusText variant="caption" color={theme.colors.textMuted}>{label}</AplusText>
      <AplusText variant="body" style={styles.infoValue}>{value}</AplusText>
    </View>
  );
}

export function LockDetailScreen({lockId}: {lockId: string}) {
  const navigation = useAplusNavigation();
  const {locks, accessRecords, evaluateRemoteUnlock, isOffline} = useAppState();
  const lock = useMemo(() => locks.find(item => item.id === lockId), [lockId, locks]);

  if (!lock) {
    return (
      <BaseScreen>
        <AplusHeader title="Không tìm thấy khóa" canGoBack onBack={navigation.goBack} showLogo />
        <AplusCard style={styles.card}>
          <AplusText variant="body">Không tìm thấy lockId: {lockId}</AplusText>
          <AplusButton title="Quay lại" onPress={navigation.goBack} />
        </AplusCard>
      </BaseScreen>
    );
  }

  const remoteCheck = evaluateRemoteUnlock(lock.id);
  const lastCommandRecord = accessRecords.find(record => record.lockId === lock.id && record.commandId);
  const canSendLock = !isOffline && lock.connectionState !== 'offline' && lock.permission.canLock;

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={lock.name} subtitle={`${lock.homeName} · ${lock.roomName}`} canGoBack onBack={navigation.goBack} showLogo rightIcon="settings" onRightPress={() => navigation.navigate('DeviceSettings', {lockId: lock.id})} />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.lockCircle}>
            <AplusIcon name={lock.isLocked ? 'lock' : 'unlock'} size={62} color={lock.isLocked ? theme.colors.primary : theme.colors.success} />
          </View>
          <View style={styles.heroTextBlock}>
            <AplusText variant="hero">{lock.isLocked ? 'Đang khóa' : 'Đang mở'}</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>{lock.address}</AplusText>
            <View style={styles.chipRowLeft}>
              <StatusChip label={connectionLabel(lock)} tone={lock.connectionState === 'offline' ? 'danger' : lock.connectionState === 'bluetooth-only' ? 'warning' : 'success'} />
              <StatusChip label={`${lock.batteryPercent}% pin`} tone={lock.batteryPercent <= lock.settings.lowBatteryThreshold ? 'warning' : 'success'} />
            </View>
          </View>
        </View>

        <View style={styles.primaryActions}>
          <AplusButton
            title={lock.isLocked ? 'Mở khóa từ xa' : 'Khóa lại'}
            leftIcon={lock.isLocked ? 'remote' : 'lock'}
            onPress={() => navigation.navigate('RemoteUnlock', {lockId: lock.id})}
            disabled={lock.isLocked ? !remoteCheck.canProceed : !canSendLock}
            variant={lock.isLocked ? 'primary' : 'secondary'}
            style={styles.flexButton}
          />
          <AplusButton title="Thêm quyền" leftIcon="key" variant="ghost" onPress={() => navigation.navigate('CredentialHub', {lockId: lock.id})} style={styles.flexButton} />
        </View>
      </AplusCard>

      {!remoteCheck.canProceed && lock.isLocked ? (
        <AplusCard style={styles.warningCard}>
          <AplusIcon name="alert" size={24} color={theme.colors.warning} />
          <View style={styles.warningText}>
            <AplusText variant="subtitle" color={theme.colors.warning}>Remote unlock đang bị chặn</AplusText>
            <AplusText variant="caption">Mở màn Remote Unlock để xem checklist quyền, setting, gateway và trạng thái online.</AplusText>
          </View>
        </AplusCard>
      ) : null}

      <AplusCard style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <AplusText variant="subtitle">Trạng thái thiết bị</AplusText>
          <StatusChip label={lock.syncState === 'synced' ? 'Đã đồng bộ' : 'Chờ đồng bộ'} tone={lock.syncState === 'synced' ? 'success' : 'warning'} />
        </View>
        <View style={styles.infoGrid}>
          <InfoRow label="Model" value={lock.hardwareModel ?? 'Aplus Mock'} />
          <InfoRow label="Serial" value={lock.serial} />
          <InfoRow label="Gateway" value={lock.gatewayName ?? 'Chưa có'} />
          <InfoRow label="Firmware" value={lock.firmwareVersion} />
          <InfoRow label="Tín hiệu" value={`${lock.signalPercent}%`} />
          <InfoRow label="Cửa" value={lock.doorState === 'left-open' ? 'Mở quá lâu' : lock.doorState === 'open' ? 'Đang mở' : lock.doorState === 'closed' ? 'Đóng' : 'Không rõ'} />
        </View>
      </AplusCard>

      <View style={styles.sectionTitleRow}>
        <AplusText variant="subtitle">Tác vụ nhanh</AplusText>
        <AplusText variant="caption">Routing theo lockId: {lock.id}</AplusText>
      </View>

      <View style={styles.gridRow}>
        <QuickActionTile icon="key" title="Thêm quyền" subtitle="UI-16 Credential Hub" onPress={() => navigation.navigate('CredentialHub', {lockId: lock.id})} />
        <QuickActionTile icon="password" title="Mã PIN" subtitle="UI-03/26/45/46" onPress={() => navigation.navigate('PasswordManager', {lockId: lock.id})} />
      </View>
      <View style={styles.gridRow}>
        <QuickActionTile icon="fingerprint" title="Vân tay" subtitle="Capability checked" disabled={!lock.capabilities.supportsFingerprint} badge={!lock.capabilities.supportsFingerprint ? 'Khóa' : undefined} onPress={() => navigation.navigate('FingerprintEnroll', {lockId: lock.id})} />
        <QuickActionTile icon="face" title="Khuôn mặt" subtitle="Camera/face unlock" disabled={!lock.capabilities.supportsFace} badge={!lock.capabilities.supportsFace ? 'Khóa' : undefined} onPress={() => navigation.navigate('FaceEnroll', {lockId: lock.id})} />
      </View>
      <View style={styles.gridRow}>
        <QuickActionTile icon="card" title="Thẻ" subtitle="Card/NFC/khách sạn" disabled={!lock.capabilities.supportsCard} onPress={() => navigation.navigate('CardManage', {lockId: lock.id})} />
        <QuickActionTile icon="remote" title="Remote" subtitle="Điều khiển vật lý" disabled={!lock.capabilities.supportsRemoteControl} badge={!lock.capabilities.supportsRemoteControl ? 'Khóa' : undefined} onPress={() => navigation.navigate('RemoteControl', {lockId: lock.id})} />
      </View>
      <View style={styles.gridRow}>
        <QuickActionTile icon="phone" title="Ủy quyền phone" subtitle="Invite QR/link" onPress={() => navigation.navigate('PhoneAuthorization', {lockId: lock.id})} />
        <QuickActionTile icon="more" title="More" subtitle="Settings, OTA, alarm" onPress={() => navigation.navigate('MoreHub', {lockId: lock.id})} />
      </View>

      <AplusCard style={styles.card}>
        <View style={styles.statusHeader}>
          <AplusText variant="subtitle">Command & audit gần nhất</AplusText>
          <AplusIcon name="command" size={22} color={theme.colors.primary} />
        </View>
        {lastCommandRecord ? (
          <>
            <AplusText variant="body">{lastCommandRecord.message}</AplusText>
            <AplusText variant="caption">{lastCommandRecord.actorName} · {new Date(lastCommandRecord.createdAt).toLocaleString('vi-VN')}</AplusText>
          </>
        ) : (
          <AplusText variant="caption">Command và mật khẩu mock sẽ ghi vào Records để kiểm thử audit.</AplusText>
        )}
        <AplusButton title="Xem lịch sử" leftIcon="history" variant="secondary" onPress={() => navigation.navigate('Activity')} />
      </AplusCard>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  heroCard: {
    gap: theme.spacing.lg,
    borderColor: theme.colors.borderStrong,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  lockCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  heroTextBlock: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  chipRowLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flexButton: {
    flex: 1,
  },
  warningCard: {
    borderColor: 'rgba(253,176,34,0.34)',
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  statusCard: {
    gap: theme.spacing.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  infoGrid: {
    gap: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontWeight: theme.typography.weight.semibold,
  },
  sectionTitleRow: {
    gap: theme.spacing.xs,
  },
  gridRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  card: {
    gap: theme.spacing.md,
  },
});

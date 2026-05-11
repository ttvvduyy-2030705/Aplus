import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon, type AplusIconName} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {BaseScreen} from '@/components/base/BaseScreen';
import {StatusChip} from '@/components/base/StatusChip';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {LockSettings} from '@/types/lock';

function boolLabel(value: boolean) {
  return value ? 'Đang bật' : 'Đang tắt';
}

function SettingToggle({icon, title, description, value, disabled, onToggle}: {icon: AplusIconName; title: string; description: string; value: boolean; disabled?: boolean; onToggle: () => void}) {
  return (
    <Pressable disabled={disabled} onPress={onToggle} style={[styles.settingRow, disabled ? styles.disabled : null]}>
      <AplusIcon name={icon} size={24} color={value ? theme.colors.primary : theme.colors.textMuted} boxed />
      <View style={styles.flexBlock}>
        <AplusText variant="body" style={styles.bold}>{title}</AplusText>
        <AplusText variant="caption">{description}</AplusText>
      </View>
      <StatusChip label={boolLabel(value)} tone={value ? 'success' : 'muted'} />
    </Pressable>
  );
}

function NumberControl({title, description, value, suffix, disabled, onChange}: {title: string; description: string; value: number; suffix: string; disabled?: boolean; onChange: (value: number) => void}) {
  return (
    <View style={[styles.settingRow, disabled ? styles.disabled : null]}>
      <AplusIcon name="settings" size={24} color={theme.colors.primary} boxed />
      <View style={styles.flexBlock}>
        <AplusText variant="body" style={styles.bold}>{title}</AplusText>
        <AplusText variant="caption">{description}</AplusText>
      </View>
      <View style={styles.numberBox}>
        <Pressable disabled={disabled} onPress={() => onChange(Math.max(1, value - 5))} style={styles.smallButton}>
          <AplusText variant="subtitle">−</AplusText>
        </Pressable>
        <AplusText variant="label" style={styles.numberLabel}>{value}{suffix}</AplusText>
        <Pressable disabled={disabled} onPress={() => onChange(value + 5)} style={styles.smallButton}>
          <AplusText variant="subtitle">+</AplusText>
        </Pressable>
      </View>
    </View>
  );
}

export function DeviceSettingsScreen({lockId}: {lockId?: string}) {
  const navigation = useAplusNavigation();
  const {locks, findLock, updateLockSettings, isOffline, evaluateRemoteUnlock} = useAppState();
  const selectedLock = useMemo(() => lockId ? findLock(lockId) : locks[0], [findLock, lockId, locks]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  if (!selectedLock) {
    return (
      <BaseScreen>
        <AplusHeader title="Cài đặt khóa" subtitle="UI-29" canGoBack onBack={navigation.goBack} showLogo />
        <AplusCard style={styles.cardGap}>
          <AplusText variant="body">Chưa có khóa để cấu hình.</AplusText>
          <AplusButton title="Về Home" onPress={() => navigation.reset('Home')} />
        </AplusCard>
      </BaseScreen>
    );
  }

  const lock = selectedLock;
  const settings = lock.settings;
  const canEdit = lock.permission.canChangeSettings && !isOffline;
  const remoteCheck = evaluateRemoteUnlock(lock.id);

  const savePatch = async (patch: Partial<LockSettings>) => {
    if (!canEdit) {
      setMessage(lock.permission.canChangeSettings ? 'Đang offline, chỉ xem được cài đặt cache.' : 'Tài khoản hiện tại không có quyền thay đổi cài đặt khóa.');
      return;
    }
    setSaving(true);
    const updated = await updateLockSettings(lock.id, patch);
    setSaving(false);
    setMessage(updated ? 'Đã lưu cài đặt thiết bị và ghi audit record.' : 'Không lưu được cài đặt.');
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Cài đặt khóa" subtitle="UI-29 · Device settings" canGoBack onBack={navigation.goBack} showLogo rightIcon="firmware" onRightPress={() => navigation.navigate('FirmwareOta', {lockId: lock.id})} />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <AplusIcon name="settings" size={44} color={theme.colors.primary} boxed boxSize={76} />
          <View style={styles.flexBlock}>
            <AplusText variant="hero">{lock.name}</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>{lock.hardwareModel ?? 'Aplus Mock'} · {lock.serial}</AplusText>
            <View style={styles.chipRow}>
              <StatusChip label={lock.permission.canChangeSettings ? 'Có quyền cài đặt' : 'Không có quyền'} tone={lock.permission.canChangeSettings ? 'success' : 'danger'} />
              <StatusChip label={isOffline ? 'Offline cache' : lock.connectionState} tone={isOffline || lock.connectionState === 'offline' ? 'warning' : 'success'} />
              <StatusChip label={settings.remoteUnlockEnabled ? 'Remote ON' : 'Remote OFF'} tone={settings.remoteUnlockEnabled ? 'success' : 'danger'} />
            </View>
          </View>
        </View>
        <AplusText variant="caption">Tắt Remote Unlock ở đây sẽ chặn UI-30/37 ngay trong Batch 03 vì dùng chung `settings.remoteUnlockEnabled`.</AplusText>
      </AplusCard>

      {message ? (
        <AplusCard style={styles.noticeCard}>
          <AplusIcon name="bell" size={22} color={theme.colors.info} />
          <AplusText variant="caption" style={styles.flexBlock}>{message}</AplusText>
        </AplusCard>
      ) : null}

      <AplusCard style={styles.cardGap}>
        <View style={styles.rowBetween}>
          <AplusText variant="subtitle">Thiết lập vận hành</AplusText>
          <StatusChip label={saving ? 'Đang lưu' : canEdit ? 'Editable' : 'Read only'} tone={saving ? 'warning' : canEdit ? 'success' : 'muted'} />
        </View>
        <SettingToggle icon="remote" title="Remote unlock" description="Chỉ bật khi khóa/gateway hỗ trợ và Owner/Admin cho phép." value={settings.remoteUnlockEnabled} disabled={saving} onToggle={() => savePatch({remoteUnlockEnabled: !settings.remoteUnlockEnabled})} />
        <SettingToggle icon="lock" title="Auto-lock" description="Tự khóa lại sau khi mở thành công." value={settings.autoLockEnabled} disabled={saving} onToggle={() => savePatch({autoLockEnabled: !settings.autoLockEnabled})} />
        <SettingToggle icon="bell" title="Âm thanh khóa" description="Bật/tắt tiếng beep khi thao tác tại khóa." value={settings.soundEnabled} disabled={saving} onToggle={() => savePatch({soundEnabled: !settings.soundEnabled})} />
        <NumberControl title="Thời gian auto-lock" description="Sau unlock success, khóa lại theo số giây cấu hình." value={settings.autoLockSeconds} suffix="s" disabled={saving || !settings.autoLockEnabled} onChange={autoLockSeconds => savePatch({autoLockSeconds})} />
        <NumberControl title="Cảnh báo cửa mở lâu" description="Tạo alert khi door sensor báo mở quá ngưỡng." value={settings.doorLeftOpenAlertSeconds} suffix="s" disabled={saving} onChange={doorLeftOpenAlertSeconds => savePatch({doorLeftOpenAlertSeconds})} />
        <NumberControl title="Ngưỡng pin yếu" description="Pin thấp hơn ngưỡng sẽ xuất hiện ở Home/Alarm/Diagnostic." value={settings.lowBatteryThreshold} suffix="%" disabled={saving} onChange={lowBatteryThreshold => savePatch({lowBatteryThreshold: Math.min(80, lowBatteryThreshold)})} />
      </AplusCard>

      {!remoteCheck.canProceed ? (
        <AplusCard style={styles.warningCard}>
          <AplusIcon name="alert" size={24} color={theme.colors.warning} />
          <View style={styles.flexBlock}>
            <AplusText variant="subtitle" color={theme.colors.warning}>Remote unlock đang bị guard chặn</AplusText>
            <AplusText variant="caption">{remoteCheck.checks.find(item => !item.passed)?.message ?? 'Kiểm tra lại quyền, capability, setting và gateway.'}</AplusText>
          </View>
        </AplusCard>
      ) : null}

      <View style={styles.quickGrid}>
        <AplusButton title="Phần cứng" leftIcon="gateway" variant="secondary" onPress={() => navigation.navigate('HardwareDetail', {lockId: lock.id})} style={styles.flexButton} />
        <AplusButton title="OTA" leftIcon="firmware" variant="secondary" onPress={() => navigation.navigate('FirmwareOta', {lockId: lock.id})} style={styles.flexButton} />
      </View>
      <View style={styles.quickGrid}>
        <AplusButton title="Diagnostic" leftIcon="shield" variant="secondary" onPress={() => navigation.navigate('DeviceDiagnostic', {lockId: lock.id})} style={styles.flexButton} />
        <AplusButton title="Capability" leftIcon="capability" variant="secondary" onPress={() => navigation.navigate('CompatibilityCheck', {lockId: lock.id})} style={styles.flexButton} />
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {gap: theme.spacing.md, borderColor: theme.colors.borderStrong},
  heroRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg},
  flexBlock: {flex: 1, gap: theme.spacing.xs},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  cardGap: {gap: theme.spacing.md},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md},
  settingRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong},
  bold: {fontWeight: theme.typography.weight.bold},
  disabled: {opacity: 0.55},
  numberBox: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs},
  smallButton: {width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.primarySoft},
  numberLabel: {minWidth: 52, textAlign: 'center'},
  noticeCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, borderColor: 'rgba(92,200,255,0.28)'},
  warningCard: {flexDirection: 'row', gap: theme.spacing.md, borderColor: 'rgba(253,176,34,0.34)'},
  quickGrid: {flexDirection: 'row', gap: theme.spacing.md},
  flexButton: {flex: 1},
});

import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {StatusChip} from '@/components/base/StatusChip';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';

const autoLockOptions = [1, 5, 15, 30];

export function AppPinSecurityScreen() {
  const navigation = useAplusNavigation();
  const {
    appPinSettings,
    reloadAccountSecurity,
    updateAppPinSettings,
    setAppPin,
    verifyAppPin,
  } = useAppState();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    reloadAccountSecurity();
  }, [reloadAccountSecurity]);

  const pinEnabled = Boolean(appPinSettings?.enabled);
  const statusLabel = useMemo(() => pinEnabled ? 'Đang bật' : 'Đang tắt', [pinEnabled]);

  const saveNewPin = async () => {
    setError(undefined);
    setMessage(undefined);

    if (!/^\d{4,6}$/.test(newPin)) {
      setError('PIN mới cần 4-6 chữ số.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PIN xác nhận chưa khớp.');
      return;
    }
    if (pinEnabled) {
      const ok = await verifyAppPin(currentPin);
      if (!ok) {
        setError('PIN hiện tại không đúng. PIN mock ban đầu là 2580.');
        return;
      }
    }

    setSaving(true);
    await setAppPin(newPin);
    setSaving(false);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setMessage('Đã cập nhật App PIN. Remote Unlock sẽ dùng PIN mới ngay.');
  };

  const toggleEnabled = async () => {
    if (!appPinSettings) {
      return;
    }
    setError(undefined);
    setMessage(undefined);
    const updated = await updateAppPinSettings({enabled: !appPinSettings.enabled});
    setMessage(updated.enabled ? 'Đã bật App PIN.' : 'Đã tắt App PIN. Remote Unlock sẽ fallback PIN mock an toàn.');
  };

  const toggleSensitive = async () => {
    if (!appPinSettings) {
      return;
    }
    await updateAppPinSettings({requireForSensitiveActions: !appPinSettings.requireForSensitiveActions});
  };

  const toggleBiometric = async () => {
    if (!appPinSettings) {
      return;
    }
    await updateAppPinSettings({biometricFallbackEnabled: !appPinSettings.biometricFallbackEnabled});
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Bảo mật App PIN" subtitle="UI-61 · PIN cho thao tác nhạy cảm" canGoBack onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="pin" size={50} color={theme.colors.primary} boxed boxSize={86} />
        <AplusText variant="hero" align="center">App PIN</AplusText>
        <AplusText variant="body" align="center" color={theme.colors.textMuted}>Dùng để xác thực remote unlock, transfer, revoke, factory reset và các flow nhạy cảm.</AplusText>
        <View style={styles.chipRow}>
          <StatusChip label={statusLabel} tone={pinEnabled ? 'success' : 'warning'} />
          <StatusChip label={`Auto-lock ${appPinSettings?.autoLockAfterMinutes ?? 5} phút`} tone="info" />
          <StatusChip label={`${appPinSettings?.failedAttempts ?? 0} lần sai`} tone={(appPinSettings?.failedAttempts ?? 0) > 0 ? 'danger' : 'muted'} />
        </View>
      </AplusCard>

      <AplusCard style={styles.card}>
        <SettingRow
          title="Bật App PIN"
          subtitle="Khi bật, Remote Unlock và thao tác nhạy cảm phải xác thực lại."
          active={pinEnabled}
          onPress={toggleEnabled}
        />
        <SettingRow
          title="Yêu cầu PIN cho thao tác nhạy cảm"
          subtitle="Remote unlock, transfer, revoke, emergency card và API key."
          active={Boolean(appPinSettings?.requireForSensitiveActions)}
          onPress={toggleSensitive}
        />
        <SettingRow
          title="Cho phép biometric fallback"
          subtitle="Dùng adapter biometric mock nếu thiết bị tin cậy hỗ trợ."
          active={Boolean(appPinSettings?.biometricFallbackEnabled)}
          onPress={toggleBiometric}
        />
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Đổi PIN</AplusText>
        <AplusText variant="caption">PIN mock ban đầu là 2580. Sau khi đổi, màn Remote Unlock sẽ đọc PIN mới từ App PIN settings.</AplusText>
        {pinEnabled ? <AplusTextField label="PIN hiện tại" leftIcon="pin" keyboardType="number-pad" secureTextEntry maxLength={6} value={currentPin} onChangeText={setCurrentPin} /> : null}
        <AplusTextField label="PIN mới" leftIcon="pin" keyboardType="number-pad" secureTextEntry maxLength={6} value={newPin} onChangeText={setNewPin} placeholder="4-6 chữ số" error={error} />
        <AplusTextField label="Nhập lại PIN mới" leftIcon="pin" keyboardType="number-pad" secureTextEntry maxLength={6} value={confirmPin} onChangeText={setConfirmPin} placeholder="Nhập lại PIN" />
        {message ? <AplusText variant="caption" color={theme.colors.success}>{message}</AplusText> : null}
        <AplusButton title="Lưu PIN" leftIcon="check" onPress={saveNewPin} loading={saving} />
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Tự khóa app sau khi không hoạt động</AplusText>
        <View style={styles.optionRow}>
          {autoLockOptions.map(minutes => {
            const selected = appPinSettings?.autoLockAfterMinutes === minutes;
            return (
              <Pressable key={minutes} accessibilityRole="button" onPress={() => updateAppPinSettings({autoLockAfterMinutes: minutes})} style={[styles.option, selected ? styles.optionSelected : null]}>
                <AplusText variant="body" color={selected ? theme.colors.primary : theme.colors.text}>{minutes} phút</AplusText>
              </Pressable>
            );
          })}
        </View>
      </AplusCard>
    </BaseScreen>
  );
}

function SettingRow({title, subtitle, active, onPress}: {title: string; subtitle: string; active: boolean; onPress: () => void}) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{checked: active}} onPress={onPress} style={styles.settingRow}>
      <View style={styles.settingText}>
        <AplusText variant="body" style={styles.bold}>{title}</AplusText>
        <AplusText variant="caption">{subtitle}</AplusText>
      </View>
      <StatusChip label={active ? 'Bật' : 'Tắt'} tone={active ? 'success' : 'muted'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  heroCard: {
    alignItems: 'center',
    gap: theme.spacing.md,
    borderColor: theme.colors.borderStrong,
  },
  card: {
    gap: theme.spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceStrong,
  },
  settingText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  option: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceStrong,
  },
  optionSelected: {
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.primarySoft,
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
});

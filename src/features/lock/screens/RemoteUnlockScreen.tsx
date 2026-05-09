import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {StatusChip} from '@/components/base/StatusChip';
import {NativeAdapters} from '@/services/adapters/nativeAdapters';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {LockCommandAuthMethod, LockCommandScenario, LockCommandType} from '@/types/lock';

const scenarioOptions: Array<{value: LockCommandScenario; label: string; description: string}> = [
  {value: 'success', label: 'Success', description: 'Thiết bị trả success event'},
  {value: 'timeout', label: 'Timeout', description: 'Không đổi trạng thái khóa'},
  {value: 'failed', label: 'Failed', description: 'Gateway trả lỗi mock'},
];

function CheckRow({passed, label, message}: {passed: boolean; label: string; message: string}) {
  return (
    <View style={styles.checkRow}>
      <AplusIcon name={passed ? 'check' : 'close'} size={18} color={passed ? theme.colors.success : theme.colors.danger} />
      <View style={styles.checkText}>
        <AplusText variant="body" style={styles.bold}>{label}</AplusText>
        <AplusText variant="caption">{message}</AplusText>
      </View>
    </View>
  );
}

export function RemoteUnlockScreen({lockId}: {lockId: string}) {
  const navigation = useAplusNavigation();
  const {findLock, evaluateRemoteUnlock, startLockCommand, remoteUnlockPin} = useAppState();
  const [pin, setPin] = useState('');
  const [scenario, setScenario] = useState<LockCommandScenario>('success');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const lock = findLock(lockId);
  const remoteCheck = useMemo(() => evaluateRemoteUnlock(lockId), [evaluateRemoteUnlock, lockId]);

  if (!lock) {
    return (
      <BaseScreen contentStyle={styles.container}>
        <AplusHeader title="Không tìm thấy khóa" canGoBack onBack={navigation.goBack} showLogo />
        <AplusCard style={styles.card}>
          <AplusText>Không tìm thấy lockId: {lockId}</AplusText>
          <AplusButton title="Quay lại" onPress={navigation.goBack} />
        </AplusCard>
      </BaseScreen>
    );
  }

  const commandType: LockCommandType = lock.isLocked ? 'remoteUnlock' : 'lock';
  const title = lock.isLocked ? 'Mở khóa từ xa' : 'Khóa lại qua Gateway';

  const startCommand = async (authMethod: LockCommandAuthMethod) => {
    setError(undefined);
    if (commandType === 'remoteUnlock') {
      if (!remoteCheck.canProceed) {
        setError('Remote unlock chưa đạt checklist an toàn. Vui lòng kiểm tra quyền, gateway và setting.');
        return;
      }
      if (authMethod === 'pin' && pin !== remoteUnlockPin) {
        setError(`PIN mock chưa đúng. PIN test Batch 03 là ${remoteUnlockPin}.`);
        return;
      }
    }

    setLoading(true);
    const command = await startLockCommand({lockId, type: commandType, scenario, authMethod});
    setLoading(false);
    if (!command) {
      setError('Không tạo được command. Kiểm tra trạng thái online/quyền điều khiển.');
      return;
    }
    navigation.navigate('CommandLifecycle', {lockId, commandId: command.id});
  };

  const biometricStart = async () => {
    setError(undefined);
    const result = await NativeAdapters.biometric.authenticate('Xác thực remote unlock Aplus');
    if (!result.success) {
      setError('Sinh trắc học mock thất bại.');
      return;
    }
    await startCommand('biometric');
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={title} subtitle={`${lock.name} · ${lock.roomName}`} canGoBack onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name={lock.isLocked ? 'remote' : 'lock'} size={56} color={theme.colors.primary} boxed boxSize={92} />
        <AplusText variant="hero" align="center">{title}</AplusText>
        <AplusText variant="body" align="center" color={theme.colors.textMuted}>Command chỉ đổi trạng thái khi nhận success event, timeout/failed giữ nguyên trạng thái khóa.</AplusText>
        <View style={styles.chipRow}>
          <StatusChip label={lock.isLocked ? 'UI-37 xác thực' : 'Lock command'} tone="info" />
          <StatusChip label="UI-38 lifecycle" tone="warning" />
        </View>
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Checklist an toàn</AplusText>
        {remoteCheck.checks.map(check => (
          <CheckRow key={check.key} passed={check.passed} label={check.label} message={check.message} />
        ))}
      </AplusCard>

      {lock.isLocked ? (
        <AplusCard style={styles.card}>
          <AplusText variant="subtitle">Xác thực lại</AplusText>
          <AplusText variant="caption">PIN mock Batch 03: {remoteUnlockPin}. Sau này thay bằng App PIN/biometric thật qua adapter.</AplusText>
          <AplusTextField label="App PIN" leftIcon="pin" keyboardType="number-pad" maxLength={6} secureTextEntry value={pin} onChangeText={setPin} placeholder="Nhập PIN để mở từ xa" error={error} />
          <View style={styles.actionsRow}>
            <AplusButton title="Dùng PIN" leftIcon="pin" onPress={() => startCommand('pin')} loading={loading} disabled={!remoteCheck.canProceed} style={styles.flexButton} />
            <AplusButton title="Biometric" leftIcon="fingerprint" variant="secondary" onPress={biometricStart} disabled={!remoteCheck.canProceed || loading} style={styles.flexButton} />
          </View>
        </AplusCard>
      ) : (
        <AplusCard style={styles.card}>
          <AplusText variant="subtitle">Khóa lại</AplusText>
          <AplusText variant="caption">Lệnh khóa lại vẫn đi qua command lifecycle để tạo audit record rõ ràng.</AplusText>
          {error ? <AplusText variant="caption" color={theme.colors.danger}>{error}</AplusText> : null}
          <AplusButton title="Gửi lệnh khóa lại" leftIcon="lock" onPress={() => startCommand('mock-admin')} loading={loading} />
        </AplusCard>
      )}

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Kịch bản test command</AplusText>
        <AplusText variant="caption">Dùng để kiểm thử đúng yêu cầu: success tạo record, timeout không đổi trạng thái, failed không đổi trạng thái.</AplusText>
        <View style={styles.scenarioList}>
          {scenarioOptions.map(option => {
            const selected = scenario === option.value;
            return (
              <Pressable key={option.value} onPress={() => setScenario(option.value)} style={[styles.scenarioItem, selected ? styles.scenarioSelected : null]}>
                <AplusIcon name={selected ? 'check' : 'command'} size={18} color={selected ? theme.colors.success : theme.colors.textMuted} />
                <View style={styles.checkText}>
                  <AplusText variant="body" style={styles.bold}>{option.label}</AplusText>
                  <AplusText variant="caption">{option.description}</AplusText>
                </View>
              </Pressable>
            );
          })}
        </View>
      </AplusCard>
    </BaseScreen>
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
  checkRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  checkText: {
    flex: 1,
    gap: 2,
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flexButton: {
    flex: 1,
  },
  scenarioList: {
    gap: theme.spacing.sm,
  },
  scenarioItem: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceStrong,
  },
  scenarioSelected: {
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.primarySoft,
  },
});

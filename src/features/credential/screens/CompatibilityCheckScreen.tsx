import React, {useMemo} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {StatusChip} from '@/components/base/StatusChip';
import {credentialTypeOptions} from '@/services/credential/credentialCatalog';
import {buildCapabilityChecks, evaluateCredentialOption} from '@/services/credential/capabilityGuard';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {CredentialType} from '@/types/credential';

function BoolChip({value, trueText, falseText}: {value: boolean; trueText: string; falseText: string}) {
  return <StatusChip label={value ? trueText : falseText} tone={value ? 'success' : 'danger'} />;
}

export function CompatibilityCheckScreen({lockId, credentialType}: {lockId?: string; credentialType?: CredentialType}) {
  const navigation = useAplusNavigation();
  const {findLock} = useAppState();
  const lock = lockId ? findLock(lockId) : undefined;
  const checks = useMemo(() => buildCapabilityChecks(lock), [lock]);
  const selectedCheck = credentialType ? evaluateCredentialOption(lock, credentialType) : undefined;

  const openType = (type: CredentialType) => {
    const check = evaluateCredentialOption(lock, type);
    if (check.enabled) {
      navigation.navigate('RecipientPicker', {lockId, credentialType: type});
      return;
    }
    navigation.navigate('CompatibilityCheck', {lockId, credentialType: type});
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Kiểm tra tương thích" subtitle="UI-69 · Permission/Capability guard" canGoBack onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="capability" size={50} color={theme.colors.primary} boxed boxSize={84} />
        <View style={styles.heroText}>
          <AplusText variant="hero">Capability Matrix</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>{lock ? `${lock.name} · ${lock.hardwareModel ?? 'Aplus Mock'}` : 'Chưa chọn khóa, hiển thị ma trận mặc định để kiểm tra flow.'}</AplusText>
          <View style={styles.chipRow}>
            <StatusChip label="UI-69" tone="info" />
            <StatusChip label={lockId ? `lockId ${lockId}` : 'Global'} tone="warning" />
            <StatusChip label="Không hardcode" tone="success" />
          </View>
        </View>
      </AplusCard>

      {selectedCheck ? (
        <AplusCard style={styles.selectedCard}>
          <View style={styles.selectedTop}>
            <AplusIcon name={credentialTypeOptions.find(item => item.type === selectedCheck.type)?.icon ?? 'key'} size={30} color={selectedCheck.enabled ? theme.colors.success : theme.colors.warning} boxed boxSize={58} />
            <View style={styles.heroText}>
              <AplusText variant="subtitle">{selectedCheck.label}</AplusText>
              <AplusText variant="caption">{selectedCheck.message}</AplusText>
            </View>
          </View>
          <View style={styles.chipRow}>
            <BoolChip value={selectedCheck.supported} trueText="Hardware OK" falseText="Không hỗ trợ" />
            <BoolChip value={selectedCheck.permissionAllowed} trueText="Permission OK" falseText="Thiếu quyền" />
            <BoolChip value={selectedCheck.enabled} trueText="Có thể cấp" falseText="Bị chặn" />
          </View>
          {selectedCheck.enabled ? <AplusButton title="Chọn người nhận" leftIcon="recipient" onPress={() => navigation.navigate('RecipientPicker', {lockId, credentialType: selectedCheck.type})} /> : null}
        </AplusCard>
      ) : null}

      <AplusText variant="subtitle">Ma trận credential</AplusText>
      <View style={styles.matrixList}>
        {checks.map(check => {
          const option = credentialTypeOptions.find(item => item.type === check.type);
          return (
            <Pressable key={check.type} onPress={() => openType(check.type)} style={({pressed}) => [styles.matrixRow, pressed ? styles.pressed : null, check.enabled ? null : styles.blockedRow]}>
              <AplusIcon name={option?.icon ?? 'key'} size={24} color={check.enabled ? theme.colors.primary : theme.colors.textSubtle} boxed boxSize={48} />
              <View style={styles.heroText}>
                <AplusText variant="body" style={styles.bold}>{check.label}</AplusText>
                <AplusText variant="caption" numberOfLines={2}>{check.message}</AplusText>
              </View>
              <View style={styles.statusStack}>
                <StatusChip label={check.enabled ? 'Enabled' : 'Blocked'} tone={check.enabled ? 'success' : 'danger'} />
                <AplusIcon name="chevron" size={16} color={theme.colors.textMuted} />
              </View>
            </Pressable>
          );
        })}
      </View>

      <AplusCard style={styles.notesCard}>
        <AplusText variant="subtitle">Guard dùng lại cho các batch sau</AplusText>
        <AplusText variant="caption">• Batch 05/06/07/08/20/27 sẽ gọi cùng capability guard trước khi tạo credential.</AplusText>
        <AplusText variant="caption">• Flow không hỗ trợ sẽ bị khóa ở UI, không chỉ hiện toast.</AplusText>
        <AplusText variant="caption">• Thu hồi credential chuyển Revoked/PendingRevoke để giữ audit, không xoá cứng.</AplusText>
      </AplusCard>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    borderColor: theme.colors.borderStrong,
  },
  heroText: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  selectedCard: {
    gap: theme.spacing.md,
    borderColor: theme.colors.borderStrong,
  },
  selectedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  matrixList: {
    gap: theme.spacing.md,
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  blockedRow: {
    opacity: 0.68,
    borderColor: 'rgba(240,68,56,0.24)',
  },
  pressed: {
    opacity: 0.86,
  },
  statusStack: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
  notesCard: {
    gap: theme.spacing.sm,
  },
});

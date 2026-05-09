import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon, type AplusIconName} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {StatusChip} from '@/components/base/StatusChip';
import {credentialTypeOptions, getRoleLabel} from '@/services/credential/credentialCatalog';
import {evaluateCredentialOption} from '@/services/credential/capabilityGuard';
import {MockCredentialRepository} from '@/services/repositories/MockCredentialRepository';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {Credential, CredentialType} from '@/types/credential';

function statusTone(status: Credential['status']) {
  if (status === 'active') {
    return 'success' as const;
  }
  if (status === 'revoked' || status === 'expired') {
    return 'danger' as const;
  }
  if (status === 'unsupported') {
    return 'danger' as const;
  }
  return 'warning' as const;
}

function statusLabel(status: Credential['status']) {
  switch (status) {
    case 'active':
      return 'Active';
    case 'pendingSync':
      return 'Pending Sync';
    case 'pendingRevoke':
      return 'Pending Revoke';
    case 'revoked':
      return 'Revoked';
    case 'expired':
      return 'Expired';
    case 'unsupported':
      return 'Unsupported';
    case 'draft':
      return 'Draft';
    default:
      return status;
  }
}

function iconForType(type: CredentialType): AplusIconName {
  return credentialTypeOptions.find(item => item.type === type)?.icon ?? 'key';
}

function Metric({label, value, icon}: {label: string; value: number; icon: AplusIconName}) {
  return (
    <AplusCard style={styles.metricCard}>
      <AplusIcon name={icon} size={22} color={theme.colors.primary} />
      <AplusText variant="hero">{value}</AplusText>
      <AplusText variant="caption">{label}</AplusText>
    </AplusCard>
  );
}

function CredentialTypeCard({type, lockId}: {type: CredentialType; lockId?: string}) {
  const navigation = useAplusNavigation();
  const {findLock} = useAppState();
  const lock = lockId ? findLock(lockId) : undefined;
  const option = credentialTypeOptions.find(item => item.type === type)!;
  const check = evaluateCredentialOption(lock, type);

  const open = () => {
    if (check.enabled) {
      navigation.navigate('RecipientPicker', {lockId, credentialType: type});
      return;
    }
    navigation.navigate('CompatibilityCheck', {lockId, credentialType: type});
  };

  return (
    <Pressable onPress={open} style={({pressed}) => [styles.optionCard, pressed ? styles.pressed : null, !check.enabled ? styles.lockedOption : null]}>
      <AplusIcon name={option.icon} size={27} color={check.enabled ? theme.colors.primary : theme.colors.textSubtle} boxed boxSize={54} />
      <View style={styles.optionText}>
        <View style={styles.optionTitleRow}>
          <AplusText variant="body" style={styles.bold}>{option.title}</AplusText>
          {option.sensitive ? <StatusChip label="Re-auth" tone="warning" /> : null}
        </View>
        <AplusText variant="caption" numberOfLines={2}>{check.message}</AplusText>
      </View>
      <AplusIcon name={check.enabled ? 'chevron' : 'shield'} size={18} color={check.enabled ? theme.colors.textMuted : theme.colors.warning} />
    </Pressable>
  );
}

function CredentialRow({credential, onRevoked}: {credential: Credential; onRevoked: () => void}) {
  const canRevoke = credential.status !== 'revoked' && credential.status !== 'expired';
  const revoke = async () => {
    if (!canRevoke) {
      return;
    }
    await MockCredentialRepository.revokeCredential(credential.id);
    onRevoked();
  };

  return (
    <AplusCard style={styles.credentialRow}>
      <View style={styles.credentialTop}>
        <AplusIcon name={iconForType(credential.type)} size={24} color={theme.colors.primary} boxed boxSize={46} />
        <View style={styles.optionText}>
          <AplusText variant="body" style={styles.bold}>{credential.title}</AplusText>
          <AplusText variant="caption">{credential.ownerName} · {credential.scope.label}</AplusText>
        </View>
        <StatusChip label={statusLabel(credential.status)} tone={statusTone(credential.status)} />
      </View>
      {canRevoke ? (
        <AplusButton title="Thu hồi mock" leftIcon="revoked" variant="ghost" onPress={revoke} />
      ) : (
        <AplusText variant="caption" color={theme.colors.textSubtle}>Credential đã bị thu hồi mềm, không xoá cứng khỏi audit.</AplusText>
      )}
    </AplusCard>
  );
}

export function CredentialHubScreen({lockId}: {lockId?: string}) {
  const navigation = useAplusNavigation();
  const {findLock} = useAppState();
  const lock = lockId ? findLock(lockId) : undefined;
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [summary, setSummary] = useState({total: 0, active: 0, pending: 0, revoked: 0, unsupported: 0});

  const load = async () => {
    const [list, nextSummary] = await Promise.all([
      MockCredentialRepository.getCredentials(lockId),
      MockCredentialRepository.getCredentialSummary(lockId),
    ]);
    setCredentials(list);
    setSummary(nextSummary);
  };

  useEffect(() => {
    load();
  }, [lockId]);

  const lockSubtitle = lock ? `${lock.name} · ${lock.roomName}` : 'Toàn hệ thống · chọn khóa ở flow sau';
  const roleLabel = useMemo(() => getRoleLabel('Owner'), []);

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Thêm quyền mở khóa" subtitle={lockSubtitle} canGoBack={navigation.canGoBack} onBack={navigation.goBack} showLogo rightIcon="shield" onRightPress={() => navigation.navigate('CompatibilityCheck', {lockId})} />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="credential" size={48} color={theme.colors.primary} boxed boxSize={82} />
        <View style={styles.heroText}>
          <AplusText variant="hero">Credential Hub</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>UI-16 làm trung tâm cấp quyền. Mọi loại quyền dùng chung Credential model, kiểm tra permission/capability trước khi đi vào flow con.</AplusText>
          <View style={styles.chipRow}>
            <StatusChip label="UI-16" tone="info" />
            <StatusChip label={roleLabel} tone="success" />
            <StatusChip label={lockId ? `lockId ${lockId}` : 'Global'} tone="warning" />
          </View>
        </View>
      </AplusCard>

      <View style={styles.metricRow}>
        <Metric label="Tổng quyền" value={summary.total} icon="key" />
        <Metric label="Active" value={summary.active} icon="check" />
      </View>
      <View style={styles.metricRow}>
        <Metric label="Pending" value={summary.pending} icon="sync" />
        <Metric label="Revoked" value={summary.revoked} icon="revoked" />
      </View>

      <View style={styles.sectionHeader}>
        <AplusText variant="subtitle">Chọn loại quyền</AplusText>
        <AplusButton title="Compatibility" leftIcon="capability" variant="secondary" onPress={() => navigation.navigate('CompatibilityCheck', {lockId})} />
      </View>

      <View style={styles.list}>
        {credentialTypeOptions.map(option => <CredentialTypeCard key={option.type} type={option.type} lockId={lockId} />)}
      </View>

      <View style={styles.sectionHeader}>
        <AplusText variant="subtitle">Credential gần đây</AplusText>
        <StatusChip label="Soft revoke" tone="info" />
      </View>
      <View style={styles.list}>
        {credentials.length ? credentials.map(item => <CredentialRow key={item.id} credential={item} onRevoked={load} />) : (
          <AplusCard style={styles.emptyCard}>
            <AplusIcon name="credential" size={30} color={theme.colors.textMuted} />
            <AplusText variant="body">Chưa có credential nào cho phạm vi này.</AplusText>
            <AplusText variant="caption">Chọn loại quyền phía trên để tạo draft và chuyển sang batch chức năng tương ứng.</AplusText>
          </AplusCard>
        )}
      </View>
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
  metricRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  list: {
    gap: theme.spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  lockedOption: {
    opacity: 0.72,
    borderColor: 'rgba(253,176,34,0.22)',
  },
  pressed: {
    opacity: 0.86,
    transform: [{scale: 0.99}],
  },
  optionText: {
    flex: 1,
    gap: 3,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
  credentialRow: {
    gap: theme.spacing.md,
  },
  credentialTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
});

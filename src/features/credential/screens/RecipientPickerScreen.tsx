import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {StatusChip} from '@/components/base/StatusChip';
import {credentialTypeOptions, getRoleLabel, permissionMatrix} from '@/services/credential/credentialCatalog';
import {evaluateCredentialOption} from '@/services/credential/capabilityGuard';
import {MockCredentialRepository} from '@/services/repositories/MockCredentialRepository';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {CredentialType, Person} from '@/types/credential';

function formatDate(timestamp?: number) {
  if (!timestamp) {
    return 'Không giới hạn';
  }
  return new Date(timestamp).toLocaleDateString('vi-VN');
}

function PersonCard({person, selected, onPress}: {person: Person; selected: boolean; onPress: () => void}) {
  const role = permissionMatrix.find(item => item.role === person.role);
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.personCard, selected ? styles.personSelected : null, pressed ? styles.pressed : null, !person.active ? styles.inactive : null]}>
      <View style={styles.avatar}>
        <AplusText variant="subtitle">{person.avatarLabel}</AplusText>
      </View>
      <View style={styles.personText}>
        <View style={styles.personTitleRow}>
          <AplusText variant="body" style={styles.bold}>{person.fullName}</AplusText>
          <StatusChip label={getRoleLabel(person.role)} tone={person.active ? 'info' : 'danger'} />
        </View>
        <AplusText variant="caption">{person.phone}{person.email ? ` · ${person.email}` : ''}</AplusText>
        <AplusText variant="caption" color={theme.colors.textSubtle}>{person.scopeLabel} · Hạn: {formatDate(person.expiresAt)}</AplusText>
        <View style={styles.permissionRow}>
          <StatusChip label={role?.permissions.unlock ? 'Unlock' : 'No unlock'} tone={role?.permissions.unlock ? 'success' : 'danger'} />
          <StatusChip label={role?.permissions.addKey ? 'Add key' : 'No add key'} tone={role?.permissions.addKey ? 'success' : 'warning'} />
          <StatusChip label={role?.permissions.remoteUnlock ? 'Remote' : 'No remote'} tone={role?.permissions.remoteUnlock ? 'success' : 'warning'} />
        </View>
      </View>
      <AplusIcon name={selected ? 'check' : 'chevron'} size={20} color={selected ? theme.colors.success : theme.colors.textMuted} />
    </Pressable>
  );
}

export function RecipientPickerScreen({lockId, credentialType}: {lockId?: string; credentialType: CredentialType}) {
  const navigation = useAplusNavigation();
  const {findLock} = useAppState();
  const lock = lockId ? findLock(lockId) : undefined;
  const option = credentialTypeOptions.find(item => item.type === credentialType) ?? credentialTypeOptions[0];
  const compatibility = evaluateCredentialOption(lock, credentialType);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [creating, setCreating] = useState(false);
  const selectedPerson = useMemo(() => people.find(item => item.id === selectedId), [people, selectedId]);

  useEffect(() => {
    MockCredentialRepository.getPeople().then(list => {
      setPeople(list);
      setSelectedId(list.find(item => item.active)?.id);
    });
  }, []);

  const continueFlow = async () => {
    if (!selectedPerson || !compatibility.enabled || !selectedPerson.active) {
      navigation.navigate('CompatibilityCheck', {lockId, credentialType});
      return;
    }
    setCreating(true);
    const draft = await MockCredentialRepository.createDraftCredential({
      type: credentialType,
      ownerId: selectedPerson.id,
      lockId,
      lockName: lock?.name,
    });
    setCreating(false);
    navigation.navigate(option.targetRoute, {lockId, recipientId: draft.ownerId} as never);
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Chọn người nhận quyền" subtitle="UI-47 · Permission routing" canGoBack onBack={navigation.goBack} showLogo rightIcon="capability" onRightPress={() => navigation.navigate('CompatibilityCheck', {lockId, credentialType})} />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="recipient" size={48} color={theme.colors.primary} boxed boxSize={82} />
        <View style={styles.heroText}>
          <AplusText variant="hero">{option.title}</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>{lock ? `${lock.name} · ${lock.roomName}` : 'Chưa chọn khóa cố định, credential sẽ dùng phạm vi sau.'}</AplusText>
          <View style={styles.chipRow}>
            <StatusChip label={compatibility.enabled ? 'Đủ điều kiện' : 'Bị chặn'} tone={compatibility.enabled ? 'success' : 'danger'} />
            <StatusChip label="Draft credential" tone="info" />
            {option.sensitive ? <StatusChip label="Cần re-auth" tone="warning" /> : null}
          </View>
        </View>
      </AplusCard>

      {!compatibility.enabled ? (
        <AplusCard style={styles.blockCard}>
          <AplusIcon name="shield" size={26} color={theme.colors.warning} />
          <View style={styles.personText}>
            <AplusText variant="subtitle" color={theme.colors.warning}>Không thể cấp quyền ngay</AplusText>
            <AplusText variant="caption">{compatibility.message}</AplusText>
          </View>
          <AplusButton title="Xem UI-69" leftIcon="capability" variant="secondary" onPress={() => navigation.navigate('CompatibilityCheck', {lockId, credentialType})} />
        </AplusCard>
      ) : null}

      <AplusText variant="subtitle">Danh sách người nhận mock</AplusText>
      <View style={styles.list}>
        {people.map(person => <PersonCard key={person.id} person={person} selected={selectedId === person.id} onPress={() => setSelectedId(person.id)} />)}
      </View>

      <AplusCard style={styles.summaryCard}>
        <AplusText variant="subtitle">Tóm tắt cấp quyền</AplusText>
        <AplusText variant="caption">Người nhận: {selectedPerson?.fullName ?? 'Chưa chọn'}</AplusText>
        <AplusText variant="caption">Role: {selectedPerson ? getRoleLabel(selectedPerson.role) : '—'}</AplusText>
        <AplusText variant="caption">Phạm vi: {lock ? `${lock.homeName} · ${lock.roomName}` : 'Chọn sau trong flow con'}</AplusText>
        <AplusButton title="Tạo draft & tiếp tục" leftIcon="check" loading={creating} disabled={!selectedPerson || !compatibility.enabled || selectedPerson.active === false} onPress={continueFlow} />
        {selectedPerson && !selectedPerson.active ? <AplusText variant="caption" color={theme.colors.warning}>Người nhận không còn active, không thể cấp quyền mới.</AplusText> : null}
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
  list: {
    gap: theme.spacing.md,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  personSelected: {
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.primarySoft,
  },
  pressed: {
    opacity: 0.86,
  },
  inactive: {
    opacity: 0.56,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  personText: {
    flex: 1,
    gap: 4,
  },
  personTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  permissionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: 2,
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
  blockCard: {
    gap: theme.spacing.md,
  },
  summaryCard: {
    gap: theme.spacing.md,
    borderColor: theme.colors.borderStrong,
  },
});

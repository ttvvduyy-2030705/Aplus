import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {StatusChip} from '@/components/base/StatusChip';
import {getRoleLabel} from '@/services/credential/credentialCatalog';
import {MockCredentialRepository} from '@/services/repositories/MockCredentialRepository';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {theme} from '@/theme/theme';
import type {MemberProfile, PermissionAction} from '@/types/credential';

const actionLabels: Array<{key: PermissionAction; label: string}> = [
  {key: 'unlock', label: 'Unlock'},
  {key: 'remoteUnlock', label: 'Remote'},
  {key: 'addKey', label: 'Add key'},
  {key: 'records', label: 'Records'},
  {key: 'rooms', label: 'Rooms'},
  {key: 'staff', label: 'Staff'},
  {key: 'reports', label: 'Reports'},
  {key: 'settings', label: 'Settings'},
];

function formatDate(timestamp?: number) {
  if (!timestamp) {
    return 'Không giới hạn';
  }
  return new Date(timestamp).toLocaleDateString('vi-VN');
}

function InfoRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.infoRow}>
      <AplusText variant="caption" color={theme.colors.textMuted}>{label}</AplusText>
      <AplusText variant="body" style={styles.infoValue}>{value}</AplusText>
    </View>
  );
}

export function MemberDetailScreen({personId}: {personId: string}) {
  const navigation = useAplusNavigation();
  const [profile, setProfile] = useState<MemberProfile | undefined>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  const load = useCallback(async () => {
    setProfile(await MockCredentialRepository.getMemberProfileById(personId));
  }, [personId]);

  useEffect(() => {
    load();
  }, [load]);

  const revokeAll = async () => {
    if (!profile || profile.person.role === 'Owner') {
      setMessage('Không thể revoke Owner bằng flow mock này.');
      return;
    }
    setLoading(true);
    const updated = await MockCredentialRepository.revokeMemberAndCredentials(profile.person.id);
    setProfile(updated);
    setMessage('Đã kết thúc quyền và revoke toàn bộ credential liên quan.');
    setLoading(false);
  };

  if (!profile) {
    return (
      <BaseScreen contentStyle={styles.container}>
        <AplusHeader title="Chi tiết thành viên" canGoBack onBack={navigation.goBack} showLogo />
        <AplusCard style={styles.card}>
          <AplusText variant="body">Không tìm thấy personId: {personId}</AplusText>
        </AplusCard>
      </BaseScreen>
    );
  }

  const relation = profile.relation;
  const canRevoke = profile.person.role !== 'Owner' && profile.membership.status === 'active';

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Chi tiết thành viên" subtitle="UI-49 · Member/Tenant detail" canGoBack onBack={navigation.goBack} showLogo rightIcon="matrix" onRightPress={() => navigation.navigate('RoleMatrix')} />

      <AplusCard style={styles.heroCard}>
        <View style={styles.avatarLarge}>
          <AplusText variant="hero">{profile.person.avatarLabel}</AplusText>
        </View>
        <View style={styles.heroText}>
          <AplusText variant="hero">{profile.person.fullName}</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>{profile.person.phone}{profile.person.email ? ` · ${profile.person.email}` : ''}</AplusText>
          <View style={styles.chipRow}>
            <StatusChip label={getRoleLabel(profile.person.role)} tone="info" />
            <StatusChip label={profile.membership.status} tone={profile.membership.status === 'active' ? 'success' : 'danger'} />
            <StatusChip label={`${profile.activeCredentialCount} active key`} tone={profile.activeCredentialCount ? 'success' : 'muted'} />
          </View>
        </View>
      </AplusCard>

      {message ? (
        <AplusCard style={styles.noticeCard}>
          <AplusIcon name="check" size={22} color={theme.colors.success} />
          <AplusText variant="body" color={theme.colors.success}>{message}</AplusText>
        </AplusCard>
      ) : null}

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Membership</AplusText>
        <InfoRow label="Phạm vi" value={profile.membership.scopeLabel} />
        <InfoRow label="Loại phạm vi" value={profile.membership.scopeType} />
        <InfoRow label="Ngày bắt đầu" value={formatDate(profile.membership.startsAt)} />
        <InfoRow label="Ngày hết hạn" value={formatDate(profile.membership.expiresAt)} />
        <InfoRow label="Credential active/revoked" value={`${profile.activeCredentialCount}/${profile.revokedCredentialCount}`} />
      </AplusCard>

      {relation ? (
        <AplusCard style={styles.card}>
          <AplusText variant="subtitle">{relation.type === 'tenancy' ? 'Tenancy' : 'Employment'}</AplusText>
          <InfoRow label="Hồ sơ" value={relation.title} />
          <InfoRow label="Phạm vi" value={relation.scopeLabel} />
          <InfoRow label="Trạng thái" value={relation.status} />
          <InfoRow label="Kết thúc" value={formatDate(relation.endsAt)} />
          {relation.note ? <AplusText variant="caption" color={theme.colors.textMuted}>{relation.note}</AplusText> : null}
        </AplusCard>
      ) : null}

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Quyền chi tiết</AplusText>
        <View style={styles.chipRow}>
          {actionLabels.map(action => <StatusChip key={action.key} label={action.label} tone={profile.membership.permissions[action.key] ? 'success' : 'danger'} />)}
        </View>
      </AplusCard>

      <View style={styles.actionRow}>
        <AplusButton title="Cấp quyền mới" leftIcon="key" disabled={!profile.membership.permissions.addKey || profile.membership.status !== 'active'} onPress={() => navigation.navigate('CredentialHub', undefined)} style={styles.flexButton} />
        <AplusButton title="Revoke user" leftIcon="revoked" variant="danger" disabled={!canRevoke} loading={loading} onPress={revokeAll} style={styles.flexButton} />
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, borderColor: theme.colors.borderStrong},
  avatarLarge: {width: 84, height: 84, borderRadius: theme.radius.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySoft, borderWidth: 1, borderColor: theme.colors.borderStrong},
  heroText: {flex: 1, gap: theme.spacing.sm},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  card: {gap: theme.spacing.md},
  noticeCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, borderColor: 'rgba(47,213,127,0.35)'},
  infoRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md, paddingVertical: theme.spacing.xs, borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  infoValue: {flex: 1, textAlign: 'right', fontWeight: theme.typography.weight.semibold},
  actionRow: {flexDirection: 'row', gap: theme.spacing.md},
  flexButton: {flex: 1},
});

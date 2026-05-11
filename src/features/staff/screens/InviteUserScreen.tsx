import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {StatusChip} from '@/components/base/StatusChip';
import {canGrantRole, getRoleLabel} from '@/services/credential/credentialCatalog';
import {MockCredentialRepository} from '@/services/repositories/MockCredentialRepository';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {theme} from '@/theme/theme';
import type {MembershipScopeType, PersonRole, UserInvite} from '@/types/credential';

const roles: PersonRole[] = ['SubAdmin', 'Staff', 'Tenant', 'Guest', 'Cleaner', 'Security'];
const scopes: Array<{label: string; type: MembershipScopeType}> = [
  {label: 'Aplus Boutique Hotel', type: 'home'},
  {label: 'Căn hộ 520', type: 'lock'},
  {label: 'Aplus Office · Tầng 8', type: 'floor'},
  {label: 'Phòng 802', type: 'room'},
];

function inviteTone(status: UserInvite['status']) {
  if (status === 'accepted') {
    return 'success' as const;
  }
  if (status === 'pending') {
    return 'warning' as const;
  }
  return 'danger' as const;
}

export function InviteUserScreen({role: initialRole}: {role?: PersonRole}) {
  const navigation = useAplusNavigation();
  const [account, setAccount] = useState('new.user@aplus.vn');
  const [role, setRole] = useState<PersonRole>(initialRole ?? 'Staff');
  const [scopeIndex, setScopeIndex] = useState(0);
  const [expiresInDays, setExpiresInDays] = useState('3');
  const [created, setCreated] = useState<UserInvite | undefined>();
  const [invites, setInvites] = useState<UserInvite[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const loadInvites = async () => setInvites(await MockCredentialRepository.getInvites('all'));

  useEffect(() => {
    loadInvites();
  }, []);

  const create = async () => {
    setError(undefined);
    setSaving(true);
    try {
      const invite = await MockCredentialRepository.createInvite({
        account,
        role,
        scopeType: scopes[scopeIndex].type,
        scopeLabel: scopes[scopeIndex].label,
        channel: account.includes('@') ? 'email' : 'phone',
        expiresInDays: Number(expiresInDays) || 3,
      });
      setCreated(invite);
      await loadInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được invite.');
    } finally {
      setSaving(false);
    }
  };

  const accept = async (inviteId: string) => {
    await MockCredentialRepository.acceptInvite(inviteId);
    await loadInvites();
  };

  const revoke = async (inviteId: string) => {
    await MockCredentialRepository.revokeInvite(inviteId);
    await loadInvites();
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Mời user bằng QR/link" subtitle="UI-50 · Invite user" canGoBack onBack={navigation.goBack} showLogo rightIcon="matrix" onRightPress={() => navigation.navigate('RoleMatrix')} />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="qr" size={46} color={theme.colors.primary} boxed boxSize={80} />
        <View style={styles.heroText}>
          <AplusText variant="hero">Invite QR/link</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>Tạo lời mời Pending, gắn role/phạm vi/thời hạn. Owner mock không được mời trực tiếp; SubAdmin không cấp role cao hơn mình.</AplusText>
        </View>
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusTextField label="Email hoặc số điện thoại" value={account} onChangeText={setAccount} leftIcon="email" autoCapitalize="none" />
        <View style={styles.sectionBlock}>
          <AplusText variant="label">Role</AplusText>
          <View style={styles.chipRow}>
            {roles.map(item => {
              const allowed = canGrantRole('Owner', item);
              return (
                <Pressable key={item} disabled={!allowed} onPress={() => setRole(item)} style={[styles.choiceChip, role === item ? styles.choiceActive : null, !allowed ? styles.choiceDisabled : null]}>
                  <AplusText variant="caption">{getRoleLabel(item)}</AplusText>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.sectionBlock}>
          <AplusText variant="label">Phạm vi</AplusText>
          <View style={styles.chipRow}>
            {scopes.map((item, index) => (
              <Pressable key={item.label} onPress={() => setScopeIndex(index)} style={[styles.choiceChip, scopeIndex === index ? styles.choiceActive : null]}>
                <AplusText variant="caption">{item.label}</AplusText>
              </Pressable>
            ))}
          </View>
        </View>
        <AplusTextField label="Hết hạn sau số ngày" value={expiresInDays} onChangeText={setExpiresInDays} keyboardType="number-pad" leftIcon="calendar" />
        {error ? <AplusText variant="caption" color={theme.colors.danger}>{error}</AplusText> : null}
        <AplusButton title="Tạo invite" leftIcon="qr" loading={saving} onPress={create} />
      </AplusCard>

      {created ? (
        <AplusCard style={styles.createdCard}>
          <View style={styles.qrBox}>
            <AplusIcon name="qr" size={58} color={theme.colors.text} />
          </View>
          <View style={styles.heroText}>
            <AplusText variant="subtitle">Invite đã tạo</AplusText>
            <AplusText variant="caption">Link: {created.inviteUrl}</AplusText>
            <AplusText variant="caption">QR payload: {created.qrPayload}</AplusText>
            <View style={styles.chipRow}>
              <StatusChip label={getRoleLabel(created.role)} tone="info" />
              <StatusChip label={created.status} tone={inviteTone(created.status)} />
            </View>
          </View>
        </AplusCard>
      ) : null}

      <View style={styles.sectionHeader}>
        <AplusText variant="subtitle">Invite gần đây</AplusText>
        <StatusChip label={`${invites.length} lời mời`} tone="info" />
      </View>
      <View style={styles.list}>
        {invites.map(invite => (
          <AplusCard key={invite.id} style={styles.inviteCard}>
            <View style={styles.inviteHeader}>
              <View style={styles.heroText}>
                <AplusText variant="body" style={styles.bold}>{invite.account}</AplusText>
                <AplusText variant="caption">{getRoleLabel(invite.role)} · {invite.scopeLabel}</AplusText>
              </View>
              <StatusChip label={invite.status} tone={inviteTone(invite.status)} />
            </View>
            <AplusText variant="caption" color={theme.colors.textSubtle}>Token: {invite.token} · Hết hạn: {new Date(invite.expiresAt).toLocaleDateString('vi-VN')}</AplusText>
            {invite.status === 'pending' ? (
              <View style={styles.actionRow}>
                <AplusButton title="Accept mock" leftIcon="check" variant="secondary" onPress={() => accept(invite.id)} style={styles.flexButton} />
                <AplusButton title="Revoke" leftIcon="revoked" variant="ghost" onPress={() => revoke(invite.id)} style={styles.flexButton} />
              </View>
            ) : null}
          </AplusCard>
        ))}
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, borderColor: theme.colors.borderStrong},
  heroText: {flex: 1, gap: theme.spacing.sm},
  card: {gap: theme.spacing.lg},
  sectionBlock: {gap: theme.spacing.sm},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  choiceChip: {paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong},
  choiceActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  choiceDisabled: {opacity: 0.35},
  createdCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, borderColor: theme.colors.borderStrong},
  qrBox: {width: 96, height: 96, borderRadius: theme.radius.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceStrong, borderWidth: 1, borderColor: theme.colors.borderStrong},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md},
  list: {gap: theme.spacing.md},
  inviteCard: {gap: theme.spacing.md},
  inviteHeader: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing.md},
  actionRow: {flexDirection: 'row', gap: theme.spacing.md},
  flexButton: {flex: 1},
  bold: {fontWeight: theme.typography.weight.bold},
});

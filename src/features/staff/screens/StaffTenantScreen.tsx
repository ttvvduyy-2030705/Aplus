import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {StatusChip} from '@/components/base/StatusChip';
import {EmptyState} from '@/components/feedback/EmptyState';
import {LoadingView} from '@/components/feedback/LoadingView';
import {getRoleLabel} from '@/services/credential/credentialCatalog';
import {MockCredentialRepository} from '@/services/repositories/MockCredentialRepository';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {theme} from '@/theme/theme';
import type {MemberProfile, PersonRole, StaffSummary} from '@/types/credential';

const roleFilters: Array<{label: string; value: PersonRole | 'all'}> = [
  {label: 'Tất cả', value: 'all'},
  {label: 'Sub admin', value: 'SubAdmin'},
  {label: 'Nhân sự', value: 'Staff'},
  {label: 'Khách thuê', value: 'Tenant'},
  {label: 'Khách', value: 'Guest'},
  {label: 'Cleaner', value: 'Cleaner'},
  {label: 'Security', value: 'Security'},
];

function formatDate(timestamp?: number) {
  if (!timestamp) {
    return 'Không giới hạn';
  }
  return new Date(timestamp).toLocaleDateString('vi-VN');
}

function statusTone(profile: MemberProfile) {
  if (profile.membership.status === 'revoked' || profile.membership.status === 'expired') {
    return 'danger' as const;
  }
  if (profile.membership.expiresAt && profile.membership.expiresAt < Date.now() + 1000 * 60 * 60 * 24 * 14) {
    return 'warning' as const;
  }
  return 'success' as const;
}

function Metric({label, value}: {label: string; value: number}) {
  return (
    <AplusCard style={styles.metricCard}>
      <AplusText variant="hero">{value}</AplusText>
      <AplusText variant="caption">{label}</AplusText>
    </AplusCard>
  );
}

function MemberCard({profile, onPress}: {profile: MemberProfile; onPress: () => void}) {
  const expired = profile.membership.status === 'expired' || profile.membership.status === 'revoked';
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.memberCard, pressed ? styles.pressed : null, expired ? styles.inactive : null]}>
      <View style={styles.avatar}>
        <AplusText variant="subtitle">{profile.person.avatarLabel}</AplusText>
      </View>
      <View style={styles.memberInfo}>
        <View style={styles.memberTitleRow}>
          <AplusText variant="body" style={styles.bold}>{profile.person.fullName}</AplusText>
          <StatusChip label={getRoleLabel(profile.person.role)} tone={statusTone(profile)} />
        </View>
        <AplusText variant="caption">{profile.person.phone}{profile.person.email ? ` · ${profile.person.email}` : ''}</AplusText>
        <AplusText variant="caption" color={theme.colors.textSubtle}>{profile.membership.scopeLabel} · Hạn: {formatDate(profile.membership.expiresAt)}</AplusText>
        <View style={styles.chipRow}>
          <StatusChip label={`${profile.activeCredentialCount} active key`} tone={profile.activeCredentialCount ? 'success' : 'muted'} />
          <StatusChip label={profile.membership.permissions.addKey ? 'Add key' : 'No add key'} tone={profile.membership.permissions.addKey ? 'success' : 'warning'} />
          <StatusChip label={profile.membership.permissions.staff ? 'Staff mgmt' : 'No staff'} tone={profile.membership.permissions.staff ? 'success' : 'warning'} />
        </View>
      </View>
      <AplusIcon name="chevron" size={18} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export function StaffTenantScreen() {
  const navigation = useAplusNavigation();
  const [summary, setSummary] = useState<StaffSummary>({total: 0, subAdmins: 0, staff: 0, tenants: 0, guests: 0, expiringSoon: 0, pendingInvites: 0});
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [role, setRole] = useState<PersonRole | 'all'>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [nextSummary, nextProfiles] = await Promise.all([
      MockCredentialRepository.getStaffSummary(),
      MockCredentialRepository.getMemberProfiles({role, query}),
    ]);
    setSummary(nextSummary);
    setProfiles(nextProfiles);
    setLoading(false);
  }, [query, role]);

  useEffect(() => {
    load();
  }, [load]);

  const activeProfiles = useMemo(() => profiles.filter(item => item.membership.status === 'active').length, [profiles]);

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Nhân sự & khách thuê" subtitle="UI-08 · Staff/Tenant hub" canGoBack={navigation.canGoBack} onBack={navigation.goBack} showLogo rightIcon="matrix" onRightPress={() => navigation.navigate('RoleMatrix')} />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="user" size={48} color={theme.colors.primary} boxed boxSize={82} />
        <View style={styles.heroText}>
          <AplusText variant="hero">Quản lý người dùng</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>Role rõ cho Owner, SubAdmin, Staff, Tenant, Guest, Cleaner và Security. Kết thúc thuê/nghỉ việc sẽ revoke toàn bộ credential liên quan.</AplusText>
          <View style={styles.chipRow}>
            <StatusChip label={`${activeProfiles} đang hoạt động`} tone="success" />
            <StatusChip label={`${summary.pendingInvites} invite pending`} tone="warning" />
            <StatusChip label="UI-08" tone="info" />
          </View>
        </View>
      </AplusCard>

      <View style={styles.metricRow}>
        <Metric label="Tổng user" value={summary.total} />
        <Metric label="Sub admin" value={summary.subAdmins} />
      </View>
      <View style={styles.metricRow}>
        <Metric label="Nhân sự" value={summary.staff} />
        <Metric label="Sắp hết hạn" value={summary.expiringSoon} />
      </View>

      <View style={styles.actionRow}>
        <AplusButton title="Mời user" leftIcon="qr" onPress={() => navigation.navigate('InviteUser', undefined)} style={styles.flexButton} />
        <AplusButton title="Sub admin" leftIcon="admin" variant="secondary" onPress={() => navigation.navigate('SubAdmin')} style={styles.flexButton} />
        <AplusButton title="Role matrix" leftIcon="matrix" variant="ghost" onPress={() => navigation.navigate('RoleMatrix')} style={styles.flexButton} />
      </View>

      <AplusTextField label="Tìm người" placeholder="Tên, số điện thoại, email, phạm vi..." value={query} onChangeText={setQuery} leftIcon="user" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {roleFilters.map(item => (
          <Pressable key={item.value} onPress={() => setRole(item.value)} style={[styles.filterChip, role === item.value ? styles.filterActive : null]}>
            <AplusText variant="caption" color={role === item.value ? theme.colors.text : theme.colors.textMuted}>{item.label}</AplusText>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? <LoadingView /> : null}
      {!loading && profiles.length === 0 ? <EmptyState title="Không có thành viên" message="Đổi bộ lọc hoặc mời user mới bằng QR/link." actionLabel="Mời user" onAction={() => navigation.navigate('InviteUser', undefined)} /> : null}
      <View style={styles.list}>
        {profiles.map(profile => <MemberCard key={profile.person.id} profile={profile} onPress={() => navigation.navigate('MemberDetail', {personId: profile.person.id})} />)}
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, borderColor: theme.colors.borderStrong},
  heroText: {flex: 1, gap: theme.spacing.sm},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  metricRow: {flexDirection: 'row', gap: theme.spacing.md},
  metricCard: {flex: 1, gap: theme.spacing.xs},
  actionRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md},
  flexButton: {flexBasis: '30%', flexGrow: 1},
  filterRow: {gap: theme.spacing.sm, paddingRight: theme.spacing.xl},
  filterChip: {paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface},
  filterActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  list: {gap: theme.spacing.md},
  memberCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.lg, borderRadius: theme.radius.xl, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface},
  pressed: {opacity: 0.86, transform: [{scale: 0.99}]},
  inactive: {opacity: 0.66},
  avatar: {width: 52, height: 52, borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySoft, borderWidth: 1, borderColor: theme.colors.borderStrong},
  memberInfo: {flex: 1, gap: theme.spacing.xs},
  memberTitleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm},
  bold: {fontWeight: theme.typography.weight.bold},
});

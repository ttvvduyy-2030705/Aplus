import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {StatusChip} from '@/components/base/StatusChip';
import {MockCredentialRepository} from '@/services/repositories/MockCredentialRepository';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {theme} from '@/theme/theme';
import type {MemberProfile} from '@/types/credential';

export function SubAdminScreen() {
  const navigation = useAplusNavigation();
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);

  useEffect(() => {
    MockCredentialRepository.getMemberProfiles({role: 'SubAdmin'}).then(setProfiles);
  }, []);

  const canAddPassword = useMemo(() => profiles.every(profile => profile.membership.permissions.addKey), [profiles]);

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Quản trị phụ" subtitle="UI-13 · Sub admin" canGoBack onBack={navigation.goBack} showLogo rightIcon="matrix" onRightPress={() => navigation.navigate('RoleMatrix')} />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="admin" size={48} color={theme.colors.primary} boxed boxSize={82} />
        <View style={styles.heroText}>
          <AplusText variant="hero">Sub admin</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>Quản trị phụ có thể quản lý phạm vi được giao, nhưng không được cấp quyền cao hơn mình và không được đổi settings hệ thống nếu matrix không cho phép.</AplusText>
          <View style={styles.chipRow}>
            <StatusChip label={`${profiles.length} sub admin`} tone="info" />
            <StatusChip label={canAddPassword ? 'Có addKey' : 'Thiếu addKey'} tone={canAddPassword ? 'success' : 'warning'} />
          </View>
        </View>
      </AplusCard>

      <View style={styles.actionRow}>
        <AplusButton title="Mời SubAdmin" leftIcon="qr" onPress={() => navigation.navigate('InviteUser', {role: 'SubAdmin'})} style={styles.flexButton} />
        <AplusButton title="Role matrix" leftIcon="matrix" variant="secondary" onPress={() => navigation.navigate('RoleMatrix')} style={styles.flexButton} />
      </View>

      <View style={styles.list}>
        {profiles.map(profile => (
          <AplusCard key={profile.person.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.avatar}><AplusText variant="subtitle">{profile.person.avatarLabel}</AplusText></View>
              <View style={styles.info}>
                <AplusText variant="subtitle">{profile.person.fullName}</AplusText>
                <AplusText variant="caption">{profile.person.phone} · {profile.membership.scopeLabel}</AplusText>
              </View>
              <StatusChip label={profile.membership.status} tone={profile.membership.status === 'active' ? 'success' : 'danger'} />
            </View>
            <View style={styles.chipRow}>
              <StatusChip label={profile.membership.permissions.addKey ? 'Add key' : 'No add key'} tone={profile.membership.permissions.addKey ? 'success' : 'danger'} />
              <StatusChip label={profile.membership.permissions.staff ? 'Staff' : 'No staff'} tone={profile.membership.permissions.staff ? 'success' : 'warning'} />
              <StatusChip label={profile.membership.permissions.settings ? 'Settings' : 'No settings'} tone={profile.membership.permissions.settings ? 'success' : 'warning'} />
            </View>
            <AplusButton title="Chi tiết thành viên" leftIcon="user" variant="ghost" onPress={() => navigation.navigate('MemberDetail', {personId: profile.person.id})} />
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
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  actionRow: {flexDirection: 'row', gap: theme.spacing.md},
  flexButton: {flex: 1},
  list: {gap: theme.spacing.md},
  card: {gap: theme.spacing.md},
  row: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md},
  avatar: {width: 48, height: 48, borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySoft, borderWidth: 1, borderColor: theme.colors.borderStrong},
  info: {flex: 1, gap: theme.spacing.xs},
});

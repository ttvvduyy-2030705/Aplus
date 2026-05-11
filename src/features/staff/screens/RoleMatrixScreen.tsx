import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {StatusChip} from '@/components/base/StatusChip';
import {getRoleLabel} from '@/services/credential/credentialCatalog';
import {MockCredentialRepository} from '@/services/repositories/MockCredentialRepository';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {theme} from '@/theme/theme';
import type {PermissionAction, PermissionMatrixEntry} from '@/types/credential';

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

export function RoleMatrixScreen() {
  const navigation = useAplusNavigation();
  const [matrix, setMatrix] = useState<PermissionMatrixEntry[]>([]);

  useEffect(() => {
    MockCredentialRepository.getPermissionMatrix().then(setMatrix);
  }, []);

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Ma trận phân quyền" subtitle="UI-48 · Role matrix" canGoBack onBack={navigation.goBack} showLogo rightIcon="shield" />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="matrix" size={42} color={theme.colors.primary} boxed boxSize={76} />
        <View style={styles.heroText}>
          <AplusText variant="hero">PermissionMatrix</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>Bảng quyền nền dùng cho Staff/Tenant, Credential Hub và các flow nhạy cảm. SubAdmin không được cấp quyền cao hơn mình.</AplusText>
        </View>
      </AplusCard>

      <View style={styles.list}>
        {matrix.map(entry => (
          <AplusCard key={entry.role} style={styles.roleCard}>
            <View style={styles.roleHeader}>
              <View>
                <AplusText variant="subtitle">{entry.label}</AplusText>
                <AplusText variant="caption">Role: {entry.role}</AplusText>
              </View>
              <StatusChip label={`${entry.canGrantRoles.length} grant role`} tone={entry.canGrantRoles.length ? 'success' : 'muted'} />
            </View>
            <View style={styles.permissionGrid}>
              {actionLabels.map(action => (
                <StatusChip key={action.key} label={action.label} tone={entry.permissions[action.key] ? 'success' : 'danger'} />
              ))}
            </View>
            <View style={styles.grantBlock}>
              <AplusText variant="label">Có thể mời/cấp role</AplusText>
              <View style={styles.permissionGrid}>
                {entry.canGrantRoles.length ? entry.canGrantRoles.map(role => <StatusChip key={role} label={getRoleLabel(role)} tone="info" />) : <StatusChip label="Không cấp role" tone="muted" />}
              </View>
            </View>
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
  list: {gap: theme.spacing.md},
  roleCard: {gap: theme.spacing.md},
  roleHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md},
  permissionGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  grantBlock: {gap: theme.spacing.sm, paddingTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border},
});

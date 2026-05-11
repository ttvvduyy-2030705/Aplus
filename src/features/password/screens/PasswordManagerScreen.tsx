import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {StatusChip} from '@/components/base/StatusChip';
import {MockPasswordRepository, getPasswordKindLabel, getPasswordStatusLabel} from '@/services/repositories/MockPasswordRepository';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {PasswordCredential, PasswordStatus, PasswordSummary} from '@/types/password';

type PasswordFilter = 'all' | 'active' | 'pending' | 'revoked' | 'expired';

function formatDate(timestamp?: number) {
  if (!timestamp) {
    return 'Không giới hạn';
  }
  return new Date(timestamp).toLocaleDateString('vi-VN');
}

function statusTone(status: PasswordStatus): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (status === 'active') {
    return 'success';
  }
  if (status === 'pendingSync' || status === 'pendingRevoke' || status === 'paused') {
    return 'warning';
  }
  if (status === 'revoked' || status === 'expired') {
    return 'danger';
  }
  if (status === 'used') {
    return 'info';
  }
  return 'muted';
}

function matchesFilter(password: PasswordCredential, filter: PasswordFilter) {
  if (filter === 'all') {
    return true;
  }
  if (filter === 'pending') {
    return password.status === 'pendingSync' || password.status === 'pendingRevoke';
  }
  if (filter === 'revoked') {
    return password.status === 'revoked' || password.status === 'pendingRevoke';
  }
  if (filter === 'expired') {
    return password.status === 'expired' || password.status === 'used';
  }
  return password.status === 'active' || password.status === 'pendingSync';
}

function SummaryBox({label, value, tone}: {label: string; value: number; tone: 'success' | 'warning' | 'danger' | 'info'}) {
  return (
    <AplusCard style={styles.summaryBox}>
      <StatusChip label={label} tone={tone} />
      <AplusText variant="title">{value}</AplusText>
    </AplusCard>
  );
}

function FilterButton({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.filterButton, active ? styles.filterActive : null, pressed ? styles.pressed : null]}>
      <AplusText variant="caption" color={active ? theme.colors.text : theme.colors.textMuted}>{label}</AplusText>
    </Pressable>
  );
}

function PasswordRow({password}: {password: PasswordCredential}) {
  const navigation = useAplusNavigation();
  return (
    <Pressable onPress={() => navigation.navigate('PasswordDetail', {passwordId: password.id})} style={({pressed}) => [styles.passwordCard, pressed ? styles.pressed : null]}>
      <AplusIcon name={password.kind === 'recurring' ? 'calendar' : password.kind === 'oneTime' ? 'pin' : 'password'} size={28} color={theme.colors.primary} boxed boxSize={52} />
      <View style={styles.passwordText}>
        <View style={styles.rowTitle}>
          <AplusText variant="body" style={styles.bold}>{password.title}</AplusText>
          <StatusChip label={getPasswordStatusLabel(password.status)} tone={statusTone(password.status)} />
        </View>
        <AplusText variant="caption">{password.lockName} · {password.roomName} · {getPasswordKindLabel(password.kind)}</AplusText>
        <AplusText variant="caption" color={theme.colors.textSubtle}>Người nhận: {password.ownerName} · Hạn: {formatDate(password.validTo)} · Dùng: {password.useCount}{password.maxUseCount ? `/${password.maxUseCount}` : ''}</AplusText>
      </View>
      <AplusIcon name="chevron" size={18} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export function PasswordManagerScreen({lockId}: {lockId?: string}) {
  const navigation = useAplusNavigation();
  const {findLock, isOffline} = useAppState();
  const lock = lockId ? findLock(lockId) : undefined;
  const [passwords, setPasswords] = useState<PasswordCredential[]>([]);
  const [summary, setSummary] = useState<PasswordSummary>({total: 0, active: 0, pending: 0, revoked: 0, expired: 0, used: 0});
  const [filter, setFilter] = useState<PasswordFilter>('all');
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const [list, nextSummary] = await Promise.all([
      MockPasswordRepository.getPasswords(lockId),
      MockPasswordRepository.getSummary(lockId),
    ]);
    setPasswords(list);
    setSummary(nextSummary);
    setLoading(false);
  }, [lockId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const visiblePasswords = useMemo(() => passwords.filter(item => matchesFilter(item, filter)), [filter, passwords]);

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Quản lý mật khẩu" subtitle={lock ? `${lock.name} · UI-03` : 'Toàn bộ khóa · UI-03'} canGoBack onBack={navigation.goBack} showLogo rightIcon="plus" onRightPress={() => navigation.navigate('AddPassword', {lockId})} />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="password" size={46} color={theme.colors.primary} boxed boxSize={78} />
        <View style={styles.heroText}>
          <AplusText variant="hero">Password Hub</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>Tạo mã thường, mã tạm, mã một lần, mã chu kỳ; quản lý đồng bộ, gia hạn và thu hồi.</AplusText>
          <View style={styles.chipRow}>
            <StatusChip label="Policy 6-10 số" tone="info" />
            <StatusChip label={isOffline ? 'Offline: tạo PendingSync' : 'Online: sync ngay'} tone={isOffline ? 'warning' : 'success'} />
          </View>
        </View>
      </AplusCard>

      <View style={styles.summaryGrid}>
        <SummaryBox label="Active" value={summary.active} tone="success" />
        <SummaryBox label="Pending" value={summary.pending} tone="warning" />
        <SummaryBox label="Revoked" value={summary.revoked} tone="danger" />
      </View>

      <View style={styles.filterRow}>
        <FilterButton label="Tất cả" active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterButton label="Hiệu lực" active={filter === 'active'} onPress={() => setFilter('active')} />
        <FilterButton label="Pending" active={filter === 'pending'} onPress={() => setFilter('pending')} />
        <FilterButton label="Thu hồi" active={filter === 'revoked'} onPress={() => setFilter('revoked')} />
        <FilterButton label="Hết hạn" active={filter === 'expired'} onPress={() => setFilter('expired')} />
      </View>

      <AplusButton title="Thêm mật khẩu" leftIcon="plus" onPress={() => navigation.navigate('AddPassword', {lockId})} />

      {loading ? (
        <AplusCard style={styles.emptyCard}><AplusText variant="body">Đang tải danh sách mật khẩu...</AplusText></AplusCard>
      ) : visiblePasswords.length === 0 ? (
        <AplusCard style={styles.emptyCard}>
          <AplusIcon name="password" size={42} color={theme.colors.textMuted} />
          <AplusText variant="subtitle">Không có mật khẩu phù hợp</AplusText>
          <AplusText variant="caption">Bấm thêm mật khẩu để tạo mã mới cho khóa/phòng.</AplusText>
        </AplusCard>
      ) : (
        <View style={styles.list}>
          {visiblePasswords.map(password => <PasswordRow key={password.id} password={password} />)}
        </View>
      )}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, borderColor: theme.colors.borderStrong},
  heroText: {flex: 1, gap: theme.spacing.sm},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  summaryGrid: {flexDirection: 'row', gap: theme.spacing.md},
  summaryBox: {flex: 1, gap: theme.spacing.sm},
  filterRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  filterButton: {borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.surfaceStrong},
  filterActive: {borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.primarySoft},
  list: {gap: theme.spacing.md},
  passwordCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.lg, borderRadius: theme.radius.xl, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface},
  pressed: {opacity: 0.86, transform: [{scale: 0.99}]},
  passwordText: {flex: 1, gap: 4},
  rowTitle: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap'},
  bold: {fontWeight: theme.typography.weight.bold},
  emptyCard: {alignItems: 'center', gap: theme.spacing.md},
});

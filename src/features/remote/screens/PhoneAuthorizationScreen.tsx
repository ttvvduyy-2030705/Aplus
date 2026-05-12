import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {StatusChip} from '@/components/base/StatusChip';
import {useLanguage} from '@/i18n/LanguageContext';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {getRoleLabel} from '@/services/credential/credentialCatalog';
import {MockRemoteAccessRepository} from '@/services/repositories/MockRemoteAccessRepository';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {InviteChannel, InviteStatus, PersonRole} from '@/types/credential';
import type {PhoneAuthorization} from '@/types/remote';

const roles: PersonRole[] = ['SubAdmin', 'Staff', 'Tenant', 'Guest', 'Cleaner', 'Security'];
const channels: InviteChannel[] = ['qr', 'link', 'email', 'phone'];

const copy = {
  vi: {
    title: 'Ủy quyền điện thoại',
    subtitle: 'UI-04 + UI-50 · Phone auth QR/link',
    heroTitle: 'Phone authorization',
    heroBody: 'Mời user bằng email/số điện thoại/QR/link, chọn role, phạm vi, thời hạn và theo dõi trạng thái lời mời.',
    lock: 'Khóa',
    account: 'Email hoặc số điện thoại',
    displayName: 'Tên hiển thị',
    role: 'Vai trò',
    channel: 'Kênh mời',
    expires: 'Hạn mời (ngày)',
    create: 'Tạo invite',
    list: 'Lời mời & phone auth',
    pending: 'Pending',
    accepted: 'Accepted',
    expired: 'Expired',
    revoked: 'Revoked',
    accept: 'Mock accept',
    revoke: 'Thu hồi',
    copyLink: 'Copy link mock',
    noData: 'Chưa có lời mời điện thoại phù hợp.',
    qr: 'QR payload',
    link: 'Invite link',
    permission: 'PermissionSet',
    blockedOwner: 'Owner không được mời trực tiếp qua link.',
    successCreate: 'Đã tạo lời mời điện thoại.',
    successAccept: 'Invite đã chuyển Accepted và tạo credential phone.',
    successRevoke: 'Đã thu hồi phone authorization.',
    missingAccount: 'Vui lòng nhập email hoặc số điện thoại.',
  },
  en: {
    title: 'Phone authorization',
    subtitle: 'UI-04 + UI-50 · Phone auth QR/link',
    heroTitle: 'Phone authorization',
    heroBody: 'Invite users by email/phone/QR/link, select role, scope and expiry, then track invite status.',
    lock: 'Lock',
    account: 'Email or phone number',
    displayName: 'Display name',
    role: 'Role',
    channel: 'Invite channel',
    expires: 'Invite expiry (days)',
    create: 'Create invite',
    list: 'Invites & phone auth',
    pending: 'Pending',
    accepted: 'Accepted',
    expired: 'Expired',
    revoked: 'Revoked',
    accept: 'Mock accept',
    revoke: 'Revoke',
    copyLink: 'Copy link mock',
    noData: 'No matching phone authorization yet.',
    qr: 'QR payload',
    link: 'Invite link',
    permission: 'PermissionSet',
    blockedOwner: 'Owner cannot be directly invited by link.',
    successCreate: 'Phone invite created.',
    successAccept: 'Invite accepted and phone credential created.',
    successRevoke: 'Phone authorization revoked.',
    missingAccount: 'Enter an email or phone number.',
  },
};

function statusTone(status: InviteStatus): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (status === 'accepted') {
    return 'success';
  }
  if (status === 'pending') {
    return 'warning';
  }
  if (status === 'expired' || status === 'revoked') {
    return 'danger';
  }
  return 'muted';
}

function statusLabel(status: InviteStatus, t: typeof copy.vi) {
  if (status === 'accepted') {
    return t.accepted;
  }
  if (status === 'expired') {
    return t.expired;
  }
  if (status === 'revoked') {
    return t.revoked;
  }
  return t.pending;
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('vi-VN');
}

function PermissionBadges({auth, t}: {auth: PhoneAuthorization; t: typeof copy.vi}) {
  const permissionEntries = Object.entries(auth.permissions).filter(([, enabled]) => enabled).slice(0, 6);
  return (
    <View style={styles.badgeRow}>
      <StatusChip label={t.permission} tone="info" />
      {permissionEntries.map(([key]) => <StatusChip key={key} label={key} tone="success" />)}
    </View>
  );
}

function PhoneAuthRow({auth, onAccept, onRevoke, onCopy, t}: {auth: PhoneAuthorization; onAccept: (id: string) => void; onRevoke: (id: string) => void; onCopy: (auth: PhoneAuthorization) => void; t: typeof copy.vi}) {
  return (
    <AplusCard style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <AplusIcon name="phone" size={26} color={auth.status === 'accepted' ? theme.colors.success : theme.colors.primary} boxed />
        <View style={styles.itemText}>
          <AplusText variant="body" style={styles.bold}>{auth.displayName}</AplusText>
          <AplusText variant="caption">{auth.account} · {getRoleLabel(auth.role)} · {auth.lockName}</AplusText>
        </View>
        <StatusChip label={statusLabel(auth.status, t)} tone={statusTone(auth.status)} />
      </View>
      <AplusText variant="caption">{auth.scopeLabel} · Exp: {formatDate(auth.expiresAt)}</AplusText>
      <PermissionBadges auth={auth} t={t} />
      <AplusCard style={styles.qrCard}>
        <AplusIcon name="qr" size={28} color={theme.colors.primary} />
        <View style={styles.itemText}>
          <AplusText variant="label">{t.qr}</AplusText>
          <AplusText variant="caption" numberOfLines={2}>{auth.qrPayload}</AplusText>
          <AplusText variant="label">{t.link}</AplusText>
          <AplusText variant="caption" numberOfLines={1}>{auth.inviteUrl}</AplusText>
        </View>
      </AplusCard>
      <View style={styles.actionRow}>
        <AplusButton title={t.accept} leftIcon="check" variant="secondary" disabled={auth.status !== 'pending'} onPress={() => onAccept(auth.id)} style={styles.flexButton} />
        <AplusButton title={t.copyLink} leftIcon="qr" variant="ghost" onPress={() => onCopy(auth)} style={styles.flexButton} />
        <AplusButton title={t.revoke} leftIcon="revoked" variant="danger" disabled={auth.status === 'revoked'} onPress={() => onRevoke(auth.id)} style={styles.flexButton} />
      </View>
    </AplusCard>
  );
}

export function PhoneAuthorizationScreen({lockId}: {lockId?: string; recipientId?: string}) {
  const navigation = useAplusNavigation();
  const {language} = useLanguage();
  const t = language === 'en' ? copy.en : copy.vi;
  const {locks, reloadAccessRecords, reloadLocks} = useAppState();
  const selectedLock = useMemo(() => locks.find(lock => lock.id === lockId) ?? locks[0], [lockId, locks]);
  const [account, setAccount] = useState('guest.phone@aplus.vn');
  const [displayName, setDisplayName] = useState('Khách dùng điện thoại');
  const [role, setRole] = useState<PersonRole>('Guest');
  const [channel, setChannel] = useState<InviteChannel>('qr');
  const [expiresInDays, setExpiresInDays] = useState('3');
  const [items, setItems] = useState<PhoneAuthorization[]>([]);
  const [message, setMessage] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    const list = await MockRemoteAccessRepository.getPhoneAuthorizations(selectedLock?.id);
    setItems(list);
  }, [selectedLock?.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const createInvite = async () => {
    if (!selectedLock) {
      return;
    }
    if (!account.trim()) {
      setMessage(t.missingAccount);
      return;
    }
    setLoading(true);
    setMessage(undefined);
    try {
      await MockRemoteAccessRepository.createPhoneAuthorization({
        lockId: selectedLock.id,
        account,
        displayName,
        role,
        channel,
        expiresInDays: Number.parseInt(expiresInDays, 10) || 1,
      });
      setMessage(t.successCreate);
      await Promise.all([reload(), reloadAccessRecords(selectedLock.id)]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Create invite failed');
    } finally {
      setLoading(false);
    }
  };

  const accept = async (authId: string) => {
    await MockRemoteAccessRepository.acceptPhoneAuthorization(authId);
    await Promise.all([reload(), reloadLocks(), reloadAccessRecords(selectedLock?.id)]);
    setMessage(t.successAccept);
  };

  const revoke = async (authId: string) => {
    await MockRemoteAccessRepository.revokePhoneAuthorization(authId);
    await Promise.all([reload(), reloadLocks(), reloadAccessRecords(selectedLock?.id)]);
    setMessage(t.successRevoke);
  };

  const copyLink = (auth: PhoneAuthorization) => {
    setMessage(`${t.copyLink}: ${auth.inviteUrl}`);
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={t.title} subtitle={selectedLock ? `${selectedLock.name} · ${t.subtitle}` : t.subtitle} canGoBack onBack={navigation.goBack} showLogo rightIcon="qr" onRightPress={() => navigation.navigate('InviteUser', {role})} />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="phone" size={48} color={theme.colors.primary} boxed boxSize={82} />
        <View style={styles.heroText}>
          <AplusText variant="hero">{t.heroTitle}</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>{t.heroBody}</AplusText>
          <View style={styles.badgeRow}>
            <StatusChip label={selectedLock ? `${t.lock}: ${selectedLock.roomName}` : t.lock} tone="info" />
            <StatusChip label={t.blockedOwner} tone="warning" />
          </View>
        </View>
      </AplusCard>

      <AplusCard style={styles.formCard}>
        <AplusText variant="subtitle">{t.create}</AplusText>
        <AplusTextField label={t.account} leftIcon="email" value={account} onChangeText={setAccount} keyboardType="email-address" autoCapitalize="none" />
        <AplusTextField label={t.displayName} leftIcon="user" value={displayName} onChangeText={setDisplayName} />
        <View style={styles.formRow}>
          <AplusTextField label={t.expires} leftIcon="calendar" value={expiresInDays} onChangeText={setExpiresInDays} keyboardType="number-pad" containerStyle={styles.flexButton} />
        </View>
        <AplusText variant="label">{t.role}</AplusText>
        <View style={styles.choiceRow}>
          {roles.map(item => (
            <Pressable key={item} onPress={() => setRole(item)} style={({pressed}) => [styles.choiceChip, role === item ? styles.choiceActive : null, pressed ? styles.pressed : null]}>
              <AplusText variant="caption" style={role === item ? styles.bold : undefined}>{getRoleLabel(item)}</AplusText>
            </Pressable>
          ))}
        </View>
        <AplusText variant="label">{t.channel}</AplusText>
        <View style={styles.choiceRow}>
          {channels.map(item => (
            <Pressable key={item} onPress={() => setChannel(item)} style={({pressed}) => [styles.choiceChip, channel === item ? styles.choiceActive : null, pressed ? styles.pressed : null]}>
              <AplusText variant="caption" style={channel === item ? styles.bold : undefined}>{item.toUpperCase()}</AplusText>
            </Pressable>
          ))}
        </View>
        {message ? <AplusText variant="caption" color={message.includes('không') || message.includes('failed') || message.includes('Không') ? theme.colors.warning : theme.colors.success}>{message}</AplusText> : null}
        <AplusButton title={t.create} leftIcon="qr" loading={loading} onPress={createInvite} />
      </AplusCard>

      <View style={styles.sectionHeader}>
        <AplusText variant="subtitle">{t.list}</AplusText>
        <StatusChip label={`${items.length}`} tone="info" />
      </View>
      {items.length === 0 ? (
        <AplusCard style={styles.emptyCard}>
          <AplusIcon name="phone" size={38} color={theme.colors.textMuted} />
          <AplusText variant="body">{t.noData}</AplusText>
        </AplusCard>
      ) : (
        <View style={styles.list}>
          {items.map(item => <PhoneAuthRow key={item.id} auth={item} onAccept={accept} onRevoke={revoke} onCopy={copyLink} t={t} />)}
        </View>
      )}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, borderColor: theme.colors.borderStrong},
  heroText: {flex: 1, gap: theme.spacing.sm},
  badgeRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  formCard: {gap: theme.spacing.md},
  formRow: {flexDirection: 'row', gap: theme.spacing.md},
  choiceRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  choiceChip: {borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.surfaceStrong},
  choiceActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  list: {gap: theme.spacing.md},
  itemCard: {gap: theme.spacing.md},
  itemHeader: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md},
  itemText: {flex: 1, gap: 2},
  qrCard: {flexDirection: 'row', gap: theme.spacing.md, backgroundColor: theme.colors.surfaceStrong},
  actionRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md},
  flexButton: {flex: 1},
  emptyCard: {alignItems: 'center', gap: theme.spacing.md},
  pressed: {opacity: 0.86},
  bold: {fontWeight: theme.typography.weight.bold},
});

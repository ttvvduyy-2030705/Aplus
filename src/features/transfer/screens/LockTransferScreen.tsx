import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {BaseScreen} from '@/components/base/BaseScreen';
import {StatusChip} from '@/components/base/StatusChip';
import {OfflineBanner} from '@/components/feedback/OfflineBanner';
import {useLanguage} from '@/i18n/LanguageContext';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {MockLockTransferRepository} from '@/services/repositories/MockLockTransferRepository';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {AplusLock} from '@/types/lock';
import type {LockOwnership, LockTransfer, LockTransferVerifyMethod, PreviousOwnerPolicy, TransferRecipient} from '@/types/transfer';

type Copy = Record<string, string>;

const vi: Copy = {
  title: 'Chuyển quyền khóa',
  subtitle: 'UI-22 · Owner xác minh, người nhận accept, audit đầy đủ',
  ownerOnly: 'Chỉ Owner mới được chuyển quyền khóa. SubAdmin/Staff chỉ có thể quản lý theo quyền được cấp.',
  selectLocks: '1. Chọn khóa/nhóm khóa',
  selected: 'đã chọn',
  recipient: '2. Người nhận quyền Owner',
  recipientName: 'Tên người nhận',
  account: 'Email hoặc số điện thoại',
  quickRecipients: 'Người nhận gợi ý',
  verify: '3. Xác minh Owner',
  verifyHint: 'Flow nhạy cảm bắt buộc App PIN/OTP/biometric mock trước khi tạo transfer.',
  appPin: 'App PIN',
  otp: 'OTP mock',
  biometric: 'Biometric mock',
  appPinPlaceholder: 'Nhập App PIN hiện tại',
  otpPlaceholder: 'OTP mock: 123456',
  previousPolicy: 'Sau khi hoàn tất',
  removeOldOwner: 'Gỡ Owner cũ',
  subAdminOldOwner: 'Hạ Owner cũ xuống SubAdmin',
  expires: 'Thời hạn accept',
  create: 'Tạo yêu cầu chuyển quyền',
  pending: 'Yêu cầu chuyển quyền',
  ownership: 'Owner hiện tại',
  accept: 'Người nhận accept',
  expire: 'Đánh dấu hết hạn',
  cancel: 'Hủy yêu cầu',
  audit: 'Audit',
  none: 'Chưa có yêu cầu chuyển quyền.',
  currentOwner: 'Owner hiện tại',
  completed: 'Completed',
  pendingStatus: 'Pending',
  expired: 'Expired',
  cancelled: 'Cancelled',
  errorLock: 'Chọn ít nhất một khóa.',
  errorRecipient: 'Nhập người nhận và email/số điện thoại.',
  errorPin: 'App PIN không đúng.',
  errorOtp: 'OTP mock không đúng.',
  created: 'Đã tạo yêu cầu chuyển quyền.',
  updated: 'Đã cập nhật trạng thái transfer.',
  noLock: 'Chưa có khóa để chuyển quyền.',
  scope: 'Owner · toàn hệ thống',
  link: 'Link accept',
  token: 'Token',
  useAppPinSettings: 'PIN lấy từ tab Tôi → Bảo mật App PIN.',
};

const en: Copy = {
  title: 'Lock transfer',
  subtitle: 'UI-22 · Owner verification, recipient accept, full audit',
  ownerOnly: 'Only the Owner can transfer lock ownership. SubAdmin/Staff can only operate within granted permissions.',
  selectLocks: '1. Select lock/group',
  selected: 'selected',
  recipient: '2. New Owner recipient',
  recipientName: 'Recipient name',
  account: 'Email or phone number',
  quickRecipients: 'Suggested recipients',
  verify: '3. Owner verification',
  verifyHint: 'Sensitive flow requires App PIN/OTP/mock biometric before a transfer request is created.',
  appPin: 'App PIN',
  otp: 'Mock OTP',
  biometric: 'Mock biometric',
  appPinPlaceholder: 'Enter current App PIN',
  otpPlaceholder: 'Mock OTP: 123456',
  previousPolicy: 'After completion',
  removeOldOwner: 'Remove previous Owner',
  subAdminOldOwner: 'Downgrade previous Owner to SubAdmin',
  expires: 'Accept window',
  create: 'Create transfer request',
  pending: 'Transfer requests',
  ownership: 'Current ownership',
  accept: 'Recipient accepts',
  expire: 'Mark expired',
  cancel: 'Cancel request',
  audit: 'Audit',
  none: 'No lock transfer request yet.',
  currentOwner: 'Current owner',
  completed: 'Completed',
  pendingStatus: 'Pending',
  expired: 'Expired',
  cancelled: 'Cancelled',
  errorLock: 'Select at least one lock.',
  errorRecipient: 'Enter recipient name and email/phone.',
  errorPin: 'Invalid App PIN.',
  errorOtp: 'Invalid mock OTP.',
  created: 'Transfer request created.',
  updated: 'Transfer status updated.',
  noLock: 'No lock available for transfer.',
  scope: 'Owner · whole system',
  link: 'Accept link',
  token: 'Token',
  useAppPinSettings: 'PIN is read from Me → App PIN Security.',
};

function formatDate(value: number, language: 'vi' | 'en') {
  return new Date(value).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US');
}

function statusTone(status: LockTransfer['status']): 'success' | 'warning' | 'danger' | 'muted' {
  if (status === 'completed') {
    return 'success';
  }
  if (status === 'pending') {
    return 'warning';
  }
  if (status === 'expired') {
    return 'danger';
  }
  return 'muted';
}

function statusLabel(status: LockTransfer['status'], t: Copy) {
  if (status === 'completed') {
    return t.completed;
  }
  if (status === 'pending') {
    return t.pendingStatus;
  }
  if (status === 'expired') {
    return t.expired;
  }
  return t.cancelled;
}

function ToggleChip({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={[styles.toggleChip, active ? styles.toggleChipActive : null]}>
      <AplusText variant="caption" color={active ? theme.colors.text : theme.colors.textMuted}>{label}</AplusText>
    </Pressable>
  );
}

function LockSelectCard({lock, active, onPress}: {lock: AplusLock; active: boolean; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={[styles.lockCard, active ? styles.lockCardActive : null]}>
      <View style={styles.lockTopRow}>
        <AplusIcon name={active ? 'check' : 'lock'} size={22} color={active ? theme.colors.success : theme.colors.primary} boxed />
        <View style={styles.flex}>
          <AplusText variant="body" style={styles.bold}>{lock.name}</AplusText>
          <AplusText variant="caption">{lock.roomName} · {lock.serial}</AplusText>
        </View>
      </View>
      <View style={styles.badgeRow}>
        <StatusChip label={lock.connectionState} tone={lock.connectionState === 'offline' ? 'danger' : 'success'} />
        <StatusChip label={`${lock.batteryPercent}%`} tone={lock.batteryPercent <= lock.settings.lowBatteryThreshold ? 'warning' : 'success'} />
      </View>
    </Pressable>
  );
}

function TransferCard({transfer, t, language, onAccept, onExpire, onCancel}: {transfer: LockTransfer; t: Copy; language: 'vi' | 'en'; onAccept: () => void; onExpire: () => void; onCancel: () => void}) {
  return (
    <AplusCard style={styles.cardGap}>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <AplusText variant="subtitle">{transfer.recipient.fullName}</AplusText>
          <AplusText variant="caption">{transfer.recipient.email ?? transfer.recipient.phone}</AplusText>
        </View>
        <StatusChip label={statusLabel(transfer.status, t)} tone={statusTone(transfer.status)} />
      </View>

      <View style={styles.badgeRow}>
        <StatusChip label={`${transfer.locks.length} locks`} tone="info" />
        <StatusChip label={transfer.verifyMethod} tone="muted" />
        <StatusChip label={transfer.previousOwnerPolicy === 'subAdmin' ? 'Old Owner → SubAdmin' : 'Remove old Owner'} tone="muted" />
      </View>

      {transfer.locks.map(lock => (
        <View key={lock.lockId} style={styles.miniRow}>
          <AplusText variant="body" style={styles.bold}>{lock.lockName}</AplusText>
          <AplusText variant="caption">{lock.roomName} · {lock.serial}</AplusText>
        </View>
      ))}

      <View style={styles.infoBox}>
        <AplusText variant="caption">{t.token}: {transfer.token}</AplusText>
        <AplusText variant="caption">{t.link}: {transfer.acceptUrl}</AplusText>
        <AplusText variant="caption">Expires: {formatDate(transfer.expiresAt, language)}</AplusText>
      </View>

      <View style={styles.actionRow}>
        <AplusButton title={t.accept} variant="secondary" leftIcon="check" onPress={onAccept} disabled={transfer.status !== 'pending'} style={styles.actionButton} />
        <AplusButton title={t.expire} variant="ghost" leftIcon="otp" onPress={onExpire} disabled={transfer.status !== 'pending'} style={styles.actionButton} />
        <AplusButton title={t.cancel} variant="danger" leftIcon="close" onPress={onCancel} disabled={transfer.status !== 'pending'} style={styles.actionButton} />
      </View>

      <View style={styles.auditBox}>
        <AplusText variant="label">{t.audit}</AplusText>
        {transfer.audit.slice(-4).map(item => (
          <AplusText key={item.id} variant="caption">• {item.actorName}: {item.message}</AplusText>
        ))}
      </View>
    </AplusCard>
  );
}

export function LockTransferScreen({lockId}: {lockId?: string}) {
  const navigation = useAplusNavigation();
  const {language} = useLanguage();
  const t = language === 'vi' ? vi : en;
  const {auth, locks, isOffline, verifyAppPin, appPinSettings, reloadAccessRecords} = useAppState();
  const [selectedLockIds, setSelectedLockIds] = useState<string[]>(lockId ? [lockId] : []);
  const [recipientName, setRecipientName] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [verifyMethod, setVerifyMethod] = useState<LockTransferVerifyMethod>('appPin');
  const [previousOwnerPolicy, setPreviousOwnerPolicy] = useState<PreviousOwnerPolicy>('subAdmin');
  const [expiresInHours, setExpiresInHours] = useState('24');
  const [appPin, setAppPin] = useState('');
  const [otp, setOtp] = useState('');
  const [recipients, setRecipients] = useState<TransferRecipient[]>([]);
  const [transfers, setTransfers] = useState<LockTransfer[]>([]);
  const [ownerships, setOwnerships] = useState<LockOwnership[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const isOwner = auth.user?.role === 'owner';
  const availableLocks = locks;
  const selectedLocks = useMemo(() => availableLocks.filter(lock => selectedLockIds.includes(lock.id)), [availableLocks, selectedLockIds]);

  const reload = async () => {
    const [nextRecipients, nextTransfers, nextOwnerships] = await Promise.all([
      MockLockTransferRepository.getRecipients(),
      MockLockTransferRepository.getTransfers(),
      MockLockTransferRepository.getOwnerships(),
    ]);
    setRecipients(nextRecipients);
    setTransfers(nextTransfers);
    setOwnerships(nextOwnerships);
  };

  useEffect(() => {
    reload();
  }, []);

  const toggleLock = (id: string) => {
    setSelectedLockIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const chooseRecipient = (recipient: TransferRecipient) => {
    setRecipientName(recipient.fullName);
    setRecipientAccount(recipient.email ?? recipient.phone);
  };

  const validateVerification = async () => {
    if (verifyMethod === 'biometric') {
      return true;
    }
    if (verifyMethod === 'otp') {
      return otp.trim() === '123456';
    }
    if (appPinSettings?.enabled || appPinSettings?.requireForSensitiveActions) {
      return verifyAppPin(appPin.trim());
    }
    return appPin.trim() === '2580' || verifyAppPin(appPin.trim());
  };

  const createTransfer = async () => {
    setError(undefined);
    setMessage(undefined);
    if (!isOwner) {
      setError(t.ownerOnly);
      return;
    }
    if (selectedLockIds.length === 0) {
      setError(t.errorLock);
      return;
    }
    if (!recipientName.trim() || !recipientAccount.trim()) {
      setError(t.errorRecipient);
      return;
    }
    const verified = await validateVerification();
    if (!verified) {
      setError(verifyMethod === 'otp' ? t.errorOtp : t.errorPin);
      return;
    }

    setLoading(true);
    try {
      await MockLockTransferRepository.createTransfer({
        lockIds: selectedLockIds,
        fromOwnerId: auth.user?.id ?? 'admin-aplus-001',
        fromOwnerName: auth.user?.name ?? 'Aplus Admin',
        recipientName,
        recipientAccount,
        verifyMethod,
        previousOwnerPolicy,
        expiresInHours: Number(expiresInHours) || 24,
      });
      setMessage(t.created);
      setAppPin('');
      setOtp('');
      await reload();
      await reloadAccessRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer error');
    } finally {
      setLoading(false);
    }
  };

  const updateTransfer = async (action: 'accept' | 'expire' | 'cancel', transferId: string) => {
    setLoading(true);
    setError(undefined);
    setMessage(undefined);
    try {
      if (action === 'accept') {
        await MockLockTransferRepository.acceptTransfer(transferId);
      } else if (action === 'expire') {
        await MockLockTransferRepository.expireTransfer(transferId);
      } else {
        await MockLockTransferRepository.cancelTransfer(transferId, auth.user?.name ?? 'Aplus Admin');
      }
      setMessage(t.updated);
      await reload();
      await reloadAccessRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer update error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={t.title} subtitle={t.subtitle} canGoBack onBack={navigation.goBack} showLogo rightIcon="shield" onRightPress={() => navigation.navigate('AppPinSecurity')} />
      <OfflineBanner visible={isOffline} />

      {!isOwner ? (
        <AplusCard style={styles.warningCard}>
          <AplusIcon name="shield" size={28} color={theme.colors.warning} />
          <View style={styles.flex}>
            <AplusText variant="subtitle" color={theme.colors.warning}>Owner only</AplusText>
            <AplusText variant="body">{t.ownerOnly}</AplusText>
          </View>
        </AplusCard>
      ) : null}

      <AplusCard style={styles.cardGap}>
        <View style={styles.rowBetween}>
          <View>
            <AplusText variant="subtitle">{t.selectLocks}</AplusText>
            <AplusText variant="caption">{selectedLocks.length} {t.selected}</AplusText>
          </View>
          <StatusChip label={t.scope} tone="info" />
        </View>
        {availableLocks.length === 0 ? <AplusText variant="caption">{t.noLock}</AplusText> : null}
        <View style={styles.lockGrid}>
          {availableLocks.map(lock => (
            <LockSelectCard key={lock.id} lock={lock} active={selectedLockIds.includes(lock.id)} onPress={() => toggleLock(lock.id)} />
          ))}
        </View>
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">{t.recipient}</AplusText>
        <AplusTextField label={t.recipientName} leftIcon="user" value={recipientName} onChangeText={setRecipientName} placeholder="Nguyễn Minh Anh" />
        <AplusTextField label={t.account} leftIcon="email" value={recipientAccount} onChangeText={setRecipientAccount} autoCapitalize="none" keyboardType="email-address" placeholder="owner.new@example.com" />
        <AplusText variant="label">{t.quickRecipients}</AplusText>
        <View style={styles.chipWrap}>
          {recipients.map(recipient => (
            <Pressable key={recipient.id} style={styles.recipientChip} onPress={() => chooseRecipient(recipient)}>
              <AplusText variant="caption" style={styles.bold}>{recipient.fullName}</AplusText>
              <AplusText variant="caption">{recipient.email ?? recipient.phone}</AplusText>
            </Pressable>
          ))}
        </View>
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">{t.verify}</AplusText>
        <AplusText variant="caption">{t.verifyHint}</AplusText>
        <View style={styles.chipWrap}>
          <ToggleChip label={t.appPin} active={verifyMethod === 'appPin'} onPress={() => setVerifyMethod('appPin')} />
          <ToggleChip label={t.otp} active={verifyMethod === 'otp'} onPress={() => setVerifyMethod('otp')} />
          <ToggleChip label={t.biometric} active={verifyMethod === 'biometric'} onPress={() => setVerifyMethod('biometric')} />
        </View>
        {verifyMethod === 'appPin' ? (
          <AplusTextField label={t.appPin} leftIcon="pin" value={appPin} onChangeText={setAppPin} placeholder={t.appPinPlaceholder} secureTextEntry keyboardType="number-pad" />
        ) : null}
        {verifyMethod === 'otp' ? (
          <AplusTextField label={t.otp} leftIcon="otp" value={otp} onChangeText={setOtp} placeholder={t.otpPlaceholder} keyboardType="number-pad" />
        ) : null}
        <AplusText variant="caption">{t.useAppPinSettings}</AplusText>

        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <AplusText variant="label">{t.previousPolicy}</AplusText>
            <View style={styles.chipWrap}>
              <ToggleChip label={t.subAdminOldOwner} active={previousOwnerPolicy === 'subAdmin'} onPress={() => setPreviousOwnerPolicy('subAdmin')} />
              <ToggleChip label={t.removeOldOwner} active={previousOwnerPolicy === 'remove'} onPress={() => setPreviousOwnerPolicy('remove')} />
            </View>
          </View>
        </View>
        <AplusTextField label={t.expires} leftIcon="calendar" value={expiresInHours} onChangeText={setExpiresInHours} keyboardType="number-pad" placeholder="24" />
        {error ? <AplusText variant="caption" color={theme.colors.danger}>{error}</AplusText> : null}
        {message ? <AplusText variant="caption" color={theme.colors.success}>{message}</AplusText> : null}
        <AplusButton title={t.create} leftIcon="shield" onPress={createTransfer} loading={loading} disabled={!isOwner || loading} />
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">{t.ownership}</AplusText>
        {ownerships.map(item => (
          <View key={item.lockId} style={styles.ownershipRow}>
            <AplusIcon name="lock" size={20} color={theme.colors.primary} boxed boxSize={40} />
            <View style={styles.flex}>
              <AplusText variant="body" style={styles.bold}>{item.lockName}</AplusText>
              <AplusText variant="caption">{t.currentOwner}: {item.ownerName} · {item.ownerPhone}</AplusText>
            </View>
            <StatusChip label={item.roleLabel} tone="info" />
          </View>
        ))}
      </AplusCard>

      <View style={styles.sectionTitleRow}>
        <AplusText variant="subtitle">{t.pending}</AplusText>
        <StatusChip label={`${transfers.length}`} tone="muted" />
      </View>
      {transfers.length === 0 ? (
        <AplusCard>
          <AplusText variant="caption">{t.none}</AplusText>
        </AplusCard>
      ) : transfers.map(transfer => (
        <TransferCard
          key={transfer.id}
          transfer={transfer}
          t={t}
          language={language}
          onAccept={() => updateTransfer('accept', transfer.id)}
          onExpire={() => updateTransfer('expire', transfer.id)}
          onCancel={() => updateTransfer('cancel', transfer.id)}
        />
      ))}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  cardGap: {
    gap: theme.spacing.md,
  },
  warningCard: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    borderColor: 'rgba(253,176,34,0.42)',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  flex: {
    flex: 1,
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
  lockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  lockCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 132,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceStrong,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  lockCardActive: {
    borderColor: theme.colors.success,
    backgroundColor: 'rgba(27,185,124,0.11)',
  },
  lockTopRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  toggleChip: {
    minHeight: 38,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceStrong,
  },
  toggleChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  recipientChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceStrong,
    padding: theme.spacing.md,
    minWidth: 180,
    gap: 2,
  },
  miniRow: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceStrong,
    gap: 2,
  },
  infoBox: {
    gap: theme.spacing.xs,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flexBasis: '30%',
    flexGrow: 1,
  },
  auditBox: {
    gap: theme.spacing.xs,
  },
  ownershipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
});

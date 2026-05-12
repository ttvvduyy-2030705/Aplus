import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {BaseScreen} from '@/components/base/BaseScreen';
import {StatusChip} from '@/components/base/StatusChip';
import {useLanguage} from '@/i18n/LanguageContext';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {MockCredentialRepository} from '@/services/repositories/MockCredentialRepository';
import {MockNfcRepository} from '@/services/repositories/MockNfcRepository';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {Person} from '@/types/credential';
import type {AplusLock} from '@/types/lock';
import type {MobileCardPolicy, NfcCredential, NfcCredentialStatus, NfcSummary} from '@/types/nfc';

type Props = {
  lockId?: string;
  recipientId?: string;
};

const copy = {
  vi: {
    title: 'NFC & thẻ điện thoại',
    subtitle: 'UI-15 · mobile card mock và Android NFC adapter',
    hero: 'Đăng ký mobile card NFC cho người dùng/phòng/khóa. Tách riêng với thẻ vật lý Batch 08 và card issuer Batch 27.',
    selectLock: 'Chọn khóa',
    selectOwner: 'Chọn người nhận',
    deviceName: 'Tên thiết bị',
    phoneModel: 'Model điện thoại',
    validDays: 'Số ngày hiệu lực',
    create: 'Đăng ký NFC',
    simulateUse: 'Dùng thử',
    revoke: 'Thu hồi',
    lostDevice: 'Mất điện thoại',
    noNfc: 'Chưa có NFC/mobile card phù hợp.',
    lockUnsupported: 'Khóa không hỗ trợ NFC',
    phoneUnsupported: 'Giả lập máy không hỗ trợ NFC',
    policy: 'Mobile card policy',
    screenLock: 'Bắt buộc khóa màn hình',
    biometric: 'Yêu cầu App PIN/Biometric',
    offline: 'Cho phép offline use',
    revokeLost: 'Thu hồi khi mất điện thoại',
    savePolicy: 'Lưu policy',
    active: 'Active',
    pendingSync: 'PendingSync',
    unsupported: 'Unsupported',
    revoked: 'Revoked',
    supported: 'Hỗ trợ NFC',
    unsupportedLock: 'Không hỗ trợ NFC',
    onlineSync: 'Online: sync ngay',
    offlineSync: 'Offline: PendingSync',
    total: 'Tổng',
    pending: 'Pending',
    lost: 'Mất máy',
    created: 'Đã tạo NFC/mobile card.',
    policySaved: 'Đã lưu policy.',
    errorNoLock: 'Chưa chọn khóa.',
    errorNoOwner: 'Chưa chọn người nhận.',
  },
  en: {
    title: 'NFC & mobile card',
    subtitle: 'UI-15 · mock mobile card and Android NFC adapter',
    hero: 'Register NFC mobile cards for a user/room/lock. Kept separate from physical cards in Batch 08 and card issuer in Batch 27.',
    selectLock: 'Select lock',
    selectOwner: 'Select recipient',
    deviceName: 'Device name',
    phoneModel: 'Phone model',
    validDays: 'Validity days',
    create: 'Register NFC',
    simulateUse: 'Test use',
    revoke: 'Revoke',
    lostDevice: 'Lost phone',
    noNfc: 'No matching NFC/mobile card yet.',
    lockUnsupported: 'Lock does not support NFC',
    phoneUnsupported: 'Simulate NFC unsupported phone',
    policy: 'Mobile card policy',
    screenLock: 'Require screen lock',
    biometric: 'Require App PIN/Biometric',
    offline: 'Allow offline use',
    revokeLost: 'Revoke on lost device',
    savePolicy: 'Save policy',
    active: 'Active',
    pendingSync: 'PendingSync',
    unsupported: 'Unsupported',
    revoked: 'Revoked',
    supported: 'NFC supported',
    unsupportedLock: 'NFC unsupported',
    onlineSync: 'Online: sync now',
    offlineSync: 'Offline: PendingSync',
    total: 'Total',
    pending: 'Pending',
    lost: 'Lost',
    created: 'NFC/mobile card created.',
    policySaved: 'Policy saved.',
    errorNoLock: 'No lock selected.',
    errorNoOwner: 'No recipient selected.',
  },
};

function statusTone(status: NfcCredentialStatus): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (status === 'active') {
    return 'success';
  }
  if (status === 'pendingSync') {
    return 'warning';
  }
  if (status === 'unsupported') {
    return 'info';
  }
  if (status === 'revoked') {
    return 'danger';
  }
  return 'muted';
}

function statusLabel(status: NfcCredentialStatus, t: typeof copy.vi) {
  if (status === 'active') {
    return t.active;
  }
  if (status === 'pendingSync') {
    return t.pendingSync;
  }
  if (status === 'unsupported') {
    return t.unsupported;
  }
  return t.revoked;
}

function formatDate(timestamp?: number, language: 'vi' | 'en' = 'vi') {
  if (!timestamp) {
    return '—';
  }
  return new Date(timestamp).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN');
}

function TogglePill({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.togglePill, active ? styles.togglePillActive : null, pressed ? styles.pressed : null]}>
      <AplusText variant="caption" color={active ? theme.colors.text : theme.colors.textMuted}>{label}</AplusText>
    </Pressable>
  );
}

function SummaryBox({label, value, tone}: {label: string; value: number; tone: 'success' | 'warning' | 'danger' | 'info'}) {
  return (
    <AplusCard style={styles.summaryBox}>
      <StatusChip label={label} tone={tone} />
      <AplusText variant="title">{value}</AplusText>
    </AplusCard>
  );
}

function LockOption({lock, selected, onPress, t}: {lock: AplusLock; selected: boolean; onPress: () => void; t: typeof copy.vi}) {
  const supported = lock.capabilities.supportsNfc;
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.optionCard, selected ? styles.selectedCard : null, pressed ? styles.pressed : null, !supported ? styles.dimmed : null]}>
      <AplusIcon name="phone" size={22} color={supported ? theme.colors.primary : theme.colors.textSubtle} boxed boxSize={44} />
      <View style={styles.optionText}>
        <AplusText variant="body" style={styles.bold}>{lock.name}</AplusText>
        <AplusText variant="caption" numberOfLines={1}>{lock.roomName} · {lock.hardwareModel ?? lock.serial}</AplusText>
      </View>
      <StatusChip label={supported ? t.supported : t.unsupportedLock} tone={supported ? 'success' : 'danger'} />
    </Pressable>
  );
}

function OwnerOption({person, selected, onPress}: {person: Person; selected: boolean; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.ownerPill, selected ? styles.ownerPillActive : null, pressed ? styles.pressed : null]}>
      <AplusText variant="caption" color={selected ? theme.colors.text : theme.colors.textMuted}>{person.fullName}</AplusText>
    </Pressable>
  );
}

function NfcCardRow({item, t, language, onUse, onRevoke, onLost}: {item: NfcCredential; t: typeof copy.vi; language: 'vi' | 'en'; onUse: (id: string) => void; onRevoke: (id: string) => void; onLost: (id: string) => void}) {
  const canUse = item.status === 'active' || item.status === 'pendingSync';
  return (
    <AplusCard style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <AplusIcon name="phone" size={26} color={item.status === 'active' ? theme.colors.success : theme.colors.primary} boxed />
        <View style={styles.itemText}>
          <AplusText variant="body" style={styles.bold}>{item.deviceName}</AplusText>
          <AplusText variant="caption">{item.mobileCardId} · {item.lockName} · {item.roomName}</AplusText>
        </View>
        <StatusChip label={statusLabel(item.status, t)} tone={statusTone(item.status)} />
      </View>
      <View style={styles.metaWrap}>
        <StatusChip label={item.ownerName} tone="info" />
        <StatusChip label={item.phoneModel} tone="muted" />
        <StatusChip label={item.syncState} tone={item.syncState === 'synced' ? 'success' : item.syncState === 'error' ? 'danger' : 'warning'} />
        {item.lostDevice ? <StatusChip label={t.lostDevice} tone="danger" /> : null}
      </View>
      <AplusText variant="caption">{item.scopeLabel} · {formatDate(item.expiresAt, language)}</AplusText>
      <AplusText variant="caption">Last use: {formatDate(item.lastUsedAt, language)}</AplusText>
      <View style={styles.actionRow}>
        <AplusButton title={t.simulateUse} leftIcon="unlock" variant="secondary" disabled={!canUse} onPress={() => onUse(item.id)} style={styles.flexButton} />
        <AplusButton title={t.revoke} leftIcon="revoked" variant="danger" disabled={item.status === 'revoked'} onPress={() => onRevoke(item.id)} style={styles.flexButton} />
      </View>
      <AplusButton title={t.lostDevice} leftIcon="shield" variant="ghost" disabled={item.status === 'revoked'} onPress={() => onLost(item.id)} />
    </AplusCard>
  );
}

export function NfcKeyScreen({lockId, recipientId}: Props) {
  const navigation = useAplusNavigation();
  const {language} = useLanguage();
  const t = language === 'en' ? copy.en : copy.vi;
  const {locks, reloadAccessRecords, reloadLocks} = useAppState();
  const defaultLock = useMemo(() => locks.find(lock => lock.id === lockId) ?? locks.find(lock => lock.capabilities.supportsNfc) ?? locks[0], [lockId, locks]);
  const [selectedLockId, setSelectedLockId] = useState(defaultLock?.id);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | undefined>(recipientId);
  const [deviceName, setDeviceName] = useState('iPhone Aplus Mock');
  const [phoneModel, setPhoneModel] = useState('iPhone 15 Pro');
  const [validDays, setValidDays] = useState('30');
  const [forceUnsupportedPhone, setForceUnsupportedPhone] = useState(false);
  const [items, setItems] = useState<NfcCredential[]>([]);
  const [summary, setSummary] = useState<NfcSummary | undefined>();
  const [policy, setPolicy] = useState<MobileCardPolicy | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const selectedLock = useMemo(() => locks.find(lock => lock.id === selectedLockId) ?? defaultLock, [defaultLock, locks, selectedLockId]);

  const load = useCallback(async () => {
    const [peopleData, cardsData, summaryData, policyData] = await Promise.all([
      MockCredentialRepository.getPeople(),
      MockNfcRepository.getNfcCredentials(selectedLockId),
      MockNfcRepository.getSummary(selectedLockId),
      MockNfcRepository.getMobileCardPolicy(),
    ]);
    setPeople(peopleData.filter(person => person.active));
    setItems(cardsData);
    setSummary(summaryData);
    setPolicy(policyData);
    if (!selectedOwnerId) {
      setSelectedOwnerId(recipientId ?? peopleData.find(person => person.active)?.id);
    }
  }, [recipientId, selectedLockId, selectedOwnerId]);

  useEffect(() => {
    load();
  }, [load]);

  const createNfc = async () => {
    if (!selectedLock) {
      setMessage(t.errorNoLock);
      return;
    }
    if (!selectedOwnerId) {
      setMessage(t.errorNoOwner);
      return;
    }
    setLoading(true);
    try {
      const created = await MockNfcRepository.createNfcCredential({
        lockId: selectedLock.id,
        ownerId: selectedOwnerId,
        deviceName,
        phoneModel,
        validDays: Number(validDays) || 30,
        forcePhoneUnsupported: forceUnsupportedPhone,
      });
      setMessage(created.status === 'unsupported' ? t.lockUnsupported : t.created);
      await Promise.all([load(), reloadAccessRecords(selectedLock.id), reloadLocks()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const useCard = async (id: string) => {
    await MockNfcRepository.simulateNfcUse(id);
    await Promise.all([load(), reloadAccessRecords(selectedLock?.id), reloadLocks()]);
  };

  const revoke = async (id: string, lostDevice = false) => {
    await MockNfcRepository.revokeNfcCredential(id, lostDevice);
    await Promise.all([load(), reloadAccessRecords(selectedLock?.id), reloadLocks()]);
  };

  const updatePolicy = async (patch: Partial<MobileCardPolicy>) => {
    const next = await MockNfcRepository.updateMobileCardPolicy(patch);
    setPolicy(next);
    setMessage(t.policySaved);
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={t.title} subtitle={t.subtitle} canGoBack onBack={navigation.goBack} showLogo rightIcon="credential" rightLabel="Hub" onRightPress={() => navigation.navigate('CredentialHub', selectedLock ? {lockId: selectedLock.id} : undefined)} />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroTop}>
          <AplusIcon name="phone" size={42} color={theme.colors.primary} boxed boxSize={72} />
          <View style={styles.heroText}>
            <AplusText variant="hero">UI-15</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>{t.hero}</AplusText>
            <View style={styles.badgeRow}>
              <StatusChip label={selectedLock?.capabilities.supportsNfc ? t.supported : t.unsupportedLock} tone={selectedLock?.capabilities.supportsNfc ? 'success' : 'danger'} />
              <StatusChip label={selectedLock?.connectionState === 'offline' ? t.offlineSync : t.onlineSync} tone={selectedLock?.connectionState === 'offline' ? 'warning' : 'success'} />
            </View>
          </View>
        </View>
      </AplusCard>

      <View style={styles.summaryRow}>
        <SummaryBox label={t.total} value={summary?.total ?? 0} tone="info" />
        <SummaryBox label={t.active} value={summary?.active ?? 0} tone="success" />
        <SummaryBox label={t.pending} value={summary?.pending ?? 0} tone="warning" />
        <SummaryBox label={t.lost} value={summary?.lostDevices ?? 0} tone="danger" />
      </View>

      <AplusCard style={styles.formCard}>
        <AplusText variant="subtitle">{t.selectLock}</AplusText>
        <View style={styles.optionList}>
          {locks.map(lock => <LockOption key={lock.id} lock={lock} selected={lock.id === selectedLock?.id} onPress={() => setSelectedLockId(lock.id)} t={t} />)}
        </View>

        <AplusText variant="subtitle">{t.selectOwner}</AplusText>
        <View style={styles.ownerWrap}>
          {people.map(person => <OwnerOption key={person.id} person={person} selected={person.id === selectedOwnerId} onPress={() => setSelectedOwnerId(person.id)} />)}
        </View>

        <View style={styles.inputGrid}>
          <AplusTextField label={t.deviceName} value={deviceName} onChangeText={setDeviceName} containerStyle={styles.inputHalf} />
          <AplusTextField label={t.phoneModel} value={phoneModel} onChangeText={setPhoneModel} containerStyle={styles.inputHalf} />
        </View>
        <AplusTextField label={t.validDays} value={validDays} onChangeText={setValidDays} keyboardType="number-pad" />
        <TogglePill label={t.phoneUnsupported} active={forceUnsupportedPhone} onPress={() => setForceUnsupportedPhone(value => !value)} />
        <AplusButton title={t.create} leftIcon="plus" onPress={createNfc} loading={loading} disabled={!selectedLock?.capabilities.supportsNfc || loading} />
        {message ? <AplusText variant="caption" color={theme.colors.warning}>{message}</AplusText> : null}
      </AplusCard>

      <AplusCard style={styles.formCard}>
        <AplusText variant="subtitle">{t.policy}</AplusText>
        {policy ? (
          <View style={styles.policyGrid}>
            <TogglePill label={t.screenLock} active={policy.requireScreenLock} onPress={() => updatePolicy({requireScreenLock: !policy.requireScreenLock})} />
            <TogglePill label={t.biometric} active={policy.requireBiometricOrPin} onPress={() => updatePolicy({requireBiometricOrPin: !policy.requireBiometricOrPin})} />
            <TogglePill label={t.offline} active={policy.allowOfflineUse} onPress={() => updatePolicy({allowOfflineUse: !policy.allowOfflineUse, maxOfflineHours: policy.allowOfflineUse ? 0 : 12})} />
            <TogglePill label={t.revokeLost} active={policy.revokeOnDeviceLost} onPress={() => updatePolicy({revokeOnDeviceLost: !policy.revokeOnDeviceLost})} />
          </View>
        ) : null}
      </AplusCard>

      {items.length === 0 ? (
        <AplusCard style={styles.emptyCard}>
          <AplusIcon name="phone" size={32} color={theme.colors.textMuted} boxed />
          <AplusText variant="body">{t.noNfc}</AplusText>
        </AplusCard>
      ) : items.map(item => <NfcCardRow key={item.id} item={item} t={t} language={language} onUse={useCard} onRevoke={id => revoke(id)} onLost={id => revoke(id, true)} />)}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  heroCard: {
    backgroundColor: '#111116',
    borderColor: theme.colors.borderStrong,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  heroText: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  summaryBox: {
    flex: 1,
    minWidth: 130,
    gap: theme.spacing.sm,
  },
  formCard: {
    gap: theme.spacing.md,
  },
  optionList: {
    gap: theme.spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceElevated,
  },
  selectedCard: {
    borderColor: theme.colors.primary,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  dimmed: {
    opacity: 0.58,
  },
  ownerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  ownerPill: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceElevated,
  },
  ownerPillActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(229, 9, 20, 0.18)',
  },
  inputGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  inputHalf: {
    flex: 1,
  },
  togglePill: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceElevated,
  },
  togglePillActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(229, 9, 20, 0.18)',
  },
  policyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  itemCard: {
    gap: theme.spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flexButton: {
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  pressed: {
    opacity: 0.82,
    transform: [{scale: 0.985}],
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
});

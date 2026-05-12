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
import {MockCardRepository} from '@/services/repositories/MockCardRepository';
import {MockCredentialRepository} from '@/services/repositories/MockCredentialRepository';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {CardCredential, CardCredentialStatus, CardKind, CardReaderState, CardSummary} from '@/types/card';
import type {Person} from '@/types/credential';
import type {AplusLock} from '@/types/lock';

type Props = {
  lockId?: string;
  recipientId?: string;
};

type CopyKey =
  | 'title' | 'subtitle' | 'readerReady' | 'scanCard' | 'createCard' | 'cardId' | 'cardName' | 'selectLock' | 'selectOwner'
  | 'kind' | 'validDays' | 'manualCardId' | 'all' | 'active' | 'expired' | 'offline' | 'revoked' | 'pending'
  | 'standard' | 'staff' | 'hotel' | 'offlineKind' | 'summaryActive' | 'summaryOffline' | 'summaryExpired'
  | 'duplicatePolicy' | 'unsupportedLock' | 'revoke' | 'simulateUse' | 'checkout' | 'booking' | 'lastUse'
  | 'noCards' | 'noCardsHint' | 'loading' | 'created' | 'failed' | 'policy' | 'validTo' | 'owner' | 'lock'
  | 'credentialHub' | 'syncNow' | 'pendingSync' | 'expiresIn' | 'days' | 'cardList' | 'cardManagement';

const copy: Record<'vi' | 'en', Record<CopyKey, string>> = {
  vi: {
    title: 'Quản lý thẻ',
    subtitle: 'UI-09/25 · thẻ thường, thẻ khách sạn, thẻ offline',
    readerReady: 'Đầu đọc thẻ mock',
    scanCard: 'Scan thẻ',
    createCard: 'Tạo thẻ',
    cardId: 'Card ID',
    cardName: 'Tên thẻ',
    selectLock: 'Chọn khóa',
    selectOwner: 'Chọn người nhận',
    kind: 'Loại thẻ',
    validDays: 'Số ngày hiệu lực',
    manualCardId: 'Nhập cardId hoặc bấm scan',
    all: 'Tất cả',
    active: 'Đang hiệu lực',
    expired: 'Hết hạn',
    offline: 'Offline',
    revoked: 'Đã thu hồi',
    pending: 'Pending',
    standard: 'Thẻ thường',
    staff: 'Thẻ nhân viên',
    hotel: 'Thẻ khách sạn',
    offlineKind: 'Thẻ offline',
    summaryActive: 'Active',
    summaryOffline: 'Offline',
    summaryExpired: 'Expired',
    duplicatePolicy: 'Chặn trùng cardId trong cùng khóa',
    unsupportedLock: 'Khóa không hỗ trợ thẻ',
    revoke: 'Thu hồi',
    simulateUse: 'Dùng thử',
    checkout: 'Check-out',
    booking: 'Booking',
    lastUse: 'Lần dùng cuối',
    noCards: 'Chưa có thẻ phù hợp',
    noCardsHint: 'Scan thẻ và chọn người nhận để tạo credential thẻ mới.',
    loading: 'Đang tải thẻ...',
    created: 'Đã tạo thẻ mock thành công.',
    failed: 'Không tạo được thẻ.',
    policy: 'Policy',
    validTo: 'Hạn dùng',
    owner: 'Người nhận',
    lock: 'Khóa',
    credentialHub: 'Credential Hub',
    syncNow: 'Online: sync ngay',
    pendingSync: 'Offline: PendingSync/Offline card',
    expiresIn: 'Hết hạn sau',
    days: 'ngày',
    cardList: 'Danh sách thẻ',
    cardManagement: 'Card Management',
  },
  en: {
    title: 'Card Management',
    subtitle: 'UI-09/25 · standard, hotel and offline cards',
    readerReady: 'Mock card reader',
    scanCard: 'Scan card',
    createCard: 'Create card',
    cardId: 'Card ID',
    cardName: 'Card name',
    selectLock: 'Select lock',
    selectOwner: 'Select owner',
    kind: 'Card type',
    validDays: 'Validity days',
    manualCardId: 'Enter cardId or scan',
    all: 'All',
    active: 'Active',
    expired: 'Expired',
    offline: 'Offline',
    revoked: 'Revoked',
    pending: 'Pending',
    standard: 'Standard card',
    staff: 'Staff card',
    hotel: 'Hotel card',
    offlineKind: 'Offline card',
    summaryActive: 'Active',
    summaryOffline: 'Offline',
    summaryExpired: 'Expired',
    duplicatePolicy: 'Block duplicate cardId in the same lock',
    unsupportedLock: 'Lock does not support cards',
    revoke: 'Revoke',
    simulateUse: 'Simulate use',
    checkout: 'Check-out',
    booking: 'Booking',
    lastUse: 'Last use',
    noCards: 'No matching cards',
    noCardsHint: 'Scan a card and select an owner to create a new card credential.',
    loading: 'Loading cards...',
    created: 'Mock card created successfully.',
    failed: 'Unable to create card.',
    policy: 'Policy',
    validTo: 'Valid until',
    owner: 'Owner',
    lock: 'Lock',
    credentialHub: 'Credential Hub',
    syncNow: 'Online: sync now',
    pendingSync: 'Offline: PendingSync/Offline card',
    expiresIn: 'Expires in',
    days: 'days',
    cardList: 'Card list',
    cardManagement: 'Card Management',
  },
};

const kindOptions: CardKind[] = ['standard', 'staff', 'hotel', 'offline'];
const filterOptions: Array<CardCredentialStatus | 'all'> = ['all', 'active', 'offline', 'expired', 'revoked', 'pendingSync'];

function kindLabel(kind: CardKind, language: 'vi' | 'en') {
  if (kind === 'standard') {
    return copy[language].standard;
  }
  if (kind === 'staff') {
    return copy[language].staff;
  }
  if (kind === 'hotel') {
    return copy[language].hotel;
  }
  return copy[language].offlineKind;
}

function statusLabel(status: CardCredentialStatus, language: 'vi' | 'en') {
  if (status === 'active') {
    return copy[language].active;
  }
  if (status === 'expired') {
    return copy[language].expired;
  }
  if (status === 'offline') {
    return copy[language].offline;
  }
  if (status === 'revoked') {
    return copy[language].revoked;
  }
  return copy[language].pending;
}

function statusTone(status: CardCredentialStatus) {
  if (status === 'active') {
    return 'success' as const;
  }
  if (status === 'offline' || status === 'pendingSync') {
    return 'warning' as const;
  }
  if (status === 'expired' || status === 'revoked') {
    return 'danger' as const;
  }
  return 'muted' as const;
}

function formatDate(timestamp?: number, language: 'vi' | 'en' = 'vi') {
  if (!timestamp) {
    return language === 'en' ? 'No limit' : 'Không giới hạn';
  }
  return new Date(timestamp).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN');
}

function formatDateTime(timestamp?: number, language: 'vi' | 'en' = 'vi') {
  if (!timestamp) {
    return '—';
  }
  return new Date(timestamp).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN');
}

function FilterPill({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.pill, active ? styles.pillActive : null, pressed ? styles.pressed : null]}>
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

function LockOption({lock, selected, onPress, language}: {lock: AplusLock; selected: boolean; onPress: () => void; language: 'vi' | 'en'}) {
  const supported = lock.capabilities.supportsCard;
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.optionCard, selected ? styles.selectedCard : null, pressed ? styles.pressed : null, !supported ? styles.dimmed : null]}>
      <AplusIcon name="lock" size={22} color={supported ? theme.colors.primary : theme.colors.textSubtle} boxed boxSize={44} />
      <View style={styles.optionText}>
        <AplusText variant="body" style={styles.bold}>{lock.name}</AplusText>
        <AplusText variant="caption" numberOfLines={1}>{lock.roomName} · {lock.hardwareModel ?? lock.serial}</AplusText>
      </View>
      <StatusChip label={supported ? 'Card' : copy[language].unsupportedLock} tone={supported ? 'success' : 'danger'} />
    </Pressable>
  );
}

function OwnerOption({person, selected, onPress}: {person: Person; selected: boolean; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.ownerCard, selected ? styles.selectedCard : null, pressed ? styles.pressed : null, !person.active ? styles.dimmed : null]}>
      <View style={styles.avatar}><AplusText variant="subtitle">{person.avatarLabel}</AplusText></View>
      <View style={styles.optionText}>
        <AplusText variant="body" style={styles.bold}>{person.fullName}</AplusText>
        <AplusText variant="caption" numberOfLines={1}>{person.role} · {person.scopeLabel}</AplusText>
      </View>
      <AplusIcon name={selected ? 'check' : 'chevron'} size={18} color={selected ? theme.colors.success : theme.colors.textMuted} />
    </Pressable>
  );
}

function CardRow({card, language, onRevoke, onUse, onCheckout}: {card: CardCredential; language: 'vi' | 'en'; onRevoke: () => void; onUse: () => void; onCheckout: () => void}) {
  return (
    <AplusCard style={styles.cardRow}>
      <View style={styles.cardRowHeader}>
        <AplusIcon name="card" size={26} color={theme.colors.primary} boxed boxSize={54} />
        <View style={styles.optionText}>
          <AplusText variant="body" style={styles.bold}>{card.title}</AplusText>
          <AplusText variant="caption" numberOfLines={1}>{card.cardId} · {kindLabel(card.kind, language)}</AplusText>
        </View>
        <StatusChip label={statusLabel(card.status, language)} tone={statusTone(card.status)} />
      </View>
      <View style={styles.metaGrid}>
        <AplusText variant="caption">{copy[language].lock}: {card.lockName}</AplusText>
        <AplusText variant="caption">{copy[language].owner}: {card.ownerName}</AplusText>
        <AplusText variant="caption">{copy[language].validTo}: {formatDate(card.validTo, language)}</AplusText>
        <AplusText variant="caption">{copy[language].lastUse}: {formatDateTime(card.lastUsedAt, language)}</AplusText>
      </View>
      {card.bookingLink ? (
        <AplusCard style={styles.bookingBox}>
          <AplusText variant="caption" color={theme.colors.primary}>{copy[language].booking}: {card.bookingLink.bookingId}</AplusText>
          <AplusText variant="caption">{card.bookingLink.guestName} · {card.bookingLink.roomName} · {card.bookingLink.status}</AplusText>
        </AplusCard>
      ) : null}
      <View style={styles.actionRow}>
        <AplusButton title={copy[language].simulateUse} leftIcon="card" variant="secondary" onPress={onUse} style={styles.flexButton} />
        {card.kind === 'hotel' && card.bookingLink?.status === 'checkedIn' ? <AplusButton title={copy[language].checkout} leftIcon="hotel" variant="ghost" onPress={onCheckout} style={styles.flexButton} /> : null}
        <AplusButton title={copy[language].revoke} leftIcon="revoked" variant="danger" disabled={card.status === 'revoked'} onPress={onRevoke} style={styles.flexButton} />
      </View>
    </AplusCard>
  );
}

export function CardManagementScreen({lockId, recipientId}: Props) {
  const navigation = useAplusNavigation();
  const {language} = useLanguage();
  const {locks, reloadLocks, reloadAccessRecords, isOffline} = useAppState();
  const [people, setPeople] = useState<Person[]>([]);
  const [cards, setCards] = useState<CardCredential[]>([]);
  const [summary, setSummary] = useState<CardSummary>({total: 0, active: 0, expired: 0, offline: 0, revoked: 0, pending: 0});
  const [readerState, setReaderState] = useState<CardReaderState>({status: 'idle', message: copy[language].readerReady});
  const [selectedLockId, setSelectedLockId] = useState(lockId ?? '');
  const [selectedOwnerId, setSelectedOwnerId] = useState(recipientId ?? 'person-owner-admin');
  const [selectedKind, setSelectedKind] = useState<CardKind>('standard');
  const [filterStatus, setFilterStatus] = useState<CardCredentialStatus | 'all'>('all');
  const [cardIdInput, setCardIdInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [validDaysInput, setValidDaysInput] = useState('7');
  const [message, setMessage] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const selectedLock = useMemo(() => locks.find(item => item.id === selectedLockId) ?? locks.find(item => item.id === lockId) ?? locks.find(item => item.capabilities.supportsCard), [lockId, locks, selectedLockId]);
  const selectedOwner = useMemo(() => people.find(item => item.id === selectedOwnerId) ?? people[0], [people, selectedOwnerId]);

  const reload = useCallback(async () => {
    setLoading(true);
    const targetLockId = selectedLock?.id ?? lockId;
    const [peopleData, cardData, summaryData, readerData] = await Promise.all([
      MockCredentialRepository.getPeople(),
      MockCardRepository.getCards({lockId: targetLockId, status: filterStatus}),
      MockCardRepository.getSummary({lockId: targetLockId}),
      MockCardRepository.getReaderState(),
    ]);
    setPeople(peopleData);
    setCards(cardData);
    setSummary(summaryData);
    setReaderState(readerData);
    if (!selectedOwnerId && peopleData[0]) {
      setSelectedOwnerId(peopleData[0].id);
    }
    if (!selectedLockId && targetLockId) {
      setSelectedLockId(targetLockId);
    }
    setLoading(false);
  }, [filterStatus, lockId, selectedLock?.id, selectedLockId, selectedOwnerId]);

  useEffect(() => {
    reloadLocks();
  }, [reloadLocks]);

  useEffect(() => {
    reload();
  }, [reload]);

  const defaultTitle = useMemo(() => {
    if (!selectedOwner) {
      return '';
    }
    return `${kindLabel(selectedKind, language)} · ${selectedOwner.fullName}`;
  }, [language, selectedKind, selectedOwner]);

  const handleScan = async () => {
    const next = await MockCardRepository.scanCardId(selectedLock?.id);
    setReaderState(next);
    if (next.scannedCardId && next.status === 'success') {
      setCardIdInput(next.scannedCardId);
      setMessage(next.message);
    } else {
      setMessage(next.message);
    }
  };

  const handleCreate = async () => {
    if (!selectedLock || !selectedOwner) {
      setMessage(copy[language].failed);
      return;
    }
    const validDays = Math.max(1, Number(validDaysInput) || 7);
    try {
      const created = await MockCardRepository.createCard({
        cardId: cardIdInput,
        lockId: selectedLock.id,
        ownerId: selectedOwner.id,
        title: titleInput || defaultTitle,
        kind: selectedKind,
        validFrom: Date.now(),
        validTo: selectedKind === 'standard' ? Date.now() + validDays * 24 * 60 * 60 * 1000 : Date.now() + validDays * 24 * 60 * 60 * 1000,
        offline: isOffline || selectedKind === 'offline',
      });
      setMessage(`${copy[language].created} ${created.cardId}`);
      setTitleInput('');
      setCardIdInput('');
      await reload();
      await reloadLocks();
      await reloadAccessRecords(selectedLock.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy[language].failed);
    }
  };

  const handleRevoke = async (card: CardCredential) => {
    await MockCardRepository.revokeCard(card.id);
    setMessage(language === 'en' ? `Revoked ${card.cardId}` : `Đã thu hồi ${card.cardId}`);
    await reload();
    await reloadAccessRecords(card.lockId);
  };

  const handleUse = async (card: CardCredential) => {
    const updated = await MockCardRepository.simulateUse(card.id);
    setMessage(updated?.status === 'active' || updated?.status === 'offline' ? (language === 'en' ? 'Card use recorded.' : 'Đã ghi record dùng thẻ.') : (language === 'en' ? 'Card was rejected.' : 'Thẻ bị từ chối.'));
    await reload();
    await reloadAccessRecords(card.lockId);
  };

  const handleCheckout = async (card: CardCredential) => {
    await MockCardRepository.checkoutCard(card.id);
    setMessage(language === 'en' ? 'Checkout revoked card credential.' : 'Checkout đã thu hồi thẻ.');
    await reload();
    await reloadAccessRecords(card.lockId);
  };

  const visibleLocks = locks.filter(item => item.capabilities.supportsCard || item.id === selectedLock?.id).slice(0, 8);
  const visiblePeople = people.filter(item => item.active).slice(0, 8);

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={copy[language].title} subtitle={selectedLock ? `${selectedLock.name} · ${copy[language].subtitle}` : copy[language].subtitle} canGoBack onBack={navigation.goBack} showLogo rightLabel="UI-09" onRightPress={() => navigation.navigate('CredentialHub', selectedLock ? {lockId: selectedLock.id} : undefined)} />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="card" size={46} color={theme.colors.primary} boxed boxSize={80} />
        <View style={styles.heroText}>
          <AplusText variant="hero">{copy[language].cardManagement}</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>{copy[language].subtitle}</AplusText>
          <View style={styles.chipRow}>
            <StatusChip label={copy[language].duplicatePolicy} tone="info" />
            <StatusChip label={isOffline ? copy[language].pendingSync : copy[language].syncNow} tone={isOffline ? 'warning' : 'success'} />
            <StatusChip label={readerState.message} tone={readerState.status === 'duplicate' || readerState.status === 'failed' ? 'danger' : readerState.status === 'success' ? 'success' : 'muted'} />
          </View>
        </View>
      </AplusCard>

      <View style={styles.summaryGrid}>
        <SummaryBox label={copy[language].summaryActive} value={summary.active} tone="success" />
        <SummaryBox label={copy[language].summaryOffline} value={summary.offline + summary.pending} tone="warning" />
        <SummaryBox label={copy[language].summaryExpired} value={summary.expired + summary.revoked} tone="danger" />
      </View>

      <AplusCard style={styles.formCard}>
        <View style={styles.sectionTitleRow}>
          <View>
            <AplusText variant="subtitle">UI-25 · {copy[language].createCard}</AplusText>
            <AplusText variant="caption">{copy[language].readerReady}: {readerState.scannedCardId ?? '—'}</AplusText>
          </View>
          <AplusButton title={copy[language].scanCard} leftIcon="card" variant="secondary" onPress={handleScan} />
        </View>

        <AplusTextField label={copy[language].cardId} value={cardIdInput} onChangeText={setCardIdInput} placeholder={copy[language].manualCardId} autoCapitalize="characters" />
        <AplusTextField label={copy[language].cardName} value={titleInput} onChangeText={setTitleInput} placeholder={defaultTitle} />
        <AplusTextField label={copy[language].validDays} value={validDaysInput} onChangeText={setValidDaysInput} keyboardType="number-pad" placeholder="7" />

        <View style={styles.optionSection}>
          <AplusText variant="label">{copy[language].kind}</AplusText>
          <View style={styles.filterRow}>
            {kindOptions.map(kind => <FilterPill key={kind} label={kindLabel(kind, language)} active={selectedKind === kind} onPress={() => setSelectedKind(kind)} />)}
          </View>
        </View>

        <View style={styles.optionSection}>
          <AplusText variant="label">{copy[language].selectLock}</AplusText>
          <View style={styles.optionList}>
            {visibleLocks.map(lock => <LockOption key={lock.id} lock={lock} language={language} selected={selectedLock?.id === lock.id} onPress={() => setSelectedLockId(lock.id)} />)}
          </View>
        </View>

        <View style={styles.optionSection}>
          <AplusText variant="label">{copy[language].selectOwner}</AplusText>
          <View style={styles.optionList}>
            {visiblePeople.map(person => <OwnerOption key={person.id} person={person} selected={selectedOwner?.id === person.id} onPress={() => setSelectedOwnerId(person.id)} />)}
          </View>
        </View>

        {message ? <StatusChip label={message} tone={message.includes('không') || message.includes('Không') || message.includes('Unable') || message.includes('Duplicate') || message.includes('Trùng') ? 'danger' : 'info'} /> : null}
        <AplusButton title={copy[language].createCard} leftIcon="plus" onPress={handleCreate} disabled={!selectedLock?.capabilities.supportsCard || !selectedOwner || !cardIdInput.trim()} />
      </AplusCard>

      <View style={styles.sectionTitleRow}>
        <AplusText variant="subtitle">{copy[language].cardList}</AplusText>
        <AplusButton title={copy[language].credentialHub} variant="ghost" leftIcon="credential" onPress={() => navigation.navigate('CredentialHub', selectedLock ? {lockId: selectedLock.id} : undefined)} />
      </View>

      <View style={styles.filterRow}>
        {filterOptions.map(status => <FilterPill key={status} label={status === 'all' ? copy[language].all : statusLabel(status, language)} active={filterStatus === status} onPress={() => setFilterStatus(status)} />)}
      </View>

      {loading ? (
        <AplusCard style={styles.emptyCard}><AplusText variant="body">{copy[language].loading}</AplusText></AplusCard>
      ) : cards.length === 0 ? (
        <AplusCard style={styles.emptyCard}>
          <AplusIcon name="card" size={42} color={theme.colors.textMuted} />
          <AplusText variant="subtitle">{copy[language].noCards}</AplusText>
          <AplusText variant="caption">{copy[language].noCardsHint}</AplusText>
        </AplusCard>
      ) : (
        <View style={styles.list}>
          {cards.map(card => <CardRow key={card.id} card={card} language={language} onRevoke={() => handleRevoke(card)} onUse={() => handleUse(card)} onCheckout={() => handleCheckout(card)} />)}
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
  summaryBox: {flex: 1, gap: theme.spacing.sm, padding: theme.spacing.md},
  formCard: {gap: theme.spacing.lg},
  sectionTitleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap'},
  optionSection: {gap: theme.spacing.sm},
  optionList: {gap: theme.spacing.sm},
  optionCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong},
  ownerCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong},
  selectedCard: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  dimmed: {opacity: 0.55},
  avatar: {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySoft, borderWidth: 1, borderColor: theme.colors.borderStrong},
  optionText: {flex: 1, gap: 3},
  filterRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  pill: {borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.surfaceStrong},
  pillActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  pressed: {opacity: 0.84, transform: [{scale: 0.99}]},
  list: {gap: theme.spacing.md},
  cardRow: {gap: theme.spacing.md},
  cardRowHeader: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md},
  metaGrid: {gap: theme.spacing.xs},
  bookingBox: {padding: theme.spacing.md, gap: theme.spacing.xs, backgroundColor: theme.colors.surfaceStrong},
  actionRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  flexButton: {flexGrow: 1, flexBasis: '30%'},
  emptyCard: {alignItems: 'center', gap: theme.spacing.md},
  bold: {fontWeight: theme.typography.weight.bold},
});

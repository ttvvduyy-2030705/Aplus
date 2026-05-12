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
import {MockCredentialRepository} from '@/services/repositories/MockCredentialRepository';
import {MockRemoteAccessRepository} from '@/services/repositories/MockRemoteAccessRepository';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {Person} from '@/types/credential';
import type {RemoteCredential, RemoteCredentialStatus, RemotePairingState} from '@/types/remote';

const copy = {
  vi: {
    title: 'Thêm remote',
    subtitle: 'UI-24 · Remote vật lý',
    heroTitle: 'Remote control',
    heroBody: 'Pair remote bằng serial/model/battery, gán người nhận và phạm vi sử dụng theo khóa/phòng.',
    supported: 'Có hỗ trợ remote',
    unsupported: 'Không hỗ trợ remote',
    permissionOk: 'Có quyền cấp remote',
    permissionBlocked: 'Thiếu quyền cấp remote',
    online: 'Online: sync ngay',
    offline: 'Offline: PendingSync',
    owner: 'Người nhận',
    serial: 'Serial remote',
    model: 'Model remote',
    battery: 'Pin remote (%)',
    scan: 'Mock scan remote',
    pair: 'Pair remote',
    clear: 'Làm mới',
    list: 'Remote đã cấp',
    empty: 'Chưa có remote phù hợp.',
    use: 'Dùng thử',
    revoke: 'Thu hồi',
    records: 'Lịch sử',
    status: 'Trạng thái pairing',
    duplicate: 'Serial trùng sẽ bị chặn theo policy.',
    active: 'Active',
    pendingSync: 'PendingSync',
    revoked: 'Revoked',
    expired: 'Expired',
    unsupportedStatus: 'Unsupported',
    waiting: 'Sẵn sàng quét remote mock.',
    scanning: 'Đang quét tín hiệu remote...',
    detected: 'Đã phát hiện remote mock.',
    binding: 'Đang bind remote vào khóa.',
    completed: 'Pair remote hoàn tất.',
    errorNoLock: 'Chưa chọn được khóa.',
    errorNoOwner: 'Chưa chọn người nhận.',
    successUse: 'Đã ghi record dùng thử remote.',
  },
  en: {
    title: 'Add remote',
    subtitle: 'UI-24 · Physical remote',
    heroTitle: 'Remote control',
    heroBody: 'Pair a physical remote by serial/model/battery, assign an owner and usage scope per lock/room.',
    supported: 'Remote supported',
    unsupported: 'Remote unsupported',
    permissionOk: 'Remote grant allowed',
    permissionBlocked: 'No permission to grant remote',
    online: 'Online: sync now',
    offline: 'Offline: PendingSync',
    owner: 'Recipient',
    serial: 'Remote serial',
    model: 'Remote model',
    battery: 'Remote battery (%)',
    scan: 'Mock scan remote',
    pair: 'Pair remote',
    clear: 'Reset',
    list: 'Issued remotes',
    empty: 'No matching remote yet.',
    use: 'Test use',
    revoke: 'Revoke',
    records: 'Records',
    status: 'Pairing state',
    duplicate: 'Duplicate serials are blocked by policy.',
    active: 'Active',
    pendingSync: 'PendingSync',
    revoked: 'Revoked',
    expired: 'Expired',
    unsupportedStatus: 'Unsupported',
    waiting: 'Ready to scan a mock remote.',
    scanning: 'Scanning remote signal...',
    detected: 'Mock remote detected.',
    binding: 'Binding remote to lock.',
    completed: 'Remote pairing completed.',
    errorNoLock: 'No lock selected.',
    errorNoOwner: 'No recipient selected.',
    successUse: 'Remote test record created.',
  },
};

function statusTone(status: RemoteCredentialStatus): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (status === 'active') {
    return 'success';
  }
  if (status === 'pendingSync') {
    return 'warning';
  }
  if (status === 'revoked' || status === 'expired') {
    return 'danger';
  }
  if (status === 'unsupported') {
    return 'info';
  }
  return 'muted';
}

function formatDate(timestamp?: number) {
  if (!timestamp) {
    return '—';
  }
  return new Date(timestamp).toLocaleString('vi-VN');
}

function statusLabel(status: RemoteCredentialStatus, t: typeof copy.vi) {
  if (status === 'active') {
    return t.active;
  }
  if (status === 'pendingSync') {
    return t.pendingSync;
  }
  if (status === 'revoked') {
    return t.revoked;
  }
  if (status === 'expired') {
    return t.expired;
  }
  return t.unsupportedStatus;
}

function RemoteRow({remote, onUse, onRevoke, t}: {remote: RemoteCredential; onUse: (id: string) => void; onRevoke: (id: string) => void; t: typeof copy.vi}) {
  const canUse = remote.status === 'active' || remote.status === 'pendingSync';
  return (
    <AplusCard style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <AplusIcon name="remote" size={26} color={remote.status === 'active' ? theme.colors.success : theme.colors.primary} boxed />
        <View style={styles.itemText}>
          <AplusText variant="body" style={styles.bold}>{remote.model}</AplusText>
          <AplusText variant="caption">{remote.serial} · {remote.lockName} · {remote.roomName}</AplusText>
        </View>
        <StatusChip label={statusLabel(remote.status, t)} tone={statusTone(remote.status)} />
      </View>
      <View style={styles.metaWrap}>
        <StatusChip label={remote.ownerName} tone="info" />
        <StatusChip label={`${remote.batteryPercent}%`} tone={remote.batteryPercent <= 20 ? 'warning' : 'success'} />
        <StatusChip label={remote.syncState} tone={remote.syncState === 'synced' ? 'success' : 'warning'} />
      </View>
      <AplusText variant="caption">{remote.scopeLabel} · Last used: {formatDate(remote.lastUsedAt)}</AplusText>
      <View style={styles.actionRow}>
        <AplusButton title={t.use} leftIcon="unlock" variant="secondary" disabled={!canUse} onPress={() => onUse(remote.id)} style={styles.flexButton} />
        <AplusButton title={t.revoke} leftIcon="revoked" variant="danger" disabled={remote.status === 'revoked'} onPress={() => onRevoke(remote.id)} style={styles.flexButton} />
      </View>
    </AplusCard>
  );
}

export function RemoteControlScreen({lockId, recipientId}: {lockId?: string; recipientId?: string}) {
  const navigation = useAplusNavigation();
  const {language} = useLanguage();
  const t = language === 'en' ? copy.en : copy.vi;
  const {locks, reloadAccessRecords, reloadLocks} = useAppState();
  const selectedLock = useMemo(() => locks.find(lock => lock.id === lockId) ?? locks.find(lock => lock.capabilities.supportsRemoteControl) ?? locks[0], [lockId, locks]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | undefined>(recipientId);
  const [serial, setSerial] = useState('RM-MOCK-009');
  const [model, setModel] = useState('Aplus Remote R2');
  const [battery, setBattery] = useState('88');
  const [remotes, setRemotes] = useState<RemoteCredential[]>([]);
  const [pairing, setPairing] = useState<RemotePairingState>({step: 'idle', message: t.waiting});
  const [message, setMessage] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    const [remoteList, peopleList] = await Promise.all([
      MockRemoteAccessRepository.getRemoteCredentials(selectedLock?.id),
      MockCredentialRepository.getPeople(),
    ]);
    setRemotes(remoteList);
    setPeople(peopleList.filter(person => person.active));
    setSelectedOwnerId(current => current ?? recipientId ?? peopleList.find(person => person.active)?.id);
  }, [recipientId, selectedLock?.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    setPairing(prev => prev.step === 'idle' ? {step: 'idle', message: t.waiting} : prev);
  }, [t.waiting]);

  const scanRemote = () => {
    const scannedSerial = `RM-${String(Date.now()).slice(-6)}`;
    setPairing({step: 'scanning', message: t.scanning});
    setTimeout(() => {
      setSerial(scannedSerial);
      setModel('Aplus Remote R2');
      setBattery(String(72 + Math.round(Math.random() * 22)));
      setPairing({step: 'detected', message: t.detected, lastSerial: scannedSerial});
    }, 450);
  };

  const pair = async () => {
    if (!selectedLock) {
      setMessage(t.errorNoLock);
      return;
    }
    if (!selectedOwnerId) {
      setMessage(t.errorNoOwner);
      return;
    }
    setLoading(true);
    setMessage(undefined);
    setPairing({step: 'binding', message: t.binding, lastSerial: serial});
    try {
      await MockRemoteAccessRepository.pairRemote({
        lockId: selectedLock.id,
        ownerId: selectedOwnerId,
        serial,
        model,
        batteryPercent: Number.parseInt(battery, 10) || 1,
      });
      setPairing({step: 'completed', message: t.completed, lastSerial: serial});
      await Promise.all([reload(), reloadLocks(), reloadAccessRecords(selectedLock.id)]);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Pair remote failed';
      setMessage(nextMessage);
      setPairing({step: nextMessage.toLowerCase().includes('serial') ? 'duplicate' : 'failed', message: nextMessage, lastSerial: serial});
    } finally {
      setLoading(false);
    }
  };

  const useRemote = async (remoteId: string) => {
    await MockRemoteAccessRepository.useRemote(remoteId);
    await Promise.all([reload(), reloadLocks(), reloadAccessRecords(selectedLock?.id)]);
    setMessage(t.successUse);
  };

  const revokeRemote = async (remoteId: string) => {
    await MockRemoteAccessRepository.revokeRemote(remoteId);
    await Promise.all([reload(), reloadLocks(), reloadAccessRecords(selectedLock?.id)]);
  };

  const selectedOwner = people.find(person => person.id === selectedOwnerId);
  const capabilityOk = Boolean(selectedLock?.capabilities.supportsRemoteControl);
  const permissionOk = Boolean(selectedLock?.permission.canManageCredentials);

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={t.title} subtitle={selectedLock ? `${selectedLock.name} · ${t.subtitle}` : t.subtitle} canGoBack onBack={navigation.goBack} showLogo rightIcon="history" rightLabel={t.records} onRightPress={() => navigation.navigate('Activity')} />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="remote" size={48} color={theme.colors.primary} boxed boxSize={82} />
        <View style={styles.heroText}>
          <AplusText variant="hero">{t.heroTitle}</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>{t.heroBody}</AplusText>
          <View style={styles.chipRow}>
            <StatusChip label={capabilityOk ? t.supported : t.unsupported} tone={capabilityOk ? 'success' : 'danger'} />
            <StatusChip label={permissionOk ? t.permissionOk : t.permissionBlocked} tone={permissionOk ? 'success' : 'danger'} />
            <StatusChip label={selectedLock?.connectionState === 'offline' ? t.offline : t.online} tone={selectedLock?.connectionState === 'offline' ? 'warning' : 'success'} />
          </View>
        </View>
      </AplusCard>

      <AplusCard style={styles.formCard}>
        <AplusText variant="subtitle">{t.status}</AplusText>
        <View style={styles.statusRow}>
          <StatusChip label={pairing.step} tone={pairing.step === 'completed' ? 'success' : pairing.step === 'failed' || pairing.step === 'duplicate' ? 'danger' : 'info'} />
          <AplusText variant="caption" style={styles.statusText}>{pairing.message}</AplusText>
        </View>
        <AplusText variant="caption" color={theme.colors.textSubtle}>{t.duplicate}</AplusText>
        {message ? <AplusText variant="caption" color={pairing.step === 'completed' ? theme.colors.success : theme.colors.warning}>{message}</AplusText> : null}
      </AplusCard>

      <AplusCard style={styles.formCard}>
        <AplusText variant="subtitle">{t.pair}</AplusText>
        <AplusTextField label={t.serial} leftIcon="remote" value={serial} onChangeText={setSerial} autoCapitalize="characters" />
        <AplusTextField label={t.model} leftIcon="command" value={model} onChangeText={setModel} />
        <AplusTextField label={t.battery} leftIcon="battery" value={battery} onChangeText={setBattery} keyboardType="number-pad" />
        <AplusText variant="label">{t.owner}</AplusText>
        <View style={styles.ownerGrid}>
          {people.map(person => (
            <Pressable key={person.id} onPress={() => setSelectedOwnerId(person.id)} style={({pressed}) => [styles.ownerChip, selectedOwnerId === person.id ? styles.ownerActive : null, pressed ? styles.pressed : null]}>
              <AplusText variant="caption" style={styles.bold}>{person.fullName}</AplusText>
              <AplusText variant="caption" color={theme.colors.textSubtle}>{person.role}</AplusText>
            </Pressable>
          ))}
        </View>
        <AplusText variant="caption">{selectedOwner ? `${selectedOwner.fullName} · ${selectedOwner.scopeLabel}` : t.errorNoOwner}</AplusText>
        <View style={styles.actionRow}>
          <AplusButton title={t.scan} leftIcon="bluetooth" variant="secondary" onPress={scanRemote} style={styles.flexButton} />
          <AplusButton title={t.pair} leftIcon="check" loading={loading} disabled={!capabilityOk || !permissionOk || !serial.trim()} onPress={pair} style={styles.flexButton} />
        </View>
      </AplusCard>

      <View style={styles.sectionHeader}>
        <AplusText variant="subtitle">{t.list}</AplusText>
        <StatusChip label={`${remotes.length}`} tone="info" />
      </View>
      {remotes.length === 0 ? (
        <AplusCard style={styles.emptyCard}>
          <AplusIcon name="remote" size={38} color={theme.colors.textMuted} />
          <AplusText variant="body">{t.empty}</AplusText>
        </AplusCard>
      ) : (
        <View style={styles.list}>
          {remotes.map(remote => <RemoteRow key={remote.id} remote={remote} onUse={useRemote} onRevoke={revokeRemote} t={t} />)}
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
  formCard: {gap: theme.spacing.md},
  statusRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md},
  statusText: {flex: 1},
  ownerGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  ownerChip: {borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.surfaceStrong, flexBasis: '47%', flexGrow: 1},
  ownerActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  list: {gap: theme.spacing.md},
  itemCard: {gap: theme.spacing.md},
  itemHeader: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md},
  itemText: {flex: 1, gap: 2},
  metaWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  actionRow: {flexDirection: 'row', gap: theme.spacing.md},
  flexButton: {flex: 1},
  emptyCard: {alignItems: 'center', gap: theme.spacing.md},
  bold: {fontWeight: theme.typography.weight.bold},
  pressed: {opacity: 0.86},
});

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
import {MockFingerprintRepository} from '@/services/repositories/MockFingerprintRepository';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {Person} from '@/types/credential';
import type {FingerprintCredential, FingerprintEnrollPhase, FingerprintScanStep} from '@/types/fingerprint';
import type {AccessRecord, AplusLock} from '@/types/lock';

type Props = {
  lockId?: string;
  recipientId?: string;
};

function makeInitialSteps(language: 'vi' | 'en'): FingerprintScanStep[] {
  return [
    {index: 1, status: 'waiting', message: language === 'en' ? 'Waiting for scan 1' : 'Chờ quét lần 1'},
    {index: 2, status: 'waiting', message: language === 'en' ? 'Waiting for scan 2' : 'Chờ quét lần 2'},
    {index: 3, status: 'waiting', message: language === 'en' ? 'Waiting for scan 3' : 'Chờ quét lần 3'},
  ];
}

function phaseLabel(phase: FingerprintEnrollPhase, language: 'vi' | 'en') {
  if (language === 'vi') {
    switch (phase) {
      case 'waiting':
        return 'Đang chờ';
      case 'scanning1':
        return 'Quét 1/3';
      case 'scanning2':
        return 'Quét 2/3';
      case 'scanning3':
        return 'Quét 3/3';
      case 'qualityLow':
        return 'Chất lượng thấp';
      case 'duplicate':
        return 'Trùng vân tay';
      case 'completed':
        return 'Hoàn tất';
      case 'failed':
        return 'Thất bại';
      default:
        return phase;
    }
  }
  switch (phase) {
    case 'waiting':
      return 'Waiting';
    case 'scanning1':
      return 'Scanning 1/3';
    case 'scanning2':
      return 'Scanning 2/3';
    case 'scanning3':
      return 'Scanning 3/3';
    case 'qualityLow':
      return 'Quality low';
    case 'duplicate':
      return 'Duplicate';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return phase;
  }
}

function phaseTone(phase: FingerprintEnrollPhase) {
  if (phase === 'completed') {
    return 'success' as const;
  }
  if (phase === 'duplicate' || phase === 'failed') {
    return 'danger' as const;
  }
  if (phase === 'qualityLow') {
    return 'warning' as const;
  }
  return 'info' as const;
}

function credentialTone(status: FingerprintCredential['status']) {
  if (status === 'active') {
    return 'success' as const;
  }
  if (status === 'pendingSync') {
    return 'warning' as const;
  }
  if (status === 'revoked' || status === 'expired') {
    return 'danger' as const;
  }
  return 'muted' as const;
}

function formatDate(timestamp?: number) {
  if (!timestamp) {
    return '—';
  }
  return new Date(timestamp).toLocaleString('vi-VN');
}

function isFingerprintRecord(record: AccessRecord, fingerprints: FingerprintCredential[]) {
  if (record.method !== 'Fingerprint') {
    return false;
  }
  if (!record.credentialId) {
    return true;
  }
  return fingerprints.some(item => item.credentialId === record.credentialId);
}

function LockOption({lock, selected, onPress}: {lock: AplusLock; selected: boolean; onPress: () => void}) {
  const supported = lock.capabilities.supportsFingerprint;
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.optionCard, selected ? styles.selectedCard : null, pressed ? styles.pressed : null, !supported ? styles.dimmed : null]}>
      <AplusIcon name="lock" size={22} color={supported ? theme.colors.primary : theme.colors.textSubtle} boxed boxSize={44} />
      <View style={styles.optionText}>
        <AplusText variant="body" style={styles.bold}>{lock.name}</AplusText>
        <AplusText variant="caption" numberOfLines={1}>{lock.roomName} · {lock.hardwareModel ?? lock.serial}</AplusText>
      </View>
      <StatusChip label={supported ? 'Fingerprint' : 'Unsupported'} tone={supported ? 'success' : 'danger'} />
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

function StepRow({step}: {step: FingerprintScanStep}) {
  const tone = step.status === 'passed' ? 'success' : step.status === 'qualityLow' ? 'warning' : step.status === 'duplicate' || step.status === 'failed' ? 'danger' : 'muted';
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepBubble, step.status === 'passed' ? styles.stepDone : null]}>
        <AplusText variant="label">{step.index}</AplusText>
      </View>
      <View style={styles.optionText}>
        <AplusText variant="body">{step.message}</AplusText>
        {step.qualityScore ? <AplusText variant="caption">Quality score: {step.qualityScore}</AplusText> : null}
      </View>
      <StatusChip label={step.status} tone={tone} />
    </View>
  );
}

function FingerprintRow({item, people, onChanged}: {item: FingerprintCredential; people: Person[]; onChanged: () => void}) {
  const [busy, setBusy] = useState(false);
  const nextOwner = people.find(person => person.active && person.id !== item.ownerId);

  const rename = async () => {
    setBusy(true);
    await MockFingerprintRepository.renameFingerprint({fingerprintId: item.id, label: `${item.label.replace(/ · đổi tên$/, '')} · đổi tên`});
    setBusy(false);
    onChanged();
  };

  const changeOwner = async () => {
    if (!nextOwner) {
      return;
    }
    setBusy(true);
    await MockFingerprintRepository.changeOwner({fingerprintId: item.id, owner: nextOwner});
    setBusy(false);
    onChanged();
  };

  const simulateUse = async () => {
    setBusy(true);
    await MockFingerprintRepository.simulateUse(item.id);
    setBusy(false);
    onChanged();
  };

  const revoke = async () => {
    setBusy(true);
    await MockFingerprintRepository.revokeFingerprint(item.id);
    setBusy(false);
    onChanged();
  };

  return (
    <AplusCard style={styles.fingerprintCard}>
      <View style={styles.rowTop}>
        <AplusIcon name="fingerprint" size={28} color={theme.colors.primary} boxed boxSize={54} />
        <View style={styles.optionText}>
          <AplusText variant="subtitle">{item.label}</AplusText>
          <AplusText variant="caption">{item.ownerName} · {item.lockName}</AplusText>
        </View>
        <StatusChip label={item.status} tone={credentialTone(item.status)} />
      </View>
      <View style={styles.metaGrid}>
        <AplusText variant="caption">TemplateId: {item.templateRef.templateId}</AplusText>
        <AplusText variant="caption">DeviceRef: {item.templateRef.deviceRef}</AplusText>
        <AplusText variant="caption">Quality: {item.qualityScore}</AplusText>
        <AplusText variant="caption">Use count: {item.useCount}</AplusText>
        <AplusText variant="caption">Last used: {formatDate(item.lastUsedAt)}</AplusText>
      </View>
      <View style={styles.actionRow}>
        <AplusButton title="Dùng thử" leftIcon="unlock" variant="secondary" loading={busy} disabled={busy} onPress={simulateUse} style={styles.flexButton} />
        <AplusButton title="Đổi tên" leftIcon="refresh" variant="ghost" disabled={busy || item.status === 'revoked'} onPress={rename} style={styles.flexButton} />
      </View>
      <View style={styles.actionRow}>
        <AplusButton title="Đổi owner" leftIcon="user" variant="ghost" disabled={busy || !nextOwner || item.status === 'revoked'} onPress={changeOwner} style={styles.flexButton} />
        <AplusButton title="Thu hồi" leftIcon="revoked" variant="danger" disabled={busy || item.status === 'revoked'} onPress={revoke} style={styles.flexButton} />
      </View>
    </AplusCard>
  );
}

export function FingerprintEnrollScreen({lockId, recipientId}: Props) {
  const navigation = useAplusNavigation();
  const {language} = useLanguage();
  const tr = useCallback((vi: string, en: string) => language === 'en' ? en : vi, [language]);
  const {locks, accessRecords, findLock, reloadAccessRecords, reloadLocks} = useAppState();
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedLockId, setSelectedLockId] = useState<string | undefined>(lockId);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | undefined>(recipientId);
  const [label, setLabel] = useState('');
  const [phase, setPhase] = useState<FingerprintEnrollPhase>('waiting');
  const [scanCount, setScanCount] = useState(0);
  const [steps, setSteps] = useState<FingerprintScanStep[]>(() => makeInitialSteps(language));
  const [qualityScore, setQualityScore] = useState<number | undefined>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [fingerprints, setFingerprints] = useState<FingerprintCredential[]>([]);

  const selectedLock = useMemo(() => selectedLockId ? findLock(selectedLockId) ?? locks.find(item => item.id === selectedLockId) : undefined, [findLock, locks, selectedLockId]);
  const selectedOwner = useMemo(() => people.find(item => item.id === selectedOwnerId), [people, selectedOwnerId]);
  const supportedLocks = useMemo(() => locks.filter(item => item.capabilities.supportsFingerprint), [locks]);
  const recentFingerprintRecords = useMemo(() => accessRecords.filter(record => isFingerprintRecord(record, fingerprints)).slice(0, 5), [accessRecords, fingerprints]);
  const canEnroll = Boolean(selectedLock && selectedOwner && selectedOwner.active && selectedLock.capabilities.supportsFingerprint && selectedLock.permission.canManageCredentials);

  const loadFingerprints = useCallback(async (targetLockId?: string) => {
    const list = await MockFingerprintRepository.getFingerprints(targetLockId);
    setFingerprints(list);
  }, []);

  useEffect(() => {
    MockCredentialRepository.getPeople().then(list => {
      setPeople(list);
      setSelectedOwnerId(current => current ?? list.find(item => item.active)?.id);
    });
    if (!selectedLockId) {
      setSelectedLockId(supportedLocks[0]?.id ?? locks[0]?.id);
    }
  }, [locks, selectedLockId, supportedLocks]);

  useEffect(() => {
    loadFingerprints(selectedLockId);
    reloadAccessRecords(selectedLockId);
  }, [loadFingerprints, reloadAccessRecords, selectedLockId]);

  const resetEnrollment = () => {
    setPhase('waiting');
    setScanCount(0);
    setSteps(makeInitialSteps(language));
    setQualityScore(undefined);
    setMessage(tr('Đặt ngón tay lên cảm biến để bắt đầu enrollment mock.', 'Place your finger on the sensor to start mock enrollment.'));
  };

  const markStep = (index: number, patch: Partial<FingerprintScanStep>) => {
    setSteps(current => current.map(step => step.index === index ? {...step, ...patch} : step));
  };

  const completeEnrollment = async (score: number) => {
    if (!selectedLock || !selectedOwner) {
      return;
    }
    try {
      const created = await MockFingerprintRepository.completeEnrollment({
        lockId: selectedLock.id,
        lockName: selectedLock.name,
        roomName: selectedLock.roomName,
        owner: selectedOwner,
        label: label.trim() || undefined,
        offline: selectedLock.connectionState === 'offline',
        qualityScore: score,
      });
      setPhase('completed');
      setMessage(language === 'en' ? `Created templateId ${created.templateRef.templateId}. The app stores only the reference, not raw fingerprint images.` : `Đã tạo templateId ${created.templateRef.templateId}. App chỉ lưu reference, không lưu ảnh vân tay thô.`);
      await loadFingerprints(selectedLock.id);
      await reloadAccessRecords(selectedLock.id);
      await reloadLocks();
    } catch (error) {
      setPhase('failed');
      setMessage(error instanceof Error ? error.message : tr('Enrollment thất bại.', 'Enrollment failed.'));
    }
  };

  const scanGood = async () => {
    if (!selectedLock || !selectedOwner) {
      setPhase('failed');
      setMessage(tr('Cần chọn khóa và người nhận trước khi quét.', 'Select a lock and recipient before scanning.'));
      return;
    }
    if (!canEnroll) {
      setPhase('failed');
      setMessage(!selectedLock.capabilities.supportsFingerprint ? tr('Khóa không hỗ trợ fingerprint.', 'This lock does not support fingerprint.') : tr('Người nhận/permission chưa hợp lệ.', 'The recipient or permission is invalid.'));
      return;
    }
    setBusy(true);
    if (scanCount === 0) {
      const duplicate = await MockFingerprintRepository.checkDuplicate({lockId: selectedLock.id, lockName: selectedLock.name, roomName: selectedLock.roomName, owner: selectedOwner});
      if (duplicate) {
        setPhase('duplicate');
        markStep(1, {status: 'duplicate', message: language === 'en' ? `Duplicate of ${duplicate.label}` : `Trùng với ${duplicate.label}`, scannedAt: Date.now()});
        setMessage(tr('Duplicate template: không tạo credential mới cho cùng owner/lock.', 'Duplicate template: no new credential is created for the same owner/lock.'));
        setBusy(false);
        return;
      }
    }
    const nextCount = scanCount + 1;
    const score = Math.min(99, 84 + nextCount * 4);
    setPhase(`scanning${nextCount}` as FingerprintEnrollPhase);
    markStep(nextCount, {status: 'passed', message: language === 'en' ? `Scan ${nextCount} passed` : `Quét lần ${nextCount} đạt chuẩn`, qualityScore: score, scannedAt: Date.now()});
    setScanCount(nextCount);
    setQualityScore(score);
    setMessage(nextCount < 3 ? (language === 'en' ? `Received sample ${nextCount}/3. Continue scanning to finish.` : `Đã nhận mẫu ${nextCount}/3. Tiếp tục quét để hoàn tất.`) : tr('Đủ 3 mẫu, đang lưu template reference...', 'All 3 samples captured; saving template reference...'));
    if (nextCount >= 3) {
      await completeEnrollment(score);
    }
    setBusy(false);
  };

  const scanLowQuality = () => {
    const stepIndex = Math.min(3, scanCount + 1);
    setPhase('qualityLow');
    markStep(stepIndex, {status: 'qualityLow', message: language === 'en' ? `Scan ${stepIndex} quality is low, retry required` : `Quét lần ${stepIndex} chất lượng thấp, cần thử lại`, qualityScore: 42, scannedAt: Date.now()});
    setMessage(tr('QualityLow: cảm biến mock yêu cầu lau tay/đặt lại ngón tay rồi quét lại.', 'QualityLow: clean or reposition the finger, then scan again.'));
  };

  const refreshAfterChanged = async () => {
    await loadFingerprints(selectedLockId);
    await reloadAccessRecords(selectedLockId);
    await reloadLocks();
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={tr('Thêm vân tay', 'Add fingerprint')} subtitle="UI-27 · Batch 06 Fingerprint enrollment" canGoBack onBack={navigation.goBack} showLogo rightIcon="capability" onRightPress={() => navigation.navigate('CompatibilityCheck', {lockId: selectedLockId, credentialType: 'fingerprint'})} />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="fingerprint" size={50} color={theme.colors.primary} boxed boxSize={86} />
        <View style={styles.heroText}>
          <AplusText variant="hero">{tr('Fingerprint enrollment', 'Fingerprint enrollment')}</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>{tr('Mô phỏng 3 lần quét, kiểm tra duplicate/capability và chỉ lưu BiometricTemplateRef.', 'Simulate 3 scans, check duplicate/capability and store only BiometricTemplateRef.')}</AplusText>
          <View style={styles.chipRow}>
            <StatusChip label={phaseLabel(phase, language)} tone={phaseTone(phase)} />
            <StatusChip label={`${scanCount}/3 scans`} tone={scanCount >= 3 ? 'success' : 'info'} />
            <StatusChip label={qualityScore ? `Q${qualityScore}` : tr('No raw image', 'No raw image')} tone={qualityScore ? 'success' : 'warning'} />
          </View>
        </View>
      </AplusCard>

      <AplusText variant="subtitle">{tr('1. Chọn khóa hỗ trợ fingerprint', '1. Select a fingerprint-capable lock')}</AplusText>
      <View style={styles.list}>
        {locks.map(lock => <LockOption key={lock.id} lock={lock} selected={selectedLockId === lock.id} onPress={() => {setSelectedLockId(lock.id); resetEnrollment();}} />)}
      </View>

      <AplusText variant="subtitle">{tr('2. Chọn owner', '2. Select owner')}</AplusText>
      <View style={styles.list}>
        {people.map(person => <OwnerOption key={person.id} person={person} selected={selectedOwnerId === person.id} onPress={() => {setSelectedOwnerId(person.id); resetEnrollment();}} />)}
      </View>

      <AplusCard style={styles.enrollCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.optionText}>
            <AplusText variant="subtitle">{tr('3. Enrollment 3 lần quét', '3. Three-scan enrollment')}</AplusText>
            <AplusText variant="caption">{selectedLock ? `${selectedLock.name} · ${selectedLock.roomName}` : tr('Chưa chọn khóa', 'No lock selected')} · {selectedOwner?.fullName ?? tr('Chưa chọn owner', 'No owner selected')}</AplusText>
          </View>
          <StatusChip label={selectedLock?.capabilities.supportsFingerprint ? 'Supported' : 'Blocked'} tone={selectedLock?.capabilities.supportsFingerprint ? 'success' : 'danger'} />
        </View>
        <AplusTextField label={tr('Tên vân tay', 'Fingerprint name')} value={label} onChangeText={setLabel} placeholder={tr('VD: Ngón trỏ phải · Lễ tân', 'Example: Right index finger · Receptionist')} leftIcon="fingerprint" />
        <View style={styles.steps}>{steps.map(step => <StepRow key={step.index} step={step} />)}</View>
        <AplusText variant="caption" color={phase === 'failed' || phase === 'duplicate' ? theme.colors.danger : phase === 'qualityLow' ? theme.colors.warning : theme.colors.textMuted}>{message || tr('Đặt ngón tay lên cảm biến để bắt đầu enrollment mock.', 'Place your finger on the sensor to start mock enrollment.')}</AplusText>
        <View style={styles.actionRow}>
          <AplusButton title={tr('Quét hợp lệ', 'Valid scan')} leftIcon="fingerprint" loading={busy} disabled={busy || !canEnroll || phase === 'completed'} onPress={scanGood} style={styles.flexButton} />
          <AplusButton title={tr('Quality low', 'Quality low')} leftIcon="alert" variant="secondary" disabled={busy || phase === 'completed'} onPress={scanLowQuality} style={styles.flexButton} />
        </View>
        <AplusButton title={tr('Reset enrollment', 'Reset enrollment')} leftIcon="refresh" variant="ghost" onPress={resetEnrollment} />
      </AplusCard>

      <AplusText variant="subtitle">{tr('Vân tay đã cấp', 'Enrolled fingerprints')}</AplusText>
      <View style={styles.list}>
        {fingerprints.length === 0 ? (
          <AplusCard style={styles.emptyCard}>
            <AplusText variant="body">{tr('Chưa có fingerprint credential cho khóa này.', 'No fingerprint credential for this lock yet.')}</AplusText>
            <AplusText variant="caption">{tr('Chọn owner khác với credential đã tồn tại để test tạo mới, hoặc chọn khóa không hỗ trợ để test capability guard.', 'Choose a different owner to test creation, or choose an unsupported lock to test the capability guard.')}</AplusText>
          </AplusCard>
        ) : fingerprints.map(item => <FingerprintRow key={item.id} item={item} people={people} onChanged={refreshAfterChanged} />)}
      </View>

      <AplusText variant="subtitle">{tr('Record sử dụng gần đây', 'Recent usage records')}</AplusText>
      <View style={styles.list}>
        {recentFingerprintRecords.length === 0 ? (
          <AplusCard style={styles.emptyCard}><AplusText variant="caption">{tr('Chưa có record fingerprint trong filter hiện tại.', 'No fingerprint records in the current filter.')}</AplusText></AplusCard>
        ) : recentFingerprintRecords.map(record => (
          <Pressable key={record.id} onPress={() => navigation.navigate('RecordDetail', {recordId: record.id})} style={({pressed}) => [styles.recordCard, pressed ? styles.pressed : null]}>
            <View style={styles.optionText}>
              <AplusText variant="body" style={styles.bold}>{record.actorName} · {record.result}</AplusText>
              <AplusText variant="caption">{record.lockName} · {record.message}</AplusText>
            </View>
            <AplusIcon name="chevron" size={18} color={theme.colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    borderColor: theme.colors.borderStrong,
  },
  heroText: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  list: {
    gap: theme.spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  selectedCard: {
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.primarySoft,
  },
  pressed: {
    opacity: 0.86,
    transform: [{scale: 0.99}],
  },
  dimmed: {
    opacity: 0.52,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  optionText: {
    flex: 1,
    gap: 4,
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
  enrollCard: {
    gap: theme.spacing.md,
    borderColor: theme.colors.borderStrong,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  steps: {
    gap: theme.spacing.sm,
  },
  stepRow: {
    minHeight: 54,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  stepBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.backgroundSoft,
  },
  stepDone: {
    borderColor: theme.colors.success,
    backgroundColor: 'rgba(41,214,151,0.16)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flexButton: {
    flex: 1,
  },
  fingerprintCard: {
    gap: theme.spacing.md,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  metaGrid: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceStrong,
  },
  emptyCard: {
    gap: theme.spacing.sm,
    borderStyle: 'dashed',
  },
  recordCard: {
    minHeight: 64,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
});

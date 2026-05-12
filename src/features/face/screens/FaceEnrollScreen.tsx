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
import {MockFaceRepository} from '@/services/repositories/MockFaceRepository';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {Person} from '@/types/credential';
import type {FaceCredential, FaceEnrollPhase, FaceScanDirection, FaceScanStep} from '@/types/face';
import type {AccessRecord, AplusLock} from '@/types/lock';

type Props = {
  lockId?: string;
  recipientId?: string;
};

function makeInitialSteps(language: string): FaceScanStep[] {
  const labels: Array<{direction: FaceScanDirection; vi: string; en: string}> = [
    {direction: 'front', vi: 'Nhìn thẳng', en: 'Front'},
    {direction: 'left', vi: 'Quay trái', en: 'Left'},
    {direction: 'right', vi: 'Quay phải', en: 'Right'},
  ];
  return labels.map(item => ({
    direction: item.direction,
    label: language === 'en' ? item.en : item.vi,
    status: 'pending',
    message: language === 'en' ? 'Waiting for camera scan.' : 'Đang chờ quét camera.',
  }));
}

function phaseLabel(phase: FaceEnrollPhase, language: string) {
  const vi: Record<FaceEnrollPhase, string> = {
    waiting: 'Đang chờ',
    front: 'Quét chính diện',
    left: 'Quét góc trái',
    right: 'Quét góc phải',
    verifying: 'Đang xác minh',
    completed: 'Hoàn tất',
    duplicate: 'Trùng khuôn mặt',
    failed: 'Thất bại',
  };
  const en: Record<FaceEnrollPhase, string> = {
    waiting: 'Waiting',
    front: 'Scanning front',
    left: 'Scanning left',
    right: 'Scanning right',
    verifying: 'Verifying',
    completed: 'Completed',
    duplicate: 'Duplicate face',
    failed: 'Failed',
  };
  return language === 'en' ? en[phase] : vi[phase];
}

function phaseTone(phase: FaceEnrollPhase) {
  if (phase === 'completed') {
    return 'success' as const;
  }
  if (phase === 'duplicate' || phase === 'failed') {
    return 'danger' as const;
  }
  if (phase === 'verifying') {
    return 'warning' as const;
  }
  return 'info' as const;
}

function credentialTone(status: FaceCredential['status']) {
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

function hasCamera(lock?: AplusLock) {
  return Boolean(lock?.capabilities.supportsFace && lock.gatewayOnline && lock.connectionState !== 'offline');
}

function isFaceRecord(record: AccessRecord, faces: FaceCredential[]) {
  if (record.method !== 'Face') {
    return false;
  }
  if (!record.credentialId) {
    return true;
  }
  return faces.some(item => item.credentialId === record.credentialId);
}

function LockOption({lock, selected, onPress, tr}: {lock: AplusLock; selected: boolean; onPress: () => void; tr: (vi: string, en: string) => string}) {
  const supported = lock.capabilities.supportsFace;
  const cameraReady = hasCamera(lock);
  const tone = supported && cameraReady ? 'success' : supported ? 'warning' : 'danger';
  const label = supported ? (cameraReady ? tr('Camera sẵn sàng', 'Camera ready') : tr('Camera offline', 'Camera offline')) : tr('Không hỗ trợ', 'Unsupported');
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.optionCard, selected ? styles.selectedCard : null, pressed ? styles.pressed : null, !supported ? styles.dimmed : null]}>
      <AplusIcon name="face" size={22} color={supported ? theme.colors.primary : theme.colors.textSubtle} boxed boxSize={44} />
      <View style={styles.optionText}>
        <AplusText variant="body" style={styles.bold}>{lock.name}</AplusText>
        <AplusText variant="caption" numberOfLines={1}>{lock.roomName} · {lock.hardwareModel ?? lock.serial}</AplusText>
      </View>
      <StatusChip label={label} tone={tone} />
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

function StepRow({step}: {step: FaceScanStep}) {
  const tone = step.status === 'passed' ? 'success' : step.status === 'scanning' ? 'info' : step.status === 'failed' ? 'danger' : 'muted';
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepBubble, step.status === 'passed' ? styles.stepDone : null]}>
        <AplusText variant="label">{step.direction === 'front' ? '1' : step.direction === 'left' ? '2' : '3'}</AplusText>
      </View>
      <View style={styles.optionText}>
        <AplusText variant="body">{step.label}</AplusText>
        <AplusText variant="caption">{step.message}</AplusText>
        {step.qualityScore ? <AplusText variant="caption">Quality score: {step.qualityScore}</AplusText> : null}
      </View>
      <StatusChip label={step.status} tone={tone} />
    </View>
  );
}

function FaceRow({item, people, onChanged, tr}: {item: FaceCredential; people: Person[]; onChanged: () => void; tr: (vi: string, en: string) => string}) {
  const [busy, setBusy] = useState(false);
  const nextOwner = people.find(person => person.active && person.id !== item.ownerId);

  const rename = async () => {
    setBusy(true);
    await MockFaceRepository.renameFace({faceId: item.id, label: `${item.label.replace(/ · đổi tên$/, '').replace(/ · renamed$/, '')} · ${tr('đổi tên', 'renamed')}`});
    setBusy(false);
    onChanged();
  };

  const changeOwner = async () => {
    if (!nextOwner) {
      return;
    }
    setBusy(true);
    await MockFaceRepository.changeOwner({faceId: item.id, owner: nextOwner});
    setBusy(false);
    onChanged();
  };

  const simulateUse = async () => {
    setBusy(true);
    await MockFaceRepository.simulateUse(item.id);
    setBusy(false);
    onChanged();
  };

  const revoke = async () => {
    setBusy(true);
    await MockFaceRepository.revokeFace(item.id);
    setBusy(false);
    onChanged();
  };

  return (
    <AplusCard style={styles.faceCard}>
      <View style={styles.rowTop}>
        <AplusIcon name="face" size={28} color={theme.colors.primary} boxed boxSize={54} />
        <View style={styles.optionText}>
          <AplusText variant="subtitle">{item.label}</AplusText>
          <AplusText variant="caption">{item.ownerName} · {item.lockName}</AplusText>
        </View>
        <StatusChip label={item.status} tone={credentialTone(item.status)} />
      </View>
      <View style={styles.metaGrid}>
        <AplusText variant="caption">TemplateId: {item.templateRef.templateId}</AplusText>
        <AplusText variant="caption">DeviceRef: {item.templateRef.deviceRef}</AplusText>
        <AplusText variant="caption">Liveness: {item.templateRef.liveness}</AplusText>
        <AplusText variant="caption">Quality: {item.qualityScore}</AplusText>
        <AplusText variant="caption">Use count: {item.useCount}</AplusText>
        <AplusText variant="caption">Last used: {formatDate(item.lastUsedAt)}</AplusText>
      </View>
      <View style={styles.actionRow}>
        <AplusButton title={tr('Dùng thử', 'Test use')} leftIcon="unlock" variant="secondary" loading={busy} disabled={busy} onPress={simulateUse} style={styles.flexButton} />
        <AplusButton title={tr('Đổi tên', 'Rename')} leftIcon="refresh" variant="ghost" disabled={busy || item.status === 'revoked'} onPress={rename} style={styles.flexButton} />
      </View>
      <View style={styles.actionRow}>
        <AplusButton title={tr('Đổi owner', 'Change owner')} leftIcon="user" variant="ghost" disabled={busy || !nextOwner || item.status === 'revoked'} onPress={changeOwner} style={styles.flexButton} />
        <AplusButton title={tr('Thu hồi', 'Revoke')} leftIcon="revoked" variant="danger" disabled={busy || item.status === 'revoked'} onPress={revoke} style={styles.flexButton} />
      </View>
    </AplusCard>
  );
}

export function FaceEnrollScreen({lockId, recipientId}: Props) {
  const navigation = useAplusNavigation();
  const {language} = useLanguage();
  const tr = useCallback((vi: string, en: string) => language === 'en' ? en : vi, [language]);
  const {locks, accessRecords, findLock, reloadAccessRecords, reloadLocks, auth} = useAppState();
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedLockId, setSelectedLockId] = useState<string | undefined>(lockId);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | undefined>(recipientId);
  const [label, setLabel] = useState('');
  const [phase, setPhase] = useState<FaceEnrollPhase>('waiting');
  const [scanIndex, setScanIndex] = useState(0);
  const [steps, setSteps] = useState<FaceScanStep[]>(() => makeInitialSteps(language));
  const [qualityScore, setQualityScore] = useState<number | undefined>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [faces, setFaces] = useState<FaceCredential[]>([]);

  const selectedLock = useMemo(() => selectedLockId ? findLock(selectedLockId) ?? locks.find(item => item.id === selectedLockId) : undefined, [findLock, locks, selectedLockId]);
  const selectedOwner = useMemo(() => people.find(item => item.id === selectedOwnerId), [people, selectedOwnerId]);
  const supportedLocks = useMemo(() => locks.filter(item => item.capabilities.supportsFace), [locks]);
  const recentFaceRecords = useMemo(() => accessRecords.filter(record => isFaceRecord(record, faces)).slice(0, 5), [accessRecords, faces]);
  const cameraAvailable = hasCamera(selectedLock);
  const canEnroll = Boolean(selectedLock && selectedOwner && selectedOwner.active && selectedLock.capabilities.supportsFace && selectedLock.permission.canManageCredentials && cameraAvailable);

  const loadFaces = useCallback(async (targetLockId?: string) => {
    const list = await MockFaceRepository.getFaces(targetLockId);
    setFaces(list);
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
    loadFaces(selectedLockId);
    reloadAccessRecords(selectedLockId);
  }, [loadFaces, reloadAccessRecords, selectedLockId]);

  useEffect(() => {
    setSteps(makeInitialSteps(language));
  }, [language]);

  const markStep = (direction: FaceScanDirection, patch: Partial<FaceScanStep>) => {
    setSteps(prev => prev.map(step => step.direction === direction ? {...step, ...patch} : step));
  };

  const resetEnrollment = useCallback(() => {
    setPhase('waiting');
    setScanIndex(0);
    setSteps(makeInitialSteps(language));
    setQualityScore(undefined);
    setMessage(tr('Đưa khuôn mặt vào khung camera để bắt đầu enrollment mock.', 'Place the face inside the camera frame to start mock enrollment.'));
  }, [language, tr]);

  useEffect(() => {
    resetEnrollment();
  }, [selectedLockId, selectedOwnerId, resetEnrollment]);

  const scanNextPose = async () => {
    if (!selectedLock || !selectedOwner) {
      setMessage(tr('Chọn khóa và người nhận trước khi quét.', 'Select a lock and owner before scanning.'));
      return;
    }
    if (!selectedOwner.active) {
      setMessage(tr('Người nhận đang bị vô hiệu hóa.', 'The selected owner is inactive.'));
      return;
    }
    if (!selectedLock.capabilities.supportsFace) {
      setPhase('failed');
      setMessage(tr('Khóa này không hỗ trợ Face Unlock.', 'This lock does not support Face Unlock.'));
      return;
    }
    if (!cameraAvailable) {
      setPhase('failed');
      setMessage(tr('Camera không sẵn sàng. Kiểm tra gateway/kết nối khóa trước khi scan.', 'Camera is not ready. Check gateway/lock connection before scanning.'));
      return;
    }
    if (!selectedLock.permission.canManageCredentials) {
      setPhase('failed');
      setMessage(tr('Tài khoản hiện tại không có quyền thêm Face Unlock.', 'Current account cannot add Face Unlock credentials.'));
      return;
    }

    setBusy(true);
    try {
      const duplicate = await MockFaceRepository.checkDuplicate({lockId: selectedLock.id, lockName: selectedLock.name, roomName: selectedLock.roomName, owner: selectedOwner});
      if (duplicate) {
        setPhase('duplicate');
        setMessage(tr('Người nhận đã có Face Unlock active trên khóa này.', 'This owner already has an active Face Unlock on this lock.'));
        return;
      }

      const directions: FaceScanDirection[] = ['front', 'left', 'right'];
      const direction = directions[scanIndex] ?? 'right';
      setPhase(direction);
      markStep(direction, {status: 'scanning', message: tr('Đang quét camera...', 'Scanning camera...')});
      await new Promise(resolve => setTimeout(resolve, 360));

      const score = direction === 'front' ? 94 : direction === 'left' ? 88 : 91;
      markStep(direction, {status: 'passed', qualityScore: score, message: tr('Đã nhận diện pose và liveness mock đạt.', 'Pose captured and mock liveness passed.')});
      const nextIndex = scanIndex + 1;
      setScanIndex(nextIndex);
      const average = Math.round(((qualityScore ?? 0) * scanIndex + score) / Math.max(1, nextIndex));
      setQualityScore(average);

      if (nextIndex >= directions.length) {
        setPhase('verifying');
        setMessage(tr('Đang xác minh template face, không lưu ảnh mặt thô.', 'Verifying face template; raw face images are not stored.'));
        await new Promise(resolve => setTimeout(resolve, 460));
        const created = await MockFaceRepository.completeEnrollment({
          lockId: selectedLock.id,
          lockName: selectedLock.name,
          roomName: selectedLock.roomName,
          owner: selectedOwner,
          label,
          qualityScore: average,
          offline: selectedLock.connectionState === 'offline',
        });
        setPhase('completed');
        setMessage(tr(`Đã tạo Face Unlock ${created.templateRef.templateId} cho ${created.ownerName}.`, `Created Face Unlock ${created.templateRef.templateId} for ${created.ownerName}.`));
        await loadFaces(selectedLock.id);
        await reloadAccessRecords(selectedLock.id);
        await reloadLocks();
      } else {
        setMessage(tr('Pose đạt. Tiếp tục quét góc còn lại.', 'Pose passed. Continue with the next angle.'));
      }
    } catch (error) {
      setPhase('failed');
      setMessage(error instanceof Error ? error.message : tr('Enrollment Face Unlock thất bại.', 'Face Unlock enrollment failed.'));
    } finally {
      setBusy(false);
    }
  };

  const refreshList = async () => {
    await loadFaces(selectedLockId);
    await reloadAccessRecords(selectedLockId);
    await reloadLocks();
  };

  return (
    <BaseScreen>
      <AplusHeader
        title={tr('UI-23 · Thêm khuôn mặt', 'UI-23 · Add Face Unlock')}
        subtitle={tr('Face enrollment mock, kiểm tra quyền và capability', 'Mock face enrollment with permission/capability checks')}
        canGoBack
        onBack={navigation.goBack}
        rightLabel={tr('Tương thích', 'Capability')}
        rightIcon="capability"
        onRightPress={() => navigation.navigate('CompatibilityCheck', {lockId: selectedLockId, credentialType: 'face'})}
      />

      <AplusCard style={styles.heroCard}>
        <View style={styles.rowTop}>
          <AplusIcon name="face" size={34} color={theme.colors.primary} boxed boxSize={64} />
          <View style={styles.optionText}>
            <AplusText variant="title">{tr('Face Unlock enrollment', 'Face Unlock enrollment')}</AplusText>
            <AplusText variant="caption">
              {tr('Mock scan front/left/right, xác minh Owner/Admin và chỉ lưu FaceTemplateRef.', 'Mock front/left/right scans, verifies Owner/Admin and stores only FaceTemplateRef.')}
            </AplusText>
          </View>
          <StatusChip label={phaseLabel(phase, language)} tone={phaseTone(phase)} />
        </View>
        <AplusText variant="caption" style={styles.noteText}>
          {tr('Không lưu ảnh khuôn mặt thô trong app production; chỉ lưu templateId/reference do thiết bị trả về.', 'Raw face images are not stored in production; only device-returned templateId/reference is saved.')}
        </AplusText>
      </AplusCard>

      <AplusCard>
        <AplusText variant="subtitle">{tr('1. Chọn khóa có camera', '1. Select a camera lock')}</AplusText>
        <View style={styles.optionList}>
          {locks.map(lock => <LockOption key={lock.id} lock={lock} selected={lock.id === selectedLockId} onPress={() => setSelectedLockId(lock.id)} tr={tr} />)}
        </View>
        {supportedLocks.length === 0 ? <AplusText variant="caption" color={theme.colors.danger}>{tr('Chưa có khóa nào hỗ trợ Face Unlock.', 'No lock supports Face Unlock yet.')}</AplusText> : null}
      </AplusCard>

      <AplusCard>
        <AplusText variant="subtitle">{tr('2. Chọn owner/người nhận', '2. Select owner')}</AplusText>
        <View style={styles.optionList}>
          {people.map(person => <OwnerOption key={person.id} person={person} selected={person.id === selectedOwnerId} onPress={() => setSelectedOwnerId(person.id)} />)}
        </View>
      </AplusCard>

      <AplusCard>
        <AplusText variant="subtitle">{tr('3. Scan front / left / right', '3. Scan front / left / right')}</AplusText>
        <AplusTextField label={tr('Tên Face Unlock', 'Face Unlock label')} value={label} onChangeText={setLabel} placeholder={tr('Ví dụ: Face chủ nhà', 'Example: Owner face')} leftIcon="face" />
        <View style={styles.stepList}>
          {steps.map(step => <StepRow key={step.direction} step={step} />)}
        </View>
        <View style={styles.warningBox}>
          <AplusIcon name="shield" size={18} color={theme.colors.warning} />
          <AplusText variant="caption" style={styles.warningText}>
            {auth.user?.role === 'owner' || auth.user?.role === 'admin'
              ? tr('Đã xác thực Owner/Admin mock trước khi lưu Face credential.', 'Mock Owner/Admin verification passed before saving the face credential.')
              : tr('Flow nhạy cảm: production phải re-auth Owner/Admin trước khi lưu.', 'Sensitive flow: production must re-auth Owner/Admin before saving.')}
          </AplusText>
        </View>
        {message ? <AplusText variant="caption" color={phase === 'failed' || phase === 'duplicate' ? theme.colors.danger : theme.colors.textSubtle}>{message}</AplusText> : null}
        <View style={styles.actionRow}>
          <AplusButton title={scanIndex >= 3 ? tr('Quét lại', 'Scan again') : tr('Quét bước tiếp theo', 'Scan next pose')} leftIcon="face" onPress={scanIndex >= 3 ? resetEnrollment : scanNextPose} loading={busy} disabled={busy || (!canEnroll && scanIndex < 3)} style={styles.flexButton} />
          <AplusButton title={tr('Reset', 'Reset')} leftIcon="refresh" variant="secondary" onPress={resetEnrollment} disabled={busy} style={styles.flexButton} />
        </View>
      </AplusCard>

      <AplusCard>
        <AplusText variant="subtitle">{tr('Face credential đang quản lý', 'Managed face credentials')}</AplusText>
        {faces.length ? faces.map(item => <FaceRow key={item.id} item={item} people={people} tr={tr} onChanged={refreshList} />) : <AplusText variant="caption">{tr('Chưa có Face Unlock nào cho khóa này.', 'No Face Unlock credential for this lock yet.')}</AplusText>}
      </AplusCard>

      <AplusCard>
        <AplusText variant="subtitle">{tr('Record sử dụng gần đây', 'Recent usage records')}</AplusText>
        {recentFaceRecords.length ? recentFaceRecords.map(record => (
          <Pressable key={record.id} onPress={() => navigation.navigate('RecordDetail', {recordId: record.id})} style={({pressed}) => [styles.recordRow, pressed ? styles.pressed : null]}>
            <View style={styles.optionText}>
              <AplusText variant="body">{record.actorName}</AplusText>
              <AplusText variant="caption">{record.message}</AplusText>
            </View>
            <StatusChip label={record.result} tone={record.result === 'success' ? 'success' : 'danger'} />
          </Pressable>
        )) : <AplusText variant="caption">{tr('Chưa có record Face Unlock.', 'No Face Unlock records yet.')}</AplusText>}
      </AplusCard>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginTop: theme.spacing.lg,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  optionText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
  noteText: {
    marginTop: theme.spacing.md,
  },
  optionList: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  dimmed: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.82,
    transform: [{scale: 0.99}],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  stepList: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  stepBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surfaceStrong,
  },
  stepDone: {
    borderColor: theme.colors.success,
    backgroundColor: 'rgba(25,195,125,0.15)',
  },
  warningBox: {
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(255,193,7,0.08)',
  },
  warningText: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  flexButton: {
    flex: 1,
  },
  faceCard: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  metaGrid: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  recordRow: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});

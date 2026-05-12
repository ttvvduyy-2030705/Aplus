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
import {MockCardIssuerRepository} from '@/services/repositories/MockCardIssuerRepository';
import {MockCredentialRepository} from '@/services/repositories/MockCredentialRepository';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {BatchIssueJob, CardIssuerDevice, CardIssuerSummary, EmergencyCard, InstallationCardJob, TimeCalibrationCard} from '@/types/cardIssuer';
import type {Person} from '@/types/credential';
import type {AplusLock} from '@/types/lock';

type Language = 'vi' | 'en';
type TabKey = 'installation' | 'time' | 'emergency' | 'batch';

type CopyKey =
  | 'title' | 'subtitle' | 'device' | 'installation' | 'time' | 'emergency' | 'batch' | 'refresh'
  | 'scanDevice' | 'issuerDevices' | 'online' | 'jobs' | 'activeEmergency' | 'pendingAudit'
  | 'createInstall' | 'installTitle' | 'selectLocks' | 'createTime' | 'timezone' | 'offset'
  | 'createEmergency' | 'validMinutes' | 'authCode' | 'authHint' | 'appPin' | 'biometric' | 'otp'
  | 'emergencyCard' | 'cellPhoneCard' | 'revoke' | 'previewCsv' | 'commitBatch' | 'rollback'
  | 'csvLabel' | 'csvPlaceholder' | 'issued' | 'failed' | 'validUntil' | 'owner' | 'lock'
  | 'emptyJobs' | 'emptyEmergency' | 'emptyBatch' | 'policy' | 'policyText' | 'created' | 'authFailed'
  | 'noDevice' | 'noLock' | 'noOwner' | 'status' | 'summary' | 'batchIssue';

const copy: Record<Language, Record<CopyKey, string>> = {
  vi: {
    title: 'Card issuer nâng cao',
    subtitle: 'UI-63/67/56 · installation card, time card, emergency card, batch issue',
    device: 'Thiết bị issuer',
    installation: 'Installation card',
    time: 'Time card',
    emergency: 'Emergency card',
    batch: 'Cấp hàng loạt',
    refresh: 'Làm mới',
    scanDevice: 'Scan issuer',
    issuerDevices: 'Issuer devices',
    online: 'Online',
    jobs: 'Jobs',
    activeEmergency: 'Emergency active',
    pendingAudit: 'Pending audit',
    createInstall: 'Tạo installation job',
    installTitle: 'Tên job lắp đặt',
    selectLocks: 'Chọn khóa áp dụng',
    createTime: 'Tạo time card',
    timezone: 'Timezone',
    offset: 'UTC offset phút',
    createEmergency: 'Cấp emergency card',
    validMinutes: 'Hiệu lực phút',
    authCode: 'Mã xác thực',
    authHint: 'App PIN 2580/1234, OTP 123456, biometric nhập ok',
    appPin: 'App PIN',
    biometric: 'Biometric',
    otp: 'OTP',
    emergencyCard: 'Thẻ khẩn cấp',
    cellPhoneCard: 'Cell phone card',
    revoke: 'Thu hồi',
    previewCsv: 'Preview CSV',
    commitBatch: 'Cấp thẻ hàng loạt',
    rollback: 'Rollback',
    csvLabel: 'CSV cardId,lockId,ownerId,kind,validDays',
    csvPlaceholder: 'APL-BATCH-001,lock-hotel-0701,person-cleaner-01,cleaner,14',
    issued: 'Đã cấp',
    failed: 'Lỗi',
    validUntil: 'Hạn dùng',
    owner: 'Người nhận',
    lock: 'Khóa',
    emptyJobs: 'Chưa có job installation/time card mới.',
    emptyEmergency: 'Chưa có emergency card phù hợp.',
    emptyBatch: 'Chưa có batch issue job.',
    policy: 'Policy',
    policyText: 'Emergency/cell phone card bắt buộc có thời hạn ngắn, xác thực Owner/Admin và audit record.',
    created: 'Đã tạo/cấp thẻ mock thành công.',
    authFailed: 'Không cấp được. Kiểm tra xác thực, lock/owner hoặc thời hạn.',
    noDevice: 'Chưa chọn issuer device online.',
    noLock: 'Chưa chọn khóa.',
    noOwner: 'Chưa chọn người nhận.',
    status: 'Trạng thái',
    summary: 'Tổng quan',
    batchIssue: 'Batch issue',
  },
  en: {
    title: 'Advanced Card Issuer',
    subtitle: 'UI-63/67/56 · installation card, time card, emergency card, batch issue',
    device: 'Issuer device',
    installation: 'Installation card',
    time: 'Time card',
    emergency: 'Emergency card',
    batch: 'Batch issue',
    refresh: 'Refresh',
    scanDevice: 'Scan issuer',
    issuerDevices: 'Issuer devices',
    online: 'Online',
    jobs: 'Jobs',
    activeEmergency: 'Active emergency',
    pendingAudit: 'Pending audit',
    createInstall: 'Create installation job',
    installTitle: 'Installation job name',
    selectLocks: 'Select target locks',
    createTime: 'Create time card',
    timezone: 'Timezone',
    offset: 'UTC offset minutes',
    createEmergency: 'Issue emergency card',
    validMinutes: 'Valid minutes',
    authCode: 'Verification code',
    authHint: 'App PIN 2580/1234, OTP 123456, biometric enter ok',
    appPin: 'App PIN',
    biometric: 'Biometric',
    otp: 'OTP',
    emergencyCard: 'Emergency card',
    cellPhoneCard: 'Cell phone card',
    revoke: 'Revoke',
    previewCsv: 'Preview CSV',
    commitBatch: 'Issue batch cards',
    rollback: 'Rollback',
    csvLabel: 'CSV cardId,lockId,ownerId,kind,validDays',
    csvPlaceholder: 'APL-BATCH-001,lock-hotel-0701,person-cleaner-01,cleaner,14',
    issued: 'Issued',
    failed: 'Failed',
    validUntil: 'Valid until',
    owner: 'Owner',
    lock: 'Lock',
    emptyJobs: 'No new installation/time card jobs.',
    emptyEmergency: 'No matching emergency card.',
    emptyBatch: 'No batch issue jobs.',
    policy: 'Policy',
    policyText: 'Emergency/cell phone cards must expire quickly, require Owner/Admin verification and create audit records.',
    created: 'Mock card created/issued successfully.',
    authFailed: 'Unable to issue. Check verification, lock/owner or duration.',
    noDevice: 'No online issuer device selected.',
    noLock: 'No lock selected.',
    noOwner: 'No owner selected.',
    status: 'Status',
    summary: 'Summary',
    batchIssue: 'Batch issue',
  },
};

function formatDateTime(value?: number, language: Language = 'vi') {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN');
}

function statusTone(status: string) {
  if (['active', 'issued', 'completed'].includes(status)) {
    return 'success' as const;
  }
  if (['draft', 'previewed', 'pendingAuth'].includes(status)) {
    return 'info' as const;
  }
  if (['failed', 'expired', 'rolledBack'].includes(status)) {
    return 'danger' as const;
  }
  return 'warning' as const;
}

function TabPill({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) {
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

function DeviceCard({device, selected, onPress}: {device: CardIssuerDevice; selected: boolean; onPress: () => void}) {
  const available = device.status !== 'offline';
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.optionCard, selected ? styles.selectedCard : null, !available ? styles.dimmed : null, pressed ? styles.pressed : null]}>
      <AplusIcon name="card" size={22} color={available ? theme.colors.primary : theme.colors.textSubtle} boxed boxSize={44} />
      <View style={styles.optionText}>
        <AplusText variant="body" style={styles.bold}>{device.name}</AplusText>
        <AplusText variant="caption" numberOfLines={1}>{device.serial} · {device.location}</AplusText>
      </View>
      <StatusChip label={`${device.status} · ${device.batteryPercent}%`} tone={device.status === 'online' ? 'success' : device.status === 'busy' ? 'warning' : 'danger'} />
    </Pressable>
  );
}

function LockPicker({locks, selected, onSelect, language}: {locks: AplusLock[]; selected: string[]; onSelect: (id: string) => void; language: Language}) {
  return (
    <View style={styles.listGap}>
      {locks.map(lock => {
        const active = selected.includes(lock.id);
        return (
          <Pressable key={lock.id} onPress={() => onSelect(lock.id)} style={({pressed}) => [styles.optionCard, active ? styles.selectedCard : null, !lock.capabilities.supportsCard ? styles.dimmed : null, pressed ? styles.pressed : null]}>
            <AplusIcon name="lock" size={22} color={lock.capabilities.supportsCard ? theme.colors.primary : theme.colors.textSubtle} boxed boxSize={44} />
            <View style={styles.optionText}>
              <AplusText variant="body" style={styles.bold}>{lock.name}</AplusText>
              <AplusText variant="caption" numberOfLines={1}>{lock.roomName} · {lock.hardwareModel ?? lock.serial}</AplusText>
            </View>
            <StatusChip label={active ? (language === 'en' ? 'Selected' : 'Đã chọn') : lock.capabilities.supportsCard ? 'Card' : 'No card'} tone={active ? 'success' : lock.capabilities.supportsCard ? 'info' : 'danger'} />
          </Pressable>
        );
      })}
    </View>
  );
}

function PersonPicker({people, selected, onSelect}: {people: Person[]; selected?: string; onSelect: (id: string) => void}) {
  return (
    <View style={styles.listGap}>
      {people.slice(0, 6).map(person => (
        <Pressable key={person.id} onPress={() => onSelect(person.id)} style={({pressed}) => [styles.optionCard, selected === person.id ? styles.selectedCard : null, pressed ? styles.pressed : null]}>
          <AplusIcon name="user" size={22} color={theme.colors.primary} boxed boxSize={44} />
          <View style={styles.optionText}>
            <AplusText variant="body" style={styles.bold}>{person.fullName}</AplusText>
            <AplusText variant="caption">{person.role} · {person.scopeLabel}</AplusText>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export function CardIssuerScreen() {
  const {language} = useLanguage();
  const t = copy[language];
  const {locks, reloadLocks, reloadRecords} = useAppState();
  const [tab, setTab] = useState<TabKey>('emergency');
  const [devices, setDevices] = useState<CardIssuerDevice[]>([]);
  const [summary, setSummary] = useState<CardIssuerSummary>();
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('issuer-frontdesk-01');
  const [selectedLockIds, setSelectedLockIds] = useState<string[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>();
  const [installationTitle, setInstallationTitle] = useState('Installation card project A');
  const [timezone, setTimezone] = useState('Asia/Bangkok');
  const [timezoneOffset, setTimezoneOffset] = useState('420');
  const [validMinutes, setValidMinutes] = useState('60');
  const [authCode, setAuthCode] = useState('2580');
  const [authMethod, setAuthMethod] = useState<'appPin' | 'biometric' | 'otp'>('appPin');
  const [emergencyKind, setEmergencyKind] = useState<'emergency' | 'cellPhone'>('emergency');
  const [csv, setCsv] = useState('APL-BATCH-001,lock-hotel-0701,person-cleaner-01,cleaner,14\nAPL-BATCH-002,lock-home-520,person-tenant-520,tenant,30');
  const [installationJobs, setInstallationJobs] = useState<InstallationCardJob[]>([]);
  const [timeCards, setTimeCards] = useState<TimeCalibrationCard[]>([]);
  const [emergencyCards, setEmergencyCards] = useState<EmergencyCard[]>([]);
  const [batchJobs, setBatchJobs] = useState<BatchIssueJob[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedDevice = useMemo(() => devices.find(device => device.id === selectedDeviceId), [devices, selectedDeviceId]);
  const firstSelectedLock = selectedLockIds[0] ?? locks[0]?.id;

  const load = useCallback(async () => {
    const [nextSummary, nextDevices, nextPeople, nextInstall, nextTime, nextEmergency, nextBatch] = await Promise.all([
      MockCardIssuerRepository.getSummary(),
      MockCardIssuerRepository.getIssuerDevices(),
      MockCredentialRepository.getPeople(),
      MockCardIssuerRepository.getInstallationJobs(),
      MockCardIssuerRepository.getTimeCards(),
      MockCardIssuerRepository.getEmergencyCards(),
      MockCardIssuerRepository.getBatchJobs(),
    ]);
    setSummary(nextSummary);
    setDevices(nextDevices);
    setPeople(nextPeople);
    setInstallationJobs(nextInstall);
    setTimeCards(nextTime);
    setEmergencyCards(nextEmergency);
    setBatchJobs(nextBatch);
    if (!selectedLockIds.length && locks.length) {
      setSelectedLockIds([locks[0].id]);
    }
    if (!selectedOwnerId && nextPeople.length) {
      setSelectedOwnerId(nextPeople[0].id);
    }
  }, [locks, selectedLockIds.length, selectedOwnerId]);

  useEffect(() => {
    reloadLocks();
  }, [reloadLocks]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (task: () => Promise<void>) => {
    setLoading(true);
    setMessage('');
    try {
      await task();
      await load();
      await reloadRecords();
    } finally {
      setLoading(false);
    }
  };

  const toggleLock = (lockId: string) => {
    setSelectedLockIds(prev => prev.includes(lockId) ? prev.filter(item => item !== lockId) : [...prev, lockId]);
  };

  const scanDevice = () => run(async () => {
    const device = await MockCardIssuerRepository.scanIssuerDevice();
    setSelectedDeviceId(device.id);
    setMessage(`${t.scanDevice}: ${device.name}`);
  });

  const createInstallation = () => run(async () => {
    if (!selectedDevice) {
      setMessage(t.noDevice);
      return;
    }
    const job = await MockCardIssuerRepository.createInstallationJob({issuerDeviceId: selectedDevice.id, lockIds: selectedLockIds, title: installationTitle});
    setMessage(job.status === 'issued' ? t.created : t.failed);
  });

  const createTime = () => run(async () => {
    if (!selectedDevice) {
      setMessage(t.noDevice);
      return;
    }
    if (!firstSelectedLock) {
      setMessage(t.noLock);
      return;
    }
    const card = await MockCardIssuerRepository.createTimeCard({issuerDeviceId: selectedDevice.id, lockId: firstSelectedLock, timezone, timezoneOffsetMinutes: Number(timezoneOffset)});
    setMessage(card ? t.created : t.failed);
  });

  const createEmergency = () => run(async () => {
    if (!selectedDevice) {
      setMessage(t.noDevice);
      return;
    }
    if (!firstSelectedLock) {
      setMessage(t.noLock);
      return;
    }
    if (!selectedOwnerId) {
      setMessage(t.noOwner);
      return;
    }
    const result = await MockCardIssuerRepository.createEmergencyCard({
      issuerDeviceId: selectedDevice.id,
      lockId: firstSelectedLock,
      ownerId: selectedOwnerId,
      kind: emergencyKind,
      validMinutes: Number(validMinutes),
      authMethod,
      authCode,
    });
    setMessage(result.ok ? t.created : `${t.authFailed} ${result.message}`);
  });

  const revokeEmergency = (cardId: string) => run(async () => {
    await MockCardIssuerRepository.revokeEmergencyCard(cardId);
    setMessage(t.revoke);
  });

  const previewBatch = () => run(async () => {
    const job = await MockCardIssuerRepository.previewBatchCsv(csv);
    setMessage(`${t.previewCsv}: ${job.rows.filter(row => row.ok).length}/${job.rows.length}`);
  });

  const commitBatch = (jobId: string) => run(async () => {
    const job = await MockCardIssuerRepository.commitBatchIssue(jobId);
    setMessage(job ? `${t.issued}: ${job.issuedCount}, ${t.failed}: ${job.failedCount}` : t.failed);
  });

  const rollbackBatch = (jobId: string) => run(async () => {
    await MockCardIssuerRepository.rollbackBatchIssue(jobId);
    setMessage(t.rollback);
  });

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={t.title} subtitle={t.subtitle} showBack showLogo />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <AplusIcon name="card" size={40} color={theme.colors.primary} boxed boxSize={72} />
          <View style={styles.heroText}>
            <AplusText variant="hero">{t.title}</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>{t.policyText}</AplusText>
            <View style={styles.badgeRow}>
              <StatusChip label="UI-63" tone="info" />
              <StatusChip label="UI-67" tone="info" />
              <StatusChip label="UI-56" tone="info" />
            </View>
          </View>
        </View>
      </AplusCard>

      {summary ? (
        <View style={styles.summaryGrid}>
          <SummaryBox label={t.issuerDevices} value={summary.issuerDevices} tone="info" />
          <SummaryBox label={t.online} value={summary.onlineDevices} tone="success" />
          <SummaryBox label={t.activeEmergency} value={summary.activeEmergencyCards} tone="warning" />
          <SummaryBox label={t.pendingAudit} value={summary.pendingAudit} tone="danger" />
        </View>
      ) : null}

      <AplusCard style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <AplusText variant="subtitle">{t.device}</AplusText>
            <AplusText variant="caption">{selectedDevice ? `${selectedDevice.name} · ${selectedDevice.serial}` : t.noDevice}</AplusText>
          </View>
          <AplusButton title={t.scanDevice} onPress={scanDevice} variant="secondary" leftIcon="refresh" loading={loading} />
        </View>
        <View style={styles.listGap}>
          {devices.map(device => <DeviceCard key={device.id} device={device} selected={device.id === selectedDeviceId} onPress={() => setSelectedDeviceId(device.id)} />)}
        </View>
      </AplusCard>

      <View style={styles.tabRow}>
        <TabPill label={t.installation} active={tab === 'installation'} onPress={() => setTab('installation')} />
        <TabPill label={t.time} active={tab === 'time'} onPress={() => setTab('time')} />
        <TabPill label={t.emergency} active={tab === 'emergency'} onPress={() => setTab('emergency')} />
        <TabPill label={t.batch} active={tab === 'batch'} onPress={() => setTab('batch')} />
      </View>

      {message ? <AplusCard style={styles.messageCard}><AplusText variant="body">{message}</AplusText></AplusCard> : null}

      {tab === 'installation' ? (
        <AplusCard style={styles.section}>
          <AplusText variant="subtitle">{t.createInstall}</AplusText>
          <AplusTextField label={t.installTitle} value={installationTitle} onChangeText={setInstallationTitle} />
          <AplusText variant="label">{t.selectLocks}</AplusText>
          <LockPicker locks={locks} selected={selectedLockIds} onSelect={toggleLock} language={language} />
          <AplusButton title={t.createInstall} onPress={createInstallation} loading={loading} leftIcon="plus" />
          <View style={styles.listGap}>
            {installationJobs.length ? installationJobs.map(job => (
              <AplusCard key={job.id} style={styles.nestedCard}>
                <View style={styles.rowBetween}>
                  <AplusText variant="body" style={styles.bold}>{job.title}</AplusText>
                  <StatusChip label={job.status} tone={statusTone(job.status)} />
                </View>
                <AplusText variant="caption">{job.lockNames.join(', ') || '—'}</AplusText>
                <AplusText variant="caption">{formatDateTime(job.createdAt, language)}</AplusText>
              </AplusCard>
            )) : <AplusText variant="caption">{t.emptyJobs}</AplusText>}
          </View>
        </AplusCard>
      ) : null}

      {tab === 'time' ? (
        <AplusCard style={styles.section}>
          <AplusText variant="subtitle">{t.createTime}</AplusText>
          <AplusTextField label={t.timezone} value={timezone} onChangeText={setTimezone} />
          <AplusTextField label={t.offset} value={timezoneOffset} onChangeText={setTimezoneOffset} keyboardType="numeric" />
          <LockPicker locks={locks} selected={firstSelectedLock ? [firstSelectedLock] : []} onSelect={id => setSelectedLockIds([id])} language={language} />
          <AplusButton title={t.createTime} onPress={createTime} loading={loading} leftIcon="calendar" />
          <View style={styles.listGap}>
            {timeCards.length ? timeCards.map(card => (
              <AplusCard key={card.id} style={styles.nestedCard}>
                <View style={styles.rowBetween}>
                  <AplusText variant="body" style={styles.bold}>{card.lockName}</AplusText>
                  <StatusChip label={card.status} tone={statusTone(card.status)} />
                </View>
                <AplusText variant="caption">{card.timezone} · UTC {card.timezoneOffsetMinutes >= 0 ? '+' : ''}{card.timezoneOffsetMinutes / 60}</AplusText>
                <AplusText variant="caption">{formatDateTime(card.calibratedAt ?? card.createdAt, language)}</AplusText>
              </AplusCard>
            )) : <AplusText variant="caption">{t.emptyJobs}</AplusText>}
          </View>
        </AplusCard>
      ) : null}

      {tab === 'emergency' ? (
        <AplusCard style={styles.section}>
          <AplusText variant="subtitle">{t.createEmergency}</AplusText>
          <View style={styles.tabRow}>
            <TabPill label={t.emergencyCard} active={emergencyKind === 'emergency'} onPress={() => setEmergencyKind('emergency')} />
            <TabPill label={t.cellPhoneCard} active={emergencyKind === 'cellPhone'} onPress={() => setEmergencyKind('cellPhone')} />
          </View>
          <View style={styles.tabRow}>
            <TabPill label={t.appPin} active={authMethod === 'appPin'} onPress={() => setAuthMethod('appPin')} />
            <TabPill label={t.otp} active={authMethod === 'otp'} onPress={() => setAuthMethod('otp')} />
            <TabPill label={t.biometric} active={authMethod === 'biometric'} onPress={() => setAuthMethod('biometric')} />
          </View>
          <AplusTextField label={t.validMinutes} value={validMinutes} onChangeText={setValidMinutes} keyboardType="numeric" />
          <AplusTextField label={t.authCode} value={authCode} onChangeText={setAuthCode} placeholder={t.authHint} />
          <AplusText variant="label">{t.lock}</AplusText>
          <LockPicker locks={locks} selected={firstSelectedLock ? [firstSelectedLock] : []} onSelect={id => setSelectedLockIds([id])} language={language} />
          <AplusText variant="label">{t.owner}</AplusText>
          <PersonPicker people={people} selected={selectedOwnerId} onSelect={setSelectedOwnerId} />
          <AplusButton title={t.createEmergency} onPress={createEmergency} loading={loading} leftIcon="shield" />
          <View style={styles.listGap}>
            {emergencyCards.length ? emergencyCards.map(card => (
              <AplusCard key={card.id} style={styles.nestedCard}>
                <View style={styles.rowBetween}>
                  <View style={styles.optionText}>
                    <AplusText variant="body" style={styles.bold}>{card.cardId}</AplusText>
                    <AplusText variant="caption">{card.lockName} · {card.ownerName}</AplusText>
                  </View>
                  <StatusChip label={card.status} tone={statusTone(card.status)} />
                </View>
                <AplusText variant="caption">{t.validUntil}: {formatDateTime(card.validTo, language)}</AplusText>
                {card.status !== 'revoked' ? <AplusButton title={t.revoke} onPress={() => revokeEmergency(card.id)} variant="danger" leftIcon="revoked" /> : null}
              </AplusCard>
            )) : <AplusText variant="caption">{t.emptyEmergency}</AplusText>}
          </View>
        </AplusCard>
      ) : null}

      {tab === 'batch' ? (
        <AplusCard style={styles.section}>
          <AplusText variant="subtitle">{t.batchIssue}</AplusText>
          <AplusTextField label={t.csvLabel} value={csv} onChangeText={setCsv} placeholder={t.csvPlaceholder} multiline />
          <View style={styles.buttonRow}>
            <AplusButton title={t.previewCsv} onPress={previewBatch} loading={loading} leftIcon="sync" variant="secondary" style={styles.flexButton} />
          </View>
          <View style={styles.listGap}>
            {batchJobs.length ? batchJobs.map(job => (
              <AplusCard key={job.id} style={styles.nestedCard}>
                <View style={styles.rowBetween}>
                  <AplusText variant="body" style={styles.bold}>{job.title}</AplusText>
                  <StatusChip label={job.status} tone={statusTone(job.status)} />
                </View>
                <AplusText variant="caption">{t.issued}: {job.issuedCount} · {t.failed}: {job.failedCount} · rows: {job.rows.length}</AplusText>
                <View style={styles.listGapSmall}>
                  {job.rows.slice(0, 4).map(row => (
                    <AplusText key={`${job.id}-${row.rowNo}`} variant="caption" color={row.ok ? theme.colors.textMuted : theme.colors.danger}>
                      #{row.rowNo} {row.cardId || '—'} → {row.lockId || '—'} · {row.ok ? 'OK' : row.errors.join('; ')}
                    </AplusText>
                  ))}
                </View>
                <View style={styles.buttonRow}>
                  {job.status === 'previewed' ? <AplusButton title={t.commitBatch} onPress={() => commitBatch(job.id)} loading={loading} leftIcon="check" style={styles.flexButton} /> : null}
                  {job.rollbackAvailable ? <AplusButton title={t.rollback} onPress={() => rollbackBatch(job.id)} variant="danger" leftIcon="revoked" style={styles.flexButton} /> : null}
                </View>
              </AplusCard>
            )) : <AplusText variant="caption">{t.emptyBatch}</AplusText>}
          </View>
        </AplusCard>
      ) : null}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  heroCard: {
    backgroundColor: '#101014',
    borderColor: theme.colors.borderStrong,
  },
  heroRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    alignItems: 'center',
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  summaryBox: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: theme.spacing.sm,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  listGap: {
    gap: theme.spacing.md,
  },
  listGapSmall: {
    gap: theme.spacing.xs,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceStrong,
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  dimmed: {
    opacity: 0.52,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  pill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  pillActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  pressed: {
    transform: [{scale: 0.985}],
    opacity: 0.86,
  },
  messageCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  nestedCard: {
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surfaceStrong,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  flexButton: {
    flexGrow: 1,
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
});

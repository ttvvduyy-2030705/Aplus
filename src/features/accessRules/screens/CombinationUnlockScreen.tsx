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
import {MockAccessRuleRepository} from '@/services/repositories/MockAccessRuleRepository';
import {MockCredentialRepository} from '@/services/repositories/MockCredentialRepository';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {AccessFactor, AccessRuleStatus, CombinationRule, CombinationRuleType, Weekday} from '@/types/accessRule';
import type {Person} from '@/types/credential';

const copy = {
  vi: {
    title: 'Mở khóa kết hợp',
    subtitle: 'UI-28 · PIN+card, Face+PIN, App+vân tay',
    heroTitle: 'Combination unlock',
    heroBody: 'Tạo rule yêu cầu 2 yếu tố xác thực theo khóa/phòng/người/thời gian. Rule rủi ro cao sẽ bị cảnh báo trước khi bật.',
    lock: 'Khóa áp dụng',
    owner: 'Người áp dụng',
    type: 'Tổ hợp',
    days: 'Ngày hiệu lực',
    start: 'Giờ bắt đầu',
    end: 'Giờ kết thúc',
    timezone: 'Timezone',
    create: 'Tạo rule',
    rules: 'Rule đang có',
    empty: 'Chưa có rule kết hợp cho khóa này.',
    active: 'Active',
    paused: 'Paused',
    revoked: 'Revoked',
    expired: 'Expired',
    draft: 'Draft',
    pause: 'Tạm dừng',
    resume: 'Bật lại',
    revoke: 'Thu hồi',
    simulateOk: 'Test đủ yếu tố',
    simulateMissing: 'Test thiếu yếu tố',
    records: 'Lịch sử',
    risk: 'Cảnh báo rủi ro',
    noRisk: 'Rule an toàn',
    success: 'Đã tạo rule mở khóa kết hợp.',
  },
  en: {
    title: 'Combination unlock',
    subtitle: 'UI-28 · PIN+card, Face+PIN, App+fingerprint',
    heroTitle: 'Combination unlock',
    heroBody: 'Create two-factor unlock rules by lock/room/person/time. High-risk rules are flagged before they are enabled.',
    lock: 'Target lock',
    owner: 'Owner',
    type: 'Combination',
    days: 'Active days',
    start: 'Start time',
    end: 'End time',
    timezone: 'Timezone',
    create: 'Create rule',
    rules: 'Existing rules',
    empty: 'No combination rule for this lock yet.',
    active: 'Active',
    paused: 'Paused',
    revoked: 'Revoked',
    expired: 'Expired',
    draft: 'Draft',
    pause: 'Pause',
    resume: 'Resume',
    revoke: 'Revoke',
    simulateOk: 'Test full factors',
    simulateMissing: 'Test missing factor',
    records: 'Records',
    risk: 'Risk warning',
    noRisk: 'Safe rule',
    success: 'Combination unlock rule created.',
  },
};

const typeOptions: Array<{type: CombinationRuleType; label: string; factors: AccessFactor[]}> = [
  {type: 'pin_card', label: 'PIN + Card', factors: ['pin', 'card']},
  {type: 'app_fingerprint', label: 'App + Fingerprint', factors: ['app', 'fingerprint']},
  {type: 'face_pin', label: 'Face + PIN', factors: ['face', 'pin']},
  {type: 'card_fingerprint', label: 'Card + Fingerprint', factors: ['card', 'fingerprint']},
];

const weekdayOptions: Array<{code: Weekday; label: string}> = [
  {code: 'MO', label: 'T2'},
  {code: 'TU', label: 'T3'},
  {code: 'WE', label: 'T4'},
  {code: 'TH', label: 'T5'},
  {code: 'FR', label: 'T6'},
  {code: 'SA', label: 'T7'},
  {code: 'SU', label: 'CN'},
];

function statusTone(status: AccessRuleStatus): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (status === 'active') {
    return 'success';
  }
  if (status === 'paused' || status === 'draft') {
    return 'warning';
  }
  if (status === 'revoked' || status === 'expired') {
    return 'danger';
  }
  return 'muted';
}

function statusLabel(status: AccessRuleStatus, t: typeof copy.vi) {
  if (status === 'active') {
    return t.active;
  }
  if (status === 'paused') {
    return t.paused;
  }
  if (status === 'revoked') {
    return t.revoked;
  }
  if (status === 'expired') {
    return t.expired;
  }
  return t.draft;
}

function RuleCard({rule, onToggle, onRevoke, onTestFull, onTestMissing, t}: {rule: CombinationRule; onToggle: (rule: CombinationRule) => void; onRevoke: (ruleId: string) => void; onTestFull: (rule: CombinationRule) => void; onTestMissing: (rule: CombinationRule) => void; t: typeof copy.vi}) {
  const disabled = rule.status === 'revoked' || rule.status === 'expired';
  return (
    <AplusCard style={styles.ruleCard}>
      <View style={styles.rowTop}>
        <AplusIcon name="unlock" size={26} color={rule.riskLevel === 'danger' ? theme.colors.danger : theme.colors.primary} boxed />
        <View style={styles.flex}>
          <AplusText variant="body" style={styles.bold}>{rule.title}</AplusText>
          <AplusText variant="caption">{rule.lockName} · {rule.ownerName}</AplusText>
        </View>
        <StatusChip label={statusLabel(rule.status, t)} tone={statusTone(rule.status)} />
      </View>
      <View style={styles.chipWrap}>
        {rule.factors.map(factor => <StatusChip key={factor} label={factor.toUpperCase()} tone="info" />)}
        <StatusChip label={`${rule.schedule.daysOfWeek.join('/')} · ${rule.schedule.startTime}-${rule.schedule.endTime}`} tone="muted" />
        <StatusChip label={rule.syncState} tone={rule.syncState === 'synced' ? 'success' : 'warning'} />
      </View>
      {rule.riskWarnings.length ? (
        <AplusCard style={styles.warningBox}>
          <AplusText variant="caption" color={theme.colors.warning}>{t.risk}: {rule.riskWarnings.join(' · ')}</AplusText>
        </AplusCard>
      ) : <AplusText variant="caption" color={theme.colors.success}>{t.noRisk}</AplusText>}
      <View style={styles.actionRow}>
        <AplusButton title={t.simulateOk} leftIcon="check" variant="secondary" disabled={disabled} onPress={() => onTestFull(rule)} style={styles.flexButton} />
        <AplusButton title={t.simulateMissing} leftIcon="alert" variant="secondary" disabled={disabled} onPress={() => onTestMissing(rule)} style={styles.flexButton} />
      </View>
      <View style={styles.actionRow}>
        <AplusButton title={rule.status === 'active' ? t.pause : t.resume} leftIcon="sync" variant="ghost" disabled={disabled} onPress={() => onToggle(rule)} style={styles.flexButton} />
        <AplusButton title={t.revoke} leftIcon="revoked" variant="danger" disabled={rule.status === 'revoked'} onPress={() => onRevoke(rule.id)} style={styles.flexButton} />
      </View>
    </AplusCard>
  );
}

export function CombinationUnlockScreen({lockId}: {lockId?: string}) {
  const navigation = useAplusNavigation();
  const {language} = useLanguage();
  const t = language === 'en' ? copy.en : copy.vi;
  const {locks, reloadAccessRecords} = useAppState();
  const selectedDefaultLock = useMemo(() => locks.find(lock => lock.id === lockId) ?? locks.find(lock => lock.capabilities.supportsCard && lock.capabilities.supportsFingerprint) ?? locks[0], [lockId, locks]);
  const [selectedLockId, setSelectedLockId] = useState(selectedDefaultLock?.id);
  const [people, setPeople] = useState<Person[]>([]);
  const [ownerId, setOwnerId] = useState<string>();
  const [selectedType, setSelectedType] = useState<CombinationRuleType>('pin_card');
  const [days, setDays] = useState<Weekday[]>(['MO', 'TU', 'WE', 'TH', 'FR']);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [rules, setRules] = useState<CombinationRule[]>([]);
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(false);

  const selectedLock = useMemo(() => locks.find(lock => lock.id === selectedLockId) ?? selectedDefaultLock, [locks, selectedDefaultLock, selectedLockId]);

  const reload = useCallback(async () => {
    const [ruleList, peopleList] = await Promise.all([
      MockAccessRuleRepository.getCombinationRules(selectedLock?.id),
      MockCredentialRepository.getPeople(),
    ]);
    setRules(ruleList);
    setPeople(peopleList.filter(person => person.active));
    setOwnerId(current => current ?? peopleList.find(person => person.active)?.id);
  }, [selectedLock?.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggleDay = (code: Weekday) => {
    setDays(current => current.includes(code) ? current.filter(item => item !== code) : [...current, code]);
  };

  const createRule = async () => {
    if (!selectedLock || !ownerId) {
      setMessage(language === 'en' ? 'Please select a lock and owner.' : 'Vui lòng chọn khóa và người áp dụng.');
      return;
    }
    setLoading(true);
    try {
      await MockAccessRuleRepository.createCombinationRule({
        type: selectedType,
        lockId: selectedLock.id,
        ownerId,
        daysOfWeek: days,
        startTime,
        endTime,
        timezone,
      });
      setMessage(t.success);
      await reload();
      await reloadAccessRecords();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không tạo được rule.');
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (rule: CombinationRule) => {
    await MockAccessRuleRepository.setCombinationRuleStatus(rule.id, rule.status === 'active' ? 'paused' : 'active');
    await reload();
    await reloadAccessRecords();
  };

  const revokeRule = async (ruleId: string) => {
    await MockAccessRuleRepository.setCombinationRuleStatus(ruleId, 'revoked');
    await reload();
    await reloadAccessRecords();
  };

  const simulate = async (rule: CombinationRule, missing: boolean) => {
    const providedFactors = missing ? rule.factors.slice(0, 1) : rule.factors;
    const result = await MockAccessRuleRepository.simulateCombinationUnlock({ruleId: rule.id, providedFactors});
    setMessage(result.message);
    await reload();
    await reloadAccessRecords();
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={t.title} subtitle={t.subtitle} canGoBack onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.heroCard}>
        <View style={styles.rowTop}>
          <AplusIcon name="unlock" size={42} color={theme.colors.primary} boxed boxSize={74} />
          <View style={styles.flex}>
            <AplusText variant="hero">{t.heroTitle}</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>{t.heroBody}</AplusText>
          </View>
        </View>
        <View style={styles.chipWrap}>
          <StatusChip label="UI-28" tone="info" />
          <StatusChip label="PIN + Card" tone="success" />
          <StatusChip label="Face + PIN" tone="success" />
        </View>
      </AplusCard>

      <AplusCard style={styles.formCard}>
        <AplusText variant="subtitle">{t.create}</AplusText>
        <AplusText variant="caption">{t.lock}</AplusText>
        <View style={styles.chipWrap}>
          {locks.map(lock => (
            <Pressable key={lock.id} onPress={() => setSelectedLockId(lock.id)} style={[styles.selectChip, selectedLock?.id === lock.id ? styles.selectChipActive : null]}>
              <AplusText variant="caption" color={selectedLock?.id === lock.id ? theme.colors.text : theme.colors.textMuted}>{lock.roomName}</AplusText>
            </Pressable>
          ))}
        </View>
        <AplusText variant="caption">{t.owner}</AplusText>
        <View style={styles.chipWrap}>
          {people.slice(0, 6).map(person => (
            <Pressable key={person.id} onPress={() => setOwnerId(person.id)} style={[styles.selectChip, ownerId === person.id ? styles.selectChipActive : null]}>
              <AplusText variant="caption" color={ownerId === person.id ? theme.colors.text : theme.colors.textMuted}>{person.fullName}</AplusText>
            </Pressable>
          ))}
        </View>
        <AplusText variant="caption">{t.type}</AplusText>
        <View style={styles.optionGrid}>
          {typeOptions.map(option => (
            <Pressable key={option.type} onPress={() => setSelectedType(option.type)} style={[styles.optionCard, selectedType === option.type ? styles.optionCardActive : null]}>
              <AplusText variant="body" style={styles.bold}>{option.label}</AplusText>
              <AplusText variant="caption">{option.factors.map(item => item.toUpperCase()).join(' + ')}</AplusText>
            </Pressable>
          ))}
        </View>
        <AplusText variant="caption">{t.days}</AplusText>
        <View style={styles.chipWrap}>
          {weekdayOptions.map(item => (
            <Pressable key={item.code} onPress={() => toggleDay(item.code)} style={[styles.dayChip, days.includes(item.code) ? styles.selectChipActive : null]}>
              <AplusText variant="caption" color={days.includes(item.code) ? theme.colors.text : theme.colors.textMuted}>{item.label}</AplusText>
            </Pressable>
          ))}
        </View>
        <View style={styles.formRow}>
          <AplusTextField label={t.start} value={startTime} onChangeText={setStartTime} containerStyle={styles.flex} />
          <AplusTextField label={t.end} value={endTime} onChangeText={setEndTime} containerStyle={styles.flex} />
        </View>
        <AplusTextField label={t.timezone} value={timezone} onChangeText={setTimezone} />
        {message ? <AplusText variant="caption" color={message.includes('thành công') || message.includes('created') || message.includes('success') ? theme.colors.success : theme.colors.warning}>{message}</AplusText> : null}
        <AplusButton title={t.create} leftIcon="plus" loading={loading} onPress={createRule} />
      </AplusCard>

      <View style={styles.sectionTitle}>
        <AplusText variant="subtitle">{t.rules}</AplusText>
        <AplusText variant="caption">{selectedLock?.name ?? '—'}</AplusText>
      </View>
      {rules.length ? rules.map(rule => (
        <RuleCard key={rule.id} rule={rule} t={t} onToggle={toggleRule} onRevoke={revokeRule} onTestFull={item => simulate(item, false)} onTestMissing={item => simulate(item, true)} />
      )) : (
        <AplusCard style={styles.formCard}>
          <AplusText variant="caption">{t.empty}</AplusText>
        </AplusCard>
      )}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {gap: theme.spacing.md, borderColor: theme.colors.borderStrong},
  formCard: {gap: theme.spacing.md},
  ruleCard: {gap: theme.spacing.md},
  rowTop: {flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center'},
  flex: {flex: 1},
  bold: {fontWeight: theme.typography.weight.bold},
  chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  selectChip: {borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.surfaceStrong},
  selectChipActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  dayChip: {minWidth: 42, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.surfaceStrong},
  optionGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md},
  optionCard: {flexBasis: '47%', flexGrow: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: theme.spacing.md, backgroundColor: theme.colors.surfaceStrong, gap: 4},
  optionCardActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  formRow: {flexDirection: 'row', gap: theme.spacing.md},
  actionRow: {flexDirection: 'row', gap: theme.spacing.md, flexWrap: 'wrap'},
  flexButton: {flexBasis: '45%', flexGrow: 1},
  warningBox: {padding: theme.spacing.md, borderColor: 'rgba(253,176,34,0.38)', backgroundColor: 'rgba(253,176,34,0.08)'},
  sectionTitle: {gap: theme.spacing.xs},
});

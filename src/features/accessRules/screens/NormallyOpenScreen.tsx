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
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {AccessRuleStatus, ClassSchedule, ClassScheduleImportRow, NormallyOpenOutsideMode, NormallyOpenSchedule, ScheduleException, Weekday} from '@/types/accessRule';

const copy = {
  vi: {
    title: 'Mở thường xuyên',
    subtitle: 'UI-20/UI-68 · Normally Open và lịch lớp/ca',
    heroTitle: 'Normally Open & lịch tự động',
    heroBody: 'Thiết lập giờ mở thường xuyên, ngoài giờ tự khóa theo policy và import lịch lớp/ca có kiểm tra trùng lịch.',
    tabNormal: 'Normally Open',
    tabClass: 'Lịch lớp/ca',
    lock: 'Khóa áp dụng',
    name: 'Tên lịch',
    days: 'Ngày trong tuần',
    start: 'Giờ bắt đầu',
    end: 'Giờ kết thúc',
    timezone: 'Timezone',
    outside: 'Ngoài giờ',
    autoLock: 'Tự khóa',
    manualLock: 'Khóa thủ công',
    keepLast: 'Giữ trạng thái',
    create: 'Tạo lịch',
    evaluate: 'Kiểm tra giờ hiện tại',
    schedules: 'Lịch đang có',
    classSchedules: 'Lịch lớp/ca',
    exceptions: 'Ngoại lệ',
    importCsv: 'CSV import',
    preview: 'Preview lỗi',
    commit: 'Import lịch hợp lệ',
    addHoliday: 'Thêm ngày nghỉ',
    active: 'Active',
    paused: 'Paused',
    revoked: 'Revoked',
    expired: 'Expired',
    draft: 'Draft',
    pause: 'Tạm dừng',
    resume: 'Bật lại',
    risk: 'Cảnh báo rủi ro',
    noRisk: 'Lịch an toàn',
    empty: 'Chưa có lịch cho khóa này.',
    created: 'Đã tạo lịch mở thường xuyên.',
  },
  en: {
    title: 'Normally Open',
    subtitle: 'UI-20/UI-68 · Normally Open and class/shift schedules',
    heroTitle: 'Normally Open & auto schedule',
    heroBody: 'Configure recurring open windows, outside-hour lock policy and class/shift imports with conflict checks.',
    tabNormal: 'Normally Open',
    tabClass: 'Class/shift',
    lock: 'Target lock',
    name: 'Schedule name',
    days: 'Weekdays',
    start: 'Start time',
    end: 'End time',
    timezone: 'Timezone',
    outside: 'Outside hours',
    autoLock: 'Auto lock',
    manualLock: 'Manual lock',
    keepLast: 'Keep last state',
    create: 'Create schedule',
    evaluate: 'Check current time',
    schedules: 'Existing schedules',
    classSchedules: 'Class/shift schedules',
    exceptions: 'Exceptions',
    importCsv: 'CSV import',
    preview: 'Preview errors',
    commit: 'Import valid rows',
    addHoliday: 'Add holiday',
    active: 'Active',
    paused: 'Paused',
    revoked: 'Revoked',
    expired: 'Expired',
    draft: 'Draft',
    pause: 'Pause',
    resume: 'Resume',
    risk: 'Risk warning',
    noRisk: 'Safe schedule',
    empty: 'No schedule for this lock yet.',
    created: 'Normally Open schedule created.',
  },
};

const weekdayOptions: Array<{code: Weekday; label: string}> = [
  {code: 'MO', label: 'T2'},
  {code: 'TU', label: 'T3'},
  {code: 'WE', label: 'T4'},
  {code: 'TH', label: 'T5'},
  {code: 'FR', label: 'T6'},
  {code: 'SA', label: 'T7'},
  {code: 'SU', label: 'CN'},
];

const sampleCsv = 'Lớp tự động A1,lock-hotel-0701,Phòng 701,MO|WE,08:00,10:00\nCa bảo vệ tối,lock-office-meeting,Meeting Crimson,FR,18:00,20:00';

function statusTone(status: AccessRuleStatus | ClassSchedule['status']): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (status === 'active') {
    return 'success';
  }
  if (status === 'paused' || status === 'draft' || status === 'conflict') {
    return 'warning';
  }
  if (status === 'revoked' || status === 'expired' || status === 'importError') {
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

function ScheduleCard({schedule, onToggle, onEvaluate, t}: {schedule: NormallyOpenSchedule; onToggle: (schedule: NormallyOpenSchedule) => void; onEvaluate: (scheduleId: string) => void; t: typeof copy.vi}) {
  return (
    <AplusCard style={styles.itemCard}>
      <View style={styles.rowTop}>
        <AplusIcon name="calendar" size={26} color={schedule.riskLevel === 'danger' ? theme.colors.danger : theme.colors.primary} boxed />
        <View style={styles.flex}>
          <AplusText variant="body" style={styles.bold}>{schedule.title}</AplusText>
          <AplusText variant="caption">{schedule.lockName} · {schedule.roomName}</AplusText>
        </View>
        <StatusChip label={statusLabel(schedule.status, t)} tone={statusTone(schedule.status)} />
      </View>
      <View style={styles.chipWrap}>
        <StatusChip label={`${schedule.schedule.daysOfWeek.join('/')} · ${schedule.schedule.startTime}-${schedule.schedule.endTime}`} tone="info" />
        <StatusChip label={schedule.schedule.timezone} tone="muted" />
        <StatusChip label={schedule.outsideMode} tone="warning" />
      </View>
      {schedule.riskWarnings.length ? (
        <AplusCard style={styles.warningBox}>
          <AplusText variant="caption" color={theme.colors.warning}>{t.risk}: {schedule.riskWarnings.join(' · ')}</AplusText>
        </AplusCard>
      ) : <AplusText variant="caption" color={theme.colors.success}>{t.noRisk}</AplusText>}
      <View style={styles.actionRow}>
        <AplusButton title={t.evaluate} leftIcon="check" variant="secondary" onPress={() => onEvaluate(schedule.id)} style={styles.flexButton} />
        <AplusButton title={schedule.status === 'active' ? t.pause : t.resume} leftIcon="sync" variant="ghost" onPress={() => onToggle(schedule)} style={styles.flexButton} />
      </View>
    </AplusCard>
  );
}

function ClassRow({schedule}: {schedule: ClassSchedule}) {
  return (
    <AplusCard style={styles.itemCard}>
      <View style={styles.rowTop}>
        <AplusIcon name="calendar" size={24} color={schedule.status === 'active' ? theme.colors.success : theme.colors.warning} boxed />
        <View style={styles.flex}>
          <AplusText variant="body" style={styles.bold}>{schedule.title}</AplusText>
          <AplusText variant="caption">{schedule.ownerName} · {schedule.roomName}</AplusText>
        </View>
        <StatusChip label={schedule.status} tone={statusTone(schedule.status)} />
      </View>
      <AplusText variant="caption">{schedule.schedule.daysOfWeek.join('/')} · {schedule.schedule.startTime}-{schedule.schedule.endTime} · {schedule.schedule.timezone}</AplusText>
      {schedule.conflictReason ? <AplusText variant="caption" color={theme.colors.warning}>{schedule.conflictReason}</AplusText> : null}
    </AplusCard>
  );
}

function PreviewRow({row}: {row: ClassScheduleImportRow}) {
  return (
    <View style={styles.previewRow}>
      <StatusChip label={`#${row.row}`} tone={row.status === 'valid' ? 'success' : 'danger'} />
      <View style={styles.flex}>
        <AplusText variant="caption" style={styles.bold}>{row.title || '—'}</AplusText>
        <AplusText variant="caption">{row.message}</AplusText>
      </View>
    </View>
  );
}

function ExceptionRow({exception}: {exception: ScheduleException}) {
  return (
    <View style={styles.exceptionRow}>
      <StatusChip label={exception.type} tone="warning" />
      <View style={styles.flex}>
        <AplusText variant="caption" style={styles.bold}>{exception.title}</AplusText>
        <AplusText variant="caption">{exception.date} · {exception.fromTime ?? '—'}-{exception.toTime ?? '—'}</AplusText>
      </View>
    </View>
  );
}

export function NormallyOpenScreen({lockId}: {lockId?: string}) {
  const navigation = useAplusNavigation();
  const {language} = useLanguage();
  const t = language === 'en' ? copy.en : copy.vi;
  const {locks, reloadAccessRecords} = useAppState();
  const selectedDefaultLock = useMemo(() => locks.find(lock => lock.id === lockId) ?? locks[0], [lockId, locks]);
  const [activeTab, setActiveTab] = useState<'normal' | 'class'>('normal');
  const [selectedLockId, setSelectedLockId] = useState(selectedDefaultLock?.id);
  const [title, setTitle] = useState('Ca mở tự động');
  const [days, setDays] = useState<Weekday[]>(['MO', 'TU', 'WE', 'TH', 'FR']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [outsideMode, setOutsideMode] = useState<NormallyOpenOutsideMode>('autoLock');
  const [schedules, setSchedules] = useState<NormallyOpenSchedule[]>([]);
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [csvText, setCsvText] = useState(sampleCsv);
  const [previewRows, setPreviewRows] = useState<ClassScheduleImportRow[]>([]);
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(false);

  const selectedLock = useMemo(() => locks.find(lock => lock.id === selectedLockId) ?? selectedDefaultLock, [locks, selectedDefaultLock, selectedLockId]);

  const reload = useCallback(async () => {
    const [normalData, classData, exceptionData] = await Promise.all([
      MockAccessRuleRepository.getNormallyOpenSchedules(selectedLock?.id),
      MockAccessRuleRepository.getClassSchedules(selectedLock?.id),
      MockAccessRuleRepository.getScheduleExceptions(selectedLock?.id),
    ]);
    setSchedules(normalData);
    setClassSchedules(classData);
    setExceptions(exceptionData);
  }, [selectedLock?.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggleDay = (code: Weekday) => {
    setDays(current => current.includes(code) ? current.filter(item => item !== code) : [...current, code]);
  };

  const createSchedule = async () => {
    if (!selectedLock) {
      setMessage(language === 'en' ? 'Please select a lock.' : 'Vui lòng chọn khóa.');
      return;
    }
    setLoading(true);
    try {
      await MockAccessRuleRepository.createNormallyOpenSchedule({title, lockId: selectedLock.id, daysOfWeek: days, startTime, endTime, timezone, outsideMode});
      setMessage(t.created);
      await reload();
      await reloadAccessRecords();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không tạo được lịch.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSchedule = async (schedule: NormallyOpenSchedule) => {
    await MockAccessRuleRepository.setNormallyOpenStatus(schedule.id, schedule.status === 'active' ? 'paused' : 'active');
    await reload();
  };

  const evaluateSchedule = async (scheduleId: string) => {
    const result = await MockAccessRuleRepository.evaluateNormallyOpen(scheduleId);
    setMessage(result.message);
    await reload();
    await reloadAccessRecords();
  };

  const previewImport = async () => {
    setPreviewRows(await MockAccessRuleRepository.previewClassScheduleImport(csvText));
  };

  const commitImport = async () => {
    const rows = await MockAccessRuleRepository.commitClassScheduleImport(csvText);
    setPreviewRows(rows);
    setMessage(language === 'en' ? 'Valid rows imported. Error rows were skipped.' : 'Đã import các dòng hợp lệ, dòng lỗi không được ghi.');
    await reload();
  };

  const addHoliday = async () => {
    if (!selectedLock) {
      return;
    }
    const date = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 10);
    await MockAccessRuleRepository.addScheduleException({lockId: selectedLock.id, type: 'holiday', title: language === 'en' ? 'Mock holiday' : 'Ngày nghỉ mock', date, fromTime: '00:00', toTime: '23:59', note: 'Batch 19 test'});
    await reload();
    await reloadAccessRecords();
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={t.title} subtitle={t.subtitle} canGoBack onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.heroCard}>
        <View style={styles.rowTop}>
          <AplusIcon name="calendar" size={42} color={theme.colors.primary} boxed boxSize={74} />
          <View style={styles.flex}>
            <AplusText variant="hero">{t.heroTitle}</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>{t.heroBody}</AplusText>
          </View>
        </View>
        <View style={styles.chipWrap}>
          <StatusChip label="UI-20" tone="info" />
          <StatusChip label="UI-68" tone="info" />
          <StatusChip label={timezone} tone="muted" />
        </View>
      </AplusCard>

      <View style={styles.tabRow}>
        <AplusButton title={t.tabNormal} variant={activeTab === 'normal' ? 'primary' : 'secondary'} onPress={() => setActiveTab('normal')} style={styles.flexButton} />
        <AplusButton title={t.tabClass} variant={activeTab === 'class' ? 'primary' : 'secondary'} onPress={() => setActiveTab('class')} style={styles.flexButton} />
      </View>

      <AplusCard style={styles.formCard}>
        <AplusText variant="caption">{t.lock}</AplusText>
        <View style={styles.chipWrap}>
          {locks.map(lock => (
            <Pressable key={lock.id} onPress={() => setSelectedLockId(lock.id)} style={[styles.selectChip, selectedLock?.id === lock.id ? styles.selectChipActive : null]}>
              <AplusText variant="caption" color={selectedLock?.id === lock.id ? theme.colors.text : theme.colors.textMuted}>{lock.roomName}</AplusText>
            </Pressable>
          ))}
        </View>
      </AplusCard>

      {activeTab === 'normal' ? (
        <>
          <AplusCard style={styles.formCard}>
            <AplusText variant="subtitle">{t.create}</AplusText>
            <AplusTextField label={t.name} value={title} onChangeText={setTitle} />
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
            <AplusText variant="caption">{t.outside}</AplusText>
            <View style={styles.chipWrap}>
              {([
                ['autoLock', t.autoLock],
                ['manualLock', t.manualLock],
                ['keepLastState', t.keepLast],
              ] as Array<[NormallyOpenOutsideMode, string]>).map(([mode, label]) => (
                <Pressable key={mode} onPress={() => setOutsideMode(mode)} style={[styles.selectChip, outsideMode === mode ? styles.selectChipActive : null]}>
                  <AplusText variant="caption" color={outsideMode === mode ? theme.colors.text : theme.colors.textMuted}>{label}</AplusText>
                </Pressable>
              ))}
            </View>
            {message ? <AplusText variant="caption" color={message.includes('Đã') || message.includes('created') || message.includes('trong giờ') ? theme.colors.success : theme.colors.warning}>{message}</AplusText> : null}
            <AplusButton title={t.create} leftIcon="plus" loading={loading} onPress={createSchedule} />
          </AplusCard>

          <View style={styles.sectionTitle}>
            <AplusText variant="subtitle">{t.schedules}</AplusText>
            <AplusText variant="caption">{selectedLock?.name ?? '—'}</AplusText>
          </View>
          {schedules.length ? schedules.map(schedule => (
            <ScheduleCard key={schedule.id} schedule={schedule} t={t} onToggle={toggleSchedule} onEvaluate={evaluateSchedule} />
          )) : (
            <AplusCard style={styles.formCard}><AplusText variant="caption">{t.empty}</AplusText></AplusCard>
          )}
        </>
      ) : (
        <>
          <AplusCard style={styles.formCard}>
            <AplusText variant="subtitle">{t.importCsv}</AplusText>
            <AplusText variant="caption">title,lockId,room,days,start,end</AplusText>
            <AplusTextField label="CSV" value={csvText} onChangeText={setCsvText} multiline />
            <View style={styles.actionRow}>
              <AplusButton title={t.preview} leftIcon="check" variant="secondary" onPress={previewImport} style={styles.flexButton} />
              <AplusButton title={t.commit} leftIcon="sync" onPress={commitImport} style={styles.flexButton} />
            </View>
            {previewRows.map(row => <PreviewRow key={`${row.row}-${row.title}`} row={row} />)}
          </AplusCard>

          <View style={styles.sectionTitle}>
            <AplusText variant="subtitle">{t.classSchedules}</AplusText>
            <AplusButton title={t.addHoliday} leftIcon="plus" variant="secondary" onPress={addHoliday} />
          </View>
          {classSchedules.length ? classSchedules.map(schedule => <ClassRow key={schedule.id} schedule={schedule} />) : <AplusCard style={styles.formCard}><AplusText variant="caption">{t.empty}</AplusText></AplusCard>}

          <AplusCard style={styles.formCard}>
            <AplusText variant="subtitle">{t.exceptions}</AplusText>
            {exceptions.map(exception => <ExceptionRow key={exception.id} exception={exception} />)}
          </AplusCard>
        </>
      )}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {gap: theme.spacing.md, borderColor: theme.colors.borderStrong},
  formCard: {gap: theme.spacing.md},
  itemCard: {gap: theme.spacing.md},
  rowTop: {flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center'},
  flex: {flex: 1},
  bold: {fontWeight: theme.typography.weight.bold},
  chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  selectChip: {borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.surfaceStrong},
  selectChipActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  dayChip: {minWidth: 42, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.surfaceStrong},
  tabRow: {flexDirection: 'row', gap: theme.spacing.md},
  formRow: {flexDirection: 'row', gap: theme.spacing.md},
  actionRow: {flexDirection: 'row', gap: theme.spacing.md, flexWrap: 'wrap'},
  flexButton: {flexBasis: '45%', flexGrow: 1},
  warningBox: {padding: theme.spacing.md, borderColor: 'rgba(253,176,34,0.38)', backgroundColor: 'rgba(253,176,34,0.08)'},
  sectionTitle: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md},
  previewRow: {flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center', paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  exceptionRow: {flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center', paddingVertical: theme.spacing.sm},
});

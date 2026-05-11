import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {StatusChip} from '@/components/base/StatusChip';
import {MockPasswordRepository} from '@/services/repositories/MockPasswordRepository';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {theme} from '@/theme/theme';
import type {PasswordKind, ScheduleRule} from '@/types/password';

const days = [
  {value: 1, label: 'T2'},
  {value: 2, label: 'T3'},
  {value: 3, label: 'T4'},
  {value: 4, label: 'T5'},
  {value: 5, label: 'T6'},
  {value: 6, label: 'T7'},
  {value: 0, label: 'CN'},
];

function DayPill({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.dayPill, active ? styles.dayActive : null, pressed ? styles.pressed : null]}>
      <AplusText variant="caption" color={active ? theme.colors.text : theme.colors.textMuted}>{label}</AplusText>
    </Pressable>
  );
}

export function PasswordScheduleScreen({passwordId, lockId, draftKind}: {passwordId?: string; lockId?: string; draftKind?: PasswordKind}) {
  const navigation = useAplusNavigation();
  const [schedule, setSchedule] = useState<ScheduleRule>(MockPasswordRepository.defaultSchedule);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!passwordId) {
      return;
    }
    MockPasswordRepository.getPasswordById(passwordId).then(password => {
      if (password?.scheduleRule) {
        setSchedule(password.scheduleRule);
      }
    });
  }, [passwordId]);

  const toggleDay = (day: number) => {
    setSchedule(prev => {
      const hasDay = prev.daysOfWeek.includes(day);
      const nextDays = hasDay ? prev.daysOfWeek.filter(item => item !== day) : [...prev.daysOfWeek, day].sort();
      return {...prev, daysOfWeek: nextDays};
    });
  };

  const save = async () => {
    if (schedule.daysOfWeek.length === 0) {
      setMessage('Cần chọn ít nhất một ngày trong tuần.');
      return;
    }
    if (schedule.startTime >= schedule.endTime) {
      setMessage('Giờ bắt đầu phải trước giờ kết thúc.');
      return;
    }
    setSaving(true);
    setMessage(undefined);
    if (passwordId) {
      await MockPasswordRepository.updateSchedule(passwordId, schedule);
      setSaving(false);
      navigation.navigate('PasswordDetail', {passwordId});
      return;
    }
    setSaving(false);
    setMessage('Đã cấu hình lịch mock. Khi quay lại màn thêm mật khẩu, chọn loại Mã chu kỳ để dùng lịch này.');
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Lập lịch mã chu kỳ" subtitle="UI-46" canGoBack onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="calendar" size={44} color={theme.colors.primary} boxed boxSize={78} />
        <View style={styles.heroText}>
          <AplusText variant="hero">Cycle Schedule</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>Dùng chung ScheduleRule cho mã chu kỳ, nhân viên/khách hoặc lịch ca sau này.</AplusText>
          <View style={styles.chipRow}>
            <StatusChip label={lockId ? `lockId: ${lockId}` : 'Chưa chọn khóa'} tone="info" />
            <StatusChip label={draftKind === 'recurring' ? 'Recurring draft' : 'Schedule mock'} tone="warning" />
          </View>
        </View>
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Ngày áp dụng</AplusText>
        <View style={styles.dayRow}>
          {days.map(day => <DayPill key={day.value} label={day.label} active={schedule.daysOfWeek.includes(day.value)} onPress={() => toggleDay(day.value)} />)}
        </View>
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Khung giờ</AplusText>
        <AplusTextField label="Bắt đầu" value={schedule.startTime} onChangeText={value => setSchedule(prev => ({...prev, startTime: value}))} placeholder="08:00" leftIcon="calendar" />
        <AplusTextField label="Kết thúc" value={schedule.endTime} onChangeText={value => setSchedule(prev => ({...prev, endTime: value}))} placeholder="18:00" leftIcon="calendar" />
        <AplusTextField label="Ghi chú" value={schedule.note ?? ''} onChangeText={value => setSchedule(prev => ({...prev, note: value}))} placeholder="Ví dụ: ca sáng / lịch lớp" leftIcon="password" />
      </AplusCard>

      {message ? <AplusCard style={styles.messageCard}><AplusText variant="body">{message}</AplusText></AplusCard> : null}
      <AplusButton title="Lưu lịch chu kỳ" leftIcon="check" loading={saving} onPress={save} />
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, borderColor: theme.colors.borderStrong},
  heroText: {flex: 1, gap: theme.spacing.sm},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  card: {gap: theme.spacing.md},
  dayRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  dayPill: {width: 46, height: 42, borderRadius: theme.radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong},
  dayActive: {borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.primarySoft},
  pressed: {opacity: 0.86},
  messageCard: {borderColor: theme.colors.borderStrong},
});

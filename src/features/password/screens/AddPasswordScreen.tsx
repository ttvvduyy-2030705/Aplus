import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {StatusChip} from '@/components/base/StatusChip';
import {MockCredentialRepository} from '@/services/repositories/MockCredentialRepository';
import {MockPasswordRepository, getPasswordKindLabel} from '@/services/repositories/MockPasswordRepository';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {Person} from '@/types/credential';
import type {AplusLock} from '@/types/lock';
import type {PasswordKind, ScheduleRule} from '@/types/password';

const kindOptions: Array<{kind: PasswordKind; label: string; desc: string}> = [
  {kind: 'permanent', label: 'Mã thường', desc: 'Dùng dài hạn cho chủ nhà/admin'},
  {kind: 'temporary', label: 'Mã tạm', desc: 'Có hạn bắt đầu/kết thúc'},
  {kind: 'oneTime', label: 'Mã một lần', desc: 'Dùng xong tự chuyển Used'},
  {kind: 'recurring', label: 'Mã chu kỳ', desc: 'Dùng theo lịch ngày/giờ'},
  {kind: 'staff', label: 'Mã nhân viên', desc: 'Theo ca làm hoặc phạm vi vận hành'},
  {kind: 'guest', label: 'Mã khách', desc: 'Khách thuê/khách lưu trú'},
];

function parseDate(value: string, fallback: number) {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  const parsed = new Date(trimmed).getTime();
  return Number.isNaN(parsed) ? fallback : parsed;
}

function formatInputDate(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function OptionPill({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.optionPill, active ? styles.optionActive : null, pressed ? styles.pressed : null]}>
      <AplusText variant="caption" color={active ? theme.colors.text : theme.colors.textMuted}>{label}</AplusText>
    </Pressable>
  );
}

export function AddPasswordScreen({lockId, recipientId}: {lockId?: string; recipientId?: string}) {
  const navigation = useAplusNavigation();
  const {locks, findLock, isOffline} = useAppState();
  const fixedLock = lockId ? findLock(lockId) : undefined;
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedLockId, setSelectedLockId] = useState(lockId ?? locks[0]?.id);
  const [ownerId, setOwnerId] = useState(recipientId ?? 'person-owner-admin');
  const [kind, setKind] = useState<PasswordKind>('temporary');
  const [code, setCode] = useState(MockPasswordRepository.generateCode(6));
  const [title, setTitle] = useState('');
  const [validFrom, setValidFrom] = useState(formatInputDate(Date.now()));
  const [validTo, setValidTo] = useState(formatInputDate(Date.now() + 1000 * 60 * 60 * 24 * 7));
  const [scheduleRule, setScheduleRule] = useState<ScheduleRule>(MockPasswordRepository.defaultSchedule);
  const [error, setError] = useState<string | undefined>();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    MockCredentialRepository.getPeople().then(list => {
      setPeople(list);
      if (!recipientId) {
        setOwnerId(list.find(item => item.active)?.id ?? list[0]?.id);
      }
    });
  }, [recipientId]);

  useEffect(() => {
    if (!selectedLockId && locks.length > 0) {
      setSelectedLockId(lockId ?? locks[0].id);
    }
  }, [lockId, locks, selectedLockId]);

  const selectedLock = useMemo<AplusLock | undefined>(() => fixedLock ?? locks.find(item => item.id === selectedLockId), [fixedLock, locks, selectedLockId]);
  const owner = useMemo(() => people.find(item => item.id === ownerId), [ownerId, people]);

  const createPassword = async () => {
    if (!selectedLock) {
      setError('Chưa chọn khóa để tạo mật khẩu.');
      return;
    }
    if (!owner || !owner.active) {
      setError('Người nhận không hợp lệ hoặc đã hết hiệu lực.');
      return;
    }
    const validation = MockPasswordRepository.validateCode(code, selectedLock.id);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    const start = parseDate(validFrom, Date.now());
    const end = kind === 'permanent' ? undefined : parseDate(validTo, Date.now() + 1000 * 60 * 60 * 24 * 7);
    if (end && end <= start) {
      setError('Ngày hết hạn phải sau ngày bắt đầu.');
      return;
    }
    setCreating(true);
    setError(undefined);
    try {
      const created = await MockPasswordRepository.createPassword({
        lockId: selectedLock.id,
        ownerId: owner.id,
        title: title.trim() || `${getPasswordKindLabel(kind)} · ${owner.fullName}`,
        code,
        kind,
        validFrom: start,
        validTo: end,
        scheduleRule: kind === 'recurring' ? scheduleRule : undefined,
        offline: isOffline,
      });
      navigation.navigate('PasswordDetail', {passwordId: created.id});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được mật khẩu.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Thêm mật khẩu" subtitle="UI-26 · Policy 6-10 số" canGoBack onBack={navigation.goBack} showLogo rightIcon="calendar" onRightPress={() => navigation.navigate('PasswordSchedule', {lockId: selectedLock?.id, draftKind: kind})} />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="pin" size={42} color={theme.colors.primary} boxed boxSize={76} />
        <View style={styles.heroText}>
          <AplusText variant="hero">Tạo mã mới</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>Chọn khóa, người nhận, loại mã, thời hạn và kiểm tra trùng mã trong cùng khóa.</AplusText>
          <View style={styles.chipRow}>
            <StatusChip label={isOffline ? 'Offline → PendingSync' : 'Online → Synced'} tone={isOffline ? 'warning' : 'success'} />
            <StatusChip label="Không lưu mã ngoài repository mock" tone="info" />
          </View>
        </View>
      </AplusCard>

      <AplusText variant="subtitle">Loại mật khẩu</AplusText>
      <View style={styles.kindGrid}>
        {kindOptions.map(option => (
          <Pressable key={option.kind} onPress={() => setKind(option.kind)} style={({pressed}) => [styles.kindCard, kind === option.kind ? styles.kindActive : null, pressed ? styles.pressed : null]}>
            <AplusText variant="body" style={styles.bold}>{option.label}</AplusText>
            <AplusText variant="caption">{option.desc}</AplusText>
          </Pressable>
        ))}
      </View>

      <AplusCard style={styles.formCard}>
        <AplusText variant="subtitle">Thông tin mã</AplusText>
        <AplusTextField label="Tên hiển thị" value={title} onChangeText={setTitle} placeholder={`${getPasswordKindLabel(kind)} · ${owner?.fullName ?? 'Người nhận'}`} leftIcon="password" />
        <View style={styles.codeRow}>
          <AplusTextField label="Mã PIN" value={code} onChangeText={value => setCode(value.replace(/\D/g, '').slice(0, 10))} keyboardType="number-pad" placeholder="6-10 số" leftIcon="pin" containerStyle={styles.codeInput} />
          <AplusButton title="Random" leftIcon="refresh" variant="secondary" onPress={() => setCode(MockPasswordRepository.generateCode(6))} style={styles.randomButton} />
        </View>
        <AplusTextField label="Bắt đầu" value={validFrom} onChangeText={setValidFrom} placeholder="YYYY-MM-DD" leftIcon="calendar" />
        {kind !== 'permanent' ? <AplusTextField label="Kết thúc" value={validTo} onChangeText={setValidTo} placeholder="YYYY-MM-DD" leftIcon="calendar" /> : null}
      </AplusCard>

      <AplusCard style={styles.formCard}>
        <AplusText variant="subtitle">Chọn khóa</AplusText>
        <View style={styles.chipRow}>
          {locks.map(lock => <OptionPill key={lock.id} label={lock.name} active={selectedLock?.id === lock.id} onPress={() => setSelectedLockId(lock.id)} />)}
        </View>
      </AplusCard>

      <AplusCard style={styles.formCard}>
        <AplusText variant="subtitle">Người nhận quyền</AplusText>
        <View style={styles.chipRow}>
          {people.map(person => <OptionPill key={person.id} label={person.fullName} active={ownerId === person.id} onPress={() => setOwnerId(person.id)} />)}
        </View>
        {owner && !owner.active ? <AplusText variant="caption" color={theme.colors.warning}>Người nhận này đã hết hiệu lực, không thể cấp mật khẩu mới.</AplusText> : null}
      </AplusCard>

      {kind === 'recurring' ? (
        <AplusCard style={styles.formCard}>
          <View style={styles.rowBetween}>
            <View style={styles.heroText}>
              <AplusText variant="subtitle">Lịch chu kỳ</AplusText>
              <AplusText variant="caption">{scheduleRule.daysOfWeek.length} ngày/tuần · {scheduleRule.startTime}-{scheduleRule.endTime}</AplusText>
            </View>
            <AplusButton title="Sửa lịch" leftIcon="calendar" variant="secondary" onPress={() => navigation.navigate('PasswordSchedule', {lockId: selectedLock?.id, draftKind: kind})} />
          </View>
        </AplusCard>
      ) : null}

      {error ? <AplusCard style={styles.errorCard}><AplusText variant="body" color={theme.colors.danger}>{error}</AplusText></AplusCard> : null}
      <AplusButton title="Tạo mật khẩu" leftIcon="check" loading={creating} onPress={createPassword} />
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, borderColor: theme.colors.borderStrong},
  heroText: {flex: 1, gap: theme.spacing.sm},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  kindGrid: {gap: theme.spacing.md},
  kindCard: {padding: theme.spacing.lg, borderRadius: theme.radius.xl, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: theme.spacing.xs},
  kindActive: {borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.primarySoft},
  pressed: {opacity: 0.86, transform: [{scale: 0.99}]},
  bold: {fontWeight: theme.typography.weight.bold},
  formCard: {gap: theme.spacing.md},
  codeRow: {flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.md},
  codeInput: {flex: 1},
  randomButton: {minWidth: 116},
  optionPill: {borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.surfaceStrong},
  optionActive: {borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.primarySoft},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md},
  errorCard: {borderColor: theme.colors.danger},
});

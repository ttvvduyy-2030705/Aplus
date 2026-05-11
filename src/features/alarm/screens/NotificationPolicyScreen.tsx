import React, {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {BaseScreen} from '@/components/base/BaseScreen';
import {StatusChip} from '@/components/base/StatusChip';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {AlertSeverity, AlertType, NotificationPolicy} from '@/types/alert';

const severities: AlertSeverity[] = ['Critical', 'High', 'Medium', 'Low'];
const alertTypes: AlertType[] = ['battery_low', 'door_left_open', 'tamper', 'offline', 'failed_attempts'];

function alertTypeLabel(type: AlertType) {
  switch (type) {
    case 'battery_low':
      return 'Pin yếu';
    case 'door_left_open':
      return 'Cửa mở lâu';
    case 'tamper':
      return 'Cạy phá';
    case 'offline':
      return 'Offline';
    case 'failed_attempts':
      return 'Failed attempts';
    default:
      return type;
  }
}

export function NotificationPolicyScreen() {
  const navigation = useAplusNavigation();
  const {notificationPolicy, reloadNotificationPolicy, updateNotificationPolicy} = useAppState();
  const [draft, setDraft] = useState<NotificationPolicy | undefined>();
  const [cooldownText, setCooldownText] = useState('15');
  const [dedupeText, setDedupeText] = useState('60');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    reloadNotificationPolicy();
  }, [reloadNotificationPolicy]);

  useEffect(() => {
    if (notificationPolicy) {
      setDraft(notificationPolicy);
      setCooldownText(String(notificationPolicy.cooldownMinutes));
      setDedupeText(String(notificationPolicy.dedupeWindowMinutes));
    }
  }, [notificationPolicy]);

  const toggleMutedType = (type: AlertType) => {
    if (!draft) {
      return;
    }
    const mutedTypes = draft.mutedTypes.includes(type)
      ? draft.mutedTypes.filter(item => item !== type)
      : [...draft.mutedTypes, type];
    setDraft({...draft, mutedTypes});
  };

  const save = async () => {
    if (!draft) {
      return;
    }
    const updated = await updateNotificationPolicy({
      ...draft,
      cooldownMinutes: Math.max(1, Number(cooldownText) || draft.cooldownMinutes),
      dedupeWindowMinutes: Math.max(1, Number(dedupeText) || draft.dedupeWindowMinutes),
    });
    setDraft(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (!draft) {
    return (
      <BaseScreen contentStyle={styles.container}>
        <AplusHeader title="Push policy" canGoBack onBack={navigation.goBack} showLogo />
        <AplusCard style={styles.cardGap}>
          <AplusText variant="body">Đang tải NotificationPolicy mock...</AplusText>
        </AplusCard>
      </BaseScreen>
    );
  }

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Cấu hình thông báo" subtitle="UI-60 · Cooldown/Dedupe" canGoBack onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <AplusIcon name="bell" size={44} color={draft.enabled ? theme.colors.primary : theme.colors.textMuted} boxed boxSize={76} />
          <View style={styles.flexBlock}>
            <AplusText variant="hero">Push policy</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>Dùng cooldown và dedupe để không spam notification khi cùng một khóa phát nhiều event.</AplusText>
            <View style={styles.chipRow}>
              <StatusChip label={draft.enabled ? 'Enabled' : 'Disabled'} tone={draft.enabled ? 'success' : 'muted'} />
              <StatusChip label={`Threshold ${draft.severityThreshold}`} tone="info" />
              <StatusChip label={`${draft.cooldownMinutes} phút cooldown`} tone="warning" />
            </View>
          </View>
        </View>
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">Quy tắc chính</AplusText>
        <View style={styles.actionRow}>
          <AplusButton title={draft.enabled ? 'Tắt push' : 'Bật push'} leftIcon="bell" variant={draft.enabled ? 'secondary' : 'primary'} onPress={() => setDraft({...draft, enabled: !draft.enabled})} style={styles.flexButton} />
          <AplusButton title={draft.pushCriticalOnly ? 'Chỉ Critical' : 'Theo threshold'} leftIcon="alert" variant="ghost" onPress={() => setDraft({...draft, pushCriticalOnly: !draft.pushCriticalOnly})} style={styles.flexButton} />
        </View>

        <AplusText variant="label">Severity threshold</AplusText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {severities.map(item => <AplusButton key={item} title={item} variant={draft.severityThreshold === item ? 'primary' : 'ghost'} onPress={() => setDraft({...draft, severityThreshold: item})} style={styles.pill} />)}
        </ScrollView>

        <View style={styles.actionRow}>
          <AplusTextField label="Cooldown phút" keyboardType="number-pad" leftIcon="bell" value={cooldownText} onChangeText={setCooldownText} containerStyle={styles.flexButton} />
          <AplusTextField label="Dedupe phút" keyboardType="number-pad" leftIcon="sync" value={dedupeText} onChangeText={setDedupeText} containerStyle={styles.flexButton} />
        </View>
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">Mute theo loại cảnh báo</AplusText>
        <View style={styles.chipRow}>
          {alertTypes.map(type => (
            <AplusButton
              key={type}
              title={alertTypeLabel(type)}
              variant={draft.mutedTypes.includes(type) ? 'danger' : 'ghost'}
              onPress={() => toggleMutedType(type)}
              style={styles.pill}
            />
          ))}
        </View>
        <AplusText variant="caption">Nút đỏ nghĩa là loại cảnh báo đang bị mute.</AplusText>
      </AplusCard>

      {saved ? <AplusText variant="caption" color={theme.colors.success}>Đã lưu NotificationPolicy mock.</AplusText> : null}
      <AplusButton title="Lưu policy" leftIcon="check" onPress={save} />
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {gap: theme.spacing.md, borderColor: theme.colors.borderStrong},
  heroRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg},
  flexBlock: {flex: 1, gap: theme.spacing.xs},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  cardGap: {gap: theme.spacing.md},
  actionRow: {flexDirection: 'row', gap: theme.spacing.md},
  flexButton: {flex: 1},
  filterRow: {gap: theme.spacing.sm, paddingRight: theme.spacing.xl},
  pill: {minHeight: 38, paddingHorizontal: theme.spacing.md},
});

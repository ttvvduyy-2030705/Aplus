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
import type {Alert, TicketPriority} from '@/types/alert';

const priorities: TicketPriority[] = ['Critical', 'High', 'Medium', 'Low'];
const dueOptions = [1, 4, 8, 24];

function priorityTone(priority: TicketPriority) {
  if (priority === 'Critical') {
    return 'danger' as const;
  }
  if (priority === 'High' || priority === 'Medium') {
    return 'warning' as const;
  }
  return 'info' as const;
}

function defaultPriority(severity: Alert['severity']): TicketPriority {
  return severity === 'Critical' ? 'Critical' : severity === 'High' ? 'High' : severity === 'Medium' ? 'Medium' : 'Low';
}

export function TicketCreateScreen({alertId}: {alertId: string}) {
  const navigation = useAplusNavigation();
  const {getAlertDetail, createIncidentTicket} = useAppState();
  const [alert, setAlert] = useState<Alert | undefined>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('Kỹ thuật Aplus');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [dueHours, setDueHours] = useState(4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const loadAlert = async () => {
      const detail = await getAlertDetail(alertId);
      if (detail) {
        setAlert(detail);
        setTitle(`Xử lý: ${detail.title}`);
        setDescription(detail.message);
        setPriority(defaultPriority(detail.severity));
        setDueHours(detail.severity === 'Critical' ? 1 : detail.severity === 'High' ? 4 : 8);
      }
    };
    loadAlert();
  }, [alertId, getAlertDetail]);

  const submit = async () => {
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề ticket.');
      return;
    }
    if (!assignee.trim()) {
      setError('Vui lòng nhập người phụ trách.');
      return;
    }
    setSaving(true);
    setError(undefined);
    const ticket = await createIncidentTicket({
      alertId,
      title,
      description,
      assignee,
      priority,
      dueHours,
      attachmentNames: ['incident-photo-mock.jpg'],
    });
    setSaving(false);
    if (ticket) {
      navigation.navigate('AlertDetail', {alertId});
      return;
    }
    setError('Không tạo được ticket. Kiểm tra lại alertId.');
  };

  if (!alert) {
    return (
      <BaseScreen contentStyle={styles.container}>
        <AplusHeader title="Tạo ticket" canGoBack onBack={navigation.goBack} showLogo />
        <AplusCard style={styles.cardGap}>
          <AplusText variant="body">Không tìm thấy alertId: {alertId}</AplusText>
        </AplusCard>
      </BaseScreen>
    );
  }

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Tạo ticket xử lý" subtitle="UI-41 · Assignee, SLA, priority" canGoBack onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <AplusIcon name="command" size={44} color={theme.colors.primary} boxed boxSize={76} />
          <View style={styles.flexBlock}>
            <AplusText variant="hero">Ticket sự cố</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>{alert.lockName} · {alert.roomName}</AplusText>
            <View style={styles.chipRow}>
              <StatusChip label={alert.severity} tone={priorityTone(defaultPriority(alert.severity))} />
              <StatusChip label={alert.type} tone="info" />
              <StatusChip label={alert.dedupeKey} tone="muted" />
            </View>
          </View>
        </View>
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <AplusTextField label="Tiêu đề" leftIcon="alert" value={title} onChangeText={setTitle} placeholder="Ví dụ: Kiểm tra gateway tầng 8" />
        <AplusTextField label="Mô tả" leftIcon="history" value={description} onChangeText={setDescription} multiline placeholder="Mô tả lỗi, log, ảnh đính kèm mock..." />
        <AplusTextField label="Người phụ trách" leftIcon="user" value={assignee} onChangeText={setAssignee} placeholder="Kỹ thuật, bảo vệ, quản lý tầng..." />

        <AplusText variant="label">Priority</AplusText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {priorities.map(item => <AplusButton key={item} title={item} variant={priority === item ? 'primary' : 'ghost'} onPress={() => setPriority(item)} style={styles.pill} />)}
        </ScrollView>

        <AplusText variant="label">SLA / hạn xử lý</AplusText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {dueOptions.map(item => <AplusButton key={item} title={`${item} giờ`} variant={dueHours === item ? 'primary' : 'ghost'} onPress={() => setDueHours(item)} style={styles.pill} />)}
        </ScrollView>

        {error ? <AplusText variant="caption" color={theme.colors.danger}>{error}</AplusText> : null}
        <AplusButton title="Tạo ticket" leftIcon="plus" onPress={submit} loading={saving} />
      </AplusCard>
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
  filterRow: {gap: theme.spacing.sm, paddingRight: theme.spacing.xl},
  pill: {minHeight: 38, paddingHorizontal: theme.spacing.md},
});

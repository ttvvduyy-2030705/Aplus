import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {ConfirmDialog} from '@/components/base/ConfirmDialog';
import {StatusChip} from '@/components/base/StatusChip';
import {MockPasswordRepository, getPasswordKindLabel, getPasswordStatusLabel} from '@/services/repositories/MockPasswordRepository';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {PasswordCredential, PasswordStatus} from '@/types/password';

function formatDate(timestamp?: number) {
  if (!timestamp) {
    return 'Không giới hạn';
  }
  return new Date(timestamp).toLocaleString('vi-VN');
}

function statusTone(status: PasswordStatus): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (status === 'active') {
    return 'success';
  }
  if (status === 'pendingSync' || status === 'pendingRevoke' || status === 'paused') {
    return 'warning';
  }
  if (status === 'revoked' || status === 'expired') {
    return 'danger';
  }
  if (status === 'used') {
    return 'info';
  }
  return 'muted';
}

function InfoRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.infoRow}>
      <AplusText variant="caption" color={theme.colors.textMuted}>{label}</AplusText>
      <AplusText variant="body" style={styles.infoValue}>{value}</AplusText>
    </View>
  );
}

export function PasswordDetailScreen({passwordId}: {passwordId: string}) {
  const navigation = useAplusNavigation();
  const {isOffline, reloadAccessRecords} = useAppState();
  const [password, setPassword] = useState<PasswordCredential | undefined>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const next = await MockPasswordRepository.getPasswordById(passwordId);
    setPassword(next);
    setLoading(false);
  }, [passwordId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const applyAction = async (action: 'pause' | 'resume' | 'extend' | 'revoke' | 'use') => {
    setMessage(undefined);
    setLoading(true);
    try {
      if (action === 'pause') {
        const next = await MockPasswordRepository.pausePassword(passwordId);
        setPassword(next);
        setMessage('Đã tạm dừng mật khẩu mock.');
      }
      if (action === 'resume') {
        const next = await MockPasswordRepository.resumePassword(passwordId);
        setPassword(next);
        setMessage('Đã bật lại mật khẩu mock.');
      }
      if (action === 'extend') {
        const next = await MockPasswordRepository.extendPassword(passwordId, 7);
        setPassword(next);
        setMessage('Đã gia hạn thêm 7 ngày.');
      }
      if (action === 'revoke') {
        const next = await MockPasswordRepository.revokePassword(passwordId, isOffline);
        setPassword(next);
        setConfirmRevoke(false);
        setMessage(isOffline ? 'Offline: mật khẩu chuyển PendingRevoke, chờ đồng bộ.' : 'Đã thu hồi mật khẩu.');
      }
      if (action === 'use') {
        const result = await MockPasswordRepository.mockUsePassword(passwordId);
        setPassword(result.password);
        await reloadAccessRecords();
        setMessage(result.record.result === 'success' ? 'Mock dùng mã thành công, AccessRecord đã được tạo.' : 'Mock dùng mã thất bại, AccessRecord failed đã được tạo.');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Thao tác thất bại.');
    } finally {
      setLoading(false);
    }
  };

  if (!password) {
    return (
      <BaseScreen contentStyle={styles.container}>
        <AplusHeader title="Chi tiết mật khẩu" canGoBack onBack={navigation.goBack} showLogo />
        <AplusCard style={styles.emptyCard}>
          <AplusText variant="body">{loading ? 'Đang tải mật khẩu...' : 'Không tìm thấy mật khẩu.'}</AplusText>
          <AplusButton title="Quay lại" onPress={navigation.goBack} />
        </AplusCard>
      </BaseScreen>
    );
  }

  const canUse = password.status === 'active' || password.status === 'pendingSync';
  const canRevoke = password.status !== 'revoked' && password.status !== 'pendingRevoke' && password.status !== 'used';

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Chi tiết/thu hồi mật khẩu" subtitle="UI-45" canGoBack onBack={navigation.goBack} showLogo rightIcon="history" onRightPress={() => navigation.navigate('Activity')} />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="password" size={48} color={theme.colors.primary} boxed boxSize={82} />
        <View style={styles.heroText}>
          <AplusText variant="hero">{password.title}</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>{password.lockName} · {password.roomName}</AplusText>
          <View style={styles.chipRow}>
            <StatusChip label={getPasswordStatusLabel(password.status)} tone={statusTone(password.status)} />
            <StatusChip label={getPasswordKindLabel(password.kind)} tone="info" />
            <StatusChip label={password.syncState === 'synced' ? 'Đã đồng bộ' : 'Chờ đồng bộ'} tone={password.syncState === 'synced' ? 'success' : 'warning'} />
          </View>
        </View>
      </AplusCard>

      <AplusCard style={styles.codeCard}>
        <AplusText variant="caption" color={theme.colors.textMuted}>Mã PIN mock</AplusText>
        <AplusText variant="hero" style={styles.codeText}>{password.code}</AplusText>
        <AplusText variant="caption">Policy: 6-10 chữ số, kiểm tra trùng trong cùng khóa khi tạo.</AplusText>
      </AplusCard>

      <AplusCard style={styles.infoCard}>
        <AplusText variant="subtitle">Thông tin vận hành</AplusText>
        <InfoRow label="Người nhận" value={password.ownerName} />
        <InfoRow label="Hiệu lực từ" value={formatDate(password.validFrom)} />
        <InfoRow label="Hiệu lực đến" value={formatDate(password.validTo)} />
        <InfoRow label="Số lần dùng" value={`${password.useCount}${password.maxUseCount ? `/${password.maxUseCount}` : ''}`} />
        <InfoRow label="Lần dùng cuối" value={formatDate(password.lastUsedAt)} />
        <InfoRow label="Tạo lúc" value={formatDate(password.createdAt)} />
        {password.scheduleRule ? <InfoRow label="Lịch chu kỳ" value={`${password.scheduleRule.daysOfWeek.length} ngày/tuần · ${password.scheduleRule.startTime}-${password.scheduleRule.endTime}`} /> : null}
        {password.revokedAt ? <InfoRow label="Thu hồi" value={`${formatDate(password.revokedAt)} · ${password.revokedBy ?? '—'}`} /> : null}
      </AplusCard>

      {message ? <AplusCard style={styles.messageCard}><AplusText variant="body">{message}</AplusText></AplusCard> : null}

      <View style={styles.actionGrid}>
        <AplusButton title="Mock dùng mã" leftIcon="unlock" disabled={!canUse} loading={loading} onPress={() => applyAction('use')} style={styles.actionButton} />
        <AplusButton title="Gia hạn +7 ngày" leftIcon="calendar" variant="secondary" disabled={!canRevoke} loading={loading} onPress={() => applyAction('extend')} style={styles.actionButton} />
      </View>
      <View style={styles.actionGrid}>
        <AplusButton title={password.status === 'paused' ? 'Bật lại' : 'Tạm dừng'} leftIcon={password.status === 'paused' ? 'check' : 'close'} variant="ghost" disabled={!canRevoke} loading={loading} onPress={() => applyAction(password.status === 'paused' ? 'resume' : 'pause')} style={styles.actionButton} />
        <AplusButton title="Thu hồi" leftIcon="revoked" variant="danger" disabled={!canRevoke} loading={loading} onPress={() => setConfirmRevoke(true)} style={styles.actionButton} />
      </View>
      <AplusButton title="Sửa lịch chu kỳ" leftIcon="calendar" variant="secondary" onPress={() => navigation.navigate('PasswordSchedule', {passwordId: password.id, lockId: password.lockId, draftKind: 'recurring'})} />

      <ConfirmDialog visible={confirmRevoke} title="Thu hồi mật khẩu?" message={isOffline ? 'Bạn đang offline. Mật khẩu sẽ chuyển PendingRevoke để đồng bộ sau.' : 'Mật khẩu sẽ chuyển Revoked, không xoá cứng để giữ audit.'} confirmText="Thu hồi" destructive onCancel={() => setConfirmRevoke(false)} onConfirm={() => applyAction('revoke')} />
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, borderColor: theme.colors.borderStrong},
  heroText: {flex: 1, gap: theme.spacing.sm},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  codeCard: {alignItems: 'center', gap: theme.spacing.sm, borderColor: theme.colors.borderStrong},
  codeText: {letterSpacing: 10},
  infoCard: {gap: theme.spacing.md},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingVertical: theme.spacing.xs},
  infoValue: {flex: 1, textAlign: 'right'},
  actionGrid: {flexDirection: 'row', gap: theme.spacing.md},
  actionButton: {flex: 1},
  emptyCard: {gap: theme.spacing.md},
  messageCard: {borderColor: theme.colors.borderStrong},
});

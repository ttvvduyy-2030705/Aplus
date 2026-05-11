import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {StatusChip} from '@/components/base/StatusChip';
import {LoadingView} from '@/components/feedback/LoadingView';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {RoomDetail} from '@/types/room';

function statusTone(status: RoomDetail['status']) {
  if (status === 'available') {
    return 'success' as const;
  }
  if (status === 'occupied') {
    return 'info' as const;
  }
  return status === 'maintenance' ? 'warning' as const : 'danger' as const;
}

function statusLabel(status: RoomDetail['status']) {
  const map: Record<RoomDetail['status'], string> = {
    available: 'Trống',
    occupied: 'Đang dùng',
    maintenance: 'Bảo trì',
    blocked: 'Bị khóa',
  };
  return map[status];
}

function InfoRow({label, value}: {label: string; value: string | number}) {
  return (
    <View style={styles.infoRow}>
      <AplusText variant="caption" color={theme.colors.textMuted}>{label}</AplusText>
      <AplusText variant="body" style={styles.infoValue}>{String(value)}</AplusText>
    </View>
  );
}

export function RoomDetailScreen({roomId}: {roomId: string}) {
  const navigation = useAplusNavigation();
  const {locks, getRoomDetail, assignLockToRoom, deleteRoom} = useAppState();
  const [room, setRoom] = useState<RoomDetail | undefined>();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | undefined>();
  const [selectedLockId, setSelectedLockId] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    setRoom(await getRoomDetail(roomId));
    setLoading(false);
  }, [getRoomDetail, roomId]);

  useEffect(() => {
    load();
  }, [load]);

  const availableLocks = useMemo(() => locks.filter(lock => !room?.lockIds.includes(lock.id)), [locks, room?.lockIds]);

  const handleAssign = async () => {
    if (!selectedLockId) {
      setMessage('Chọn một khóa để gán vào phòng.');
      return;
    }
    const detail = await assignLockToRoom(roomId, selectedLockId);
    if (detail) {
      setRoom(detail);
      setMessage('Đã gán khóa và cập nhật Lock Detail/Home.');
      setSelectedLockId(undefined);
    }
  };

  const handleDelete = async () => {
    const result = await deleteRoom(roomId);
    setMessage(result.message);
    if (result.success) {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <BaseScreen>
        <AplusHeader title="Chi tiết phòng" canGoBack onBack={navigation.goBack} showLogo />
        <LoadingView />
      </BaseScreen>
    );
  }

  if (!room) {
    return (
      <BaseScreen contentStyle={styles.container}>
        <AplusHeader title="Không tìm thấy phòng" canGoBack onBack={navigation.goBack} showLogo />
        <AplusCard style={styles.card}>
          <AplusText variant="body">Không tìm thấy roomId: {roomId}</AplusText>
          <AplusButton title="Quay lại" onPress={navigation.goBack} />
        </AplusCard>
      </BaseScreen>
    );
  }

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader
        title={room.roomName}
        subtitle="UI-51 · Chi tiết phòng và khóa gán vào"
        canGoBack
        onBack={navigation.goBack}
        showLogo
        rightIcon="settings"
        rightLabel="Sửa"
        onRightPress={() => navigation.navigate('RoomEdit', {roomId: room.id})}
      />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="door" size={42} color={theme.colors.primary} boxed boxSize={76} />
        <View style={styles.heroText}>
          <AplusText variant="hero">{room.roomNo}</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>{room.buildingName} · {room.floorName}</AplusText>
          <View style={styles.chipRow}>
            <StatusChip label={statusLabel(room.status)} tone={statusTone(room.status)} />
            <StatusChip label={`${room.assignedLocks.length} khóa`} tone={room.assignedLocks.length ? 'success' : 'muted'} />
            <StatusChip label={`${room.activeCredentialCount} quyền active`} tone={room.activeCredentialCount ? 'info' : 'muted'} />
          </View>
        </View>
      </AplusCard>

      {message ? <AplusCard style={styles.messageCard}><AplusText variant="caption">{message}</AplusText></AplusCard> : null}

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Thông tin phòng</AplusText>
        <InfoRow label="Room ID" value={room.id} />
        <InfoRow label="Booking" value={room.bookingActive ? 'Đang có booking/khách active' : 'Không có booking active'} />
        <InfoRow label="Thành viên có quyền" value={room.peopleWithAccess.length} />
        <InfoRow label="Ghi chú" value={room.notes || 'Không có'} />
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Khóa đang gán</AplusText>
        {room.assignedLocks.length === 0 ? <AplusText variant="body" color={theme.colors.textMuted}>Phòng chưa có khóa gán vào.</AplusText> : null}
        {room.assignedLocks.map(lock => (
          <Pressable key={lock.id} onPress={() => navigation.navigate('LockDetail', {lockId: lock.id})} style={styles.lockRow}>
            <AplusIcon name="lock" size={22} color={theme.colors.primary} />
            <View style={styles.flex}>
              <AplusText variant="body" style={styles.bold}>{lock.name}</AplusText>
              <AplusText variant="caption">{lock.serial} · {lock.connectionState} · Pin {lock.batteryPercent}%</AplusText>
            </View>
            <AplusIcon name="chevron" size={16} color={theme.colors.textMuted} />
          </Pressable>
        ))}
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Người có quyền</AplusText>
        {room.peopleWithAccess.map(person => (
          <View key={person.personId} style={styles.personRow}>
            <View style={styles.avatar}><AplusText variant="caption">{person.fullName.slice(0, 2).toUpperCase()}</AplusText></View>
            <View style={styles.flex}>
              <AplusText variant="body" style={styles.bold}>{person.fullName}</AplusText>
              <AplusText variant="caption">{person.role} · {person.credentialCount} credential</AplusText>
            </View>
          </View>
        ))}
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Gán khóa vào phòng</AplusText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {availableLocks.map(lock => (
            <Pressable key={lock.id} onPress={() => setSelectedLockId(lock.id)} style={[styles.filterChip, selectedLockId === lock.id ? styles.filterActive : null]}>
              <AplusText variant="caption">{lock.name}</AplusText>
            </Pressable>
          ))}
        </ScrollView>
        <AplusButton title="Gán khóa đã chọn" leftIcon="lock" onPress={handleAssign} disabled={!selectedLockId} />
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Xóa phòng</AplusText>
        <AplusText variant="body" color={room.canDelete ? theme.colors.textMuted : theme.colors.warning}>{room.canDelete ? 'Phòng không còn khóa/credential/booking active nên có thể xóa.' : room.deleteBlockReason}</AplusText>
        <AplusButton title="Xóa phòng" variant="danger" leftIcon="revoked" onPress={handleDelete} disabled={!room.canDelete} />
      </AplusCard>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, borderColor: theme.colors.borderStrong},
  heroText: {flex: 1, gap: theme.spacing.sm},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  card: {gap: theme.spacing.md},
  messageCard: {borderColor: theme.colors.primary},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md},
  infoValue: {flex: 1, textAlign: 'right', fontWeight: theme.typography.weight.semibold},
  lockRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  personRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md},
  avatar: {width: 42, height: 42, borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primarySoft, borderWidth: 1, borderColor: theme.colors.borderStrong},
  flex: {flex: 1},
  bold: {fontWeight: theme.typography.weight.bold},
  filterRow: {gap: theme.spacing.sm, paddingRight: theme.spacing.xl},
  filterChip: {paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface},
  filterActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
});

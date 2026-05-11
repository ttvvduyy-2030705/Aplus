import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {StatusChip} from '@/components/base/StatusChip';
import {EmptyState} from '@/components/feedback/EmptyState';
import {ErrorState} from '@/components/feedback/ErrorState';
import {LoadingView} from '@/components/feedback/LoadingView';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {Room, RoomStatus} from '@/types/room';

const statusFilters: Array<{label: string; value: RoomStatus | 'all'}> = [
  {label: 'Tất cả', value: 'all'},
  {label: 'Trống', value: 'available'},
  {label: 'Đang dùng', value: 'occupied'},
  {label: 'Bảo trì', value: 'maintenance'},
  {label: 'Khóa', value: 'blocked'},
];

function statusLabel(status: RoomStatus) {
  switch (status) {
    case 'available':
      return 'Trống';
    case 'occupied':
      return 'Đang dùng';
    case 'maintenance':
      return 'Bảo trì';
    case 'blocked':
      return 'Bị khóa';
    default:
      return status;
  }
}

function statusTone(status: RoomStatus) {
  if (status === 'available') {
    return 'success' as const;
  }
  if (status === 'occupied') {
    return 'info' as const;
  }
  return status === 'maintenance' ? 'warning' as const : 'danger' as const;
}

function Metric({label, value}: {label: string; value: number}) {
  return (
    <AplusCard style={styles.metricCard}>
      <AplusText variant="hero">{value}</AplusText>
      <AplusText variant="caption">{label}</AplusText>
    </AplusCard>
  );
}

function RoomCard({room, onPress}: {room: Room; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.roomCard, pressed ? styles.pressed : null]}>
      <View style={styles.roomIcon}>
        <AplusIcon name={room.lockIds.length ? 'lock' : 'door'} size={26} color={room.lockIds.length ? theme.colors.primary : theme.colors.textMuted} />
      </View>
      <View style={styles.roomInfo}>
        <View style={styles.roomTitleRow}>
          <AplusText variant="subtitle" style={styles.bold}>{room.roomName}</AplusText>
          <StatusChip label={statusLabel(room.status)} tone={statusTone(room.status)} />
        </View>
        <AplusText variant="caption">{room.buildingName} · {room.floorName} · Room No {room.roomNo}</AplusText>
        <View style={styles.chipRow}>
          <StatusChip label={`${room.lockIds.length} khóa`} tone={room.lockIds.length ? 'success' : 'muted'} />
          <StatusChip label={`${room.activeCredentialCount} quyền active`} tone={room.activeCredentialCount ? 'info' : 'muted'} />
          {room.bookingActive ? <StatusChip label="Booking active" tone="warning" /> : null}
        </View>
      </View>
      <AplusIcon name="chevron" size={18} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export function RoomManagementScreen() {
  const navigation = useAplusNavigation();
  const {roomBuildings, roomFloors, rooms, roomSummary, roomsLoading, roomsError, reloadRooms} = useAppState();
  const [buildingId, setBuildingId] = useState<string | undefined>();
  const [floorId, setFloorId] = useState<string | undefined>();
  const [status, setStatus] = useState<RoomStatus | 'all'>('all');
  const [query, setQuery] = useState('');

  const load = useCallback(() => reloadRooms({buildingId, floorId, status, query}), [buildingId, floorId, query, reloadRooms, status]);

  useEffect(() => {
    load();
  }, [load]);

  const availableFloors = useMemo(() => roomFloors.filter(floor => !buildingId || floor.buildingId === buildingId), [buildingId, roomFloors]);

  const selectBuilding = (nextBuildingId?: string) => {
    setBuildingId(nextBuildingId);
    setFloorId(undefined);
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader
        title="Quản lý phòng"
        subtitle="UI-11 · Building/Floor/Room"
        canGoBack={navigation.canGoBack}
        onBack={navigation.goBack}
        showLogo
        rightIcon="plus"
        rightLabel="Phòng"
        onRightPress={() => navigation.navigate('RoomEdit', undefined)}
      />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="hotel" size={44} color={theme.colors.primary} boxed boxSize={76} />
        <View style={styles.heroText}>
          <AplusText variant="hero">Room Management</AplusText>
          <AplusText variant="body" color={theme.colors.textMuted}>CRUD nhà/cơ sở, tầng/khu vực/phòng, gán khóa và kiểm soát xóa phòng có khóa/credential/booking active.</AplusText>
          <View style={styles.chipRow}>
            <StatusChip label="UI-11" tone="info" />
            <StatusChip label={`${roomSummary.assignedRooms} phòng đã gán khóa`} tone="success" />
          </View>
        </View>
      </AplusCard>

      <View style={styles.metricRow}>
        <Metric label="Cơ sở" value={roomSummary.buildings} />
        <Metric label="Tầng" value={roomSummary.floors} />
      </View>
      <View style={styles.metricRow}>
        <Metric label="Phòng" value={roomSummary.rooms} />
        <Metric label="Chưa gán" value={roomSummary.unassignedRooms} />
      </View>

      <View style={styles.actionRow}>
        <AplusButton title="Tạo phòng" leftIcon="plus" onPress={() => navigation.navigate('RoomEdit', undefined)} style={styles.flexButton} />
        <AplusButton title="Import Excel/CSV" leftIcon="sync" variant="secondary" onPress={() => navigation.navigate('RoomImport')} style={styles.flexButton} />
      </View>

      <AplusTextField label="Tìm phòng" placeholder="Room No, tên phòng, toà, tầng..." value={query} onChangeText={setQuery} leftIcon="door" />

      <AplusText variant="label">Cơ sở</AplusText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <Pressable onPress={() => selectBuilding(undefined)} style={[styles.filterChip, !buildingId ? styles.filterActive : null]}>
          <AplusText variant="caption">Tất cả</AplusText>
        </Pressable>
        {roomBuildings.map(building => (
          <Pressable key={building.id} onPress={() => selectBuilding(building.id)} style={[styles.filterChip, buildingId === building.id ? styles.filterActive : null]}>
            <AplusText variant="caption">{building.name}</AplusText>
          </Pressable>
        ))}
      </ScrollView>

      <AplusText variant="label">Tầng</AplusText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <Pressable onPress={() => setFloorId(undefined)} style={[styles.filterChip, !floorId ? styles.filterActive : null]}>
          <AplusText variant="caption">Tất cả</AplusText>
        </Pressable>
        {availableFloors.map(floor => (
          <Pressable key={floor.id} onPress={() => setFloorId(floor.id)} style={[styles.filterChip, floorId === floor.id ? styles.filterActive : null]}>
            <AplusText variant="caption">{floor.name}</AplusText>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {statusFilters.map(item => (
          <Pressable key={item.value} onPress={() => setStatus(item.value)} style={[styles.filterChip, status === item.value ? styles.filterActive : null]}>
            <AplusText variant="caption">{item.label}</AplusText>
          </Pressable>
        ))}
      </ScrollView>

      {roomsLoading ? <LoadingView /> : null}
      {roomsError ? <ErrorState message={roomsError} onRetry={load} /> : null}
      {!roomsLoading && rooms.length === 0 ? <EmptyState title="Chưa có phòng" message="Tạo phòng mới hoặc import CSV mock để kiểm tra Batch 11." actionLabel="Tạo phòng" onAction={() => navigation.navigate('RoomEdit', undefined)} /> : null}
      <View style={styles.list}>
        {rooms.map(room => <RoomCard key={room.id} room={room} onPress={() => navigation.navigate('RoomDetail', {roomId: room.id})} />)}
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, borderColor: theme.colors.borderStrong},
  heroText: {flex: 1, gap: theme.spacing.sm},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  metricRow: {flexDirection: 'row', gap: theme.spacing.md},
  metricCard: {flex: 1, gap: theme.spacing.xs},
  actionRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md},
  flexButton: {flexBasis: '42%', flexGrow: 1},
  filterRow: {gap: theme.spacing.sm, paddingRight: theme.spacing.xl},
  filterChip: {paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface},
  filterActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  list: {gap: theme.spacing.md},
  roomCard: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.lg, borderRadius: theme.radius.xl, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface},
  pressed: {opacity: 0.86, transform: [{scale: 0.99}]},
  roomIcon: {width: 50, height: 50, borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceStrong, borderWidth: 1, borderColor: theme.colors.borderStrong},
  roomInfo: {flex: 1, gap: theme.spacing.xs},
  roomTitleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm},
  bold: {fontWeight: theme.typography.weight.bold},
});

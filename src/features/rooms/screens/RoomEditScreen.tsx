import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {StatusChip} from '@/components/base/StatusChip';
import {LoadingView} from '@/components/feedback/LoadingView';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {RoomStatus} from '@/types/room';

const statusOptions: Array<{label: string; value: RoomStatus}> = [
  {label: 'Trống', value: 'available'},
  {label: 'Đang dùng', value: 'occupied'},
  {label: 'Bảo trì', value: 'maintenance'},
  {label: 'Bị khóa', value: 'blocked'},
];

export function RoomEditScreen({roomId}: {roomId?: string}) {
  const navigation = useAplusNavigation();
  const {roomBuildings, roomFloors, getRoomDetail, saveRoom, reloadRooms, roomsError} = useAppState();
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [roomName, setRoomName] = useState('');
  const [status, setStatus] = useState<RoomStatus>('available');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(Boolean(roomId));
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>();

  useEffect(() => {
    reloadRooms();
  }, [reloadRooms]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!roomId) {
        setLoading(false);
        return;
      }
      const room = await getRoomDetail(roomId);
      if (!mounted) {
        return;
      }
      if (room) {
        setBuildingId(room.buildingId);
        setFloorId(room.floorId);
        setRoomNo(room.roomNo);
        setRoomName(room.roomName);
        setStatus(room.status);
        setNotes(room.notes ?? '');
      }
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [getRoomDetail, roomId]);

  useEffect(() => {
    if (!buildingId && roomBuildings[0]) {
      setBuildingId(roomBuildings[0].id);
    }
  }, [buildingId, roomBuildings]);

  const availableFloors = useMemo(() => roomFloors.filter(floor => floor.buildingId === buildingId), [buildingId, roomFloors]);

  useEffect(() => {
    if (!floorId && availableFloors[0]) {
      setFloorId(availableFloors[0].id);
    }
    if (floorId && !availableFloors.some(floor => floor.id === floorId)) {
      setFloorId(availableFloors[0]?.id ?? '');
    }
  }, [availableFloors, floorId]);

  const handleSave = async () => {
    setLocalError(undefined);
    if (!buildingId || !floorId || !roomNo.trim() || !roomName.trim()) {
      setLocalError('Vui lòng nhập đủ cơ sở, tầng, roomNo và tên phòng.');
      return;
    }
    setSaving(true);
    const result = await saveRoom({roomId, buildingId, floorId, roomNo, roomName, status, notes});
    setSaving(false);
    if (result) {
      navigation.navigate('RoomDetail', {roomId: result.id});
      return;
    }
    setLocalError(roomsError ?? 'Không lưu được phòng. Kiểm tra roomNo có bị trùng trong cùng tầng không.');
  };

  if (loading) {
    return (
      <BaseScreen>
        <AplusHeader title={roomId ? 'Sửa phòng' : 'Tạo phòng'} canGoBack onBack={navigation.goBack} showLogo />
        <LoadingView />
      </BaseScreen>
    );
  }

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={roomId ? 'Sửa phòng' : 'Tạo phòng'} subtitle="UI-52 · Tạo/sửa phòng chi tiết" canGoBack onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Cơ sở / Building</AplusText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {roomBuildings.map(building => (
            <Pressable key={building.id} onPress={() => setBuildingId(building.id)} style={[styles.filterChip, buildingId === building.id ? styles.filterActive : null]}>
              <AplusText variant="caption">{building.name}</AplusText>
            </Pressable>
          ))}
        </ScrollView>
        <AplusText variant="subtitle">Tầng / Khu vực</AplusText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {availableFloors.map(floor => (
            <Pressable key={floor.id} onPress={() => setFloorId(floor.id)} style={[styles.filterChip, floorId === floor.id ? styles.filterActive : null]}>
              <AplusText variant="caption">{floor.name}</AplusText>
            </Pressable>
          ))}
        </ScrollView>
      </AplusCard>

      <AplusTextField label="Room No" placeholder="VD: 520, 701, SR-08" value={roomNo} onChangeText={setRoomNo} leftIcon="door" autoCapitalize="characters" />
      <AplusTextField label="Tên phòng" placeholder="VD: Căn hộ 520" value={roomName} onChangeText={setRoomName} leftIcon="home" />
      <AplusTextField label="Ghi chú" placeholder="Thông tin vận hành, chính sách phòng..." value={notes} onChangeText={setNotes} leftIcon="settings" multiline />

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Trạng thái</AplusText>
        <View style={styles.statusGrid}>
          {statusOptions.map(option => (
            <Pressable key={option.value} onPress={() => setStatus(option.value)} style={[styles.statusOption, status === option.value ? styles.filterActive : null]}>
              <StatusChip label={option.label} tone={option.value === 'available' ? 'success' : option.value === 'occupied' ? 'info' : option.value === 'maintenance' ? 'warning' : 'danger'} />
            </Pressable>
          ))}
        </View>
      </AplusCard>

      {localError ? <AplusText variant="caption" color={theme.colors.danger}>{localError}</AplusText> : null}
      <AplusButton title={roomId ? 'Lưu thay đổi' : 'Tạo phòng'} leftIcon="check" onPress={handleSave} loading={saving} />
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  card: {gap: theme.spacing.md},
  filterRow: {gap: theme.spacing.sm, paddingRight: theme.spacing.xl},
  filterChip: {paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface},
  filterActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  statusGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md},
  statusOption: {padding: theme.spacing.sm, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong},
});

import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {StatusChip} from '@/components/base/StatusChip';
import {theme} from '@/theme/theme';
import type {AplusLock, LockConnectionState, LockDomainType} from '@/types/lock';

type Props = {
  lock: AplusLock;
  onPress: () => void;
};

function connectionLabel(state: LockConnectionState) {
  switch (state) {
    case 'online': return {label: 'Online', tone: 'success' as const};
    case 'offline': return {label: 'Offline', tone: 'danger' as const};
    case 'bluetooth-only': return {label: 'BLE only', tone: 'info' as const};
    case 'syncing': return {label: 'Đang sync', tone: 'warning' as const};
  }
}

function typeLabel(type: LockDomainType) {
  switch (type) {
    case 'home': return 'Nhà';
    case 'hotel': return 'Khách sạn';
    case 'office': return 'Văn phòng';
  }
}

function doorLabel(doorState: AplusLock['doorState']) {
  switch (doorState) {
    case 'closed': return {label: 'Cửa đóng', tone: 'success' as const};
    case 'open': return {label: 'Cửa mở', tone: 'info' as const};
    case 'left-open': return {label: 'Mở lâu', tone: 'danger' as const};
    case 'unknown': return {label: 'Không rõ', tone: 'warning' as const};
  }
}

export function LockCard({lock, onPress}: Props) {
  const connection = connectionLabel(lock.connectionState);
  const door = doorLabel(lock.doorState);
  const batteryTone = lock.batteryPercent <= 20 ? 'danger' : lock.batteryPercent <= 40 ? 'warning' : 'success';
  const iconName = lock.isLocked ? 'lock' : 'unlock';
  const iconColor = lock.isLocked ? theme.colors.primary : theme.colors.success;

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {({pressed}) => (
        <AplusCard style={[styles.card, pressed ? styles.pressed : null]}>
          <View style={styles.topRow}>
            <AplusIcon
              name={iconName}
              size={28}
              boxed
              boxSize={54}
              color={iconColor}
              containerStyle={!lock.isLocked ? styles.unlockedBox : undefined}
            />
            <View style={styles.titleBlock}>
              <AplusText variant="subtitle" numberOfLines={1}>{lock.name}</AplusText>
              <AplusText variant="caption" numberOfLines={1}>{lock.homeName} · {lock.roomNo}</AplusText>
            </View>
            <View style={styles.chevronBox}>
              <AplusIcon name="chevron" size={19} color={theme.colors.textMuted} />
            </View>
          </View>

          <View style={styles.locationBox}>
            <AplusText variant="caption" numberOfLines={1}>{lock.address}</AplusText>
            <AplusText variant="caption" numberOfLines={1}>Serial: {lock.serial} · {lock.activeCredentialCount} quyền đang hoạt động</AplusText>
          </View>

          <View style={styles.metaRow}>
            <StatusChip label={typeLabel(lock.homeType)} tone="info" />
            <StatusChip label={connection.label} tone={connection.tone} />
            <StatusChip label={door.label} tone={door.tone} />
            <StatusChip label={`${lock.batteryPercent}% pin`} tone={batteryTone} />
            {lock.alertCount > 0 ? <StatusChip label={`${lock.alertCount} cảnh báo`} tone="danger" /> : null}
            {lock.syncState !== 'synced' ? <StatusChip label="Chờ sync" tone="warning" /> : null}
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.inlineMeta}>
              <AplusIcon name="history" size={15} color={theme.colors.textSubtle} />
              <AplusText variant="caption" numberOfLines={1}>{lock.lastActivity}</AplusText>
            </View>
            <View style={styles.inlineMeta}>
              <AplusIcon name="signal" size={15} color={theme.colors.textSubtle} />
              <AplusText variant="caption" color={theme.colors.textSubtle} numberOfLines={1}>{lock.signalPercent}%</AplusText>
            </View>
          </View>
        </AplusCard>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  pressed: {
    opacity: 0.84,
    transform: [{scale: 0.99}],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  unlockedBox: {
    backgroundColor: 'rgba(50,213,131,0.12)',
    borderColor: 'rgba(50,213,131,0.32)',
  },
  titleBlock: {
    flex: 1,
  },
  chevronBox: {
    width: 24,
    alignItems: 'flex-end',
  },
  locationBox: {
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  inlineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flexShrink: 1,
  },
});

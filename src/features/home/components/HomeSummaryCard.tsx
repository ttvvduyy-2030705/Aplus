import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusIcon, type AplusIconName} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {StatusChip} from '@/components/base/StatusChip';
import {theme} from '@/theme/theme';
import type {AplusHome} from '@/types/lock';

type Props = {
  home: AplusHome;
};

function typeLabel(type: AplusHome['type']) {
  switch (type) {
    case 'home': return 'Nhà';
    case 'hotel': return 'Khách sạn';
    case 'office': return 'Văn phòng';
  }
}

function typeIcon(type: AplusHome['type']): AplusIconName {
  switch (type) {
    case 'home': return 'home';
    case 'hotel': return 'hotel';
    case 'office': return 'office';
  }
}

export function HomeSummaryCard({home}: Props) {
  return (
    <AplusCard style={styles.card}>
      <View style={styles.topRow}>
        <AplusIcon name={typeIcon(home.type)} size={24} boxed boxSize={44} color={theme.colors.primary} />
        <View style={styles.titleBlock}>
          <AplusText variant="subtitle" numberOfLines={1}>{home.name}</AplusText>
          <AplusText variant="caption" numberOfLines={1}>{home.address}</AplusText>
        </View>
      </View>
      <View style={styles.metaRow}>
        <StatusChip label={typeLabel(home.type)} tone="info" />
        <StatusChip label={`${home.onlineLocks}/${home.totalLocks} online`} tone={home.onlineLocks > 0 ? 'success' : 'warning'} />
        {home.alertCount > 0 ? <StatusChip label={`${home.alertCount} cảnh báo`} tone="danger" /> : null}
      </View>
    </AplusCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 246,
    gap: theme.spacing.md,
    marginRight: theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  titleBlock: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
});

import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusIcon, type AplusIconName} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {theme} from '@/theme/theme';

type Props = {
  label: string;
  value: number | string;
  tone?: 'normal' | 'danger' | 'warning' | 'success';
  icon?: AplusIconName;
};

function colorForTone(tone: Props['tone']) {
  switch (tone) {
    case 'danger': return theme.colors.danger;
    case 'warning': return theme.colors.warning;
    case 'success': return theme.colors.success;
    default: return theme.colors.text;
  }
}

export function LockMetricCard({label, value, tone = 'normal', icon = 'lock'}: Props) {
  const color = colorForTone(tone);
  return (
    <AplusCard style={styles.card}>
      <View style={styles.topRow}>
        <AplusIcon name={icon} size={20} color={color} />
        <View style={[styles.dot, {backgroundColor: color}]} />
      </View>
      <AplusText variant="title" color={color} numberOfLines={1}>{value}</AplusText>
      <AplusText variant="caption" numberOfLines={2}>{label}</AplusText>
    </AplusCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 132,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

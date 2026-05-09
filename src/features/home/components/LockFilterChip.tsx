import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import {AplusText} from '@/components/base/AplusText';
import {theme} from '@/theme/theme';
import type {LockFilterType} from '@/types/lock';

type Props = {
  label: string;
  value: LockFilterType;
  active: boolean;
  count: number;
  onPress: (value: LockFilterType) => void;
};

export function LockFilterChip({label, value, active, count, onPress}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(value)}
      style={({pressed}) => [styles.chip, active ? styles.active : null, pressed ? styles.pressed : null]}>
      <AplusText variant="caption" color={active ? theme.colors.text : theme.colors.textMuted} numberOfLines={1} style={styles.label}>
        {label} · {count}
      </AplusText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  active: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pressed: {
    opacity: 0.84,
    transform: [{scale: 0.98}],
  },
  label: {
    fontWeight: theme.typography.weight.semibold,
  },
});

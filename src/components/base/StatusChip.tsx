import React from 'react';
import {StyleSheet, View} from 'react-native';
import {theme} from '@/theme/theme';
import {AplusText} from './AplusText';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'muted';

type Props = {
  label: string;
  tone?: Tone;
};

const toneColor: Record<Tone, string> = {
  success: theme.colors.success,
  warning: theme.colors.warning,
  danger: theme.colors.danger,
  info: theme.colors.info,
  muted: theme.colors.textMuted,
};

export function StatusChip({label, tone = 'muted'}: Props) {
  return (
    <View style={[styles.container, {borderColor: toneColor[tone]}]}>
      <View style={[styles.dot, {backgroundColor: toneColor[tone]}]} />
      <AplusText variant="caption" numberOfLines={1} color={toneColor[tone]}>{label}</AplusText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    maxWidth: '100%',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});

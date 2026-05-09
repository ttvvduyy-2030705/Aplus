import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusText} from '@/components/base/AplusText';
import {theme} from '@/theme/theme';

type Props = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({title, message, actionLabel, onAction}: Props) {
  return (
    <View style={styles.container}>
      <AplusText variant="title" align="center">{title}</AplusText>
      <AplusText variant="body" align="center" color={theme.colors.textMuted}>{message}</AplusText>
      {actionLabel && onAction ? <AplusButton title={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
});

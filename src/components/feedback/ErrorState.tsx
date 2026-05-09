import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusText} from '@/components/base/AplusText';
import {theme} from '@/theme/theme';

type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({title = 'Có lỗi xảy ra', message, onRetry}: Props) {
  return (
    <View style={styles.container}>
      <AplusText variant="title" color={theme.colors.danger} align="center">{title}</AplusText>
      <AplusText variant="body" align="center" color={theme.colors.textMuted}>{message}</AplusText>
      {onRetry ? <AplusButton title="Thử lại" variant="secondary" onPress={onRetry} /> : null}
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

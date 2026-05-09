import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {theme} from '@/theme/theme';
import {AplusText} from '@/components/base/AplusText';

export function LoadingView({message = 'Đang tải dữ liệu...'}: {message?: string}) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <AplusText variant="caption">{message}</AplusText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
});

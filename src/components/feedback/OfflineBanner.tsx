import React from 'react';
import {StyleSheet, View} from 'react-native';
import {AplusText} from '@/components/base/AplusText';
import {theme} from '@/theme/theme';

export function OfflineBanner({visible}: {visible: boolean}) {
  if (!visible) return null;
  return (
    <View style={styles.container}>
      <AplusText variant="caption" color={theme.colors.warning}>Đang ở chế độ offline. Một số thao tác sẽ được đồng bộ sau.</AplusText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(253,176,34,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(253,176,34,0.34)',
  },
});

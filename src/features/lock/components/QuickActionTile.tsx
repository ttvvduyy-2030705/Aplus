import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {AplusIcon, type AplusIconName} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {theme} from '@/theme/theme';

type Props = {
  icon: AplusIconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
  badge?: string;
};

export function QuickActionTile({icon, title, subtitle, onPress, disabled, badge}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [styles.container, pressed && !disabled ? styles.pressed : null, disabled ? styles.disabled : null]}>
      <View style={styles.iconRow}>
        <AplusIcon name={icon} size={25} color={disabled ? theme.colors.textSubtle : theme.colors.primary} />
        {badge ? <View style={styles.badge}><AplusText variant="caption" color={theme.colors.primary}>{badge}</AplusText></View> : <AplusIcon name="chevron" size={15} color={theme.colors.textMuted} />}
      </View>
      <AplusText variant="body" style={styles.title} color={disabled ? theme.colors.textSubtle : undefined}>{title}</AplusText>
      <AplusText variant="caption" numberOfLines={2}>{subtitle}</AplusText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 124,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  pressed: {
    opacity: 0.84,
    transform: [{scale: 0.98}],
  },
  disabled: {
    opacity: 0.48,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: theme.typography.weight.bold,
  },
  badge: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
});

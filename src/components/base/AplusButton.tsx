import React, {ReactNode} from 'react';
import {ActivityIndicator, Pressable, StyleProp, StyleSheet, ViewStyle} from 'react-native';
import {theme} from '@/theme/theme';
import {AplusText} from './AplusText';
import {AplusIcon, type AplusIconName} from './AplusIcon';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  left?: ReactNode;
  leftIcon?: AplusIconName;
  rightIcon?: AplusIconName;
  style?: StyleProp<ViewStyle>;
};

function iconColor(variant: ButtonVariant, disabled?: boolean) {
  if (disabled) {
    return theme.colors.textMuted;
  }
  if (variant === 'ghost' || variant === 'secondary') {
    return theme.colors.primary;
  }
  return theme.colors.text;
}

export function AplusButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  left,
  leftIcon,
  rightIcon,
  style,
}: Props) {
  const isDisabled = disabled || loading;
  const currentIconColor = iconColor(variant, isDisabled);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}>
      {loading ? <ActivityIndicator color={theme.colors.text} /> : leftIcon ? <AplusIcon name={leftIcon} size={20} color={currentIconColor} /> : left}
      <AplusText variant="body" style={styles.title}>{title}</AplusText>
      {!loading && rightIcon ? <AplusIcon name={rightIcon} size={18} color={currentIconColor} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  danger: {
    backgroundColor: theme.colors.danger,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  pressed: {
    transform: [{scale: 0.985}],
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.45,
  },
  title: {
    fontWeight: theme.typography.weight.bold,
  },
});

import React from 'react';
import {StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle} from 'react-native';
import {theme} from '@/theme/theme';
import {AplusText} from './AplusText';
import {AplusIcon, type AplusIconName} from './AplusIcon';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  leftIcon?: AplusIconName;
  containerStyle?: StyleProp<ViewStyle>;
};

export function AplusTextField({label, error, leftIcon, containerStyle, style, placeholderTextColor, ...rest}: Props) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <AplusText variant="label" style={styles.label}>{label}</AplusText> : null}
      <View style={[styles.inputShell, error ? styles.inputError : null]}>
        {leftIcon ? <AplusIcon name={leftIcon} size={21} color={error ? theme.colors.danger : theme.colors.primary} /> : null}
        <TextInput
          {...rest}
          placeholderTextColor={placeholderTextColor ?? theme.colors.textSubtle}
          style={[styles.input, style]}
        />
      </View>
      {error ? <AplusText variant="caption" color={theme.colors.danger}>{error}</AplusText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  label: {
    marginLeft: theme.spacing.xs,
  },
  inputShell: {
    minHeight: 52,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  input: {
    flex: 1,
    minHeight: 50,
    paddingVertical: 0,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fontFamily.regular,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
});

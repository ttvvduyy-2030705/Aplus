import React from 'react';
import {Image, Pressable, StyleSheet, View} from 'react-native';
import {theme} from '@/theme/theme';
import {AplusText} from './AplusText';
import {AplusIcon, type AplusIconName} from './AplusIcon';

type Props = {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  canGoBack?: boolean;
  onBack?: () => void;
  rightLabel?: string;
  rightIcon?: AplusIconName;
  onRightPress?: () => void;
};

export function AplusHeader({title, subtitle, showLogo, canGoBack, onBack, rightLabel, rightIcon, onRightPress}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        {canGoBack ? (
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <AplusIcon name="back" size={19} color={theme.colors.text} />
          </Pressable>
        ) : null}
        {showLogo ? <Image source={require('@/assets/images/aplus_logo_square.png')} style={styles.logo} /> : null}
        <View style={styles.titleBlock}>
          <AplusText variant="subtitle" numberOfLines={1}>{title}</AplusText>
          {subtitle ? <AplusText variant="caption" numberOfLines={1}>{subtitle}</AplusText> : null}
        </View>
      </View>
      {rightLabel || rightIcon ? (
        <Pressable accessibilityRole="button" onPress={onRightPress} style={styles.rightButton}>
          {rightIcon ? <AplusIcon name={rightIcon} size={18} color={theme.colors.primary} /> : null}
          {rightLabel ? <AplusText variant="caption" color={theme.colors.primary}>{rightLabel}</AplusText> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  leftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    backgroundColor: '#000',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  titleBlock: {
    flex: 1,
  },
  rightButton: {
    minHeight: 36,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.primarySoft,
  },
});

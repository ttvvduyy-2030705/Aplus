import React from 'react';
import {StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusText} from '@/components/base/AplusText';
import {StatusChip} from '@/components/base/StatusChip';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import type {AppRouteName} from '@/navigation/routes';
import {theme} from '@/theme/theme';

type Props = {
  title: string;
  description: string;
  primaryAction?: string;
  targetRoute?: AppRouteName;
  secondaryAction?: string;
  secondaryTargetRoute?: AppRouteName;
};

export function PlaceholderScreen({title, description, primaryAction, targetRoute, secondaryAction, secondaryTargetRoute}: Props) {
  const navigation = useAplusNavigation();

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={title} subtitle="Placeholder chuẩn Batch 00" canGoBack={navigation.canGoBack} onBack={navigation.goBack} showLogo />
      <AplusCard style={styles.card}>
        <StatusChip label="Mock screen" tone="info" />
        <AplusText variant="hero">{title}</AplusText>
        <AplusText variant="body" color={theme.colors.textMuted}>{description}</AplusText>
        <View style={styles.actions}>
          {primaryAction && targetRoute ? <AplusButton title={primaryAction} leftIcon="chevron" onPress={() => navigation.navigate(targetRoute)} /> : null}
          {secondaryAction && secondaryTargetRoute ? <AplusButton title={secondaryAction} leftIcon="chevron" variant="secondary" onPress={() => navigation.navigate(secondaryTargetRoute)} /> : null}
          <AplusButton title="Về Home" leftIcon="home" variant="ghost" onPress={() => navigation.reset('Home')} />
        </View>
      </AplusCard>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xl,
  },
  card: {
    gap: theme.spacing.lg,
  },
  actions: {
    gap: theme.spacing.md,
  },
});

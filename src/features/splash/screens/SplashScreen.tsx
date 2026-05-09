import React from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusText} from '@/components/base/AplusText';
import {theme} from '@/theme/theme';

export function SplashScreen() {
  return (
    <BaseScreen scroll={false} contentStyle={styles.container}>
      <View style={styles.logoFrame}>
        <Image source={require('@/assets/images/aplus_logo_square.png')} style={styles.logo} resizeMode="contain" />
      </View>
      <AplusText variant="hero" align="center">Aplus</AplusText>
      <AplusText variant="caption" align="center" color={theme.colors.textMuted}>Smart Lock Control</AplusText>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.lg,
  },
  logoFrame: {
    width: 118,
    height: 118,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  logo: {
    width: 92,
    height: 92,
  },
});

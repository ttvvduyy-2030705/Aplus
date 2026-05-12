import React, {ReactNode, memo, useMemo} from 'react';
import {Platform, StyleProp, StyleSheet, Text, TextStyle} from 'react-native';
import {theme} from '@/theme/theme';
import {useLanguage} from '@/i18n/LanguageContext';
import {translateString} from '@/i18n/dictionary';

type TextVariant = 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';

type Props = {
  children: ReactNode;
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
};

function translateNode(node: ReactNode, language: 'vi' | 'en'): ReactNode {
  if (typeof node === 'string') {
    return translateString(node, language);
  }
  if (Array.isArray(node)) {
    return node.map((child, index) => <React.Fragment key={index}>{translateNode(child, language)}</React.Fragment>);
  }
  return node;
}

function AplusTextComponent({children, variant = 'body', color, align, numberOfLines, style}: Props) {
  const {language} = useLanguage();
  const translatedChildren = useMemo(() => translateNode(children, language), [children, language]);

  return (
    <Text
      allowFontScaling={false}
      numberOfLines={numberOfLines}
      style={[
        styles.base,
        styles[variant],
        color ? {color} : null,
        align ? {textAlign: align} : null,
        style,
      ]}>
      {translatedChildren}
    </Text>
  );
}

export const AplusText = memo(AplusTextComponent);

const androidFontFix = Platform.OS === 'android'
  ? {
      includeFontPadding: true,
      textAlignVertical: 'center' as const,
    }
  : null;

const styles = StyleSheet.create({
  base: {
    color: theme.colors.text,
    fontFamily: theme.typography.family,
    writingDirection: 'ltr',
    ...androidFontFix,
  },
  hero: {
    fontSize: theme.typography.sizes.xxl,
    lineHeight: 40,
    fontWeight: theme.typography.weight.heavy,
    letterSpacing: -0.2,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    lineHeight: 32,
    fontWeight: theme.typography.weight.bold,
  },
  subtitle: {
    fontSize: theme.typography.sizes.lg,
    lineHeight: 27,
    fontWeight: theme.typography.weight.semibold,
  },
  body: {
    fontSize: theme.typography.sizes.md,
    lineHeight: 24,
    fontWeight: theme.typography.weight.regular,
  },
  caption: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: 21,
    fontWeight: theme.typography.weight.regular,
    color: theme.colors.textMuted,
  },
  label: {
    fontSize: theme.typography.sizes.xs,
    lineHeight: 18,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: 0.2,
    color: theme.colors.textMuted,
  },
});

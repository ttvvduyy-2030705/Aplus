import React, {memo, useMemo, ReactNode} from 'react';
import {Platform, Text as RNText, TextStyle, LayoutChangeEvent} from 'react-native';
import {responsiveFontSize} from 'utils/helper';

import colors from 'configuration/colors';
import {useLanguage} from '@/i18n/LanguageContext';
import {translateString} from '@/i18n/dictionary';


const systemFontFamily = Platform.select({
  android: 'sans-serif',
  ios: undefined,
  default: undefined,
});

function translateNode(node: ReactNode, language: 'vi' | 'en'): ReactNode {
  if (typeof node === 'string') {
    return translateString(node, language);
  }
  if (Array.isArray(node)) {
    return node.map((child, index) => <React.Fragment key={index}>{translateNode(child, language)}</React.Fragment>);
  }
  return node;
}

function normalizeFontWeight(fontWeight: TextProps['fontWeight']): TextStyle['fontWeight'] {
  if (fontWeight === 'bold') {
    return '700';
  }
  if (fontWeight === 'normal') {
    return '400';
  }
  if (fontWeight === '900') {
    return '700';
  }
  return fontWeight;
}

interface TextProps {
  children: ReactNode;
  style?: TextStyle | TextStyle[];
  fontWeight?:
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900'
    | 'bold'
    | 'normal';
  fontStyle?: 'normal' | 'italic';
  textDecorationStyle?: 'solid' | 'dotted' | 'dashed' | 'double' | undefined;
  textDecorationLine?:
    | 'none'
    | 'underline'
    | 'line-through'
    | 'underline line-through'
    | undefined;
  fontSize?: number;
  lineHeight?: number;
  numberOfLines?: number;
  letterSpacing?: number;
  ellipsizeMode?: 'clip' | 'head' | 'middle' | 'tail';
  textAlign?: 'center' | 'justify' | 'left' | 'right';
  color?: string;
  adjustsFontSizeToFit?: boolean;
  includeFontPadding?: boolean;
  onLayout?: (e: LayoutChangeEvent) => void;
}

const Text = (props: TextProps) => {
  const {language} = useLanguage();
  const {
    children,
    style,
    fontWeight = 'normal',
    fontStyle = 'normal',
    textDecorationStyle,
    textDecorationLine,
    fontSize = 14,
    lineHeight,
    numberOfLines,
    letterSpacing,
    ellipsizeMode = 'tail',
    textAlign = 'left',
    color = colors.black,
    adjustsFontSizeToFit,
    includeFontPadding,
    onLayout,
  } = props;

  const textStyle = useMemo(() => {
    const propStyle: TextStyle = {
      textAlign,
      fontStyle,
      fontSize: responsiveFontSize(fontSize),
      fontFamily: systemFontFamily,
      fontWeight: normalizeFontWeight(fontWeight),
      includeFontPadding: includeFontPadding ?? Platform.OS === 'android',
      writingDirection: 'ltr',
    };

    const result = [style, propStyle];

    if (color) {
      result.push({color});
    }

    if (lineHeight) {
      result.push({lineHeight: responsiveFontSize(lineHeight)});
    }


    if (textDecorationStyle) {
      result.push({textDecorationStyle});
    }

    if (textDecorationLine) {
      result.push({textDecorationLine});
    }

    if (letterSpacing) {
      result.push({letterSpacing});
    }

    return result;
  }, [
    style,
    fontWeight,
    fontStyle,
    textDecorationStyle,
    textDecorationLine,
    fontSize,
    lineHeight,
    textAlign,
    color,
    letterSpacing,
    includeFontPadding,
  ]);

  return (
    <RNText
      style={textStyle}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      allowFontScaling={false}
      onLayout={onLayout}>
      {translateNode(children, language)}
    </RNText>
  );
};

export default memo(Text);

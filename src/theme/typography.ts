import {Platform} from 'react-native';

// Chuẩn font hệ thống có hỗ trợ tiếng Việt tốt trên Android/iOS.
// Không dùng custom font ở Batch 01 để tránh lỗi thiếu glyph/dấu tiếng Việt trên một số máy Xiaomi/Android.
export const typography = {
  family: Platform.select({
    android: 'sans-serif',
    ios: undefined,
    default: undefined,
  }),
  monoFamily: Platform.select({
    android: 'monospace',
    ios: 'Menlo',
    default: 'monospace',
  }),
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 30,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '700' as const,
  },
};

import {Platform} from 'react-native';

// Không trỏ tới font custom khi project không có file .ttf/.otf đi kèm.
// Dùng system font để tránh lỗi chữ tiếng Việt, ô vuông hoặc warning thiếu Nunito trên Android/iOS.
const systemFont = Platform.select({
  android: 'sans-serif',
  ios: undefined,
  default: undefined,
});

const fonts = {
  System: {
    regular: systemFont,
    bold: systemFont,
    black: systemFont,
    italic: systemFont,
  },
  Nunito: {
    regular: systemFont,
    bold: systemFont,
    black: systemFont,
    italic: systemFont,
  },
};

const getSelectedFont = () => systemFont;

export {getSelectedFont};
export default fonts;

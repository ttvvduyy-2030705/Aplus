import {Platform} from 'react-native';

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#E50914',
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: {width: 0, height: 8},
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
};

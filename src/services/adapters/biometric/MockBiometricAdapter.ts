import {Platform} from 'react-native';
import type {BiometricAdapter} from './BiometricAdapter';

export const MockBiometricAdapter: BiometricAdapter = {
  async isAvailable() {
    return Platform.OS === 'android' || Platform.OS === 'ios';
  },
  async authenticate() {
    await wait(220);
    return {success: true};
  },
};

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

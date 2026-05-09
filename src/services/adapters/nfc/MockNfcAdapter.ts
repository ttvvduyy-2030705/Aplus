import {Platform} from 'react-native';
import type {NfcAdapter} from './NfcAdapter';

export const MockNfcAdapter: NfcAdapter = {
  async isSupported() {
    return Platform.OS === 'android' || Platform.OS === 'ios';
  },
  async writeKey(lockId: string, userId: string) {
    await wait(300);
    return {cardId: `nfc-${lockId}-${userId}`};
  },
  async revokeKey() {
    await wait(160);
    return {revoked: true};
  },
};

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

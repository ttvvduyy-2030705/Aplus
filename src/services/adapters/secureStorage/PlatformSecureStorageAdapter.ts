import {NativeModules, Platform} from 'react-native';
import {MemorySecureStorageAdapter} from './MemorySecureStorageAdapter';
import type {SecureStorageAdapter} from './SecureStorageAdapter';

type NativeSecureStorageModule = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const nativeSecureStorage = NativeModules.AplusSecureStorage as NativeSecureStorageModule | undefined;

function canUseNativeStorage() {
  return Platform.OS === 'android' && Boolean(nativeSecureStorage);
}

export const PlatformSecureStorageAdapter: SecureStorageAdapter = {
  async getItem(key) {
    if (canUseNativeStorage()) {
      try {
        return await nativeSecureStorage!.getItem(key);
      } catch {
        return MemorySecureStorageAdapter.getItem(key);
      }
    }
    return MemorySecureStorageAdapter.getItem(key);
  },

  async setItem(key, value) {
    if (canUseNativeStorage()) {
      try {
        await nativeSecureStorage!.setItem(key, value);
        return;
      } catch {
        // Fallback mock cho iOS/dev nếu native module chưa có.
      }
    }
    await MemorySecureStorageAdapter.setItem(key, value);
  },

  async removeItem(key) {
    if (canUseNativeStorage()) {
      try {
        await nativeSecureStorage!.removeItem(key);
        return;
      } catch {
        // Fallback mock cho iOS/dev nếu native module chưa có.
      }
    }
    await MemorySecureStorageAdapter.removeItem(key);
  },
};

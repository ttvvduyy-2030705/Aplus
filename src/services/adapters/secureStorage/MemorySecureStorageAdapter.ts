import type {SecureStorageAdapter} from './SecureStorageAdapter';

const memoryStore = new Map<string, string>();

export const MemorySecureStorageAdapter: SecureStorageAdapter = {
  async getItem(key) {
    return memoryStore.get(key) ?? null;
  },
  async setItem(key, value) {
    memoryStore.set(key, value);
  },
  async removeItem(key) {
    memoryStore.delete(key);
  },
};

import type {AuthSession, TrustedDeviceSession} from '@/types/auth';
import type {SecureStorageAdapter} from '@/services/adapters/secureStorage/SecureStorageAdapter';

const ACTIVE_SESSION_KEY = 'APLUS_ACTIVE_AUTH_SESSION_V1';
const TRUSTED_DEVICE_KEY = 'APLUS_TRUSTED_DEVICE_SESSION_V1';

function parseJson<T>(value: string | null): T | undefined {
  if (!value) {
    return undefined;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

export function createSessionStore(storage: SecureStorageAdapter) {
  return {
    async getActiveSession(): Promise<AuthSession | undefined> {
      return parseJson<AuthSession>(await storage.getItem(ACTIVE_SESSION_KEY));
    },

    async setActiveSession(session: AuthSession) {
      await storage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    },

    async clearActiveSession() {
      await storage.removeItem(ACTIVE_SESSION_KEY);
    },

    async getTrustedDevice(): Promise<TrustedDeviceSession | undefined> {
      return parseJson<TrustedDeviceSession>(await storage.getItem(TRUSTED_DEVICE_KEY));
    },

    async setTrustedDevice(session: TrustedDeviceSession) {
      await storage.setItem(TRUSTED_DEVICE_KEY, JSON.stringify(session));
    },

    async clearTrustedDevice() {
      await storage.removeItem(TRUSTED_DEVICE_KEY);
    },
  };
}

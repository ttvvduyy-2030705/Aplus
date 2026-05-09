export interface NfcAdapter {
  isSupported(): Promise<boolean>;
  writeKey(lockId: string, userId: string): Promise<{cardId: string}>;
  revokeKey(cardId: string): Promise<{revoked: boolean}>;
}

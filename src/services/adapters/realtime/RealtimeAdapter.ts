export type RealtimeEvent = {
  type: 'lock_state' | 'battery' | 'alert' | 'sync';
  lockId: string;
  payload: Record<string, unknown>;
};

export interface RealtimeAdapter {
  connect(): Promise<{connected: boolean}>;
  disconnect(): Promise<void>;
  subscribeLock(lockId: string, onEvent: (event: RealtimeEvent) => void): () => void;
}

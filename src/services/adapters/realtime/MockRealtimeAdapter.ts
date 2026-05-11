import type {RealtimeAdapter} from './RealtimeAdapter';

export const MockRealtimeAdapter: RealtimeAdapter = {
  async connect() {
    await wait(160);
    return {connected: true};
  },
  async disconnect() {
    await wait(100);
  },
  subscribeLock(lockId, onEvent) {
    const timer = setTimeout(() => {
      onEvent({type: 'sync', lockId, payload: {syncState: 'synced'}});
    }, 1000);
    return () => clearTimeout(timer);
  },
};

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

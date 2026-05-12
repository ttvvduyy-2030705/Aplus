import {RealtimeService} from '@/services/realtime/RealtimeService';
import type {LockCommandType} from '@/types/lock';
import type {RealtimeEventScenario, RealtimeSnapshot} from '@/types/realtime';

export const MockRealtimeRepository = {
  async getSnapshot(): Promise<RealtimeSnapshot> {
    await RealtimeService.hydrateSubscriptions();
    return RealtimeService.getSnapshot();
  },

  async connect(): Promise<RealtimeSnapshot> {
    return RealtimeService.connect();
  },

  async disconnect(): Promise<RealtimeSnapshot> {
    return RealtimeService.disconnect();
  },

  async setBackendOnline(online: boolean): Promise<RealtimeSnapshot> {
    return RealtimeService.setBackendOnline(online);
  },

  async createPendingCommand(lockId: string, type: LockCommandType = 'remoteUnlock'): Promise<RealtimeSnapshot> {
    await RealtimeService.createPendingCommand(lockId, type);
    return RealtimeService.getSnapshot();
  },

  async emitEvent(lockId: string, scenario: RealtimeEventScenario): Promise<RealtimeSnapshot> {
    await RealtimeService.emitEvent(lockId, scenario);
    return RealtimeService.getSnapshot();
  },
};

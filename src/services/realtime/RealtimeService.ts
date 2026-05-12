import {MockLockRepository} from '@/services/repositories/MockLockRepository';
import type {AccessRecord, AplusLock, BatteryState, LockCommandStatus} from '@/types/lock';
import type {
  PendingRealtimeCommand,
  RealtimeConnectionStatus,
  RealtimeEvent,
  RealtimeEventScenario,
  RealtimeEventType,
  RealtimeMonitorSummary,
  RealtimeSnapshot,
  RealtimeSubscription,
  RealtimeTransport,
} from '@/types/realtime';
import {handleCommandResult} from './CommandResultHandler';
import {EventStore} from './EventStore';

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function cloneEvent(event: RealtimeEvent): RealtimeEvent {
  return {...event, payload: {...event.payload}};
}

function connectionTopic(lock: AplusLock, transport: RealtimeTransport) {
  const prefix = transport === 'mqtt' ? 'aplus/locks' : 'ws://locks';
  return `${prefix}/${lock.serial}/events`;
}

function batteryState(percent: number): BatteryState {
  if (percent <= 10) {
    return 'critical';
  }
  if (percent <= 20) {
    return 'low';
  }
  if (percent <= 60) {
    return 'medium';
  }
  return 'good';
}

function eventTitle(type: RealtimeEventType) {
  const titles: Record<RealtimeEventType, string> = {
    lock_state: 'Lock state realtime event',
    door_open: 'Door open realtime event',
    door_closed: 'Door closed realtime event',
    door_left_open: 'Door left open realtime event',
    battery_low: 'Battery low realtime event',
    tamper: 'Tamper realtime event',
    gateway_online: 'Gateway online realtime event',
    gateway_offline: 'Gateway offline realtime event',
    command_ack: 'Command ACK realtime event',
    command_success: 'Command success realtime event',
    command_failed: 'Command failed realtime event',
    command_timeout: 'Command timeout realtime event',
  };
  return titles[type];
}

function commandStatusFromScenario(scenario: RealtimeEventScenario): LockCommandStatus | undefined {
  if (scenario === 'commandSuccess') {
    return 'success';
  }
  if (scenario === 'commandTimeout') {
    return 'timeout';
  }
  if (scenario === 'commandFailed') {
    return 'failed';
  }
  return undefined;
}

function eventTypeFromScenario(scenario: RealtimeEventScenario): RealtimeEventType {
  const map: Record<RealtimeEventScenario, RealtimeEventType> = {
    lockState: 'lock_state',
    doorLeftOpen: 'door_left_open',
    batteryLow: 'battery_low',
    tamper: 'tamper',
    gatewayOffline: 'gateway_offline',
    commandSuccess: 'command_success',
    commandTimeout: 'command_timeout',
    commandFailed: 'command_failed',
  };
  return map[scenario];
}

class RealtimeServiceImpl {
  private store = new EventStore();
  private status: RealtimeConnectionStatus = 'offline';
  private transport: RealtimeTransport = 'mqtt';
  private backendOnline = true;
  private reconnectAttempts = 0;
  private subscriptions: RealtimeSubscription[] = [];
  private pendingCommands: PendingRealtimeCommand[] = [];
  private serverUrl = 'mqtts://local.aplus.mock/realtime';

  async hydrateSubscriptions() {
    const locks = await MockLockRepository.getLocks('all');
    this.subscriptions = locks.map((lock, index) => ({
      id: `sub-${lock.id}`,
      lockId: lock.id,
      lockName: lock.name,
      topic: connectionTopic(lock, index % 3 === 2 ? 'websocket' : 'mqtt'),
      transport: index % 3 === 2 ? 'websocket' : 'mqtt',
      active: lock.capabilities.supportsGateway,
      lastEventAt: undefined,
    }));
  }

  async connect() {
    this.status = 'connecting';
    await wait(180);
    if (!this.backendOnline) {
      this.status = 'reconnecting';
      this.reconnectAttempts += 1;
      return this.getSnapshot();
    }
    await this.hydrateSubscriptions();
    this.status = 'connected';
    return this.getSnapshot();
  }

  async disconnect() {
    await wait(100);
    this.status = 'offline';
    return this.getSnapshot();
  }

  async setBackendOnline(online: boolean) {
    this.backendOnline = online;
    this.status = online ? 'connected' : 'reconnecting';
    if (!online) {
      this.reconnectAttempts += 1;
    }
    return this.getSnapshot();
  }

  async createPendingCommand(lockId: string, type: PendingRealtimeCommand['type'] = 'remoteUnlock') {
    const lock = await MockLockRepository.getLockById(lockId);
    if (!lock) {
      return undefined;
    }
    const now = Date.now();
    const command: PendingRealtimeCommand = {
      id: `rtcmd-${now}-${Math.round(Math.random() * 999)}`,
      lockId,
      lockName: lock.name,
      type,
      commandCode: `RT-${String(now).slice(-6)}`,
      status: 'sent',
      transport: lock.gatewayName?.toLowerCase().includes('office') ? 'websocket' : 'mqtt',
      topic: connectionTopic(lock, lock.gatewayName?.toLowerCase().includes('office') ? 'websocket' : 'mqtt'),
      createdAt: now,
      updatedAt: now,
      timeoutAt: now + 15000,
    };
    this.pendingCommands.unshift(command);
    return {...command};
  }

  private async applyDeviceEvent(lock: AplusLock, scenario: RealtimeEventScenario, event: RealtimeEvent) {
    if (event.ignoredAsDuplicate) {
      return;
    }

    const now = Date.now();
    if (scenario === 'lockState') {
      const nextLocked = !lock.isLocked;
      await MockLockRepository.updateLockRuntimeState(lock.id, {
        isLocked: nextLocked,
        doorState: nextLocked ? 'closed' : 'open',
        connectionState: 'online',
        gatewayOnline: true,
        syncState: 'synced',
        lastSeenAt: 'Vừa xong',
        lastActivity: nextLocked ? 'Realtime khóa lại · vừa xong' : 'Realtime mở khóa · vừa xong',
      });
      return;
    }

    if (scenario === 'doorLeftOpen') {
      await MockLockRepository.updateLockRuntimeState(lock.id, {
        doorState: 'left-open',
        alertCount: Math.max(1, lock.alertCount + 1),
        lastSeenAt: 'Vừa xong',
        lastActivity: 'Cửa mở lâu qua realtime · vừa xong',
      });
      const record: AccessRecord = {
        id: `record-rt-door-${now}`,
        lockId: lock.id,
        lockName: lock.name,
        roomName: lock.roomName,
        method: 'Gateway',
        result: 'blocked',
        gatewayName: lock.gatewayName,
        actorName: 'RealtimeService',
        message: 'Realtime event: cửa mở quá lâu, tạo cảnh báo vận hành.',
        failureReason: 'door_left_open',
        createdAt: now,
      };
      await MockLockRepository.addAccessRecord(record);
      return;
    }

    if (scenario === 'batteryLow') {
      await MockLockRepository.updateLockRuntimeState(lock.id, {
        batteryPercent: 12,
        batteryState: batteryState(12),
        alertCount: Math.max(1, lock.alertCount + 1),
        lastSeenAt: 'Vừa xong',
        lastActivity: 'Pin yếu qua realtime · vừa xong',
      });
      const record: AccessRecord = {
        id: `record-rt-battery-${now}`,
        lockId: lock.id,
        lockName: lock.name,
        roomName: lock.roomName,
        method: 'Battery',
        result: 'blocked',
        gatewayName: lock.gatewayName,
        actorName: 'RealtimeService',
        message: 'Realtime event: pin yếu dưới threshold, tạo cảnh báo pin.',
        batteryPercentAtEvent: 12,
        failureReason: 'battery_low',
        createdAt: now,
      };
      await MockLockRepository.addAccessRecord(record);
      return;
    }

    if (scenario === 'tamper') {
      await MockLockRepository.updateLockRuntimeState(lock.id, {
        alertCount: Math.max(1, lock.alertCount + 1),
        lastSeenAt: 'Vừa xong',
        lastActivity: 'Tamper qua realtime · vừa xong',
      });
      const record: AccessRecord = {
        id: `record-rt-tamper-${now}`,
        lockId: lock.id,
        lockName: lock.name,
        roomName: lock.roomName,
        method: 'Gateway',
        result: 'failed',
        gatewayName: lock.gatewayName,
        actorName: 'RealtimeService',
        message: 'Realtime event: phát hiện cạy phá/tamper.',
        failureReason: 'tamper',
        createdAt: now,
      };
      await MockLockRepository.addAccessRecord(record);
      return;
    }

    if (scenario === 'gatewayOffline') {
      await MockLockRepository.updateLockRuntimeState(lock.id, {
        connectionState: 'offline',
        gatewayOnline: false,
        signalPercent: 0,
        syncState: 'offline',
        alertCount: Math.max(1, lock.alertCount + 1),
        lastSeenAt: 'Mất kết nối vừa xong',
        lastActivity: 'Gateway offline qua realtime · vừa xong',
      });
      const record: AccessRecord = {
        id: `record-rt-gateway-${now}`,
        lockId: lock.id,
        lockName: lock.name,
        roomName: lock.roomName,
        method: 'Gateway',
        result: 'timeout',
        gatewayName: lock.gatewayName,
        actorName: 'RealtimeService',
        message: 'Realtime event: gateway offline, app giữ an toàn và không remote unlock.',
        failureReason: 'gateway_offline',
        createdAt: now,
      };
      await MockLockRepository.addAccessRecord(record);
    }
  }

  async emitEvent(lockId: string, scenario: RealtimeEventScenario) {
    if (this.status !== 'connected' || !this.backendOnline) {
      this.reconnectAttempts += 1;
      this.status = 'reconnecting';
      return undefined;
    }

    const lock = await MockLockRepository.getLockById(lockId);
    if (!lock) {
      return undefined;
    }
    const now = Date.now();
    const eventType = eventTypeFromScenario(scenario);
    const transport: RealtimeTransport = lock.gatewayName?.toLowerCase().includes('office') ? 'websocket' : 'mqtt';
    const commandStatus = commandStatusFromScenario(scenario);
    const pendingCommand = commandStatus
      ? this.pendingCommands.find(command => command.lockId === lockId && command.status !== 'success' && command.status !== 'timeout' && command.status !== 'failed') ?? await this.createPendingCommand(lockId)
      : undefined;

    const event: RealtimeEvent = {
      id: `rte-${now}-${Math.round(Math.random() * 999)}`,
      type: eventType,
      lockId,
      lockName: lock.name,
      roomName: lock.roomName,
      transport,
      topic: connectionTopic(lock, transport),
      dedupeKey: `${eventType}:${lockId}:${pendingCommand?.id ?? String(now).slice(0, -3)}`,
      payload: {
        locked: scenario === 'lockState' ? !lock.isLocked : lock.isLocked,
        batteryPercent: scenario === 'batteryLow' ? 12 : lock.batteryPercent,
        commandId: pendingCommand?.id,
        commandCode: pendingCommand?.commandCode,
        reason: eventTitle(eventType),
      },
      result: commandStatus === 'success' ? 'success' : commandStatus === 'timeout' ? 'timeout' : commandStatus === 'failed' ? 'failed' : undefined,
      receivedAt: now,
    };
    const stored = this.store.add(event);

    this.subscriptions = this.subscriptions.map(subscription => subscription.lockId === lockId ? {...subscription, lastEventAt: now} : subscription);

    if (pendingCommand && commandStatus && !stored.ignoredAsDuplicate) {
      await handleCommandResult(pendingCommand, commandStatus, stored);
      this.pendingCommands = this.pendingCommands.map(command => command.id === pendingCommand.id ? {...command, status: commandStatus, updatedAt: Date.now()} : command);
    } else {
      await this.applyDeviceEvent(lock, scenario, stored);
    }
    return stored;
  }

  getSummary(): RealtimeMonitorSummary {
    const events = this.store.list();
    return {
      status: this.status,
      transport: this.transport,
      serverUrl: this.serverUrl,
      subscribedTopics: this.subscriptions.filter(item => item.active).length,
      pendingCommands: this.pendingCommands.filter(command => !['success', 'failed', 'timeout'].includes(command.status)).length,
      lastEventAt: events[0]?.receivedAt,
      reconnectAttempts: this.reconnectAttempts,
      droppedEvents: this.store.droppedEvents,
      duplicateEvents: this.store.duplicateEvents,
      backendOnline: this.backendOnline,
    };
  }

  getSnapshot(): RealtimeSnapshot {
    return {
      summary: this.getSummary(),
      events: this.store.list().map(cloneEvent),
      subscriptions: this.subscriptions.map(item => ({...item})),
      pendingCommands: this.pendingCommands.map(item => ({...item})),
    };
  }
}

export const RealtimeService = new RealtimeServiceImpl();

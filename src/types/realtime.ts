import type {AccessRecordResult, LockCommandStatus, LockCommandType} from './lock';

export type RealtimeTransport = 'websocket' | 'mqtt';
export type RealtimeConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'offline';

export type RealtimeEventType =
  | 'lock_state'
  | 'door_open'
  | 'door_closed'
  | 'door_left_open'
  | 'battery_low'
  | 'tamper'
  | 'gateway_online'
  | 'gateway_offline'
  | 'command_ack'
  | 'command_success'
  | 'command_failed'
  | 'command_timeout';

export type RealtimeEvent = {
  id: string;
  type: RealtimeEventType;
  lockId: string;
  lockName: string;
  roomName: string;
  transport: RealtimeTransport;
  topic: string;
  dedupeKey: string;
  payload: Record<string, string | number | boolean | undefined>;
  result?: AccessRecordResult;
  receivedAt: number;
  processedAt?: number;
  ignoredAsDuplicate?: boolean;
};

export type RealtimeSubscription = {
  id: string;
  lockId: string;
  lockName: string;
  topic: string;
  transport: RealtimeTransport;
  active: boolean;
  lastEventAt?: number;
};

export type PendingRealtimeCommand = {
  id: string;
  lockId: string;
  lockName: string;
  type: LockCommandType;
  commandCode: string;
  status: LockCommandStatus;
  transport: RealtimeTransport;
  topic: string;
  createdAt: number;
  updatedAt: number;
  timeoutAt: number;
};

export type RealtimeMonitorSummary = {
  status: RealtimeConnectionStatus;
  transport: RealtimeTransport;
  serverUrl: string;
  subscribedTopics: number;
  pendingCommands: number;
  lastEventAt?: number;
  reconnectAttempts: number;
  droppedEvents: number;
  duplicateEvents: number;
  backendOnline: boolean;
};

export type RealtimeEventScenario =
  | 'lockState'
  | 'doorLeftOpen'
  | 'batteryLow'
  | 'tamper'
  | 'gatewayOffline'
  | 'commandSuccess'
  | 'commandTimeout'
  | 'commandFailed';

export type RealtimeSnapshot = {
  summary: RealtimeMonitorSummary;
  events: RealtimeEvent[];
  subscriptions: RealtimeSubscription[];
  pendingCommands: PendingRealtimeCommand[];
};

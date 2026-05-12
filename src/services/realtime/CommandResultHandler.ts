import {MockLockRepository} from '@/services/repositories/MockLockRepository';
import type {AccessRecord, AplusLock, LockCommandStatus, LockCommandType} from '@/types/lock';
import type {PendingRealtimeCommand, RealtimeEvent} from '@/types/realtime';

function commandMessage(status: LockCommandStatus, type: LockCommandType) {
  const action = type === 'lock' ? 'Khóa lại' : 'Mở khóa';
  if (status === 'success') {
    return `${action} thành công qua realtime event.`;
  }
  if (status === 'timeout') {
    return `${action} timeout, không đổi trạng thái khóa.`;
  }
  if (status === 'failed') {
    return `${action} thất bại từ gateway.`;
  }
  return `Command ${status} từ realtime.`;
}

function nextLockState(lock: AplusLock, command: PendingRealtimeCommand, status: LockCommandStatus): Partial<AplusLock> {
  if (status !== 'success') {
    return {
      lastActivity: commandMessage(status, command.type),
      lastSeenAt: 'Vừa xong',
      syncState: status === 'timeout' ? 'pending' : 'synced',
    };
  }

  const nextLocked = command.type === 'lock';
  return {
    isLocked: nextLocked,
    doorState: nextLocked ? 'closed' : 'open',
    connectionState: 'online',
    gatewayOnline: true,
    syncState: 'synced',
    lastSeenAt: 'Vừa xong',
    lastActivity: commandMessage(status, command.type),
  };
}

export async function handleCommandResult(command: PendingRealtimeCommand, status: LockCommandStatus, event: RealtimeEvent) {
  const lock = await MockLockRepository.getLockById(command.lockId);
  if (!lock) {
    return undefined;
  }

  const patch = nextLockState(lock, command, status);
  await MockLockRepository.updateLockRuntimeState(command.lockId, patch);

  const record: AccessRecord = {
    id: `record-rt-cmd-${Date.now()}-${Math.round(Math.random() * 999)}`,
    lockId: command.lockId,
    lockName: lock.name,
    roomName: lock.roomName,
    method: command.type === 'lock' ? 'App Lock' : 'App Remote Unlock',
    result: status === 'success' ? 'success' : status === 'timeout' ? 'timeout' : 'failed',
    commandId: command.id,
    gatewayName: lock.gatewayName,
    actorName: 'RealtimeService',
    message: commandMessage(status, command.type),
    failureReason: status === 'success' ? undefined : event.payload.reason ? String(event.payload.reason) : commandMessage(status, command.type),
    createdAt: Date.now(),
  };
  await MockLockRepository.addAccessRecord(record);
  return record;
}

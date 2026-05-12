import {MockLockRepository} from '@/services/repositories/MockLockRepository';
import type {AccessRecord, AplusLock} from '@/types/lock';
import type {Alert, IncidentTicket} from '@/types/alert';
import type {
  CreateMaintenanceTaskInput,
  CreateSupportTicketInput,
  DiagnosticPackage,
  MaintenanceTask,
  SupportSummary,
  SupportTicket,
  WarrantyInfo,
  WarrantyStatus,
} from '@/types/support';

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function now() {
  return Date.now();
}

function days(value: number) {
  return value * 24 * 60 * 60 * 1000;
}

function cloneTicket(ticket: SupportTicket): SupportTicket {
  return {...ticket, attachmentNames: [...ticket.attachmentNames]};
}

function cloneWarranty(warranty: WarrantyInfo): WarrantyInfo {
  return {...warranty};
}

function cloneTask(task: MaintenanceTask): MaintenanceTask {
  return {...task, checklist: [...task.checklist]};
}

function clonePackage(pkg: DiagnosticPackage): DiagnosticPackage {
  return {...pkg, redactedFields: [...pkg.redactedFields]};
}

function warrantyStatus(expiresAt: number): WarrantyStatus {
  const remaining = expiresAt - now();
  if (remaining <= 0) {
    return 'expired';
  }
  if (remaining <= days(30)) {
    return 'expiring';
  }
  return 'active';
}

async function findLock(lockId: string): Promise<AplusLock | undefined> {
  return MockLockRepository.getLockById(lockId);
}

async function fallbackLock(lockId?: string): Promise<AplusLock | undefined> {
  if (lockId) {
    return findLock(lockId);
  }
  const locks = await MockLockRepository.getLocks('all');
  return locks[0];
}

let supportTickets: SupportTicket[] = [
  {
    id: 'support-ticket-offline-0802',
    type: 'technical',
    lockId: 'lock-hotel-0802',
    lockName: 'Phòng khách sạn 802',
    roomName: 'Phòng 802',
    title: 'Kiểm tra gateway tầng 8',
    description: 'Gateway Hotel-08 mất heartbeat. Cần kiểm tra nguồn, MQTT binding và khoảng cách tới khóa.',
    severity: 'High',
    status: 'in_progress',
    contactName: 'Lễ tân ca sáng',
    contactPhone: '0900 000 802',
    attachmentNames: ['gateway-heartbeat-log.txt'],
    relatedAlertId: 'alert-offline-0802',
    relatedIncidentTicketId: 'ticket-offline-0802',
    createdAt: now() - days(1),
    updatedAt: now() - 1000 * 60 * 45,
  },
];

let warrantyInfos: WarrantyInfo[] = [
  {
    id: 'warranty-lock-home-520',
    lockId: 'lock-home-520',
    lockName: 'Căn hộ 520',
    serial: 'APL-HOME-0520',
    model: 'Aplus L5 Pro',
    purchaseDate: now() - days(160),
    installedAt: now() - days(155),
    expiresAt: now() + days(205),
    status: 'active',
    provider: 'Aplus Lock Vietnam',
    policyNote: 'Bảo hành điện tử 12 tháng, không bao gồm pin tiêu hao và lỗi cơ khí do lắp đặt sai.',
  },
  {
    id: 'warranty-lock-hotel-0802',
    lockId: 'lock-hotel-0802',
    lockName: 'Phòng khách sạn 802',
    serial: 'APL-HOTEL-0802',
    model: 'Aplus Hotel Card Pro',
    purchaseDate: now() - days(390),
    installedAt: now() - days(382),
    expiresAt: now() - days(17),
    status: 'expired',
    provider: 'Aplus Lock Vietnam',
    policyNote: 'Hết bảo hành tiêu chuẩn, cần tạo yêu cầu bảo trì tính phí nếu thay phần cứng.',
  },
];

let maintenanceTasks: MaintenanceTask[] = [
  {
    id: 'maint-battery-0802',
    lockId: 'lock-hotel-0802',
    lockName: 'Phòng khách sạn 802',
    roomName: 'Phòng 802',
    type: 'battery',
    title: 'Thay pin và kiểm tra gateway',
    status: 'overdue',
    assignee: 'Kỹ thuật tầng 8',
    dueAt: now() - 1000 * 60 * 60 * 3,
    checklist: ['Thay pin AA alkaline', 'Kiểm tra gateway power', 'Chạy diagnostic sau thay pin'],
    relatedTicketId: 'support-ticket-offline-0802',
    createdAt: now() - days(2),
    updatedAt: now() - 1000 * 60 * 60,
  },
  {
    id: 'maint-firmware-home-520',
    lockId: 'lock-home-520',
    lockName: 'Căn hộ 520',
    roomName: 'Căn hộ 520',
    type: 'firmware',
    title: 'Kiểm tra firmware định kỳ',
    status: 'scheduled',
    assignee: 'Aplus CSKH',
    dueAt: now() + days(7),
    checklist: ['Check OTA stable channel', 'Export diagnostic package', 'Xác nhận record không có lỗi lặp lại'],
    createdAt: now() - days(5),
    updatedAt: now() - days(5),
  },
];

let diagnosticPackages: DiagnosticPackage[] = [];

function ensureWarrantyFor(lock: AplusLock): WarrantyInfo {
  const existing = warrantyInfos.find(item => item.lockId === lock.id);
  if (existing) {
    existing.lockName = lock.name;
    existing.serial = lock.serial;
    existing.model = lock.hardwareModel ?? existing.model;
    existing.status = warrantyStatus(existing.expiresAt);
    return existing;
  }
  const created: WarrantyInfo = {
    id: `warranty-${lock.id}`,
    lockId: lock.id,
    lockName: lock.name,
    serial: lock.serial,
    model: lock.hardwareModel ?? 'Aplus Mock Lock',
    purchaseDate: now() - days(60),
    installedAt: now() - days(58),
    expiresAt: now() + days(305),
    status: 'active',
    provider: 'Aplus Lock Vietnam',
    policyNote: 'Warranty mock được tạo từ thiết bị seed. Khi backend thật sẽ đọc từ CRM/bảo hành điện tử.',
  };
  warrantyInfos.unshift(created);
  return created;
}

async function getRecentRecords(lockId: string): Promise<AccessRecord[]> {
  return (await MockLockRepository.getAccessRecords({lockId})).slice(0, 8);
}

async function getRelatedAlerts(lockId: string): Promise<Alert[]> {
  return (await MockLockRepository.getAlerts({lockId})).slice(0, 8);
}

async function getRelatedIncidentTickets(lockId: string): Promise<IncidentTicket[]> {
  const tickets = await MockLockRepository.getIncidentTickets();
  return tickets.filter(ticket => ticket.lockId === lockId).slice(0, 8);
}

function redactRecord(record: AccessRecord) {
  return {
    id: record.id,
    lockId: record.lockId,
    method: record.method,
    result: record.result,
    commandId: record.commandId,
    credentialId: record.credentialId ? '[REDACTED_CREDENTIAL_ID]' : undefined,
    sourceIp: record.sourceIp ? '[REDACTED_IP]' : undefined,
    deviceName: record.deviceName,
    failureReason: record.failureReason,
    batteryPercentAtEvent: record.batteryPercentAtEvent,
    message: record.message.replace(/\b\d{4,10}\b/g, '[REDACTED_CODE]'),
    createdAt: record.createdAt,
  };
}

export const MockSupportRepository = {
  async getSupportSummary(): Promise<SupportSummary> {
    await wait(80);
    const warranties = warrantyInfos.map(item => ({...item, status: warrantyStatus(item.expiresAt)}));
    return {
      openTickets: supportTickets.filter(ticket => !['resolved', 'cancelled'].includes(ticket.status)).length,
      warrantyActive: warranties.filter(item => item.status === 'active' || item.status === 'expiring').length,
      maintenanceDue: maintenanceTasks.filter(task => task.status === 'overdue' || (task.status !== 'done' && task.dueAt <= now() + days(7))).length,
      packagesGenerated: diagnosticPackages.length,
    };
  },

  async getSupportTickets(lockId?: string): Promise<SupportTicket[]> {
    await wait(120);
    return supportTickets
      .filter(ticket => !lockId || ticket.lockId === lockId)
      .sort((left, right) => Number(left.status === 'resolved') - Number(right.status === 'resolved') || right.updatedAt - left.updatedAt)
      .map(cloneTicket);
  },

  async createSupportTicket(input: CreateSupportTicketInput): Promise<SupportTicket | undefined> {
    await wait(180);
    const lock = await findLock(input.lockId);
    if (!lock) {
      return undefined;
    }
    const createdAt = now();
    const ticket: SupportTicket = {
      id: `support-${String(createdAt).slice(-8)}`,
      type: input.type,
      lockId: lock.id,
      lockName: lock.name,
      roomName: lock.roomName,
      title: input.title.trim() || 'Yêu cầu hỗ trợ kỹ thuật',
      description: input.description.trim() || 'Không có mô tả.',
      severity: input.severity,
      status: 'open',
      contactName: input.contactName.trim() || 'Người liên hệ',
      contactPhone: input.contactPhone.trim() || 'Chưa nhập',
      attachmentNames: input.attachmentNames ?? [],
      relatedAlertId: input.relatedAlertId,
      relatedIncidentTicketId: input.relatedIncidentTicketId,
      createdAt,
      updatedAt: createdAt,
    };
    supportTickets.unshift(ticket);
    await MockLockRepository.addAccessRecord({
      id: `record-support-ticket-${createdAt}`,
      lockId: lock.id,
      lockName: lock.name,
      roomName: lock.roomName,
      method: 'System',
      result: 'success',
      ticketId: ticket.id,
      actorName: 'Support Center',
      message: `Tạo support ticket ${ticket.id}: ${ticket.title}`,
      createdAt,
    });
    return cloneTicket(ticket);
  },

  async resolveSupportTicket(ticketId: string, note: string): Promise<SupportTicket | undefined> {
    await wait(150);
    const ticket = supportTickets.find(item => item.id === ticketId);
    if (!ticket) {
      return undefined;
    }
    ticket.status = 'resolved';
    ticket.resolutionNote = note.trim() || 'Đã xử lý từ Support Center mock.';
    ticket.resolvedAt = now();
    ticket.updatedAt = ticket.resolvedAt;
    await MockLockRepository.addAccessRecord({
      id: `record-support-resolve-${ticket.updatedAt}`,
      lockId: ticket.lockId,
      lockName: ticket.lockName,
      roomName: ticket.roomName,
      method: 'System',
      result: 'success',
      ticketId: ticket.id,
      actorName: 'Support Center',
      message: `Đóng support ticket ${ticket.id}`,
      createdAt: ticket.updatedAt,
    });
    return cloneTicket(ticket);
  },

  async getWarrantyInfo(lockId?: string): Promise<WarrantyInfo[]> {
    await wait(110);
    const locks = lockId ? [await findLock(lockId)].filter((item): item is AplusLock => Boolean(item)) : await MockLockRepository.getLocks('all');
    locks.forEach(lock => ensureWarrantyFor(lock));
    return warrantyInfos
      .filter(item => !lockId || item.lockId === lockId)
      .map(item => ({...item, status: warrantyStatus(item.expiresAt)}))
      .sort((left, right) => left.expiresAt - right.expiresAt)
      .map(cloneWarranty);
  },

  async getMaintenanceTasks(lockId?: string): Promise<MaintenanceTask[]> {
    await wait(110);
    return maintenanceTasks
      .filter(task => !lockId || task.lockId === lockId)
      .sort((left, right) => Number(left.status === 'done') - Number(right.status === 'done') || left.dueAt - right.dueAt)
      .map(cloneTask);
  },

  async createMaintenanceTask(input: CreateMaintenanceTaskInput): Promise<MaintenanceTask | undefined> {
    await wait(170);
    const lock = await findLock(input.lockId);
    if (!lock) {
      return undefined;
    }
    const createdAt = now();
    const task: MaintenanceTask = {
      id: `maint-${String(createdAt).slice(-8)}`,
      lockId: lock.id,
      lockName: lock.name,
      roomName: lock.roomName,
      type: input.type,
      title: input.title.trim() || 'Bảo trì định kỳ',
      status: input.dueAt < createdAt ? 'overdue' : 'scheduled',
      assignee: input.assignee.trim() || 'Kỹ thuật Aplus',
      dueAt: input.dueAt,
      checklist: input.checklist?.length ? input.checklist : ['Kiểm tra trạng thái khóa', 'Chạy diagnostic', 'Ghi chú kết quả'],
      relatedTicketId: input.relatedTicketId,
      createdAt,
      updatedAt: createdAt,
    };
    maintenanceTasks.unshift(task);
    await MockLockRepository.addAccessRecord({
      id: `record-maintenance-${createdAt}`,
      lockId: lock.id,
      lockName: lock.name,
      roomName: lock.roomName,
      method: 'System',
      result: 'success',
      ticketId: task.relatedTicketId,
      actorName: 'Maintenance Center',
      message: `Tạo maintenance task ${task.title}`,
      createdAt,
    });
    return cloneTask(task);
  },

  async completeMaintenanceTask(taskId: string, note: string): Promise<MaintenanceTask | undefined> {
    await wait(140);
    const task = maintenanceTasks.find(item => item.id === taskId);
    if (!task) {
      return undefined;
    }
    task.status = 'done';
    task.note = note.trim() || 'Đã hoàn tất bảo trì.';
    task.completedAt = now();
    task.updatedAt = task.completedAt;
    await MockLockRepository.addAccessRecord({
      id: `record-maintenance-done-${task.updatedAt}`,
      lockId: task.lockId,
      lockName: task.lockName,
      roomName: task.roomName,
      method: 'System',
      result: 'success',
      ticketId: task.relatedTicketId,
      actorName: 'Maintenance Center',
      message: `Hoàn tất maintenance task ${task.title}`,
      createdAt: task.updatedAt,
    });
    return cloneTask(task);
  },

  async exportDiagnosticPackage(lockId?: string): Promise<DiagnosticPackage | undefined> {
    await wait(240);
    const lock = await fallbackLock(lockId);
    if (!lock) {
      return undefined;
    }
    const [diagnostic, records, alerts, incidentTickets] = await Promise.all([
      MockLockRepository.getDeviceDiagnostic(lock.id),
      getRecentRecords(lock.id),
      getRelatedAlerts(lock.id),
      getRelatedIncidentTickets(lock.id),
    ]);
    const createdAt = now();
    const payload = {
      packageVersion: 'batch-28-support-diagnostic-v1',
      createdAt,
      appVersion: 'Aplus Lock mock 1.0',
      device: {
        lockId: lock.id,
        lockName: lock.name,
        serial: lock.serial,
        model: lock.hardwareModel,
        firmwareVersion: lock.firmwareVersion,
        connectionState: lock.connectionState,
        gatewayOnline: lock.gatewayOnline,
        gatewayName: lock.gatewayName,
        signalPercent: lock.signalPercent,
        batteryPercent: lock.batteryPercent,
      },
      diagnostic,
      recentRecords: records.map(redactRecord),
      alerts: alerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        status: alert.status,
        eventCount: alert.eventCount,
        title: alert.title,
        relatedRecordIds: alert.relatedRecordIds,
      })),
      incidentTickets: incidentTickets.map(ticket => ({
        id: ticket.id,
        status: ticket.status,
        priority: ticket.priority,
        assignee: ticket.assignee,
        dueAt: ticket.dueAt,
      })),
      otaLog: {
        currentVersion: lock.firmwareVersion,
        updateAvailable: diagnostic?.firmware.updateAvailable ?? false,
        latestVersion: diagnostic?.firmware.latestVersion,
      },
    };
    const pkg: DiagnosticPackage = {
      id: `diag-${lock.id}-${String(createdAt).slice(-7)}`,
      lockId: lock.id,
      lockName: lock.name,
      roomName: lock.roomName,
      status: 'redacted',
      fileName: `aplus-diagnostic-${lock.serial}-${String(createdAt)}.json`,
      createdAt,
      recordCount: records.length,
      alertCount: alerts.length,
      commandCount: records.filter(record => Boolean(record.commandId)).length,
      redactedFields: ['password', 'pinRaw', 'biometricTemplate', 'faceImage', 'credentialSecret', 'sourceIp'],
      content: JSON.stringify(payload, null, 2),
      summary: `${lock.name}: ${diagnostic?.healthScore ?? 100}/100 health, ${alerts.length} alert, ${records.length} recent record.`,
    };
    diagnosticPackages.unshift(pkg);
    await MockLockRepository.addAccessRecord({
      id: `record-diagnostic-package-${createdAt}`,
      lockId: lock.id,
      lockName: lock.name,
      roomName: lock.roomName,
      method: 'System',
      result: 'success',
      actorName: 'Support Center',
      message: `Xuất diagnostic package ${pkg.fileName} đã redaction`,
      createdAt,
    });
    return clonePackage(pkg);
  },

  async getDiagnosticPackages(lockId?: string): Promise<DiagnosticPackage[]> {
    await wait(90);
    return diagnosticPackages
      .filter(pkg => !lockId || pkg.lockId === lockId)
      .sort((left, right) => right.createdAt - left.createdAt)
      .map(clonePackage);
  },
};

import {MockCredentialRepository} from './MockCredentialRepository';
import {MockLockRepository} from './MockLockRepository';
import type {AccessRecord} from '@/types/lock';
import type {
  AccessFactor,
  AccessRuleSummary,
  ClassSchedule,
  ClassScheduleImportRow,
  CombinationRule,
  CombinationRuleInput,
  CombinationSimulationInput,
  CombinationSimulationResult,
  NormallyOpenInput,
  NormallyOpenSchedule,
  RuleRiskLevel,
  ScheduleException,
  ScheduleExceptionType,
  Weekday,
} from '@/types/accessRule';

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const day = 1000 * 60 * 60 * 24;
const actorName = 'Admin Aplus';
const week: Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR'];
const allWeek: Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

const factorLabels: Record<AccessFactor, string> = {
  pin: 'PIN',
  card: 'Card',
  fingerprint: 'Fingerprint',
  face: 'Face',
  app: 'App',
};

const combinationFactors: Record<CombinationRule['type'], AccessFactor[]> = {
  pin_card: ['pin', 'card'],
  app_fingerprint: ['app', 'fingerprint'],
  face_pin: ['face', 'pin'],
  card_fingerprint: ['card', 'fingerprint'],
};

const combinationTitle: Record<CombinationRule['type'], string> = {
  pin_card: 'PIN + thẻ',
  app_fingerprint: 'App + vân tay',
  face_pin: 'Khuôn mặt + PIN',
  card_fingerprint: 'Thẻ + vân tay',
};

let combinationRules: CombinationRule[] = [
  {
    id: 'combo-hotel-701-pin-card',
    type: 'pin_card',
    title: 'Ca lễ tân · PIN + thẻ',
    factors: ['pin', 'card'],
    lockId: 'lock-hotel-0701',
    lockName: 'Phòng khách sạn 701',
    roomName: 'Phòng 701',
    ownerId: 'person-subadmin-hotel',
    ownerName: 'Quản lý khách sạn',
    status: 'active',
    schedule: {daysOfWeek: allWeek, startTime: '07:00', endTime: '22:00', timezone: 'Asia/Ho_Chi_Minh', startsAt: Date.now() - day * 3, endsAt: Date.now() + day * 45},
    riskLevel: 'safe',
    riskWarnings: [],
    createdAt: Date.now() - day * 3,
    updatedAt: Date.now() - day * 2,
    syncState: 'synced',
    credentialId: 'cred-combo-hotel-701-pin-card',
    lastUsedAt: Date.now() - 1000 * 60 * 160,
  },
  {
    id: 'combo-office-face-pin',
    type: 'face_pin',
    title: 'Server room · Face + PIN',
    factors: ['face', 'pin'],
    lockId: 'lock-office-server',
    lockName: 'Phòng server',
    roomName: 'Server Room',
    ownerId: 'person-staff-it',
    ownerName: 'Nhân sự IT',
    status: 'active',
    schedule: {daysOfWeek: week, startTime: '08:00', endTime: '18:00', timezone: 'Asia/Ho_Chi_Minh', startsAt: Date.now() - day * 8, endsAt: Date.now() + day * 90},
    riskLevel: 'safe',
    riskWarnings: [],
    createdAt: Date.now() - day * 8,
    updatedAt: Date.now() - day * 5,
    syncState: 'synced',
    credentialId: 'cred-combo-office-face-pin',
  },
];

let normallyOpenSchedules: NormallyOpenSchedule[] = [
  {
    id: 'normal-hotel-lobby-0701',
    title: 'Khung giờ housekeeping tầng 7',
    lockId: 'lock-hotel-0701',
    lockName: 'Phòng khách sạn 701',
    roomName: 'Phòng 701',
    status: 'active',
    schedule: {daysOfWeek: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA'], startTime: '09:00', endTime: '11:30', timezone: 'Asia/Ho_Chi_Minh', startsAt: Date.now() - day * 4, endsAt: Date.now() + day * 30},
    outsideMode: 'autoLock',
    riskLevel: 'safe',
    riskWarnings: [],
    createdAt: Date.now() - day * 4,
    updatedAt: Date.now() - day * 2,
    lastAppliedAt: Date.now() - 1000 * 60 * 90,
    syncState: 'synced',
  },
  {
    id: 'normal-office-risk',
    title: 'Cửa văn phòng mở cả ngày',
    lockId: 'lock-office-meeting',
    lockName: 'Cửa văn phòng chính',
    roomName: 'Meeting Crimson',
    status: 'paused',
    schedule: {daysOfWeek: allWeek, startTime: '00:00', endTime: '23:59', timezone: 'Asia/Ho_Chi_Minh', startsAt: Date.now() - day, endsAt: Date.now() + day * 5},
    outsideMode: 'manualLock',
    riskLevel: 'danger',
    riskWarnings: ['Lịch mở gần như cả ngày.', 'Áp dụng cả cuối tuần, cần Owner duyệt trước khi bật.'],
    createdAt: Date.now() - day,
    updatedAt: Date.now() - 1000 * 60 * 180,
    syncState: 'pending',
  },
];

let classSchedules: ClassSchedule[] = [
  {
    id: 'class-lab-mon-0701',
    type: 'class',
    title: 'Lớp thực hành IoT A1',
    ownerName: 'Giảng viên Nguyễn Minh',
    lockId: 'lock-hotel-0701',
    lockName: 'Phòng khách sạn 701',
    roomName: 'Phòng 701',
    schedule: {daysOfWeek: ['MO', 'WE'], startTime: '13:00', endTime: '15:00', timezone: 'Asia/Ho_Chi_Minh', startsAt: Date.now() - day * 2, endsAt: Date.now() + day * 40},
    status: 'active',
    createdAt: Date.now() - day * 2,
    updatedAt: Date.now() - day,
  },
  {
    id: 'shift-cleaner-802',
    type: 'shift',
    title: 'Ca dọn phòng chiều',
    ownerName: 'Dọn phòng ca sáng',
    lockId: 'lock-hotel-0802',
    lockName: 'Phòng khách sạn 802',
    roomName: 'Phòng 802',
    schedule: {daysOfWeek: allWeek, startTime: '14:00', endTime: '16:00', timezone: 'Asia/Ho_Chi_Minh', startsAt: Date.now() - day * 10, endsAt: Date.now() + day * 10},
    status: 'active',
    createdAt: Date.now() - day * 10,
    updatedAt: Date.now() - day * 3,
  },
];

let exceptions: ScheduleException[] = [
  {
    id: 'exception-holiday-001',
    type: 'holiday',
    title: 'Ngày bảo trì khóa tầng 7',
    lockId: 'lock-hotel-0701',
    lockName: 'Phòng khách sạn 701',
    date: new Date(Date.now() + day * 2).toISOString().slice(0, 10),
    fromTime: '00:00',
    toTime: '23:59',
    note: 'Tắt lịch mở tự động để kỹ thuật bảo trì.',
    createdAt: Date.now() - 1000 * 60 * 40,
  },
];

function cloneRule(rule: CombinationRule): CombinationRule {
  return {...rule, factors: [...rule.factors], riskWarnings: [...rule.riskWarnings], schedule: {...rule.schedule, daysOfWeek: [...rule.schedule.daysOfWeek]}};
}

function cloneOpen(schedule: NormallyOpenSchedule): NormallyOpenSchedule {
  return {...schedule, riskWarnings: [...schedule.riskWarnings], schedule: {...schedule.schedule, daysOfWeek: [...schedule.schedule.daysOfWeek]}};
}

function cloneClass(schedule: ClassSchedule): ClassSchedule {
  return {...schedule, schedule: {...schedule.schedule, daysOfWeek: [...schedule.schedule.daysOfWeek]}};
}

function cloneException(exception: ScheduleException): ScheduleException {
  return {...exception};
}

function parseMinutes(time: string) {
  const [hourRaw, minuteRaw] = time.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return 0;
  }
  return hour * 60 + minute;
}

function timeWindowMinutes(startTime: string, endTime: string) {
  const start = parseMinutes(startTime);
  const end = parseMinutes(endTime);
  if (end >= start) {
    return end - start;
  }
  return 24 * 60 - start + end;
}

function isAllDay(startTime: string, endTime: string) {
  return timeWindowMinutes(startTime, endTime) >= 23 * 60 + 30;
}

function getWeekdayCode(date = new Date()): Weekday {
  const dayIndex = date.getDay();
  return ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][dayIndex] as Weekday;
}

function isNowInside(days: Weekday[], startTime: string, endTime: string, date = new Date()) {
  if (!days.includes(getWeekdayCode(date))) {
    return false;
  }
  const nowMinutes = date.getHours() * 60 + date.getMinutes();
  const start = parseMinutes(startTime);
  const end = parseMinutes(endTime);
  if (end >= start) {
    return nowMinutes >= start && nowMinutes <= end;
  }
  return nowMinutes >= start || nowMinutes <= end;
}

function buildRisk(startTime: string, endTime: string, daysOfWeek: Weekday[], factorCount = 2): {riskLevel: RuleRiskLevel; riskWarnings: string[]} {
  const warnings: string[] = [];
  const minutes = timeWindowMinutes(startTime, endTime);
  if (isAllDay(startTime, endTime)) {
    warnings.push('Lịch gần như mở/có hiệu lực cả ngày.');
  }
  if (daysOfWeek.length >= 7 && minutes >= 10 * 60) {
    warnings.push('Áp dụng cả tuần với khung giờ dài, cần kiểm tra phạm vi phòng.');
  }
  if (factorCount < 2) {
    warnings.push('Tổ hợp quá yếu, cần ít nhất 2 yếu tố xác thực.');
  }
  if (minutes <= 0) {
    warnings.push('Khung giờ không hợp lệ.');
  }
  return {
    riskLevel: warnings.some(item => item.includes('cả ngày') || item.includes('yếu')) ? 'danger' : warnings.length ? 'warning' : 'safe',
    riskWarnings: warnings,
  };
}

async function getOwner(ownerId: string) {
  const people = await MockCredentialRepository.getPeople();
  return people.find(person => person.id === ownerId) ?? people[0];
}

async function addRecord(record: Omit<AccessRecord, 'id' | 'createdAt'>) {
  const next: AccessRecord = {
    id: `record-batch19-${Date.now()}-${Math.round(Math.random() * 999)}`,
    createdAt: Date.now(),
    ...record,
  };
  await MockLockRepository.addAccessRecord(next);
  return next;
}

function normalizeDays(days: Weekday[]) {
  return days.length ? days : week;
}

function formatFactors(factors: AccessFactor[]) {
  return factors.map(item => factorLabels[item]).join(' + ');
}

function overlaps(aDays: Weekday[], aStart: string, aEnd: string, bDays: Weekday[], bStart: string, bEnd: string) {
  if (!aDays.some(dayCode => bDays.includes(dayCode))) {
    return false;
  }
  const aS = parseMinutes(aStart);
  const aE = parseMinutes(aEnd);
  const bS = parseMinutes(bStart);
  const bE = parseMinutes(bEnd);
  return aS < bE && bS < aE;
}

function parseDays(value: string): Weekday[] {
  const valid = new Set<Weekday>(allWeek);
  const parsed = value.split(/[|, ]/).map(item => item.trim().toUpperCase()).filter(Boolean) as Weekday[];
  return parsed.filter(item => valid.has(item));
}

export const MockAccessRuleRepository = {
  async getCombinationRules(lockId?: string) {
    await wait(120);
    return combinationRules.filter(rule => !lockId || rule.lockId === lockId).map(cloneRule);
  },

  async createCombinationRule(input: CombinationRuleInput) {
    await wait(180);
    const lock = await MockLockRepository.getLockById(input.lockId);
    if (!lock) {
      throw new Error('Không tìm thấy khóa để tạo rule.');
    }
    if (!lock.permission.canManageCredentials) {
      throw new Error('Tài khoản hiện tại không có quyền tạo rule mở khóa kết hợp.');
    }
    const factors = combinationFactors[input.type];
    if (factors.includes('fingerprint') && !lock.capabilities.supportsFingerprint) {
      throw new Error('Khóa này không hỗ trợ vân tay.');
    }
    if (factors.includes('face') && !lock.capabilities.supportsFace) {
      throw new Error('Khóa này không hỗ trợ Face Unlock.');
    }
    if (factors.includes('card') && !lock.capabilities.supportsCard) {
      throw new Error('Khóa này không hỗ trợ thẻ.');
    }
    const owner = await getOwner(input.ownerId);
    const risk = buildRisk(input.startTime, input.endTime, normalizeDays(input.daysOfWeek), factors.length);
    const now = Date.now();
    const rule: CombinationRule = {
      id: `combo-${now}`,
      type: input.type,
      title: `${combinationTitle[input.type]} · ${lock.roomName}`,
      factors,
      lockId: lock.id,
      lockName: lock.name,
      roomName: lock.roomName,
      ownerId: owner.id,
      ownerName: owner.fullName,
      status: lock.connectionState === 'offline' ? 'draft' : 'active',
      schedule: {
        daysOfWeek: normalizeDays(input.daysOfWeek),
        startTime: input.startTime,
        endTime: input.endTime,
        timezone: input.timezone || 'Asia/Ho_Chi_Minh',
        startsAt: input.startsAt ?? now,
        endsAt: input.endsAt,
      },
      ...risk,
      createdAt: now,
      updatedAt: now,
      syncState: lock.connectionState === 'offline' ? 'pending' : 'synced',
      credentialId: `cred-combo-${now}`,
    };
    combinationRules.unshift(rule);
    await MockCredentialRepository.upsertAccessCredential({
      id: rule.credentialId!,
      type: 'combination',
      title: rule.title,
      ownerId: rule.ownerId,
      ownerName: rule.ownerName,
      lockId: rule.lockId,
      lockName: rule.lockName,
      scopeLabel: rule.roomName,
      status: rule.status === 'active' ? 'active' : 'draft',
      syncState: rule.syncState,
      expiresAt: rule.schedule.endsAt,
    });
    await addRecord({lockId: lock.id, lockName: lock.name, roomName: lock.roomName, method: 'System', result: 'success', actorName, message: `Tạo rule mở khóa kết hợp ${formatFactors(factors)} cho ${owner.fullName}.`, credentialId: rule.credentialId});
    return cloneRule(rule);
  },

  async setCombinationRuleStatus(ruleId: string, status: CombinationRule['status']) {
    await wait(120);
    let updated: CombinationRule | undefined;
    combinationRules = combinationRules.map(rule => {
      if (rule.id !== ruleId) {
        return rule;
      }
      updated = {...rule, status, updatedAt: Date.now(), syncState: status === 'revoked' ? 'synced' : rule.syncState};
      return updated;
    });
    if (updated?.credentialId && status === 'revoked') {
      await MockCredentialRepository.revokeCredential(updated.credentialId, actorName);
    }
    return updated ? cloneRule(updated) : undefined;
  },

  async simulateCombinationUnlock(input: CombinationSimulationInput): Promise<CombinationSimulationResult> {
    await wait(160);
    const rule = combinationRules.find(item => item.id === input.ruleId);
    if (!rule) {
      return {allowed: false, missingFactors: [], message: 'Không tìm thấy rule.'};
    }
    const missingFactors = rule.factors.filter(factor => !input.providedFactors.includes(factor));
    const lock = await MockLockRepository.getLockById(rule.lockId);
    const inTime = isNowInside(rule.schedule.daysOfWeek, rule.schedule.startTime, rule.schedule.endTime);
    const allowed = rule.status === 'active' && inTime && missingFactors.length === 0;
    const message = allowed
      ? `Đủ ${formatFactors(rule.factors)} trong khung giờ, mock unlock thành công.`
      : missingFactors.length
        ? `Bị chặn vì thiếu ${formatFactors(missingFactors)}.`
        : !inTime
          ? 'Bị chặn vì ngoài khung giờ rule.'
          : 'Rule chưa active hoặc đã bị thu hồi.';
    const record = await addRecord({
      lockId: rule.lockId,
      lockName: rule.lockName,
      roomName: rule.roomName,
      method: 'System',
      result: allowed ? 'success' : 'blocked',
      actorName: rule.ownerName,
      credentialId: rule.credentialId,
      failureReason: allowed ? undefined : message,
      message: `Combination unlock · ${message}`,
      batteryPercentAtEvent: lock?.batteryPercent,
      gatewayName: lock?.gatewayName,
    });
    if (allowed) {
      combinationRules = combinationRules.map(item => item.id === rule.id ? {...item, lastUsedAt: Date.now()} : item);
    }
    return {allowed, missingFactors, message, recordId: record.id};
  },

  async getNormallyOpenSchedules(lockId?: string) {
    await wait(120);
    return normallyOpenSchedules.filter(item => !lockId || item.lockId === lockId).map(cloneOpen);
  },

  async createNormallyOpenSchedule(input: NormallyOpenInput) {
    await wait(180);
    const lock = await MockLockRepository.getLockById(input.lockId);
    if (!lock) {
      throw new Error('Không tìm thấy khóa để tạo lịch mở thường xuyên.');
    }
    if (!lock.permission.canChangeSettings) {
      throw new Error('Tài khoản hiện tại không có quyền cài đặt lịch mở thường xuyên.');
    }
    const daysOfWeek = normalizeDays(input.daysOfWeek);
    const risk = buildRisk(input.startTime, input.endTime, daysOfWeek, 2);
    const now = Date.now();
    const schedule: NormallyOpenSchedule = {
      id: `normal-${now}`,
      title: input.title.trim() || `Normally Open · ${lock.roomName}`,
      lockId: lock.id,
      lockName: lock.name,
      roomName: lock.roomName,
      status: risk.riskLevel === 'danger' ? 'paused' : 'active',
      schedule: {daysOfWeek, startTime: input.startTime, endTime: input.endTime, timezone: input.timezone || 'Asia/Ho_Chi_Minh', startsAt: input.startsAt ?? now, endsAt: input.endsAt},
      outsideMode: input.outsideMode,
      ...risk,
      createdAt: now,
      updatedAt: now,
      syncState: lock.connectionState === 'offline' ? 'pending' : 'synced',
    };
    normallyOpenSchedules.unshift(schedule);
    await addRecord({lockId: lock.id, lockName: lock.name, roomName: lock.roomName, method: 'System', result: 'success', actorName, message: `Tạo lịch Normally Open ${schedule.schedule.startTime}-${schedule.schedule.endTime} (${schedule.schedule.timezone}).`});
    return cloneOpen(schedule);
  },

  async setNormallyOpenStatus(scheduleId: string, status: NormallyOpenSchedule['status']) {
    await wait(120);
    let updated: NormallyOpenSchedule | undefined;
    normallyOpenSchedules = normallyOpenSchedules.map(schedule => {
      if (schedule.id !== scheduleId) {
        return schedule;
      }
      updated = {...schedule, status, updatedAt: Date.now()};
      return updated;
    });
    return updated ? cloneOpen(updated) : undefined;
  },

  async evaluateNormallyOpen(scheduleId: string) {
    await wait(120);
    const schedule = normallyOpenSchedules.find(item => item.id === scheduleId);
    if (!schedule) {
      return {inside: false, message: 'Không tìm thấy lịch.'};
    }
    const inside = schedule.status === 'active' && isNowInside(schedule.schedule.daysOfWeek, schedule.schedule.startTime, schedule.schedule.endTime);
    if (inside) {
      normallyOpenSchedules = normallyOpenSchedules.map(item => item.id === schedule.id ? {...item, lastAppliedAt: Date.now()} : item);
    }
    const message = inside
      ? 'Đang trong giờ Normally Open, khóa giữ trạng thái mở theo lịch.'
      : schedule.outsideMode === 'autoLock'
        ? 'Ngoài giờ lịch, hệ thống sẽ auto-lock hoặc giữ khóa theo cài đặt auto-lock.'
        : 'Ngoài giờ lịch, không mở tự động.';
    await addRecord({lockId: schedule.lockId, lockName: schedule.lockName, roomName: schedule.roomName, method: 'System', result: inside ? 'success' : 'blocked', actorName, message: `Normally Open check · ${message}`});
    return {inside, message};
  },

  async getClassSchedules(lockId?: string) {
    await wait(120);
    return classSchedules.filter(item => !lockId || item.lockId === lockId).map(cloneClass);
  },

  async getScheduleExceptions(lockId?: string) {
    await wait(90);
    return exceptions.filter(item => !lockId || item.lockId === lockId).map(cloneException);
  },

  async addScheduleException(input: {lockId: string; type: ScheduleExceptionType; title: string; date: string; fromTime?: string; toTime?: string; note?: string}) {
    await wait(120);
    const lock = await MockLockRepository.getLockById(input.lockId);
    if (!lock) {
      throw new Error('Không tìm thấy khóa để tạo ngoại lệ.');
    }
    const exception: ScheduleException = {
      id: `exception-${Date.now()}`,
      type: input.type,
      title: input.title.trim() || 'Ngoại lệ lịch mở',
      lockId: lock.id,
      lockName: lock.name,
      date: input.date,
      fromTime: input.fromTime,
      toTime: input.toTime,
      note: input.note,
      createdAt: Date.now(),
    };
    exceptions.unshift(exception);
    await addRecord({lockId: lock.id, lockName: lock.name, roomName: lock.roomName, method: 'System', result: 'success', actorName, message: `Tạo ngoại lệ lịch: ${exception.title}.`});
    return cloneException(exception);
  },

  async previewClassScheduleImport(csvText: string): Promise<ClassScheduleImportRow[]> {
    await wait(100);
    const lines = csvText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    return lines.map((line, index) => {
      const [title = '', lockId = '', roomName = '', daysRaw = '', startTime = '', endTime = ''] = line.split(',').map(item => item.trim());
      const daysOfWeek = parseDays(daysRaw);
      const lockKnown = Boolean(lockId);
      const validTime = /^\d{2}:\d{2}$/.test(startTime) && /^\d{2}:\d{2}$/.test(endTime) && timeWindowMinutes(startTime, endTime) > 0;
      const hasOverlap = classSchedules.some(item => item.lockId === lockId && overlaps(item.schedule.daysOfWeek, item.schedule.startTime, item.schedule.endTime, daysOfWeek, startTime, endTime));
      const status = title && lockKnown && roomName && daysOfWeek.length && validTime && !hasOverlap ? 'valid' : 'error';
      const message = status === 'valid'
        ? 'Có thể import.'
        : hasOverlap
          ? 'Trùng lịch đang tồn tại.'
          : 'Thiếu cột hoặc sai định dạng. Cần: title,lockId,room,MO|WE,08:00,10:00';
      return {row: index + 1, title, lockId, roomName, daysOfWeek, startTime, endTime, status, message};
    });
  },

  async commitClassScheduleImport(csvText: string) {
    const preview = await this.previewClassScheduleImport(csvText);
    const validRows = preview.filter(row => row.status === 'valid');
    const now = Date.now();
    validRows.forEach(row => {
      classSchedules.unshift({
        id: `class-import-${now}-${row.row}`,
        type: 'class',
        title: row.title,
        ownerName: actorName,
        lockId: row.lockId,
        lockName: row.roomName,
        roomName: row.roomName,
        schedule: {daysOfWeek: row.daysOfWeek, startTime: row.startTime, endTime: row.endTime, timezone: 'Asia/Ho_Chi_Minh', startsAt: now, endsAt: now + day * 90},
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });
    });
    return preview;
  },

  async getSummary(): Promise<AccessRuleSummary> {
    await wait(80);
    const warningRules = [...combinationRules, ...normallyOpenSchedules].filter(item => item.riskLevel !== 'safe').length;
    return {
      combinationActive: combinationRules.filter(item => item.status === 'active').length,
      normallyOpenActive: normallyOpenSchedules.filter(item => item.status === 'active').length,
      classSchedulesActive: classSchedules.filter(item => item.status === 'active').length,
      warnings: warningRules,
      conflicts: classSchedules.filter(item => item.status === 'conflict').length,
    };
  },
};

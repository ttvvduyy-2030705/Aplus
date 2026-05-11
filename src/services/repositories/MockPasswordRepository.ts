import {MockCredentialRepository} from './MockCredentialRepository';
import {MockLockRepository} from './MockLockRepository';
import type {AccessRecord} from '@/types/lock';
import type {CreatePasswordInput, PasswordCredential, PasswordKind, PasswordPolicy, PasswordStatus, PasswordSummary, PasswordValidationResult, ScheduleRule} from '@/types/password';

const DAY = 1000 * 60 * 60 * 24;
const OPEN_END = Number.MAX_SAFE_INTEGER;

const passwordPolicy: PasswordPolicy = {
  minLength: 6,
  maxLength: 10,
  digitsOnly: true,
  allowDuplicateInSameLock: false,
};

const defaultSchedule: ScheduleRule = {
  enabled: true,
  daysOfWeek: [1, 2, 3, 4, 5],
  startTime: '08:00',
  endTime: '18:00',
  timezone: 'Asia/Ho_Chi_Minh',
  note: 'Áp dụng trong giờ làm việc',
};

let passwords: PasswordCredential[] = [
  {
    id: 'pwd-admin-520-main',
    lockId: 'lock-home-520',
    lockName: 'Căn hộ 520',
    roomName: 'Căn hộ 520',
    ownerId: 'person-owner-admin',
    ownerName: 'Admin Aplus',
    title: 'PIN quản trị 520',
    code: '520520',
    kind: 'permanent',
    status: 'active',
    syncState: 'synced',
    validFrom: Date.now() - 10 * DAY,
    createdAt: Date.now() - 10 * DAY,
    updatedAt: Date.now() - 10 * DAY,
    useCount: 7,
    lastUsedAt: Date.now() - 1000 * 60 * 60 * 8,
  },
  {
    id: 'pwd-guest-hotel-701',
    lockId: 'lock-hotel-0701',
    lockName: 'Phòng khách sạn 701',
    roomName: 'Phòng 701',
    ownerId: 'person-subadmin-hotel',
    ownerName: 'Quản lý khách sạn',
    title: 'Mã khách lưu trú 701',
    code: '701888',
    kind: 'guest',
    status: 'active',
    syncState: 'synced',
    validFrom: Date.now() - DAY,
    validTo: Date.now() + 2 * DAY,
    createdAt: Date.now() - DAY,
    updatedAt: Date.now() - DAY,
    useCount: 2,
    maxUseCount: 20,
  },
  {
    id: 'pwd-office-cleaner-cycle',
    lockId: 'lock-office-meeting',
    lockName: 'Phòng họp Crimson',
    roomName: 'Meeting Crimson',
    ownerId: 'person-cleaner-01',
    ownerName: 'Dọn phòng ca sáng',
    title: 'Mã chu kỳ dọn phòng',
    code: '246810',
    kind: 'recurring',
    status: 'active',
    syncState: 'pending',
    validFrom: Date.now() - 2 * DAY,
    validTo: Date.now() + 30 * DAY,
    scheduleRule: defaultSchedule,
    createdAt: Date.now() - 2 * DAY,
    updatedAt: Date.now() - 1000 * 60 * 30,
    useCount: 0,
  },
  {
    id: 'pwd-one-time-used',
    lockId: 'lock-home-1208',
    lockName: 'Cửa chính A1208',
    roomName: 'Căn A1208',
    ownerId: 'person-tenant-520',
    ownerName: 'Khách thuê căn 520',
    title: 'Mã một lần đã dùng',
    code: '135791',
    kind: 'oneTime',
    status: 'used',
    syncState: 'synced',
    validFrom: Date.now() - 5 * DAY,
    validTo: Date.now() + DAY,
    createdAt: Date.now() - 5 * DAY,
    updatedAt: Date.now() - 3 * DAY,
    useCount: 1,
    maxUseCount: 1,
    lastUsedAt: Date.now() - 3 * DAY,
  },
];

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function clonePassword(item: PasswordCredential): PasswordCredential {
  return {
    ...item,
    scheduleRule: item.scheduleRule ? {...item.scheduleRule, daysOfWeek: [...item.scheduleRule.daysOfWeek]} : undefined,
  };
}

function nowStatus(item: PasswordCredential, at = Date.now()): PasswordStatus {
  if (item.status === 'revoked' || item.status === 'pendingRevoke' || item.status === 'used' || item.status === 'paused' || item.status === 'pendingSync') {
    return item.status;
  }
  if (item.validTo && item.validTo < at) {
    return 'expired';
  }
  return item.status;
}

function activeForDuplicate(item: PasswordCredential) {
  const status = nowStatus(item);
  return status === 'active' || status === 'pendingSync' || status === 'paused';
}

function normalizeDigits(code: string) {
  return code.replace(/\D/g, '');
}

function windowsOverlap(aStart: number, aEnd: number | undefined, bStart: number, bEnd: number | undefined) {
  const aEndSafe = aEnd ?? OPEN_END;
  const bEndSafe = bEnd ?? OPEN_END;
  return aStart <= bEndSafe && bStart <= aEndSafe;
}

function parseClockToMinutes(value: string) {
  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return undefined;
  }
  return hour * 60 + minute;
}

function isScheduleActive(schedule: ScheduleRule | undefined, at = Date.now()) {
  if (!schedule || !schedule.enabled) {
    return true;
  }
  const date = new Date(at);
  const day = date.getDay();
  if (!schedule.daysOfWeek.includes(day)) {
    return false;
  }
  const start = parseClockToMinutes(schedule.startTime);
  const end = parseClockToMinutes(schedule.endTime);
  if (start === undefined || end === undefined) {
    return false;
  }
  const current = date.getHours() * 60 + date.getMinutes();
  if (start === end) {
    return true;
  }
  if (start < end) {
    return current >= start && current <= end;
  }
  return current >= start || current <= end;
}

function getUseBlockReason(item: PasswordCredential, at = Date.now()) {
  const status = nowStatus(item, at);
  if (status !== 'active' && status !== 'pendingSync') {
    return `trạng thái ${getPasswordStatusLabel(status)}`;
  }
  if (item.validFrom > at) {
    return 'chưa đến thời gian hiệu lực';
  }
  if (item.validTo && item.validTo < at) {
    return 'đã hết hạn';
  }
  if (!isScheduleActive(item.scheduleRule, at)) {
    return 'nằm ngoài lịch chu kỳ';
  }
  return undefined;
}

function validatePasswordCode(code: string, lockId: string, ignorePasswordId?: string, validFrom = Date.now(), validTo?: number): PasswordValidationResult {
  const normalized = normalizeDigits(code);
  if (normalized !== code) {
    return {ok: false, message: 'Mã chỉ được gồm chữ số.'};
  }
  if (code.length < passwordPolicy.minLength || code.length > passwordPolicy.maxLength) {
    return {ok: false, message: `Mã phải dài ${passwordPolicy.minLength}-${passwordPolicy.maxLength} số.`};
  }
  if (!passwordPolicy.allowDuplicateInSameLock) {
    const duplicated = passwords.some(item => (
      item.id !== ignorePasswordId &&
      item.lockId === lockId &&
      item.code === code &&
      activeForDuplicate(item) &&
      windowsOverlap(item.validFrom, item.validTo, validFrom, validTo)
    ));
    if (duplicated) {
      return {ok: false, message: 'Mã này đang tồn tại trên cùng khóa và bị trùng thời hạn hiệu lực.'};
    }
  }
  return {ok: true};
}

async function syncPasswordCredential(item: PasswordCredential) {
  await MockCredentialRepository.upsertPasswordCredential({
    passwordId: item.id,
    title: item.title,
    ownerId: item.ownerId,
    ownerName: item.ownerName,
    lockId: item.lockId,
    lockName: item.lockName,
    roomName: item.roomName,
    status: nowStatus(item),
    syncState: item.syncState,
    expiresAt: item.validTo,
  });
}

export function getPasswordKindLabel(kind: PasswordKind) {
  switch (kind) {
    case 'permanent':
      return 'Mã thường';
    case 'temporary':
      return 'Mã tạm thời';
    case 'oneTime':
      return 'Mã một lần';
    case 'recurring':
      return 'Mã chu kỳ';
    case 'staff':
      return 'Mã nhân viên';
    case 'guest':
      return 'Mã khách';
    default:
      return kind;
  }
}

export function getPasswordStatusLabel(status: PasswordStatus) {
  switch (status) {
    case 'active':
      return 'Đang hoạt động';
    case 'pendingSync':
      return 'Chờ đồng bộ';
    case 'pendingRevoke':
      return 'Chờ thu hồi';
    case 'paused':
      return 'Tạm dừng';
    case 'used':
      return 'Đã dùng';
    case 'expired':
      return 'Hết hạn';
    case 'revoked':
      return 'Đã thu hồi';
    default:
      return status;
  }
}

export const MockPasswordRepository = {
  policy: passwordPolicy,
  defaultSchedule,

  generateCode(length = 6) {
    const actualLength = Math.max(passwordPolicy.minLength, Math.min(passwordPolicy.maxLength, length));
    let output = '';
    for (let index = 0; index < actualLength; index += 1) {
      output += String(Math.floor(Math.random() * 10));
    }
    return output;
  },

  validateCode: validatePasswordCode,

  async getPasswords(lockId?: string) {
    await wait(160);
    return passwords
      .filter(item => !lockId || item.lockId === lockId)
      .map(item => ({...clonePassword(item), status: nowStatus(item)}));
  },

  async getPasswordById(passwordId: string) {
    await wait(100);
    const item = passwords.find(password => password.id === passwordId);
    return item ? {...clonePassword(item), status: nowStatus(item)} : undefined;
  },

  async getSummary(lockId?: string): Promise<PasswordSummary> {
    await wait(80);
    const list = passwords.filter(item => !lockId || item.lockId === lockId).map(item => ({...item, status: nowStatus(item)}));
    return {
      total: list.length,
      active: list.filter(item => item.status === 'active' || item.status === 'pendingSync').length,
      pending: list.filter(item => item.status === 'pendingSync' || item.status === 'pendingRevoke').length,
      revoked: list.filter(item => item.status === 'revoked' || item.status === 'pendingRevoke').length,
      expired: list.filter(item => item.status === 'expired').length,
      used: list.filter(item => item.status === 'used').length,
    };
  },

  async createPassword(input: CreatePasswordInput) {
    await wait(240);
    const validation = validatePasswordCode(input.code, input.lockId, undefined, input.validFrom, input.validTo);
    if (!validation.ok) {
      throw new Error(validation.message);
    }
    const [lock, people] = await Promise.all([
      MockLockRepository.getLockById(input.lockId),
      MockCredentialRepository.getPeople(),
    ]);
    if (!lock) {
      throw new Error('Không tìm thấy khóa để tạo mật khẩu.');
    }
    if (!lock.permission.canManageCredentials) {
      throw new Error('Tài khoản hiện tại không có quyền tạo mật khẩu cho khóa này.');
    }
    const owner = people.find(person => person.id === input.ownerId);
    if (!owner || !owner.active) {
      throw new Error('Người nhận không hợp lệ hoặc đã hết hiệu lực.');
    }
    const now = Date.now();
    const credential: PasswordCredential = {
      id: `pwd-${input.kind}-${now}`,
      lockId: lock.id,
      lockName: lock.name,
      roomName: lock.roomName,
      ownerId: owner.id,
      ownerName: owner.fullName,
      title: input.title.trim() || `${getPasswordKindLabel(input.kind)} · ${owner.fullName}`,
      code: input.code,
      kind: input.kind,
      status: input.offline ? 'pendingSync' : 'active',
      syncState: input.offline ? 'pending' : 'synced',
      validFrom: input.validFrom,
      validTo: input.validTo,
      scheduleRule: input.scheduleRule,
      createdAt: now,
      updatedAt: now,
      useCount: 0,
      maxUseCount: input.kind === 'oneTime' ? 1 : undefined,
    };
    passwords.unshift(credential);
    await syncPasswordCredential(credential);
    return clonePassword(credential);
  },

  async revokePassword(passwordId: string, offline: boolean, revokedBy = 'Admin Aplus') {
    await wait(180);
    let updated: PasswordCredential | undefined;
    passwords = passwords.map(item => {
      if (item.id !== passwordId) {
        return item;
      }
      updated = {
        ...item,
        status: offline ? 'pendingRevoke' : 'revoked',
        syncState: offline ? 'pending' : 'synced',
        revokedAt: Date.now(),
        revokedBy,
        updatedAt: Date.now(),
      };
      return updated;
    });
    if (updated) {
      await MockCredentialRepository.updatePasswordCredentialStatus(updated.id, updated.status, updated.syncState, revokedBy);
    }
    return updated ? clonePassword(updated) : undefined;
  },

  async pausePassword(passwordId: string, reason = 'Tạm dừng bởi admin') {
    await wait(120);
    let updated: PasswordCredential | undefined;
    passwords = passwords.map(item => {
      if (item.id !== passwordId) {
        return item;
      }
      updated = {...item, status: 'paused', pauseReason: reason, updatedAt: Date.now()};
      return updated;
    });
    if (updated) {
      await MockCredentialRepository.updatePasswordCredentialStatus(updated.id, updated.status, updated.syncState);
    }
    return updated ? clonePassword(updated) : undefined;
  },

  async resumePassword(passwordId: string) {
    await wait(120);
    let updated: PasswordCredential | undefined;
    passwords = passwords.map(item => {
      if (item.id !== passwordId) {
        return item;
      }
      const nextStatus: PasswordStatus = item.validTo && item.validTo < Date.now() ? 'expired' : 'active';
      updated = {...item, status: nextStatus, pauseReason: undefined, updatedAt: Date.now()};
      return updated;
    });
    if (updated) {
      await MockCredentialRepository.updatePasswordCredentialStatus(updated.id, updated.status, updated.syncState);
    }
    return updated ? clonePassword(updated) : undefined;
  },

  async extendPassword(passwordId: string, days: number) {
    await wait(120);
    let updated: PasswordCredential | undefined;
    passwords = passwords.map(item => {
      if (item.id !== passwordId) {
        return item;
      }
      const base = item.validTo && item.validTo > Date.now() ? item.validTo : Date.now();
      updated = {...item, validTo: base + days * DAY, status: item.status === 'expired' ? 'active' : item.status, updatedAt: Date.now()};
      return updated;
    });
    if (updated) {
      await syncPasswordCredential(updated);
    }
    return updated ? clonePassword(updated) : undefined;
  },

  async updateSchedule(passwordId: string, scheduleRule: ScheduleRule) {
    await wait(120);
    let updated: PasswordCredential | undefined;
    passwords = passwords.map(item => {
      if (item.id !== passwordId) {
        return item;
      }
      updated = {...item, kind: 'recurring', scheduleRule, updatedAt: Date.now()};
      return updated;
    });
    if (updated) {
      await syncPasswordCredential(updated);
    }
    return updated ? clonePassword(updated) : undefined;
  },

  async mockUsePassword(passwordId: string): Promise<{record: AccessRecord; password?: PasswordCredential}> {
    await wait(180);
    const item = passwords.find(password => password.id === passwordId);
    if (!item) {
      throw new Error('Không tìm thấy mật khẩu.');
    }
    const at = Date.now();
    const blockedReason = getUseBlockReason(item, at);
    const success = !blockedReason;
    let updated: PasswordCredential | undefined;
    passwords = passwords.map(password => {
      if (password.id !== passwordId) {
        return password;
      }
      const nextUsedCount = success ? password.useCount + 1 : password.useCount;
      const nextStatus = success && password.kind === 'oneTime' ? 'used' : nowStatus(password, at);
      updated = {
        ...password,
        status: nextStatus,
        useCount: nextUsedCount,
        lastUsedAt: success ? at : password.lastUsedAt,
        updatedAt: at,
      };
      return updated;
    });
    if (updated) {
      await MockCredentialRepository.updatePasswordCredentialStatus(updated.id, updated.status, updated.syncState);
    }
    const record: AccessRecord = {
      id: `record-password-${Date.now()}`,
      lockId: item.lockId,
      lockName: item.lockName,
      roomName: item.roomName,
      method: 'PIN',
      result: success ? 'success' : 'failed',
      actorName: item.ownerName,
      message: success ? `${item.title} mở khóa thành công bằng mã PIN mock.` : `${item.title} bị từ chối vì ${blockedReason}.`,
      createdAt: Date.now(),
    };
    await MockLockRepository.addAccessRecord(record);
    return {record, password: updated ? clonePassword(updated) : undefined};
  },
};

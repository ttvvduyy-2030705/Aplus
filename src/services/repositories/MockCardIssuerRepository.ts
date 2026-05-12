import {MockCredentialRepository} from './MockCredentialRepository';
import {MockLockRepository} from './MockLockRepository';
import type {
  BatchIssueJob,
  BatchIssuePreviewRow,
  CardIssuerDevice,
  CardIssuerSummary,
  CreateEmergencyCardInput,
  EmergencyCard,
  InstallationCardJob,
  TimeCalibrationCard,
} from '@/types/cardIssuer';
import type {AplusLock} from '@/types/lock';
import type {Person} from '@/types/credential';

const day = 24 * 60 * 60 * 1000;
const now = Date.now();
let sequence = 9000;

let issuerDevices: CardIssuerDevice[] = [
  {
    id: 'issuer-frontdesk-01',
    name: 'Front Desk Encoder 01',
    serial: 'ISSUER-FD-0001',
    location: 'Quầy lễ tân Aplus Hotel',
    status: 'online',
    batteryPercent: 91,
    firmwareVersion: '2.4.1',
    lastSeenAt: now - 1000 * 60 * 3,
  },
  {
    id: 'issuer-install-team',
    name: 'Installation Kit A',
    serial: 'ISSUER-INSTALL-A',
    location: 'Đội lắp đặt tầng 7',
    status: 'busy',
    batteryPercent: 68,
    firmwareVersion: '2.3.9',
    lastSeenAt: now - 1000 * 60 * 18,
  },
  {
    id: 'issuer-backup',
    name: 'Backup Encoder',
    serial: 'ISSUER-BACKUP-09',
    location: 'Kho kỹ thuật',
    status: 'offline',
    batteryPercent: 17,
    firmwareVersion: '2.1.0',
    lastSeenAt: now - day,
  },
];

let installationJobs: InstallationCardJob[] = [
  {
    id: 'install-job-floor-7',
    issuerDeviceId: 'issuer-install-team',
    title: 'Installation card tầng 7',
    lockIds: ['lock-hotel-0701'],
    lockNames: ['Phòng khách sạn 701'],
    status: 'issued',
    createdAt: now - day * 2,
    completedAt: now - day * 2 + 1000 * 60 * 20,
    syncState: 'synced',
    auditId: 'record-cardissuer-install-job-floor-7',
  },
];

let timeCards: TimeCalibrationCard[] = [
  {
    id: 'time-card-701',
    issuerDeviceId: 'issuer-frontdesk-01',
    lockId: 'lock-hotel-0701',
    lockName: 'Phòng khách sạn 701',
    timezone: 'Asia/Bangkok',
    timezoneOffsetMinutes: 420,
    status: 'issued',
    createdAt: now - day,
    calibratedAt: now - day + 1000 * 60 * 10,
    syncState: 'synced',
  },
];

let emergencyCards: EmergencyCard[] = [
  {
    id: 'emergency-card-ops-520',
    issuerDeviceId: 'issuer-frontdesk-01',
    cardId: 'APL-EMG-0520-01',
    lockId: 'lock-home-520',
    lockName: 'Căn hộ 520',
    roomName: 'Căn hộ 520',
    ownerId: 'person-owner-01',
    ownerName: 'Chủ nhà Aplus',
    kind: 'emergency',
    status: 'active',
    validFrom: now - 1000 * 60 * 15,
    validTo: now + 1000 * 60 * 45,
    authMethod: 'appPin',
    createdAt: now - 1000 * 60 * 15,
    syncState: 'synced',
  },
];

let batchJobs: BatchIssueJob[] = [];

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function cloneDevice(item: CardIssuerDevice): CardIssuerDevice {
  return {...item};
}

function cloneEmergency(item: EmergencyCard): EmergencyCard {
  return {...item};
}

function cloneBatch(item: BatchIssueJob): BatchIssueJob {
  return {...item, rows: item.rows.map(row => ({...row, errors: [...row.errors]}))};
}

function isActiveEmergency(card: EmergencyCard) {
  return card.status === 'active' && card.validTo > Date.now();
}

async function getLock(lockId: string): Promise<AplusLock | undefined> {
  const locks = await MockLockRepository.getLocks('all');
  return locks.find(lock => lock.id === lockId);
}

async function getPerson(personId: string): Promise<Person | undefined> {
  const people = await MockCredentialRepository.getPeople();
  return people.find(person => person.id === personId);
}

async function addIssuerRecord(input: {lock: AplusLock; credentialId?: string; actorName: string; message: string; result?: 'success' | 'failed' | 'blocked'}) {
  await MockLockRepository.addAccessRecord({
    id: `record-cardissuer-${Date.now()}-${Math.round(Math.random() * 999)}`,
    lockId: input.lock.id,
    lockName: input.lock.name,
    roomName: input.lock.roomName,
    method: 'Card',
    result: input.result ?? 'success',
    credentialId: input.credentialId,
    actorName: input.actorName,
    message: input.message,
    deviceName: 'Aplus Card Issuer Mock',
    sourceIp: 'issuer://card-encoder',
    gatewayName: input.lock.gatewayName,
    batteryPercentAtEvent: input.lock.batteryPercent,
    createdAt: Date.now(),
  });
}

function validateOwnerAuth(method: CreateEmergencyCardInput['authMethod'], authCode: string) {
  if (method === 'biometric') {
    return authCode.trim().toLowerCase() === 'ok' || authCode.trim() === '1';
  }
  if (method === 'otp') {
    return authCode.trim() === '123456';
  }
  return authCode.trim() === '2580' || authCode.trim() === '1234';
}

function parseCsv(csv: string): BatchIssuePreviewRow[] {
  return csv
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [cardId = '', lockId = '', ownerId = '', kind = 'guest', validDays = '7'] = line.split(',').map(part => part.trim());
      const errors: string[] = [];
      const days = Number(validDays);
      if (!cardId) {
        errors.push('Missing cardId');
      }
      if (!lockId) {
        errors.push('Missing lockId');
      }
      if (!ownerId) {
        errors.push('Missing ownerId');
      }
      if (!['staff', 'tenant', 'guest', 'cleaner', 'security'].includes(kind)) {
        errors.push('Invalid kind');
      }
      if (!Number.isFinite(days) || days <= 0 || days > 90) {
        errors.push('validDays must be 1-90');
      }
      return {
        rowNo: index + 1,
        cardId,
        lockId,
        ownerId,
        kind: kind as BatchIssuePreviewRow['kind'],
        validDays: Number.isFinite(days) ? days : 7,
        ok: errors.length === 0,
        errors,
      };
    });
}

export const MockCardIssuerRepository = {
  async getSummary(): Promise<CardIssuerSummary> {
    await wait(80);
    return {
      issuerDevices: issuerDevices.length,
      onlineDevices: issuerDevices.filter(item => item.status === 'online' || item.status === 'busy').length,
      installationJobs: installationJobs.length,
      timeCards: timeCards.length,
      activeEmergencyCards: emergencyCards.filter(isActiveEmergency).length,
      batchJobs: batchJobs.length,
      pendingAudit: installationJobs.filter(item => !item.auditId).length + emergencyCards.filter(item => item.status === 'active').length,
    };
  },

  async getIssuerDevices(): Promise<CardIssuerDevice[]> {
    await wait(80);
    return issuerDevices.map(cloneDevice);
  },

  async scanIssuerDevice(): Promise<CardIssuerDevice> {
    await wait(180);
    const device = issuerDevices.find(item => item.status === 'online') ?? issuerDevices[0];
    return cloneDevice({...device, lastSeenAt: Date.now()});
  },

  async getInstallationJobs(): Promise<InstallationCardJob[]> {
    await wait(80);
    return installationJobs.map(item => ({...item, lockIds: [...item.lockIds], lockNames: [...item.lockNames]}));
  },

  async createInstallationJob(input: {issuerDeviceId: string; lockIds: string[]; title: string}): Promise<InstallationCardJob> {
    await wait(220);
    const locks = await MockLockRepository.getLocks('all');
    const selected = locks.filter(lock => input.lockIds.includes(lock.id));
    const job: InstallationCardJob = {
      id: `install-job-${Date.now()}`,
      issuerDeviceId: input.issuerDeviceId,
      title: input.title.trim() || `Installation card ${selected.length} locks`,
      lockIds: selected.map(lock => lock.id),
      lockNames: selected.map(lock => lock.name),
      status: selected.length ? 'issued' : 'failed',
      createdAt: Date.now(),
      completedAt: selected.length ? Date.now() + 1000 : undefined,
      syncState: selected.length ? 'synced' : 'error',
      auditId: selected.length ? `record-cardissuer-install-${Date.now()}` : undefined,
    };
    installationJobs.unshift(job);
    for (const lock of selected) {
      await addIssuerRecord({lock, actorName: 'Installation card', message: `Issued installation card job ${job.title}`});
    }
    return {...job, lockIds: [...job.lockIds], lockNames: [...job.lockNames]};
  },

  async getTimeCards(): Promise<TimeCalibrationCard[]> {
    await wait(80);
    return timeCards.map(item => ({...item}));
  },

  async createTimeCard(input: {issuerDeviceId: string; lockId: string; timezone: string; timezoneOffsetMinutes: number}): Promise<TimeCalibrationCard | undefined> {
    await wait(180);
    const lock = await getLock(input.lockId);
    if (!lock) {
      return undefined;
    }
    const card: TimeCalibrationCard = {
      id: `time-card-${Date.now()}`,
      issuerDeviceId: input.issuerDeviceId,
      lockId: lock.id,
      lockName: lock.name,
      timezone: input.timezone,
      timezoneOffsetMinutes: input.timezoneOffsetMinutes,
      status: 'issued',
      createdAt: Date.now(),
      calibratedAt: Date.now() + 1000 * 15,
      syncState: lock.connectionState === 'offline' ? 'pending' : 'synced',
    };
    timeCards.unshift(card);
    await addIssuerRecord({lock, actorName: 'Time card', message: `Time calibration card issued for ${input.timezone}`});
    return {...card};
  },

  async getEmergencyCards(): Promise<EmergencyCard[]> {
    await wait(80);
    emergencyCards = emergencyCards.map(card => card.status === 'active' && card.validTo < Date.now() ? {...card, status: 'expired'} : card);
    return emergencyCards.map(cloneEmergency);
  },

  async createEmergencyCard(input: CreateEmergencyCardInput): Promise<{ok: boolean; message: string; card?: EmergencyCard}> {
    await wait(240);
    if (!validateOwnerAuth(input.authMethod, input.authCode)) {
      return {ok: false, message: 'Owner/Admin verification failed.'};
    }
    if (input.validMinutes <= 0 || input.validMinutes > 1440) {
      return {ok: false, message: 'Emergency card must expire within 24 hours.'};
    }
    const lock = await getLock(input.lockId);
    const owner = await getPerson(input.ownerId);
    if (!lock || !owner) {
      return {ok: false, message: 'Missing lock or owner.'};
    }
    if (!lock.capabilities.supportsCard) {
      return {ok: false, message: 'Selected lock does not support card credential.'};
    }
    sequence += 1;
    const card: EmergencyCard = {
      id: `emergency-card-${Date.now()}`,
      issuerDeviceId: input.issuerDeviceId,
      cardId: input.kind === 'cellPhone' ? `APL-PHONECARD-${sequence}` : `APL-EMG-${sequence}`,
      lockId: lock.id,
      lockName: lock.name,
      roomName: lock.roomName,
      ownerId: owner.id,
      ownerName: owner.fullName,
      kind: input.kind,
      status: lock.connectionState === 'offline' ? 'issued' : 'active',
      validFrom: Date.now(),
      validTo: Date.now() + input.validMinutes * 60 * 1000,
      authMethod: input.authMethod,
      createdAt: Date.now(),
      syncState: lock.connectionState === 'offline' ? 'pending' : 'synced',
    };
    emergencyCards.unshift(card);
    await MockCredentialRepository.upsertAccessCredential({
      id: `cred-cardissuer-${card.id}`,
      type: 'card',
      title: `${input.kind === 'cellPhone' ? 'Cell phone card' : 'Emergency card'} · ${owner.fullName}`,
      ownerId: owner.id,
      ownerName: owner.fullName,
      lockId: lock.id,
      lockName: lock.name,
      scopeLabel: lock.roomName,
      status: card.status === 'active' ? 'active' : 'pendingSync',
      syncState: card.syncState,
      capabilityKey: 'supportsCard',
      expiresAt: card.validTo,
    });
    await addIssuerRecord({lock, credentialId: `cred-cardissuer-${card.id}`, actorName: owner.fullName, message: `Issued ${input.kind} card ${card.cardId}`});
    return {ok: true, message: 'Emergency card issued.', card: cloneEmergency(card)};
  },

  async revokeEmergencyCard(cardId: string, revokedBy = 'Admin Aplus'): Promise<EmergencyCard | undefined> {
    await wait(140);
    let updated: EmergencyCard | undefined;
    emergencyCards = emergencyCards.map(card => {
      if (card.id !== cardId) {
        return card;
      }
      updated = {...card, status: 'revoked', revokedAt: Date.now(), syncState: 'synced'};
      return updated;
    });
    if (updated) {
      await MockCredentialRepository.revokeCredential(`cred-cardissuer-${updated.id}`, revokedBy);
      const lock = await getLock(updated.lockId);
      if (lock) {
        await addIssuerRecord({lock, credentialId: `cred-cardissuer-${updated.id}`, actorName: revokedBy, message: `Revoked emergency card ${updated.cardId}`});
      }
    }
    return updated ? cloneEmergency(updated) : undefined;
  },

  async previewBatchCsv(csv: string): Promise<BatchIssueJob> {
    await wait(160);
    const rows = parseCsv(csv);
    const locks = await MockLockRepository.getLocks('all');
    const people = await MockCredentialRepository.getPeople();
    const enriched = rows.map(row => {
      const errors = [...row.errors];
      const lock = locks.find(item => item.id === row.lockId);
      const owner = people.find(item => item.id === row.ownerId);
      if (!lock) {
        errors.push('Lock not found');
      } else if (!lock.capabilities.supportsCard) {
        errors.push('Lock does not support card');
      }
      if (!owner) {
        errors.push('Owner not found');
      }
      return {...row, ok: errors.length === 0, errors};
    });
    const job: BatchIssueJob = {
      id: `batch-issue-${Date.now()}`,
      title: `Batch issue ${new Date().toLocaleDateString('vi-VN')}`,
      status: 'previewed',
      rows: enriched,
      issuedCount: 0,
      failedCount: enriched.filter(row => !row.ok).length,
      rollbackAvailable: false,
      createdAt: Date.now(),
    };
    batchJobs.unshift(job);
    return cloneBatch(job);
  },

  async commitBatchIssue(jobId: string): Promise<BatchIssueJob | undefined> {
    await wait(260);
    const job = batchJobs.find(item => item.id === jobId);
    if (!job) {
      return undefined;
    }
    const locks = await MockLockRepository.getLocks('all');
    const people = await MockCredentialRepository.getPeople();
    let issued = 0;
    for (const row of job.rows.filter(item => item.ok)) {
      const lock = locks.find(item => item.id === row.lockId);
      const owner = people.find(item => item.id === row.ownerId);
      if (!lock || !owner) {
        continue;
      }
      const credentialId = `cred-batch-card-${row.cardId}`;
      await MockCredentialRepository.upsertAccessCredential({
        id: credentialId,
        type: 'card',
        title: `Batch card ${row.cardId}`,
        ownerId: owner.id,
        ownerName: owner.fullName,
        lockId: lock.id,
        lockName: lock.name,
        scopeLabel: lock.roomName,
        status: 'active',
        syncState: lock.connectionState === 'offline' ? 'pending' : 'synced',
        capabilityKey: 'supportsCard',
        expiresAt: Date.now() + row.validDays * day,
      });
      await addIssuerRecord({lock, credentialId, actorName: owner.fullName, message: `Batch issued card ${row.cardId}`});
      issued += 1;
    }
    const next: BatchIssueJob = {
      ...job,
      status: issued ? 'completed' : 'failed',
      issuedCount: issued,
      failedCount: job.rows.length - issued,
      rollbackAvailable: issued > 0,
      completedAt: Date.now(),
    };
    batchJobs = batchJobs.map(item => item.id === jobId ? next : item);
    return cloneBatch(next);
  },

  async rollbackBatchIssue(jobId: string): Promise<BatchIssueJob | undefined> {
    await wait(180);
    const job = batchJobs.find(item => item.id === jobId);
    if (!job || !job.rollbackAvailable) {
      return undefined;
    }
    for (const row of job.rows.filter(item => item.ok)) {
      await MockCredentialRepository.revokeCredential(`cred-batch-card-${row.cardId}`, 'Batch rollback');
    }
    const next: BatchIssueJob = {...job, status: 'rolledBack', rollbackAvailable: false, rolledBackAt: Date.now()};
    batchJobs = batchJobs.map(item => item.id === jobId ? next : item);
    return cloneBatch(next);
  },

  async getBatchJobs(): Promise<BatchIssueJob[]> {
    await wait(80);
    return batchJobs.map(cloneBatch);
  },
};

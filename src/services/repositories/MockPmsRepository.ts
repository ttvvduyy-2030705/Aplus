import {MockCardRepository} from '@/services/repositories/MockCardRepository';
import {MockCredentialRepository} from '@/services/repositories/MockCredentialRepository';
import {MockLockRepository} from '@/services/repositories/MockLockRepository';
import {MockPasswordRepository} from '@/services/repositories/MockPasswordRepository';
import type {AplusLock, AccessRecord} from '@/types/lock';
import type {Room} from '@/types/room';
import type {
  Booking,
  BookingFilter,
  BookingImportPreviewRow,
  CheckInInput,
  CheckOutInput,
  CreateBookingInput,
  PmsCredentialJob,
  PmsCredentialMethod,
  PmsSummary,
  SelfCheckInSession,
} from '@/types/pms';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

let bookings: Booking[] = [
  {
    id: 'booking-701-minh-anh',
    code: 'BK-701-0426',
    guestName: 'Minh Anh',
    guestPhone: '0900 701 001',
    guestEmail: 'minhanh@example.com',
    roomId: 'room-lock-hotel-0701',
    roomName: 'Phòng 701',
    lockId: 'lock-hotel-0701',
    lockName: 'Phòng khách sạn 701',
    checkInAt: now + 2 * 60 * 60 * 1000,
    checkOutAt: now + DAY * 2,
    status: 'reserved',
    source: 'manual',
    notes: 'Khách VIP, ưu tiên phone auth.',
    credentialJobIds: [],
    selfCheckInSessionId: 'self-701-minh-anh',
    createdAt: now - DAY,
    updatedAt: now - DAY,
  },
  {
    id: 'booking-802-long-stay',
    code: 'BK-802-0425',
    guestName: 'Long Stay Guest',
    guestPhone: '0900 802 002',
    roomId: 'room-lock-hotel-0802',
    roomName: 'Phòng 802',
    lockId: 'lock-hotel-0802',
    lockName: 'Phòng khách sạn 802',
    checkInAt: now - 4 * 60 * 60 * 1000,
    checkOutAt: now + DAY,
    status: 'checkedIn',
    source: 'manual',
    credentialJobIds: [],
    createdAt: now - DAY * 2,
    updatedAt: now - 3 * 60 * 60 * 1000,
  },
];

let credentialJobs: PmsCredentialJob[] = [];

let selfCheckInSessions: SelfCheckInSession[] = [
  {
    id: 'self-701-minh-anh',
    bookingId: 'booking-701-minh-anh',
    token: 'SCI-701-0426',
    url: 'https://aplus.lock/self-check-in/SCI-701-0426',
    qrPayload: 'APLUS_SELF_CHECK_IN:SCI-701-0426:booking-701-minh-anh',
    status: 'pending',
    guestName: 'Minh Anh',
    roomName: 'Phòng 701',
    expiresAt: now + DAY,
  },
];

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function cloneBooking(item: Booking): Booking {
  return {...item, credentialJobIds: [...item.credentialJobIds]};
}

function cloneJob(item: PmsCredentialJob): PmsCredentialJob {
  return {...item};
}

function cloneSession(item: SelfCheckInSession): SelfCheckInSession {
  return {...item};
}

function bookingMatchesFilter(booking: Booking, filter?: BookingFilter) {
  if (filter?.status && filter.status !== 'all' && booking.status !== filter.status) {
    return false;
  }
  if (filter?.query) {
    const query = filter.query.trim().toLowerCase();
    const values = [booking.code, booking.guestName, booking.guestPhone, booking.guestEmail ?? '', booking.roomName, booking.lockName];
    if (!values.some(value => value.toLowerCase().includes(query))) {
      return false;
    }
  }
  if (filter?.date) {
    const start = new Date(`${filter.date}T00:00:00`).getTime();
    const end = start + DAY;
    if (!(booking.checkInAt < end && booking.checkOutAt > start)) {
      return false;
    }
  }
  return true;
}

async function findLock(lockId: string): Promise<AplusLock | undefined> {
  return MockLockRepository.getLockById(lockId);
}

async function findOwner() {
  const people = await MockCredentialRepository.getPeople();
  return people.find(person => person.active && (person.role === 'Tenant' || person.role === 'Guest'))
    ?? people.find(person => person.active && person.role !== 'Owner')
    ?? people[0];
}

function buildSummary(): PmsSummary {
  const todayEnd = Date.now() + DAY;
  return {
    totalBookings: bookings.length,
    reserved: bookings.filter(item => item.status === 'reserved').length,
    checkedIn: bookings.filter(item => item.status === 'checkedIn').length,
    dueCheckout: bookings.filter(item => item.status === 'checkedIn' && item.checkOutAt < todayEnd).length,
    activeCredentials: credentialJobs.filter(job => job.status === 'success').length,
    selfCheckInPending: selfCheckInSessions.filter(session => session.status === 'pending' || session.status === 'verified').length,
  };
}

function makeCode() {
  return `BK-${String(Date.now()).slice(-6)}`;
}

function makePin() {
  const seed = String(Date.now()).slice(-6);
  return seed.length >= 6 ? seed : `86${seed}`.slice(0, 6);
}

async function addPmsRecord(booking: Booking, message: string, result: AccessRecord['result'] = 'success', credentialId?: string) {
  const record: AccessRecord = {
    id: `record-pms-${Date.now()}-${Math.round(Math.random() * 999)}`,
    lockId: booking.lockId,
    lockName: booking.lockName,
    roomName: booking.roomName,
    method: 'System',
    result,
    credentialId,
    actorName: 'PMS mock',
    message,
    createdAt: Date.now(),
  };
  await MockLockRepository.addAccessRecord(record);
}

function getBookingOrThrow(bookingId: string) {
  const booking = bookings.find(item => item.id === bookingId);
  if (!booking) {
    throw new Error('Không tìm thấy booking.');
  }
  return booking;
}

async function createJobForMethod(booking: Booking, method: PmsCredentialMethod, offline?: boolean): Promise<PmsCredentialJob> {
  const lock = await findLock(booking.lockId);
  const owner = await findOwner();
  if (!lock || !owner) {
    throw new Error('Thiếu lock hoặc owner để tạo quyền PMS.');
  }

  const createdAt = Date.now();
  const baseJob: Omit<PmsCredentialJob, 'id' | 'credentialTitle' | 'message'> = {
    bookingId: booking.id,
    method,
    status: 'pending',
    syncState: offline ? 'pending' : 'synced',
    validFrom: booking.checkInAt,
    validTo: booking.checkOutAt,
    createdAt,
  };

  if (method === 'password') {
    const password = await MockPasswordRepository.createPassword({
      lockId: lock.id,
      ownerId: owner.id,
      title: `PMS PIN · ${booking.guestName}`,
      code: makePin(),
      kind: 'guest',
      validFrom: booking.checkInAt,
      validTo: booking.checkOutAt,
      offline: Boolean(offline),
    });
    return {
      ...baseJob,
      id: `pms-job-password-${password.id}`,
      credentialId: password.id,
      credentialTitle: password.title,
      status: 'success',
      syncState: password.syncState,
      message: `Đã tạo mã PIN khách ${password.code}`,
    };
  }

  if (method === 'card') {
    if (!lock.capabilities.supportsCard) {
      return {
        ...baseJob,
        id: `pms-job-card-fail-${createdAt}`,
        credentialTitle: 'Hotel card',
        status: 'failed',
        syncState: 'error',
        message: 'Khóa không hỗ trợ thẻ card.',
      };
    }
    const card = await MockCardRepository.createCard({
      cardId: `PMS-${booking.roomName.replace(/\D/g, '') || 'ROOM'}-${String(createdAt).slice(-4)}`,
      lockId: lock.id,
      ownerId: owner.id,
      title: `Hotel card · ${booking.guestName}`,
      kind: 'hotel',
      validFrom: booking.checkInAt,
      validTo: booking.checkOutAt,
      offline: Boolean(offline),
    });
    return {
      ...baseJob,
      id: `pms-job-card-${card.id}`,
      credentialId: card.id,
      credentialTitle: card.title,
      status: 'success',
      syncState: card.syncState,
      message: `Đã cấp thẻ ${card.cardId}`,
    };
  }

  const credentialId = `cred-phone-pms-${booking.id}-${createdAt}`;
  const credential = await MockCredentialRepository.upsertAccessCredential({
    id: credentialId,
    type: 'phone',
    title: `Phone auth · ${booking.guestName}`,
    ownerId: owner.id,
    ownerName: owner.fullName,
    lockId: lock.id,
    lockName: lock.name,
    scopeLabel: booking.roomName,
    status: offline ? 'pendingSync' : 'active',
    syncState: offline ? 'pending' : 'synced',
    expiresAt: booking.checkOutAt,
  });
  return {
    ...baseJob,
    id: `pms-job-phone-${credential.id}`,
    credentialId: credential.id,
    credentialTitle: credential.title,
    status: 'success',
    syncState: credential.syncState,
    message: 'Đã tạo phone authorization cho khách.',
  };
}

function createSelfCheckInSession(booking: Booking): SelfCheckInSession {
  const token = `SCI-${booking.code.replace(/[^A-Z0-9]/gi, '').slice(-6)}-${String(Date.now()).slice(-4)}`.toUpperCase();
  const session: SelfCheckInSession = {
    id: `self-${booking.id}-${Date.now()}`,
    bookingId: booking.id,
    token,
    url: `https://aplus.lock/self-check-in/${token}`,
    qrPayload: `APLUS_SELF_CHECK_IN:${token}:${booking.id}`,
    status: 'pending',
    guestName: booking.guestName,
    roomName: booking.roomName,
    expiresAt: Math.min(booking.checkInAt + DAY, booking.checkOutAt),
  };
  selfCheckInSessions.unshift(session);
  bookings = bookings.map(item => item.id === booking.id ? {...item, selfCheckInSessionId: session.id, updatedAt: Date.now()} : item);
  return session;
}

function parseDateInput(value: string) {
  const ts = new Date(value.trim()).getTime();
  return Number.isFinite(ts) ? ts : undefined;
}

async function parseBookingCsv(csvText: string): Promise<BookingImportPreviewRow[]> {
  const [rooms, locks] = await Promise.all([MockLockRepository.getRooms(), MockLockRepository.getLocks('all')]);
  return csvText.split(/\r?\n/).map((line, index) => ({line: line.trim(), row: index + 1})).filter(item => item.line.length).map(item => {
    const [guestName = '', phone = '', email = '', roomName = '', checkIn = '', checkOut = ''] = item.line.split(',').map(value => value.trim());
    const room = rooms.find(candidate => candidate.roomName.toLowerCase() === roomName.toLowerCase() || candidate.roomNo === roomName);
    const lockId = room?.lockIds[0] ?? locks.find(lock => lock.roomName.toLowerCase() === roomName.toLowerCase())?.id;
    const lock = locks.find(candidate => candidate.id === lockId);
    const checkInAt = parseDateInput(checkIn);
    const checkOutAt = parseDateInput(checkOut);
    if (!guestName || !phone || !roomName || !checkInAt || !checkOutAt || !lock || !room) {
      return {
        row: item.row,
        guestName,
        roomName,
        roomId: room?.id,
        lockId: lock?.id,
        checkInAt,
        checkOutAt,
        status: 'invalid' as const,
        message: 'Thiếu guest/phone/room/check-in/check-out hoặc không tìm thấy phòng có khóa.',
      };
    }
    if (checkOutAt <= checkInAt) {
      return {row: item.row, guestName, roomName, roomId: room.id, lockId: lock.id, checkInAt, checkOutAt, status: 'invalid' as const, message: 'Check-out phải sau check-in.'};
    }
    if (bookings.some(booking => booking.roomId === room.id && booking.status !== 'checkedOut' && booking.status !== 'cancelled' && booking.checkInAt < checkOutAt && booking.checkOutAt > checkInAt)) {
      return {row: item.row, guestName, roomName, roomId: room.id, lockId: lock.id, checkInAt, checkOutAt, status: 'invalid' as const, message: 'Trùng lịch booking hiện có.'};
    }
    return {row: item.row, guestName, roomName, roomId: room.id, lockId: lock.id, checkInAt, checkOutAt, status: 'valid' as const, message: email ? `OK · ${email}` : 'OK'};
  });
}

export const MockPmsRepository = {
  async getSummary(): Promise<PmsSummary> {
    await wait(80);
    return buildSummary();
  },

  async getBookings(filter?: BookingFilter): Promise<Booking[]> {
    await wait(140);
    return bookings.filter(booking => bookingMatchesFilter(booking, filter)).sort((left, right) => left.checkInAt - right.checkInAt).map(cloneBooking);
  },

  async getBookingById(bookingId: string): Promise<Booking | undefined> {
    await wait(80);
    const booking = bookings.find(item => item.id === bookingId);
    return booking ? cloneBooking(booking) : undefined;
  },

  async createBooking(input: CreateBookingInput): Promise<Booking> {
    await wait(180);
    const [rooms, locks] = await Promise.all([MockLockRepository.getRooms(), MockLockRepository.getLocks('all')]);
    const room = rooms.find(item => item.id === input.roomId);
    const lock = locks.find(item => item.id === input.lockId);
    if (!room || !lock) {
      throw new Error('Phòng hoặc khóa không hợp lệ.');
    }
    if (input.checkOutAt <= input.checkInAt) {
      throw new Error('Check-out phải sau check-in.');
    }
    const overlap = bookings.some(booking => booking.roomId === input.roomId && booking.status !== 'checkedOut' && booking.status !== 'cancelled' && booking.checkInAt < input.checkOutAt && booking.checkOutAt > input.checkInAt);
    if (overlap) {
      throw new Error('Phòng đã có booking trùng thời gian.');
    }
    const booking: Booking = {
      id: `booking-${Date.now()}-${Math.round(Math.random() * 999)}`,
      code: makeCode(),
      guestName: input.guestName.trim(),
      guestPhone: input.guestPhone.trim(),
      guestEmail: input.guestEmail?.trim() || undefined,
      roomId: room.id,
      roomName: room.roomName,
      lockId: lock.id,
      lockName: lock.name,
      checkInAt: input.checkInAt,
      checkOutAt: input.checkOutAt,
      status: 'reserved',
      source: input.source ?? 'manual',
      notes: input.notes?.trim(),
      credentialJobIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    bookings.unshift(booking);
    await addPmsRecord(booking, `Tạo booking ${booking.code} cho ${booking.guestName}`);
    return cloneBooking(booking);
  },

  async checkInBooking(input: CheckInInput): Promise<{booking: Booking; jobs: PmsCredentialJob[]; selfCheckInSession?: SelfCheckInSession}> {
    await wait(120);
    const booking = getBookingOrThrow(input.bookingId);
    if (booking.status === 'checkedOut' || booking.status === 'cancelled') {
      throw new Error('Booking đã kết thúc hoặc bị hủy.');
    }
    const methods = input.methods.length ? input.methods : ['password'];
    const jobs: PmsCredentialJob[] = [];
    for (const method of methods) {
      try {
        const job = await createJobForMethod(booking, method, input.offline);
        credentialJobs.unshift(job);
        jobs.push(job);
      } catch (error) {
        const failed: PmsCredentialJob = {
          id: `pms-job-${method}-failed-${Date.now()}`,
          bookingId: booking.id,
          method,
          credentialTitle: method,
          status: 'failed',
          syncState: 'error',
          message: error instanceof Error ? error.message : 'Tạo credential thất bại.',
          validFrom: booking.checkInAt,
          validTo: booking.checkOutAt,
          createdAt: Date.now(),
        };
        credentialJobs.unshift(failed);
        jobs.push(failed);
      }
    }
    const session = input.enableSelfCheckIn ? createSelfCheckInSession(booking) : undefined;
    const jobIds = jobs.map(job => job.id);
    bookings = bookings.map(item => item.id === booking.id ? {...item, status: 'checkedIn', credentialJobIds: Array.from(new Set([...item.credentialJobIds, ...jobIds])), selfCheckInSessionId: session?.id ?? item.selfCheckInSessionId, updatedAt: Date.now()} : item);
    const updated = getBookingOrThrow(booking.id);
    await addPmsRecord(updated, `Check-in ${updated.guestName}: tạo ${jobs.filter(job => job.status === 'success').length}/${jobs.length} credential`);
    return {booking: cloneBooking(updated), jobs: jobs.map(cloneJob), selfCheckInSession: session ? cloneSession(session) : undefined};
  },

  async checkOutBooking(input: CheckOutInput): Promise<{booking: Booking; revokedJobs: PmsCredentialJob[]}> {
    await wait(120);
    const booking = getBookingOrThrow(input.bookingId);
    const bookingJobs = credentialJobs.filter(job => booking.credentialJobIds.includes(job.id));
    const revoked: PmsCredentialJob[] = [];
    if (input.revokeAllCredentials) {
      for (const job of bookingJobs) {
        if (job.status !== 'success' || !job.credentialId) {
          continue;
        }
        if (job.method === 'password') {
          await MockPasswordRepository.revokePassword(job.credentialId, false, 'PMS checkout');
        } else if (job.method === 'card') {
          await MockCardRepository.checkoutCard(job.credentialId);
        } else {
          await MockCredentialRepository.revokeCredential(job.credentialId, 'PMS checkout');
        }
        const updatedJob = {...job, status: 'revoked' as const, revokedAt: Date.now(), message: `${job.message} · revoked by PMS checkout`};
        credentialJobs = credentialJobs.map(item => item.id === job.id ? updatedJob : item);
        revoked.push(updatedJob);
      }
    }
    const nextCheckoutAt = input.lateCheckoutMinutes ? booking.checkOutAt + input.lateCheckoutMinutes * 60 * 1000 : booking.checkOutAt;
    bookings = bookings.map(item => item.id === booking.id ? {...item, status: 'checkedOut', checkOutAt: nextCheckoutAt, updatedAt: Date.now()} : item);
    selfCheckInSessions = selfCheckInSessions.map(session => session.bookingId === booking.id ? {...session, status: 'completed', completedAt: Date.now()} : session);
    const updated = getBookingOrThrow(booking.id);
    await addPmsRecord(updated, `Check-out ${updated.guestName}: thu hồi ${revoked.length} credential`, 'success');
    return {booking: cloneBooking(updated), revokedJobs: revoked.map(cloneJob)};
  },

  async getCredentialJobs(bookingId?: string): Promise<PmsCredentialJob[]> {
    await wait(100);
    return credentialJobs.filter(job => !bookingId || job.bookingId === bookingId).map(cloneJob);
  },

  async getSelfCheckInSessions(bookingId?: string): Promise<SelfCheckInSession[]> {
    await wait(100);
    return selfCheckInSessions.filter(session => !bookingId || session.bookingId === bookingId).map(cloneSession);
  },

  async verifySelfCheckInSession(sessionId: string): Promise<SelfCheckInSession | undefined> {
    await wait(120);
    let updated: SelfCheckInSession | undefined;
    selfCheckInSessions = selfCheckInSessions.map(session => {
      if (session.id !== sessionId || session.status !== 'pending') {
        return session;
      }
      updated = {...session, status: 'verified', verifiedAt: Date.now()};
      return updated;
    });
    return updated ? cloneSession(updated) : undefined;
  },

  async previewImport(csvText: string): Promise<BookingImportPreviewRow[]> {
    await wait(120);
    return parseBookingCsv(csvText);
  },

  async commitImport(csvText: string): Promise<BookingImportPreviewRow[]> {
    await wait(220);
    const preview = await parseBookingCsv(csvText);
    const created: BookingImportPreviewRow[] = [];
    for (const row of preview) {
      if (row.status !== 'valid' || !row.roomId || !row.lockId || !row.checkInAt || !row.checkOutAt) {
        created.push(row);
        continue;
      }
      const booking = await this.createBooking({
        guestName: row.guestName,
        guestPhone: 'imported-phone',
        roomId: row.roomId,
        lockId: row.lockId,
        checkInAt: row.checkInAt,
        checkOutAt: row.checkOutAt,
        source: 'import',
        notes: 'Tạo từ import CSV PMS Batch 21.',
      });
      created.push({...row, status: 'created', message: `Created ${booking.code}`});
    }
    return created;
  },

  sampleImportCsv() {
    const in1 = new Date(Date.now() + DAY * 3).toISOString().slice(0, 16);
    const out1 = new Date(Date.now() + DAY * 5).toISOString().slice(0, 16);
    const in2 = new Date(Date.now() + DAY * 6).toISOString().slice(0, 16);
    const out2 = new Date(Date.now() + DAY * 7).toISOString().slice(0, 16);
    return `Guest Import 701,0900111222,guest701@example.com,Phòng 701,${in1},${out1}\nGuest Import 802,0900333444,guest802@example.com,Phòng 802,${in2},${out2}`;
  },
};

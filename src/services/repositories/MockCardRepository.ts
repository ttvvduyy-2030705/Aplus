import {MockCredentialRepository} from './MockCredentialRepository';
import {MockLockRepository} from './MockLockRepository';
import type {CardCredential, CardCredentialStatus, CardFilter, CardKind, CardPolicy, CardReaderState, CardSummary, CardValidationResult, CreateCardInput} from '@/types/card';
import type {AplusLock} from '@/types/lock';
import type {Person} from '@/types/credential';

const day = 1000 * 60 * 60 * 24;
const now = Date.now();

const policy: CardPolicy = {
  blockDuplicateCardIdInSameLock: true,
  hotelCardRequiresValidCheckout: true,
  offlineCardMaxDays: 30,
  allowExpiredUse: false,
};

let cardSequence = 4082;
let readerState: CardReaderState = {
  status: 'idle',
  message: 'Đầu đọc thẻ mock sẵn sàng.',
};

let cardCredentials: CardCredential[] = [
  {
    id: 'card-hotel-701-guest',
    cardId: 'APL-CARD-0701-GUEST',
    lockId: 'lock-hotel-0701',
    lockName: 'Phòng khách sạn 701',
    roomName: 'Phòng 701',
    ownerId: 'person-subadmin-hotel',
    ownerName: 'Quản lý khách sạn',
    title: 'Thẻ khách phòng 701',
    kind: 'hotel',
    status: 'active',
    syncState: 'synced',
    validFrom: now - day,
    validTo: now + day * 2,
    createdAt: now - 1000 * 60 * 60 * 6,
    updatedAt: now - 1000 * 60 * 60 * 6,
    offlineAllowed: false,
    bookingLink: {
      bookingId: 'booking-701-mock',
      guestName: 'Khách phòng 701',
      roomName: 'Phòng 701',
      checkInAt: now - 1000 * 60 * 60 * 5,
      checkOutAt: now + day * 2,
      status: 'checkedIn',
    },
  },
  {
    id: 'card-staff-cleaner-hotel',
    cardId: 'APL-CARD-CLEANER-01',
    lockId: 'lock-hotel-0802',
    lockName: 'Phòng khách sạn 802',
    roomName: 'Phòng 802',
    ownerId: 'person-cleaner-01',
    ownerName: 'Dọn phòng ca sáng',
    title: 'Thẻ dọn phòng ca sáng',
    kind: 'staff',
    status: 'offline',
    syncState: 'offline',
    validFrom: now - day * 7,
    validTo: now + day * 14,
    createdAt: now - day * 7,
    updatedAt: now - day * 3,
    offlineAllowed: true,
  },
  {
    id: 'card-old-520',
    cardId: 'APL-CARD-OLD-520',
    lockId: 'lock-home-520',
    lockName: 'Căn hộ 520',
    roomName: 'Căn hộ 520',
    ownerId: 'person-tenant-520',
    ownerName: 'Khách thuê căn 520',
    title: 'Thẻ cũ căn 520',
    kind: 'standard',
    status: 'expired',
    syncState: 'synced',
    validFrom: now - day * 60,
    validTo: now - day * 2,
    createdAt: now - day * 60,
    updatedAt: now - day * 2,
    offlineAllowed: false,
  },
];

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function cloneCard(card: CardCredential): CardCredential {
  return {
    ...card,
    bookingLink: card.bookingLink ? {...card.bookingLink} : undefined,
  };
}

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function statusFromDates(card: CardCredential): CardCredentialStatus {
  if (card.status === 'revoked' || card.status === 'pendingSync') {
    return card.status;
  }
  if (card.validTo && card.validTo < Date.now()) {
    return 'expired';
  }
  if (card.status === 'offline') {
    return 'offline';
  }
  return 'active';
}

function attachRuntimeStatus(card: CardCredential): CardCredential {
  return {...card, status: statusFromDates(card)};
}

function cardMatchesFilter(card: CardCredential, filter?: CardFilter) {
  const current = attachRuntimeStatus(card);
  const query = filter?.query?.trim().toLowerCase();
  return (!filter?.lockId || current.lockId === filter.lockId)
    && (!filter?.ownerId || current.ownerId === filter.ownerId)
    && (!filter?.kind || filter.kind === 'all' || current.kind === filter.kind)
    && (!filter?.status || filter.status === 'all' || current.status === filter.status)
    && (!query
      || current.title.toLowerCase().includes(query)
      || current.cardId.toLowerCase().includes(query)
      || current.ownerName.toLowerCase().includes(query)
      || current.lockName.toLowerCase().includes(query)
      || current.roomName.toLowerCase().includes(query)
      || current.bookingLink?.bookingId.toLowerCase().includes(query));
}

async function findLock(lockId: string) {
  const locks = await MockLockRepository.getLocks('all');
  return locks.find(item => item.id === lockId);
}

async function findOwner(ownerId: string) {
  const people = await MockCredentialRepository.getPeople();
  return people.find(item => item.id === ownerId);
}

function credentialStatusFromCard(card: CardCredential) {
  const status = statusFromDates(card);
  if (status === 'pendingSync') {
    return 'pendingSync' as const;
  }
  if (status === 'revoked') {
    return 'revoked' as const;
  }
  if (status === 'expired') {
    return 'expired' as const;
  }
  return 'active' as const;
}

async function syncCredentialHub(card: CardCredential) {
  await MockCredentialRepository.upsertCardCredential({
    credentialId: `cred-card-${card.id}`,
    cardId: card.cardId,
    title: card.title,
    ownerId: card.ownerId,
    ownerName: card.ownerName,
    lockId: card.lockId,
    lockName: card.lockName,
    roomName: card.roomName,
    status: credentialStatusFromCard(card),
    syncState: card.syncState,
    expiresAt: card.validTo,
  });
}

async function addCardRecord(card: CardCredential, result: 'success' | 'failed' | 'blocked', message: string, failureReason?: string) {
  await MockLockRepository.addAccessRecord({
    id: `record-card-${card.id}-${Date.now()}`,
    lockId: card.lockId,
    lockName: card.lockName,
    roomName: card.roomName,
    method: 'Card',
    result,
    credentialId: `cred-card-${card.id}`,
    personId: card.ownerId,
    actorName: card.ownerName,
    message,
    failureReason,
    deviceName: 'Aplus Card Reader Mock',
    sourceIp: card.offlineAllowed ? 'offline-card://reader' : 'gateway://card-reader',
    batteryPercentAtEvent: undefined,
    createdAt: Date.now(),
  });
}

function updateReader(next: CardReaderState) {
  readerState = {...next, lastScanAt: Date.now()};
  return {...readerState};
}

function buildSummary(filter?: CardFilter): CardSummary {
  const cards = cardCredentials.filter(card => cardMatchesFilter(card, filter)).map(attachRuntimeStatus);
  return {
    total: cards.length,
    active: cards.filter(item => item.status === 'active').length,
    expired: cards.filter(item => item.status === 'expired').length,
    offline: cards.filter(item => item.status === 'offline').length,
    revoked: cards.filter(item => item.status === 'revoked').length,
    pending: cards.filter(item => item.status === 'pendingSync').length,
  };
}

function isDuplicateCardId(cardId: string, lockId: string, ignoreId?: string) {
  return cardCredentials.some(card => card.id !== ignoreId && card.lockId === lockId && card.status !== 'revoked' && normalize(card.cardId) === normalize(cardId));
}

function validateDateRange(input: CreateCardInput): CardValidationResult {
  if (input.validTo && input.validTo <= input.validFrom) {
    return {ok: false, message: 'Thời hạn kết thúc phải sau thời điểm bắt đầu.'};
  }
  if (input.kind === 'offline' && input.validTo && input.validTo - input.validFrom > policy.offlineCardMaxDays * day) {
    return {ok: false, message: `Thẻ offline chỉ được cấp tối đa ${policy.offlineCardMaxDays} ngày trong mock policy.`};
  }
  if ((input.kind === 'hotel' || input.kind === 'staff') && !input.validTo) {
    return {ok: false, message: 'Thẻ khách sạn/nhân viên phải có thời hạn rõ ràng.'};
  }
  return {ok: true};
}

function createBookingForCard(kind: CardKind, owner: Person, lock: AplusLock, validFrom: number, validTo?: number) {
  if (kind !== 'hotel') {
    return undefined;
  }
  return {
    bookingId: `booking-${lock.roomNo}-${String(Date.now()).slice(-5)}`,
    guestName: owner.fullName,
    roomName: lock.roomName,
    checkInAt: validFrom,
    checkOutAt: validTo ?? validFrom + day,
    status: 'checkedIn' as const,
  };
}

export const MockCardRepository = {
  async getPolicy(): Promise<CardPolicy> {
    await wait(60);
    return {...policy};
  },

  async getReaderState(): Promise<CardReaderState> {
    await wait(40);
    return {...readerState};
  },

  async scanCardId(lockId?: string): Promise<CardReaderState> {
    await wait(220);
    cardSequence += 1;
    const cardId = `APL-CARD-${cardSequence}`;
    const duplicate = lockId ? isDuplicateCardId(cardId, lockId) : cardCredentials.some(card => normalize(card.cardId) === normalize(cardId) && card.status !== 'revoked');
    if (duplicate) {
      return updateReader({status: 'duplicate', message: 'Thẻ đã tồn tại trong khóa/phạm vi hiện tại.', scannedCardId: cardId});
    }
    return updateReader({status: 'success', message: 'Đã đọc cardId mock thành công.', scannedCardId: cardId});
  },

  async validateCardInput(input: CreateCardInput): Promise<CardValidationResult> {
    await wait(80);
    if (!input.cardId.trim()) {
      return {ok: false, message: 'Vui lòng scan hoặc nhập cardId.'};
    }
    if (policy.blockDuplicateCardIdInSameLock && isDuplicateCardId(input.cardId, input.lockId)) {
      return {ok: false, message: 'Trùng cardId trong cùng khóa. Không tạo credential mới.'};
    }
    const dateResult = validateDateRange(input);
    if (!dateResult.ok) {
      return dateResult;
    }
    const lock = await findLock(input.lockId);
    if (!lock) {
      return {ok: false, message: 'Không tìm thấy khóa.'};
    }
    if (!lock.capabilities.supportsCard) {
      return {ok: false, message: 'Model khóa không hỗ trợ thẻ.'};
    }
    const owner = await findOwner(input.ownerId);
    if (!owner || !owner.active) {
      return {ok: false, message: 'Người nhận không hợp lệ hoặc đã bị vô hiệu.'};
    }
    return {ok: true};
  },

  async getCards(filter?: CardFilter): Promise<CardCredential[]> {
    await wait(130);
    return cardCredentials
      .filter(card => cardMatchesFilter(card, filter))
      .map(attachRuntimeStatus)
      .sort((left, right) => Number(right.status === 'active' || right.status === 'offline') - Number(left.status === 'active' || left.status === 'offline') || right.updatedAt - left.updatedAt)
      .map(cloneCard);
  },

  async getCardById(cardId: string): Promise<CardCredential | undefined> {
    await wait(90);
    const card = cardCredentials.find(item => item.id === cardId);
    return card ? cloneCard(attachRuntimeStatus(card)) : undefined;
  },

  async getSummary(filter?: CardFilter): Promise<CardSummary> {
    await wait(70);
    return buildSummary(filter);
  },

  async createCard(input: CreateCardInput): Promise<CardCredential> {
    await wait(180);
    const validation = await this.validateCardInput(input);
    if (!validation.ok) {
      throw new Error(validation.message ?? 'Card input không hợp lệ.');
    }
    const [lock, owner] = await Promise.all([findLock(input.lockId), findOwner(input.ownerId)]);
    if (!lock || !owner) {
      throw new Error('Thiếu khóa hoặc người nhận.');
    }
    const nowTs = Date.now();
    const card: CardCredential = {
      id: `card-${input.lockId}-${input.cardId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${String(nowTs).slice(-4)}`,
      cardId: input.cardId.trim().toUpperCase(),
      lockId: lock.id,
      lockName: lock.name,
      roomName: lock.roomName,
      ownerId: owner.id,
      ownerName: owner.fullName,
      title: input.title.trim() || `${labelForKind(input.kind)} · ${owner.fullName}`,
      kind: input.kind,
      status: input.offline || input.kind === 'offline' || lock.connectionState === 'offline' ? 'offline' : 'active',
      syncState: input.offline || input.kind === 'offline' || lock.connectionState === 'offline' ? 'offline' : 'synced',
      validFrom: input.validFrom,
      validTo: input.validTo,
      createdAt: nowTs,
      updatedAt: nowTs,
      offlineAllowed: input.offline || input.kind === 'offline',
      bookingLink: createBookingForCard(input.kind, owner, lock, input.validFrom, input.validTo),
    };
    cardCredentials.unshift(card);
    await syncCredentialHub(card);
    await addCardRecord(card, 'success', `Tạo thẻ ${card.cardId} cho ${card.ownerName}`);
    await MockLockRepository.updateLockRuntimeState(card.lockId, {activeCredentialCount: lock.activeCredentialCount + 1, lastActivity: 'Thêm thẻ mở khóa · vừa xong'});
    return cloneCard(card);
  },

  async revokeCard(cardCredentialId: string, revokedBy = 'Admin Aplus'): Promise<CardCredential | undefined> {
    await wait(130);
    let updated: CardCredential | undefined;
    cardCredentials = cardCredentials.map(card => {
      if (card.id !== cardCredentialId) {
        return card;
      }
      updated = {...card, status: 'revoked', syncState: card.syncState === 'offline' ? 'offline' : 'synced', revokedAt: Date.now(), revokedBy, updatedAt: Date.now()};
      return updated;
    });
    if (!updated) {
      return undefined;
    }
    await syncCredentialHub(updated);
    await MockCredentialRepository.revokeCredential(`cred-card-${updated.id}`, revokedBy);
    await addCardRecord(updated, 'blocked', `Thu hồi thẻ ${updated.cardId}`, 'Card revoked');
    return cloneCard(updated);
  },

  async simulateUse(cardCredentialId: string): Promise<CardCredential | undefined> {
    await wait(120);
    let updated: CardCredential | undefined;
    const card = cardCredentials.find(item => item.id === cardCredentialId);
    if (!card) {
      return undefined;
    }
    const currentStatus = statusFromDates(card);
    if (currentStatus === 'expired' || currentStatus === 'revoked') {
      await addCardRecord({...card, status: currentStatus}, 'failed', `Thẻ ${card.cardId} bị từ chối`, currentStatus === 'expired' ? 'Credential expired' : 'Credential revoked');
      return cloneCard({...card, status: currentStatus});
    }
    cardCredentials = cardCredentials.map(item => {
      if (item.id !== cardCredentialId) {
        return item;
      }
      updated = {...item, status: currentStatus, lastUsedAt: Date.now(), updatedAt: Date.now()};
      return updated;
    });
    await addCardRecord(updated!, 'success', `Mở khóa bằng thẻ ${updated!.cardId}`);
    return cloneCard(updated!);
  },

  async checkoutCard(cardCredentialId: string): Promise<CardCredential | undefined> {
    await wait(150);
    const card = cardCredentials.find(item => item.id === cardCredentialId);
    if (!card) {
      return undefined;
    }
    const updatedBooking = card.bookingLink ? {...card.bookingLink, status: 'checkedOut' as const, checkOutAt: Date.now()} : undefined;
    cardCredentials = cardCredentials.map(item => item.id === cardCredentialId ? {...item, bookingLink: updatedBooking, status: 'revoked', syncState: item.syncState === 'offline' ? 'offline' : 'synced', revokedAt: Date.now(), revokedBy: 'PMS checkout', updatedAt: Date.now()} : item);
    const updated = cardCredentials.find(item => item.id === cardCredentialId)!;
    await syncCredentialHub(updated);
    await MockCredentialRepository.revokeCredential(`cred-card-${updated.id}`, 'PMS checkout');
    await addCardRecord(updated, 'blocked', `Checkout thu hồi thẻ ${updated.cardId}`, 'Checkout revoked card credential');
    return cloneCard(updated);
  },
};

function labelForKind(kind: CardKind) {
  switch (kind) {
    case 'hotel':
      return 'Thẻ khách sạn';
    case 'staff':
      return 'Thẻ nhân viên';
    case 'offline':
      return 'Thẻ offline';
    default:
      return 'Thẻ thường';
  }
}

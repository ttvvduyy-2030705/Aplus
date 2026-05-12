import type {SyncState} from './common';
import type {CredentialStatus} from './credential';

export type CardKind = 'standard' | 'staff' | 'hotel' | 'offline';
export type CardCredentialStatus = 'active' | 'expired' | 'offline' | 'revoked' | 'pendingSync';

export type CardReaderState = {
  status: 'idle' | 'waiting' | 'scanning' | 'success' | 'duplicate' | 'failed';
  message: string;
  scannedCardId?: string;
  lastScanAt?: number;
};

export type BookingLink = {
  bookingId: string;
  guestName: string;
  roomName: string;
  checkInAt: number;
  checkOutAt: number;
  status: 'checkedIn' | 'checkedOut' | 'cancelled';
};

export type CardCredential = {
  id: string;
  cardId: string;
  lockId: string;
  lockName: string;
  roomName: string;
  ownerId: string;
  ownerName: string;
  title: string;
  kind: CardKind;
  status: CardCredentialStatus;
  syncState: SyncState;
  validFrom: number;
  validTo?: number;
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
  revokedAt?: number;
  revokedBy?: string;
  bookingLink?: BookingLink;
  offlineAllowed: boolean;
};

export type CreateCardInput = {
  cardId: string;
  lockId: string;
  ownerId: string;
  title: string;
  kind: CardKind;
  validFrom: number;
  validTo?: number;
  offline: boolean;
};

export type CardFilter = {
  lockId?: string;
  ownerId?: string;
  kind?: CardKind | 'all';
  status?: CardCredentialStatus | 'all';
  query?: string;
};

export type CardPolicy = {
  blockDuplicateCardIdInSameLock: boolean;
  hotelCardRequiresValidCheckout: boolean;
  offlineCardMaxDays: number;
  allowExpiredUse: boolean;
};

export type CardValidationResult = {
  ok: boolean;
  message?: string;
};

export type CardSummary = {
  total: number;
  active: number;
  expired: number;
  offline: number;
  revoked: number;
  pending: number;
};

export type CardToCredentialInput = {
  credentialId: string;
  cardId: string;
  title: string;
  ownerId: string;
  ownerName: string;
  lockId: string;
  lockName: string;
  roomName: string;
  status: CredentialStatus;
  syncState: SyncState;
  expiresAt?: number;
};

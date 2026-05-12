import type {SyncState} from './common';

export type BookingStatus = 'reserved' | 'checkedIn' | 'checkedOut' | 'cancelled' | 'noShow';
export type BookingSource = 'manual' | 'import' | 'selfCheckIn';
export type PmsCredentialMethod = 'password' | 'card' | 'phone';
export type PmsJobStatus = 'pending' | 'success' | 'failed' | 'revoked';
export type SelfCheckInStatus = 'pending' | 'verified' | 'expired' | 'completed' | 'cancelled';

export type Booking = {
  id: string;
  code: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  roomId: string;
  roomName: string;
  lockId: string;
  lockName: string;
  checkInAt: number;
  checkOutAt: number;
  status: BookingStatus;
  source: BookingSource;
  notes?: string;
  credentialJobIds: string[];
  selfCheckInSessionId?: string;
  createdAt: number;
  updatedAt: number;
};

export type BookingFilter = {
  status?: BookingStatus | 'all';
  query?: string;
  date?: string;
};

export type CreateBookingInput = {
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  roomId: string;
  lockId: string;
  checkInAt: number;
  checkOutAt: number;
  notes?: string;
  source?: BookingSource;
};

export type CheckInInput = {
  bookingId: string;
  methods: PmsCredentialMethod[];
  enableSelfCheckIn?: boolean;
  offline?: boolean;
};

export type CheckOutInput = {
  bookingId: string;
  revokeAllCredentials: boolean;
  lateCheckoutMinutes?: number;
};

export type PmsCredentialJob = {
  id: string;
  bookingId: string;
  method: PmsCredentialMethod;
  credentialId?: string;
  credentialTitle: string;
  status: PmsJobStatus;
  syncState: SyncState;
  message: string;
  validFrom: number;
  validTo: number;
  createdAt: number;
  revokedAt?: number;
};

export type SelfCheckInSession = {
  id: string;
  bookingId: string;
  token: string;
  url: string;
  qrPayload: string;
  status: SelfCheckInStatus;
  guestName: string;
  roomName: string;
  expiresAt: number;
  verifiedAt?: number;
  completedAt?: number;
};

export type BookingImportPreviewRow = {
  row: number;
  guestName: string;
  roomName: string;
  roomId?: string;
  lockId?: string;
  checkInAt?: number;
  checkOutAt?: number;
  status: 'valid' | 'invalid' | 'created';
  message: string;
};

export type PmsSummary = {
  totalBookings: number;
  reserved: number;
  checkedIn: number;
  dueCheckout: number;
  activeCredentials: number;
  selfCheckInPending: number;
};

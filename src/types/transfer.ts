import type {LockConnectionState} from './lock';

export type LockTransferStatus = 'pending' | 'completed' | 'expired' | 'cancelled';
export type LockTransferVerifyMethod = 'appPin' | 'otp' | 'biometric';
export type PreviousOwnerPolicy = 'remove' | 'subAdmin';

export type TransferRecipient = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  existingUser: boolean;
};

export type LockTransferLockSnapshot = {
  lockId: string;
  lockName: string;
  serial: string;
  roomName: string;
  connectionState: LockConnectionState;
  batteryPercent: number;
};

export type LockOwnership = {
  lockId: string;
  lockName: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  roleLabel: string;
  updatedAt: number;
};

export type TransferAuditEntry = {
  id: string;
  transferId: string;
  action: 'created' | 'verified' | 'accepted' | 'expired' | 'cancelled';
  actorName: string;
  message: string;
  createdAt: number;
};

export type LockTransfer = {
  id: string;
  lockIds: string[];
  locks: LockTransferLockSnapshot[];
  fromOwnerId: string;
  fromOwnerName: string;
  recipient: TransferRecipient;
  status: LockTransferStatus;
  verifyMethod: LockTransferVerifyMethod;
  previousOwnerPolicy: PreviousOwnerPolicy;
  token: string;
  acceptUrl: string;
  createdAt: number;
  expiresAt: number;
  acceptedAt?: number;
  completedAt?: number;
  cancelledAt?: number;
  audit: TransferAuditEntry[];
};

export type CreateLockTransferInput = {
  lockIds: string[];
  fromOwnerId: string;
  fromOwnerName: string;
  recipientName: string;
  recipientAccount: string;
  verifyMethod: LockTransferVerifyMethod;
  previousOwnerPolicy: PreviousOwnerPolicy;
  expiresInHours: number;
};

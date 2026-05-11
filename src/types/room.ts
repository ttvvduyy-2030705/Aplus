import type {LockDomainType} from './lock';

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'blocked';

export type RoomBuilding = {
  id: string;
  homeId: string;
  name: string;
  type: LockDomainType;
  address: string;
};

export type RoomFloor = {
  id: string;
  buildingId: string;
  name: string;
  level: number;
};

export type Room = {
  id: string;
  homeId: string;
  buildingId: string;
  floorId: string;
  buildingName: string;
  floorName: string;
  roomNo: string;
  roomName: string;
  status: RoomStatus;
  notes?: string;
  lockIds: string[];
  activeCredentialCount: number;
  memberCount: number;
  bookingActive: boolean;
  createdAt: number;
  updatedAt: number;
};

export type RoomLockAssignment = {
  id: string;
  roomId: string;
  lockId: string;
  assignedAt: number;
  source: 'manual' | 'pairing' | 'import';
};

export type RoomSummary = {
  buildings: number;
  floors: number;
  rooms: number;
  assignedRooms: number;
  unassignedRooms: number;
  blockedRooms: number;
};

export type RoomFormInput = {
  roomId?: string;
  buildingId: string;
  floorId: string;
  roomNo: string;
  roomName: string;
  status: RoomStatus;
  notes?: string;
};

export type RoomImportPreviewRowStatus = 'valid' | 'duplicate' | 'invalid' | 'created';

export type RoomImportPreviewRow = {
  line: number;
  buildingName: string;
  floorName: string;
  roomNo: string;
  roomName: string;
  status: RoomImportPreviewRowStatus;
  error?: string;
};

export type RoomDetail = Room & {
  assignedLocks: Array<{
    id: string;
    name: string;
    serial: string;
    connectionState: string;
    batteryPercent: number;
    activeCredentialCount: number;
  }>;
  peopleWithAccess: Array<{
    personId: string;
    fullName: string;
    role: string;
    credentialCount: number;
  }>;
  canDelete: boolean;
  deleteBlockReason?: string;
};

export type RoomFilter = {
  buildingId?: string;
  floorId?: string;
  status?: RoomStatus | 'all';
  query?: string;
};

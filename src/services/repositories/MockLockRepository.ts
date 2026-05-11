import type {Alert, AlertDedupeKey, AlertFilter, AlertSeverity, AlertSummary, AlertType, CreateTicketInput, IncidentTicket, NotificationPolicy, TicketPriority} from '@/types/alert';
import type {AccessRecord, AplusHome, AplusLock, BatteryReport, DeviceCapabilityMatrix, DeviceDiagnostic, DeviceDiagnosticIssue, FirmwareInfo, LockCapabilities, LockDashboardSummary, LockFilterType, LockSettings, RecordFilter, RecordNote} from '@/types/lock';
import type {PairingCreateLockInput, PairingGateway} from '@/types/pairing';
import type {Room, RoomBuilding, RoomDetail, RoomFilter, RoomFloor, RoomFormInput, RoomImportPreviewRow, RoomLockAssignment, RoomSummary} from '@/types/room';
import type {AnalyticsFilter, AnalyticsSummary, MethodBreakdown, ReportDateRange, ReportExport, ReportExportFormat, RiskLock, TimeSeriesPoint, UserBreakdown} from '@/types/report';

const fullCapabilities: LockCapabilities = {
  supportsRemoteUnlock: true,
  supportsFingerprint: true,
  supportsFace: true,
  supportsCard: true,
  supportsNfc: true,
  supportsRemoteControl: true,
  supportsGateway: true,
  supportsOta: true,
};

const basicCapabilities: LockCapabilities = {
  supportsRemoteUnlock: true,
  supportsFingerprint: true,
  supportsFace: false,
  supportsCard: true,
  supportsNfc: false,
  supportsRemoteControl: true,
  supportsGateway: true,
  supportsOta: true,
};

const officeCapabilities: LockCapabilities = {
  supportsRemoteUnlock: true,
  supportsFingerprint: true,
  supportsFace: true,
  supportsCard: true,
  supportsNfc: true,
  supportsRemoteControl: false,
  supportsGateway: true,
  supportsOta: true,
};

const defaultSettings: LockSettings = {
  remoteUnlockEnabled: true,
  autoLockEnabled: true,
  autoLockSeconds: 12,
  soundEnabled: true,
  doorLeftOpenAlertSeconds: 45,
  lowBatteryThreshold: 20,
};

const pairingGateways: PairingGateway[] = [
  {
    id: 'gateway-s1-05',
    name: 'Gateway S1-05',
    protocol: 'mqtt',
    endpoint: 'mqtts://local.aplus.mock/s1-05',
    online: true,
  },
  {
    id: 'gateway-hotel-07',
    name: 'Gateway Hotel-07',
    protocol: 'mqtt',
    endpoint: 'mqtts://local.aplus.mock/hotel-07',
    online: true,
  },
  {
    id: 'gateway-office-core',
    name: 'Gateway Office Core',
    protocol: 'websocket',
    endpoint: 'wss://local.aplus.mock/office-core',
    online: true,
  },
  {
    id: 'gateway-lab-offline',
    name: 'Gateway Lab Offline',
    protocol: 'mqtt',
    endpoint: 'mqtts://local.aplus.mock/lab-offline',
    online: false,
  },
];

const homes: AplusHome[] = [
  {
    id: 'home-apartment-01',
    name: 'Aplus Smart Home',
    type: 'home',
    address: 'Toà S1 · Khu căn hộ mẫu',
    totalLocks: 0,
    onlineLocks: 0,
    alertCount: 0,
  },
  {
    id: 'home-hotel-01',
    name: 'Aplus Boutique Hotel',
    type: 'hotel',
    address: 'Khối khách sạn · 12 tầng',
    totalLocks: 0,
    onlineLocks: 0,
    alertCount: 0,
  },
  {
    id: 'home-office-01',
    name: 'Aplus Office',
    type: 'office',
    address: 'Văn phòng vận hành · Tầng 8',
    totalLocks: 0,
    onlineLocks: 0,
    alertCount: 0,
  },
];

const roomBuildings: RoomBuilding[] = homes.map(home => ({
  id: `building-${home.id}`,
  homeId: home.id,
  name: home.type === 'home' ? 'Toà S1' : home.type === 'hotel' ? 'Hotel Tower' : 'Văn phòng chính',
  type: home.type,
  address: home.address,
}));

const roomFloors: RoomFloor[] = [
  {id: 'floor-s1-05', buildingId: 'building-home-apartment-01', name: 'Tầng 5', level: 5},
  {id: 'floor-a-12', buildingId: 'building-home-apartment-01', name: 'Tầng 12', level: 12},
  {id: 'floor-hotel-07', buildingId: 'building-home-hotel-01', name: 'Tầng 7', level: 7},
  {id: 'floor-hotel-08', buildingId: 'building-home-hotel-01', name: 'Tầng 8', level: 8},
  {id: 'floor-office-08', buildingId: 'building-home-office-01', name: 'Tầng 8', level: 8},
];

let rooms: Room[] = [];
let roomAssignments: RoomLockAssignment[] = [];


let locks: AplusLock[] = [
  {
    id: 'lock-home-520',
    serial: 'APL-HOME-0520',
    name: 'Căn hộ 520',
    homeId: 'home-apartment-01',
    homeName: 'Aplus Smart Home',
    homeType: 'home',
    buildingName: 'Toà S1',
    floorName: 'Tầng 5',
    roomName: 'Căn hộ 520',
    roomNo: '520',
    address: 'Toà S1 · Tầng 5 · Căn 520',
    connectionState: 'online',
    isLocked: true,
    doorState: 'closed',
    batteryPercent: 86,
    batteryState: 'good',
    signalPercent: 94,
    gatewayOnline: true,
    gatewayName: 'Gateway S1-05',
    firmwareVersion: '1.0.0-mock',
    hardwareModel: 'Aplus L5 Pro',
    lastActivity: 'Mở bằng vân tay · 08:42',
    lastSeenAt: 'Vừa xong',
    alertCount: 0,
    activeCredentialCount: 8,
    syncState: 'synced',
    capabilities: fullCapabilities,
    settings: defaultSettings,
    permission: {canRemoteUnlock: true, canLock: true, canManageCredentials: true, canViewRecords: true, canChangeSettings: true},
  },
  {
    id: 'lock-home-1208',
    serial: 'APL-HOME-1208',
    name: 'Cửa chính A1208',
    homeId: 'home-apartment-01',
    homeName: 'Aplus Smart Home',
    homeType: 'home',
    buildingName: 'Toà A',
    floorName: 'Tầng 12',
    roomName: 'Căn A1208',
    roomNo: 'A1208',
    address: 'Toà A · Tầng 12 · Căn A1208',
    connectionState: 'bluetooth-only',
    isLocked: false,
    doorState: 'open',
    batteryPercent: 54,
    batteryState: 'medium',
    signalPercent: 62,
    gatewayOnline: false,
    gatewayName: 'Chưa bind gateway',
    firmwareVersion: '1.0.0-mock',
    hardwareModel: 'Aplus L3',
    lastActivity: 'Mở bằng app · 20 phút trước',
    lastSeenAt: '20 phút trước',
    alertCount: 0,
    activeCredentialCount: 5,
    syncState: 'pending',
    capabilities: basicCapabilities,
    settings: {...defaultSettings, remoteUnlockEnabled: false},
    permission: {canRemoteUnlock: true, canLock: true, canManageCredentials: true, canViewRecords: true, canChangeSettings: true},
  },
  {
    id: 'lock-hotel-0701',
    serial: 'APL-HOTEL-0701',
    name: 'Phòng khách sạn 701',
    homeId: 'home-hotel-01',
    homeName: 'Aplus Boutique Hotel',
    homeType: 'hotel',
    buildingName: 'Hotel Tower',
    floorName: 'Tầng 7',
    roomName: 'Phòng 701',
    roomNo: '701',
    address: 'Hotel Tower · Tầng 7 · Phòng 701',
    connectionState: 'online',
    isLocked: true,
    doorState: 'closed',
    batteryPercent: 72,
    batteryState: 'good',
    signalPercent: 88,
    gatewayOnline: true,
    gatewayName: 'Gateway Hotel-07',
    firmwareVersion: '1.0.1-mock',
    hardwareModel: 'Aplus Hotel Card Pro',
    lastActivity: 'Mã khách lưu trú · 09:10',
    lastSeenAt: '2 phút trước',
    alertCount: 0,
    activeCredentialCount: 12,
    syncState: 'synced',
    capabilities: {...fullCapabilities, supportsFace: false},
    settings: defaultSettings,
    permission: {canRemoteUnlock: true, canLock: true, canManageCredentials: true, canViewRecords: true, canChangeSettings: true},
  },
  {
    id: 'lock-hotel-0802',
    serial: 'APL-HOTEL-0802',
    name: 'Phòng khách sạn 802',
    homeId: 'home-hotel-01',
    homeName: 'Aplus Boutique Hotel',
    homeType: 'hotel',
    buildingName: 'Hotel Tower',
    floorName: 'Tầng 8',
    roomName: 'Phòng 802',
    roomNo: '802',
    address: 'Hotel Tower · Tầng 8 · Phòng 802',
    connectionState: 'offline',
    isLocked: true,
    doorState: 'unknown',
    batteryPercent: 18,
    batteryState: 'low',
    signalPercent: 0,
    gatewayOnline: false,
    gatewayName: 'Gateway Hotel-08',
    firmwareVersion: '0.9.8-mock',
    hardwareModel: 'Aplus Hotel Card Pro',
    lastActivity: 'Mất kết nối · hôm qua',
    lastSeenAt: 'Hôm qua',
    alertCount: 2,
    activeCredentialCount: 6,
    syncState: 'offline',
    capabilities: {...basicCapabilities, supportsRemoteUnlock: true, supportsOta: false},
    settings: defaultSettings,
    permission: {canRemoteUnlock: true, canLock: true, canManageCredentials: true, canViewRecords: true, canChangeSettings: true},
  },
  {
    id: 'lock-office-server',
    serial: 'APL-OFFICE-SRV',
    name: 'Phòng server',
    homeId: 'home-office-01',
    homeName: 'Aplus Office',
    homeType: 'office',
    buildingName: 'Văn phòng chính',
    floorName: 'Tầng 8',
    roomName: 'Server Room',
    roomNo: 'SR-08',
    address: 'Văn phòng chính · Tầng 8 · Server Room',
    connectionState: 'online',
    isLocked: true,
    doorState: 'closed',
    batteryPercent: 91,
    batteryState: 'good',
    signalPercent: 97,
    gatewayOnline: true,
    gatewayName: 'Gateway Office Core',
    firmwareVersion: '1.0.1-mock',
    hardwareModel: 'Aplus Office Face Max',
    lastActivity: 'Nhân sự IT mở · 07:35',
    lastSeenAt: 'Vừa xong',
    alertCount: 0,
    activeCredentialCount: 4,
    syncState: 'synced',
    capabilities: officeCapabilities,
    settings: {...defaultSettings, remoteUnlockEnabled: true, doorLeftOpenAlertSeconds: 20},
    permission: {canRemoteUnlock: true, canLock: true, canManageCredentials: true, canViewRecords: true, canChangeSettings: true},
  },
  {
    id: 'lock-office-meeting',
    serial: 'APL-OFFICE-MTG',
    name: 'Phòng họp Crimson',
    homeId: 'home-office-01',
    homeName: 'Aplus Office',
    homeType: 'office',
    buildingName: 'Văn phòng chính',
    floorName: 'Tầng 8',
    roomName: 'Meeting Crimson',
    roomNo: 'M-02',
    address: 'Văn phòng chính · Tầng 8 · Meeting Crimson',
    connectionState: 'syncing',
    isLocked: false,
    doorState: 'left-open',
    batteryPercent: 36,
    batteryState: 'medium',
    signalPercent: 78,
    gatewayOnline: true,
    gatewayName: 'Gateway Office East',
    firmwareVersion: '1.0.0-mock',
    hardwareModel: 'Aplus Meeting L2',
    lastActivity: 'Cửa mở quá lâu · 3 phút trước',
    lastSeenAt: 'Vừa xong',
    alertCount: 1,
    activeCredentialCount: 9,
    syncState: 'pending',
    capabilities: {...officeCapabilities, supportsFace: false},
    settings: {...defaultSettings, remoteUnlockEnabled: true},
    permission: {canRemoteUnlock: true, canLock: true, canManageCredentials: true, canViewRecords: true, canChangeSettings: false},
  },
];

const accessRecords: AccessRecord[] = [
  {
    id: 'record-seed-001',
    lockId: 'lock-home-520',
    lockName: 'Căn hộ 520',
    roomName: 'Căn hộ 520',
    method: 'Fingerprint',
    result: 'success',
    credentialId: 'fingerprint-admin-01',
    personId: 'person-admin',
    userId: 'user-admin',
    sourceIp: '10.0.0.24',
    deviceName: 'Aplus L5 Pro · Gateway S1-05',
    gatewayName: 'Gateway S1-05',
    batteryPercentAtEvent: 86,
    actorName: 'Admin Aplus',
    message: 'Mở cửa bằng vân tay mock',
    note: 'Khách báo mở cửa bình thường, không có bất thường.',
    createdAt: Date.now() - 1000 * 60 * 24,
  },
  {
    id: 'record-seed-002',
    lockId: 'lock-hotel-0802',
    lockName: 'Phòng khách sạn 802',
    roomName: 'Phòng 802',
    method: 'Gateway',
    result: 'failed',
    failureReason: 'Gateway heartbeat timeout',
    sourceIp: '10.0.7.8',
    deviceName: 'Gateway Hotel-08',
    gatewayName: 'Gateway Hotel-08',
    ticketId: 'ticket-offline-0802',
    batteryPercentAtEvent: 18,
    actorName: 'Gateway Hotel-08',
    message: 'Thiết bị offline, không nhận heartbeat',
    note: 'Cần kiểm tra gateway tầng 8 và nguồn cấp.',
    createdAt: Date.now() - 1000 * 60 * 80,
  },
  {
    id: 'record-seed-003',
    lockId: 'lock-hotel-0701',
    lockName: 'Phòng khách sạn 701',
    roomName: 'Phòng 701',
    method: 'PIN',
    result: 'success',
    credentialId: 'pwd-booking-701',
    personId: 'guest-booking-701',
    sourceIp: '10.0.7.21',
    deviceName: 'Keypad · Aplus Hotel Card Pro',
    gatewayName: 'Gateway Hotel-07',
    batteryPercentAtEvent: 72,
    actorName: 'Khách lưu trú 701',
    message: 'Mã khách lưu trú mở cửa trong thời hạn booking',
    createdAt: Date.now() - 1000 * 60 * 145,
  },
  {
    id: 'record-seed-004',
    lockId: 'lock-office-meeting',
    lockName: 'Phòng họp Crimson',
    roomName: 'Meeting Crimson',
    method: 'System',
    result: 'failed',
    failureReason: 'Door left open longer than threshold',
    sourceIp: '10.0.8.12',
    deviceName: 'Door sensor · Aplus Meeting L2',
    gatewayName: 'Gateway Office East',
    ticketId: 'ticket-door-crimson',
    batteryPercentAtEvent: 36,
    actorName: 'Door sensor',
    message: 'Cửa mở quá lâu so với ngưỡng cấu hình',
    createdAt: Date.now() - 1000 * 60 * 190,
  },
  {
    id: 'record-seed-005',
    lockId: 'lock-home-520',
    lockName: 'Căn hộ 520',
    roomName: 'Căn hộ 520',
    method: 'Card',
    result: 'failed',
    credentialId: 'card-old-520',
    personId: 'person-guest-old',
    failureReason: 'Credential expired',
    sourceIp: '10.0.0.25',
    deviceName: 'Card reader · Aplus L5 Pro',
    gatewayName: 'Gateway S1-05',
    batteryPercentAtEvent: 86,
    actorName: 'Thẻ đã hết hạn',
    message: 'Thẻ cũ bị từ chối vì đã hết hạn',
    createdAt: Date.now() - 1000 * 60 * 260,
  },
];


let notificationPolicy: NotificationPolicy = {
  enabled: true,
  severityThreshold: 'Medium',
  cooldownMinutes: 15,
  dedupeWindowMinutes: 60,
  pushCriticalOnly: false,
  mutedTypes: [],
};

const alerts: Alert[] = [
  {
    id: 'alert-offline-0802',
    lockId: 'lock-hotel-0802',
    lockName: 'Phòng khách sạn 802',
    roomName: 'Phòng 802',
    type: 'offline',
    severity: 'High',
    title: 'Gateway tầng 8 mất kết nối',
    message: 'Không nhận heartbeat từ Gateway Hotel-08, cần kiểm tra nguồn hoặc MQTT binding.',
    status: 'unread',
    dedupeKey: 'offline:lock-hotel-0802',
    eventCount: 2,
    relatedRecordIds: ['record-seed-002'],
    ticketId: 'ticket-offline-0802',
    assignee: 'Kỹ thuật tầng 8',
    createdAt: Date.now() - 1000 * 60 * 80,
    updatedAt: Date.now() - 1000 * 60 * 32,
    lastEventAt: Date.now() - 1000 * 60 * 80,
    lastNotificationAt: Date.now() - 1000 * 60 * 75,
    note: 'Batch 15 seed: gateway offline cần xử lý trong SLA 4h.',
  },
  {
    id: 'alert-door-crimson',
    lockId: 'lock-office-meeting',
    lockName: 'Phòng họp Crimson',
    roomName: 'Meeting Crimson',
    type: 'door_left_open',
    severity: 'Medium',
    title: 'Cửa phòng họp mở quá lâu',
    message: 'Door sensor báo cửa mở vượt ngưỡng cấu hình, có thể cần nhắc người phụ trách tầng.',
    status: 'read',
    dedupeKey: 'door_left_open:lock-office-meeting',
    eventCount: 1,
    relatedRecordIds: ['record-seed-004'],
    ticketId: 'ticket-door-crimson',
    assignee: 'Bảo vệ văn phòng',
    createdAt: Date.now() - 1000 * 60 * 190,
    updatedAt: Date.now() - 1000 * 60 * 118,
    lastEventAt: Date.now() - 1000 * 60 * 190,
    lastNotificationAt: Date.now() - 1000 * 60 * 184,
  },
  {
    id: 'alert-failed-card-520',
    lockId: 'lock-home-520',
    lockName: 'Căn hộ 520',
    roomName: 'Căn hộ 520',
    type: 'failed_attempts',
    severity: 'Low',
    title: 'Thẻ hết hạn bị từ chối',
    message: 'Phát hiện credential cũ bị từ chối; nên xác minh người dùng hoặc thu hồi thẻ.',
    status: 'unread',
    dedupeKey: 'failed_attempts:lock-home-520',
    eventCount: 1,
    relatedRecordIds: ['record-seed-005'],
    createdAt: Date.now() - 1000 * 60 * 260,
    updatedAt: Date.now() - 1000 * 60 * 260,
    lastEventAt: Date.now() - 1000 * 60 * 260,
  },
];

const incidentTickets: IncidentTicket[] = [
  {
    id: 'ticket-offline-0802',
    alertId: 'alert-offline-0802',
    lockId: 'lock-hotel-0802',
    lockName: 'Phòng khách sạn 802',
    roomName: 'Phòng 802',
    title: 'Kiểm tra Gateway Hotel-08',
    description: 'Gateway tầng 8 mất heartbeat, kiểm tra nguồn, mạng và MQTT binding.',
    assignee: 'Kỹ thuật tầng 8',
    priority: 'High',
    dueAt: Date.now() + 1000 * 60 * 60 * 4,
    status: 'open',
    attachmentNames: ['gateway-heartbeat-log.txt'],
    createdAt: Date.now() - 1000 * 60 * 74,
    updatedAt: Date.now() - 1000 * 60 * 30,
  },
  {
    id: 'ticket-door-crimson',
    alertId: 'alert-door-crimson',
    lockId: 'lock-office-meeting',
    lockName: 'Phòng họp Crimson',
    roomName: 'Meeting Crimson',
    title: 'Xử lý cửa phòng họp mở lâu',
    description: 'Xác nhận cửa phòng họp đã đóng, kiểm tra cảm biến nếu còn báo mở.',
    assignee: 'Bảo vệ văn phòng',
    priority: 'Medium',
    dueAt: Date.now() + 1000 * 60 * 90,
    status: 'in_progress',
    attachmentNames: [],
    createdAt: Date.now() - 1000 * 60 * 170,
    updatedAt: Date.now() - 1000 * 60 * 118,
  },
];

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function cloneLock(lock: AplusLock): AplusLock {
  const derivedLock = attachDerivedLockState(lock);
  return {
    ...derivedLock,
    capabilities: {...derivedLock.capabilities},
    settings: {...derivedLock.settings},
    permission: {...derivedLock.permission},
  };
}

function cloneRecord(record: AccessRecord): AccessRecord {
  return {...record};
}

function matchesFilter(lock: AplusLock, filter: LockFilterType) {
  return filter === 'all' || lock.homeType === filter;
}


function severityRank(severity: AlertSeverity) {
  const order: Record<AlertSeverity, number> = {Low: 1, Medium: 2, High: 3, Critical: 4};
  return order[severity];
}

function ticketPriorityFor(severity: AlertSeverity): TicketPriority {
  return severity === 'Critical' ? 'Critical' : severity === 'High' ? 'High' : severity === 'Medium' ? 'Medium' : 'Low';
}

function cloneAlert(alert: Alert): Alert {
  return {...alert, relatedRecordIds: [...alert.relatedRecordIds]};
}

function cloneTicket(ticket: IncidentTicket): IncidentTicket {
  return {...ticket, attachmentNames: [...ticket.attachmentNames]};
}


function cloneRoom(room: Room): Room {
  return {...room, lockIds: [...room.lockIds]};
}

function cloneBuilding(building: RoomBuilding): RoomBuilding {
  return {...building};
}

function cloneFloor(floor: RoomFloor): RoomFloor {
  return {...floor};
}

function getBuildingById(buildingId: string) {
  return roomBuildings.find(building => building.id === buildingId);
}

function getFloorById(floorId: string) {
  return roomFloors.find(floor => floor.id === floorId);
}

function roomIdFromLock(lock: AplusLock) {
  return `room-${lock.homeId}-${lock.roomNo.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
}

function findBestBuildingForLock(lock: AplusLock) {
  return roomBuildings.find(building => building.homeId === lock.homeId) ?? roomBuildings[0];
}

function findBestFloorForLock(lock: AplusLock, buildingId: string) {
  const normalized = lock.floorName?.toLowerCase();
  return roomFloors.find(floor => floor.buildingId === buildingId && floor.name.toLowerCase() === normalized)
    ?? roomFloors.find(floor => floor.buildingId === buildingId)
    ?? roomFloors[0];
}

function refreshRoomDerivedFields() {
  const now = Date.now();
  locks.forEach(lock => {
    const exists = rooms.some(room => room.homeId === lock.homeId && room.buildingName === lock.buildingName && room.floorName === lock.floorName && room.roomNo === lock.roomNo);
    if (exists) {
      return;
    }
    const building = findBestBuildingForLock(lock);
    const floor = findBestFloorForLock(lock, building.id);
    rooms.unshift({
      id: roomIdFromLock(lock),
      homeId: lock.homeId,
      buildingId: building.id,
      floorId: floor.id,
      buildingName: lock.buildingName ?? building.name,
      floorName: lock.floorName ?? floor.name,
      roomNo: lock.roomNo,
      roomName: lock.roomName,
      status: lock.homeType === 'hotel' ? 'available' : 'available',
      notes: 'Tự tạo từ khóa mới được pairing/gán.',
      lockIds: [lock.id],
      activeCredentialCount: lock.activeCredentialCount,
      memberCount: lock.activeCredentialCount > 0 ? 2 : 0,
      bookingActive: false,
      createdAt: now,
      updatedAt: now,
    });
  });
  rooms = rooms.map(room => {
    const roomLocks = locks.filter(lock => lock.homeId === room.homeId && lock.buildingName === room.buildingName && lock.floorName === room.floorName && lock.roomNo === room.roomNo);
    const lockIds = roomLocks.map(lock => lock.id);
    return {
      ...room,
      lockIds,
      activeCredentialCount: Math.max(room.activeCredentialCount, roomLocks.reduce((sum, lock) => sum + lock.activeCredentialCount, 0)),
      memberCount: lockIds.length ? Math.max(room.memberCount, Math.min(6, lockIds.length + 2)) : room.memberCount,
    };
  });
  roomAssignments = rooms.flatMap(room => room.lockIds.map(lockId => ({
    id: `assign-${room.id}-${lockId}`,
    roomId: room.id,
    lockId,
    assignedAt: room.updatedAt,
    source: 'manual' as const,
  })));
}

function ensureRoomsSeeded() {
  if (rooms.length > 0) {
    refreshRoomDerivedFields();
    return;
  }
  const now = Date.now();
  const roomMap = new Map<string, Room>();
  locks.forEach(lock => {
    const building = findBestBuildingForLock(lock);
    const floor = findBestFloorForLock(lock, building.id);
    const id = roomIdFromLock(lock);
    const existing = roomMap.get(id);
    if (existing) {
      existing.lockIds.push(lock.id);
      existing.activeCredentialCount += lock.activeCredentialCount;
      existing.memberCount = Math.max(existing.memberCount, Math.min(8, existing.lockIds.length + 2));
      existing.updatedAt = now;
      return;
    }
    roomMap.set(id, {
      id,
      homeId: lock.homeId,
      buildingId: building.id,
      floorId: floor.id,
      buildingName: lock.buildingName ?? building.name,
      floorName: lock.floorName ?? floor.name,
      roomNo: lock.roomNo,
      roomName: lock.roomName,
      status: lock.homeType === 'hotel' && lock.roomNo === '701' ? 'occupied' : lock.doorState === 'unknown' ? 'maintenance' : 'available',
      notes: lock.homeType === 'hotel' ? 'Phòng đồng bộ từ PMS/mock hotel.' : undefined,
      lockIds: [lock.id],
      activeCredentialCount: lock.activeCredentialCount,
      memberCount: Math.min(8, Math.max(2, lock.activeCredentialCount > 0 ? 3 : 1)),
      bookingActive: lock.homeType === 'hotel' && lock.roomNo === '701',
      createdAt: now - 1000 * 60 * 60 * 24,
      updatedAt: now - 1000 * 60 * 28,
    });
  });
  rooms = Array.from(roomMap.values());
  refreshRoomDerivedFields();
}

function roomMatchesFilter(room: Room, filter?: RoomFilter) {
  const query = filter?.query?.trim().toLowerCase();
  return (!filter?.buildingId || room.buildingId === filter.buildingId)
    && (!filter?.floorId || room.floorId === filter.floorId)
    && (!filter?.status || filter.status === 'all' || room.status === filter.status)
    && (!query
      || room.roomNo.toLowerCase().includes(query)
      || room.roomName.toLowerCase().includes(query)
      || room.buildingName.toLowerCase().includes(query)
      || room.floorName.toLowerCase().includes(query)
      || room.notes?.toLowerCase().includes(query));
}

function buildRoomSummary(): RoomSummary {
  ensureRoomsSeeded();
  return {
    buildings: roomBuildings.length,
    floors: roomFloors.length,
    rooms: rooms.length,
    assignedRooms: rooms.filter(room => room.lockIds.length > 0).length,
    unassignedRooms: rooms.filter(room => room.lockIds.length === 0).length,
    blockedRooms: rooms.filter(room => room.status === 'blocked' || room.status === 'maintenance').length,
  };
}

function duplicateRoomExists(input: RoomFormInput) {
  return rooms.some(room => room.floorId === input.floorId && room.roomNo.trim().toLowerCase() === input.roomNo.trim().toLowerCase() && room.id !== input.roomId);
}

function updateLocksForRoom(room: Room) {
  locks = locks.map(lock => {
    if (!room.lockIds.includes(lock.id)) {
      return lock;
    }
    return {
      ...lock,
      homeId: room.homeId,
      buildingName: room.buildingName,
      floorName: room.floorName,
      roomNo: room.roomNo,
      roomName: room.roomName,
      address: `${room.buildingName} · ${room.floorName} · ${room.roomName}`,
      lastActivity: 'Cập nhật gán phòng · vừa xong',
    };
  });
}

function buildPeopleWithAccess(room: Room): RoomDetail['peopleWithAccess'] {
  const basePeople = [
    {personId: 'person-admin', fullName: 'Admin Aplus', role: 'Owner', credentialCount: Math.max(1, room.lockIds.length)},
    {personId: 'person-cleaner-01', fullName: 'Tổ buồng phòng', role: 'Cleaner', credentialCount: room.status === 'occupied' ? 1 : 0},
    {personId: 'person-security-01', fullName: 'Bảo vệ ca trực', role: 'Security', credentialCount: room.lockIds.length ? 1 : 0},
  ];
  if (room.bookingActive) {
    basePeople.push({personId: 'person-guest-room', fullName: `Khách lưu trú ${room.roomNo}`, role: 'Guest', credentialCount: 1});
  }
  return basePeople.filter(person => person.credentialCount > 0);
}

function buildRoomDetail(room: Room): RoomDetail {
  const assignedLocks = room.lockIds
    .map(lockId => locks.find(lock => lock.id === lockId))
    .filter((lock): lock is AplusLock => Boolean(lock))
    .map(lock => ({
      id: lock.id,
      name: lock.name,
      serial: lock.serial,
      connectionState: lock.connectionState,
      batteryPercent: lock.batteryPercent,
      activeCredentialCount: lock.activeCredentialCount,
    }));
  const activeCredentialCount = assignedLocks.reduce((sum, lock) => sum + lock.activeCredentialCount, room.activeCredentialCount > 0 && assignedLocks.length === 0 ? room.activeCredentialCount : 0);
  const bookingActive = room.bookingActive;
  const canDelete = room.lockIds.length === 0 && activeCredentialCount === 0 && !bookingActive;
  const deleteBlockReason = room.lockIds.length > 0
    ? 'Phòng đang có khóa gán vào, cần gỡ/gán sang phòng khác trước.'
    : activeCredentialCount > 0
      ? 'Phòng còn credential active, cần thu hồi trước khi xóa.'
      : bookingActive
        ? 'Phòng đang có booking/khách lưu trú active.'
        : undefined;
  return {
    ...cloneRoom({...room, activeCredentialCount, bookingActive}),
    assignedLocks,
    peopleWithAccess: buildPeopleWithAccess(room),
    canDelete,
    deleteBlockReason,
  };
}

function parseImportCsv(csvText: string): RoomImportPreviewRow[] {
  ensureRoomsSeeded();
  const lines = csvText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  return lines.map((line, index) => {
    const [buildingName = '', floorName = '', roomNo = '', roomName = ''] = line.split(',').map(item => item.trim());
    const building = roomBuildings.find(item => item.name.toLowerCase() === buildingName.toLowerCase());
    const floor = building ? roomFloors.find(item => item.buildingId === building.id && item.name.toLowerCase() === floorName.toLowerCase()) : undefined;
    if (!buildingName || !floorName || !roomNo || !roomName) {
      return {line: index + 1, buildingName, floorName, roomNo, roomName, status: 'invalid', error: 'Thiếu cột. Cần: building,floor,roomNo,roomName'};
    }
    if (!building || !floor) {
      return {line: index + 1, buildingName, floorName, roomNo, roomName, status: 'invalid', error: 'Không tìm thấy building/floor trong mock'};
    }
    const duplicate = rooms.some(room => room.floorId === floor.id && room.roomNo.toLowerCase() === roomNo.toLowerCase());
    return {line: index + 1, buildingName, floorName, roomNo, roomName, status: duplicate ? 'duplicate' : 'valid', error: duplicate ? 'Trùng roomNo trong cùng tầng' : undefined};
  });
}

function countActiveAlerts(lockId: string) {
  return alerts.filter(alert => alert.lockId === lockId && alert.status !== 'resolved' && alert.status !== 'ignored').length;
}

function alertMatchesFilter(alert: Alert, filter?: AlertFilter) {
  if (!filter) {
    return true;
  }
  const query = filter.query?.trim().toLowerCase();
  return (!filter.lockId || alert.lockId === filter.lockId)
    && (!filter.status || filter.status === 'all' || alert.status === filter.status)
    && (!filter.severity || filter.severity === 'all' || alert.severity === filter.severity)
    && (!query
      || alert.lockName.toLowerCase().includes(query)
      || alert.roomName.toLowerCase().includes(query)
      || alert.title.toLowerCase().includes(query)
      || alert.message.toLowerCase().includes(query)
      || alert.assignee?.toLowerCase().includes(query)
      || alert.ticketId?.toLowerCase().includes(query));
}

function buildAlertSummary(): AlertSummary {
  return {
    total: alerts.length,
    unread: alerts.filter(alert => alert.status === 'unread').length,
    critical: alerts.filter(alert => alert.severity === 'Critical' && alert.status !== 'resolved' && alert.status !== 'ignored').length,
    high: alerts.filter(alert => alert.severity === 'High' && alert.status !== 'resolved' && alert.status !== 'ignored').length,
    ticketsOpen: incidentTickets.filter(ticket => ticket.status === 'open' || ticket.status === 'in_progress').length,
    resolved: alerts.filter(alert => alert.status === 'resolved').length,
  };
}

function alertTypeFromRecord(record: AccessRecord): AlertType | undefined {
  if (record.method === 'Battery') {
    return 'battery_low';
  }
  if (record.method === 'Gateway' || record.failureReason?.toLowerCase().includes('offline') || record.failureReason?.toLowerCase().includes('heartbeat')) {
    return 'offline';
  }
  if (record.failureReason?.toLowerCase().includes('door left open') || record.message.toLowerCase().includes('cửa mở quá lâu')) {
    return 'door_left_open';
  }
  if (record.failureReason?.toLowerCase().includes('tamper')) {
    return 'tamper';
  }
  if (record.result === 'failed' || record.result === 'blocked' || record.result === 'timeout') {
    return 'failed_attempts';
  }
  return undefined;
}

function severityFromRecord(record: AccessRecord, type: AlertType): AlertSeverity {
  if (type === 'battery_low') {
    return (record.batteryPercentAtEvent ?? 100) <= 10 ? 'Critical' : 'High';
  }
  if (type === 'offline') {
    return 'High';
  }
  if (type === 'tamper') {
    return 'Critical';
  }
  if (type === 'door_left_open') {
    return 'Medium';
  }
  return record.result === 'timeout' ? 'Medium' : 'Low';
}

function titleForAlert(type: AlertType, lockName: string) {
  switch (type) {
    case 'battery_low':
      return `Pin yếu · ${lockName}`;
    case 'door_left_open':
      return `Cửa mở lâu · ${lockName}`;
    case 'tamper':
      return `Cảnh báo cạy phá · ${lockName}`;
    case 'offline':
      return `Mất kết nối · ${lockName}`;
    case 'failed_attempts':
      return `Mở khóa thất bại · ${lockName}`;
    default:
      return `Cảnh báo · ${lockName}`;
  }
}

function shouldNotifyAlert(alert: Alert) {
  if (!notificationPolicy.enabled || notificationPolicy.mutedTypes.includes(alert.type)) {
    return false;
  }
  if (notificationPolicy.pushCriticalOnly && alert.severity !== 'Critical') {
    return false;
  }
  if (severityRank(alert.severity) < severityRank(notificationPolicy.severityThreshold)) {
    return false;
  }
  const cooldownMs = notificationPolicy.cooldownMinutes * 60 * 1000;
  return !alert.lastNotificationAt || Date.now() - alert.lastNotificationAt >= cooldownMs;
}

function upsertAlertFromRecord(record: AccessRecord) {
  const type = alertTypeFromRecord(record);
  if (!type) {
    return undefined;
  }
  const dedupeKey: AlertDedupeKey = `${type}:${record.lockId}`;
  const now = Date.now();
  const existing = alerts.find(alert => alert.dedupeKey === dedupeKey && alert.status !== 'resolved' && alert.status !== 'ignored');
  if (existing) {
    existing.eventCount += 1;
    existing.relatedRecordIds = Array.from(new Set([record.id, ...existing.relatedRecordIds]));
    existing.message = record.failureReason ?? record.message;
    existing.severity = severityRank(severityFromRecord(record, type)) > severityRank(existing.severity) ? severityFromRecord(record, type) : existing.severity;
    existing.status = existing.status === 'resolved' || existing.status === 'ignored' ? 'unread' : existing.status;
    existing.updatedAt = now;
    existing.lastEventAt = record.createdAt;
    if (shouldNotifyAlert(existing)) {
      existing.lastNotificationAt = now;
    }
    return existing;
  }
  const severity = severityFromRecord(record, type);
  const alert: Alert = {
    id: `alert-${type}-${record.lockId}-${now}`,
    lockId: record.lockId,
    lockName: record.lockName,
    roomName: record.roomName,
    type,
    severity,
    title: titleForAlert(type, record.lockName),
    message: record.failureReason ?? record.message,
    status: 'unread',
    dedupeKey,
    eventCount: 1,
    relatedRecordIds: [record.id],
    createdAt: now,
    updatedAt: now,
    lastEventAt: record.createdAt,
    lastNotificationAt: undefined,
  };
  if (shouldNotifyAlert(alert)) {
    alert.lastNotificationAt = now;
  }
  alerts.unshift(alert);
  return alert;
}

function lowBatteryAlertActive(lock: AplusLock) {
  return lock.batteryPercent <= lock.settings.lowBatteryThreshold;
}

function effectiveAlertCount(lock: AplusLock) {
  const derivedAlerts = [
    lowBatteryAlertActive(lock),
    lock.doorState === 'left-open',
    lock.connectionState === 'offline' || !lock.gatewayOnline,
  ].filter(Boolean).length;
  return Math.max(lock.alertCount, derivedAlerts, countActiveAlerts(lock.id));
}

function attachDerivedLockState(lock: AplusLock): AplusLock {
  return {
    ...lock,
    alertCount: effectiveAlertCount(lock),
    batteryState: lock.batteryPercent <= 10 ? 'critical' : lock.batteryPercent <= lock.settings.lowBatteryThreshold ? 'low' : lock.batteryPercent <= 60 ? 'medium' : 'good',
  };
}

function buildBatteryTrend(lock: AplusLock) {
  const dailyDrain = lock.connectionState === 'offline' ? 1 : lock.gatewayOnline ? 2 : 3;
  return Array.from({length: 7}, (_, index) => {
    const daysAgo = 6 - index;
    return {
      label: daysAgo === 0 ? 'Hôm nay' : `-${daysAgo}d`,
      percent: Math.min(100, lock.batteryPercent + daysAgo * dailyDrain),
    };
  });
}

function findLastBatteryAlert(lockId: string) {
  return accessRecords.find(record => record.lockId === lockId && record.method === 'Battery' && record.result !== 'success');
}

function ensureBatteryAlertRecord(lock: AplusLock) {
  if (!lowBatteryAlertActive(lock)) {
    return undefined;
  }
  const existing = findLastBatteryAlert(lock.id);
  if (existing) {
    return existing;
  }
  const now = Date.now();
  const record: AccessRecord = {
    id: `record-battery-${lock.id}-${now}`,
    lockId: lock.id,
    lockName: lock.name,
    roomName: lock.roomName,
    method: 'Battery',
    result: lock.batteryPercent <= 10 ? 'failed' : 'blocked',
    failureReason: lock.batteryPercent <= 10 ? 'Battery critical' : 'Battery low',
    sourceIp: lock.gatewayOnline ? 'gateway://battery-monitor' : 'offline-cache://battery-monitor',
    deviceName: lock.hardwareModel ?? 'Aplus Lock',
    gatewayName: lock.gatewayName,
    ticketId: `battery-${lock.id}`,
    batteryPercentAtEvent: lock.batteryPercent,
    actorName: 'Battery monitor',
    message: `Pin ${lock.batteryPercent}% thấp hơn ngưỡng ${lock.settings.lowBatteryThreshold}%`,
    note: 'Batch 13 tự tạo alert pin yếu để Home hiển thị badge cảnh báo.',
    createdAt: now,
  };
  accessRecords.unshift(record);
  upsertAlertFromRecord(record);
  return record;
}

function buildBatteryReport(lock: AplusLock): BatteryReport {
  const derivedLock = attachDerivedLockState(lock);
  const alert = ensureBatteryAlertRecord(derivedLock);
  const estimatedDaysRemaining = Math.max(1, Math.round(derivedLock.batteryPercent / (derivedLock.connectionState === 'offline' ? 1 : derivedLock.gatewayOnline ? 2 : 3)));
  return {
    lockId: derivedLock.id,
    lockName: derivedLock.name,
    roomName: derivedLock.roomName,
    batteryPercent: derivedLock.batteryPercent,
    batteryState: derivedLock.batteryState,
    threshold: derivedLock.settings.lowBatteryThreshold,
    lastAlertAt: alert?.createdAt,
    alertActive: lowBatteryAlertActive(derivedLock),
    trend: buildBatteryTrend(derivedLock),
    estimatedDaysRemaining,
    recommendedAction: lowBatteryAlertActive(derivedLock)
      ? derivedLock.batteryPercent <= 10
        ? 'Pin rất thấp: ưu tiên thay pin ngay và kiểm tra lịch sử offline.'
        : 'Lên lịch thay pin, thông báo cho người phụ trách phòng.'
      : 'Pin ổn định, tiếp tục theo dõi xu hướng giảm.',
  };
}

function recordMatchesFilter(record: AccessRecord, filter?: RecordFilter) {
  if (!filter) {
    return true;
  }
  const query = filter.query?.trim().toLowerCase();
  return (!filter.lockId || record.lockId === filter.lockId)
    && (!filter.method || filter.method === 'all' || record.method === filter.method)
    && (!filter.result || filter.result === 'all' || record.result === filter.result)
    && (!query
      || record.lockName.toLowerCase().includes(query)
      || record.roomName.toLowerCase().includes(query)
      || record.actorName.toLowerCase().includes(query)
      || record.message.toLowerCase().includes(query)
      || record.credentialId?.toLowerCase().includes(query)
      || record.commandId?.toLowerCase().includes(query));
}

function countRecentFailedRecords(lockId: string) {
  const cutoff = Date.now() - 1000 * 60 * 60 * 24;
  return accessRecords.filter(record => record.lockId === lockId && record.createdAt >= cutoff && (record.result === 'failed' || record.result === 'blocked')).length;
}

function applyRecordSideEffects(record: AccessRecord) {
  upsertAlertFromRecord(record);
  locks = locks.map(lock => {
    if (lock.id !== record.lockId) {
      return lock;
    }
    const failedCount = countRecentFailedRecords(lock.id);
    const hasNewAlert = record.result === 'failed' || record.result === 'blocked' || lowBatteryAlertActive(lock);
    return {
      ...lock,
      alertCount: hasNewAlert ? Math.max(lock.alertCount, failedCount, effectiveAlertCount(lock)) : lock.alertCount,
      lastActivity: `${record.method} · ${record.result}`,
    };
  });
}

function buildHomesWithCounts(): AplusHome[] {
  return homes.map(home => {
    const homeLocks = locks.filter(lock => lock.homeId === home.id);
    return {
      ...home,
      totalLocks: homeLocks.length,
      onlineLocks: homeLocks.filter(lock => lock.connectionState === 'online' || lock.connectionState === 'syncing').length,
      alertCount: homeLocks.reduce((total, lock) => total + effectiveAlertCount(lock), 0),
    };
  });
}


function compareVersion(version: string): number[] {
  return version
    .replace(/[^0-9.].*$/, '')
    .split('.')
    .map(part => Number(part) || 0);
}

function isVersionBehind(currentVersion: string, latestVersion: string) {
  const current = compareVersion(currentVersion);
  const latest = compareVersion(latestVersion);
  for (let index = 0; index < Math.max(current.length, latest.length); index += 1) {
    const currentPart = current[index] ?? 0;
    const latestPart = latest[index] ?? 0;
    if (currentPart < latestPart) {
      return true;
    }
    if (currentPart > latestPart) {
      return false;
    }
  }
  return false;
}

function latestFirmwareFor(lock: AplusLock) {
  if (!lock.capabilities.supportsOta) {
    return undefined;
  }
  if (lock.hardwareModel?.toLowerCase().includes('hotel')) {
    return '1.1.0-mock';
  }
  if (lock.hardwareModel?.toLowerCase().includes('face')) {
    return '1.2.0-mock';
  }
  return '1.0.2-mock';
}

function buildFirmwareInfo(lock: AplusLock): FirmwareInfo {
  const latestVersion = latestFirmwareFor(lock);
  const updateAvailable = Boolean(latestVersion && isVersionBehind(lock.firmwareVersion, latestVersion));
  return {
    currentVersion: lock.firmwareVersion,
    latestVersion,
    updateAvailable,
    required: lock.batteryPercent < 25 || lock.connectionState === 'syncing',
    packageSizeMb: updateAvailable ? lock.hardwareModel?.toLowerCase().includes('face') ? 6.4 : 3.8 : undefined,
    channel: 'stable',
  };
}

function buildDiagnostic(lock: AplusLock): DeviceDiagnostic {
  const issues: DeviceDiagnosticIssue[] = [];
  if (lock.connectionState === 'offline' || !lock.gatewayOnline) {
    issues.push({
      code: 'CONNECTION_OFFLINE',
      severity: lock.connectionState === 'offline' ? 'critical' : 'warning',
      title: 'Kết nối gateway không ổn định',
      message: 'Kiểm tra nguồn gateway, MQTT/WebSocket binding và khoảng cách tới khóa.',
    });
  }
  if (lock.batteryPercent <= lock.settings.lowBatteryThreshold) {
    issues.push({
      code: 'BATTERY_LOW',
      severity: lock.batteryPercent <= 10 ? 'critical' : 'warning',
      title: 'Pin dưới ngưỡng cảnh báo',
      message: `Pin ${lock.batteryPercent}% thấp hơn ngưỡng ${lock.settings.lowBatteryThreshold}%.`,
    });
  }
  if (lock.doorState === 'left-open') {
    issues.push({
      code: 'DOOR_LEFT_OPEN',
      severity: 'warning',
      title: 'Cửa mở quá lâu',
      message: `Cửa vượt ngưỡng ${lock.settings.doorLeftOpenAlertSeconds}s, cần kiểm tra cảm biến cửa.`,
    });
  }
  if (lock.signalPercent < 40) {
    issues.push({
      code: 'SIGNAL_WEAK',
      severity: 'warning',
      title: 'Tín hiệu yếu',
      message: 'Đặt gateway gần khóa hơn hoặc kiểm tra nhiễu Wi‑Fi/BLE.',
    });
  }
  if (!lock.capabilities.supportsOta) {
    issues.push({
      code: 'OTA_UNSUPPORTED',
      severity: 'warning',
      title: 'Model không hỗ trợ OTA',
      message: 'Cần bảo trì thủ công nếu cần nâng firmware.',
    });
  }
  const penalty = issues.reduce((score, issue) => score + (issue.severity === 'critical' ? 32 : issue.severity === 'warning' ? 14 : 0), 0);
  const healthScore = Math.max(0, 100 - penalty);
  const status = healthScore < 55 ? 'critical' : healthScore < 82 ? 'attention' : 'healthy';
  return {
    lockId: lock.id,
    healthScore,
    status,
    checkedAt: Date.now(),
    connection: {
      gatewayOnline: lock.gatewayOnline,
      signalPercent: lock.signalPercent,
      lastSeenAt: lock.lastSeenAt,
    },
    battery: {
      percent: lock.batteryPercent,
      state: lock.batteryState,
      threshold: lock.settings.lowBatteryThreshold,
    },
    firmware: buildFirmwareInfo(lock),
    errorCodes: issues.map(issue => issue.code),
    issues: issues.length > 0 ? issues : [{
      code: 'OK',
      severity: 'ok',
      title: 'Thiết bị khỏe mạnh',
      message: 'Không phát hiện cảnh báo phần cứng trong diagnostic mock.',
    }],
  };
}

function buildCapabilityMatrix(lock: AplusLock): DeviceCapabilityMatrix {
  return {
    lockId: lock.id,
    model: lock.hardwareModel ?? 'Aplus Mock',
    serial: lock.serial,
    entries: [
      {key: 'supportsRemoteUnlock', label: 'Remote unlock', enabled: lock.capabilities.supportsRemoteUnlock, routeHint: 'UI-30/37/38'},
      {key: 'supportsFingerprint', label: 'Vân tay', enabled: lock.capabilities.supportsFingerprint, routeHint: 'UI-27'},
      {key: 'supportsFace', label: 'Khuôn mặt', enabled: lock.capabilities.supportsFace, routeHint: 'UI-23'},
      {key: 'supportsCard', label: 'Thẻ', enabled: lock.capabilities.supportsCard, routeHint: 'UI-09/25'},
      {key: 'supportsNfc', label: 'NFC / mobile card', enabled: lock.capabilities.supportsNfc, routeHint: 'UI-15'},
      {key: 'supportsRemoteControl', label: 'Remote vật lý', enabled: lock.capabilities.supportsRemoteControl, routeHint: 'UI-24'},
      {key: 'supportsGateway', label: 'Gateway/MQTT', enabled: lock.capabilities.supportsGateway, routeHint: 'UI-12/65'},
      {key: 'supportsOta', label: 'Firmware OTA', enabled: lock.capabilities.supportsOta, routeHint: 'UI-43'},
    ],
  };
}

function buildSummary(list: AplusLock[]): LockDashboardSummary {
  return {
    totalLocks: list.length,
    onlineLocks: list.filter(lock => lock.connectionState === 'online' || lock.connectionState === 'syncing').length,
    offlineLocks: list.filter(lock => lock.connectionState === 'offline').length,
    lowBatteryLocks: list.filter(lock => lock.batteryPercent <= 20).length,
    alertLocks: list.filter(lock => effectiveAlertCount(lock) > 0).length,
    pendingSyncLocks: list.filter(lock => lock.syncState === 'pending' || lock.syncState === 'offline').length,
  };
}


const defaultAnalyticsFilter: AnalyticsFilter = {
  dateRange: 'week',
  homeType: 'all',
  method: 'all',
  result: 'all',
  query: '',
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function cutoffForRange(range: ReportDateRange) {
  const now = Date.now();
  if (range === 'today') {
    return startOfToday();
  }
  if (range === 'week') {
    return now - 1000 * 60 * 60 * 24 * 7;
  }
  if (range === 'month') {
    return now - 1000 * 60 * 60 * 24 * 30;
  }
  return 0;
}

function normalizeAnalyticsFilter(filter?: Partial<AnalyticsFilter>): AnalyticsFilter {
  return {
    ...defaultAnalyticsFilter,
    ...filter,
    method: filter?.method ?? defaultAnalyticsFilter.method,
    result: filter?.result ?? defaultAnalyticsFilter.result,
    query: filter?.query ?? defaultAnalyticsFilter.query,
  };
}

function lockPassesAnalyticsFilter(lock: AplusLock, filter: AnalyticsFilter) {
  return (filter.homeType === 'all' || lock.homeType === filter.homeType)
    && (!filter.lockId || lock.id === filter.lockId);
}

function recordPassesAnalyticsFilter(record: AccessRecord, filter: AnalyticsFilter) {
  const lock = locks.find(item => item.id === record.lockId);
  const query = filter.query?.trim().toLowerCase();
  return record.createdAt >= cutoffForRange(filter.dateRange)
    && (!lock || lockPassesAnalyticsFilter(lock, filter))
    && (!filter.lockId || record.lockId === filter.lockId)
    && (!filter.method || filter.method === 'all' || record.method === filter.method)
    && (!filter.result || filter.result === 'all' || record.result === filter.result)
    && (!query
      || record.lockName.toLowerCase().includes(query)
      || record.roomName.toLowerCase().includes(query)
      || record.actorName.toLowerCase().includes(query)
      || record.message.toLowerCase().includes(query)
      || record.credentialId?.toLowerCase().includes(query)
      || record.commandId?.toLowerCase().includes(query));
}

function alertPassesAnalyticsFilter(alert: Alert, filter: AnalyticsFilter) {
  const lock = locks.find(item => item.id === alert.lockId);
  return alert.createdAt >= cutoffForRange(filter.dateRange)
    && (!lock || lockPassesAnalyticsFilter(lock, filter))
    && (!filter.lockId || alert.lockId === filter.lockId);
}

function getAnalyticsRecords(filter?: Partial<AnalyticsFilter>) {
  const normalized = normalizeAnalyticsFilter(filter);
  return accessRecords.filter(record => recordPassesAnalyticsFilter(record, normalized));
}

function getAnalyticsLocks(filter?: Partial<AnalyticsFilter>) {
  const normalized = normalizeAnalyticsFilter(filter);
  return locks.filter(lock => lockPassesAnalyticsFilter(lock, normalized));
}

function buildAnalyticsSummary(filter?: Partial<AnalyticsFilter>): AnalyticsSummary {
  const now = Date.now();
  const today = startOfToday();
  const week = now - 1000 * 60 * 60 * 24 * 7;
  const month = now - 1000 * 60 * 60 * 24 * 30;
  const normalized = normalizeAnalyticsFilter(filter);
  const filteredRecords = getAnalyticsRecords(normalized);
  const filteredLocks = getAnalyticsLocks(normalized);
  const filteredAlerts = alerts.filter(alert => alertPassesAnalyticsFilter(alert, normalized) && alert.status !== 'resolved' && alert.status !== 'ignored');
  const isOpenRecord = (record: AccessRecord) => record.result === 'success' && (record.method.includes('Unlock') || record.method === 'PIN' || record.method === 'Card' || record.method === 'Fingerprint' || record.method === 'Face');
  return {
    opensToday: filteredRecords.filter(record => record.createdAt >= today && isOpenRecord(record)).length,
    opensWeek: filteredRecords.filter(record => record.createdAt >= week && isOpenRecord(record)).length,
    opensMonth: filteredRecords.filter(record => record.createdAt >= month && isOpenRecord(record)).length,
    failedCount: filteredRecords.filter(record => record.result === 'failed' || record.result === 'blocked' || record.result === 'timeout').length,
    alertCount: filteredAlerts.length,
    lowBatteryCount: filteredLocks.filter(lock => lock.batteryPercent <= lock.settings.lowBatteryThreshold).length,
    activeCredentialCount: filteredLocks.reduce((sum, lock) => sum + lock.activeCredentialCount, 0),
    totalRecords: filteredRecords.length,
  };
}

function buildMethodBreakdown(filter?: Partial<AnalyticsFilter>): MethodBreakdown[] {
  const records = getAnalyticsRecords(filter);
  const total = Math.max(1, records.length);
  const groups = new Map<AccessRecord['method'], AccessRecord[]>();
  records.forEach(record => {
    groups.set(record.method, [...(groups.get(record.method) ?? []), record]);
  });
  return Array.from(groups.entries())
    .map(([method, items]) => ({
      method,
      count: items.length,
      successCount: items.filter(item => item.result === 'success').length,
      failedCount: items.filter(item => item.result !== 'success').length,
      percentage: Math.round((items.length / total) * 100),
    }))
    .sort((left, right) => right.count - left.count || left.method.localeCompare(right.method));
}

function buildUserBreakdown(filter?: Partial<AnalyticsFilter>): UserBreakdown[] {
  const records = getAnalyticsRecords(filter);
  const groups = new Map<string, AccessRecord[]>();
  records.forEach(record => {
    groups.set(record.actorName, [...(groups.get(record.actorName) ?? []), record]);
  });
  return Array.from(groups.entries())
    .map(([actorName, items]) => ({
      actorName,
      count: items.length,
      successCount: items.filter(item => item.result === 'success').length,
      failedCount: items.filter(item => item.result !== 'success').length,
    }))
    .sort((left, right) => right.count - left.count || left.actorName.localeCompare(right.actorName))
    .slice(0, 8);
}

function buildRiskLocks(filter?: Partial<AnalyticsFilter>): RiskLock[] {
  const normalized = normalizeAnalyticsFilter(filter);
  const records = getAnalyticsRecords(normalized);
  return locks
    .filter(lock => lockPassesAnalyticsFilter(lock, normalized))
    .map(lock => {
      const lockRecords = records.filter(record => record.lockId === lock.id);
      const failedCount = lockRecords.filter(record => record.result === 'failed' || record.result === 'blocked' || record.result === 'timeout').length;
      const alertCount = alerts.filter(alert => alert.lockId === lock.id && alert.status !== 'resolved' && alert.status !== 'ignored').length;
      const lowBattery = lock.batteryPercent <= lock.settings.lowBatteryThreshold;
      const riskScore = Math.min(100, failedCount * 16 + alertCount * 22 + (lowBattery ? 24 : 0) + (lock.connectionState === 'offline' ? 20 : 0) + (lock.syncState !== 'synced' ? 8 : 0));
      return {
        lockId: lock.id,
        lockName: lock.name,
        roomName: lock.roomName,
        homeName: lock.homeName,
        homeType: lock.homeType,
        riskScore,
        failedCount,
        alertCount,
        lowBattery,
        activeCredentialCount: lock.activeCredentialCount,
        lastActivity: lock.lastActivity,
      };
    })
    .filter(lock => lock.riskScore > 0 || lock.activeCredentialCount > 0)
    .sort((left, right) => right.riskScore - left.riskScore || right.failedCount - left.failedCount)
    .slice(0, 12);
}

function buildTimeSeries(filter?: Partial<AnalyticsFilter>): TimeSeriesPoint[] {
  const normalized = normalizeAnalyticsFilter(filter);
  const records = getAnalyticsRecords(normalized);
  const filteredAlerts = alerts.filter(alert => alertPassesAnalyticsFilter(alert, normalized));
  const days = normalized.dateRange === 'today' ? 1 : normalized.dateRange === 'month' ? 14 : normalized.dateRange === 'all' ? 14 : 7;
  const start = startOfToday() - 1000 * 60 * 60 * 24 * (days - 1);
  return Array.from({length: days}).map((_, index) => {
    const timestamp = start + index * 1000 * 60 * 60 * 24;
    const end = timestamp + 1000 * 60 * 60 * 24;
    const dayRecords = records.filter(record => record.createdAt >= timestamp && record.createdAt < end);
    const dayAlerts = filteredAlerts.filter(alert => alert.createdAt >= timestamp && alert.createdAt < end);
    return {
      id: `day-${timestamp}`,
      label: new Date(timestamp).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'}),
      timestamp,
      unlockCount: dayRecords.filter(record => record.result === 'success').length,
      failedCount: dayRecords.filter(record => record.result !== 'success').length,
      alertCount: dayAlerts.length,
    };
  });
}

function csvEscape(value: string | number | boolean | undefined) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildExportPayload(format: ReportExportFormat, filter?: Partial<AnalyticsFilter>): ReportExport {
  const normalized = normalizeAnalyticsFilter(filter);
  const summary = buildAnalyticsSummary(normalized);
  const methods = buildMethodBreakdown(normalized);
  const risk = buildRiskLocks(normalized);
  const series = buildTimeSeries(normalized);
  const createdAt = Date.now();
  const suffix = new Date(createdAt).toISOString().replace(/[:.]/g, '-');
  if (format === 'json') {
    return {
      format,
      fileName: `aplus-report-${suffix}.json`,
      mimeType: 'application/json',
      content: JSON.stringify({filter: normalized, summary, methods, risk, series}, null, 2),
      createdAt,
      rowCount: methods.length + risk.length + series.length,
    };
  }
  if (format === 'pdf') {
    return {
      format,
      fileName: `aplus-report-${suffix}.pdf`,
      mimeType: 'application/pdf',
      content: [
        'APLUS LOCK INTERNAL REPORT MOCK',
        `Created: ${new Date(createdAt).toLocaleString('vi-VN')}`,
        `Filter: ${JSON.stringify(normalized)}`,
        `KPI: ${JSON.stringify(summary)}`,
        'Note: Batch 14 mock export. Khi làm backend sẽ thay bằng PDF renderer thật.',
      ].join('\n'),
      createdAt,
      rowCount: 1,
    };
  }
  const rows = [
    ['section', 'name', 'count', 'success', 'failed', 'extra'].join(','),
    ...methods.map(item => ['method', item.method, item.count, item.successCount, item.failedCount, `${item.percentage}%`].map(csvEscape).join(',')),
    ...risk.map(item => ['risk_lock', item.lockName, item.riskScore, item.activeCredentialCount, item.failedCount, `alerts:${item.alertCount};lowBattery:${item.lowBattery}`].map(csvEscape).join(',')),
    ...series.map(item => ['timeseries', item.label, item.unlockCount, item.unlockCount, item.failedCount, `alerts:${item.alertCount}`].map(csvEscape).join(',')),
  ];
  return {
    format,
    fileName: `aplus-report-${suffix}.csv`,
    mimeType: 'text/csv',
    content: rows.join('\n'),
    createdAt,
    rowCount: rows.length - 1,
  };
}

export const MockLockRepository = {

  async getAnalyticsSummary(filter?: Partial<AnalyticsFilter>): Promise<AnalyticsSummary> {
    await wait(120);
    return buildAnalyticsSummary(filter);
  },

  async getMethodBreakdown(filter?: Partial<AnalyticsFilter>): Promise<MethodBreakdown[]> {
    await wait(120);
    return buildMethodBreakdown(filter);
  },

  async getUserBreakdown(filter?: Partial<AnalyticsFilter>): Promise<UserBreakdown[]> {
    await wait(120);
    return buildUserBreakdown(filter);
  },

  async getRiskLocks(filter?: Partial<AnalyticsFilter>): Promise<RiskLock[]> {
    await wait(120);
    return buildRiskLocks(filter);
  },

  async getReportTimeSeries(filter?: Partial<AnalyticsFilter>): Promise<TimeSeriesPoint[]> {
    await wait(120);
    return buildTimeSeries(filter);
  },

  async exportAnalyticsReport(format: ReportExportFormat, filter?: Partial<AnalyticsFilter>): Promise<ReportExport> {
    await wait(180);
    return buildExportPayload(format, filter);
  },

  async getRoomBuildings(): Promise<RoomBuilding[]> {
    await wait(100);
    ensureRoomsSeeded();
    return roomBuildings.map(cloneBuilding);
  },

  async getRoomFloors(buildingId?: string): Promise<RoomFloor[]> {
    await wait(100);
    ensureRoomsSeeded();
    return roomFloors.filter(floor => !buildingId || floor.buildingId === buildingId).map(cloneFloor);
  },

  async getRooms(filter?: RoomFilter): Promise<Room[]> {
    await wait(150);
    ensureRoomsSeeded();
    return rooms.filter(room => roomMatchesFilter(room, filter)).sort((left, right) => left.buildingName.localeCompare(right.buildingName) || left.floorName.localeCompare(right.floorName) || left.roomNo.localeCompare(right.roomNo)).map(cloneRoom);
  },

  async getRoomSummary(): Promise<RoomSummary> {
    await wait(80);
    return buildRoomSummary();
  },

  async getRoomById(roomId: string): Promise<RoomDetail | undefined> {
    await wait(120);
    ensureRoomsSeeded();
    const room = rooms.find(item => item.id === roomId);
    return room ? buildRoomDetail(room) : undefined;
  },

  async saveRoom(input: RoomFormInput): Promise<Room> {
    await wait(170);
    ensureRoomsSeeded();
    const building = getBuildingById(input.buildingId);
    const floor = getFloorById(input.floorId);
    if (!building || !floor || floor.buildingId !== building.id) {
      throw new Error('Building hoặc floor không hợp lệ.');
    }
    if (!input.roomNo.trim() || !input.roomName.trim()) {
      throw new Error('Room No và tên phòng là bắt buộc.');
    }
    if (duplicateRoomExists(input)) {
      throw new Error('roomNo bị trùng trong cùng tầng.');
    }
    const now = Date.now();
    const existing = input.roomId ? rooms.find(room => room.id === input.roomId) : undefined;
    const nextRoom: Room = {
      id: existing?.id ?? `room-${input.floorId}-${input.roomNo.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${String(now).slice(-4)}`,
      homeId: building.homeId,
      buildingId: building.id,
      floorId: floor.id,
      buildingName: building.name,
      floorName: floor.name,
      roomNo: input.roomNo.trim(),
      roomName: input.roomName.trim(),
      status: input.status,
      notes: input.notes?.trim(),
      lockIds: existing?.lockIds ?? [],
      activeCredentialCount: existing?.activeCredentialCount ?? 0,
      memberCount: existing?.memberCount ?? 0,
      bookingActive: existing?.bookingActive ?? false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (existing) {
      rooms = rooms.map(room => room.id === existing.id ? nextRoom : room);
    } else {
      rooms.unshift(nextRoom);
    }
    updateLocksForRoom(nextRoom);
    refreshRoomDerivedFields();
    return cloneRoom(nextRoom);
  },

  async deleteRoom(roomId: string): Promise<{success: boolean; message: string}> {
    await wait(130);
    ensureRoomsSeeded();
    const room = rooms.find(item => item.id === roomId);
    if (!room) {
      return {success: false, message: 'Không tìm thấy phòng.'};
    }
    const detail = buildRoomDetail(room);
    if (!detail.canDelete) {
      return {success: false, message: detail.deleteBlockReason ?? 'Phòng chưa đủ điều kiện xóa.'};
    }
    rooms = rooms.filter(item => item.id !== roomId);
    roomAssignments = roomAssignments.filter(item => item.roomId !== roomId);
    return {success: true, message: 'Đã xóa phòng mock.'};
  },

  async assignLockToRoom(roomId: string, lockId: string): Promise<RoomDetail | undefined> {
    await wait(170);
    ensureRoomsSeeded();
    const room = rooms.find(item => item.id === roomId);
    const targetLock = locks.find(item => item.id === lockId);
    if (!room || !targetLock) {
      return undefined;
    }
    rooms = rooms.map(item => item.id === roomId ? {...item, lockIds: Array.from(new Set([...item.lockIds, lockId])), updatedAt: Date.now()} : {...item, lockIds: item.lockIds.filter(existingLockId => existingLockId !== lockId)});
    const nextRoom = rooms.find(item => item.id === roomId)!;
    updateLocksForRoom(nextRoom);
    refreshRoomDerivedFields();
    accessRecords.unshift({
      id: `record-room-assign-${Date.now()}`,
      lockId: targetLock.id,
      lockName: targetLock.name,
      roomName: nextRoom.roomName,
      method: 'System',
      result: 'success',
      actorName: 'Room Management',
      message: `Gán khóa ${targetLock.serial} vào ${nextRoom.roomName}`,
      createdAt: Date.now(),
    });
    return buildRoomDetail(nextRoom);
  },

  async previewRoomImport(csvText: string): Promise<RoomImportPreviewRow[]> {
    await wait(110);
    return parseImportCsv(csvText);
  },

  async commitRoomImport(csvText: string): Promise<RoomImportPreviewRow[]> {
    await wait(220);
    ensureRoomsSeeded();
    const preview = parseImportCsv(csvText);
    const now = Date.now();
    const committed = preview.map(row => {
      if (row.status !== 'valid') {
        return row;
      }
      const building = roomBuildings.find(item => item.name.toLowerCase() === row.buildingName.toLowerCase());
      const floor = building ? roomFloors.find(item => item.buildingId === building.id && item.name.toLowerCase() === row.floorName.toLowerCase()) : undefined;
      if (!building || !floor) {
        return {...row, status: 'invalid' as const, error: 'Không tìm thấy building/floor'};
      }
      rooms.unshift({
        id: `room-import-${floor.id}-${row.roomNo.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${String(now).slice(-5)}-${row.line}`,
        homeId: building.homeId,
        buildingId: building.id,
        floorId: floor.id,
        buildingName: building.name,
        floorName: floor.name,
        roomNo: row.roomNo,
        roomName: row.roomName,
        status: 'available',
        notes: 'Tạo từ Import CSV mock Batch 11.',
        lockIds: [],
        activeCredentialCount: 0,
        memberCount: 0,
        bookingActive: false,
        createdAt: now,
        updatedAt: now,
      });
      return {...row, status: 'created' as const, error: undefined};
    });
    refreshRoomDerivedFields();
    return committed;
  },

  async getHomes(): Promise<AplusHome[]> {
    await wait(180);
    return buildHomesWithCounts();
  },

  async getLocks(filter: LockFilterType = 'all'): Promise<AplusLock[]> {
    await wait(260);
    return locks.filter(lock => matchesFilter(lock, filter)).map(cloneLock);
  },

  async getLockById(lockId: string): Promise<AplusLock | undefined> {
    await wait(120);
    const lock = locks.find(item => item.id === lockId);
    return lock ? cloneLock(lock) : undefined;
  },

  async getDashboardSummary(filter: LockFilterType = 'all'): Promise<LockDashboardSummary> {
    await wait(120);
    return buildSummary(locks.filter(lock => matchesFilter(lock, filter)));
  },

  async updateLockRuntimeState(lockId: string, patch: Partial<AplusLock>): Promise<AplusLock | undefined> {
    await wait(90);
    let updated: AplusLock | undefined;
    locks = locks.map(lock => {
      if (lock.id !== lockId) {
        return lock;
      }
      updated = {...lock, ...patch};
      return updated;
    });
    return updated ? cloneLock(updated) : undefined;
  },

  async addAccessRecord(record: AccessRecord): Promise<AccessRecord> {
    await wait(60);
    accessRecords.unshift(record);
    applyRecordSideEffects(record);
    return cloneRecord(record);
  },

  async getAccessRecords(lockIdOrFilter?: string | RecordFilter): Promise<AccessRecord[]> {
    await wait(140);
    const filter: RecordFilter | undefined = typeof lockIdOrFilter === 'string' ? {lockId: lockIdOrFilter} : lockIdOrFilter;
    return accessRecords
      .filter(record => recordMatchesFilter(record, filter))
      .slice(0, 80)
      .map(cloneRecord);
  },

  async getAccessRecordById(recordId: string): Promise<AccessRecord | undefined> {
    await wait(90);
    const record = accessRecords.find(item => item.id === recordId);
    return record ? cloneRecord(record) : undefined;
  },

  async saveAccessRecordNote(recordId: string, note: string): Promise<RecordNote | undefined> {
    await wait(90);
    const record = accessRecords.find(item => item.id === recordId);
    if (!record) {
      return undefined;
    }
    record.note = note.trim();
    return {recordId, note: record.note, updatedAt: Date.now()};
  },

  async getBatteryReports(lockId?: string): Promise<BatteryReport[]> {
    await wait(160);
    return locks
      .filter(lock => !lockId || lock.id === lockId)
      .map(buildBatteryReport)
      .sort((left, right) => Number(right.alertActive) - Number(left.alertActive) || left.batteryPercent - right.batteryPercent);
  },


  async getAlerts(filter?: AlertFilter): Promise<Alert[]> {
    await wait(130);
    return alerts
      .filter(alert => alertMatchesFilter(alert, filter))
      .sort((left, right) => Number(left.status === 'resolved' || left.status === 'ignored') - Number(right.status === 'resolved' || right.status === 'ignored') || severityRank(right.severity) - severityRank(left.severity) || right.updatedAt - left.updatedAt)
      .map(cloneAlert);
  },

  async getAlertSummary(): Promise<AlertSummary> {
    await wait(70);
    return buildAlertSummary();
  },

  async getAlertById(alertId: string): Promise<Alert | undefined> {
    await wait(80);
    const alert = alerts.find(item => item.id === alertId);
    return alert ? cloneAlert(alert) : undefined;
  },

  async markAlertRead(alertId: string): Promise<Alert | undefined> {
    await wait(80);
    const alert = alerts.find(item => item.id === alertId);
    if (!alert) {
      return undefined;
    }
    if (alert.status === 'unread') {
      alert.status = 'read';
      alert.updatedAt = Date.now();
    }
    return cloneAlert(alert);
  },

  async resolveAlert(alertId: string, note?: string): Promise<Alert | undefined> {
    await wait(120);
    const alert = alerts.find(item => item.id === alertId);
    if (!alert) {
      return undefined;
    }
    alert.status = 'resolved';
    alert.note = note?.trim() || 'Đã xử lý trong Alarm Center mock.';
    alert.updatedAt = Date.now();
    const ticket = incidentTickets.find(item => item.alertId === alertId);
    if (ticket) {
      ticket.status = 'resolved';
      ticket.resolutionNote = alert.note;
      ticket.updatedAt = Date.now();
    }
    locks = locks.map(lock => lock.id === alert.lockId ? {...lock, alertCount: Math.max(0, effectiveAlertCount(lock) - 1), lastActivity: 'Cảnh báo đã xử lý · vừa xong'} : lock);
    return cloneAlert(alert);
  },

  async ignoreAlert(alertId: string, note?: string): Promise<Alert | undefined> {
    await wait(100);
    const alert = alerts.find(item => item.id === alertId);
    if (!alert) {
      return undefined;
    }
    alert.status = 'ignored';
    alert.note = note?.trim() || 'Đã bỏ qua cảnh báo sau khi xác minh.';
    alert.updatedAt = Date.now();
    return cloneAlert(alert);
  },

  async createIncidentTicket(input: CreateTicketInput): Promise<IncidentTicket | undefined> {
    await wait(160);
    const alert = alerts.find(item => item.id === input.alertId);
    if (!alert) {
      return undefined;
    }
    const now = Date.now();
    const ticket: IncidentTicket = {
      id: `ticket-${String(now).slice(-8)}`,
      alertId: alert.id,
      lockId: alert.lockId,
      lockName: alert.lockName,
      roomName: alert.roomName,
      title: input.title.trim() || alert.title,
      description: input.description.trim() || alert.message,
      assignee: input.assignee.trim() || 'Kỹ thuật Aplus',
      priority: input.priority || ticketPriorityFor(alert.severity),
      dueAt: now + Math.max(1, input.dueHours) * 60 * 60 * 1000,
      status: 'open',
      attachmentNames: input.attachmentNames ?? [],
      createdAt: now,
      updatedAt: now,
    };
    incidentTickets.unshift(ticket);
    alert.ticketId = ticket.id;
    alert.assignee = ticket.assignee;
    alert.status = alert.status === 'unread' ? 'read' : alert.status;
    alert.updatedAt = now;
    accessRecords.unshift({
      id: `record-ticket-${now}`,
      lockId: alert.lockId,
      lockName: alert.lockName,
      roomName: alert.roomName,
      method: 'System',
      result: 'success',
      ticketId: ticket.id,
      actorName: 'Alarm Center',
      message: `Tạo ticket ${ticket.id} cho cảnh báo ${alert.title}`,
      createdAt: now,
    });
    return cloneTicket(ticket);
  },

  async getIncidentTickets(alertId?: string): Promise<IncidentTicket[]> {
    await wait(110);
    return incidentTickets
      .filter(ticket => !alertId || ticket.alertId === alertId)
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map(cloneTicket);
  },

  async getNotificationPolicy(): Promise<NotificationPolicy> {
    await wait(80);
    return {...notificationPolicy, mutedTypes: [...notificationPolicy.mutedTypes]};
  },

  async updateNotificationPolicy(patch: Partial<NotificationPolicy>): Promise<NotificationPolicy> {
    await wait(120);
    notificationPolicy = {
      ...notificationPolicy,
      ...patch,
      mutedTypes: patch.mutedTypes ? [...patch.mutedTypes] : notificationPolicy.mutedTypes,
    };
    return {...notificationPolicy, mutedTypes: [...notificationPolicy.mutedTypes]};
  },


  async getPairingGateways(): Promise<PairingGateway[]> {
    await wait(140);
    return pairingGateways.map(gateway => ({...gateway}));
  },

  async isSerialAlreadyBound(serial: string): Promise<boolean> {
    await wait(80);
    return locks.some(lock => lock.serial.trim().toLowerCase() === serial.trim().toLowerCase());
  },

  async addLockFromPairing(input: PairingCreateLockInput): Promise<AplusLock> {
    await wait(260);
    if (locks.some(lock => lock.serial.trim().toLowerCase() === input.device.serial.trim().toLowerCase())) {
      throw new Error('Thiết bị đã bind hoặc serial đã tồn tại trong hệ thống.');
    }

    const serialSuffix = input.device.serial.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const now = Date.now();
    const createdLock: AplusLock = {
      id: `lock-paired-${serialSuffix}-${String(now).slice(-4)}`,
      serial: input.device.serial,
      name: input.lockName.trim(),
      homeId: input.homeId,
      homeName: input.homeName,
      homeType: input.homeType,
      buildingName: input.homeType === 'hotel' ? 'Hotel Tower' : input.homeType === 'office' ? 'Văn phòng chính' : 'Toà pairing',
      floorName: input.homeType === 'hotel' ? 'Tầng mới' : input.homeType === 'office' ? 'Tầng vận hành' : 'Tầng demo',
      roomName: input.roomName.trim(),
      roomNo: input.roomNo.trim(),
      address: `${input.homeName} · ${input.roomName.trim()} · ${input.wifiSsid ?? 'BLE/Gateway mock'}`,
      connectionState: input.gateway?.online ? 'online' : input.wifiSsid ? 'syncing' : 'bluetooth-only',
      isLocked: true,
      doorState: 'closed',
      batteryPercent: 100,
      batteryState: 'good',
      signalPercent: input.wifiSsid || input.gateway?.online ? 90 : 64,
      gatewayOnline: Boolean(input.gateway?.online),
      gatewayName: input.gateway?.name ?? 'Chưa bind gateway',
      firmwareVersion: '1.0.1-pairing-mock',
      hardwareModel: input.device.model,
      lastActivity: `Vừa thêm bằng ${input.device.method.toUpperCase()} wizard`,
      lastSeenAt: 'Vừa xong',
      alertCount: 0,
      activeCredentialCount: 0,
      syncState: input.gateway?.online || input.wifiSsid ? 'synced' : 'pending',
      capabilities: {...input.device.capabilities},
      settings: {...defaultSettings},
      permission: {canRemoteUnlock: true, canLock: true, canManageCredentials: true, canViewRecords: true, canChangeSettings: true},
    };

    locks.unshift(createdLock);
    const record: AccessRecord = {
      id: `record-pairing-${now}`,
      lockId: createdLock.id,
      lockName: createdLock.name,
      roomName: createdLock.roomName,
      method: 'System',
      result: 'success',
      actorName: 'Pairing Wizard',
      message: `Thêm khóa ${createdLock.serial} qua Batch 12 Pairing Wizard`,
      createdAt: now,
    };
    accessRecords.unshift(record);
    return cloneLock(createdLock);
  },


  async updateLockSettings(lockId: string, patch: Partial<LockSettings>): Promise<AplusLock | undefined> {
    await wait(140);
    let updated: AplusLock | undefined;
    locks = locks.map(lock => {
      if (lock.id !== lockId) {
        return lock;
      }
      updated = {
        ...lock,
        settings: {...lock.settings, ...patch},
        syncState: lock.connectionState === 'offline' ? 'offline' : 'synced',
        lastActivity: 'Cập nhật cài đặt thiết bị · vừa xong',
        lastSeenAt: lock.connectionState === 'offline' ? lock.lastSeenAt : 'Vừa xong',
      };
      return updated;
    });
    if (updated) {
      accessRecords.unshift({
        id: `record-settings-${Date.now()}`,
        lockId: updated.id,
        lockName: updated.name,
        roomName: updated.roomName,
        method: 'System',
        result: 'success',
        actorName: 'Device Settings',
        message: 'Cập nhật cài đặt khóa theo Batch 16',
        createdAt: Date.now(),
      });
    }
    return updated ? cloneLock(updated) : undefined;
  },

  async getDeviceDiagnostic(lockId: string): Promise<DeviceDiagnostic | undefined> {
    await wait(180);
    const lock = locks.find(item => item.id === lockId);
    return lock ? buildDiagnostic(lock) : undefined;
  },

  async getFirmwareInfo(lockId: string): Promise<FirmwareInfo | undefined> {
    await wait(160);
    const lock = locks.find(item => item.id === lockId);
    return lock ? buildFirmwareInfo(lock) : undefined;
  },

  async applyFirmwareVersion(lockId: string, version: string): Promise<AplusLock | undefined> {
    await wait(160);
    let updated: AplusLock | undefined;
    locks = locks.map(lock => {
      if (lock.id !== lockId) {
        return lock;
      }
      updated = {
        ...lock,
        firmwareVersion: version,
        syncState: 'synced',
        lastActivity: `OTA firmware ${version} thành công · vừa xong`,
        lastSeenAt: 'Vừa xong',
      };
      return updated;
    });
    if (updated) {
      accessRecords.unshift({
        id: `record-ota-${Date.now()}`,
        lockId: updated.id,
        lockName: updated.name,
        roomName: updated.roomName,
        method: 'System',
        result: 'success',
        actorName: 'Firmware OTA',
        message: `Cập nhật firmware lên ${version}`,
        createdAt: Date.now(),
      });
    }
    return updated ? cloneLock(updated) : undefined;
  },

  async getCapabilityMatrix(lockId: string): Promise<DeviceCapabilityMatrix | undefined> {
    await wait(110);
    const lock = locks.find(item => item.id === lockId);
    return lock ? buildCapabilityMatrix(lock) : undefined;
  },

  async addDemoLock(filter: LockFilterType = 'home'): Promise<AplusLock> {
    await wait(220);
    const targetType = filter === 'all' ? 'home' : filter;
    const home = homes.find(item => item.type === targetType) ?? homes[0];
    const countInHome = locks.filter(lock => lock.homeId === home.id).length + 1;
    const suffix = String(Date.now()).slice(-4);
    const newLock: AplusLock = {
      id: `lock-demo-${home.type}-${suffix}`,
      serial: `APL-${home.type.toUpperCase()}-${suffix}`,
      name: home.type === 'hotel' ? `Phòng demo ${900 + countInHome}` : home.type === 'office' ? `Khu demo ${countInHome}` : `Cửa demo ${countInHome}`,
      homeId: home.id,
      homeName: home.name,
      homeType: home.type,
      buildingName: home.type === 'hotel' ? 'Hotel Tower' : home.type === 'office' ? 'Văn phòng chính' : 'Toà demo',
      floorName: home.type === 'hotel' ? 'Tầng 9' : home.type === 'office' ? 'Tầng 8' : 'Tầng 1',
      roomName: home.type === 'hotel' ? `Phòng ${900 + countInHome}` : home.type === 'office' ? `Khu demo ${countInHome}` : `Phòng demo ${countInHome}`,
      roomNo: home.type === 'hotel' ? `${900 + countInHome}` : home.type === 'office' ? `D-${countInHome}` : `D${countInHome}`,
      address: `${home.name} · Mock mới thêm`,
      connectionState: 'online',
      isLocked: true,
      doorState: 'closed',
      batteryPercent: 100,
      batteryState: 'good',
      signalPercent: 92,
      gatewayOnline: true,
      gatewayName: 'Gateway Demo',
      firmwareVersion: '1.0.1-mock',
      hardwareModel: 'Aplus Demo Lock',
      lastActivity: 'Vừa thêm bằng Pairing mock',
      lastSeenAt: 'Vừa xong',
      alertCount: 0,
      activeCredentialCount: 0,
      syncState: 'synced',
      capabilities: fullCapabilities,
      settings: defaultSettings,
      permission: {canRemoteUnlock: true, canLock: true, canManageCredentials: true, canViewRecords: true, canChangeSettings: true},
    };
    locks.unshift(newLock);
    return cloneLock(newLock);
  },
};

import type {AccessRecord, AplusHome, AplusLock, LockCapabilities, LockDashboardSummary, LockFilterType, LockSettings} from '@/types/lock';

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
    actorName: 'Admin Aplus',
    message: 'Mở cửa bằng vân tay mock',
    createdAt: Date.now() - 1000 * 60 * 24,
  },
  {
    id: 'record-seed-002',
    lockId: 'lock-hotel-0802',
    lockName: 'Phòng khách sạn 802',
    roomName: 'Phòng 802',
    method: 'System',
    result: 'failed',
    actorName: 'Gateway Hotel-08',
    message: 'Thiết bị offline, không nhận heartbeat',
    createdAt: Date.now() - 1000 * 60 * 80,
  },
];

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cloneLock(lock: AplusLock): AplusLock {
  return {
    ...lock,
    capabilities: {...lock.capabilities},
    settings: {...lock.settings},
    permission: {...lock.permission},
  };
}

function cloneRecord(record: AccessRecord): AccessRecord {
  return {...record};
}

function matchesFilter(lock: AplusLock, filter: LockFilterType) {
  return filter === 'all' || lock.homeType === filter;
}

function buildHomesWithCounts(): AplusHome[] {
  return homes.map(home => {
    const homeLocks = locks.filter(lock => lock.homeId === home.id);
    return {
      ...home,
      totalLocks: homeLocks.length,
      onlineLocks: homeLocks.filter(lock => lock.connectionState === 'online' || lock.connectionState === 'syncing').length,
      alertCount: homeLocks.reduce((total, lock) => total + lock.alertCount, 0),
    };
  });
}

function buildSummary(list: AplusLock[]): LockDashboardSummary {
  return {
    totalLocks: list.length,
    onlineLocks: list.filter(lock => lock.connectionState === 'online' || lock.connectionState === 'syncing').length,
    offlineLocks: list.filter(lock => lock.connectionState === 'offline').length,
    lowBatteryLocks: list.filter(lock => lock.batteryPercent <= 20).length,
    alertLocks: list.filter(lock => lock.alertCount > 0 || lock.doorState === 'left-open').length,
    pendingSyncLocks: list.filter(lock => lock.syncState === 'pending' || lock.syncState === 'offline').length,
  };
}

export const MockLockRepository = {
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
    return cloneRecord(record);
  },

  async getAccessRecords(lockId?: string): Promise<AccessRecord[]> {
    await wait(140);
    return accessRecords
      .filter(record => !lockId || record.lockId === lockId)
      .slice(0, 40)
      .map(cloneRecord);
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

import React, {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {InteractionManager} from 'react-native';
import {NativeAdapters} from '@/services/adapters/nativeAdapters';
import {MockAuthRepository} from '@/services/repositories/MockAuthRepository';
import {LanguageProvider} from '@/i18n/LanguageContext';
import {MockAccountRepository} from '@/services/repositories/MockAccountRepository';
import {MockLockRepository} from '@/services/repositories/MockLockRepository';
import {createSessionStore} from '@/services/session/SessionStore';
import type {Alert, AlertFilter, AlertSummary, CreateTicketInput, IncidentTicket, NotificationPolicy} from '@/types/alert';
import type {AplusUser, AuthActionResult, AuthSession, OtpChallenge, OtpFlow, RegisterInput, ResetPasswordInput, TrustedDeviceSession} from '@/types/auth';
import type {AccessRecord, AplusHome, AplusLock, BatteryReport, DeviceCapabilityMatrix, DeviceDiagnostic, FirmwareInfo, LockCommand, LockCommandAuthMethod, LockCommandScenario, LockCommandStatus, LockCommandType, LockDashboardSummary, LockFilterType, LockSettings, RecordNote, RemoteUnlockCheck} from '@/types/lock';
import type {PairingCreateLockInput, PairingGateway} from '@/types/pairing';
import type {Room, RoomBuilding, RoomDetail, RoomFilter, RoomFloor, RoomFormInput, RoomImportPreviewRow, RoomSummary} from '@/types/room';
import type {AnalyticsFilter, AnalyticsSummary, MethodBreakdown, ReportExport, ReportExportFormat, RiskLock, TimeSeriesPoint, UserBreakdown} from '@/types/report';
import type {AppLanguageCode, AppPinSettings, BrandingConfig, LocalizationResource, TrustedDevice} from '@/types/account';

const REMOTE_UNLOCK_APP_PIN = '2580';

type AuthState = {
  isAuthenticated: boolean;
  user?: AplusUser;
  session?: AuthSession;
  loading: boolean;
  isBootstrapping: boolean;
  error?: string;
  canUseBiometric: boolean;
  trustedDevice?: TrustedDeviceSession;
  activeOtp?: OtpChallenge;
  pendingRegister?: RegisterInput;
  verifiedResetAccount?: string;
};

type AppStateValue = {
  auth: AuthState;
  homes: AplusHome[];
  locks: AplusLock[];
  dashboardSummary: LockDashboardSummary;
  selectedLockFilter: LockFilterType;
  locksLoading: boolean;
  locksError?: string;
  isOffline: boolean;
  lockCommands: LockCommand[];
  accessRecords: AccessRecord[];
  pairingGateways: PairingGateway[];
  pairingLoading: boolean;
  pairingError?: string;
  alerts: Alert[];
  alertSummary: AlertSummary;
  incidentTickets: IncidentTicket[];
  notificationPolicy?: NotificationPolicy;
  alertsLoading: boolean;
  roomBuildings: RoomBuilding[];
  roomFloors: RoomFloor[];
  rooms: Room[];
  roomSummary: RoomSummary;
  roomsLoading: boolean;
  roomsError?: string;
  analyticsFilter: AnalyticsFilter;
  analyticsSummary?: AnalyticsSummary;
  methodBreakdown: MethodBreakdown[];
  userBreakdown: UserBreakdown[];
  riskLocks: RiskLock[];
  reportTimeSeries: TimeSeriesPoint[];
  reportsLoading: boolean;
  lastReportExport?: ReportExport;
  currentLanguage: AppLanguageCode;
  appPinSettings?: AppPinSettings;
  trustedDevices: TrustedDevice[];
  brandingConfig?: BrandingConfig;
  localizationResources: LocalizationResource[];
  accountSecurityLoading: boolean;
  remoteUnlockPin: string;
  loginWithPassword: (account: string, password: string) => Promise<AuthActionResult>;
  loginWithBiometric: () => Promise<AuthActionResult>;
  requestRegisterOtp: (input: RegisterInput) => Promise<AuthActionResult>;
  requestForgotOtp: (account: string) => Promise<AuthActionResult>;
  verifyOtpAndContinue: (flow: OtpFlow, account: string, otp: string) => Promise<AuthActionResult>;
  resetPassword: (input: ResetPasswordInput) => Promise<AuthActionResult>;
  resendOtp: (flow: OtpFlow, account: string) => Promise<AuthActionResult>;
  logoutMock: (forgetTrustedDevice?: boolean) => Promise<void>;
  loginMock: () => Promise<void>;
  clearAuthError: () => void;
  reloadLocks: (filter?: LockFilterType) => Promise<void>;
  reloadAccessRecords: (lockId?: string) => Promise<void>;
  getAccessRecordDetail: (recordId: string) => Promise<AccessRecord | undefined>;
  saveAccessRecordNote: (recordId: string, note: string) => Promise<RecordNote | undefined>;
  getBatteryReports: (lockId?: string) => Promise<BatteryReport[]>;
  reloadAlerts: (filter?: AlertFilter) => Promise<void>;
  getAlertDetail: (alertId: string) => Promise<Alert | undefined>;
  markAlertRead: (alertId: string) => Promise<Alert | undefined>;
  resolveAlert: (alertId: string, note?: string) => Promise<Alert | undefined>;
  ignoreAlert: (alertId: string, note?: string) => Promise<Alert | undefined>;
  createIncidentTicket: (input: CreateTicketInput) => Promise<IncidentTicket | undefined>;
  reloadIncidentTickets: (alertId?: string) => Promise<void>;
  reloadNotificationPolicy: () => Promise<void>;
  updateNotificationPolicy: (patch: Partial<NotificationPolicy>) => Promise<NotificationPolicy>;
  reloadRooms: (filter?: RoomFilter) => Promise<void>;
  getRoomDetail: (roomId: string) => Promise<RoomDetail | undefined>;
  saveRoom: (input: RoomFormInput) => Promise<Room | undefined>;
  deleteRoom: (roomId: string) => Promise<{success: boolean; message: string}>;
  assignLockToRoom: (roomId: string, lockId: string) => Promise<RoomDetail | undefined>;
  previewRoomImport: (csvText: string) => Promise<RoomImportPreviewRow[]>;
  commitRoomImport: (csvText: string) => Promise<RoomImportPreviewRow[]>;
  reloadAnalytics: (filter?: Partial<AnalyticsFilter>) => Promise<void>;
  updateAnalyticsFilter: (patch: Partial<AnalyticsFilter>) => Promise<void>;
  exportAnalyticsReport: (format: ReportExportFormat) => Promise<ReportExport>;
  reloadAccountSecurity: () => Promise<void>;
  updateAppPinSettings: (patch: Partial<AppPinSettings>) => Promise<AppPinSettings>;
  setAppPin: (pin: string) => Promise<AppPinSettings>;
  verifyAppPin: (pin: string) => Promise<boolean>;
  changeLanguage: (language: AppLanguageCode) => Promise<AppLanguageCode>;
  updateBrandingConfig: (patch: Partial<BrandingConfig>) => Promise<BrandingConfig>;
  revokeTrustedDevice: (deviceId: string) => Promise<TrustedDevice[]>;
  renameTrustedDevice: (deviceId: string, name: string) => Promise<TrustedDevice[]>;
  setLockFilter: (filter: LockFilterType) => Promise<void>;
  addDemoLock: (preferredType?: LockFilterType) => Promise<AplusLock | undefined>;
  toggleLockMock: (lockId: string) => void;
  setOfflineMock: (offline: boolean) => void;
  reloadPairingGateways: () => Promise<void>;
  isPairingSerialBound: (serial: string) => Promise<boolean>;
  addPairedLock: (input: PairingCreateLockInput) => Promise<AplusLock | undefined>;
  updateLockSettings: (lockId: string, patch: Partial<LockSettings>) => Promise<AplusLock | undefined>;
  getDeviceDiagnostic: (lockId: string) => Promise<DeviceDiagnostic | undefined>;
  getFirmwareInfo: (lockId: string) => Promise<FirmwareInfo | undefined>;
  applyFirmwareVersion: (lockId: string, version: string) => Promise<AplusLock | undefined>;
  getCapabilityMatrix: (lockId: string) => Promise<DeviceCapabilityMatrix | undefined>;
  evaluateRemoteUnlock: (lockId: string) => RemoteUnlockCheck;
  startLockCommand: (input: {lockId: string; type: LockCommandType; scenario?: LockCommandScenario; authMethod?: LockCommandAuthMethod}) => Promise<LockCommand | undefined>;
  findCommand: (commandId: string) => LockCommand | undefined;
  findLock: (lockId: string) => AplusLock | undefined;
};

const emptyAlertSummary: AlertSummary = {
  total: 0,
  unread: 0,
  critical: 0,
  high: 0,
  ticketsOpen: 0,
  resolved: 0,
};

const emptySummary: LockDashboardSummary = {
  totalLocks: 0,
  onlineLocks: 0,
  offlineLocks: 0,
  lowBatteryLocks: 0,
  alertLocks: 0,
  pendingSyncLocks: 0,
};

const emptyRoomSummary: RoomSummary = {
  buildings: 0,
  floors: 0,
  rooms: 0,
  assignedRooms: 0,
  unassignedRooms: 0,
  blockedRooms: 0,
};

const defaultAnalyticsFilter: AnalyticsFilter = {
  dateRange: 'week',
  homeType: 'all',
  method: 'all',
  result: 'all',
  query: '',
};

type AuthNavigationState = {
  isAuthenticated: boolean;
  isBootstrapping: boolean;
};

const AuthNavigationContext = createContext<AuthNavigationState | undefined>(undefined);
const AppStateContext = createContext<AppStateValue | undefined>(undefined);
const sessionStore = createSessionStore(NativeAdapters.secureStorage);

function getAuthErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Có lỗi xảy ra. Vui lòng thử lại.';
}

function createTrustedDevice(session: AuthSession): TrustedDeviceSession {
  return {
    userId: session.userId,
    trustedDeviceId: session.trustedDeviceId,
    createdAt: session.createdAt,
    lastActiveAt: Date.now(),
    biometricEnabled: session.biometricEnabled,
  };
}

function buildSummaryFromLocks(list: AplusLock[]): LockDashboardSummary {
  return {
    totalLocks: list.length,
    onlineLocks: list.filter(lock => lock.connectionState === 'online' || lock.connectionState === 'syncing').length,
    offlineLocks: list.filter(lock => lock.connectionState === 'offline').length,
    lowBatteryLocks: list.filter(lock => lock.batteryPercent <= 20).length,
    alertLocks: list.filter(lock => lock.alertCount > 0 || lock.doorState === 'left-open').length,
    pendingSyncLocks: list.filter(lock => lock.syncState === 'pending' || lock.syncState === 'offline').length,
  };
}

function commandTitle(type: LockCommandType) {
  if (type === 'remoteUnlock') {
    return 'Mở khóa từ xa';
  }
  if (type === 'lock') {
    return 'Khóa lại';
  }
  return 'Mở khóa';
}

function statusLabel(status: LockCommandStatus) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'sent':
      return 'Sent';
    case 'ack':
      return 'ACK';
    case 'success':
      return 'Success';
    case 'timeout':
      return 'Timeout';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

export function AppStateProvider({children}: {children: ReactNode}) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    loading: false,
    isBootstrapping: true,
    canUseBiometric: false,
  });
  const [homes, setHomes] = useState<AplusHome[]>([]);
  const [locks, setLocks] = useState<AplusLock[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<LockDashboardSummary>(emptySummary);
  const [selectedLockFilter, setSelectedLockFilter] = useState<LockFilterType>('all');
  const [locksLoading, setLocksLoading] = useState(false);
  const [locksError, setLocksError] = useState<string | undefined>();
  const [isOffline, setIsOffline] = useState(false);
  const [lockCommands, setLockCommands] = useState<LockCommand[]>([]);
  const [accessRecords, setAccessRecords] = useState<AccessRecord[]>([]);
  const [pairingGateways, setPairingGateways] = useState<PairingGateway[]>([]);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingError, setPairingError] = useState<string | undefined>();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertSummary, setAlertSummary] = useState<AlertSummary>(emptyAlertSummary);
  const [incidentTickets, setIncidentTickets] = useState<IncidentTicket[]>([]);
  const [notificationPolicy, setNotificationPolicy] = useState<NotificationPolicy | undefined>();
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [roomBuildings, setRoomBuildings] = useState<RoomBuilding[]>([]);
  const [roomFloors, setRoomFloors] = useState<RoomFloor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomSummary, setRoomSummary] = useState<RoomSummary>(emptyRoomSummary);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | undefined>();
  const [analyticsFilter, setAnalyticsFilter] = useState<AnalyticsFilter>(defaultAnalyticsFilter);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | undefined>();
  const [methodBreakdown, setMethodBreakdown] = useState<MethodBreakdown[]>([]);
  const [userBreakdown, setUserBreakdown] = useState<UserBreakdown[]>([]);
  const [riskLocks, setRiskLocks] = useState<RiskLock[]>([]);
  const [reportTimeSeries, setReportTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [lastReportExport, setLastReportExport] = useState<ReportExport | undefined>();
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguageCode>('vi');
  const [appPinSettings, setAppPinSettingsState] = useState<AppPinSettings | undefined>();
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig | undefined>();
  const [localizationResources, setLocalizationResources] = useState<LocalizationResource[]>([]);
  const [accountSecurityLoading, setAccountSecurityLoading] = useState(false);

  const reloadAccountSecurity = useCallback(async () => {
    setAccountSecurityLoading(true);
    try {
      const [pinData, deviceData, brandingData, resourceData, languageData] = await Promise.all([
        MockAccountRepository.getAppPinSettings(),
        MockAccountRepository.getTrustedDevices(),
        MockAccountRepository.getBrandingConfig(),
        MockAccountRepository.getLocalizationResources(),
        MockAccountRepository.getLanguage(),
      ]);
      setAppPinSettingsState(pinData);
      setTrustedDevices(deviceData);
      setBrandingConfig(brandingData);
      setLocalizationResources(resourceData);
      setCurrentLanguage(languageData);
    } finally {
      setAccountSecurityLoading(false);
    }
  }, []);

  const updateAppPinSettings = useCallback(async (patch: Partial<AppPinSettings>) => {
    const updated = await MockAccountRepository.updateAppPinSettings(patch);
    setAppPinSettingsState(updated);
    return updated;
  }, []);

  const setAppPin = useCallback(async (pin: string) => {
    const updated = await MockAccountRepository.setAppPin(pin);
    setAppPinSettingsState(updated);
    return updated;
  }, []);

  const verifyAppPin = useCallback(async (pin: string) => {
    const success = await MockAccountRepository.verifyAppPin(pin);
    setAppPinSettingsState(await MockAccountRepository.getAppPinSettings());
    return success;
  }, []);

  const changeLanguage = useCallback(async (language: AppLanguageCode) => {
    const updated = await MockAccountRepository.setLanguage(language);
    setCurrentLanguage(updated);
    return updated;
  }, []);

  const updateBrandingConfig = useCallback(async (patch: Partial<BrandingConfig>) => {
    const updated = await MockAccountRepository.updateBrandingConfig(patch);
    setBrandingConfig(updated);
    return updated;
  }, []);

  const revokeTrustedDevice = useCallback(async (deviceId: string) => {
    const updated = await MockAccountRepository.revokeTrustedDevice(deviceId);
    setTrustedDevices(updated);
    if (deviceId === auth.trustedDevice?.trustedDeviceId) {
      await sessionStore.clearTrustedDevice();
      setAuth(prev => ({...prev, trustedDevice: undefined, canUseBiometric: false}));
    }
    return updated;
  }, [auth.trustedDevice?.trustedDeviceId]);

  const renameTrustedDevice = useCallback(async (deviceId: string, name: string) => {
    const updated = await MockAccountRepository.renameTrustedDevice(deviceId, name);
    setTrustedDevices(updated);
    return updated;
  }, []);

  const reloadLocks = useCallback(async (filter: LockFilterType = 'all') => {
    setLocksLoading(true);
    setLocksError(undefined);
    try {
      const [homeData, lockData, summaryData] = await Promise.all([
        MockLockRepository.getHomes(),
        MockLockRepository.getLocks(filter),
        MockLockRepository.getDashboardSummary(filter),
      ]);
      setHomes(homeData);
      setLocks(lockData);
      setDashboardSummary(summaryData);
    } catch {
      setLocksError('Không tải được danh sách khoá mock. Vui lòng thử lại.');
    } finally {
      setLocksLoading(false);
    }
  }, []);

  const reloadAccessRecords = useCallback(async (lockId?: string) => {
    const records = await MockLockRepository.getAccessRecords(lockId);
    setAccessRecords(records);
  }, []);

  const getAccessRecordDetail = useCallback((recordId: string) => MockLockRepository.getAccessRecordById(recordId), []);

  const saveAccessRecordNote = useCallback(async (recordId: string, note: string) => {
    const result = await MockLockRepository.saveAccessRecordNote(recordId, note);
    if (result) {
      setAccessRecords(prev => prev.map(record => record.id === recordId ? {...record, note: result.note} : record));
    }
    return result;
  }, []);

  const getBatteryReports = useCallback((lockId?: string) => MockLockRepository.getBatteryReports(lockId), []);

  const reloadAlerts = useCallback(async (filter?: AlertFilter) => {
    setAlertsLoading(true);
    const [alertData, summaryData] = await Promise.all([
      MockLockRepository.getAlerts(filter),
      MockLockRepository.getAlertSummary(),
    ]);
    setAlerts(alertData);
    setAlertSummary(summaryData);
    setAlertsLoading(false);
  }, []);

  const getAlertDetail = useCallback((alertId: string) => MockLockRepository.getAlertById(alertId), []);

  const markAlertRead = useCallback(async (alertId: string) => {
    const updated = await MockLockRepository.markAlertRead(alertId);
    if (updated) {
      setAlerts(prev => prev.map(alert => alert.id === alertId ? updated : alert));
      setAlertSummary(await MockLockRepository.getAlertSummary());
    }
    return updated;
  }, []);

  const resolveAlert = useCallback(async (alertId: string, note?: string) => {
    const updated = await MockLockRepository.resolveAlert(alertId, note);
    if (updated) {
      setAlerts(prev => prev.map(alert => alert.id === alertId ? updated : alert));
      const [summaryData, homeData, lockData, ticketData] = await Promise.all([
        MockLockRepository.getAlertSummary(),
        MockLockRepository.getHomes(),
        MockLockRepository.getLocks(selectedLockFilter),
        MockLockRepository.getIncidentTickets(),
      ]);
      setAlertSummary(summaryData);
      setHomes(homeData);
      setLocks(lockData);
      setDashboardSummary(buildSummaryFromLocks(lockData));
      setIncidentTickets(ticketData);
    }
    return updated;
  }, [selectedLockFilter]);

  const ignoreAlert = useCallback(async (alertId: string, note?: string) => {
    const updated = await MockLockRepository.ignoreAlert(alertId, note);
    if (updated) {
      setAlerts(prev => prev.map(alert => alert.id === alertId ? updated : alert));
      setAlertSummary(await MockLockRepository.getAlertSummary());
    }
    return updated;
  }, []);

  const createIncidentTicket = useCallback(async (input: CreateTicketInput) => {
    const ticket = await MockLockRepository.createIncidentTicket(input);
    if (ticket) {
      const [alertData, summaryData, ticketData, recordData] = await Promise.all([
        MockLockRepository.getAlerts(),
        MockLockRepository.getAlertSummary(),
        MockLockRepository.getIncidentTickets(),
        MockLockRepository.getAccessRecords(),
      ]);
      setAlerts(alertData);
      setAlertSummary(summaryData);
      setIncidentTickets(ticketData);
      setAccessRecords(recordData);
    }
    return ticket;
  }, []);

  const reloadIncidentTickets = useCallback(async (alertId?: string) => {
    setIncidentTickets(await MockLockRepository.getIncidentTickets(alertId));
  }, []);

  const reloadNotificationPolicy = useCallback(async () => {
    setNotificationPolicy(await MockLockRepository.getNotificationPolicy());
  }, []);

  const updateNotificationPolicy = useCallback(async (patch: Partial<NotificationPolicy>) => {
    const updated = await MockLockRepository.updateNotificationPolicy(patch);
    setNotificationPolicy(updated);
    return updated;
  }, []);

  const reloadRooms = useCallback(async (filter?: RoomFilter) => {
    setRoomsLoading(true);
    setRoomsError(undefined);
    try {
      const [buildingData, floorData, roomData, summaryData] = await Promise.all([
        MockLockRepository.getRoomBuildings(),
        MockLockRepository.getRoomFloors(),
        MockLockRepository.getRooms(filter),
        MockLockRepository.getRoomSummary(),
      ]);
      setRoomBuildings(buildingData);
      setRoomFloors(floorData);
      setRooms(roomData);
      setRoomSummary(summaryData);
    } catch (error) {
      setRoomsError(getAuthErrorMessage(error));
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  const getRoomDetail = useCallback((roomId: string) => MockLockRepository.getRoomById(roomId), []);

  const saveRoom = useCallback(async (input: RoomFormInput) => {
    try {
      const room = await MockLockRepository.saveRoom(input);
      const [roomData, summaryData, homeData, lockData] = await Promise.all([
        MockLockRepository.getRooms(),
        MockLockRepository.getRoomSummary(),
        MockLockRepository.getHomes(),
        MockLockRepository.getLocks(selectedLockFilter),
      ]);
      setRooms(roomData);
      setRoomSummary(summaryData);
      setHomes(homeData);
      setLocks(lockData);
      setDashboardSummary(await MockLockRepository.getDashboardSummary(selectedLockFilter));
      return room;
    } catch (error) {
      setRoomsError(getAuthErrorMessage(error));
      return undefined;
    }
  }, [selectedLockFilter]);

  const deleteRoom = useCallback(async (roomId: string) => {
    const result = await MockLockRepository.deleteRoom(roomId);
    const [roomData, summaryData] = await Promise.all([
      MockLockRepository.getRooms(),
      MockLockRepository.getRoomSummary(),
    ]);
    setRooms(roomData);
    setRoomSummary(summaryData);
    return result;
  }, []);

  const assignLockToRoom = useCallback(async (roomId: string, lockId: string) => {
    const detail = await MockLockRepository.assignLockToRoom(roomId, lockId);
    const [roomData, summaryData, lockData, homeData, recordData] = await Promise.all([
      MockLockRepository.getRooms(),
      MockLockRepository.getRoomSummary(),
      MockLockRepository.getLocks(selectedLockFilter),
      MockLockRepository.getHomes(),
      MockLockRepository.getAccessRecords(),
    ]);
    setRooms(roomData);
    setRoomSummary(summaryData);
    setLocks(lockData);
    setHomes(homeData);
    setDashboardSummary(buildSummaryFromLocks(lockData));
    setAccessRecords(recordData);
    return detail;
  }, [selectedLockFilter]);

  const previewRoomImport = useCallback((csvText: string) => MockLockRepository.previewRoomImport(csvText), []);

  const commitRoomImport = useCallback(async (csvText: string) => {
    const result = await MockLockRepository.commitRoomImport(csvText);
    const [roomData, summaryData] = await Promise.all([
      MockLockRepository.getRooms(),
      MockLockRepository.getRoomSummary(),
    ]);
    setRooms(roomData);
    setRoomSummary(summaryData);
    return result;
  }, []);


  const reloadAnalytics = useCallback(async (filterPatch?: Partial<AnalyticsFilter>) => {
    setReportsLoading(true);
    const nextFilter = {...defaultAnalyticsFilter, ...filterPatch};
    setAnalyticsFilter(nextFilter);
    const [summaryData, methodData, userData, riskData, seriesData] = await Promise.all([
      MockLockRepository.getAnalyticsSummary(nextFilter),
      MockLockRepository.getMethodBreakdown(nextFilter),
      MockLockRepository.getUserBreakdown(nextFilter),
      MockLockRepository.getRiskLocks(nextFilter),
      MockLockRepository.getReportTimeSeries(nextFilter),
    ]);
    setAnalyticsSummary(summaryData);
    setMethodBreakdown(methodData);
    setUserBreakdown(userData);
    setRiskLocks(riskData);
    setReportTimeSeries(seriesData);
    setReportsLoading(false);
  }, []);

  const updateAnalyticsFilter = useCallback(async (patch: Partial<AnalyticsFilter>) => {
    await reloadAnalytics({...analyticsFilter, ...patch});
  }, [analyticsFilter, reloadAnalytics]);

  const exportAnalyticsReport = useCallback(async (format: ReportExportFormat) => {
    const exported = await MockLockRepository.exportAnalyticsReport(format, analyticsFilter);
    setLastReportExport(exported);
    return exported;
  }, [analyticsFilter]);

  const setLockFilter = useCallback(async (filter: LockFilterType) => {
    setSelectedLockFilter(filter);
    await reloadLocks(filter);
  }, [reloadLocks]);


  const reloadPairingGateways = useCallback(async () => {
    setPairingError(undefined);
    try {
      const gateways = await MockLockRepository.getPairingGateways();
      setPairingGateways(gateways);
    } catch {
      setPairingError('Không tải được Gateway/MQTT mock.');
    }
  }, []);

  const isPairingSerialBound = useCallback(async (serial: string) => MockLockRepository.isSerialAlreadyBound(serial), []);

  const addPairedLock = useCallback(async (input: PairingCreateLockInput) => {
    setPairingLoading(true);
    setPairingError(undefined);
    try {
      const createdLock = await MockLockRepository.addLockFromPairing(input);
      const nextFilter = selectedLockFilter === 'all' ? 'all' : createdLock.homeType;
      setSelectedLockFilter(nextFilter);
      const [homeData, lockData, summaryData] = await Promise.all([
        MockLockRepository.getHomes(),
        MockLockRepository.getLocks(nextFilter),
        MockLockRepository.getDashboardSummary(nextFilter),
      ]);
      setHomes(homeData);
      setLocks(lockData);
      setDashboardSummary(summaryData);
      await reloadAccessRecords();
      return createdLock;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không tạo được khóa từ Pairing Wizard.';
      setPairingError(message);
      return undefined;
    } finally {
      setPairingLoading(false);
    }
  }, [reloadAccessRecords, selectedLockFilter]);


  const updateLockSettings = useCallback(async (lockId: string, patch: Partial<LockSettings>) => {
    const updatedLock = await MockLockRepository.updateLockSettings(lockId, patch);
    if (!updatedLock) {
      return undefined;
    }
    setLocks(prev => {
      const next = prev.map(lock => (lock.id === lockId ? updatedLock : lock));
      setDashboardSummary(buildSummaryFromLocks(next));
      return next;
    });
    await reloadAccessRecords();
    return updatedLock;
  }, [reloadAccessRecords]);

  const getDeviceDiagnostic = useCallback((lockId: string) => MockLockRepository.getDeviceDiagnostic(lockId), []);
  const getFirmwareInfo = useCallback((lockId: string) => MockLockRepository.getFirmwareInfo(lockId), []);
  const getCapabilityMatrix = useCallback((lockId: string) => MockLockRepository.getCapabilityMatrix(lockId), []);

  const applyFirmwareVersion = useCallback(async (lockId: string, version: string) => {
    const updatedLock = await MockLockRepository.applyFirmwareVersion(lockId, version);
    if (!updatedLock) {
      return undefined;
    }
    setLocks(prev => {
      const next = prev.map(lock => (lock.id === lockId ? updatedLock : lock));
      setDashboardSummary(buildSummaryFromLocks(next));
      return next;
    });
    await reloadAccessRecords();
    return updatedLock;
  }, [reloadAccessRecords]);

  const addDemoLock = useCallback(async (preferredType: LockFilterType = selectedLockFilter) => {
    setLocksLoading(true);
    setLocksError(undefined);
    try {
      const createdLock = await MockLockRepository.addDemoLock(preferredType);
      const nextFilter = selectedLockFilter === 'all' ? 'all' : createdLock.homeType;
      setSelectedLockFilter(nextFilter);
      const [homeData, lockData, summaryData] = await Promise.all([
        MockLockRepository.getHomes(),
        MockLockRepository.getLocks(nextFilter),
        MockLockRepository.getDashboardSummary(nextFilter),
      ]);
      setHomes(homeData);
      setLocks(lockData);
      setDashboardSummary(summaryData);
      return createdLock;
    } catch {
      setLocksError('Không thêm được khoá demo.');
      return undefined;
    } finally {
      setLocksLoading(false);
    }
  }, [selectedLockFilter]);

  useEffect(() => {
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      if (cancelled) {
        return;
      }

      reloadLocks('all');
      reloadAccessRecords();
      reloadPairingGateways();
      reloadAlerts();
      reloadIncidentTickets();
      reloadNotificationPolicy();
      reloadRooms();
      reloadAnalytics(defaultAnalyticsFilter);
    });

    return () => {
      cancelled = true;
      task.cancel?.();
    };
  }, [reloadAccessRecords, reloadAlerts, reloadAnalytics, reloadIncidentTickets, reloadLocks, reloadNotificationPolicy, reloadPairingGateways, reloadRooms]);

  useEffect(() => {
    let mounted = true;

    const bootstrapSession = async () => {
      try {
        const [session, trustedDevice] = await Promise.all([
          sessionStore.getActiveSession(),
          sessionStore.getTrustedDevice(),
        ]);

        if (session && MockAuthRepository.isSessionValid(session)) {
          const user = await MockAuthRepository.getUserById(session.userId);
          if (user && mounted) {
            setAuth({
              isAuthenticated: true,
              user,
              session,
              loading: false,
              isBootstrapping: false,
              canUseBiometric: Boolean(trustedDevice?.biometricEnabled),
              trustedDevice,
            });
            return;
          }
        }

        if (session) {
          await sessionStore.clearActiveSession();
        }

        if (mounted) {
          setAuth(prev => ({
            ...prev,
            isAuthenticated: false,
            user: undefined,
            session: undefined,
            loading: false,
            isBootstrapping: false,
            canUseBiometric: Boolean(trustedDevice?.biometricEnabled),
            trustedDevice,
          }));
        }
      } catch {
        if (mounted) {
          setAuth(prev => ({...prev, isBootstrapping: false, loading: false}));
        }
      }
    };

    bootstrapSession();
    return () => {
      mounted = false;
    };
  }, []);

  const finishLogin = async (user: AplusUser, biometricEnabled = true) => {
    const session = MockAuthRepository.createSession(user.id, biometricEnabled);
    const trustedDevice = createTrustedDevice(session);
    await sessionStore.setActiveSession(session);
    await sessionStore.setTrustedDevice(trustedDevice);
    setAuth(prev => ({
      ...prev,
      isAuthenticated: true,
      user,
      session,
      trustedDevice,
      canUseBiometric: biometricEnabled,
      loading: false,
      error: undefined,
      isBootstrapping: false,
      activeOtp: undefined,
      pendingRegister: undefined,
      verifiedResetAccount: undefined,
    }));
  };

  const findLock = useCallback((lockId: string) => locks.find(item => item.id === lockId), [locks]);
  const findCommand = useCallback((commandId: string) => lockCommands.find(item => item.id === commandId), [lockCommands]);

  const appendCommandStep = useCallback((commandId: string, status: LockCommandStatus, message: string) => {
    setLockCommands(prev => prev.map(command => {
      if (command.id !== commandId) {
        return command;
      }
      const now = Date.now();
      return {
        ...command,
        status,
        updatedAt: now,
        errorMessage: status === 'failed' || status === 'timeout' ? message : command.errorMessage,
        steps: [
          ...command.steps,
          {
            status,
            label: statusLabel(status),
            message,
            at: now,
          },
        ],
      };
    }));
  }, []);

  const updateLockAfterCommand = useCallback(async (lockId: string, type: LockCommandType, commandId: string, result: 'success' | 'timeout' | 'failed') => {
    const currentLock = locks.find(item => item.id === lockId);
    if (!currentLock) {
      return;
    }

    const actorName = auth.user?.name ?? 'Admin Aplus';
    const isSuccess = result === 'success';
    const nextLocked = type === 'lock' ? true : type === 'unlock' || type === 'remoteUnlock' ? false : currentLock.isLocked;
    const message = isSuccess
      ? `${commandTitle(type)} thành công qua app`
      : result === 'timeout'
        ? `${commandTitle(type)} timeout, chưa đổi trạng thái khóa`
        : `${commandTitle(type)} thất bại, chưa đổi trạng thái khóa`;

    let updatedLock = currentLock;
    if (isSuccess) {
      updatedLock = {
        ...currentLock,
        isLocked: nextLocked,
        doorState: nextLocked ? 'closed' : 'open',
        syncState: 'synced',
        lastActivity: `${commandTitle(type)} · vừa xong`,
        lastSeenAt: 'Vừa xong',
      };
      await MockLockRepository.updateLockRuntimeState(lockId, updatedLock);
      setLocks(prev => {
        const next = prev.map(lock => (lock.id === lockId ? updatedLock : lock));
        setDashboardSummary(buildSummaryFromLocks(next));
        return next;
      });
    }

    const record: AccessRecord = {
      id: `record-${Date.now()}-${Math.round(Math.random() * 999)}`,
      lockId,
      lockName: currentLock.name,
      roomName: currentLock.roomName,
      method: type === 'lock' ? 'App Lock' : 'App Remote Unlock',
      result,
      commandId,
      actorName,
      message,
      createdAt: Date.now(),
    };
    await MockLockRepository.addAccessRecord(record);
    setAccessRecords(prev => [record, ...prev].slice(0, 40));
    await reloadAlerts();
  }, [auth.user?.name, locks, reloadAlerts]);

  const evaluateRemoteUnlock = useCallback((lockId: string): RemoteUnlockCheck => {
    const lock = locks.find(item => item.id === lockId);
    if (!lock) {
      return {
        canProceed: false,
        checks: [{key: 'lock', label: 'Khoá tồn tại', passed: false, message: 'Không tìm thấy lockId'}],
      };
    }

    const checks = [
      {
        key: 'permission',
        label: 'Quyền mở từ xa',
        passed: lock.permission.canRemoteUnlock,
        message: lock.permission.canRemoteUnlock ? 'Tài khoản hiện tại có quyền điều khiển từ xa.' : 'Tài khoản hiện tại chưa được cấp quyền mở từ xa.',
      },
      {
        key: 'capability',
        label: 'Tương thích phần cứng',
        passed: lock.capabilities.supportsRemoteUnlock,
        message: lock.capabilities.supportsRemoteUnlock ? `${lock.hardwareModel ?? 'Thiết bị'} hỗ trợ remote unlock.` : 'Model khóa này không hỗ trợ remote unlock.',
      },
      {
        key: 'setting',
        label: 'Cài đặt remote unlock',
        passed: lock.settings.remoteUnlockEnabled,
        message: lock.settings.remoteUnlockEnabled ? 'Remote unlock đang bật cho khóa này.' : 'Remote unlock đang tắt trong cài đặt khóa.',
      },
      {
        key: 'online',
        label: 'Kết nối realtime',
        passed: !isOffline && lock.connectionState !== 'offline' && lock.gatewayOnline,
        message: !isOffline && lock.connectionState !== 'offline' && lock.gatewayOnline ? `${lock.gatewayName ?? 'Gateway'} online, có thể gửi lệnh.` : 'Offline hoặc gateway không online, chặn lệnh để tránh sai trạng thái.',
      },
    ];

    return {
      canProceed: checks.every(check => check.passed),
      checks,
    };
  }, [isOffline, locks]);

  const startLockCommand = useCallback(async ({lockId, type, scenario = 'success', authMethod = 'mock-admin'}: {lockId: string; type: LockCommandType; scenario?: LockCommandScenario; authMethod?: LockCommandAuthMethod}) => {
    const lock = locks.find(item => item.id === lockId);
    if (!lock) {
      return undefined;
    }

    if ((type === 'remoteUnlock' || type === 'unlock') && !evaluateRemoteUnlock(lockId).canProceed) {
      return undefined;
    }

    if (type === 'lock' && (!lock.permission.canLock || lock.connectionState === 'offline' || isOffline)) {
      return undefined;
    }

    const now = Date.now();
    const command: LockCommand = {
      id: `cmd-${now}-${Math.round(Math.random() * 999)}`,
      lockId,
      type,
      scenario,
      authMethod,
      status: 'pending',
      commandCode: `CMD-${String(now).slice(-6)}`,
      createdAt: now,
      updatedAt: now,
      steps: [
        {
          status: 'pending',
          label: 'Pending',
          message: 'Đã tạo lệnh cục bộ, chưa đổi trạng thái khóa.',
          at: now,
        },
      ],
    };

    setLockCommands(prev => [command, ...prev].slice(0, 20));

    setTimeout(() => appendCommandStep(command.id, 'sent', 'Đã gửi lệnh tới gateway/mock realtime.'), 450);
    setTimeout(() => appendCommandStep(command.id, 'ack', 'Gateway đã nhận lệnh và trả ACK.'), 1150);
    setTimeout(() => {
      if (scenario === 'success') {
        appendCommandStep(command.id, 'success', 'Thiết bị báo thực thi thành công. Lúc này mới đổi trạng thái khóa.');
        updateLockAfterCommand(lockId, type, command.id, 'success');
        return;
      }
      if (scenario === 'timeout') {
        appendCommandStep(command.id, 'timeout', 'Không nhận được success event trong thời gian chờ. Trạng thái khóa giữ nguyên.');
        updateLockAfterCommand(lockId, type, command.id, 'timeout');
        return;
      }
      appendCommandStep(command.id, 'failed', 'Gateway trả lỗi mock. Trạng thái khóa giữ nguyên.');
      updateLockAfterCommand(lockId, type, command.id, 'failed');
    }, 2350);

    return command;
  }, [appendCommandStep, evaluateRemoteUnlock, isOffline, locks, updateLockAfterCommand]);

  const value = useMemo<AppStateValue>(() => ({
    auth,
    homes,
    locks,
    dashboardSummary,
    selectedLockFilter,
    locksLoading,
    locksError,
    isOffline,
    lockCommands,
    accessRecords,
    pairingGateways,
    pairingLoading,
    pairingError,
    alerts,
    alertSummary,
    incidentTickets,
    notificationPolicy,
    alertsLoading,
    roomBuildings,
    roomFloors,
    rooms,
    roomSummary,
    roomsLoading,
    roomsError,
    analyticsFilter,
    analyticsSummary,
    methodBreakdown,
    userBreakdown,
    riskLocks,
    reportTimeSeries,
    reportsLoading,
    lastReportExport,
    currentLanguage,
    appPinSettings,
    trustedDevices,
    brandingConfig,
    localizationResources,
    accountSecurityLoading,
    remoteUnlockPin: appPinSettings?.enabled ? appPinSettings.pinHash : REMOTE_UNLOCK_APP_PIN,

    getAccessRecordDetail,
    saveAccessRecordNote,
    getBatteryReports,
    reloadAlerts,
    getAlertDetail,
    markAlertRead,
    resolveAlert,
    ignoreAlert,
    createIncidentTicket,
    reloadIncidentTickets,
    reloadNotificationPolicy,
    updateNotificationPolicy,
    reloadRooms,
    getRoomDetail,
    saveRoom,
    deleteRoom,
    assignLockToRoom,
    previewRoomImport,
    commitRoomImport,
    reloadAnalytics,
    updateAnalyticsFilter,
    exportAnalyticsReport,
    reloadAccountSecurity,
    updateAppPinSettings,
    setAppPin,
    verifyAppPin,
    changeLanguage,
    updateBrandingConfig,
    revokeTrustedDevice,
    renameTrustedDevice,

    loginWithPassword: async (account, password) => {
      setAuth(prev => ({...prev, loading: true, error: undefined}));
      try {
        const user = await MockAuthRepository.login(account, password);
        await finishLogin(user, true);
        return {success: true};
      } catch (error) {
        const message = getAuthErrorMessage(error);
        setAuth(prev => ({...prev, loading: false, error: message}));
        return {success: false, message};
      }
    },

    loginWithBiometric: async () => {
      setAuth(prev => ({...prev, loading: true, error: undefined}));
      try {
        const trustedDevice = await sessionStore.getTrustedDevice();
        if (!trustedDevice?.biometricEnabled) {
          const message = 'Chưa có thiết bị tin cậy để đăng nhập sinh trắc học.';
          setAuth(prev => ({...prev, loading: false, error: message}));
          return {success: false, message};
        }

        const biometric = await NativeAdapters.biometric.authenticate('Đăng nhập Aplus bằng sinh trắc học');
        if (!biometric.success) {
          const message = 'Xác thực sinh trắc học không thành công.';
          setAuth(prev => ({...prev, loading: false, error: message}));
          return {success: false, message};
        }

        const user = await MockAuthRepository.getUserById(trustedDevice.userId);
        if (!user) {
          const message = 'Phiên thiết bị tin cậy không còn hợp lệ.';
          setAuth(prev => ({...prev, loading: false, error: message, canUseBiometric: false}));
          await sessionStore.clearTrustedDevice();
          return {success: false, message};
        }

        await finishLogin(user, true);
        return {success: true};
      } catch (error) {
        const message = getAuthErrorMessage(error);
        setAuth(prev => ({...prev, loading: false, error: message}));
        return {success: false, message};
      }
    },

    requestRegisterOtp: async (input) => {
      setAuth(prev => ({...prev, loading: true, error: undefined, pendingRegister: input}));
      try {
        const challenge = await MockAuthRepository.requestOtp('register', input.account);
        setAuth(prev => ({...prev, loading: false, activeOtp: challenge, pendingRegister: input}));
        return {success: true, message: `Mã OTP mock là ${MockAuthRepository.getDefaultOtp()}`};
      } catch (error) {
        const message = getAuthErrorMessage(error);
        setAuth(prev => ({...prev, loading: false, error: message}));
        return {success: false, message};
      }
    },

    requestForgotOtp: async (account) => {
      setAuth(prev => ({...prev, loading: true, error: undefined}));
      try {
        const challenge = await MockAuthRepository.requestOtp('forgot', account);
        setAuth(prev => ({...prev, loading: false, activeOtp: challenge, verifiedResetAccount: undefined}));
        return {success: true, message: `Mã OTP mock là ${MockAuthRepository.getDefaultOtp()}`};
      } catch (error) {
        const message = getAuthErrorMessage(error);
        setAuth(prev => ({...prev, loading: false, error: message}));
        return {success: false, message};
      }
    },

    verifyOtpAndContinue: async (flow, account, otp) => {
      setAuth(prev => ({...prev, loading: true, error: undefined}));
      try {
        await MockAuthRepository.verifyOtp(flow, account, otp);

        if (flow === 'register') {
          const pendingRegister = auth.pendingRegister;
          if (!pendingRegister) {
            const message = 'Không còn dữ liệu đăng ký. Vui lòng đăng ký lại.';
            setAuth(prev => ({...prev, loading: false, error: message}));
            return {success: false, message};
          }
          const user = await MockAuthRepository.register(pendingRegister);
          await finishLogin(user, true);
          return {success: true};
        }

        setAuth(prev => ({...prev, loading: false, verifiedResetAccount: account, error: undefined}));
        return {success: true};
      } catch (error) {
        const message = getAuthErrorMessage(error);
        setAuth(prev => ({...prev, loading: false, error: message}));
        return {success: false, message};
      }
    },

    resetPassword: async (input) => {
      setAuth(prev => ({...prev, loading: true, error: undefined}));
      try {
        await MockAuthRepository.resetPassword(input.account, input.password);
        await sessionStore.clearActiveSession();
        setAuth(prev => ({
          ...prev,
          loading: false,
          error: undefined,
          isAuthenticated: false,
          user: undefined,
          session: undefined,
          activeOtp: undefined,
          verifiedResetAccount: undefined,
        }));
        return {success: true};
      } catch (error) {
        const message = getAuthErrorMessage(error);
        setAuth(prev => ({...prev, loading: false, error: message}));
        return {success: false, message};
      }
    },

    resendOtp: async (flow, account) => {
      setAuth(prev => ({...prev, loading: true, error: undefined}));
      try {
        const challenge = await MockAuthRepository.requestOtp(flow, account);
        setAuth(prev => ({...prev, loading: false, activeOtp: challenge}));
        return {success: true, message: `Mã OTP mock là ${MockAuthRepository.getDefaultOtp()}`};
      } catch (error) {
        const message = getAuthErrorMessage(error);
        setAuth(prev => ({...prev, loading: false, error: message}));
        return {success: false, message};
      }
    },

    logoutMock: async (forgetTrustedDevice = false) => {
      await sessionStore.clearActiveSession();
      if (forgetTrustedDevice) {
        await sessionStore.clearTrustedDevice();
      }
      const trustedDevice = forgetTrustedDevice ? undefined : await sessionStore.getTrustedDevice();
      setAuth({
        isAuthenticated: false,
        loading: false,
        isBootstrapping: false,
        canUseBiometric: Boolean(trustedDevice?.biometricEnabled),
        trustedDevice,
      });
    },

    loginMock: async () => {
      const user = await MockAuthRepository.login('admin@aplus.vn', '123456');
      await finishLogin(user, true);
    },

    clearAuthError: () => setAuth(prev => ({...prev, error: undefined})),
    reloadLocks,
    reloadAccessRecords,
    setLockFilter,
    addDemoLock,
    reloadPairingGateways,
    isPairingSerialBound,
    addPairedLock,
    updateLockSettings,
    getDeviceDiagnostic,
    getFirmwareInfo,
    applyFirmwareVersion,
    getCapabilityMatrix,
    toggleLockMock: (lockId: string) => {
      setLocks(prev => {
        const nextLocks = prev.map(lock => (
          lock.id === lockId
            ? {
                ...lock,
                isLocked: !lock.isLocked,
                doorState: lock.isLocked ? 'open' as const : 'closed' as const,
                lastActivity: `${lock.isLocked ? 'Mở khoá' : 'Khoá lại'} bằng app · vừa xong`,
                syncState: isOffline ? 'pending' as const : 'synced' as const,
              }
            : lock
        ));
        setDashboardSummary(buildSummaryFromLocks(nextLocks));
        return nextLocks;
      });
    },
    setOfflineMock: setIsOffline,
    evaluateRemoteUnlock,
    startLockCommand,
    findCommand,
    findLock,
  }), [accessRecords, alertSummary, alerts, alertsLoading, addDemoLock, addPairedLock, applyFirmwareVersion, auth, createIncidentTicket, dashboardSummary, evaluateRemoteUnlock, findCommand, findLock, getAccessRecordDetail, getAlertDetail, getBatteryReports, getCapabilityMatrix, getDeviceDiagnostic, getFirmwareInfo, homes, ignoreAlert, incidentTickets, isOffline, isPairingSerialBound, lockCommands, locks, locksError, locksLoading, pairingError, pairingGateways, pairingLoading, markAlertRead, notificationPolicy, reloadAlerts, reloadIncidentTickets, reloadNotificationPolicy, resolveAlert, saveAccessRecordNote, reloadAccessRecords, reloadLocks, reloadPairingGateways, reloadRooms, roomBuildings, roomFloors, roomSummary, rooms, roomsError, roomsLoading, saveRoom, selectedLockFilter, setLockFilter, startLockCommand, updateLockSettings, updateNotificationPolicy, getRoomDetail, deleteRoom, assignLockToRoom, previewRoomImport, commitRoomImport, analyticsFilter, analyticsSummary, methodBreakdown, userBreakdown, riskLocks, reportTimeSeries, reportsLoading, lastReportExport, reloadAnalytics, updateAnalyticsFilter, exportAnalyticsReport, currentLanguage, appPinSettings, trustedDevices, brandingConfig, localizationResources, accountSecurityLoading, reloadAccountSecurity, updateAppPinSettings, setAppPin, verifyAppPin, changeLanguage, updateBrandingConfig, revokeTrustedDevice, renameTrustedDevice]);

  const authNavigationValue = useMemo<AuthNavigationState>(() => ({
    isAuthenticated: auth.isAuthenticated,
    isBootstrapping: auth.isBootstrapping,
  }), [auth.isAuthenticated, auth.isBootstrapping]);

  return (
    <LanguageProvider language={currentLanguage}>
      <AuthNavigationContext.Provider value={authNavigationValue}>
        <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
      </AuthNavigationContext.Provider>
    </LanguageProvider>
  );
}

export function useAuthNavigationState() {
  const value = useContext(AuthNavigationContext);
  if (!value) {
    throw new Error('useAuthNavigationState phải được dùng bên trong AppStateProvider');
  }
  return value;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) {
    throw new Error('useAppState phải được dùng bên trong AppStateProvider');
  }
  return value;
}

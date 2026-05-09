import React, {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {NativeAdapters} from '@/services/adapters/nativeAdapters';
import {MockAuthRepository} from '@/services/repositories/MockAuthRepository';
import {MockLockRepository} from '@/services/repositories/MockLockRepository';
import {createSessionStore} from '@/services/session/SessionStore';
import type {AplusUser, AuthActionResult, AuthSession, OtpChallenge, OtpFlow, RegisterInput, ResetPasswordInput, TrustedDeviceSession} from '@/types/auth';
import type {AccessRecord, AplusHome, AplusLock, LockCommand, LockCommandAuthMethod, LockCommandScenario, LockCommandStatus, LockCommandType, LockDashboardSummary, LockFilterType, RemoteUnlockCheck} from '@/types/lock';

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
  setLockFilter: (filter: LockFilterType) => Promise<void>;
  addDemoLock: (preferredType?: LockFilterType) => Promise<AplusLock | undefined>;
  toggleLockMock: (lockId: string) => void;
  setOfflineMock: (offline: boolean) => void;
  evaluateRemoteUnlock: (lockId: string) => RemoteUnlockCheck;
  startLockCommand: (input: {lockId: string; type: LockCommandType; scenario?: LockCommandScenario; authMethod?: LockCommandAuthMethod}) => Promise<LockCommand | undefined>;
  findCommand: (commandId: string) => LockCommand | undefined;
  findLock: (lockId: string) => AplusLock | undefined;
};

const emptySummary: LockDashboardSummary = {
  totalLocks: 0,
  onlineLocks: 0,
  offlineLocks: 0,
  lowBatteryLocks: 0,
  alertLocks: 0,
  pendingSyncLocks: 0,
};

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

  const reloadLocks = useCallback(async (filter: LockFilterType = selectedLockFilter) => {
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
  }, [selectedLockFilter]);

  const reloadAccessRecords = useCallback(async (lockId?: string) => {
    const records = await MockLockRepository.getAccessRecords(lockId);
    setAccessRecords(records);
  }, []);

  const setLockFilter = async (filter: LockFilterType) => {
    setSelectedLockFilter(filter);
    await reloadLocks(filter);
  };

  const addDemoLock = async (preferredType: LockFilterType = selectedLockFilter) => {
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
  };

  useEffect(() => {
    reloadLocks('all');
    reloadAccessRecords();
  }, []);

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
  }, [auth.user?.name, locks]);

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
    remoteUnlockPin: REMOTE_UNLOCK_APP_PIN,

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
  }), [accessRecords, auth, dashboardSummary, evaluateRemoteUnlock, findCommand, findLock, homes, isOffline, lockCommands, locks, locksError, locksLoading, reloadAccessRecords, reloadLocks, selectedLockFilter, startLockCommand]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) {
    throw new Error('useAppState phải được dùng bên trong AppStateProvider');
  }
  return value;
}

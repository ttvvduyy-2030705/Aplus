import type {AplusUser, AuthSession, OtpChallenge, OtpFlow, RegisterInput} from '@/types/auth';

const DEFAULT_OTP = '123456';
const OTP_TTL_MS = 3 * 60 * 1000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type MockAccount = {
  user: AplusUser;
  password: string;
};

type AuthErrorCode =
  | 'ACCOUNT_REQUIRED'
  | 'PASSWORD_REQUIRED'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_EXISTS'
  | 'ACCOUNT_NOT_FOUND'
  | 'OTP_NOT_FOUND'
  | 'OTP_EXPIRED'
  | 'OTP_INVALID'
  | 'REGISTER_PENDING_MISSING';

export class AuthRepositoryError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthRepositoryError';
    this.code = code;
  }
}

const accounts: MockAccount[] = [
  {
    user: {
      id: 'admin-aplus-001',
      name: 'Aplus Admin',
      phone: '0900000000',
      email: 'admin@aplus.vn',
      role: 'owner',
    },
    password: '123456',
  },
];

const otpChallenges = new Map<string, OtpChallenge>();

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeAccount(account: string) {
  return account.trim().toLowerCase();
}

function challengeKey(flow: OtpFlow, account: string) {
  return `${flow}:${normalizeAccount(account)}`;
}

function findAccount(account: string) {
  const normalized = normalizeAccount(account);
  return accounts.find(item => (
    item.user.email?.toLowerCase() === normalized ||
    item.user.phone.replace(/\s/g, '') === normalized.replace(/\s/g, '')
  ));
}

function createSessionId() {
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const MockAuthRepository = {
  async login(account: string, password: string): Promise<AplusUser> {
    await wait(420);

    if (!account.trim()) {
      throw new AuthRepositoryError('ACCOUNT_REQUIRED', 'Vui lòng nhập email hoặc số điện thoại.');
    }
    if (!password) {
      throw new AuthRepositoryError('PASSWORD_REQUIRED', 'Vui lòng nhập mật khẩu.');
    }

    const found = findAccount(account);
    if (!found || found.password !== password) {
      throw new AuthRepositoryError('INVALID_CREDENTIALS', 'Tài khoản hoặc mật khẩu không đúng.');
    }

    return found.user;
  },

  async getUserById(userId: string): Promise<AplusUser | undefined> {
    await wait(120);
    return accounts.find(item => item.user.id === userId)?.user;
  },

  async requestOtp(flow: OtpFlow, account: string): Promise<OtpChallenge> {
    await wait(360);
    const normalized = normalizeAccount(account);

    if (!normalized) {
      throw new AuthRepositoryError('ACCOUNT_REQUIRED', 'Vui lòng nhập email hoặc số điện thoại.');
    }

    const existing = findAccount(normalized);
    if (flow === 'register' && existing) {
      throw new AuthRepositoryError('ACCOUNT_EXISTS', 'Tài khoản này đã tồn tại. Hãy đăng nhập hoặc khôi phục mật khẩu.');
    }
    if (flow === 'forgot' && !existing) {
      throw new AuthRepositoryError('ACCOUNT_NOT_FOUND', 'Không tìm thấy tài khoản để khôi phục mật khẩu.');
    }

    const now = Date.now();
    const challenge: OtpChallenge = {
      flow,
      account: normalized,
      code: DEFAULT_OTP,
      createdAt: now,
      expiresAt: now + OTP_TTL_MS,
    };
    otpChallenges.set(challengeKey(flow, normalized), challenge);
    return challenge;
  },

  async verifyOtp(flow: OtpFlow, account: string, otp: string): Promise<void> {
    await wait(260);
    const key = challengeKey(flow, account);
    const challenge = otpChallenges.get(key);

    if (!challenge) {
      throw new AuthRepositoryError('OTP_NOT_FOUND', 'Mã OTP không tồn tại hoặc bạn chưa yêu cầu mã.');
    }
    if (Date.now() > challenge.expiresAt) {
      otpChallenges.delete(key);
      throw new AuthRepositoryError('OTP_EXPIRED', 'Mã OTP đã quá hạn. Vui lòng gửi lại mã mới.');
    }
    if (otp.trim() !== challenge.code) {
      throw new AuthRepositoryError('OTP_INVALID', 'Mã OTP không đúng. Vui lòng kiểm tra lại.');
    }
  },

  async register(input: RegisterInput): Promise<AplusUser> {
    await wait(420);
    const account = normalizeAccount(input.account);
    if (findAccount(account)) {
      throw new AuthRepositoryError('ACCOUNT_EXISTS', 'Tài khoản này đã tồn tại.');
    }

    const isEmail = account.includes('@');
    const user: AplusUser = {
      id: `user-${Date.now()}`,
      name: input.name.trim(),
      phone: isEmail ? input.phone?.trim() || 'Chưa cập nhật' : input.account.trim(),
      email: isEmail ? account : undefined,
      role: 'owner',
    };

    accounts.push({user, password: input.password});
    otpChallenges.delete(challengeKey('register', account));
    return user;
  },

  async resetPassword(account: string, newPassword: string): Promise<void> {
    await wait(380);
    const found = findAccount(account);
    if (!found) {
      throw new AuthRepositoryError('ACCOUNT_NOT_FOUND', 'Không tìm thấy tài khoản cần đặt lại mật khẩu.');
    }
    found.password = newPassword;
    otpChallenges.delete(challengeKey('forgot', account));
  },

  createSession(userId: string, biometricEnabled = true): AuthSession {
    const now = Date.now();
    return {
      sessionId: createSessionId(),
      userId,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
      trustedDeviceId: 'aplus-trusted-device-mock-android-ios',
      biometricEnabled,
    };
  },

  isSessionValid(session: AuthSession | undefined): session is AuthSession {
    return Boolean(session && session.expiresAt > Date.now());
  },

  getDefaultOtp() {
    return DEFAULT_OTP;
  },
};

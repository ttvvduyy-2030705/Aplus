export type AplusUserRole = 'owner' | 'admin' | 'guest';

export type AplusUser = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: AplusUserRole;
};

export type AuthSession = {
  sessionId: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  trustedDeviceId: string;
  biometricEnabled: boolean;
};

export type TrustedDeviceSession = {
  userId: string;
  trustedDeviceId: string;
  createdAt: number;
  lastActiveAt: number;
  biometricEnabled: boolean;
};

export type LoginInput = {
  account: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  account: string;
  phone?: string;
  password: string;
  confirmPassword: string;
};

export type OtpFlow = 'register' | 'forgot';

export type OtpChallenge = {
  flow: OtpFlow;
  account: string;
  code: string;
  expiresAt: number;
  createdAt: number;
};

export type ResetPasswordInput = {
  account: string;
  password: string;
  confirmPassword: string;
};

export type AuthActionResult = {
  success: boolean;
  message?: string;
};

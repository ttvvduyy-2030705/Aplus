export type AppLanguageCode = 'vi' | 'en';

export type AppPinSettings = {
  enabled: boolean;
  pinHash: string;
  requireForSensitiveActions: boolean;
  biometricFallbackEnabled: boolean;
  autoLockAfterMinutes: number;
  failedAttempts: number;
  updatedAt: number;
};

export type TrustedDevice = {
  id: string;
  name: string;
  platform: 'android' | 'ios' | 'web';
  model: string;
  lastActiveAt: number;
  firstSeenAt: number;
  trusted: boolean;
  current: boolean;
  biometricEnabled: boolean;
  locationHint: string;
  risk: 'normal' | 'new' | 'suspicious';
};

export type BrandingConfig = {
  projectName: string;
  systemName: string;
  logoName: string;
  primaryColor: string;
  hotline: string;
  termsUrl: string;
  privacyUrl: string;
  updatedAt: number;
};

export type LocalizationResource = {
  language: AppLanguageCode;
  label: string;
  completion: number;
  strings: Record<string, string>;
};

export type AccountSecuritySummary = {
  appPinEnabled: boolean;
  trustedDeviceCount: number;
  suspiciousDeviceCount: number;
  language: AppLanguageCode;
  brandingName: string;
};

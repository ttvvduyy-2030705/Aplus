import type {AppLanguageCode, AppPinSettings, BrandingConfig, LocalizationResource, TrustedDevice, AccountSecuritySummary} from '@/types/account';

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

let currentLanguage: AppLanguageCode = 'vi';

let appPinSettings: AppPinSettings = {
  enabled: true,
  pinHash: '2580',
  requireForSensitiveActions: true,
  biometricFallbackEnabled: true,
  autoLockAfterMinutes: 5,
  failedAttempts: 0,
  updatedAt: Date.now(),
};

let trustedDevices: TrustedDevice[] = [
  {
    id: 'aplus-trusted-device-mock-android-ios',
    name: 'Thiết bị hiện tại',
    platform: 'android',
    model: 'Pixel / Android mock',
    firstSeenAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    lastActiveAt: Date.now() - 4 * 60 * 1000,
    trusted: true,
    current: true,
    biometricEnabled: true,
    locationHint: 'Bangkok, TH',
    risk: 'normal',
  },
  {
    id: 'trusted-ios-owner-02',
    name: 'iPhone của Owner',
    platform: 'ios',
    model: 'iPhone 15 Pro',
    firstSeenAt: Date.now() - 18 * 24 * 60 * 60 * 1000,
    lastActiveAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    trusted: true,
    current: false,
    biometricEnabled: true,
    locationHint: 'Ho Chi Minh City, VN',
    risk: 'normal',
  },
  {
    id: 'trusted-web-risk-03',
    name: 'Chrome Windows lạ',
    platform: 'web',
    model: 'Windows 11 / Chrome',
    firstSeenAt: Date.now() - 9 * 60 * 60 * 1000,
    lastActiveAt: Date.now() - 42 * 60 * 1000,
    trusted: false,
    current: false,
    biometricEnabled: false,
    locationHint: 'Unknown network',
    risk: 'suspicious',
  },
];

let brandingConfig: BrandingConfig = {
  projectName: 'Aplus Lock',
  systemName: 'Aplus Lock Premium',
  logoName: 'Aplus black logo',
  primaryColor: '#E50914',
  hotline: '0900 000 000',
  termsUrl: 'https://aplus.vn/terms',
  privacyUrl: 'https://aplus.vn/privacy',
  updatedAt: Date.now(),
};

const resources: LocalizationResource[] = [
  {
    language: 'vi',
    label: 'Tiếng Việt',
    completion: 100,
    strings: {
      home: 'Nhà',
      access: 'Chìa khoá',
      activity: 'Lịch sử',
      more: 'Thêm',
      profile: 'Tôi',
      appPin: 'Bảo mật App PIN',
      trustedDevices: 'Thiết bị tin cậy',
      branding: 'Ngôn ngữ & Branding',
    },
  },
  {
    language: 'en',
    label: 'English',
    completion: 100,
    strings: {
      home: 'Home',
      access: 'Keys',
      activity: 'Records',
      more: 'More',
      profile: 'Me',
      appPin: 'App PIN security',
      trustedDevices: 'Trusted devices',
      branding: 'Language & Branding',
    },
  },
];

export const MockAccountRepository = {
  async getAppPinSettings(): Promise<AppPinSettings> {
    await wait(100);
    return {...appPinSettings};
  },

  async updateAppPinSettings(patch: Partial<AppPinSettings>): Promise<AppPinSettings> {
    await wait(160);
    appPinSettings = {...appPinSettings, ...patch, updatedAt: Date.now()};
    return {...appPinSettings};
  },

  async verifyAppPin(pin: string): Promise<boolean> {
    await wait(180);
    const success = appPinSettings.enabled && pin === appPinSettings.pinHash;
    appPinSettings = {
      ...appPinSettings,
      failedAttempts: success ? 0 : appPinSettings.failedAttempts + 1,
      updatedAt: Date.now(),
    };
    return success;
  },

  async setAppPin(pin: string): Promise<AppPinSettings> {
    await wait(180);
    appPinSettings = {
      ...appPinSettings,
      enabled: true,
      pinHash: pin,
      failedAttempts: 0,
      updatedAt: Date.now(),
    };
    return {...appPinSettings};
  },

  async getTrustedDevices(): Promise<TrustedDevice[]> {
    await wait(120);
    return trustedDevices.map(device => ({...device}));
  },

  async revokeTrustedDevice(deviceId: string): Promise<TrustedDevice[]> {
    await wait(160);
    trustedDevices = trustedDevices.map(device => device.id === deviceId ? {...device, trusted: false, biometricEnabled: false, risk: device.current ? 'new' : device.risk} : device);
    return trustedDevices.map(device => ({...device}));
  },

  async renameTrustedDevice(deviceId: string, name: string): Promise<TrustedDevice[]> {
    await wait(120);
    trustedDevices = trustedDevices.map(device => device.id === deviceId ? {...device, name: name.trim() || device.name} : device);
    return trustedDevices.map(device => ({...device}));
  },

  async getBrandingConfig(): Promise<BrandingConfig> {
    await wait(100);
    return {...brandingConfig};
  },

  async updateBrandingConfig(patch: Partial<BrandingConfig>): Promise<BrandingConfig> {
    await wait(160);
    brandingConfig = {...brandingConfig, ...patch, updatedAt: Date.now()};
    return {...brandingConfig};
  },

  async getLocalizationResources(): Promise<LocalizationResource[]> {
    await wait(100);
    return resources.map(resource => ({...resource, strings: {...resource.strings}}));
  },

  async getLanguage(): Promise<AppLanguageCode> {
    await wait(80);
    return currentLanguage;
  },

  async setLanguage(language: AppLanguageCode): Promise<AppLanguageCode> {
    await wait(120);
    currentLanguage = language;
    return currentLanguage;
  },

  async getAccountSecuritySummary(): Promise<AccountSecuritySummary> {
    await wait(100);
    return {
      appPinEnabled: appPinSettings.enabled,
      trustedDeviceCount: trustedDevices.filter(device => device.trusted).length,
      suspiciousDeviceCount: trustedDevices.filter(device => device.risk === 'suspicious').length,
      language: currentLanguage,
      brandingName: brandingConfig.systemName,
    };
  },
};

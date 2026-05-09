import type {OtpFlow} from '@/types/auth';
import type {CredentialType} from '@/types/credential';

export type AuthRouteName = 'Login' | 'Register' | 'ForgotPassword' | 'OtpVerify' | 'ResetPassword';
export type MainTabRouteName = 'Home' | 'Access' | 'Activity' | 'Settings';

export type AppRouteParams = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OtpVerify: {flow: OtpFlow; account: string};
  ResetPassword: {account: string};
  Home: undefined;
  LockDetail: {lockId: string};
  RemoteUnlock: {lockId: string};
  CommandLifecycle: {lockId: string; commandId: string};
  CredentialHub: {lockId?: string} | undefined;
  RecipientPicker: {lockId?: string; credentialType: CredentialType};
  CompatibilityCheck: {lockId?: string; credentialType?: CredentialType} | undefined;
  AddPassword: {lockId?: string; recipientId?: string};
  FingerprintEnroll: {lockId?: string; recipientId?: string};
  FaceEnroll: {lockId?: string; recipientId?: string};
  CardManage: {lockId?: string; recipientId?: string};
  RemoteControl: {lockId?: string; recipientId?: string};
  PhoneAuthorization: {lockId?: string; recipientId?: string};
  DeviceSettings: {lockId?: string};
  MoreHub: {lockId?: string};
  Access: undefined;
  Activity: undefined;
  Settings: undefined;
  Pairing: undefined;
  WifiProvisioning: undefined;
  BleProvisioning: undefined;
  NfcKey: {lockId?: string; recipientId?: string} | undefined;
  QrScan: undefined;
  FirmwareOta: undefined;
  Notifications: undefined;
  Profile: undefined;
  Security: undefined;
};

export type AppRouteName = keyof AppRouteParams;

export type AppRoute<T extends AppRouteName = AppRouteName> = {
  name: T;
  params: AppRouteParams[T];
};

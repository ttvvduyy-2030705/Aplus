import type {OtpFlow} from '@/types/auth';
import type {CredentialType, PersonRole} from '@/types/credential';
import type {PasswordKind} from '@/types/password';

export type AuthRouteName = 'Login' | 'Register' | 'ForgotPassword' | 'OtpVerify' | 'ResetPassword';
export type MainTabRouteName = 'Home' | 'Access' | 'Activity' | 'MoreHub' | 'Profile';

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
  StaffTenant: undefined;
  SubAdmin: undefined;
  RoleMatrix: undefined;
  MemberDetail: {personId: string};
  InviteUser: {role?: PersonRole} | undefined;
  CompatibilityCheck: {lockId?: string; credentialType?: CredentialType} | undefined;
  PasswordManager: {lockId?: string} | undefined;
  AddPassword: {lockId?: string; recipientId?: string} | undefined;
  PasswordDetail: {passwordId: string};
  PasswordSchedule: {passwordId?: string; lockId?: string; draftKind?: PasswordKind} | undefined;
  RecordDetail: {recordId: string};
  BatteryPower: {lockId?: string} | undefined;
  Reports: undefined;
  ReportDrilldown: {lockId: string};
  ReportFilters: undefined;
  AlarmCenter: {lockId?: string} | undefined;
  AlertDetail: {alertId: string};
  TicketCreate: {alertId: string};
  NotificationPolicy: undefined;
  AppPinSecurity: undefined;
  TrustedDevices: undefined;
  BrandingSettings: undefined;
  RoomManagement: undefined;
  RoomDetail: {roomId: string};
  RoomEdit: {roomId?: string} | undefined;
  RoomImport: undefined;
  FingerprintEnroll: {lockId?: string; recipientId?: string};
  FaceEnroll: {lockId?: string; recipientId?: string};
  CardManage: {lockId?: string; recipientId?: string};
  RemoteControl: {lockId?: string; recipientId?: string};
  PhoneAuthorization: {lockId?: string; recipientId?: string};
  DeviceSettings: {lockId?: string};
  HardwareDetail: {lockId: string};
  FirmwareOta: {lockId?: string};
  DeviceDiagnostic: {lockId: string};
  MoreHub: {lockId?: string} | undefined;
  PmsHub: undefined;
  LockTransfer: {lockId?: string} | undefined;
  CombinationUnlock: {lockId?: string} | undefined;
  NormallyOpen: {lockId?: string} | undefined;
  OfflineSync: undefined;
  SupportCenter: {lockId?: string} | undefined;
  Access: undefined;
  Activity: undefined;
  Settings: undefined;
  Pairing: undefined;
  WifiProvisioning: undefined;
  BleProvisioning: undefined;
  NfcKey: {lockId?: string; recipientId?: string} | undefined;
  QrScan: undefined;
  Notifications: undefined;
  Profile: undefined;
  Security: undefined;
};

export type AppRouteName = keyof AppRouteParams;

export type AppRoute<T extends AppRouteName = AppRouteName> = {
  [RouteName in AppRouteName]: {
    name: RouteName;
    params: AppRouteParams[RouteName];
  }
}[T];

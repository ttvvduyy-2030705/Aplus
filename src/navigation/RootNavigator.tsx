import React, {useCallback, useEffect, useState} from 'react';
import {AplusBottomTab} from '@/components/navigation/AplusBottomTab';
import {CombinationUnlockScreen} from '@/features/accessRules/screens/CombinationUnlockScreen';
import {NormallyOpenScreen} from '@/features/accessRules/screens/NormallyOpenScreen';
import {AppPinSecurityScreen} from '@/features/account/screens/AppPinSecurityScreen';
import {BrandingSettingsScreen} from '@/features/account/screens/BrandingSettingsScreen';
import {ProfileScreen} from '@/features/account/screens/ProfileScreen';
import {TrustedDevicesScreen} from '@/features/account/screens/TrustedDevicesScreen';
import {AlarmCenterScreen} from '@/features/alarm/screens/AlarmCenterScreen';
import {AlertDetailScreen} from '@/features/alarm/screens/AlertDetailScreen';
import {NotificationPolicyScreen} from '@/features/alarm/screens/NotificationPolicyScreen';
import {TicketCreateScreen} from '@/features/alarm/screens/TicketCreateScreen';
import {ActivityScreen} from '@/features/activity/screens/ActivityScreen';
import {ForgotPasswordScreen} from '@/features/auth/screens/ForgotPasswordScreen';
import {LoginScreen} from '@/features/auth/screens/LoginScreen';
import {OtpVerifyScreen} from '@/features/auth/screens/OtpVerifyScreen';
import {RegisterScreen} from '@/features/auth/screens/RegisterScreen';
import {ResetPasswordScreen} from '@/features/auth/screens/ResetPasswordScreen';
import {CompatibilityCheckScreen} from '@/features/credential/screens/CompatibilityCheckScreen';
import {CredentialHubScreen} from '@/features/credential/screens/CredentialHubScreen';
import {RecipientPickerScreen} from '@/features/credential/screens/RecipientPickerScreen';
import {DeviceDiagnosticScreen} from '@/features/device/screens/DeviceDiagnosticScreen';
import {FaceEnrollScreen} from '@/features/face/screens/FaceEnrollScreen';
import {FingerprintEnrollScreen} from '@/features/fingerprint/screens/FingerprintEnrollScreen';
import {DeviceSettingsScreen} from '@/features/device/screens/DeviceSettingsScreen';
import {FirmwareOtaScreen} from '@/features/device/screens/FirmwareOtaScreen';
import {HardwareDetailScreen} from '@/features/device/screens/HardwareDetailScreen';
import {HomeScreen} from '@/features/home/screens/HomeScreen';
import {CommandLifecycleScreen} from '@/features/lock/screens/CommandLifecycleScreen';
import {LockDetailScreen} from '@/features/lock/screens/LockDetailScreen';
import {MoreHubScreen} from '@/features/more/screens/MoreHubScreen';
import {NfcKeyScreen} from '@/features/nfc/screens/NfcKeyScreen';
import {OfflineSyncScreen} from '@/features/offline/screens/OfflineSyncScreen';
import {RemoteUnlockScreen} from '@/features/lock/screens/RemoteUnlockScreen';
import {PairingEntryScreen} from '@/features/pairing/screens/PairingEntryScreen';
import {PmsHubScreen} from '@/features/pms/screens/PmsHubScreen';
import {CardManagementScreen} from '@/features/card/screens/CardManagementScreen';
import {CardIssuerScreen} from '@/features/cardIssuer/screens/CardIssuerScreen';
import {LockTransferScreen} from '@/features/transfer/screens/LockTransferScreen';
import {ReportDrilldownScreen} from '@/features/reports/screens/ReportDrilldownScreen';
import {ReportFiltersScreen} from '@/features/reports/screens/ReportFiltersScreen';
import {ReportsScreen} from '@/features/reports/screens/ReportsScreen';
import {BackendIntegrationScreen} from '@/features/backend/screens/BackendIntegrationScreen';
import {RealtimeMonitorScreen} from '@/features/realtime/screens/RealtimeMonitorScreen';
import {BatteryPowerScreen} from '@/features/records/screens/BatteryPowerScreen';
import {RecordDetailScreen} from '@/features/records/screens/RecordDetailScreen';
import {RoomDetailScreen} from '@/features/rooms/screens/RoomDetailScreen';
import {RoomEditScreen} from '@/features/rooms/screens/RoomEditScreen';
import {RoomImportScreen} from '@/features/rooms/screens/RoomImportScreen';
import {RoomManagementScreen} from '@/features/rooms/screens/RoomManagementScreen';
import {PhoneAuthorizationScreen} from '@/features/remote/screens/PhoneAuthorizationScreen';
import {RemoteControlScreen} from '@/features/remote/screens/RemoteControlScreen';
import {PasswordDetailScreen} from '@/features/password/screens/PasswordDetailScreen';
import {PasswordManagerScreen} from '@/features/password/screens/PasswordManagerScreen';
import {AddPasswordScreen} from '@/features/password/screens/AddPasswordScreen';
import {PasswordScheduleScreen} from '@/features/password/screens/PasswordScheduleScreen';
import {PlaceholderScreen} from '@/features/placeholder/PlaceholderScreen';
import {SupportCenterScreen} from '@/features/support/screens/SupportCenterScreen';
import {ReleaseReadinessScreen} from '@/features/qa/screens/ReleaseReadinessScreen';
import {InviteUserScreen} from '@/features/staff/screens/InviteUserScreen';
import {MemberDetailScreen} from '@/features/staff/screens/MemberDetailScreen';
import {RoleMatrixScreen} from '@/features/staff/screens/RoleMatrixScreen';
import {StaffTenantScreen} from '@/features/staff/screens/StaffTenantScreen';
import {SubAdminScreen} from '@/features/staff/screens/SubAdminScreen';
import {SplashScreen} from '@/features/splash/screens/SplashScreen';
import {useAppState} from '@/state/AppStateContext';
import type {MainTabRouteName} from './routes';
import {useAplusNavigation} from './NavigationContext';

const mainTabs: MainTabRouteName[] = ['Home', 'Access', 'Activity', 'MoreHub', 'Profile'];
const authRoutes = ['Login', 'Register', 'ForgotPassword', 'OtpVerify', 'ResetPassword'];

export function RootNavigator() {
  const navigation = useAplusNavigation();
  const {auth} = useAppState();
  const [activeTab, setActiveTab] = useState<MainTabRouteName>('Home');
  const route = navigation.currentRoute;

  useEffect(() => {
    if (route.name === 'Splash' && !auth.isBootstrapping) {
      const timer = setTimeout(() => {
        navigation.reset(auth.isAuthenticated ? 'Home' : 'Login');
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [auth.isAuthenticated, auth.isBootstrapping, navigation, route.name]);

  useEffect(() => {
    if (!auth.isBootstrapping && !auth.isAuthenticated && mainTabs.includes(route.name as MainTabRouteName)) {
      navigation.reset('Login');
    }
  }, [auth.isAuthenticated, auth.isBootstrapping, navigation, route.name]);

  useEffect(() => {
    if (mainTabs.includes(route.name as MainTabRouteName)) {
      setActiveTab(route.name as MainTabRouteName);
    }
  }, [route.name]);

  const setMainTab = useCallback((tab: MainTabRouteName) => {
    if (tab === activeTab && route.name === tab) {
      return;
    }
    setActiveTab(tab);
    navigation.reset(tab);
  }, [activeTab, navigation, route.name]);

  const isMainTab = mainTabs.includes(route.name as MainTabRouteName);

  const renderScreen = () => {
    switch (route.name) {
      case 'Splash':
        return <SplashScreen />;
      case 'Login':
        return <LoginScreen />;
      case 'Register':
        return <RegisterScreen />;
      case 'ForgotPassword':
        return <ForgotPasswordScreen />;
      case 'OtpVerify':
        return <OtpVerifyScreen flow={route.params.flow} account={route.params.account} />;
      case 'ResetPassword':
        return <ResetPasswordScreen account={route.params.account} />;
      case 'Home':
        return <HomeScreen />;
      case 'LockDetail':
        return <LockDetailScreen lockId={route.params.lockId} />;
      case 'RemoteUnlock':
        return <RemoteUnlockScreen lockId={route.params.lockId} />;
      case 'CommandLifecycle':
        return <CommandLifecycleScreen lockId={route.params.lockId} commandId={route.params.commandId} />;
      case 'CredentialHub':
        return <CredentialHubScreen lockId={route.params?.lockId} />;
      case 'RecipientPicker':
        return <RecipientPickerScreen lockId={route.params.lockId} credentialType={route.params.credentialType} />;
      case 'StaffTenant':
        return <StaffTenantScreen />;
      case 'SubAdmin':
        return <SubAdminScreen />;
      case 'RoleMatrix':
        return <RoleMatrixScreen />;
      case 'MemberDetail':
        return <MemberDetailScreen personId={route.params.personId} />;
      case 'InviteUser':
        return <InviteUserScreen role={route.params?.role} />;
      case 'CompatibilityCheck':
        return <CompatibilityCheckScreen lockId={route.params?.lockId} credentialType={route.params?.credentialType} />;
      case 'PasswordManager':
        return <PasswordManagerScreen lockId={route.params?.lockId} />;
      case 'AddPassword':
        return <AddPasswordScreen lockId={route.params?.lockId} recipientId={route.params?.recipientId} />;
      case 'PasswordDetail':
        return <PasswordDetailScreen passwordId={route.params.passwordId} />;
      case 'PasswordSchedule':
        return <PasswordScheduleScreen passwordId={route.params?.passwordId} lockId={route.params?.lockId} draftKind={route.params?.draftKind} />;
      case 'RecordDetail':
        return <RecordDetailScreen recordId={route.params.recordId} />;
      case 'BatteryPower':
        return <BatteryPowerScreen lockId={route.params?.lockId} />;
      case 'Reports':
        return <ReportsScreen />;
      case 'ReportDrilldown':
        return <ReportDrilldownScreen lockId={route.params.lockId} />;
      case 'ReportFilters':
        return <ReportFiltersScreen />;
      case 'AlarmCenter':
        return <AlarmCenterScreen />;
      case 'AlertDetail':
        return <AlertDetailScreen alertId={route.params.alertId} />;
      case 'TicketCreate':
        return <TicketCreateScreen alertId={route.params.alertId} />;
      case 'NotificationPolicy':
        return <NotificationPolicyScreen />;
      case 'AppPinSecurity':
        return <AppPinSecurityScreen />;
      case 'TrustedDevices':
        return <TrustedDevicesScreen />;
      case 'BrandingSettings':
        return <BrandingSettingsScreen />;
      case 'RoomManagement':
        return <RoomManagementScreen />;
      case 'RoomDetail':
        return <RoomDetailScreen roomId={route.params.roomId} />;
      case 'RoomEdit':
        return <RoomEditScreen roomId={route.params?.roomId} />;
      case 'RoomImport':
        return <RoomImportScreen />;
      case 'Access':
        return <CredentialHubScreen />;
      case 'Activity':
        return <ActivityScreen />;
      case 'Settings':
        return <BrandingSettingsScreen />;
      case 'Pairing':
        return <PairingEntryScreen />;
      case 'FingerprintEnroll':
        return <FingerprintEnrollScreen lockId={route.params?.lockId} recipientId={route.params?.recipientId} />;
      case 'FaceEnroll':
        return <FaceEnrollScreen lockId={route.params?.lockId} recipientId={route.params?.recipientId} />;
      case 'CardManage':
        return <CardManagementScreen lockId={route.params?.lockId} recipientId={route.params?.recipientId} />;
      case 'RemoteControl':
        return <RemoteControlScreen lockId={route.params?.lockId} recipientId={route.params?.recipientId} />;
      case 'PhoneAuthorization':
        return <PhoneAuthorizationScreen lockId={route.params?.lockId} recipientId={route.params?.recipientId} />;
      case 'DeviceSettings':
        return <DeviceSettingsScreen lockId={route.params?.lockId} />;
      case 'HardwareDetail':
        return <HardwareDetailScreen lockId={route.params.lockId} />;
      case 'FirmwareOta':
        return <FirmwareOtaScreen lockId={route.params?.lockId} />;
      case 'DeviceDiagnostic':
        return <DeviceDiagnosticScreen lockId={route.params.lockId} />;
      case 'MoreHub':
        return <MoreHubScreen lockId={route.params?.lockId} />;
      case 'PmsHub':
        return <PmsHubScreen />;
      case 'BackendIntegration':
        return <BackendIntegrationScreen />;
      case 'RealtimeMonitor':
        return <RealtimeMonitorScreen lockId={route.params?.lockId} />;
      case 'LockTransfer':
        return <LockTransferScreen lockId={route.params?.lockId} />;
      case 'CombinationUnlock':
        return <CombinationUnlockScreen lockId={route.params?.lockId} />;
      case 'NormallyOpen':
        return <NormallyOpenScreen lockId={route.params?.lockId} />;
      case 'OfflineSync':
        return <OfflineSyncScreen />;
      case 'CardIssuer':
        return <CardIssuerScreen />;
      case 'SupportCenter':
        return <SupportCenterScreen lockId={route.params?.lockId} />;
      case 'ReleaseReadiness':
        return <ReleaseReadinessScreen />;
      case 'WifiProvisioning':
        return <PlaceholderScreen title="Wi‑Fi Provisioning" description="Mock chọn mạng Wi‑Fi, nhập mật khẩu và gửi cấu hình xuống khoá." />;
      case 'BleProvisioning':
        return <PlaceholderScreen title="Bluetooth Pairing" description="Mock dò thiết bị BLE, chọn thiết bị và ghép nối an toàn." primaryAction="Cấu hình Wi‑Fi" targetRoute="WifiProvisioning" />;
      case 'NfcKey':
        return <NfcKeyScreen lockId={route.params?.lockId} recipientId={route.params?.recipientId} />;
      case 'QrScan':
        return <PlaceholderScreen title="QR Scan" description="Mock camera quét mã thiết bị, dùng adapter QR riêng cho Android/iOS." primaryAction="Bluetooth" targetRoute="BleProvisioning" />;
      case 'Notifications':
        return <PlaceholderScreen title="Thông báo" description="Mock quyền thông báo, push token và cảnh báo pin/cửa/mở khoá." />;
      case 'Profile':
        return <ProfileScreen asMainTab />;
      case 'Security':
        return <AppPinSecurityScreen />;
      default:
        return <PlaceholderScreen title="Aplus" description="Màn đang được chuẩn bị trong batch kế tiếp." />;
    }
  };

  const shouldShowTabs = isMainTab && auth.isAuthenticated && !authRoutes.includes(route.name);

  return (
    <>
      {renderScreen()}
      {shouldShowTabs ? <AplusBottomTab activeTab={activeTab} onChange={setMainTab} /> : null}
    </>
  );
}

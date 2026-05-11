import React, {useEffect, useState} from 'react';
import {AplusBottomTab} from '@/components/navigation/AplusBottomTab';
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
import {DeviceSettingsScreen} from '@/features/device/screens/DeviceSettingsScreen';
import {FirmwareOtaScreen} from '@/features/device/screens/FirmwareOtaScreen';
import {HardwareDetailScreen} from '@/features/device/screens/HardwareDetailScreen';
import {HomeScreen} from '@/features/home/screens/HomeScreen';
import {CommandLifecycleScreen} from '@/features/lock/screens/CommandLifecycleScreen';
import {LockDetailScreen} from '@/features/lock/screens/LockDetailScreen';
import {MoreHubScreen} from '@/features/more/screens/MoreHubScreen';
import {RemoteUnlockScreen} from '@/features/lock/screens/RemoteUnlockScreen';
import {PairingEntryScreen} from '@/features/pairing/screens/PairingEntryScreen';
import {ReportDrilldownScreen} from '@/features/reports/screens/ReportDrilldownScreen';
import {ReportFiltersScreen} from '@/features/reports/screens/ReportFiltersScreen';
import {ReportsScreen} from '@/features/reports/screens/ReportsScreen';
import {BatteryPowerScreen} from '@/features/records/screens/BatteryPowerScreen';
import {RecordDetailScreen} from '@/features/records/screens/RecordDetailScreen';
import {RoomDetailScreen} from '@/features/rooms/screens/RoomDetailScreen';
import {RoomEditScreen} from '@/features/rooms/screens/RoomEditScreen';
import {RoomImportScreen} from '@/features/rooms/screens/RoomImportScreen';
import {RoomManagementScreen} from '@/features/rooms/screens/RoomManagementScreen';
import {PasswordDetailScreen} from '@/features/password/screens/PasswordDetailScreen';
import {PasswordManagerScreen} from '@/features/password/screens/PasswordManagerScreen';
import {AddPasswordScreen} from '@/features/password/screens/AddPasswordScreen';
import {PasswordScheduleScreen} from '@/features/password/screens/PasswordScheduleScreen';
import {PlaceholderScreen} from '@/features/placeholder/PlaceholderScreen';
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

  const setMainTab = (tab: MainTabRouteName) => {
    setActiveTab(tab);
    navigation.reset(tab);
  };

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
        return <PlaceholderScreen title="Thêm vân tay" description="Batch 06 sẽ mô phỏng enrollment 3 lần quét và lưu templateId/reference, không lưu ảnh vân tay thô." primaryAction="Kiểm tra tương thích" targetRoute="CompatibilityCheck" />;
      case 'FaceEnroll':
        return <PlaceholderScreen title="Thêm khuôn mặt" description="Batch 07 sẽ kiểm tra camera/capability, scan front-left-right và lưu FaceTemplateRef mock." primaryAction="Kiểm tra tương thích" targetRoute="CompatibilityCheck" />;
      case 'CardManage':
        return <PlaceholderScreen title="Quản lý thẻ" description="Batch 08 sẽ làm thẻ thường, thẻ khách sạn và thẻ offline theo policy." primaryAction="Về Credential Hub" targetRoute="CredentialHub" />;
      case 'RemoteControl':
        return <PlaceholderScreen title="Thêm remote" description="Batch 09 sẽ pair remote vật lý bằng serial/model/battery và gán phạm vi sử dụng." />;
      case 'PhoneAuthorization':
        return <InviteUserScreen role="Guest" />;
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
        return <PlaceholderScreen title="PMS / Self check-in" description="Batch 21 sẽ làm booking calendar, check-in tạo quyền, check-out thu hồi, import và self check-in cho khách." primaryAction="Quản lý phòng" targetRoute="RoomManagement" />;
      case 'LockTransfer':
        return <PlaceholderScreen title="Chuyển quyền khóa" description="Batch 18 sẽ xác minh Owner bằng OTP/App PIN, người nhận accept trong thời hạn và ghi audit đầy đủ." primaryAction="More Hub" targetRoute="MoreHub" />;
      case 'CombinationUnlock':
        return <PlaceholderScreen title="Mở khóa kết hợp" description="Batch 19 sẽ làm PIN+card, Face+PIN, Card+fingerprint theo khóa/phòng/người/thời gian." primaryAction="Kiểm tra tương thích" targetRoute="CompatibilityCheck" />;
      case 'NormallyOpen':
        return <PlaceholderScreen title="Mở thường xuyên / lịch lớp" description="Batch 19 sẽ làm normally-open, lịch lớp/lịch ca, ngoại lệ ngày nghỉ và kiểm tra timezone." primaryAction="Cài đặt khóa" targetRoute="DeviceSettings" />;
      case 'OfflineSync':
        return <PlaceholderScreen title="Offline Sync Queue" description="Batch 25 sẽ hiển thị pending/success/fail jobs, retry/cancel và conflict resolution." primaryAction="Lịch sử" targetRoute="Activity" />;
      case 'SupportCenter':
        return <PlaceholderScreen title="Hỗ trợ kỹ thuật / bảo hành" description="Batch 28 sẽ làm support ticket, warranty info, maintenance task và diagnostic package đã redaction." primaryAction="Cài đặt khóa" targetRoute="DeviceSettings" />;
      case 'WifiProvisioning':
        return <PlaceholderScreen title="Wi‑Fi Provisioning" description="Mock chọn mạng Wi‑Fi, nhập mật khẩu và gửi cấu hình xuống khoá." />;
      case 'BleProvisioning':
        return <PlaceholderScreen title="Bluetooth Pairing" description="Mock dò thiết bị BLE, chọn thiết bị và ghép nối an toàn." primaryAction="Cấu hình Wi‑Fi" targetRoute="WifiProvisioning" />;
      case 'NfcKey':
        return <PlaceholderScreen title="NFC Key" description="Mock tạo và quản lý chìa khoá NFC cho người dùng được phân quyền." primaryAction="Kiểm tra tương thích" targetRoute="CompatibilityCheck" />;
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

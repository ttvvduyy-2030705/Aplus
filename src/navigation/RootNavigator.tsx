import React, {useEffect, useState} from 'react';
import {AplusBottomTab} from '@/components/navigation/AplusBottomTab';
import {ProfileScreen} from '@/features/account/screens/ProfileScreen';
import {ActivityScreen} from '@/features/activity/screens/ActivityScreen';
import {ForgotPasswordScreen} from '@/features/auth/screens/ForgotPasswordScreen';
import {LoginScreen} from '@/features/auth/screens/LoginScreen';
import {OtpVerifyScreen} from '@/features/auth/screens/OtpVerifyScreen';
import {RegisterScreen} from '@/features/auth/screens/RegisterScreen';
import {ResetPasswordScreen} from '@/features/auth/screens/ResetPasswordScreen';
import {CompatibilityCheckScreen} from '@/features/credential/screens/CompatibilityCheckScreen';
import {CredentialHubScreen} from '@/features/credential/screens/CredentialHubScreen';
import {RecipientPickerScreen} from '@/features/credential/screens/RecipientPickerScreen';
import {HomeScreen} from '@/features/home/screens/HomeScreen';
import {CommandLifecycleScreen} from '@/features/lock/screens/CommandLifecycleScreen';
import {LockDetailScreen} from '@/features/lock/screens/LockDetailScreen';
import {RemoteUnlockScreen} from '@/features/lock/screens/RemoteUnlockScreen';
import {PairingEntryScreen} from '@/features/pairing/screens/PairingEntryScreen';
import {PasswordDetailScreen} from '@/features/password/screens/PasswordDetailScreen';
import {PasswordManagerScreen} from '@/features/password/screens/PasswordManagerScreen';
import {AddPasswordScreen} from '@/features/password/screens/AddPasswordScreen';
import {PasswordScheduleScreen} from '@/features/password/screens/PasswordScheduleScreen';
import {PlaceholderScreen} from '@/features/placeholder/PlaceholderScreen';
import {SplashScreen} from '@/features/splash/screens/SplashScreen';
import {useAppState} from '@/state/AppStateContext';
import type {MainTabRouteName} from './routes';
import {useAplusNavigation} from './NavigationContext';

const mainTabs: MainTabRouteName[] = ['Home', 'Access', 'Activity', 'Settings'];
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
      case 'Access':
        return <CredentialHubScreen />;
      case 'Activity':
        return <ActivityScreen />;
      case 'Settings':
        return <PlaceholderScreen title="Cài đặt" description="Hồ sơ, bảo mật, thông báo, nhà/phòng và tuỳ chọn hệ thống." primaryAction="Hồ sơ / Đăng xuất" targetRoute="Profile" secondaryAction="Bảo mật" secondaryTargetRoute="Security" />;
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
        return <PlaceholderScreen title="Ủy quyền điện thoại" description="Batch 09 sẽ mời user bằng QR/link, trạng thái Pending/Accepted/Expired/Revoked." />;
      case 'DeviceSettings':
        return <PlaceholderScreen title="Cài đặt khóa" description="Batch 16 sẽ hoàn thiện auto-lock, remote unlock setting, OTA, diagnostic và hardware detail." />;
      case 'MoreHub':
        return <PlaceholderScreen title="More Hub" description="Batch 17 sẽ gom chức năng phụ: cảnh báo, báo cáo, PMS, chuyển quyền, NFC, normally-open và hỗ trợ kỹ thuật." />;
      case 'WifiProvisioning':
        return <PlaceholderScreen title="Wi‑Fi Provisioning" description="Mock chọn mạng Wi‑Fi, nhập mật khẩu và gửi cấu hình xuống khoá." />;
      case 'BleProvisioning':
        return <PlaceholderScreen title="Bluetooth Pairing" description="Mock dò thiết bị BLE, chọn thiết bị và ghép nối an toàn." primaryAction="Cấu hình Wi‑Fi" targetRoute="WifiProvisioning" />;
      case 'NfcKey':
        return <PlaceholderScreen title="NFC Key" description="Mock tạo và quản lý chìa khoá NFC cho người dùng được phân quyền." primaryAction="Kiểm tra tương thích" targetRoute="CompatibilityCheck" />;
      case 'QrScan':
        return <PlaceholderScreen title="QR Scan" description="Mock camera quét mã thiết bị, dùng adapter QR riêng cho Android/iOS." primaryAction="Bluetooth" targetRoute="BleProvisioning" />;
      case 'FirmwareOta':
        return <PlaceholderScreen title="Firmware / OTA" description="Mock kiểm tra firmware, tải gói cập nhật và trạng thái nâng cấp." />;
      case 'Notifications':
        return <PlaceholderScreen title="Thông báo" description="Mock quyền thông báo, push token và cảnh báo pin/cửa/mở khoá." />;
      case 'Profile':
        return <ProfileScreen />;
      case 'Security':
        return <PlaceholderScreen title="Bảo mật" description="Mock sinh trắc học, mã PIN app, phiên đăng nhập và thiết bị tin cậy." />;
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

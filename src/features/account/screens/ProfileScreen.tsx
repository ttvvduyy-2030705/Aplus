import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon, type AplusIconName} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {ConfirmDialog} from '@/components/base/ConfirmDialog';
import {StatusChip} from '@/components/base/StatusChip';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import type {AppRouteName} from '@/navigation/routes';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';

const languageLabel = {
  vi: 'Tiếng Việt',
  en: 'English',
};

type Props = {
  asMainTab?: boolean;
};

type MenuItemProps = {
  icon: AplusIconName;
  title: string;
  subtitle: string;
  badge?: string;
  target: AppRouteName;
};

export function ProfileScreen({asMainTab = false}: Props) {
  const navigation = useAplusNavigation();
  const {
    auth,
    appPinSettings,
    trustedDevices,
    brandingConfig,
    currentLanguage,
    accountSecurityLoading,
    reloadAccountSecurity,
    logoutMock,
  } = useAppState();
  const [confirmLogout, setConfirmLogout] = useState<'normal' | 'forget' | undefined>();

  useEffect(() => {
    reloadAccountSecurity();
  }, [reloadAccountSecurity]);

  const logout = async (forgetTrustedDevice: boolean) => {
    setConfirmLogout(undefined);
    await logoutMock(forgetTrustedDevice);
    navigation.reset('Login');
  };

  const trustedCount = trustedDevices.filter(device => device.trusted).length;
  const suspiciousCount = trustedDevices.filter(device => device.risk === 'suspicious').length;

  const menuItems: MenuItemProps[] = [
    {
      icon: 'pin',
      title: 'Bảo mật App PIN',
      subtitle: 'Bật/tắt PIN, đổi PIN, auto-lock và yêu cầu PIN cho thao tác nhạy cảm.',
      badge: appPinSettings?.enabled ? 'Đang bật' : 'Chưa bật',
      target: 'AppPinSecurity',
    },
    {
      icon: 'phone',
      title: 'Thiết bị tin cậy',
      subtitle: 'Quản lý thiết bị đăng nhập, biometric và revoke session khi nghi ngờ.',
      badge: suspiciousCount > 0 ? `${suspiciousCount} rủi ro` : `${trustedCount} tin cậy`,
      target: 'TrustedDevices',
    },
    {
      icon: 'settings',
      title: 'Ngôn ngữ & branding',
      subtitle: 'Việt/Anh, tên hệ thống, hotline, điều khoản và chính sách.',
      badge: languageLabel[currentLanguage],
      target: 'BrandingSettings',
    },
  ];

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Tôi" subtitle="Tài khoản, ngôn ngữ, bảo mật và branding" canGoBack={!asMainTab} onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <AplusIcon name="user" size={42} color={theme.colors.primary} boxed boxSize={72} />
          <View style={styles.titleText}>
            <AplusText variant="title">{auth.user?.name ?? 'Aplus User'}</AplusText>
            <AplusText variant="caption">{auth.user?.email ?? auth.user?.phone ?? 'Chưa có thông tin'}</AplusText>
          </View>
          <StatusChip label={auth.user?.role === 'owner' ? 'Owner' : 'User'} tone="success" />
        </View>

        <View style={styles.infoGrid}>
          <Info label="Hệ thống" value={brandingConfig?.systemName ?? 'Aplus Lock'} />
          <Info label="Ngôn ngữ" value={languageLabel[currentLanguage]} />
          <Info label="App PIN" value={appPinSettings?.enabled ? 'Bật cho thao tác nhạy cảm' : 'Đang tắt'} />
          <Info label="Thiết bị tin cậy" value={accountSecurityLoading ? 'Đang tải...' : `${trustedCount} thiết bị`} />
        </View>
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Thiết lập tài khoản</AplusText>
        <AplusText variant="caption">Batch 22 tách riêng tab Tôi khỏi More Hub để phần vận hành không bị lẫn với hồ sơ cá nhân.</AplusText>
        <View style={styles.menuList}>
          {menuItems.map(item => <MenuItem key={item.target} {...item} />)}
        </View>
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Phiên đăng nhập</AplusText>
        <AplusText variant="caption">Đăng xuất thường xoá active session. Đăng xuất và xoá thiết bị tin cậy sẽ tắt luôn biometric login mock.</AplusText>
        <AplusButton title="Đăng xuất" leftIcon="logout" variant="secondary" onPress={() => setConfirmLogout('normal')} />
        <AplusButton title="Đăng xuất & xoá thiết bị tin cậy" leftIcon="logout" variant="danger" onPress={() => setConfirmLogout('forget')} />
      </AplusCard>

      <ConfirmDialog
        visible={Boolean(confirmLogout)}
        title="Xác nhận đăng xuất"
        message={confirmLogout === 'forget' ? 'Phiên đăng nhập và thiết bị tin cậy sẽ bị xoá. Login sinh trắc học sẽ không còn hiển thị.' : 'Phiên đăng nhập sẽ bị xoá và quay về màn Login. Thiết bị tin cậy vẫn được giữ để test biometric.'}
        confirmText="Đăng xuất"
        cancelText="Huỷ"
        destructive
        onCancel={() => setConfirmLogout(undefined)}
        onConfirm={() => logout(confirmLogout === 'forget')}
      />
    </BaseScreen>
  );
}

function MenuItem({icon, title, subtitle, badge, target}: MenuItemProps) {
  const navigation = useAplusNavigation();
  return (
    <Pressable accessibilityRole="button" onPress={() => navigation.navigate(target, undefined as never)} style={styles.menuItem}>
      <AplusIcon name={icon} size={24} color={theme.colors.primary} boxed boxSize={48} />
      <View style={styles.menuText}>
        <View style={styles.menuTitleRow}>
          <AplusText variant="body" style={styles.bold}>{title}</AplusText>
          {badge ? <StatusChip label={badge} tone={badge.includes('rủi ro') ? 'danger' : 'info'} /> : null}
        </View>
        <AplusText variant="caption">{subtitle}</AplusText>
      </View>
      <AplusIcon name="chevron" size={18} color={theme.colors.textMuted} />
    </Pressable>
  );
}

function Info({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.infoItem}>
      <AplusText variant="caption" color={theme.colors.textSubtle}>{label}</AplusText>
      <AplusText variant="body">{value}</AplusText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xl,
  },
  card: {
    gap: theme.spacing.lg,
  },
  profileCard: {
    gap: theme.spacing.lg,
    borderColor: theme.colors.borderStrong,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  titleText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  infoGrid: {
    gap: theme.spacing.md,
  },
  infoItem: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  menuList: {
    gap: theme.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceStrong,
  },
  menuText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
});

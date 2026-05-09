import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusText} from '@/components/base/AplusText';
import {ConfirmDialog} from '@/components/base/ConfirmDialog';
import {StatusChip} from '@/components/base/StatusChip';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';

export function ProfileScreen() {
  const navigation = useAplusNavigation();
  const {auth, logoutMock} = useAppState();
  const [confirmLogout, setConfirmLogout] = useState<'normal' | 'forget' | undefined>();

  const logout = async (forgetTrustedDevice: boolean) => {
    setConfirmLogout(undefined);
    await logoutMock(forgetTrustedDevice);
    navigation.reset('Login');
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Hồ sơ" subtitle="Phiên đăng nhập & thiết bị tin cậy" canGoBack onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <AplusText variant="title">{auth.user?.name ?? 'Aplus User'}</AplusText>
            <AplusText variant="caption">{auth.user?.email ?? auth.user?.phone ?? 'Chưa có thông tin'}</AplusText>
          </View>
          <StatusChip label={auth.user?.role === 'owner' ? 'Owner' : 'User'} tone="success" />
        </View>

        <View style={styles.infoGrid}>
          <Info label="Session" value={auth.session ? 'Đang lưu an toàn' : 'Không có'} />
          <Info label="Thiết bị tin cậy" value={auth.trustedDevice ? 'Đã bật' : 'Chưa bật'} />
          <Info label="Biometric" value={auth.canUseBiometric ? 'Có thể dùng' : 'Chưa đủ điều kiện'} />
        </View>
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="title">Kiểm thử Batch 01</AplusText>
        <AplusText variant="caption">Đăng xuất thường sẽ xoá active session nhưng giữ thiết bị tin cậy để test nút đăng nhập sinh trắc học. Đăng xuất và xoá tin cậy sẽ xoá cả hai.</AplusText>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
});

import React from 'react';
import {StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {StatusChip} from '@/components/base/StatusChip';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';

export function PairingEntryScreen() {
  const navigation = useAplusNavigation();
  const {selectedLockFilter, addDemoLock, locksLoading} = useAppState();

  const createDemoLock = async () => {
    const lock = await addDemoLock(selectedLockFilter);
    if (lock) {
      navigation.reset('Home');
    }
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Thêm khóa" subtitle="Pairing mock cho Batch 02" canGoBack onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.heroCard}>
        <StatusChip label="Batch 12 sẽ làm pairing đầy đủ" tone="info" />
        <View style={styles.heroIcon}>
          <AplusIcon name="plus" size={38} color={theme.colors.primary} />
        </View>
        <AplusText variant="hero">Tạo khóa demo</AplusText>
        <AplusText variant="body" color={theme.colors.textMuted}>
          Batch 02 chỉ cần chứng minh khóa mới có thể xuất hiện ở Home và vào đúng Lock Detail theo lockId. Các bước QR/BLE/Wi‑Fi vẫn giữ route placeholder để sau này thay bằng wizard thật.
        </AplusText>
        <AplusButton title="Tạo khóa demo và về Home" leftIcon="plus" loading={locksLoading} onPress={createDemoLock} />
      </AplusCard>

      <AplusText variant="subtitle">Các phương thức thêm khóa đã có route</AplusText>
      <View style={styles.gridRow}>
        <AplusButton title="Quét QR" leftIcon="qr" variant="secondary" onPress={() => navigation.navigate('QrScan')} style={styles.gridButton} />
        <AplusButton title="Bluetooth" leftIcon="bluetooth" variant="secondary" onPress={() => navigation.navigate('BleProvisioning')} style={styles.gridButton} />
      </View>
      <View style={styles.gridRow}>
        <AplusButton title="Wi‑Fi" leftIcon="wifi" variant="ghost" onPress={() => navigation.navigate('WifiProvisioning')} style={styles.gridButton} />
        <AplusButton title="Gateway/MQTT" leftIcon="gateway" variant="ghost" onPress={() => navigation.navigate('Notifications')} style={styles.gridButton} />
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  heroCard: {
    gap: theme.spacing.lg,
    borderColor: theme.colors.borderStrong,
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  gridRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  gridButton: {
    flex: 1,
  },
});

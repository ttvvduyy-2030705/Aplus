import React, {useState} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {StatusChip} from '@/components/base/StatusChip';
import {AplusIcon} from '@/components/base/AplusIcon';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import {hasErrors, validateLogin, type AuthFieldErrors} from '../utils/authValidation';

export function LoginScreen() {
  const navigation = useAplusNavigation();
  const {auth, loginWithPassword, loginWithBiometric, clearAuthError} = useAppState();
  const [account, setAccount] = useState('admin@aplus.vn');
  const [password, setPassword] = useState('123456');
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  const submit = async () => {
    clearAuthError();
    const errors = validateLogin(account, password);
    setFieldErrors(errors);
    if (hasErrors(errors)) {
      return;
    }

    const result = await loginWithPassword(account, password);
    if (result.success) {
      navigation.reset('Home');
    }
  };

  const biometricLogin = async () => {
    clearAuthError();
    const result = await loginWithBiometric();
    if (result.success) {
      navigation.reset('Home');
    }
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <View style={styles.brandBlock}>
        <Image source={require('@/assets/images/aplus_logo_square.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.brandIconHalo}>
          <AplusIcon name="shield" size={28} color={theme.colors.primary} />
        </View>
        <AplusText variant="hero" align="center">Aplus</AplusText>
        <AplusText variant="body" align="center" color={theme.colors.textMuted}>Hệ thống quản lý khóa cửa thông minh cho nhà ở, căn hộ và vận hành lưu trú.</AplusText>
      </View>

      <AplusCard style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <AplusText variant="title">Đăng nhập</AplusText>
            <AplusText variant="caption">Tài khoản test: admin@aplus.vn / 123456</AplusText>
          </View>
          <StatusChip label="UI-00" tone="danger" />
        </View>

        {auth.error ? <AplusText variant="caption" color={theme.colors.danger}>{auth.error}</AplusText> : null}

        <AplusTextField
          label="Email / Số điện thoại"
          placeholder="admin@aplus.vn"
          value={account}
          onChangeText={(value) => {
            setAccount(value);
            setFieldErrors(prev => ({...prev, account: undefined}));
            clearAuthError();
          }}
          error={fieldErrors.account}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
          leftIcon="email"
        />
        <AplusTextField
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setFieldErrors(prev => ({...prev, password: undefined}));
            clearAuthError();
          }}
          error={fieldErrors.password}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={submit}
          leftIcon="password"
        />

        <AplusButton title="Đăng nhập" leftIcon="lock" loading={auth.loading} onPress={submit} />
        {auth.canUseBiometric ? (
          <AplusButton title="Đăng nhập bằng sinh trắc học" leftIcon="fingerprint" variant="secondary" loading={auth.loading} onPress={biometricLogin} />
        ) : null}

        <View style={styles.row}>
          <AplusButton title="Đăng ký" leftIcon="user" variant="ghost" onPress={() => navigation.navigate('Register')} style={styles.smallButton} />
          <AplusButton title="Quên mật khẩu" leftIcon="password" variant="ghost" onPress={() => navigation.navigate('ForgotPassword')} style={styles.smallButton} />
        </View>
      </AplusCard>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    gap: theme.spacing.xxl,
  },
  brandBlock: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#000',
  },
  brandIconHalo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
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
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  smallButton: {
    flex: 1,
  },
});

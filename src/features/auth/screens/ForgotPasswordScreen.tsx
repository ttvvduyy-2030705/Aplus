import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {StatusChip} from '@/components/base/StatusChip';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import {validateAccount} from '../utils/authValidation';

export function ForgotPasswordScreen() {
  const navigation = useAplusNavigation();
  const {auth, requestForgotOtp, clearAuthError} = useAppState();
  const [account, setAccount] = useState('');
  const [accountError, setAccountError] = useState<string | undefined>();

  const submit = async () => {
    clearAuthError();
    const error = validateAccount(account);
    setAccountError(error);
    if (error) {
      return;
    }

    const result = await requestForgotOtp(account);
    if (result.success) {
      navigation.navigate('OtpVerify', {flow: 'forgot', account: account.trim().toLowerCase()});
    }
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Quên mật khẩu" subtitle="UI-02 · khôi phục tài khoản" canGoBack onBack={navigation.goBack} showLogo />
      <AplusCard style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <AplusText variant="title">Nhận mã xác minh</AplusText>
            <AplusText variant="caption">Nhập email hoặc số điện thoại đã đăng ký. OTP mock mặc định là 123456.</AplusText>
          </View>
          <StatusChip label="OTP" tone="warning" />
        </View>

        {auth.error ? <AplusText variant="caption" color={theme.colors.danger}>{auth.error}</AplusText> : null}

        <AplusTextField
          leftIcon="email"
          label="Email / Số điện thoại"
          placeholder="admin@aplus.vn"
          value={account}
          onChangeText={(value) => {
            setAccount(value);
            setAccountError(undefined);
            clearAuthError();
          }}
          error={accountError}
          autoCapitalize="none"
          keyboardType="email-address"
          onSubmitEditing={submit}
        />
        <AplusButton title="Gửi mã OTP" leftIcon="otp" loading={auth.loading} onPress={submit} />
      </AplusCard>
    </BaseScreen>
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
});

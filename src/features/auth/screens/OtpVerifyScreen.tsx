import React, {useEffect, useMemo, useState} from 'react';
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
import type {OtpFlow} from '@/types/auth';
import {validateOtp} from '../utils/authValidation';

type Props = {
  flow: OtpFlow;
  account: string;
};

function formatRemaining(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.ceil(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function OtpVerifyScreen({flow, account}: Props) {
  const navigation = useAplusNavigation();
  const {auth, verifyOtpAndContinue, resendOtp, clearAuthError} = useAppState();
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | undefined>();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remainingMs = useMemo(() => (auth.activeOtp?.account === account ? auth.activeOtp.expiresAt - now : 0), [account, auth.activeOtp, now]);
  const isExpired = remainingMs <= 0;
  const title = flow === 'register' ? 'Xác minh đăng ký' : 'Xác minh khôi phục';
  const subtitle = flow === 'register' ? 'Hoàn tất tạo tài khoản' : 'Tiếp tục đặt lại mật khẩu';

  const submit = async () => {
    clearAuthError();
    const error = validateOtp(otp);
    setOtpError(error);
    if (error) {
      return;
    }

    const result = await verifyOtpAndContinue(flow, account, otp);
    if (!result.success) {
      return;
    }

    if (flow === 'register') {
      navigation.reset('Home');
    } else {
      navigation.navigate('ResetPassword', {account});
    }
  };

  const resend = async () => {
    setOtp('');
    setOtpError(undefined);
    clearAuthError();
    await resendOtp(flow, account);
    setNow(Date.now());
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={title} subtitle={subtitle} canGoBack onBack={navigation.goBack} showLogo />
      <AplusCard style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <AplusText variant="title">Nhập mã OTP</AplusText>
            <AplusText variant="caption">Mã mock đã gửi tới {account}. Dùng mã 123456 để test thành công.</AplusText>
          </View>
          <StatusChip label={isExpired ? 'Hết hạn' : formatRemaining(remainingMs)} tone={isExpired ? 'danger' : 'success'} />
        </View>

        {auth.error ? <AplusText variant="caption" color={theme.colors.danger}>{auth.error}</AplusText> : null}

        <AplusTextField
          leftIcon="otp"
          label="Mã OTP"
          placeholder="123456"
          value={otp}
          onChangeText={(value) => {
            setOtp(value.replace(/\D/g, '').slice(0, 6));
            setOtpError(undefined);
            clearAuthError();
          }}
          error={otpError}
          keyboardType="number-pad"
          maxLength={6}
          onSubmitEditing={submit}
        />

        <AplusButton title={flow === 'register' ? 'Xác minh & tạo tài khoản' : 'Xác minh & đặt lại mật khẩu'} leftIcon="shield" loading={auth.loading} onPress={submit} disabled={isExpired} />
        <AplusButton title="Gửi lại OTP mock" leftIcon="refresh" variant="ghost" loading={auth.loading} onPress={resend} />
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

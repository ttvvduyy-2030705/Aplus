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
import type {RegisterInput} from '@/types/auth';
import {hasErrors, validateRegister, type AuthFieldErrors} from '../utils/authValidation';

export function RegisterScreen() {
  const navigation = useAplusNavigation();
  const {auth, requestRegisterOtp, clearAuthError} = useAppState();
  const [form, setForm] = useState<RegisterInput>({
    name: '',
    account: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  const updateField = <K extends keyof RegisterInput>(key: K, value: RegisterInput[K]) => {
    setForm(prev => ({...prev, [key]: value}));
    setFieldErrors(prev => ({...prev, [key]: undefined}));
    clearAuthError();
  };

  const submit = async () => {
    clearAuthError();
    const errors = validateRegister(form);
    setFieldErrors(errors);
    if (hasErrors(errors)) {
      return;
    }

    const result = await requestRegisterOtp(form);
    if (result.success) {
      navigation.navigate('OtpVerify', {flow: 'register', account: form.account.trim().toLowerCase()});
    }
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Tạo tài khoản" subtitle="UI-01 · xác minh OTP mock" canGoBack onBack={navigation.goBack} showLogo />
      <AplusCard style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <AplusText variant="title">Đăng ký Aplus</AplusText>
            <AplusText variant="caption">Tạo tài khoản mock, xác minh bằng OTP 123456 rồi vào Home.</AplusText>
          </View>
          <StatusChip label="Batch 01" tone="info" />
        </View>

        {auth.error ? <AplusText variant="caption" color={theme.colors.danger}>{auth.error}</AplusText> : null}

        <AplusTextField leftIcon="user" label="Họ tên" placeholder="Ví dụ: Nguyễn Văn A" value={form.name} onChangeText={value => updateField('name', value)} error={fieldErrors.name} />
        <AplusTextField leftIcon="email" label="Email / Số điện thoại" placeholder="name@company.vn hoặc số điện thoại" value={form.account} onChangeText={value => updateField('account', value)} error={fieldErrors.account} autoCapitalize="none" keyboardType="email-address" />
        <AplusTextField leftIcon="phone" label="Số điện thoại dự phòng" placeholder="Tuỳ chọn nếu đăng ký bằng email" value={form.phone} onChangeText={value => updateField('phone', value)} keyboardType="phone-pad" />
        <AplusTextField leftIcon="password" label="Mật khẩu" placeholder="Ít nhất 6 ký tự" value={form.password} onChangeText={value => updateField('password', value)} error={fieldErrors.password} secureTextEntry />
        <AplusTextField leftIcon="password" label="Nhập lại mật khẩu" placeholder="Xác nhận mật khẩu" value={form.confirmPassword} onChangeText={value => updateField('confirmPassword', value)} error={fieldErrors.confirmPassword} secureTextEntry />

        <AplusButton title="Gửi OTP đăng ký" leftIcon="otp" loading={auth.loading} onPress={submit} />
        <AplusButton title="Tôi đã có tài khoản" leftIcon="back" variant="ghost" onPress={() => navigation.goBack()} />
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

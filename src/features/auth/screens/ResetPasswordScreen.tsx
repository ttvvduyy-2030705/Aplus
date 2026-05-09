import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {ConfirmDialog} from '@/components/base/ConfirmDialog';
import {StatusChip} from '@/components/base/StatusChip';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {ResetPasswordInput} from '@/types/auth';
import {hasErrors, validateResetPassword, type AuthFieldErrors} from '../utils/authValidation';

type Props = {
  account: string;
};

export function ResetPasswordScreen({account}: Props) {
  const navigation = useAplusNavigation();
  const {auth, resetPassword, clearAuthError} = useAppState();
  const [form, setForm] = useState<ResetPasswordInput>({account, password: '', confirmPassword: ''});
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [successVisible, setSuccessVisible] = useState(false);

  const updateField = <K extends keyof ResetPasswordInput>(key: K, value: ResetPasswordInput[K]) => {
    setForm(prev => ({...prev, [key]: value}));
    setFieldErrors(prev => ({...prev, [key]: undefined}));
    clearAuthError();
  };

  const submit = async () => {
    clearAuthError();
    const errors = validateResetPassword(form);
    setFieldErrors(errors);
    if (hasErrors(errors)) {
      return;
    }

    const result = await resetPassword(form);
    if (result.success) {
      setSuccessVisible(true);
    }
  };

  const goLogin = () => {
    setSuccessVisible(false);
    navigation.reset('Login');
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Đặt lại mật khẩu" subtitle="Mật khẩu mới cho tài khoản" canGoBack onBack={navigation.goBack} showLogo />
      <AplusCard style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <AplusText variant="title">Tạo mật khẩu mới</AplusText>
            <AplusText variant="caption">Tài khoản: {account}</AplusText>
          </View>
          <StatusChip label="UI-02" tone="info" />
        </View>

        {auth.error ? <AplusText variant="caption" color={theme.colors.danger}>{auth.error}</AplusText> : null}

        <AplusTextField leftIcon="password" label="Mật khẩu mới" placeholder="Ít nhất 6 ký tự" value={form.password} onChangeText={value => updateField('password', value)} error={fieldErrors.password} secureTextEntry />
        <AplusTextField leftIcon="password" label="Nhập lại mật khẩu" placeholder="Xác nhận mật khẩu mới" value={form.confirmPassword} onChangeText={value => updateField('confirmPassword', value)} error={fieldErrors.confirmPassword} secureTextEntry />
        <AplusButton title="Lưu mật khẩu mới" leftIcon="shield" loading={auth.loading} onPress={submit} />
      </AplusCard>

      <ConfirmDialog
        visible={successVisible}
        title="Đặt lại thành công"
        message="Mật khẩu đã được cập nhật. Hãy đăng nhập lại bằng mật khẩu mới."
        confirmText="Về đăng nhập"
        cancelText="Ở lại"
        onCancel={() => setSuccessVisible(false)}
        onConfirm={goLogin}
      />
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

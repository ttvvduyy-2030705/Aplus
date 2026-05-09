import type {RegisterInput, ResetPasswordInput} from '@/types/auth';

export type AuthFieldErrors = Record<string, string | undefined>;

export function validateAccount(account: string) {
  const trimmed = account.trim();
  if (!trimmed) {
    return 'Vui lòng nhập email hoặc số điện thoại.';
  }
  const looksLikeEmail = trimmed.includes('@');
  const phoneDigits = trimmed.replace(/\D/g, '');
  if (looksLikeEmail && !/^\S+@\S+\.\S+$/.test(trimmed)) {
    return 'Email không hợp lệ.';
  }
  if (!looksLikeEmail && phoneDigits.length < 9) {
    return 'Số điện thoại phải có ít nhất 9 chữ số.';
  }
  return undefined;
}

export function validatePassword(password: string) {
  if (!password) {
    return 'Vui lòng nhập mật khẩu.';
  }
  if (password.length < 6) {
    return 'Mật khẩu phải có ít nhất 6 ký tự.';
  }
  return undefined;
}

export function validateLogin(account: string, password: string): AuthFieldErrors {
  return {
    account: validateAccount(account),
    password: validatePassword(password),
  };
}

export function validateRegister(input: RegisterInput): AuthFieldErrors {
  return {
    name: input.name.trim().length < 2 ? 'Vui lòng nhập họ tên hợp lệ.' : undefined,
    account: validateAccount(input.account),
    password: validatePassword(input.password),
    confirmPassword: input.confirmPassword !== input.password ? 'Mật khẩu xác nhận chưa khớp.' : undefined,
  };
}

export function validateOtp(otp: string): string | undefined {
  const cleanOtp = otp.trim();
  if (!cleanOtp) {
    return 'Vui lòng nhập mã OTP.';
  }
  if (!/^\d{6}$/.test(cleanOtp)) {
    return 'OTP phải gồm 6 chữ số.';
  }
  return undefined;
}

export function validateResetPassword(input: ResetPasswordInput): AuthFieldErrors {
  return {
    password: validatePassword(input.password),
    confirmPassword: input.confirmPassword !== input.password ? 'Mật khẩu xác nhận chưa khớp.' : undefined,
  };
}

export function hasErrors(errors: AuthFieldErrors) {
  return Object.values(errors).some(Boolean);
}

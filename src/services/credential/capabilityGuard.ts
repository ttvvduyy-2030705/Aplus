import {credentialTypeOptions} from '@/services/credential/credentialCatalog';
import type {CapabilityCheckResult, CredentialType, CredentialTypeOption} from '@/types/credential';
import type {AplusLock} from '@/types/lock';

function permissionAllowed(lock: AplusLock | undefined, option: CredentialTypeOption) {
  if (!option.requiredPermission) {
    return true;
  }
  return lock?.permission?.[option.requiredPermission] ?? true;
}

function capabilitySupported(lock: AplusLock | undefined, option: CredentialTypeOption) {
  if (!option.requiredCapability) {
    return true;
  }
  return lock?.capabilities?.[option.requiredCapability] ?? true;
}

export function evaluateCredentialOption(lock: AplusLock | undefined, type: CredentialType): CapabilityCheckResult {
  const option = credentialTypeOptions.find(item => item.type === type) ?? credentialTypeOptions[0];
  const supported = capabilitySupported(lock, option);
  const allowed = permissionAllowed(lock, option);
  const enabled = supported && allowed;
  let message = 'Có thể tiếp tục cấp quyền cho loại credential này.';

  if (!supported) {
    message = 'Model khóa này chưa hỗ trợ loại quyền mở khóa đã chọn.';
  } else if (!allowed) {
    message = 'Tài khoản hiện tại chưa có quyền cấp credential cho khóa này.';
  }

  return {
    type,
    label: option.title,
    supported,
    permissionAllowed: allowed,
    enabled,
    message,
  };
}

export function buildCapabilityChecks(lock: AplusLock | undefined): CapabilityCheckResult[] {
  return credentialTypeOptions.map(option => evaluateCredentialOption(lock, option.type));
}

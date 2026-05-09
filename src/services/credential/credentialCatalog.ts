import type {CredentialTypeOption, PermissionMatrixEntry, PersonRole} from '@/types/credential';

export const credentialTypeOptions: CredentialTypeOption[] = [
  {
    type: 'password',
    title: 'Mã PIN / Mật khẩu',
    description: 'Tạo mã thường, mã tạm, một lần hoặc chu kỳ cho người được chọn.',
    icon: 'password',
    targetRoute: 'AddPassword',
    requiredPermission: 'canManageCredentials',
  },
  {
    type: 'fingerprint',
    title: 'Vân tay',
    description: 'Enrollment vân tay qua adapter phần cứng, chỉ lưu templateId/reference.',
    icon: 'fingerprint',
    targetRoute: 'FingerprintEnroll',
    requiredCapability: 'supportsFingerprint',
    requiredPermission: 'canManageCredentials',
  },
  {
    type: 'face',
    title: 'Khuôn mặt',
    description: 'Face unlock cho model có camera và hỗ trợ face credential.',
    icon: 'face',
    targetRoute: 'FaceEnroll',
    requiredCapability: 'supportsFace',
    requiredPermission: 'canManageCredentials',
    sensitive: true,
  },
  {
    type: 'card',
    title: 'Thẻ từ / thẻ khách sạn',
    description: 'Thẻ thường, thẻ khách sạn, thẻ offline và checkout revoke.',
    icon: 'card',
    targetRoute: 'CardManage',
    requiredCapability: 'supportsCard',
    requiredPermission: 'canManageCredentials',
  },
  {
    type: 'remote',
    title: 'Remote vật lý',
    description: 'Pair remote bằng serial/model/battery và phạm vi sử dụng.',
    icon: 'remote',
    targetRoute: 'RemoteControl',
    requiredCapability: 'supportsRemoteControl',
    requiredPermission: 'canManageCredentials',
  },
  {
    type: 'phone',
    title: 'Ủy quyền điện thoại',
    description: 'Mời user bằng QR/link, thời hạn và trạng thái lời mời.',
    icon: 'phone',
    targetRoute: 'PhoneAuthorization',
    requiredPermission: 'canManageCredentials',
  },
  {
    type: 'nfc',
    title: 'NFC / thẻ điện thoại',
    description: 'Mobile card qua NFC adapter, tách riêng với thẻ vật lý.',
    icon: 'key',
    targetRoute: 'NfcKey',
    requiredCapability: 'supportsNfc',
    requiredPermission: 'canManageCredentials',
    sensitive: true,
  },
  {
    type: 'admin',
    title: 'Quản trị phụ',
    description: 'Cấp role/phạm vi thao tác cho sub admin, staff, tenant.',
    icon: 'admin',
    targetRoute: 'MoreHub',
    requiredPermission: 'canManageCredentials',
    sensitive: true,
  },
];

const full = {
  unlock: true,
  remoteUnlock: true,
  addKey: true,
  records: true,
  rooms: true,
  staff: true,
  reports: true,
  settings: true,
};

export const permissionMatrix: PermissionMatrixEntry[] = [
  {role: 'Owner', label: 'Chủ sở hữu', permissions: full, canGrantRoles: ['SubAdmin', 'Staff', 'Tenant', 'Guest', 'Cleaner', 'Security']},
  {role: 'SubAdmin', label: 'Quản trị phụ', permissions: {...full, settings: false}, canGrantRoles: ['Staff', 'Tenant', 'Guest', 'Cleaner', 'Security']},
  {role: 'Staff', label: 'Nhân sự', permissions: {unlock: true, remoteUnlock: false, addKey: false, records: true, rooms: false, staff: false, reports: false, settings: false}, canGrantRoles: ['Guest']},
  {role: 'Tenant', label: 'Khách thuê', permissions: {unlock: true, remoteUnlock: true, addKey: false, records: false, rooms: false, staff: false, reports: false, settings: false}, canGrantRoles: []},
  {role: 'Guest', label: 'Khách', permissions: {unlock: true, remoteUnlock: false, addKey: false, records: false, rooms: false, staff: false, reports: false, settings: false}, canGrantRoles: []},
  {role: 'Cleaner', label: 'Dọn phòng', permissions: {unlock: true, remoteUnlock: false, addKey: false, records: false, rooms: false, staff: false, reports: false, settings: false}, canGrantRoles: []},
  {role: 'Security', label: 'Bảo vệ', permissions: {unlock: true, remoteUnlock: true, addKey: false, records: true, rooms: false, staff: false, reports: false, settings: false}, canGrantRoles: []},
];

export function getRoleLabel(role: PersonRole) {
  return permissionMatrix.find(item => item.role === role)?.label ?? role;
}

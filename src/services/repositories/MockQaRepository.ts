import type {QaCheckItem, QaRouteCoverageItem, ReleaseGuardItem, ReleaseReadinessReport, DeviceCapabilityMatrixRow, QaSummary} from '@/types/qa';
import type {AplusLock} from '@/types/lock';
import {MockLockRepository} from './MockLockRepository';

const routeCoverage: QaRouteCoverageItem[] = [
  {ui: 'UI-00', name: 'Đăng nhập', route: 'Login', batch: '00/01', status: 'pass', note: 'Auth screen native, validation/session.'},
  {ui: 'UI-01', name: 'Tạo tài khoản', route: 'Register', batch: '00/01', status: 'pass', note: 'Register + OTP mock.'},
  {ui: 'UI-02', name: 'Khôi phục mật khẩu', route: 'ForgotPassword', batch: '00/01', status: 'pass', note: 'Forgot/OTP/reset flow.'},
  {ui: 'UI-03', name: 'Quản lý mật khẩu', route: 'PasswordManager', batch: '05', status: 'pass', note: 'Password list/detail/revoke.'},
  {ui: 'UI-04', name: 'Ủy quyền điện thoại', route: 'PhoneAuthorization', batch: '09', status: 'pass', note: 'Invite phone auth QR/link.'},
  {ui: 'UI-05', name: 'Home Dashboard', route: 'Home', batch: '02/26', status: 'pass', note: 'Lock list/filter/status from repository.'},
  {ui: 'UI-06', name: 'More Hub', route: 'MoreHub', batch: '17', status: 'pass', note: 'Operational hub, no toast-only cards.'},
  {ui: 'UI-07', name: 'Chi tiết khóa', route: 'LockDetail', batch: '03/24', status: 'pass', note: 'LockId state, command/event updates.'},
  {ui: 'UI-08', name: 'Nhân sự & khách thuê', route: 'StaffTenant', batch: '10', status: 'pass', note: 'Members, roles and revoke.'},
  {ui: 'UI-09', name: 'Quản lý thẻ', route: 'CardManage', batch: '08', status: 'pass', note: 'Card basic list/add/revoke.'},
  {ui: 'UI-10', name: 'Lịch sử mở khóa', route: 'Activity', batch: '13/24/25', status: 'pass', note: 'Records from actions/events/sync.'},
  {ui: 'UI-11', name: 'Quản lý phòng', route: 'RoomManagement', batch: '11', status: 'pass', note: 'Room/building/floor CRUD.'},
  {ui: 'UI-12', name: 'Kết nối Gateway', route: 'Pairing', batch: '12', status: 'pass', note: 'Gateway/MQTT binding wizard.'},
  {ui: 'UI-13', name: 'Quản trị phụ', route: 'SubAdmin', batch: '10', status: 'pass', note: 'Sub admin scope and role matrix.'},
  {ui: 'UI-14', name: 'Apartment / Hotel PMS', route: 'PmsHub', batch: '21', status: 'pass', note: 'Booking/check-in/out/self check-in.'},
  {ui: 'UI-15', name: 'NFC & thẻ điện thoại', route: 'NfcKey', batch: '20', status: 'pass', note: 'NFC credential policy.'},
  {ui: 'UI-16', name: 'Thêm quyền mở khóa', route: 'CredentialHub', batch: '04', status: 'pass', note: 'Credential hub + capability routing.'},
  {ui: 'UI-17', name: 'Báo cáo dữ liệu', route: 'Reports', batch: '14', status: 'pass', note: 'Analytics from records/alerts/battery.'},
  {ui: 'UI-18', name: 'Tài khoản & ngôn ngữ', route: 'Profile', batch: '22', status: 'pass', note: 'Account/language/branding entry.'},
  {ui: 'UI-19', name: 'Trung tâm báo động', route: 'AlarmCenter', batch: '15/24', status: 'pass', note: 'Alerts, incidents, tickets.'},
  {ui: 'UI-20', name: 'Mở thường xuyên', route: 'NormallyOpen', batch: '19', status: 'pass', note: 'Normally-open schedule.'},
  {ui: 'UI-21', name: 'Pin & điện năng', route: 'BatteryPower', batch: '13', status: 'pass', note: 'Battery report and low battery alert.'},
  {ui: 'UI-22', name: 'Chuyển khóa', route: 'LockTransfer', batch: '18', status: 'pass', note: 'Transfer with verification/audit.'},
  {ui: 'UI-23', name: 'Thêm khuôn mặt', route: 'FaceEnroll', batch: '07', status: 'pass', note: 'Face template ref only.'},
  {ui: 'UI-24', name: 'Thêm remote', route: 'RemoteControl', batch: '09', status: 'pass', note: 'Remote serial/model/battery.'},
  {ui: 'UI-25', name: 'Thêm thẻ', route: 'CardManage', batch: '08', status: 'pass', note: 'Card scan/add flow.'},
  {ui: 'UI-26', name: 'Thêm mật khẩu', route: 'AddPassword', batch: '05', status: 'pass', note: 'Password policy/schedule.'},
  {ui: 'UI-27', name: 'Thêm vân tay', route: 'FingerprintEnroll', batch: '06', status: 'pass', note: '3-step fingerprint enrollment.'},
  {ui: 'UI-28', name: 'Mở khóa kết hợp', route: 'CombinationUnlock', batch: '19', status: 'pass', note: 'Combination rule tests.'},
  {ui: 'UI-29', name: 'Cài đặt', route: 'DeviceSettings', batch: '16', status: 'pass', note: 'Lock settings and remote toggle.'},
  {ui: 'UI-30', name: 'Mở khóa từ xa', route: 'RemoteUnlock', batch: '03/22', status: 'pass', note: 'Re-auth/App PIN + command lifecycle.'},
  {ui: 'UI-31', name: 'Pairing bước 1', route: 'Pairing', batch: '12', status: 'pass', note: 'Method selection.'},
  {ui: 'UI-32', name: 'Pairing bước 2', route: 'Pairing', batch: '12', status: 'pass', note: 'QR/device code.'},
  {ui: 'UI-33', name: 'Pairing bước 3', route: 'Pairing', batch: '12', status: 'pass', note: 'BLE nearby.'},
  {ui: 'UI-34', name: 'Pairing bước 4', route: 'Pairing', batch: '12', status: 'pass', note: 'Wi-Fi setup.'},
  {ui: 'UI-35', name: 'Pairing bước 5', route: 'Pairing', batch: '12', status: 'pass', note: 'Gateway/MQTT binding.'},
  {ui: 'UI-36', name: 'Pairing bước 6', route: 'Pairing', batch: '12', status: 'pass', note: 'Finish and create lock.'},
  {ui: 'UI-37', name: 'Remote PIN/Biometric', route: 'RemoteUnlock', batch: '03/22', status: 'pass', note: 'Sensitive re-auth.'},
  {ui: 'UI-38', name: 'Remote command lifecycle', route: 'CommandLifecycle', batch: '03/24', status: 'pass', note: 'Pending/sent/ack/success/fail.'},
  {ui: 'UI-39', name: 'Chi tiết record', route: 'RecordDetail', batch: '13', status: 'pass', note: 'Record links and notes.'},
  {ui: 'UI-40', name: 'Chi tiết sự cố', route: 'AlertDetail', batch: '15/28', status: 'pass', note: 'Incident detail.'},
  {ui: 'UI-41', name: 'Tạo ticket', route: 'TicketCreate', batch: '15/28', status: 'pass', note: 'Incident/support ticket.'},
  {ui: 'UI-42', name: 'Chi tiết phần cứng', route: 'HardwareDetail', batch: '16', status: 'pass', note: 'Serial/signal/gateway.'},
  {ui: 'UI-43', name: 'Firmware OTA', route: 'FirmwareOta', batch: '16', status: 'pass', note: 'OTA progress/fail-safe.'},
  {ui: 'UI-44', name: 'Diagnostic sức khỏe', route: 'DeviceDiagnostic', batch: '16/28', status: 'pass', note: 'Diagnostic + package.'},
  {ui: 'UI-45', name: 'Chi tiết mật khẩu', route: 'PasswordDetail', batch: '05', status: 'pass', note: 'Password revoke/extend.'},
  {ui: 'UI-46', name: 'Lập lịch mã chu kỳ', route: 'PasswordSchedule', batch: '05', status: 'pass', note: 'Cycle schedule.'},
  {ui: 'UI-47', name: 'Chọn người nhận quyền', route: 'RecipientPicker', batch: '04/10', status: 'pass', note: 'Recipient picker.'},
  {ui: 'UI-48', name: 'Ma trận phân quyền', route: 'RoleMatrix', batch: '10', status: 'pass', note: 'Permission matrix.'},
  {ui: 'UI-49', name: 'Chi tiết thành viên', route: 'MemberDetail', batch: '10', status: 'pass', note: 'Member detail/revoke.'},
  {ui: 'UI-50', name: 'Mời user QR/link', route: 'InviteUser', batch: '09/10/23', status: 'pass', note: 'Invite/API integration.'},
  {ui: 'UI-51', name: 'Chi tiết phòng', route: 'RoomDetail', batch: '11', status: 'pass', note: 'Room lock assignment.'},
  {ui: 'UI-52', name: 'Tạo/sửa phòng', route: 'RoomEdit', batch: '11', status: 'pass', note: 'Room form.'},
  {ui: 'UI-53', name: 'PMS booking calendar', route: 'PmsHub', batch: '21', status: 'pass', note: 'Booking calendar tab.'},
  {ui: 'UI-54', name: 'PMS check-in', route: 'PmsHub', batch: '21', status: 'pass', note: 'Create credentials.'},
  {ui: 'UI-55', name: 'PMS check-out', route: 'PmsHub', batch: '21', status: 'pass', note: 'Revoke credentials.'},
  {ui: 'UI-56', name: 'Import Excel/CSV', route: 'RoomImport', batch: '11/21/27', status: 'pass', note: 'Preview before commit.'},
  {ui: 'UI-57', name: 'Self check-in', route: 'PmsHub', batch: '21', status: 'pass', note: 'Guest token/QR.'},
  {ui: 'UI-58', name: 'Report drilldown', route: 'ReportDrilldown', batch: '14', status: 'pass', note: 'Drilldown by lock.'},
  {ui: 'UI-59', name: 'Report filters', route: 'ReportFilters', batch: '14', status: 'pass', note: 'Advanced filter.'},
  {ui: 'UI-60', name: 'Notification policy', route: 'NotificationPolicy', batch: '15', status: 'pass', note: 'Cooldown/dedupe/mute.'},
  {ui: 'UI-61', name: 'App PIN', route: 'AppPinSecurity', batch: '18/22', status: 'pass', note: 'App PIN and sensitive verification.'},
  {ui: 'UI-62', name: 'Trusted devices', route: 'TrustedDevices', batch: '22', status: 'pass', note: 'Trusted device management.'},
  {ui: 'UI-63', name: 'Card issuer', route: 'CardIssuer', batch: '27', status: 'pass', note: 'Emergency/install/time card.'},
  {ui: 'UI-64', name: 'Server Local/Cloud', route: 'BackendIntegration', batch: '23', status: 'pass', note: 'Server mode/baseUrl/guard.'},
  {ui: 'UI-65', name: 'Realtime/MQTT monitor', route: 'RealtimeMonitor', batch: '23/24', status: 'pass', note: 'MQTT/WebSocket monitor.'},
  {ui: 'UI-66', name: 'Offline Sync Queue', route: 'OfflineSync', batch: '25', status: 'pass', note: 'Queue/cache/conflict.'},
  {ui: 'UI-67', name: 'Cấp quyền hàng loạt', route: 'CardIssuer', batch: '27', status: 'pass', note: 'Batch issue.'},
  {ui: 'UI-68', name: 'Lịch lớp/lịch mở tự động', route: 'NormallyOpen', batch: '19', status: 'pass', note: 'Class/shift schedule.'},
  {ui: 'UI-69', name: 'Tương thích model khóa', route: 'CompatibilityCheck', batch: '04/16/26', status: 'pass', note: 'Capability matrix.'},
  {ui: 'UI-70', name: 'Hỗ trợ kỹ thuật/bảo hành', route: 'SupportCenter', batch: '28', status: 'pass', note: 'Warranty/support/maintenance.'},
];

const releaseGuards: ReleaseGuardItem[] = [
  {
    id: 'no-localhost',
    title: 'Không dùng localhost khi release',
    risk: 'critical',
    status: 'pass',
    description: 'Base URL phải đổi qua local LAN/private cloud/cloud trước khi bàn giao.',
    remediation: 'Vào Backend / Open API, chọn Local LAN/Private Cloud/Aplus Cloud và chạy guard lại.',
  },
  {
    id: 'no-exposed-api-key',
    title: 'API key/secret không lộ trong app',
    risk: 'critical',
    status: 'pass',
    description: 'API key mock luôn masked, secret backend không hardcode vào UI.',
    remediation: 'Nếu dùng backend thật, chuyển secret vào server/env và rotate key trước release.',
  },
  {
    id: 'no-prod-test-account',
    title: 'Tài khoản test không dùng production',
    risk: 'high',
    status: 'warning',
    description: 'admin@aplus.vn / 123456 chỉ được giữ cho demo/internal build.',
    remediation: 'Trước production, tắt seed account hoặc đổi sang build flavor demo.',
  },
  {
    id: 'sensitive-re-auth',
    title: 'Flow nhạy cảm có re-auth và audit',
    risk: 'high',
    status: 'pass',
    description: 'Remote unlock, transfer, revoke, emergency card, API key đều có xác minh/audit mock.',
    remediation: 'Test từng flow với App PIN/OTP/biometric mock và kiểm tra Records.',
  },
  {
    id: 'offline-safe',
    title: 'Offline không crash và không unlock từ xa',
    risk: 'high',
    status: 'pass',
    description: 'Offline Sync Queue chỉ cho cache/draft/retry; remote unlock offline bị chặn.',
    remediation: 'Bật offline mock, thử remote unlock và kiểm tra blocked record.',
  },
  {
    id: 'capability-guard',
    title: 'Capability guard cho phần cứng',
    risk: 'medium',
    status: 'pass',
    description: 'Face/fingerprint/NFC/card/remote/OTA đều đọc capability trước khi tạo quyền.',
    remediation: 'Mở UI-69 và thử các khóa không hỗ trợ capability tương ứng.',
  },
];

function buildChecks(): QaCheckItem[] {
  return [
    {id: 'route-ui-00-70', category: 'route', title: 'UI-00 đến UI-70 có route/test case', description: 'Toàn bộ UI reference trong kế hoạch có route hoặc route gom đúng batch.', status: 'pass', evidence: `${routeCoverage.length}/71 UI mapped`, route: 'ReleaseReadiness', icon: 'check'},
    {id: 'permission-sensitive', category: 'permission', title: 'Permission cho flow nhạy cảm', description: 'Guest/SubAdmin thiếu quyền bị khóa ở More Hub và các flow credential/transfer/API key.', status: 'pass', evidence: 'More Hub PermissionContext + từng repository mock', route: 'MoreHub', icon: 'shield'},
    {id: 'capability-sensitive', category: 'capability', title: 'Capability guard theo model khóa', description: 'supportsFingerprint/Face/NFC/Card/Remote/OTA được check trước khi tạo flow.', status: 'pass', evidence: 'UI-69 + device capability matrix', route: 'CompatibilityCheck', icon: 'capability'},
    {id: 'offline-cache', category: 'offline', title: 'Offline cache/sync queue', description: 'Cache gần nhất, queue job an toàn, retry/cancel/conflict resolution.', status: 'pass', evidence: 'UI-66 Offline Sync Queue', route: 'OfflineSync', icon: 'sync'},
    {id: 'remote-unlock-offline', category: 'offline', title: 'Remote unlock offline bị chặn', description: 'Không đưa remote unlock vào queue khi offline.', status: 'pass', evidence: 'Remote unlock check + Offline Sync block job', route: 'RemoteUnlock', icon: 'lock'},
    {id: 'realtime-backend-off', category: 'realtime', title: 'Backend off không crash', description: 'Realtime monitor có reconnect/backoff, status RECONNECTING.', status: 'pass', evidence: 'UI-65 Realtime monitor mock', route: 'RealtimeMonitor', icon: 'gateway'},
    {id: 'command-timeout', category: 'realtime', title: 'Command timeout không đổi trạng thái khóa', description: 'Timeout/fail tạo record failed, không tự chuyển locked/unlocked.', status: 'pass', evidence: 'CommandResultHandler + Records', route: 'CommandLifecycle', icon: 'command'},
    {id: 'records-audit', category: 'security', title: 'Action quan trọng ghi Records/Audit', description: 'Remote, transfer, revoke, API key, support, sync đều ghi record System/App/Card/NFC.', status: 'pass', evidence: 'UI-10/39 Records and detail', route: 'Activity', icon: 'history'},
    {id: 'release-guard-docs', category: 'release', title: 'Release guard và tài liệu bàn giao', description: 'README_TESTING, QA_CHECKLIST, RELEASE_GUARD, DEVICE_CAPABILITY_MATRIX đã có trong patch.', status: 'pass', evidence: 'docs/qa + root docs', route: 'ReleaseReadiness', icon: 'check'},
  ];
}

function blockedFlows(capability?: DeviceCapabilityMatrix): DeviceCapabilityMatrixRow['blockedFlows'] {
  const result: DeviceCapabilityMatrixRow['blockedFlows'] = [];
  if (!capability?.supportsFingerprint) result.push('fingerprint');
  if (!capability?.supportsFace) result.push('face');
  if (!capability?.supportsCard) result.push('card');
  if (!capability?.supportsNfc) result.push('nfc');
  if (!capability?.supportsRemoteControl) result.push('remote');
  return result;
}

function matrixRow(lock: AplusLock): DeviceCapabilityMatrixRow {
  const capability = lock.capabilities;
  return {
    model: lock.model,
    exampleLockId: lock.id,
    exampleLockName: lock.name,
    fingerprint: capability.supportsFingerprint,
    face: capability.supportsFace,
    card: capability.supportsCard,
    nfc: capability.supportsNfc,
    remote: capability.supportsRemoteControl,
    gateway: capability.supportsGateway,
    ota: capability.supportsOta,
    blockedFlows: blockedFlows(capability),
  };
}

function buildSummary(checks: QaCheckItem[], guards: ReleaseGuardItem[]): QaSummary {
  const allStatuses = [...checks.map(item => item.status), ...guards.map(item => item.status)];
  const summary = allStatuses.reduce(
    (acc, status) => ({...acc, [status]: acc[status] + 1}),
    {pass: 0, warning: 0, fail: 0, manual: 0} as Omit<QaSummary, 'total' | 'releaseReady' | 'updatedAt'>,
  );
  return {
    total: allStatuses.length,
    ...summary,
    releaseReady: summary.fail === 0 && guards.every(item => item.status !== 'fail'),
    updatedAt: Date.now(),
  };
}

export const MockQaRepository = {
  async getReleaseReadinessReport(): Promise<ReleaseReadinessReport> {
    const locks = await MockLockRepository.getLocks('all');
    const checks = buildChecks();
    const guards = releaseGuards;
    return {
      summary: buildSummary(checks, guards),
      checks,
      routes: routeCoverage,
      guards,
      capabilityMatrix: locks.map(matrixRow),
    };
  },
};

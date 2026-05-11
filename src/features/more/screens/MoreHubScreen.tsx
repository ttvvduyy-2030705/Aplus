import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {StatusChip} from '@/components/base/StatusChip';
import {OfflineBanner} from '@/components/feedback/OfflineBanner';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {MockCredentialRepository} from '@/services/repositories/MockCredentialRepository';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {AppRouteName} from '@/navigation/routes';
import type {MoreAction, MoreActionGroup, MorePermissionKey, PermissionContext} from '@/types/more';
import type {StaffSummary} from '@/types/credential';

type RuntimeAction = MoreAction & {
  onPress: () => void;
};

type RuntimeGroup = Omit<MoreActionGroup, 'actions'> & {
  actions: RuntimeAction[];
};

const permissionLabels: Record<MorePermissionKey, string> = {
  alerts: 'xem cảnh báo',
  reports: 'xem báo cáo',
  staff: 'quản lý nhân sự',
  rooms: 'quản lý phòng',
  settings: 'cài đặt hệ thống',
  security: 'bảo mật tài khoản',
  transfer: 'chuyển quyền khóa',
  nfc: 'cấp NFC',
  hotel: 'vận hành khách sạn',
  support: 'hỗ trợ kỹ thuật',
};

function buildPermissionContext(userRole: PermissionContext['userRole'], isOffline: boolean): PermissionContext {
  const isGuest = userRole === 'guest';
  const canOperate = !isGuest;
  return {
    userRole,
    scopeLabel: userRole === 'owner' ? 'Owner · toàn hệ thống' : userRole === 'admin' ? 'Admin phụ · theo phạm vi' : 'Guest · chỉ xem quyền được cấp',
    isOffline,
    permissions: {
      alerts: canOperate,
      reports: canOperate,
      staff: userRole === 'owner' || userRole === 'admin',
      rooms: canOperate,
      settings: canOperate,
      security: canOperate,
      transfer: userRole === 'owner',
      nfc: canOperate,
      hotel: canOperate,
      support: canOperate,
    },
  };
}

function statusTone(status: MoreAction['status']): 'success' | 'warning' | 'info' | 'muted' | 'danger' {
  if (status === 'ready') {
    return 'success';
  }
  if (status === 'mock') {
    return 'info';
  }
  if (status === 'locked') {
    return 'danger';
  }
  return 'warning';
}

function statusLabel(status: MoreAction['status']) {
  if (status === 'ready') {
    return 'Sẵn sàng';
  }
  if (status === 'mock') {
    return 'Mock';
  }
  if (status === 'locked') {
    return 'Khóa quyền';
  }
  return 'Batch sau';
}

function ActionCard({action}: {action: RuntimeAction}) {
  const disabled = action.status === 'locked';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={action.onPress}
      style={({pressed}) => [
        styles.actionCard,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.actionCardDisabled : null,
      ]}>
      <View style={styles.actionHeader}>
        <AplusIcon name={action.icon} size={24} color={disabled ? theme.colors.textMuted : theme.colors.primary} boxed />
        <View style={styles.actionTitleBlock}>
          <AplusText variant="body" style={styles.bold}>{action.title}</AplusText>
          <AplusText variant="caption" numberOfLines={2}>{action.subtitle}</AplusText>
        </View>
        <AplusIcon name="chevron" size={18} color={disabled ? theme.colors.textSubtle : theme.colors.textMuted} />
      </View>
      <View style={styles.actionFooter}>
        <StatusChip label={disabled ? 'Khóa quyền' : statusLabel(action.status)} tone={statusTone(disabled ? 'locked' : action.status)} />
        {action.badge ? <StatusChip label={action.badge} tone={action.badge.includes('!') || action.badge.includes('offline') ? 'danger' : 'info'} /> : null}
      </View>
      {disabled && action.disabledReason ? <AplusText variant="caption" color={theme.colors.warning}>{action.disabledReason}</AplusText> : null}
    </Pressable>
  );
}

function GroupSection({group}: {group: RuntimeGroup}) {
  return (
    <View style={styles.groupSection}>
      <View style={styles.groupTitleRow}>
        <View>
          <AplusText variant="subtitle">{group.title}</AplusText>
          <AplusText variant="caption">{group.subtitle}</AplusText>
        </View>
      </View>
      <View style={styles.actionGrid}>
        {group.actions.map(action => <ActionCard key={action.id} action={action} />)}
      </View>
    </View>
  );
}

export function MoreHubScreen({lockId}: {lockId?: string}) {
  const navigation = useAplusNavigation();
  const {
    auth,
    locks,
    dashboardSummary,
    alertSummary,
    roomSummary,
    analyticsSummary,
    isOffline,
    reloadAlerts,
    reloadRooms,
    reloadAnalytics,
    reloadLocks,
  } = useAppState();
  const [staffSummary, setStaffSummary] = useState<StaffSummary | undefined>();

  const selectedLock = useMemo(() => locks.find(lock => lock.id === lockId) ?? locks[0], [lockId, locks]);
  const userRole = auth.user?.role ?? 'guest';
  const permissionContext = useMemo(() => buildPermissionContext(userRole, isOffline), [isOffline, userRole]);

  useEffect(() => {
    reloadLocks();
    reloadAlerts();
    reloadRooms();
    reloadAnalytics();
    MockCredentialRepository.getStaffSummary().then(setStaffSummary);
  }, [reloadAlerts, reloadAnalytics, reloadLocks, reloadRooms]);

  const go = (route: AppRouteName) => {
    switch (route) {
      case 'AlarmCenter':
        navigation.navigate('AlarmCenter', undefined);
        break;
      case 'NotificationPolicy':
        navigation.navigate('NotificationPolicy');
        break;
      case 'Reports':
        navigation.navigate('Reports');
        break;
      case 'RoomManagement':
        navigation.navigate('RoomManagement');
        break;
      case 'RoomImport':
        navigation.navigate('RoomImport');
        break;
      case 'StaffTenant':
        navigation.navigate('StaffTenant');
        break;
      case 'SubAdmin':
        navigation.navigate('SubAdmin');
        break;
      case 'RoleMatrix':
        navigation.navigate('RoleMatrix');
        break;
      case 'InviteUser':
        navigation.navigate('InviteUser', undefined);
        break;
      case 'CredentialHub':
        navigation.navigate('CredentialHub', selectedLock ? {lockId: selectedLock.id} : undefined);
        break;
      case 'BatteryPower':
        navigation.navigate('BatteryPower', selectedLock ? {lockId: selectedLock.id} : undefined);
        break;
      case 'DeviceSettings':
        navigation.navigate('DeviceSettings', selectedLock ? {lockId: selectedLock.id} : undefined);
        break;
      case 'HardwareDetail':
        selectedLock ? navigation.navigate('HardwareDetail', {lockId: selectedLock.id}) : navigation.navigate('DeviceSettings', undefined);
        break;
      case 'FirmwareOta':
        navigation.navigate('FirmwareOta', selectedLock ? {lockId: selectedLock.id} : undefined);
        break;
      case 'DeviceDiagnostic':
        selectedLock ? navigation.navigate('DeviceDiagnostic', {lockId: selectedLock.id}) : navigation.navigate('DeviceSettings', undefined);
        break;
      case 'CompatibilityCheck':
        navigation.navigate('CompatibilityCheck', selectedLock ? {lockId: selectedLock.id} : undefined);
        break;
      case 'Pairing':
        navigation.navigate('Pairing');
        break;
      case 'NfcKey':
        navigation.navigate('NfcKey', selectedLock ? {lockId: selectedLock.id} : undefined);
        break;
      case 'Settings':
        navigation.navigate('Settings');
        break;
      case 'Security':
        navigation.navigate('Security');
        break;
      case 'Profile':
        navigation.navigate('Profile');
        break;
      case 'PmsHub':
        navigation.navigate('PmsHub');
        break;
      case 'LockTransfer':
        navigation.navigate('LockTransfer', selectedLock ? {lockId: selectedLock.id} : undefined);
        break;
      case 'CombinationUnlock':
        navigation.navigate('CombinationUnlock', selectedLock ? {lockId: selectedLock.id} : undefined);
        break;
      case 'NormallyOpen':
        navigation.navigate('NormallyOpen', selectedLock ? {lockId: selectedLock.id} : undefined);
        break;
      case 'SupportCenter':
        navigation.navigate('SupportCenter', selectedLock ? {lockId: selectedLock.id} : undefined);
        break;
      case 'OfflineSync':
        navigation.navigate('OfflineSync');
        break;
      default:
        navigation.navigate(route);
    }
  };

  const makeAction = (action: MoreAction): RuntimeAction => {
    const allowed = action.requiredPermission ? permissionContext.permissions[action.requiredPermission] : true;
    return {
      ...action,
      status: allowed ? action.status : 'locked',
      disabledReason: allowed ? action.disabledReason : `Tài khoản cần quyền ${permissionLabels[action.requiredPermission ?? 'settings']}.`,
      onPress: () => go(action.targetRoute),
    };
  };

  const groups: RuntimeGroup[] = [
    {
      id: 'safety',
      title: 'An toàn & cảnh báo',
      subtitle: 'Cảnh báo, pin, pending sync và chính sách push.',
      actions: [
        makeAction({id: 'alerts', groupId: 'safety', title: 'Trung tâm báo động', subtitle: 'UI-19 · incident, alert và ticket xử lý', icon: 'alert', targetRoute: 'AlarmCenter', status: 'ready', requiredPermission: 'alerts', badge: alertSummary.unread ? `${alertSummary.unread}! chưa đọc` : '0 unread'}),
        makeAction({id: 'battery', groupId: 'safety', title: 'Pin & điện năng', subtitle: 'UI-21 · threshold, trend pin và lock cần bảo trì', icon: 'battery', targetRoute: 'BatteryPower', status: 'ready', requiredPermission: 'alerts', badge: dashboardSummary.lowBatteryLocks ? `${dashboardSummary.lowBatteryLocks}! pin yếu` : 'Pin ổn'}),
        makeAction({id: 'notification-policy', groupId: 'safety', title: 'Push policy', subtitle: 'UI-60 · cooldown, dedupe và mute alert type', icon: 'bell', targetRoute: 'NotificationPolicy', status: 'ready', requiredPermission: 'settings'}),
        makeAction({id: 'offline-sync', groupId: 'safety', title: 'Offline Sync Queue', subtitle: 'UI-66 · queue pending, retry và conflict mock', icon: 'sync', targetRoute: 'OfflineSync', status: 'future', requiredPermission: 'settings', badge: isOffline ? 'offline' : dashboardSummary.pendingSyncLocks ? `${dashboardSummary.pendingSyncLocks} pending` : undefined}),
      ],
    },
    {
      id: 'access',
      title: 'Quyền truy cập',
      subtitle: 'Credential, nhân sự, khách thuê và role matrix.',
      actions: [
        makeAction({id: 'credential-hub', groupId: 'access', title: 'Thêm quyền mở khóa', subtitle: 'UI-16 · password, card, remote, NFC, admin', icon: 'credential', targetRoute: 'CredentialHub', status: 'ready', requiredPermission: 'staff', badge: selectedLock?.name}),
        makeAction({id: 'staff-tenant', groupId: 'access', title: 'Nhân sự & khách thuê', subtitle: 'UI-08 · member list, tenant, staff, guest', icon: 'user', targetRoute: 'StaffTenant', status: 'ready', requiredPermission: 'staff', badge: staffSummary ? `${staffSummary.total} người` : undefined}),
        makeAction({id: 'sub-admin', groupId: 'access', title: 'Quản trị phụ', subtitle: 'UI-13 · SubAdmin theo phạm vi nhà/phòng/khóa', icon: 'admin', targetRoute: 'SubAdmin', status: 'ready', requiredPermission: 'staff', badge: staffSummary ? `${staffSummary.subAdmins} admin` : undefined}),
        makeAction({id: 'role-matrix', groupId: 'access', title: 'Ma trận phân quyền', subtitle: 'UI-48 · unlock, add key, records, rooms, staff', icon: 'matrix', targetRoute: 'RoleMatrix', status: 'ready', requiredPermission: 'staff'}),
        makeAction({id: 'invite-user', groupId: 'access', title: 'Mời user QR/link', subtitle: 'UI-50 · pending, accepted, expired, revoked', icon: 'qr', targetRoute: 'InviteUser', status: 'ready', requiredPermission: 'staff', badge: staffSummary?.pendingInvites ? `${staffSummary.pendingInvites} pending` : undefined}),
        makeAction({id: 'transfer', groupId: 'access', title: 'Chuyển quyền khóa', subtitle: 'UI-22/61 · OTP/App PIN, accept, audit', icon: 'shield', targetRoute: 'LockTransfer', status: 'future', requiredPermission: 'transfer'}),
      ],
    },
    {
      id: 'device',
      title: 'Thiết bị',
      subtitle: 'Pairing, cài đặt khóa, OTA, diagnostic và capability.',
      actions: [
        makeAction({id: 'pairing', groupId: 'device', title: 'Thêm khóa/gateway', subtitle: 'UI-31 → UI-36 · Pairing Wizard 6 bước', icon: 'plus', targetRoute: 'Pairing', status: 'ready', requiredPermission: 'settings'}),
        makeAction({id: 'device-settings', groupId: 'device', title: 'Cài đặt khóa', subtitle: 'UI-29 · auto-lock, âm thanh, remote unlock', icon: 'settings', targetRoute: 'DeviceSettings', status: 'ready', requiredPermission: 'settings', badge: selectedLock?.roomName}),
        makeAction({id: 'hardware', groupId: 'device', title: 'Phần cứng/kết nối', subtitle: 'UI-42 · serial, gateway, signal, lastSeen', icon: 'gateway', targetRoute: 'HardwareDetail', status: 'ready', requiredPermission: 'settings'}),
        makeAction({id: 'ota', groupId: 'device', title: 'Firmware OTA', subtitle: 'UI-43 · check update, progress, reboot, fail-safe', icon: 'firmware', targetRoute: 'FirmwareOta', status: 'ready', requiredPermission: 'settings'}),
        makeAction({id: 'diagnostic', groupId: 'device', title: 'Diagnostic sức khỏe', subtitle: 'UI-44 · health score, error code, package', icon: 'capability', targetRoute: 'DeviceDiagnostic', status: 'ready', requiredPermission: 'settings'}),
        makeAction({id: 'compatibility', groupId: 'device', title: 'Tương thích model', subtitle: 'UI-69 · chặn flow không hỗ trợ capability', icon: 'shield', targetRoute: 'CompatibilityCheck', status: 'ready', requiredPermission: 'settings'}),
      ],
    },
    {
      id: 'hotel',
      title: 'Khách sạn / căn hộ',
      subtitle: 'Phòng, PMS, NFC và lịch mở tự động.',
      actions: [
        makeAction({id: 'rooms', groupId: 'hotel', title: 'Quản lý phòng', subtitle: 'UI-11 · building, floor, room và gán khóa', icon: 'hotel', targetRoute: 'RoomManagement', status: 'ready', requiredPermission: 'rooms', badge: roomSummary.rooms ? `${roomSummary.rooms} phòng` : undefined}),
        makeAction({id: 'room-import', groupId: 'hotel', title: 'Import phòng/người dùng', subtitle: 'UI-56 · preview lỗi trước khi ghi', icon: 'sync', targetRoute: 'RoomImport', status: 'ready', requiredPermission: 'rooms'}),
        makeAction({id: 'pms', groupId: 'hotel', title: 'PMS / Self check-in', subtitle: 'UI-14/53-57 · booking, check-in/out', icon: 'calendar', targetRoute: 'PmsHub', status: 'future', requiredPermission: 'hotel'}),
        makeAction({id: 'nfc', groupId: 'hotel', title: 'NFC & thẻ điện thoại', subtitle: 'UI-15 · mobile card, revoke khi mất máy', icon: 'phone', targetRoute: 'NfcKey', status: 'future', requiredPermission: 'nfc'}),
        makeAction({id: 'combination', groupId: 'hotel', title: 'Mở khóa kết hợp', subtitle: 'UI-28 · PIN+card, Face+PIN, rule theo lịch', icon: 'unlock', targetRoute: 'CombinationUnlock', status: 'future', requiredPermission: 'settings'}),
        makeAction({id: 'normally-open', groupId: 'hotel', title: 'Mở thường xuyên/lịch lớp', subtitle: 'UI-20/68 · normally open, lịch ca, ngoại lệ', icon: 'calendar', targetRoute: 'NormallyOpen', status: 'future', requiredPermission: 'settings'}),
      ],
    },
    {
      id: 'reports',
      title: 'Báo cáo',
      subtitle: 'Analytics, drilldown và export từ Records/Alerts.',
      actions: [
        makeAction({id: 'reports-main', groupId: 'reports', title: 'Báo cáo dữ liệu', subtitle: 'UI-17 · KPI mở khóa, failed, alert, low battery', icon: 'history', targetRoute: 'Reports', status: 'ready', requiredPermission: 'reports', badge: analyticsSummary ? `${analyticsSummary.totalRecords} records` : undefined}),
        makeAction({id: 'support', groupId: 'reports', title: 'Hỗ trợ kỹ thuật', subtitle: 'UI-70 · ticket bảo hành, bảo trì, diagnostic package', icon: 'command', targetRoute: 'SupportCenter', status: 'future', requiredPermission: 'support'}),
      ],
    },
  ];

  const visibleGroups = groups.filter(group => group.actions.length > 0);

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Thêm" subtitle="UI-06 · Chức năng vận hành nâng cao" showLogo />
      <OfflineBanner visible={isOffline} />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroTop}>
          <AplusIcon name="more" size={44} color={theme.colors.primary} boxed boxSize={76} />
          <View style={styles.heroText}>
            <AplusText variant="hero">Vận hành</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>Gom các chức năng vận hành phụ; tài khoản đã tách sang tab Tôi.</AplusText>
            <View style={styles.badgeRow}>
              <StatusChip label={permissionContext.scopeLabel} tone="info" />
              <StatusChip label={selectedLock ? `Context: ${selectedLock.roomName}` : 'Không có khóa'} tone="muted" />
            </View>
          </View>
        </View>
      </AplusCard>

      <View style={styles.quickStats}>
        <AplusCard style={styles.statCard}>
          <AplusText variant="caption">Cảnh báo</AplusText>
          <AplusText variant="subtitle" color={alertSummary.unread ? theme.colors.danger : theme.colors.text}>{alertSummary.unread}</AplusText>
        </AplusCard>
        <AplusCard style={styles.statCard}>
          <AplusText variant="caption">Pending sync</AplusText>
          <AplusText variant="subtitle" color={dashboardSummary.pendingSyncLocks ? theme.colors.warning : theme.colors.text}>{dashboardSummary.pendingSyncLocks}</AplusText>
        </AplusCard>
        <AplusCard style={styles.statCard}>
          <AplusText variant="caption">Phòng</AplusText>
          <AplusText variant="subtitle">{roomSummary.rooms}</AplusText>
        </AplusCard>
      </View>


      {visibleGroups.map(group => <GroupSection key={group.id} group={group} />)}
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
    backgroundColor: '#101014',
  },
  heroTop: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  quickStats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  groupSection: {
    gap: theme.spacing.md,
  },
  groupTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  actionCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 154,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  actionCardDisabled: {
    opacity: 0.58,
  },
  pressed: {
    transform: [{scale: 0.985}],
    opacity: 0.86,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  actionTitleBlock: {
    flex: 1,
    gap: 2,
  },
  actionFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
});

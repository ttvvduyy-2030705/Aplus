import type {AplusIconName} from '@/components/base/AplusIcon';
import type {AppRouteName} from '@/navigation/routes';

export type MoreActionGroupId = 'safety' | 'access' | 'device' | 'hotel' | 'reports' | 'account';

export type MorePermissionKey =
  | 'alerts'
  | 'reports'
  | 'staff'
  | 'rooms'
  | 'settings'
  | 'security'
  | 'transfer'
  | 'nfc'
  | 'hotel'
  | 'support';

export type MoreActionStatus = 'ready' | 'mock' | 'future' | 'locked';

export type PermissionContext = {
  userRole: 'owner' | 'admin' | 'guest';
  scopeLabel: string;
  isOffline: boolean;
  permissions: Record<MorePermissionKey, boolean>;
};

export type MoreAction = {
  id: string;
  groupId: MoreActionGroupId;
  title: string;
  subtitle: string;
  icon: AplusIconName;
  targetRoute: AppRouteName;
  status: MoreActionStatus;
  requiredPermission?: MorePermissionKey;
  badge?: string;
  disabledReason?: string;
};

export type MoreActionGroup = {
  id: MoreActionGroupId;
  title: string;
  subtitle: string;
  actions: MoreAction[];
};

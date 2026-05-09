export interface NotificationAdapter {
  requestPermission(): Promise<{granted: boolean}>;
  getPushToken(): Promise<string>;
}

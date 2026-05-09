import {Platform} from 'react-native';
import type {NotificationAdapter} from './NotificationAdapter';

export const MockNotificationAdapter: NotificationAdapter = {
  async requestPermission() {
    await wait(180);
    return {granted: true};
  },
  async getPushToken() {
    return `mock-${Platform.OS}-push-token`;
  },
};

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

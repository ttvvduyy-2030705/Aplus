import type {WifiProvisioningAdapter} from './WifiProvisioningAdapter';

export const MockWifiProvisioningAdapter: WifiProvisioningAdapter = {
  async scanNetworks() {
    await wait(260);
    return [
      {ssid: 'Aplus_Office_5G', level: 92, secure: true},
      {ssid: 'Aplus_Guest', level: 76, secure: true},
      {ssid: 'SmartHome_Test', level: 58, secure: true},
    ];
  },
  async provision(_deviceId, _ssid, password) {
    await wait(520);
    return {success: password.length >= 8 && password.toLowerCase() !== 'wrongpass'};
  },
};

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

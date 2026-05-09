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
  async provision() {
    await wait(520);
    return {success: true};
  },
};

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

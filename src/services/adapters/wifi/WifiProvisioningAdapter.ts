export type WifiNetwork = {
  ssid: string;
  level: number;
  secure: boolean;
};

export interface WifiProvisioningAdapter {
  scanNetworks(): Promise<WifiNetwork[]>;
  provision(deviceId: string, ssid: string, password: string): Promise<{success: boolean}>;
}

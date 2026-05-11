import type {LockCapabilities, LockDomainType} from './lock';

export type PairingMethod = 'qr' | 'manual' | 'bluetooth' | 'wifi' | 'gateway';
export type PairingStepId = 1 | 2 | 3 | 4 | 5 | 6;
export type PairingSessionStatus = 'draft' | 'preflight' | 'scanning' | 'configuring' | 'binding' | 'completed' | 'failed' | 'timeout';

export type PairingPermissionKey = 'bluetooth' | 'location' | 'wifi' | 'nearbyDevices' | 'notification';

export type PairingPermissionCheck = {
  key: PairingPermissionKey;
  label: string;
  passed: boolean;
  guidance: string;
};

export type PairingGateway = {
  id: string;
  name: string;
  protocol: 'mqtt' | 'websocket';
  endpoint: string;
  online: boolean;
};

export type DiscoveredDevice = {
  id: string;
  serial: string;
  name: string;
  model: string;
  method: PairingMethod;
  rssi?: number;
  rawQr?: string;
  capabilities: LockCapabilities;
  alreadyBound?: boolean;
};

export type PairingSession = {
  id: string;
  status: PairingSessionStatus;
  method?: PairingMethod;
  step: PairingStepId;
  selectedDevice?: DiscoveredDevice;
  selectedHomeId?: string;
  lockName?: string;
  roomName?: string;
  roomNo?: string;
  wifiSsid?: string;
  gatewayId?: string;
  createdLockId?: string;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
};

export type PairingCreateLockInput = {
  device: DiscoveredDevice;
  homeId: string;
  homeType: LockDomainType;
  homeName: string;
  lockName: string;
  roomName: string;
  roomNo: string;
  wifiSsid?: string;
  gateway?: PairingGateway;
};

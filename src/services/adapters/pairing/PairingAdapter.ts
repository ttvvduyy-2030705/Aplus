import type {BleDevice} from '@/services/adapters/ble/BleAdapter';
import type {QrScanResult} from '@/services/adapters/qr/QrScanAdapter';
import type {DiscoveredDevice, PairingPermissionCheck} from '@/types/pairing';

export interface PairingAdapter {
  buildPreflightChecks(simulateMissingPermission?: boolean): PairingPermissionCheck[];
  fromQrResult(result: QrScanResult): DiscoveredDevice;
  fromBleDevice(device: BleDevice): DiscoveredDevice;
  fromManualCode(serial: string, model: string): DiscoveredDevice;
}

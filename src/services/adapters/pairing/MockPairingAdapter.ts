import type {BleDevice} from '@/services/adapters/ble/BleAdapter';
import type {QrScanResult} from '@/services/adapters/qr/QrScanAdapter';
import type {LockCapabilities} from '@/types/lock';
import type {DiscoveredDevice, PairingPermissionCheck} from '@/types/pairing';
import type {PairingAdapter} from './PairingAdapter';

const defaultCapabilities: LockCapabilities = {
  supportsRemoteUnlock: true,
  supportsFingerprint: true,
  supportsFace: true,
  supportsCard: true,
  supportsNfc: true,
  supportsRemoteControl: true,
  supportsGateway: true,
  supportsOta: true,
};

const hotelCapabilities: LockCapabilities = {
  supportsRemoteUnlock: true,
  supportsFingerprint: true,
  supportsFace: false,
  supportsCard: true,
  supportsNfc: false,
  supportsRemoteControl: true,
  supportsGateway: true,
  supportsOta: true,
};

export const MockPairingAdapter: PairingAdapter = {
  buildPreflightChecks(simulateMissingPermission = false): PairingPermissionCheck[] {
    return [
      {key: 'bluetooth', label: 'Bluetooth', passed: true, guidance: 'Bật Bluetooth để dò thiết bị gần.'},
      {key: 'location', label: 'Location', passed: !simulateMissingPermission, guidance: 'Vào Settings > Location và cho phép Aplus Lock dùng vị trí khi pairing BLE.'},
      {key: 'wifi', label: 'Wi‑Fi', passed: true, guidance: 'Kết nối Wi‑Fi trước khi provision.'},
      {key: 'nearbyDevices', label: 'Nearby devices', passed: true, guidance: 'Cho phép Nearby devices để scan BLE trên Android mới.'},
      {key: 'notification', label: 'Notification', passed: true, guidance: 'Cho phép notification để nhận trạng thái pairing.'},
    ];
  },

  fromQrResult(result: QrScanResult): DiscoveredDevice {
    return {
      id: result.deviceId ?? `qr-${Date.now()}`,
      serial: result.serial ?? result.deviceId ?? `APL-QR-${String(Date.now()).slice(-5)}`,
      name: result.name ?? 'Aplus QR Lock',
      model: result.model ?? 'Aplus L5 Pro',
      method: 'qr',
      rawQr: result.rawValue,
      capabilities: result.capabilities ?? defaultCapabilities,
    };
  },

  fromBleDevice(device: BleDevice): DiscoveredDevice {
    return {
      id: device.id,
      serial: device.serial ?? device.id.toUpperCase(),
      name: device.name,
      model: device.model ?? 'Aplus BLE Lock',
      method: 'bluetooth',
      rssi: device.rssi,
      capabilities: device.capabilities ?? defaultCapabilities,
    };
  },

  fromManualCode(serial: string, model: string): DiscoveredDevice {
    const normalizedSerial = serial.trim().toUpperCase();
    const normalizedModel = model.trim() || 'Aplus L5 Pro';
    return {
      id: `manual-${normalizedSerial}`,
      serial: normalizedSerial,
      name: normalizedModel.toLowerCase().includes('hotel') ? 'Aplus Hotel Card Pro' : 'Aplus Manual Lock',
      model: normalizedModel,
      method: 'manual',
      capabilities: normalizedModel.toLowerCase().includes('hotel') ? hotelCapabilities : defaultCapabilities,
    };
  },
};

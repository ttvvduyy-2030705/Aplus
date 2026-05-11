import {Platform} from 'react-native';
import {MockBiometricAdapter} from './biometric/MockBiometricAdapter';
import {MockBleAdapter} from './ble/MockBleAdapter';
import {MockFirmwareOtaAdapter} from './firmware/MockFirmwareOtaAdapter';
import {MockNfcAdapter} from './nfc/MockNfcAdapter';
import {MockNotificationAdapter} from './notification/MockNotificationAdapter';
import {MockPairingAdapter} from './pairing/MockPairingAdapter';
import {MockQrScanAdapter} from './qr/MockQrScanAdapter';
import {MockRealtimeAdapter} from './realtime/MockRealtimeAdapter';
import {PlatformSecureStorageAdapter} from './secureStorage/PlatformSecureStorageAdapter';
import {MockWifiProvisioningAdapter} from './wifi/MockWifiProvisioningAdapter';

export const NativeAdapters = {
  platform: Platform.OS,
  ble: MockBleAdapter,
  wifiProvisioning: MockWifiProvisioningAdapter,
  nfc: MockNfcAdapter,
  biometric: MockBiometricAdapter,
  notification: MockNotificationAdapter,
  pairing: MockPairingAdapter,
  qrScan: MockQrScanAdapter,
  firmwareOta: MockFirmwareOtaAdapter,
  realtime: MockRealtimeAdapter,
  secureStorage: PlatformSecureStorageAdapter,
};

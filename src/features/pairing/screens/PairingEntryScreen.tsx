import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon, type AplusIconName} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {BaseScreen} from '@/components/base/BaseScreen';
import {StatusChip} from '@/components/base/StatusChip';
import {ErrorState} from '@/components/feedback/ErrorState';
import {NativeAdapters} from '@/services/adapters/nativeAdapters';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {LockCapabilities} from '@/types/lock';
import type {DiscoveredDevice, PairingGateway, PairingMethod, PairingPermissionCheck, PairingSession, PairingStepId} from '@/types/pairing';

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

const stepMeta: Array<{id: PairingStepId; title: string; ui: string}> = [
  {id: 1, title: 'Chọn phương thức', ui: 'UI-31'},
  {id: 2, title: 'QR / mã thiết bị', ui: 'UI-32'},
  {id: 3, title: 'Bluetooth nearby', ui: 'UI-33'},
  {id: 4, title: 'Cấu hình Wi‑Fi', ui: 'UI-34'},
  {id: 5, title: 'Gateway / MQTT', ui: 'UI-35'},
  {id: 6, title: 'Hoàn tất', ui: 'UI-36'},
];

const methodOptions: Array<{value: PairingMethod; title: string; description: string; icon: AplusIconName}> = [
  {value: 'qr', title: 'Quét QR', description: 'Đọc serial/model/capability từ tem khóa.', icon: 'qr'},
  {value: 'manual', title: 'Mã thiết bị', description: 'Nhập serial thủ công để test duplicate/timeout.', icon: 'key'},
  {value: 'bluetooth', title: 'Bluetooth nearby', description: 'Dò khóa BLE gần điện thoại rồi bind.', icon: 'bluetooth'},
  {value: 'wifi', title: 'Wi‑Fi setup', description: 'Provision SSID/mật khẩu trước khi bind gateway.', icon: 'wifi'},
  {value: 'gateway', title: 'Gateway/MQTT', description: 'Bind trực tiếp khóa vào gateway online.', icon: 'gateway'},
];

function createPermissions(simulateMissingPermission: boolean): PairingPermissionCheck[] {
  return [
    {key: 'bluetooth', label: 'Bluetooth', passed: true, guidance: 'Bật Bluetooth để dò thiết bị gần.'},
    {key: 'location', label: 'Location', passed: !simulateMissingPermission, guidance: 'Vào Settings > Location và cho phép Aplus Lock dùng vị trí khi pairing BLE.'},
    {key: 'wifi', label: 'Wi‑Fi', passed: true, guidance: 'Kết nối Wi‑Fi 2.4/5GHz trước khi provision.'},
    {key: 'nearbyDevices', label: 'Nearby devices', passed: true, guidance: 'Cho phép Nearby devices để scan BLE trên Android mới.'},
    {key: 'notification', label: 'Notification', passed: true, guidance: 'Cho phép notification để nhận trạng thái pairing và gateway.'},
  ];
}

function makeManualDevice(serial: string, model: string): DiscoveredDevice {
  const cleanSerial = serial.trim().toUpperCase();
  return {
    id: `manual-${cleanSerial}`,
    serial: cleanSerial,
    name: model.toLowerCase().includes('hotel') ? 'Aplus Hotel Card Pro' : 'Aplus Manual Lock',
    model: model.trim() || 'Aplus L5 Pro',
    method: 'manual',
    capabilities: model.toLowerCase().includes('hotel') ? hotelCapabilities : defaultCapabilities,
  };
}

function capabilitySummary(capabilities: LockCapabilities) {
  const enabled = [
    capabilities.supportsRemoteUnlock ? 'Remote' : undefined,
    capabilities.supportsFingerprint ? 'Vân tay' : undefined,
    capabilities.supportsFace ? 'Face' : undefined,
    capabilities.supportsCard ? 'Thẻ' : undefined,
    capabilities.supportsNfc ? 'NFC' : undefined,
    capabilities.supportsGateway ? 'Gateway' : undefined,
    capabilities.supportsOta ? 'OTA' : undefined,
  ].filter(Boolean);
  return enabled.join(' · ');
}

function StepPill({item, active, done}: {item: {id: PairingStepId; title: string; ui: string}; active: boolean; done: boolean}) {
  return (
    <View style={[styles.stepPill, active ? styles.stepPillActive : null, done ? styles.stepPillDone : null]}>
      <AplusText variant="label" color={active || done ? theme.colors.text : theme.colors.textMuted}>{item.ui}</AplusText>
      <AplusText variant="caption" numberOfLines={1}>{item.title}</AplusText>
    </View>
  );
}

function SelectCard({active, icon, title, description, onPress, disabled}: {active?: boolean; icon: AplusIconName; title: string; description: string; onPress: () => void; disabled?: boolean}) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.selectCard, active ? styles.selectCardActive : null, disabled ? styles.disabledCard : null]}>
      <AplusIcon name={icon} size={24} color={active ? theme.colors.primary : theme.colors.textMuted} boxed />
      <View style={styles.selectText}>
        <AplusText variant="body" style={styles.semibold}>{title}</AplusText>
        <AplusText variant="caption">{description}</AplusText>
      </View>
      {active ? <AplusIcon name="check" size={18} color={theme.colors.success} /> : null}
    </Pressable>
  );
}

function DeviceCard({device, active, onPress}: {device: DiscoveredDevice; active: boolean; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={[styles.deviceCard, active ? styles.selectCardActive : null]}>
      <View style={styles.rowBetween}>
        <View style={styles.flexBlock}>
          <AplusText variant="body" style={styles.semibold}>{device.name}</AplusText>
          <AplusText variant="caption">{device.serial} · {device.model}</AplusText>
        </View>
        <StatusChip label={device.alreadyBound ? 'Đã bind' : device.method.toUpperCase()} tone={device.alreadyBound ? 'danger' : active ? 'success' : 'info'} />
      </View>
      <AplusText variant="caption">Capability: {capabilitySummary(device.capabilities)}</AplusText>
      {typeof device.rssi === 'number' ? <AplusText variant="caption">RSSI: {device.rssi} dBm</AplusText> : null}
    </Pressable>
  );
}

function GatewayCard({gateway, active, onPress}: {gateway: PairingGateway; active: boolean; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} disabled={!gateway.online} style={[styles.deviceCard, active ? styles.selectCardActive : null, !gateway.online ? styles.disabledCard : null]}>
      <View style={styles.rowBetween}>
        <View style={styles.flexBlock}>
          <AplusText variant="body" style={styles.semibold}>{gateway.name}</AplusText>
          <AplusText variant="caption">{gateway.protocol.toUpperCase()} · {gateway.endpoint}</AplusText>
        </View>
        <StatusChip label={gateway.online ? 'Online' : 'Offline'} tone={gateway.online ? 'success' : 'danger'} />
      </View>
    </Pressable>
  );
}

export function PairingEntryScreen() {
  const navigation = useAplusNavigation();
  const {
    homes,
    pairingGateways,
    pairingLoading,
    pairingError,
    reloadPairingGateways,
    isPairingSerialBound,
    addPairedLock,
  } = useAppState();

  const [session, setSession] = useState<PairingSession>(() => ({
    id: `pairing-${Date.now()}`,
    status: 'draft',
    step: 1,
    method: 'qr',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));
  const [permissions, setPermissions] = useState<PairingPermissionCheck[]>(createPermissions(false));
  const [simulateMissingPermission, setSimulateMissingPermission] = useState(false);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [wifiNetworks, setWifiNetworks] = useState<Array<{ssid: string; level: number; secure: boolean}>>([]);
  const [wifiPassword, setWifiPassword] = useState('Aplus1234');
  const [manualSerial, setManualSerial] = useState(`APL-MANUAL-${String(Date.now()).slice(-4)}`);
  const [manualModel, setManualModel] = useState('Aplus L5 Pro');
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [localError, setLocalError] = useState<string | undefined>();
  const [processing, setProcessing] = useState(false);

  const selectedHome = useMemo(() => homes.find(home => home.id === session.selectedHomeId) ?? homes[0], [homes, session.selectedHomeId]);
  const selectedGateway = useMemo(() => pairingGateways.find(gateway => gateway.id === selectedGatewayId), [pairingGateways, selectedGatewayId]);
  const selectedDevice = session.selectedDevice;
  const effectiveError = localError ?? session.errorMessage ?? pairingError;
  const allPermissionsPassed = permissions.every(item => item.passed);

  useEffect(() => {
    if (homes[0] && !session.selectedHomeId) {
      setSession(prev => ({
        ...prev,
        selectedHomeId: homes[0].id,
        lockName: prev.lockName ?? 'Khóa mới Aplus',
        roomName: prev.roomName ?? 'Phòng pairing',
        roomNo: prev.roomNo ?? 'P-01',
        updatedAt: Date.now(),
      }));
    }
  }, [homes, session.selectedHomeId]);

  useEffect(() => {
    if (pairingGateways[0] && !selectedGatewayId) {
      setSelectedGatewayId(pairingGateways[0].id);
    }
  }, [pairingGateways, selectedGatewayId]);

  const updateSession = useCallback((patch: Partial<PairingSession>) => {
    setSession(prev => ({...prev, ...patch, updatedAt: Date.now()}));
  }, []);

  const goStep = useCallback((step: PairingStepId) => {
    setLocalError(undefined);
    updateSession({step});
  }, [updateSession]);

  const runPreflight = useCallback(async () => {
    setProcessing(true);
    setLocalError(undefined);
    setMessage(undefined);
    updateSession({status: 'preflight'});
    try {
      const notification = await NativeAdapters.notification.requestPermission();
      const nextChecks = createPermissions(simulateMissingPermission).map(item => (
        item.key === 'notification' ? {...item, passed: notification.granted} : item
      ));
      setPermissions(nextChecks);
      const failed = nextChecks.find(item => !item.passed);
      if (failed) {
        updateSession({status: 'failed', errorMessage: `${failed.label} chưa được cấp quyền. ${failed.guidance}`});
        return;
      }
      updateSession({status: 'draft', errorMessage: undefined});
      setMessage('Preflight OK: Bluetooth, Location, Wi‑Fi, Nearby devices và Notification đã sẵn sàng.');
    } finally {
      setProcessing(false);
    }
  }, [simulateMissingPermission, updateSession]);

  const goToDeviceStep = useCallback(async () => {
    if (!allPermissionsPassed) {
      setLocalError('Cần chạy preflight và cấp đủ quyền trước khi scan thiết bị.');
      return;
    }
    goStep(2);
  }, [allPermissionsPassed, goStep]);

  const scanQr = useCallback(async () => {
    setProcessing(true);
    setLocalError(undefined);
    updateSession({status: 'scanning', method: 'qr'});
    try {
      const result = await NativeAdapters.qrScan.openScanner();
      const device: DiscoveredDevice = {
        id: result.deviceId ?? `qr-${Date.now()}`,
        serial: result.serial ?? result.deviceId ?? `APL-QR-${String(Date.now()).slice(-5)}`,
        name: result.name ?? 'Aplus QR Lock',
        model: result.model ?? 'Aplus L5 Pro',
        method: 'qr',
        rawQr: result.rawValue,
        capabilities: result.capabilities ?? defaultCapabilities,
      };
      const duplicate = await isPairingSerialBound(device.serial);
      const nextDevice = {...device, alreadyBound: duplicate};
      setDevices([nextDevice]);
      updateSession({selectedDevice: nextDevice, status: duplicate ? 'failed' : 'draft', errorMessage: duplicate ? 'QR đọc được thiết bị đã bind trong hệ thống.' : undefined});
      setMessage(duplicate ? undefined : 'Đã đọc QR và lấy được serial/model/capability.');
    } finally {
      setProcessing(false);
    }
  }, [isPairingSerialBound, updateSession]);

  const useManualDevice = useCallback(async () => {
    const cleanSerial = manualSerial.trim().toUpperCase();
    if (!cleanSerial) {
      setLocalError('Serial/mã thiết bị không được để trống.');
      return;
    }
    if (cleanSerial.includes('TIMEOUT')) {
      updateSession({status: 'timeout', errorMessage: 'Giả lập timeout khi xác thực mã thiết bị. Không tạo khóa rác.'});
      return;
    }
    setProcessing(true);
    setLocalError(undefined);
    try {
      const device = makeManualDevice(cleanSerial, manualModel);
      const duplicate = await isPairingSerialBound(device.serial);
      const nextDevice = {...device, alreadyBound: duplicate};
      setDevices([nextDevice]);
      updateSession({selectedDevice: nextDevice, method: 'manual', status: duplicate ? 'failed' : 'draft', errorMessage: duplicate ? 'Serial đã tồn tại hoặc thiết bị đã bind.' : undefined});
      setMessage(duplicate ? undefined : 'Đã nhận mã thiết bị thủ công. Có thể tiếp tục BLE/Wi‑Fi/Gateway.');
    } finally {
      setProcessing(false);
    }
  }, [isPairingSerialBound, manualModel, manualSerial, updateSession]);

  const goToBleStep = useCallback(() => {
    if (session.method === 'bluetooth' && !selectedDevice) {
      goStep(3);
      return;
    }
    if (!selectedDevice || selectedDevice.alreadyBound) {
      setLocalError('Cần chọn thiết bị hợp lệ, chưa bind, trước khi sang Bluetooth.');
      return;
    }
    goStep(3);
  }, [goStep, selectedDevice, session.method]);

  const scanBle = useCallback(async () => {
    setProcessing(true);
    setLocalError(undefined);
    updateSession({status: 'scanning'});
    try {
      const bleDevices = await NativeAdapters.ble.scanLocks();
      const mapped: DiscoveredDevice[] = await Promise.all(bleDevices.map(async device => {
        const serial = device.serial ?? device.id.toUpperCase();
        return {
          id: device.id,
          serial,
          name: device.name,
          model: device.model ?? 'Aplus BLE Lock',
          method: 'bluetooth' as const,
          rssi: device.rssi,
          capabilities: device.capabilities ?? defaultCapabilities,
          alreadyBound: await isPairingSerialBound(serial),
        };
      }));
      setDevices(mapped);
      updateSession({status: 'draft', errorMessage: undefined});
      setMessage('Đã tìm thấy thiết bị Bluetooth nearby. Chọn thiết bị để connect mock.');
    } finally {
      setProcessing(false);
    }
  }, [isPairingSerialBound, updateSession]);

  const selectBleDevice = useCallback(async (device: DiscoveredDevice) => {
    if (device.alreadyBound) {
      updateSession({selectedDevice: device, status: 'failed', errorMessage: 'Thiết bị BLE này đã bind, không thể thêm trùng.'});
      return;
    }
    setProcessing(true);
    setLocalError(undefined);
    try {
      const result = await NativeAdapters.ble.connect(device.id);
      if (!result.connected) {
        updateSession({status: 'failed', errorMessage: 'Không connect được thiết bị BLE mock.'});
        return;
      }
      updateSession({selectedDevice: device, method: 'bluetooth', status: 'draft', errorMessage: undefined});
      setMessage(`Đã connect BLE với ${device.serial}.`);
    } finally {
      setProcessing(false);
    }
  }, [updateSession]);

  const goToWifiStep = useCallback(() => {
    if (!selectedDevice || selectedDevice.alreadyBound) {
      setLocalError('Chưa có thiết bị hợp lệ để cấu hình Wi‑Fi.');
      return;
    }
    goStep(4);
  }, [goStep, selectedDevice]);

  const scanWifi = useCallback(async () => {
    setProcessing(true);
    setLocalError(undefined);
    try {
      const networks = await NativeAdapters.wifiProvisioning.scanNetworks();
      setWifiNetworks(networks);
      if (!session.wifiSsid && networks[0]) {
        updateSession({wifiSsid: networks[0].ssid});
      }
      setMessage('Đã scan Wi‑Fi. Chọn SSID và nhập mật khẩu để provision.');
    } finally {
      setProcessing(false);
    }
  }, [session.wifiSsid, updateSession]);

  const provisionWifi = useCallback(async () => {
    if (!selectedDevice) {
      setLocalError('Chưa chọn thiết bị để provision Wi‑Fi.');
      return;
    }
    if (!session.wifiSsid) {
      setLocalError('Chưa chọn SSID Wi‑Fi.');
      return;
    }
    setProcessing(true);
    setLocalError(undefined);
    updateSession({status: 'configuring'});
    try {
      const result = await NativeAdapters.wifiProvisioning.provision(selectedDevice.id, session.wifiSsid, wifiPassword);
      if (!result.success) {
        updateSession({status: 'failed', errorMessage: 'Wi‑Fi sai hoặc mật khẩu quá ngắn. Thiết bị chưa được tạo vào Home.'});
        return;
      }
      updateSession({status: 'draft', errorMessage: undefined});
      setMessage(`Provision Wi‑Fi ${session.wifiSsid} thành công.`);
    } finally {
      setProcessing(false);
    }
  }, [selectedDevice, session.wifiSsid, updateSession, wifiPassword]);

  const goToGatewayStep = useCallback(() => {
    if (!selectedDevice) {
      setLocalError('Chưa có thiết bị để bind gateway.');
      return;
    }
    reloadPairingGateways();
    goStep(5);
  }, [goStep, reloadPairingGateways, selectedDevice]);

  const completePairing = useCallback(async () => {
    if (!selectedDevice || !selectedHome) {
      setLocalError('Thiếu thiết bị hoặc nhà/cơ sở để hoàn tất pairing.');
      return;
    }
    if (selectedDevice.alreadyBound) {
      setLocalError('Thiết bị đã bind, không tạo khóa trùng.');
      return;
    }
    if (selectedGateway && !selectedGateway.online) {
      setLocalError('Gateway đang offline, không thể bind MQTT/WebSocket.');
      return;
    }
    const lockName = session.lockName?.trim() || selectedDevice.name;
    const roomName = session.roomName?.trim() || 'Phòng pairing';
    const roomNo = session.roomNo?.trim() || 'P-01';
    updateSession({status: 'binding'});
    const created = await addPairedLock({
      device: selectedDevice,
      homeId: selectedHome.id,
      homeName: selectedHome.name,
      homeType: selectedHome.type,
      lockName,
      roomName,
      roomNo,
      wifiSsid: session.wifiSsid,
      gateway: selectedGateway,
    });
    if (!created) {
      updateSession({status: 'failed'});
      return;
    }
    updateSession({step: 6, status: 'completed', createdLockId: created.id, errorMessage: undefined});
    setMessage(`Hoàn tất thêm ${created.name}. Khóa đã xuất hiện ở Home và ghi record audit.`);
  }, [addPairedLock, selectedDevice, selectedGateway, selectedHome, session.lockName, session.roomName, session.roomNo, session.wifiSsid, updateSession]);

  const restart = useCallback(() => {
    const now = Date.now();
    setDevices([]);
    setWifiNetworks([]);
    setWifiPassword('Aplus1234');
    setManualSerial(`APL-MANUAL-${String(now).slice(-4)}`);
    setSelectedGatewayId(pairingGateways[0]?.id);
    setMessage(undefined);
    setLocalError(undefined);
    setSession({
      id: `pairing-${now}`,
      status: 'draft',
      step: 1,
      method: 'qr',
      selectedHomeId: homes[0]?.id,
      lockName: 'Khóa mới Aplus',
      roomName: 'Phòng pairing',
      roomNo: 'P-01',
      createdAt: now,
      updatedAt: now,
    });
  }, [homes, pairingGateways]);

  const renderStepBody = () => {
    if (session.step === 1) {
      return (
        <>
          <AplusCard style={styles.card}>
            <StatusChip label="UI-31 · Preflight permission" tone={allPermissionsPassed ? 'success' : 'warning'} />
            <AplusText variant="subtitle">Chọn phương thức thêm khóa</AplusText>
            <AplusText variant="caption">Wizard gộp QR, mã thiết bị, Bluetooth, Wi‑Fi và Gateway/MQTT vào một flow để không còn 3 luồng rời rạc.</AplusText>
            <View style={styles.methodGrid}>
              {methodOptions.map(option => (
                <SelectCard
                  key={option.value}
                  icon={option.icon}
                  title={option.title}
                  description={option.description}
                  active={session.method === option.value}
                  onPress={() => updateSession({method: option.value, errorMessage: undefined})}
                />
              ))}
            </View>
          </AplusCard>

          <AplusCard style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.flexBlock}>
                <AplusText variant="subtitle">Preflight quyền thiết bị</AplusText>
                <AplusText variant="caption">Bluetooth, Location, Wi‑Fi, Nearby devices và Notification phải pass trước khi scan.</AplusText>
              </View>
              <AplusButton title={simulateMissingPermission ? 'Bỏ giả lập' : 'Giả lập thiếu quyền'} variant="ghost" onPress={() => setSimulateMissingPermission(value => !value)} />
            </View>
            {permissions.map(item => (
              <View key={item.key} style={styles.checkRow}>
                <StatusChip label={item.passed ? 'Passed' : 'Blocked'} tone={item.passed ? 'success' : 'danger'} />
                <View style={styles.flexBlock}>
                  <AplusText variant="body" style={styles.semibold}>{item.label}</AplusText>
                  <AplusText variant="caption">{item.passed ? 'Đã sẵn sàng.' : item.guidance}</AplusText>
                </View>
              </View>
            ))}
            <View style={styles.buttonRow}>
              <AplusButton title="Chạy preflight" leftIcon="shield" loading={processing} onPress={runPreflight} style={styles.flexButton} />
              <AplusButton title="Tiếp tục" rightIcon="chevron" variant="secondary" disabled={!allPermissionsPassed} onPress={goToDeviceStep} style={styles.flexButton} />
            </View>
          </AplusCard>
        </>
      );
    }

    if (session.step === 2) {
      return (
        <AplusCard style={styles.card}>
          <StatusChip label="UI-32 · Quét QR / mã thiết bị" tone="info" />
          <AplusText variant="subtitle">Lấy serial, model và capability</AplusText>
          {session.method === 'qr' ? (
            <AplusButton title="Mở scanner QR mock" leftIcon="qr" loading={processing} onPress={scanQr} />
          ) : null}
          <AplusText variant="caption">Hoặc nhập mã thiết bị thủ công để kiểm tra duplicate, device đã bind và timeout.</AplusText>
          <AplusTextField label="Serial / mã thiết bị" leftIcon="key" value={manualSerial} autoCapitalize="characters" onChangeText={setManualSerial} />
          <AplusTextField label="Model khóa" leftIcon="capability" value={manualModel} onChangeText={setManualModel} />
          <View style={styles.buttonRow}>
            <AplusButton title="Dùng mã này" leftIcon="check" loading={processing} onPress={useManualDevice} style={styles.flexButton} />
            <AplusButton title="Serial trùng" variant="ghost" onPress={() => setManualSerial('APL-HOME-0520')} style={styles.flexButton} />
          </View>
          <AplusButton title="Giả lập timeout" variant="danger" onPress={() => setManualSerial('APL-TIMEOUT-001')} />
          {devices.map(device => <DeviceCard key={device.id} device={device} active={selectedDevice?.id === device.id} onPress={() => updateSession({selectedDevice: device, errorMessage: device.alreadyBound ? 'Thiết bị đã bind, không thể tiếp tục.' : undefined})} />)}
          <View style={styles.buttonRow}>
            <AplusButton title="Quay lại" variant="ghost" onPress={() => goStep(1)} style={styles.flexButton} />
            <AplusButton title="Tiếp Bluetooth" rightIcon="chevron" disabled={session.method !== 'bluetooth' && (!selectedDevice || selectedDevice.alreadyBound)} onPress={goToBleStep} style={styles.flexButton} />
          </View>
        </AplusCard>
      );
    }

    if (session.step === 3) {
      return (
        <AplusCard style={styles.card}>
          <StatusChip label="UI-33 · Bluetooth nearby" tone="info" />
          <AplusText variant="subtitle">Tìm và connect thiết bị BLE gần điện thoại</AplusText>
          {selectedDevice ? <DeviceCard device={selectedDevice} active onPress={() => undefined} /> : null}
          <AplusButton title="Scan Bluetooth nearby" leftIcon="bluetooth" loading={processing} onPress={scanBle} />
          {devices.map(device => (
            <DeviceCard key={device.id} device={device} active={selectedDevice?.id === device.id} onPress={() => selectBleDevice(device)} />
          ))}
          <View style={styles.buttonRow}>
            <AplusButton title="Quay lại" variant="ghost" onPress={() => goStep(2)} style={styles.flexButton} />
            <AplusButton title="Tiếp Wi‑Fi" rightIcon="chevron" disabled={!selectedDevice || selectedDevice.alreadyBound} onPress={goToWifiStep} style={styles.flexButton} />
          </View>
        </AplusCard>
      );
    }

    if (session.step === 4) {
      return (
        <AplusCard style={styles.card}>
          <StatusChip label="UI-34 · Cấu hình Wi‑Fi" tone="info" />
          <AplusText variant="subtitle">Provision Wi‑Fi xuống khóa</AplusText>
          <AplusText variant="caption">Wi‑Fi sai sẽ fail và không tạo khóa rác vào Home. Có thể bỏ qua nếu chỉ muốn BLE-only mock.</AplusText>
          <AplusButton title="Scan Wi‑Fi" leftIcon="wifi" loading={processing} onPress={scanWifi} />
          {wifiNetworks.map(network => (
            <Pressable key={network.ssid} onPress={() => updateSession({wifiSsid: network.ssid, errorMessage: undefined})} style={[styles.deviceCard, session.wifiSsid === network.ssid ? styles.selectCardActive : null]}>
              <View style={styles.rowBetween}>
                <AplusText variant="body" style={styles.semibold}>{network.ssid}</AplusText>
                <StatusChip label={`${network.level}%`} tone="info" />
              </View>
              <AplusText variant="caption">{network.secure ? 'Bảo mật WPA/WPA2' : 'Open network'}</AplusText>
            </Pressable>
          ))}
          <AplusTextField label="Mật khẩu Wi‑Fi" leftIcon="wifi" value={wifiPassword} secureTextEntry onChangeText={setWifiPassword} />
          <View style={styles.buttonRow}>
            <AplusButton title="Provision" leftIcon="check" loading={processing} onPress={provisionWifi} style={styles.flexButton} />
            <AplusButton title="Test Wi‑Fi sai" variant="ghost" onPress={() => setWifiPassword('wrongpass')} style={styles.flexButton} />
          </View>
          <View style={styles.buttonRow}>
            <AplusButton title="Quay lại" variant="ghost" onPress={() => goStep(3)} style={styles.flexButton} />
            <AplusButton title="Tiếp Gateway" rightIcon="chevron" onPress={goToGatewayStep} style={styles.flexButton} />
          </View>
        </AplusCard>
      );
    }

    if (session.step === 5) {
      return (
        <AplusCard style={styles.card}>
          <StatusChip label="UI-35 · Gateway/MQTT binding" tone="info" />
          <AplusText variant="subtitle">Bind khóa vào Gateway / MQTT</AplusText>
          <AplusText variant="caption">Gateway offline bị khóa để command/realtime không sinh trạng thái sai.</AplusText>
          {pairingGateways.map(gateway => (
            <GatewayCard key={gateway.id} gateway={gateway} active={selectedGatewayId === gateway.id} onPress={() => setSelectedGatewayId(gateway.id)} />
          ))}
          <View style={styles.formGrid}>
            <AplusTextField label="Tên khóa" leftIcon="lock" value={session.lockName ?? ''} onChangeText={text => updateSession({lockName: text})} />
            <AplusTextField label="Tên phòng" leftIcon="home" value={session.roomName ?? ''} onChangeText={text => updateSession({roomName: text})} />
            <AplusTextField label="Mã phòng" leftIcon="key" value={session.roomNo ?? ''} onChangeText={text => updateSession({roomNo: text})} />
          </View>
          <AplusText variant="label">Nhà / cơ sở</AplusText>
          {homes.map(home => (
            <Pressable key={home.id} onPress={() => updateSession({selectedHomeId: home.id})} style={[styles.deviceCard, selectedHome?.id === home.id ? styles.selectCardActive : null]}>
              <View style={styles.rowBetween}>
                <View style={styles.flexBlock}>
                  <AplusText variant="body" style={styles.semibold}>{home.name}</AplusText>
                  <AplusText variant="caption">{home.address}</AplusText>
                </View>
                <StatusChip label={home.type} tone="info" />
              </View>
            </Pressable>
          ))}
          <View style={styles.buttonRow}>
            <AplusButton title="Quay lại" variant="ghost" onPress={() => goStep(4)} style={styles.flexButton} />
            <AplusButton title="Hoàn tất thêm khóa" leftIcon="check" loading={pairingLoading} onPress={completePairing} style={styles.flexButton} />
          </View>
        </AplusCard>
      );
    }

    return (
      <AplusCard style={styles.heroCard}>
        <StatusChip label="UI-36 · Hoàn tất thêm khóa" tone={session.status === 'completed' ? 'success' : 'danger'} />
        <View style={styles.heroIcon}>
          <AplusIcon name={session.status === 'completed' ? 'check' : 'alert'} size={38} color={session.status === 'completed' ? theme.colors.success : theme.colors.danger} />
        </View>
        <AplusText variant="hero">{session.status === 'completed' ? 'Pairing thành công' : 'Pairing chưa hoàn tất'}</AplusText>
        <AplusText variant="body" color={theme.colors.textMuted}>
          {session.status === 'completed'
            ? 'Khóa mới đã được tạo bằng repository/state chung, xuất hiện ở Home, có lockId thật và có audit record System.'
            : effectiveError ?? 'Kiểm tra lại các bước scan, Wi‑Fi và Gateway/MQTT.'}
        </AplusText>
        <View style={styles.buttonRow}>
          <AplusButton title="Về Home" leftIcon="home" onPress={() => navigation.reset('Home')} style={styles.flexButton} />
          <AplusButton title="Mở chi tiết" variant="secondary" disabled={!session.createdLockId} onPress={() => session.createdLockId ? navigation.reset('LockDetail', {lockId: session.createdLockId}) : undefined} style={styles.flexButton} />
        </View>
        <AplusButton title="Pairing khóa khác" variant="ghost" onPress={restart} />
      </AplusCard>
    );
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Pairing Wizard" subtitle="Batch 12 · UI-12, UI-31 đến UI-36" canGoBack onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.summaryCard}>
        <View style={styles.rowBetween}>
          <View style={styles.flexBlock}>
            <AplusText variant="label">PairingSession</AplusText>
            <AplusText variant="subtitle">{session.id}</AplusText>
            <AplusText variant="caption">Status: {session.status} · Method: {session.method ?? 'chưa chọn'}</AplusText>
          </View>
          <StatusChip label={`Step ${session.step}/6`} tone={session.status === 'failed' || session.status === 'timeout' ? 'danger' : session.status === 'completed' ? 'success' : 'info'} />
        </View>
        <View style={styles.stepRow}>
          {stepMeta.map(item => <StepPill key={item.id} item={item} active={session.step === item.id} done={session.step > item.id} />)}
        </View>
      </AplusCard>

      {message ? (
        <AplusCard style={styles.messageCard}>
          <AplusIcon name="check" size={20} color={theme.colors.success} />
          <AplusText variant="caption" style={styles.flexBlock}>{message}</AplusText>
        </AplusCard>
      ) : null}
      {effectiveError ? <ErrorState message={effectiveError} /> : null}

      {renderStepBody()}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  card: {
    gap: theme.spacing.lg,
    borderColor: theme.colors.borderStrong,
  },
  heroCard: {
    gap: theme.spacing.lg,
    borderColor: theme.colors.borderStrong,
  },
  summaryCard: {
    gap: theme.spacing.md,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderColor: 'rgba(50,213,131,0.34)',
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  stepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  stepPill: {
    width: '31%',
    minWidth: 96,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    gap: 2,
    backgroundColor: theme.colors.surfaceStrong,
  },
  stepPillActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  stepPillDone: {
    borderColor: 'rgba(50,213,131,0.4)',
  },
  methodGrid: {
    gap: theme.spacing.md,
  },
  selectCard: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceStrong,
    padding: theme.spacing.md,
  },
  selectCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  disabledCard: {
    opacity: 0.48,
  },
  selectText: {
    flex: 1,
    gap: 2,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  flexBlock: {
    flex: 1,
  },
  semibold: {
    fontWeight: theme.typography.weight.semibold,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flexButton: {
    flex: 1,
  },
  deviceCard: {
    gap: theme.spacing.sm,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceStrong,
    padding: theme.spacing.md,
  },
  formGrid: {
    gap: theme.spacing.md,
  },
});

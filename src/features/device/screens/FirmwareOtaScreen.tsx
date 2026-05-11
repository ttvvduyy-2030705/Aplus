import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {BaseScreen} from '@/components/base/BaseScreen';
import {StatusChip} from '@/components/base/StatusChip';
import {NativeAdapters} from '@/services/adapters/nativeAdapters';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {FirmwareInfo} from '@/types/lock';

type OtaStatus = 'idle' | 'checking' | 'ready' | 'running' | 'done' | 'failed';

function firmwareStatusTone(info?: FirmwareInfo) {
  if (!info) {
    return 'muted' as const;
  }
  if (info.updateAvailable) {
    return info.required ? 'warning' as const : 'info' as const;
  }
  return 'success' as const;
}

export function FirmwareOtaScreen({lockId}: {lockId?: string}) {
  const navigation = useAplusNavigation();
  const {locks, findLock, isOffline, getFirmwareInfo, applyFirmwareVersion} = useAppState();
  const lock = useMemo(() => lockId ? findLock(lockId) : locks[0], [findLock, lockId, locks]);
  const [firmwareInfo, setFirmwareInfo] = useState<FirmwareInfo | undefined>();
  const [status, setStatus] = useState<OtaStatus>('idle');
  const [message, setMessage] = useState('Kiểm tra OTA để xem bản cập nhật phù hợp model khóa.');
  const [jobId, setJobId] = useState<string | undefined>();
  const [targetVersion, setTargetVersion] = useState<string | undefined>();
  const [progress, setProgress] = useState(0);

  const loadFirmwareInfo = async () => {
    if (!lock) {
      return;
    }
    setStatus('checking');
    setMessage('Đang kiểm tra firmware từ repository + OTA adapter mock...');
    const [repoInfo, adapterPackage] = await Promise.all([
      getFirmwareInfo(lock.id),
      NativeAdapters.firmwareOta.checkUpdate(lock.id, lock.firmwareVersion),
    ]);
    const merged: FirmwareInfo | undefined = repoInfo ? {
      ...repoInfo,
      latestVersion: adapterPackage?.version ?? repoInfo.latestVersion,
      packageSizeMb: adapterPackage?.sizeMb ?? repoInfo.packageSizeMb,
      required: adapterPackage?.required ?? repoInfo.required,
      updateAvailable: Boolean(adapterPackage?.version ?? repoInfo.updateAvailable),
    } : undefined;
    setFirmwareInfo(merged);
    setStatus(merged?.updateAvailable ? 'ready' : 'idle');
    setMessage(merged?.updateAvailable ? 'Có firmware mới. OTA mock sẽ tải, install, reboot rồi cập nhật version khi success.' : 'Firmware hiện tại đã là bản mới nhất hoặc model không hỗ trợ OTA.');
  };

  useEffect(() => {
    loadFirmwareInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lock?.id, lock?.firmwareVersion]);

  useEffect(() => {
    if (!jobId || !targetVersion || status !== 'running' || !lock) {
      return;
    }
    let cancelled = false;
    const poll = async () => {
      const result = await NativeAdapters.firmwareOta.getProgress(jobId);
      if (cancelled) {
        return;
      }
      setProgress(result.percent);
      setMessage(result.message);
      if (result.status === 'done') {
        await applyFirmwareVersion(lock.id, targetVersion);
        if (!cancelled) {
          setStatus('done');
          setFirmwareInfo(prev => prev ? {...prev, currentVersion: targetVersion, updateAvailable: false} : prev);
        }
        return;
      }
      if (result.status === 'failed') {
        setStatus('failed');
        return;
      }
      setTimeout(poll, 520);
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [applyFirmwareVersion, jobId, lock, status, targetVersion]);

  if (!lock) {
    return (
      <BaseScreen>
        <AplusHeader title="Firmware OTA" subtitle="UI-43" canGoBack onBack={navigation.goBack} showLogo />
        <AplusCard style={styles.cardGap}>
          <AplusText variant="body">Chưa có khóa để OTA.</AplusText>
          <AplusButton title="Về Home" onPress={() => navigation.reset('Home')} />
        </AplusCard>
      </BaseScreen>
    );
  }

  const blocked = isOffline || lock.connectionState === 'offline' || !lock.gatewayOnline || !lock.capabilities.supportsOta;
  const updateVersion = firmwareInfo?.latestVersion;

  const startOta = async () => {
    if (!updateVersion || blocked) {
      setMessage(blocked ? 'OTA bị chặn: thiết bị offline, gateway offline hoặc model không hỗ trợ OTA.' : 'Không có firmware mới để cập nhật.');
      return;
    }
    setStatus('running');
    setProgress(3);
    setMessage('Đã tạo OTA job, chờ gateway ACK.');
    const started = await NativeAdapters.firmwareOta.startUpdate(lock.id, updateVersion);
    setJobId(started.jobId);
    setTargetVersion(updateVersion);
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Firmware OTA" subtitle="UI-43 · OTA progress" canGoBack onBack={navigation.goBack} showLogo rightIcon="shield" onRightPress={() => navigation.navigate('DeviceDiagnostic', {lockId: lock.id})} />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <AplusIcon name="firmware" size={48} color={theme.colors.primary} boxed boxSize={80} />
          <View style={styles.flexBlock}>
            <AplusText variant="hero">{lock.firmwareVersion}</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>{lock.name} · {lock.hardwareModel ?? 'Aplus Mock'}</AplusText>
            <View style={styles.chipRow}>
              <StatusChip label={firmwareInfo?.updateAvailable ? `Có bản ${firmwareInfo.latestVersion}` : 'Up to date'} tone={firmwareStatusTone(firmwareInfo)} />
              <StatusChip label={lock.capabilities.supportsOta ? 'OTA capable' : 'Không hỗ trợ OTA'} tone={lock.capabilities.supportsOta ? 'success' : 'danger'} />
              <StatusChip label={lock.gatewayOnline ? 'Gateway online' : 'Gateway offline'} tone={lock.gatewayOnline ? 'success' : 'danger'} />
            </View>
          </View>
        </View>
      </AplusCard>

      <AplusCard style={styles.cardGap}>
        <View style={styles.rowBetween}>
          <AplusText variant="subtitle">Gói cập nhật</AplusText>
          <StatusChip label={status} tone={status === 'failed' ? 'danger' : status === 'done' ? 'success' : status === 'running' ? 'warning' : 'info'} />
        </View>
        <AplusText variant="body">Hiện tại: {lock.firmwareVersion}</AplusText>
        <AplusText variant="body">Mới nhất: {firmwareInfo?.latestVersion ?? 'Không có'}</AplusText>
        <AplusText variant="caption">Dung lượng: {firmwareInfo?.packageSizeMb ? `${firmwareInfo.packageSizeMb} MB` : '—'} · Channel: {firmwareInfo?.channel ?? 'stable'}</AplusText>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, {width: `${progress}%`}]} />
        </View>
        <AplusText variant="caption">{message}</AplusText>
        <View style={styles.actionRow}>
          <AplusButton title="Kiểm tra lại" leftIcon="refresh" variant="secondary" onPress={loadFirmwareInfo} disabled={status === 'running'} style={styles.flexButton} />
          <AplusButton title="Bắt đầu OTA" leftIcon="firmware" onPress={startOta} disabled={blocked || !firmwareInfo?.updateAvailable || status === 'running'} loading={status === 'checking'} style={styles.flexButton} />
        </View>
      </AplusCard>

      <AplusCard style={blocked ? styles.warningCard : styles.safeCard}>
        <AplusIcon name={blocked ? 'alert' : 'check'} size={24} color={blocked ? theme.colors.warning : theme.colors.success} />
        <View style={styles.flexBlock}>
          <AplusText variant="subtitle" color={blocked ? theme.colors.warning : theme.colors.success}>{blocked ? 'OTA đang bị guard chặn' : 'Guard OTA đạt yêu cầu'}</AplusText>
          <AplusText variant="caption">OTA chỉ chạy khi online, gateway online và capability `supportsOta=true`. Nếu fail, version cũ được giữ nguyên.</AplusText>
        </View>
      </AplusCard>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  cardGap: {gap: theme.spacing.md},
  heroCard: {gap: theme.spacing.md, borderColor: theme.colors.borderStrong},
  heroRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg},
  flexBlock: {flex: 1, gap: theme.spacing.xs},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md},
  progressTrack: {height: 12, borderRadius: 6, backgroundColor: theme.colors.surfaceStrong, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border},
  progressFill: {height: '100%', backgroundColor: theme.colors.primary},
  actionRow: {flexDirection: 'row', gap: theme.spacing.md},
  flexButton: {flex: 1},
  warningCard: {flexDirection: 'row', gap: theme.spacing.md, borderColor: 'rgba(253,176,34,0.34)'},
  safeCard: {flexDirection: 'row', gap: theme.spacing.md, borderColor: 'rgba(50,213,131,0.28)'},
});

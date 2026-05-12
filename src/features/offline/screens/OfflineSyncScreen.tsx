import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {BaseScreen} from '@/components/base/BaseScreen';
import {StatusChip} from '@/components/base/StatusChip';
import {OfflineBanner} from '@/components/feedback/OfflineBanner';
import {useLanguage} from '@/i18n/LanguageContext';
import {MockOfflineRepository} from '@/services/repositories/MockOfflineRepository';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {OfflineCacheItem, OfflineSummary, SyncConflict, SyncQueueJob, SyncQueueJobStatus, SyncQueueJobType} from '@/types/offline';

type TabKey = 'queue' | 'cache' | 'conflict';

const copy = {
  vi: {
    title: 'Offline Sync Queue',
    subtitle: 'UI-66 · cache, pending jobs và conflict resolution',
    hero: 'Offline không crash: chỉ xem cache hoặc tạo draft an toàn. Remote unlock offline bị chặn, không queue lệnh nguy hiểm.',
    online: 'Online',
    offline: 'Offline mock',
    goOffline: 'Tắt mạng mock',
    goOnline: 'Có mạng lại',
    refresh: 'Refresh cache',
    retryAll: 'Sync tất cả',
    queue: 'Queue',
    cache: 'Cache',
    conflict: 'Conflict',
    pending: 'Pending',
    success: 'Success',
    failed: 'Failed',
    cancelled: 'Cancelled',
    running: 'Running',
    blocked: 'Blocked',
    conflictStatus: 'Conflict',
    retry: 'Retry',
    cancel: 'Cancel',
    noJobs: 'Không có job trong queue.',
    noConflicts: 'Không còn conflict đang mở.',
    keepServer: 'Giữ server',
    useLocal: 'Dùng local',
    merge: 'Merge thủ công',
    createRename: 'Tạo job đổi tên',
    createNote: 'Tạo note offline',
    createDraft: 'Tạo draft key',
    createRevoke: 'Tạo revoke pending',
    createRemote: 'Thử remote offline',
    messageSynced: 'Đã sync/cập nhật queue.',
    cacheFresh: 'Cache mới',
    cacheEmpty: 'Trống',
    cacheStale: 'Cũ',
    lastSync: 'Lần sync cuối',
    jobs: 'Jobs',
    cached: 'Cached records',
    conflicts: 'Conflicts',
    safe: 'Offline safe',
    unsafe: 'Không an toàn',
    attempts: 'Lần thử',
    local: 'Local',
    server: 'Server',
  },
  en: {
    title: 'Offline Sync Queue',
    subtitle: 'UI-66 · cache, pending jobs and conflict resolution',
    hero: 'Offline must not crash: users can view cache or create safe drafts only. Remote unlock is blocked offline and never queued.',
    online: 'Online',
    offline: 'Offline mock',
    goOffline: 'Mock offline',
    goOnline: 'Back online',
    refresh: 'Refresh cache',
    retryAll: 'Sync all',
    queue: 'Queue',
    cache: 'Cache',
    conflict: 'Conflict',
    pending: 'Pending',
    success: 'Success',
    failed: 'Failed',
    cancelled: 'Cancelled',
    running: 'Running',
    blocked: 'Blocked',
    conflictStatus: 'Conflict',
    retry: 'Retry',
    cancel: 'Cancel',
    noJobs: 'No queued jobs.',
    noConflicts: 'No open conflicts.',
    keepServer: 'Keep server',
    useLocal: 'Use local',
    merge: 'Manual merge',
    createRename: 'Create rename job',
    createNote: 'Create offline note',
    createDraft: 'Create draft key',
    createRevoke: 'Create pending revoke',
    createRemote: 'Try remote offline',
    messageSynced: 'Queue/cache updated.',
    cacheFresh: 'Fresh cache',
    cacheEmpty: 'Empty',
    cacheStale: 'Stale',
    lastSync: 'Last sync',
    jobs: 'Jobs',
    cached: 'Cached records',
    conflicts: 'Conflicts',
    safe: 'Offline safe',
    unsafe: 'Unsafe',
    attempts: 'Attempts',
    local: 'Local',
    server: 'Server',
  },
};

function formatDate(timestamp?: number, language: 'vi' | 'en' = 'vi') {
  if (!timestamp) {
    return '—';
  }
  return new Date(timestamp).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN');
}

function statusTone(status: SyncQueueJobStatus): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (status === 'success') {
    return 'success';
  }
  if (status === 'failed' || status === 'cancelled') {
    return 'danger';
  }
  if (status === 'conflict') {
    return 'warning';
  }
  if (status === 'running') {
    return 'info';
  }
  return 'muted';
}

function statusLabel(status: SyncQueueJobStatus, t: typeof copy.vi) {
  if (status === 'success') {
    return t.success;
  }
  if (status === 'failed') {
    return t.failed;
  }
  if (status === 'cancelled') {
    return t.cancelled;
  }
  if (status === 'running') {
    return t.running;
  }
  if (status === 'conflict') {
    return t.conflictStatus;
  }
  return t.pending;
}

function cacheTone(status: OfflineCacheItem['status']): 'success' | 'warning' | 'muted' {
  if (status === 'fresh') {
    return 'success';
  }
  if (status === 'stale') {
    return 'warning';
  }
  return 'muted';
}

function cacheLabel(status: OfflineCacheItem['status'], t: typeof copy.vi) {
  if (status === 'fresh') {
    return t.cacheFresh;
  }
  if (status === 'stale') {
    return t.cacheStale;
  }
  return t.cacheEmpty;
}

function StatCard({label, value, tone}: {label: string; value: string | number; tone?: 'success' | 'warning' | 'danger' | 'info' | 'muted'}) {
  return (
    <AplusCard style={styles.statCard}>
      <StatusChip label={label} tone={tone ?? 'muted'} />
      <AplusText variant="title">{value}</AplusText>
    </AplusCard>
  );
}

function TabPill({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.tabPill, active ? styles.tabPillActive : null, pressed ? styles.pressed : null]}>
      <AplusText variant="caption" color={active ? theme.colors.text : theme.colors.textMuted}>{label}</AplusText>
    </Pressable>
  );
}

function JobCard({job, t, language, onRetry, onCancel}: {job: SyncQueueJob; t: typeof copy.vi; language: 'vi' | 'en'; onRetry: (jobId: string) => void; onCancel: (jobId: string) => void}) {
  const canRetry = job.status === 'pending' || job.status === 'failed';
  const canCancel = job.status !== 'success' && job.status !== 'cancelled';
  return (
    <AplusCard style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <AplusIcon name={job.offlineSafe ? 'sync' : 'lock'} size={26} color={job.offlineSafe ? theme.colors.primary : theme.colors.danger} boxed />
        <View style={styles.itemText}>
          <AplusText variant="body" style={styles.bold}>{job.title}</AplusText>
          <AplusText variant="caption">{job.description}</AplusText>
        </View>
        <StatusChip label={statusLabel(job.status, t)} tone={statusTone(job.status)} />
      </View>
      <View style={styles.metaWrap}>
        <StatusChip label={job.offlineSafe ? t.safe : t.unsafe} tone={job.offlineSafe ? 'success' : 'danger'} />
        <StatusChip label={`${t.attempts}: ${job.attempts}`} tone="muted" />
        {job.lockName ? <StatusChip label={job.lockName} tone="info" /> : null}
      </View>
      {job.errorMessage ? <AplusText variant="caption" color={theme.colors.warning}>{job.errorMessage}</AplusText> : null}
      <AplusText variant="caption">{formatDate(job.updatedAt, language)}</AplusText>
      <View style={styles.actionRow}>
        <AplusButton title={t.retry} leftIcon="refresh" variant="secondary" disabled={!canRetry} onPress={() => onRetry(job.id)} style={styles.flexButton} />
        <AplusButton title={t.cancel} leftIcon="close" variant="ghost" disabled={!canCancel} onPress={() => onCancel(job.id)} style={styles.flexButton} />
      </View>
    </AplusCard>
  );
}

function CacheCard({item, t, language}: {item: OfflineCacheItem; t: typeof copy.vi; language: 'vi' | 'en'}) {
  return (
    <AplusCard style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <AplusIcon name="sync" size={24} color={theme.colors.primary} boxed />
        <View style={styles.itemText}>
          <AplusText variant="body" style={styles.bold}>{item.title}</AplusText>
          <AplusText variant="caption">{item.description}</AplusText>
        </View>
        <StatusChip label={cacheLabel(item.status, t)} tone={cacheTone(item.status)} />
      </View>
      <View style={styles.metaWrap}>
        <StatusChip label={`${item.count} items`} tone="info" />
        <StatusChip label={formatDate(item.lastCachedAt, language)} tone="muted" />
      </View>
    </AplusCard>
  );
}

function ConflictCard({conflict, t, onResolve}: {conflict: SyncConflict; t: typeof copy.vi; onResolve: (conflictId: string, resolution: 'keepServer' | 'useLocal' | 'mergeManual') => void}) {
  return (
    <AplusCard style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <AplusIcon name="alert" size={26} color={conflict.status === 'open' ? theme.colors.warning : theme.colors.success} boxed />
        <View style={styles.itemText}>
          <AplusText variant="body" style={styles.bold}>{conflict.title}</AplusText>
          <AplusText variant="caption">{conflict.note ?? conflict.entity}</AplusText>
        </View>
        <StatusChip label={conflict.status === 'open' ? t.conflictStatus : t.success} tone={conflict.status === 'open' ? 'warning' : 'success'} />
      </View>
      <View style={styles.compareBox}>
        <View style={styles.compareColumn}>
          <AplusText variant="caption" color={theme.colors.textMuted}>{t.local}</AplusText>
          <AplusText variant="body">{conflict.localValue}</AplusText>
        </View>
        <View style={styles.compareColumn}>
          <AplusText variant="caption" color={theme.colors.textMuted}>{t.server}</AplusText>
          <AplusText variant="body">{conflict.serverValue}</AplusText>
        </View>
      </View>
      <View style={styles.actionRow}>
        <AplusButton title={t.keepServer} variant="secondary" disabled={conflict.status !== 'open'} onPress={() => onResolve(conflict.id, 'keepServer')} style={styles.flexButton} />
        <AplusButton title={t.useLocal} variant="secondary" disabled={conflict.status !== 'open'} onPress={() => onResolve(conflict.id, 'useLocal')} style={styles.flexButton} />
      </View>
      <AplusButton title={t.merge} leftIcon="matrix" variant="ghost" disabled={conflict.status !== 'open'} onPress={() => onResolve(conflict.id, 'mergeManual')} />
    </AplusCard>
  );
}

export function OfflineSyncScreen() {
  const {language} = useLanguage();
  const t = language === 'en' ? copy.en : copy.vi;
  const {isOffline, setOfflineMock, locks, reloadLocks, reloadAccessRecords, reloadAlerts} = useAppState();
  const [summary, setSummary] = useState<OfflineSummary>();
  const [cache, setCache] = useState<OfflineCacheItem[]>([]);
  const [jobs, setJobs] = useState<SyncQueueJob[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('queue');
  const [message, setMessage] = useState('');
  const selectedLockId = useMemo(() => locks[0]?.id, [locks]);

  const refresh = useCallback(async () => {
    const snapshot = await MockOfflineRepository.refreshCache(isOffline);
    setSummary(snapshot.summary);
    setCache(snapshot.cache);
    setJobs(snapshot.jobs);
    setConflicts(snapshot.conflicts);
  }, [isOffline]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const refreshAppData = useCallback(async () => {
    await Promise.all([reloadLocks(), reloadAccessRecords(), reloadAlerts()]);
  }, [reloadAccessRecords, reloadAlerts, reloadLocks]);

  const handleToggleOffline = async () => {
    setOfflineMock(!isOffline);
    setMessage(!isOffline ? t.offline : t.online);
    setTimeout(refresh, 0);
  };

  const handleCreate = async (type: SyncQueueJobType) => {
    await MockOfflineRepository.createDemoJob(type, selectedLockId);
    await refresh();
    setActiveTab('queue');
    setMessage(t.messageSynced);
  };

  const handleRetry = async (jobId: string) => {
    await MockOfflineRepository.retryJob(jobId, isOffline);
    await refresh();
    await refreshAppData();
    setMessage(t.messageSynced);
  };

  const handleRetryAll = async () => {
    await MockOfflineRepository.retryAll(isOffline);
    await refresh();
    await refreshAppData();
    setMessage(t.messageSynced);
  };

  const handleCancel = async (jobId: string) => {
    await MockOfflineRepository.cancelJob(jobId);
    await refresh();
    setMessage(t.messageSynced);
  };

  const handleResolve = async (conflictId: string, resolution: 'keepServer' | 'useLocal' | 'mergeManual') => {
    await MockOfflineRepository.resolveConflict(conflictId, resolution);
    await refresh();
    setMessage(t.messageSynced);
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={t.title} subtitle={t.subtitle} showBack showLogo />
      <OfflineBanner visible={isOffline} />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <AplusIcon name="sync" size={42} color={theme.colors.primary} boxed boxSize={72} />
          <View style={styles.heroText}>
            <AplusText variant="hero">Batch 25</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>{t.hero}</AplusText>
            <View style={styles.metaWrap}>
              <StatusChip label={isOffline ? t.offline : t.online} tone={isOffline ? 'warning' : 'success'} />
              <StatusChip label={`${t.lastSync}: ${formatDate(summary?.lastSyncAt, language)}`} tone="muted" />
            </View>
          </View>
        </View>
      </AplusCard>

      <View style={styles.summaryGrid}>
        <StatCard label={t.cached} value={summary?.cachedRecords ?? 0} tone="info" />
        <StatCard label={t.pending} value={summary?.pendingJobs ?? 0} tone={(summary?.pendingJobs ?? 0) ? 'warning' : 'success'} />
        <StatCard label={t.conflicts} value={summary?.conflictJobs ?? 0} tone={(summary?.conflictJobs ?? 0) ? 'danger' : 'success'} />
      </View>

      <View style={styles.actionRow}>
        <AplusButton title={isOffline ? t.goOnline : t.goOffline} leftIcon={isOffline ? 'wifi' : 'sync'} variant={isOffline ? 'primary' : 'secondary'} onPress={handleToggleOffline} style={styles.flexButton} />
        <AplusButton title={t.refresh} leftIcon="refresh" variant="ghost" onPress={refresh} style={styles.flexButton} />
      </View>

      <AplusCard style={styles.createCard}>
        <AplusText variant="subtitle">{t.jobs}</AplusText>
        <View style={styles.buttonWrap}>
          <AplusButton title={t.createRename} leftIcon="lock" variant="secondary" onPress={() => handleCreate('rename_lock')} style={styles.wrapButton} />
          <AplusButton title={t.createNote} leftIcon="history" variant="secondary" onPress={() => handleCreate('record_note')} style={styles.wrapButton} />
          <AplusButton title={t.createDraft} leftIcon="credential" variant="secondary" onPress={() => handleCreate('draft_credential')} style={styles.wrapButton} />
          <AplusButton title={t.createRevoke} leftIcon="revoked" variant="secondary" onPress={() => handleCreate('revoke_credential')} style={styles.wrapButton} />
          <AplusButton title={t.createRemote} leftIcon="unlock" variant="danger" onPress={() => handleCreate('remote_unlock_blocked')} style={styles.wrapButton} />
        </View>
        <AplusButton title={t.retryAll} leftIcon="sync" variant="primary" onPress={handleRetryAll} />
        {message ? <AplusText variant="caption" color={theme.colors.success}>{message}</AplusText> : null}
      </AplusCard>

      <View style={styles.tabs}>
        <TabPill label={`${t.queue} (${jobs.length})`} active={activeTab === 'queue'} onPress={() => setActiveTab('queue')} />
        <TabPill label={`${t.cache} (${cache.length})`} active={activeTab === 'cache'} onPress={() => setActiveTab('cache')} />
        <TabPill label={`${t.conflict} (${conflicts.filter(item => item.status === 'open').length})`} active={activeTab === 'conflict'} onPress={() => setActiveTab('conflict')} />
      </View>

      {activeTab === 'queue' ? (
        <View style={styles.list}>
          {jobs.length ? jobs.map(job => <JobCard key={job.id} job={job} t={t} language={language} onRetry={handleRetry} onCancel={handleCancel} />) : <AplusText variant="body">{t.noJobs}</AplusText>}
        </View>
      ) : null}

      {activeTab === 'cache' ? (
        <View style={styles.list}>
          {cache.map(item => <CacheCard key={item.entity} item={item} t={t} language={language} />)}
        </View>
      ) : null}

      {activeTab === 'conflict' ? (
        <View style={styles.list}>
          {conflicts.length ? conflicts.map(conflict => <ConflictCard key={conflict.id} conflict={conflict} t={t} onResolve={handleResolve} />) : <AplusText variant="body">{t.noConflicts}</AplusText>}
        </View>
      ) : null}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  heroCard: {
    backgroundColor: '#101014',
    borderColor: theme.colors.borderStrong,
  },
  heroRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  createCard: {
    gap: theme.spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tabPill: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  tabPillActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  list: {
    gap: theme.spacing.md,
  },
  itemCard: {
    gap: theme.spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flexButton: {
    flex: 1,
  },
  buttonWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  wrapButton: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  compareBox: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  compareColumn: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceStrong,
    gap: theme.spacing.xs,
  },
  pressed: {
    opacity: 0.82,
    transform: [{scale: 0.985}],
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
});

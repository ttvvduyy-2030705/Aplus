import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {BaseScreen} from '@/components/base/BaseScreen';
import {StatusChip} from '@/components/base/StatusChip';
import {useLanguage} from '@/i18n/LanguageContext';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {MockSupportRepository} from '@/services/repositories/MockSupportRepository';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {AplusLock} from '@/types/lock';
import type {
  DiagnosticPackage,
  MaintenanceTask,
  MaintenanceTaskType,
  SupportSummary,
  SupportTicket,
  SupportTicketSeverity,
  SupportTicketType,
  WarrantyInfo,
} from '@/types/support';

type TabKey = 'tickets' | 'warranty' | 'maintenance' | 'diagnostic';

type LocaleText = {
  title: string;
  subtitle: string;
  createTicket: string;
  tickets: string;
  warranty: string;
  maintenance: string;
  diagnostic: string;
  openTickets: string;
  warrantyActive: string;
  maintenanceDue: string;
  packages: string;
  selectLock: string;
  ticketTitle: string;
  description: string;
  contactName: string;
  contactPhone: string;
  attachments: string;
  severity: string;
  type: string;
  create: string;
  resolve: string;
  viewLock: string;
  alerts: string;
  noTickets: string;
  warrantyInfo: string;
  expiresAt: string;
  installedAt: string;
  purchaseDate: string;
  provider: string;
  status: string;
  newTask: string;
  assignee: string;
  taskTitle: string;
  dueInDays: string;
  checklist: string;
  complete: string;
  exportPackage: string;
  packageSummary: string;
  redacted: string;
  noPackages: string;
  saved: string;
};

const copy: Record<'vi' | 'en', LocaleText> = {
  vi: {
    title: 'Hỗ trợ kỹ thuật',
    subtitle: 'UI-70 · Bảo hành, bảo trì, diagnostic package',
    createTicket: 'Tạo ticket',
    tickets: 'Ticket',
    warranty: 'Bảo hành',
    maintenance: 'Bảo trì',
    diagnostic: 'Diagnostic',
    openTickets: 'Ticket mở',
    warrantyActive: 'Còn bảo hành',
    maintenanceDue: 'Cần xử lý',
    packages: 'Gói log',
    selectLock: 'Chọn khóa',
    ticketTitle: 'Tiêu đề',
    description: 'Mô tả lỗi',
    contactName: 'Người liên hệ',
    contactPhone: 'Số điện thoại',
    attachments: 'Ảnh/video/log đính kèm',
    severity: 'Mức độ',
    type: 'Loại yêu cầu',
    create: 'Tạo yêu cầu',
    resolve: 'Đóng ticket',
    viewLock: 'Xem khóa',
    alerts: 'Cảnh báo',
    noTickets: 'Chưa có support ticket cho khóa này.',
    warrantyInfo: 'Thông tin bảo hành',
    expiresAt: 'Hết hạn',
    installedAt: 'Lắp đặt',
    purchaseDate: 'Ngày mua',
    provider: 'Đơn vị bảo hành',
    status: 'Trạng thái',
    newTask: 'Tạo lịch bảo trì',
    assignee: 'Người phụ trách',
    taskTitle: 'Tên công việc',
    dueInDays: 'Hạn sau số ngày',
    checklist: 'Checklist',
    complete: 'Hoàn tất',
    exportPackage: 'Xuất diagnostic package',
    packageSummary: 'Tóm tắt gói diagnostic',
    redacted: 'Đã redaction',
    noPackages: 'Chưa có diagnostic package.',
    saved: 'Đã lưu mock.',
  },
  en: {
    title: 'Technical Support',
    subtitle: 'UI-70 · Warranty, maintenance, diagnostic package',
    createTicket: 'Create ticket',
    tickets: 'Tickets',
    warranty: 'Warranty',
    maintenance: 'Maintenance',
    diagnostic: 'Diagnostic',
    openTickets: 'Open tickets',
    warrantyActive: 'Active warranty',
    maintenanceDue: 'Due tasks',
    packages: 'Packages',
    selectLock: 'Select lock',
    ticketTitle: 'Title',
    description: 'Issue description',
    contactName: 'Contact name',
    contactPhone: 'Phone number',
    attachments: 'Attached images/videos/logs',
    severity: 'Severity',
    type: 'Request type',
    create: 'Create request',
    resolve: 'Resolve ticket',
    viewLock: 'View lock',
    alerts: 'Alerts',
    noTickets: 'No support ticket for this lock yet.',
    warrantyInfo: 'Warranty information',
    expiresAt: 'Expires at',
    installedAt: 'Installed at',
    purchaseDate: 'Purchase date',
    provider: 'Provider',
    status: 'Status',
    newTask: 'Create maintenance task',
    assignee: 'Assignee',
    taskTitle: 'Task title',
    dueInDays: 'Due in days',
    checklist: 'Checklist',
    complete: 'Complete',
    exportPackage: 'Export diagnostic package',
    packageSummary: 'Diagnostic package summary',
    redacted: 'Redacted',
    noPackages: 'No diagnostic package yet.',
    saved: 'Saved in mock.',
  },
};

const severityOptions: SupportTicketSeverity[] = ['Critical', 'High', 'Medium', 'Low'];
const ticketTypes: SupportTicketType[] = ['technical', 'warranty', 'maintenance', 'diagnostic'];
const taskTypes: MaintenanceTaskType[] = ['battery', 'gateway', 'firmware', 'mechanical', 'inspection'];

function toneForSeverity(severity: SupportTicketSeverity) {
  if (severity === 'Critical') {
    return 'danger' as const;
  }
  if (severity === 'High' || severity === 'Medium') {
    return 'warning' as const;
  }
  return 'info' as const;
}

function statusTone(status: string) {
  if (status === 'resolved' || status === 'done' || status === 'active') {
    return 'success' as const;
  }
  if (status === 'expired' || status === 'overdue' || status === 'cancelled') {
    return 'danger' as const;
  }
  if (status === 'expiring' || status === 'in_progress' || status === 'waiting_customer') {
    return 'warning' as const;
  }
  return 'info' as const;
}

function formatDate(value: number, language: 'vi' | 'en') {
  return new Date(value).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
}

function OptionChip<T extends string>({value, selected, onPress}: {value: T; selected: boolean; onPress: (value: T) => void}) {
  return (
    <Pressable accessibilityRole="button" onPress={() => onPress(value)} style={[styles.optionChip, selected ? styles.optionChipActive : null]}>
      <AplusText variant="caption" color={selected ? theme.colors.text : theme.colors.textMuted}>{value}</AplusText>
    </Pressable>
  );
}

function Metric({label, value, tone}: {label: string; value: string | number; tone?: 'success' | 'warning' | 'danger' | 'info' | 'muted'}) {
  return (
    <AplusCard style={styles.metricCard}>
      <AplusText variant="caption">{label}</AplusText>
      <AplusText variant="subtitle">{value}</AplusText>
      {tone ? <StatusChip label={tone} tone={tone} /> : null}
    </AplusCard>
  );
}

function TicketCard({ticket, onResolve, onOpenLock}: {ticket: SupportTicket; onResolve: (ticket: SupportTicket) => void; onOpenLock: (lockId: string) => void}) {
  return (
    <AplusCard style={styles.cardGap}>
      <View style={styles.rowTop}>
        <AplusIcon name="command" size={24} color={theme.colors.primary} boxed />
        <View style={styles.flexBlock}>
          <AplusText variant="subtitle">{ticket.title}</AplusText>
          <AplusText variant="caption">{ticket.lockName} · {ticket.roomName}</AplusText>
        </View>
        <StatusChip label={ticket.severity} tone={toneForSeverity(ticket.severity)} />
      </View>
      <AplusText variant="caption">{ticket.description}</AplusText>
      <View style={styles.chipRow}>
        <StatusChip label={ticket.status} tone={statusTone(ticket.status)} />
        <StatusChip label={ticket.type} tone="info" />
        {ticket.attachmentNames.length ? <StatusChip label={`${ticket.attachmentNames.length} files`} tone="muted" /> : null}
        {ticket.relatedAlertId ? <StatusChip label={ticket.relatedAlertId} tone="warning" /> : null}
      </View>
      <View style={styles.actionRow}>
        <AplusButton title="Lock" leftIcon="door" variant="secondary" onPress={() => onOpenLock(ticket.lockId)} style={styles.flexButton} />
        <AplusButton title="Resolve" leftIcon="check" variant="ghost" disabled={ticket.status === 'resolved'} onPress={() => onResolve(ticket)} style={styles.flexButton} />
      </View>
    </AplusCard>
  );
}

function WarrantyCard({warranty, language, t}: {warranty: WarrantyInfo; language: 'vi' | 'en'; t: LocaleText}) {
  return (
    <AplusCard style={styles.cardGap}>
      <View style={styles.rowTop}>
        <AplusIcon name="shield" size={24} color={theme.colors.primary} boxed />
        <View style={styles.flexBlock}>
          <AplusText variant="subtitle">{warranty.lockName}</AplusText>
          <AplusText variant="caption">{warranty.model} · {warranty.serial}</AplusText>
        </View>
        <StatusChip label={warranty.status} tone={statusTone(warranty.status)} />
      </View>
      <InfoRow label={t.purchaseDate} value={formatDate(warranty.purchaseDate, language)} />
      <InfoRow label={t.installedAt} value={formatDate(warranty.installedAt, language)} />
      <InfoRow label={t.expiresAt} value={formatDate(warranty.expiresAt, language)} />
      <InfoRow label={t.provider} value={warranty.provider} />
      <AplusText variant="caption">{warranty.policyNote}</AplusText>
    </AplusCard>
  );
}

function TaskCard({task, language, onComplete}: {task: MaintenanceTask; language: 'vi' | 'en'; onComplete: (task: MaintenanceTask) => void}) {
  return (
    <AplusCard style={styles.cardGap}>
      <View style={styles.rowTop}>
        <AplusIcon name={task.type === 'battery' ? 'battery' : task.type === 'gateway' ? 'gateway' : 'settings'} size={24} color={theme.colors.primary} boxed />
        <View style={styles.flexBlock}>
          <AplusText variant="subtitle">{task.title}</AplusText>
          <AplusText variant="caption">{task.lockName} · {task.assignee} · {formatDate(task.dueAt, language)}</AplusText>
        </View>
        <StatusChip label={task.status} tone={statusTone(task.status)} />
      </View>
      <View style={styles.chipRow}>
        <StatusChip label={task.type} tone="info" />
        {task.relatedTicketId ? <StatusChip label={task.relatedTicketId} tone="warning" /> : null}
      </View>
      {task.checklist.map(item => <AplusText key={item} variant="caption">• {item}</AplusText>)}
      <AplusButton title="Complete" leftIcon="check" variant="secondary" disabled={task.status === 'done'} onPress={() => onComplete(task)} />
    </AplusCard>
  );
}

function PackageCard({pkg, language, t}: {pkg: DiagnosticPackage; language: 'vi' | 'en'; t: LocaleText}) {
  return (
    <AplusCard style={styles.cardGap}>
      <View style={styles.rowTop}>
        <AplusIcon name="capability" size={24} color={theme.colors.primary} boxed />
        <View style={styles.flexBlock}>
          <AplusText variant="subtitle">{pkg.fileName}</AplusText>
          <AplusText variant="caption">{pkg.lockName} · {formatDate(pkg.createdAt, language)}</AplusText>
        </View>
        <StatusChip label={t.redacted} tone="success" />
      </View>
      <AplusText variant="caption">{pkg.summary}</AplusText>
      <View style={styles.chipRow}>
        <StatusChip label={`${pkg.recordCount} records`} tone="info" />
        <StatusChip label={`${pkg.alertCount} alerts`} tone="warning" />
        <StatusChip label={`${pkg.redactedFields.length} redacted`} tone="success" />
      </View>
      <AplusCard style={styles.packagePreview}>
        <AplusText variant="caption" numberOfLines={6}>{pkg.content}</AplusText>
      </AplusCard>
    </AplusCard>
  );
}

function InfoRow({label, value}: {label: string; value?: string | number}) {
  return (
    <View style={styles.infoRow}>
      <AplusText variant="caption" color={theme.colors.textMuted}>{label}</AplusText>
      <AplusText variant="caption" style={styles.infoValue}>{value ?? '—'}</AplusText>
    </View>
  );
}

export function SupportCenterScreen({lockId}: {lockId?: string}) {
  const navigation = useAplusNavigation();
  const {language} = useLanguage();
  const locale = language === 'en' ? 'en' : 'vi';
  const t = copy[locale];
  const {locks, reloadLocks, reloadAccessRecords, reloadAlerts} = useAppState();
  const [activeTab, setActiveTab] = useState<TabKey>('tickets');
  const [selectedLockId, setSelectedLockId] = useState<string | undefined>(lockId);
  const [summary, setSummary] = useState<SupportSummary | undefined>();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [warranties, setWarranties] = useState<WarrantyInfo[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [packages, setPackages] = useState<DiagnosticPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | undefined>();

  const [ticketType, setTicketType] = useState<SupportTicketType>('technical');
  const [ticketSeverity, setTicketSeverity] = useState<SupportTicketSeverity>('High');
  const [ticketTitle, setTicketTitle] = useState('Gateway/khóa cần hỗ trợ');
  const [ticketDescription, setTicketDescription] = useState('Mô tả hiện tượng, thời điểm xảy ra và thao tác đã thử.');
  const [contactName, setContactName] = useState('Quản lý vận hành');
  const [contactPhone, setContactPhone] = useState('0900 000 000');
  const [attachmentNames, setAttachmentNames] = useState('photo-door.jpg, diagnostic.txt');

  const [taskType, setTaskType] = useState<MaintenanceTaskType>('battery');
  const [taskTitle, setTaskTitle] = useState('Bảo trì khóa định kỳ');
  const [assignee, setAssignee] = useState('Kỹ thuật Aplus');
  const [dueInDays, setDueInDays] = useState('3');
  const [checklist, setChecklist] = useState('Kiểm tra pin\nChạy diagnostic\nXác nhận record sau xử lý');

  const selectedLock: AplusLock | undefined = useMemo(() => locks.find(item => item.id === selectedLockId) ?? locks[0], [locks, selectedLockId]);

  useEffect(() => {
    reloadLocks();
  }, [reloadLocks]);

  useEffect(() => {
    if (!selectedLockId && locks[0]) {
      setSelectedLockId(locks[0].id);
    }
  }, [locks, selectedLockId]);

  const load = async () => {
    setLoading(true);
    const effectiveLockId = selectedLock?.id;
    const [nextSummary, nextTickets, nextWarranty, nextTasks, nextPackages] = await Promise.all([
      MockSupportRepository.getSupportSummary(),
      MockSupportRepository.getSupportTickets(effectiveLockId),
      MockSupportRepository.getWarrantyInfo(effectiveLockId),
      MockSupportRepository.getMaintenanceTasks(effectiveLockId),
      MockSupportRepository.getDiagnosticPackages(effectiveLockId),
    ]);
    setSummary(nextSummary);
    setTickets(nextTickets);
    setWarranties(nextWarranty);
    setTasks(nextTasks);
    setPackages(nextPackages);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLock?.id]);

  const createTicket = async () => {
    if (!selectedLock) {
      return;
    }
    setLoading(true);
    const created = await MockSupportRepository.createSupportTicket({
      lockId: selectedLock.id,
      type: ticketType,
      title: ticketTitle,
      description: ticketDescription,
      severity: ticketSeverity,
      contactName,
      contactPhone,
      attachmentNames: attachmentNames.split(',').map(item => item.trim()).filter(Boolean),
    });
    if (created) {
      setToast(`${t.saved} ${created.id}`);
      await reloadAccessRecords(selectedLock.id);
      await reloadAlerts({lockId: selectedLock.id});
    }
    await load();
  };

  const resolveTicket = async (ticket: SupportTicket) => {
    setLoading(true);
    await MockSupportRepository.resolveSupportTicket(ticket.id, 'Đã xử lý từ UI-70 Support Center.');
    await reloadAccessRecords(ticket.lockId);
    await load();
  };

  const createTask = async () => {
    if (!selectedLock) {
      return;
    }
    setLoading(true);
    const dueDays = Number(dueInDays) || 1;
    await MockSupportRepository.createMaintenanceTask({
      lockId: selectedLock.id,
      type: taskType,
      title: taskTitle,
      assignee,
      dueAt: Date.now() + Math.max(0, dueDays) * 24 * 60 * 60 * 1000,
      checklist: checklist.split(/\r?\n/).map(item => item.trim()).filter(Boolean),
    });
    setToast(t.saved);
    await reloadAccessRecords(selectedLock.id);
    await load();
  };

  const completeTask = async (task: MaintenanceTask) => {
    setLoading(true);
    await MockSupportRepository.completeMaintenanceTask(task.id, 'Đã hoàn tất theo checklist UI-70.');
    await reloadAccessRecords(task.lockId);
    await load();
  };

  const exportPackage = async () => {
    if (!selectedLock) {
      return;
    }
    setLoading(true);
    const pkg = await MockSupportRepository.exportDiagnosticPackage(selectedLock.id);
    if (pkg) {
      setToast(`${t.saved} ${pkg.fileName}`);
      await reloadAccessRecords(selectedLock.id);
    }
    await load();
  };

  const renderTabs = () => (
    <View style={styles.tabRow}>
      {([
        ['tickets', t.tickets],
        ['warranty', t.warranty],
        ['maintenance', t.maintenance],
        ['diagnostic', t.diagnostic],
      ] as Array<[TabKey, string]>).map(([key, label]) => (
        <Pressable key={key} accessibilityRole="button" onPress={() => setActiveTab(key)} style={[styles.tabChip, activeTab === key ? styles.tabChipActive : null]}>
          <AplusText variant="caption" color={activeTab === key ? theme.colors.text : theme.colors.textMuted}>{label}</AplusText>
        </Pressable>
      ))}
    </View>
  );

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={t.title} subtitle={t.subtitle} canGoBack onBack={navigation.goBack} showLogo rightIcon="refresh" onRightPress={load} />

      <AplusCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <AplusIcon name="command" size={46} color={theme.colors.primary} boxed boxSize={76} />
          <View style={styles.flexBlock}>
            <AplusText variant="hero">{t.title}</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>{selectedLock ? `${selectedLock.name} · ${selectedLock.roomName}` : t.subtitle}</AplusText>
            <View style={styles.chipRow}>
              <StatusChip label="UI-70" tone="info" />
              <StatusChip label="redaction" tone="success" />
              <StatusChip label={loading ? 'loading' : 'ready'} tone={loading ? 'warning' : 'success'} />
            </View>
          </View>
        </View>
      </AplusCard>

      <View style={styles.metricGrid}>
        <Metric label={t.openTickets} value={summary?.openTickets ?? 0} tone={(summary?.openTickets ?? 0) ? 'warning' : 'success'} />
        <Metric label={t.warrantyActive} value={summary?.warrantyActive ?? 0} tone="success" />
      </View>
      <View style={styles.metricGrid}>
        <Metric label={t.maintenanceDue} value={summary?.maintenanceDue ?? 0} tone={(summary?.maintenanceDue ?? 0) ? 'warning' : 'success'} />
        <Metric label={t.packages} value={summary?.packagesGenerated ?? 0} tone="info" />
      </View>

      <AplusCard style={styles.cardGap}>
        <AplusText variant="subtitle">{t.selectLock}</AplusText>
        <View style={styles.chipRow}>
          {locks.slice(0, 8).map(lock => (
            <Pressable key={lock.id} accessibilityRole="button" onPress={() => setSelectedLockId(lock.id)} style={[styles.lockChip, selectedLock?.id === lock.id ? styles.lockChipActive : null]}>
              <AplusText variant="caption" color={selectedLock?.id === lock.id ? theme.colors.text : theme.colors.textMuted}>{lock.roomName}</AplusText>
            </Pressable>
          ))}
        </View>
      </AplusCard>

      {renderTabs()}
      {toast ? <StatusChip label={toast} tone="success" /> : null}

      {activeTab === 'tickets' ? (
        <View style={styles.sectionGap}>
          <AplusCard style={styles.cardGap}>
            <AplusText variant="subtitle">{t.createTicket}</AplusText>
            <AplusTextField label={t.ticketTitle} leftIcon="command" value={ticketTitle} onChangeText={setTicketTitle} />
            <AplusTextField label={t.description} leftIcon="alert" value={ticketDescription} onChangeText={setTicketDescription} multiline />
            <View style={styles.optionRow}>
              {ticketTypes.map(item => <OptionChip key={item} value={item} selected={ticketType === item} onPress={setTicketType} />)}
            </View>
            <View style={styles.optionRow}>
              {severityOptions.map(item => <OptionChip key={item} value={item} selected={ticketSeverity === item} onPress={setTicketSeverity} />)}
            </View>
            <AplusTextField label={t.contactName} leftIcon="user" value={contactName} onChangeText={setContactName} />
            <AplusTextField label={t.contactPhone} leftIcon="phone" value={contactPhone} onChangeText={setContactPhone} />
            <AplusTextField label={t.attachments} leftIcon="plus" value={attachmentNames} onChangeText={setAttachmentNames} />
            <AplusButton title={t.create} leftIcon="plus" onPress={createTicket} loading={loading} />
          </AplusCard>

          {tickets.length ? tickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} onResolve={resolveTicket} onOpenLock={id => navigation.navigate('LockDetail', {lockId: id})} />) : (
            <AplusCard><AplusText variant="body">{t.noTickets}</AplusText></AplusCard>
          )}
        </View>
      ) : null}

      {activeTab === 'warranty' ? (
        <View style={styles.sectionGap}>
          <AplusText variant="subtitle">{t.warrantyInfo}</AplusText>
          {warranties.map(warranty => <WarrantyCard key={warranty.id} warranty={warranty} language={locale} t={t} />)}
        </View>
      ) : null}

      {activeTab === 'maintenance' ? (
        <View style={styles.sectionGap}>
          <AplusCard style={styles.cardGap}>
            <AplusText variant="subtitle">{t.newTask}</AplusText>
            <View style={styles.optionRow}>
              {taskTypes.map(item => <OptionChip key={item} value={item} selected={taskType === item} onPress={setTaskType} />)}
            </View>
            <AplusTextField label={t.taskTitle} leftIcon="settings" value={taskTitle} onChangeText={setTaskTitle} />
            <AplusTextField label={t.assignee} leftIcon="user" value={assignee} onChangeText={setAssignee} />
            <AplusTextField label={t.dueInDays} leftIcon="calendar" value={dueInDays} onChangeText={setDueInDays} keyboardType="number-pad" />
            <AplusTextField label={t.checklist} leftIcon="check" value={checklist} onChangeText={setChecklist} multiline />
            <AplusButton title={t.newTask} leftIcon="plus" onPress={createTask} loading={loading} />
          </AplusCard>
          {tasks.map(task => <TaskCard key={task.id} task={task} language={locale} onComplete={completeTask} />)}
        </View>
      ) : null}

      {activeTab === 'diagnostic' ? (
        <View style={styles.sectionGap}>
          <AplusCard style={styles.cardGap}>
            <AplusText variant="subtitle">{t.exportPackage}</AplusText>
            <AplusText variant="caption">{locale === 'vi' ? 'Gói diagnostic chỉ chứa device info, recent commands/records, alerts, OTA logs và app version. Password, PIN, biometric template, face image, source IP được redaction.' : 'The diagnostic package includes device info, recent commands/records, alerts, OTA logs and app version only. Passwords, PINs, biometric templates, face images and source IPs are redacted.'}</AplusText>
            <View style={styles.actionRow}>
              <AplusButton title={t.exportPackage} leftIcon="capability" onPress={exportPackage} loading={loading} style={styles.flexButton} />
              {selectedLock ? <AplusButton title="Diagnostic" leftIcon="firmware" variant="secondary" onPress={() => navigation.navigate('DeviceDiagnostic', {lockId: selectedLock.id})} style={styles.flexButton} /> : null}
            </View>
          </AplusCard>
          {packages.length ? packages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} language={locale} t={t} />) : (
            <AplusCard><AplusText variant="body">{t.noPackages}</AplusText></AplusCard>
          )}
        </View>
      ) : null}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  heroCard: {gap: theme.spacing.md, borderColor: theme.colors.borderStrong},
  heroRow: {flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg},
  flexBlock: {flex: 1, gap: theme.spacing.xs},
  metricGrid: {flexDirection: 'row', gap: theme.spacing.md},
  metricCard: {flex: 1, gap: theme.spacing.sm},
  cardGap: {gap: theme.spacing.md},
  sectionGap: {gap: theme.spacing.md},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  actionRow: {flexDirection: 'row', gap: theme.spacing.md},
  flexButton: {flex: 1},
  rowTop: {flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md},
  tabRow: {flexDirection: 'row', gap: theme.spacing.sm},
  tabChip: {flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface},
  tabChipActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  optionRow: {flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm},
  optionChip: {minHeight: 36, paddingHorizontal: theme.spacing.md, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong},
  optionChipActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  lockChip: {minHeight: 34, paddingHorizontal: theme.spacing.md, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong},
  lockChipActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md, paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  infoValue: {flex: 1, textAlign: 'right', fontWeight: theme.typography.weight.semibold},
  packagePreview: {backgroundColor: theme.colors.surfaceStrong},
});

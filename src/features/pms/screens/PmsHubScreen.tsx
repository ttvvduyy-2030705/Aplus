import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
import {MockPmsRepository} from '@/services/repositories/MockPmsRepository';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {AplusLock} from '@/types/lock';
import type {Room} from '@/types/room';
import type {Booking, BookingImportPreviewRow, BookingStatus, PmsCredentialJob, PmsCredentialMethod, PmsSummary, SelfCheckInSession} from '@/types/pms';

type TabKey = 'calendar' | 'checkin' | 'checkout' | 'import' | 'self';

type Copy = typeof copy.vi;

const copy = {
  vi: {
    title: 'PMS / Self check-in',
    subtitle: 'UI-14/53-57 · booking, check-in/out, import và self check-in',
    hero: 'Quản lý booking khách sạn/căn hộ, check-in tạo quyền mở khóa và check-out thu hồi credential liên quan.',
    calendar: 'Booking calendar',
    checkin: 'Check-in',
    checkout: 'Check-out',
    import: 'Import CSV',
    self: 'Self check-in',
    guestName: 'Tên khách',
    guestPhone: 'Số điện thoại',
    guestEmail: 'Email',
    room: 'Phòng',
    checkInAt: 'Check-in ISO',
    checkOutAt: 'Check-out ISO',
    notes: 'Ghi chú',
    createBooking: 'Tạo booking',
    runCheckIn: 'Check-in tạo quyền',
    runCheckOut: 'Check-out thu hồi quyền',
    lateCheckout: 'Late checkout phút',
    methods: 'Quyền tạo khi check-in',
    password: 'Mật khẩu',
    card: 'Thẻ khách sạn',
    phone: 'Phone auth',
    enableSelf: 'Tạo self check-in link',
    offline: 'Offline/PendingSync',
    preview: 'Preview lỗi',
    commit: 'Import dòng hợp lệ',
    verifySelf: 'Xác minh self check-in',
    empty: 'Chưa có booking phù hợp.',
    noRoom: 'Chưa chọn phòng có khóa.',
    created: 'Đã tạo booking.',
    checkedIn: 'Đã check-in và tạo quyền.',
    checkedOut: 'Đã check-out và thu hồi quyền.',
    imported: 'Đã import booking hợp lệ.',
    reserved: 'Reserved',
    checkedInStatus: 'Checked-in',
    checkedOutStatus: 'Checked-out',
    cancelled: 'Cancelled',
    noShow: 'No-show',
    total: 'Tổng booking',
    due: 'Cần checkout',
    credentials: 'Credential active',
    selfPending: 'Self check-in pending',
    jobs: 'Credential jobs',
    sessions: 'Self check-in sessions',
    selectBooking: 'Chọn booking',
    selectRoomFirst: 'Chọn phòng từ danh sách dưới đây',
  },
  en: {
    title: 'PMS / Self check-in',
    subtitle: 'UI-14/53-57 · booking, check-in/out, import and self check-in',
    hero: 'Manage hotel/apartment bookings, create access credentials at check-in and revoke them at check-out.',
    calendar: 'Booking calendar',
    checkin: 'Check-in',
    checkout: 'Check-out',
    import: 'Import CSV',
    self: 'Self check-in',
    guestName: 'Guest name',
    guestPhone: 'Phone number',
    guestEmail: 'Email',
    room: 'Room',
    checkInAt: 'Check-in ISO',
    checkOutAt: 'Check-out ISO',
    notes: 'Notes',
    createBooking: 'Create booking',
    runCheckIn: 'Check-in and create access',
    runCheckOut: 'Check-out and revoke access',
    lateCheckout: 'Late checkout minutes',
    methods: 'Access methods to create',
    password: 'Password',
    card: 'Hotel card',
    phone: 'Phone auth',
    enableSelf: 'Create self check-in link',
    offline: 'Offline/PendingSync',
    preview: 'Preview errors',
    commit: 'Import valid rows',
    verifySelf: 'Verify self check-in',
    empty: 'No matching bookings yet.',
    noRoom: 'No room with lock selected.',
    created: 'Booking created.',
    checkedIn: 'Checked in and credentials created.',
    checkedOut: 'Checked out and credentials revoked.',
    imported: 'Valid bookings imported.',
    reserved: 'Reserved',
    checkedInStatus: 'Checked-in',
    checkedOutStatus: 'Checked-out',
    cancelled: 'Cancelled',
    noShow: 'No-show',
    total: 'Total bookings',
    due: 'Due checkout',
    credentials: 'Active credentials',
    selfPending: 'Self check-in pending',
    jobs: 'Credential jobs',
    sessions: 'Self check-in sessions',
    selectBooking: 'Select booking',
    selectRoomFirst: 'Select a room from the list below',
  },
};

function statusTone(status: BookingStatus): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (status === 'checkedIn') {
    return 'success';
  }
  if (status === 'reserved') {
    return 'info';
  }
  if (status === 'checkedOut') {
    return 'muted';
  }
  if (status === 'cancelled' || status === 'noShow') {
    return 'danger';
  }
  return 'warning';
}

function statusLabel(status: BookingStatus, t: Copy) {
  if (status === 'reserved') return t.reserved;
  if (status === 'checkedIn') return t.checkedInStatus;
  if (status === 'checkedOut') return t.checkedOutStatus;
  if (status === 'cancelled') return t.cancelled;
  return t.noShow;
}

function fmtDate(ts: number, language: 'vi' | 'en') {
  return new Date(ts).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN');
}

function isoLocal(offsetDays: number, hour = 14) {
  const value = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  value.setHours(hour, 0, 0, 0);
  return value.toISOString().slice(0, 16);
}

function parseIso(value: string) {
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : undefined;
}

function TabButton({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.tabButton, active ? styles.tabButtonActive : null, pressed ? styles.pressed : null]}>
      <AplusText variant="caption" color={active ? theme.colors.text : theme.colors.textMuted}>{label}</AplusText>
    </Pressable>
  );
}

function ToggleChip({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.toggleChip, active ? styles.toggleChipActive : null, pressed ? styles.pressed : null]}>
      <AplusText variant="caption" color={active ? theme.colors.text : theme.colors.textMuted}>{label}</AplusText>
    </Pressable>
  );
}

function SummaryBox({label, value, tone}: {label: string; value: number; tone: 'success' | 'warning' | 'danger' | 'info'}) {
  return (
    <AplusCard style={styles.summaryBox}>
      <StatusChip label={label} tone={tone} />
      <AplusText variant="title">{value}</AplusText>
    </AplusCard>
  );
}

function BookingCard({booking, selected, t, language, onSelect}: {booking: Booking; selected: boolean; t: Copy; language: 'vi' | 'en'; onSelect: () => void}) {
  return (
    <Pressable onPress={onSelect} style={({pressed}) => [styles.bookingCard, selected ? styles.selectedCard : null, pressed ? styles.pressed : null]}>
      <View style={styles.rowTop}>
        <AplusIcon name="calendar" size={26} color={booking.status === 'checkedIn' ? theme.colors.success : theme.colors.primary} boxed />
        <View style={styles.flex}>
          <AplusText variant="body" style={styles.bold}>{booking.guestName}</AplusText>
          <AplusText variant="caption">{booking.code} · {booking.roomName} · {booking.guestPhone}</AplusText>
        </View>
        <StatusChip label={statusLabel(booking.status, t)} tone={statusTone(booking.status)} />
      </View>
      <AplusText variant="caption">{fmtDate(booking.checkInAt, language)} → {fmtDate(booking.checkOutAt, language)}</AplusText>
      <View style={styles.chipWrap}>
        <StatusChip label={booking.lockName} tone="info" />
        <StatusChip label={booking.source} tone="muted" />
        {booking.credentialJobIds.length ? <StatusChip label={`${booking.credentialJobIds.length} jobs`} tone="success" /> : null}
        {booking.selfCheckInSessionId ? <StatusChip label="self check-in" tone="warning" /> : null}
      </View>
    </Pressable>
  );
}

function RoomOption({room, lock, selected, onPress}: {room: Room; lock?: AplusLock; selected: boolean; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.roomOption, selected ? styles.selectedCard : null, pressed ? styles.pressed : null, !lock ? styles.dimmed : null]}>
      <AplusIcon name="hotel" size={22} color={lock ? theme.colors.primary : theme.colors.textSubtle} boxed boxSize={42} />
      <View style={styles.flex}>
        <AplusText variant="caption" style={styles.bold}>{room.roomName}</AplusText>
        <AplusText variant="caption" numberOfLines={1}>{room.buildingName} · {room.floorName} · {lock?.name ?? 'No lock'}</AplusText>
      </View>
    </Pressable>
  );
}

function JobRow({job}: {job: PmsCredentialJob}) {
  const tone = job.status === 'success' ? 'success' : job.status === 'failed' ? 'danger' : job.status === 'revoked' ? 'muted' : 'warning';
  return (
    <View style={styles.previewRow}>
      <StatusChip label={job.method} tone="info" />
      <View style={styles.flex}>
        <AplusText variant="caption" style={styles.bold}>{job.credentialTitle}</AplusText>
        <AplusText variant="caption">{job.message}</AplusText>
      </View>
      <StatusChip label={job.status} tone={tone} />
    </View>
  );
}

function PreviewRow({row}: {row: BookingImportPreviewRow}) {
  return (
    <View style={styles.previewRow}>
      <StatusChip label={`#${row.row}`} tone={row.status === 'valid' || row.status === 'created' ? 'success' : 'danger'} />
      <View style={styles.flex}>
        <AplusText variant="caption" style={styles.bold}>{row.guestName || '—'} · {row.roomName || '—'}</AplusText>
        <AplusText variant="caption">{row.message}</AplusText>
      </View>
      <StatusChip label={row.status} tone={row.status === 'invalid' ? 'danger' : 'success'} />
    </View>
  );
}

function SelfSessionRow({session, onVerify, language}: {session: SelfCheckInSession; onVerify: (id: string) => void; language: 'vi' | 'en'}) {
  return (
    <AplusCard style={styles.itemCard}>
      <View style={styles.rowTop}>
        <AplusIcon name="qr" size={24} color={session.status === 'verified' ? theme.colors.success : theme.colors.primary} boxed />
        <View style={styles.flex}>
          <AplusText variant="body" style={styles.bold}>{session.guestName}</AplusText>
          <AplusText variant="caption">{session.url}</AplusText>
        </View>
        <StatusChip label={session.status} tone={session.status === 'pending' ? 'warning' : session.status === 'verified' ? 'success' : 'muted'} />
      </View>
      <AplusText variant="caption">QR: {session.qrPayload}</AplusText>
      <AplusText variant="caption">Expires: {fmtDate(session.expiresAt, language)}</AplusText>
      <AplusButton title={language === 'en' ? 'Verify mock' : 'Xác minh mock'} leftIcon="check" variant="secondary" disabled={session.status !== 'pending'} onPress={() => onVerify(session.id)} />
    </AplusCard>
  );
}

export function PmsHubScreen() {
  const navigation = useAplusNavigation();
  const {language} = useLanguage();
  const t = language === 'en' ? copy.en : copy.vi;
  const {locks, reloadRooms, rooms, reloadAccessRecords, reloadLocks} = useAppState();
  const [activeTab, setActiveTab] = useState<TabKey>('calendar');
  const [summary, setSummary] = useState<PmsSummary | undefined>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [jobs, setJobs] = useState<PmsCredentialJob[]>([]);
  const [sessions, setSessions] = useState<SelfCheckInSession[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | undefined>();
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
  const [guestName, setGuestName] = useState('Khách PMS demo');
  const [guestPhone, setGuestPhone] = useState('0900 555 777');
  const [guestEmail, setGuestEmail] = useState('guest@example.com');
  const [checkInIso, setCheckInIso] = useState(isoLocal(1, 14));
  const [checkOutIso, setCheckOutIso] = useState(isoLocal(3, 11));
  const [notes, setNotes] = useState('Tự động tạo quyền khi check-in.');
  const [selectedMethods, setSelectedMethods] = useState<PmsCredentialMethod[]>(['password', 'card']);
  const [enableSelf, setEnableSelf] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [lateMinutes, setLateMinutes] = useState('0');
  const [csvText, setCsvText] = useState(MockPmsRepository.sampleImportCsv());
  const [previewRows, setPreviewRows] = useState<BookingImportPreviewRow[]>([]);
  const [message, setMessage] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const roomOptions = useMemo(() => rooms.filter(room => room.lockIds.length > 0), [rooms]);
  const selectedRoom = useMemo(() => roomOptions.find(room => room.id === selectedRoomId) ?? roomOptions[0], [roomOptions, selectedRoomId]);
  const selectedLock = useMemo(() => locks.find(lock => lock.id === selectedRoom?.lockIds[0]), [locks, selectedRoom]);
  const selectedBooking = useMemo(() => bookings.find(booking => booking.id === selectedBookingId) ?? bookings[0], [bookings, selectedBookingId]);

  const reload = useCallback(async () => {
    const [summaryData, bookingData, jobData, sessionData] = await Promise.all([
      MockPmsRepository.getSummary(),
      MockPmsRepository.getBookings(),
      MockPmsRepository.getCredentialJobs(),
      MockPmsRepository.getSelfCheckInSessions(),
    ]);
    setSummary(summaryData);
    setBookings(bookingData);
    setJobs(jobData);
    setSessions(sessionData);
    setSelectedBookingId(prev => prev ?? bookingData[0]?.id);
  }, []);

  useEffect(() => {
    reloadRooms();
    reloadLocks();
    reload();
  }, [reload, reloadLocks, reloadRooms]);

  useEffect(() => {
    if (!selectedRoomId && roomOptions[0]) {
      setSelectedRoomId(roomOptions[0].id);
    }
  }, [roomOptions, selectedRoomId]);

  const toggleMethod = (method: PmsCredentialMethod) => {
    setSelectedMethods(prev => prev.includes(method) ? prev.filter(item => item !== method) : [...prev, method]);
  };

  const createBooking = async () => {
    if (!selectedRoom || !selectedLock) {
      setMessage(t.noRoom);
      return;
    }
    const checkInAt = parseIso(checkInIso);
    const checkOutAt = parseIso(checkOutIso);
    if (!checkInAt || !checkOutAt) {
      setMessage('Invalid ISO time. Example: 2026-05-20T14:00');
      return;
    }
    setLoading(true);
    try {
      const booking = await MockPmsRepository.createBooking({guestName, guestPhone, guestEmail, roomId: selectedRoom.id, lockId: selectedLock.id, checkInAt, checkOutAt, notes});
      setSelectedBookingId(booking.id);
      setMessage(t.created);
      await reload();
      await reloadAccessRecords();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Create booking failed');
    } finally {
      setLoading(false);
    }
  };

  const runCheckIn = async () => {
    if (!selectedBooking) {
      setMessage(t.empty);
      return;
    }
    setLoading(true);
    try {
      await MockPmsRepository.checkInBooking({bookingId: selectedBooking.id, methods: selectedMethods, enableSelfCheckIn: enableSelf, offline: offlineMode});
      setMessage(t.checkedIn);
      await reload();
      await reloadAccessRecords();
      await reloadLocks();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const runCheckOut = async () => {
    if (!selectedBooking) {
      setMessage(t.empty);
      return;
    }
    setLoading(true);
    try {
      await MockPmsRepository.checkOutBooking({bookingId: selectedBooking.id, revokeAllCredentials: true, lateCheckoutMinutes: Number(lateMinutes) || 0});
      setMessage(t.checkedOut);
      await reload();
      await reloadAccessRecords();
      await reloadLocks();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  const previewImport = async () => {
    setPreviewRows(await MockPmsRepository.previewImport(csvText));
  };

  const commitImport = async () => {
    setLoading(true);
    try {
      const rows = await MockPmsRepository.commitImport(csvText);
      setPreviewRows(rows);
      setMessage(t.imported);
      await reload();
      await reloadAccessRecords();
    } finally {
      setLoading(false);
    }
  };

  const verifySelfSession = async (sessionId: string) => {
    await MockPmsRepository.verifySelfCheckInSession(sessionId);
    await reload();
  };

  const selectedJobs = jobs.filter(job => selectedBooking?.credentialJobIds.includes(job.id));
  const selectedSessions = selectedBooking ? sessions.filter(session => session.bookingId === selectedBooking.id) : sessions;

  const renderCalendar = () => (
    <View style={styles.section}>
      <AplusCard style={styles.formCard}>
        <AplusText variant="subtitle">{t.createBooking}</AplusText>
        <AplusText variant="caption">{t.selectRoomFirst}</AplusText>
        <View style={styles.roomGrid}>
          {roomOptions.slice(0, 8).map(room => <RoomOption key={room.id} room={room} lock={locks.find(lock => lock.id === room.lockIds[0])} selected={selectedRoom?.id === room.id} onPress={() => setSelectedRoomId(room.id)} />)}
        </View>
        <View style={styles.formGrid}>
          <AplusTextField label={t.guestName} value={guestName} onChangeText={setGuestName} leftIcon="user" containerStyle={styles.fieldHalf} />
          <AplusTextField label={t.guestPhone} value={guestPhone} onChangeText={setGuestPhone} leftIcon="phone" containerStyle={styles.fieldHalf} keyboardType="phone-pad" />
          <AplusTextField label={t.guestEmail} value={guestEmail} onChangeText={setGuestEmail} leftIcon="email" containerStyle={styles.fieldHalf} />
          <AplusTextField label={t.checkInAt} value={checkInIso} onChangeText={setCheckInIso} leftIcon="calendar" containerStyle={styles.fieldHalf} />
          <AplusTextField label={t.checkOutAt} value={checkOutIso} onChangeText={setCheckOutIso} leftIcon="calendar" containerStyle={styles.fieldHalf} />
          <AplusTextField label={t.notes} value={notes} onChangeText={setNotes} leftIcon="history" containerStyle={styles.fieldHalf} />
        </View>
        <AplusButton title={t.createBooking} leftIcon="plus" onPress={createBooking} loading={loading} />
      </AplusCard>

      <AplusText variant="subtitle">{t.calendar}</AplusText>
      {bookings.length ? bookings.map(booking => <BookingCard key={booking.id} booking={booking} selected={booking.id === selectedBooking?.id} t={t} language={language} onSelect={() => setSelectedBookingId(booking.id)} />) : <AplusText variant="body">{t.empty}</AplusText>}
    </View>
  );

  const renderCheckIn = () => (
    <View style={styles.section}>
      <AplusText variant="subtitle">{t.selectBooking}</AplusText>
      {bookings.filter(item => item.status !== 'checkedOut').map(booking => <BookingCard key={booking.id} booking={booking} selected={booking.id === selectedBooking?.id} t={t} language={language} onSelect={() => setSelectedBookingId(booking.id)} />)}
      <AplusCard style={styles.formCard}>
        <AplusText variant="subtitle">{t.methods}</AplusText>
        <View style={styles.chipWrap}>
          <ToggleChip label={t.password} active={selectedMethods.includes('password')} onPress={() => toggleMethod('password')} />
          <ToggleChip label={t.card} active={selectedMethods.includes('card')} onPress={() => toggleMethod('card')} />
          <ToggleChip label={t.phone} active={selectedMethods.includes('phone')} onPress={() => toggleMethod('phone')} />
          <ToggleChip label={t.enableSelf} active={enableSelf} onPress={() => setEnableSelf(prev => !prev)} />
          <ToggleChip label={t.offline} active={offlineMode} onPress={() => setOfflineMode(prev => !prev)} />
        </View>
        <AplusButton title={t.runCheckIn} leftIcon="check" onPress={runCheckIn} loading={loading} disabled={!selectedBooking || selectedBooking.status === 'checkedOut'} />
      </AplusCard>
      <AplusText variant="subtitle">{t.jobs}</AplusText>
      {selectedJobs.length ? selectedJobs.map(job => <JobRow key={job.id} job={job} />) : <AplusText variant="caption">No job for selected booking.</AplusText>}
    </View>
  );

  const renderCheckOut = () => (
    <View style={styles.section}>
      {bookings.filter(item => item.status === 'checkedIn').map(booking => <BookingCard key={booking.id} booking={booking} selected={booking.id === selectedBooking?.id} t={t} language={language} onSelect={() => setSelectedBookingId(booking.id)} />)}
      <AplusCard style={styles.formCard}>
        <AplusText variant="subtitle">{t.runCheckOut}</AplusText>
        <AplusTextField label={t.lateCheckout} value={lateMinutes} onChangeText={setLateMinutes} leftIcon="calendar" keyboardType="number-pad" />
        <AplusButton title={t.runCheckOut} leftIcon="revoked" variant="danger" onPress={runCheckOut} loading={loading} disabled={!selectedBooking || selectedBooking.status !== 'checkedIn'} />
      </AplusCard>
      {selectedJobs.map(job => <JobRow key={job.id} job={job} />)}
    </View>
  );

  const renderImport = () => (
    <View style={styles.section}>
      <AplusCard style={styles.formCard}>
        <AplusText variant="subtitle">{t.import}</AplusText>
        <AplusTextField label="guest,phone,email,room,checkIn,checkOut" value={csvText} onChangeText={setCsvText} leftIcon="sync" multiline style={styles.textArea} />
        <View style={styles.actionRow}>
          <AplusButton title={t.preview} leftIcon="check" variant="secondary" onPress={previewImport} style={styles.flexButton} />
          <AplusButton title={t.commit} leftIcon="sync" onPress={commitImport} loading={loading} style={styles.flexButton} />
        </View>
      </AplusCard>
      {previewRows.map(row => <PreviewRow key={`${row.row}-${row.status}`} row={row} />)}
    </View>
  );

  const renderSelf = () => (
    <View style={styles.section}>
      <AplusText variant="subtitle">{t.sessions}</AplusText>
      {(selectedSessions.length ? selectedSessions : sessions).map(session => <SelfSessionRow key={session.id} session={session} language={language} onVerify={verifySelfSession} />)}
    </View>
  );

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title={t.title} subtitle={t.subtitle} canGoBack onBack={navigation.goBack} showLogo />
      <AplusCard style={styles.heroCard}>
        <View style={styles.rowTop}>
          <AplusIcon name="hotel" size={42} color={theme.colors.primary} boxed boxSize={72} />
          <View style={styles.flex}>
            <AplusText variant="hero">PMS</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted}>{t.hero}</AplusText>
          </View>
        </View>
      </AplusCard>

      <View style={styles.summaryGrid}>
        <SummaryBox label={t.total} value={summary?.totalBookings ?? 0} tone="info" />
        <SummaryBox label={t.checkin} value={summary?.checkedIn ?? 0} tone="success" />
        <SummaryBox label={t.due} value={summary?.dueCheckout ?? 0} tone="warning" />
        <SummaryBox label={t.selfPending} value={summary?.selfCheckInPending ?? 0} tone="danger" />
      </View>

      {message ? <AplusCard style={styles.messageCard}><AplusText variant="caption" color={theme.colors.warning}>{message}</AplusText></AplusCard> : null}

      <View style={styles.tabRow}>
        <TabButton label={t.calendar} active={activeTab === 'calendar'} onPress={() => setActiveTab('calendar')} />
        <TabButton label={t.checkin} active={activeTab === 'checkin'} onPress={() => setActiveTab('checkin')} />
        <TabButton label={t.checkout} active={activeTab === 'checkout'} onPress={() => setActiveTab('checkout')} />
        <TabButton label={t.import} active={activeTab === 'import'} onPress={() => setActiveTab('import')} />
        <TabButton label={t.self} active={activeTab === 'self'} onPress={() => setActiveTab('self')} />
      </View>

      {activeTab === 'calendar' ? renderCalendar() : null}
      {activeTab === 'checkin' ? renderCheckIn() : null}
      {activeTab === 'checkout' ? renderCheckOut() : null}
      {activeTab === 'import' ? renderImport() : null}
      {activeTab === 'self' ? renderSelf() : null}
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  heroCard: {
    gap: theme.spacing.md,
    borderColor: theme.colors.borderStrong,
    backgroundColor: '#101014',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  flex: {
    flex: 1,
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  summaryBox: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  messageCard: {
    borderColor: theme.colors.warning,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tabButton: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  tabButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  toggleChip: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  toggleChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  section: {
    gap: theme.spacing.md,
  },
  formCard: {
    gap: theme.spacing.md,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  fieldHalf: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  roomOption: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: 74,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceStrong,
    padding: theme.spacing.md,
  },
  bookingCard: {
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  chipWrap: {
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
  previewRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  itemCard: {
    gap: theme.spacing.md,
  },
  textArea: {
    minHeight: 112,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.md,
  },
  dimmed: {
    opacity: 0.55,
  },
  pressed: {
    transform: [{scale: 0.985}],
    opacity: 0.88,
  },
});

import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {StatusChip} from '@/components/base/StatusChip';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {RoomImportPreviewRow} from '@/types/room';

const sampleCsv = 'Toà S1,Tầng 5,521,Căn hộ 521\nHotel Tower,Tầng 8,803,Phòng khách sạn 803\nVăn phòng chính,Tầng 8,M-03,Meeting Ruby';

function toneFor(row: RoomImportPreviewRow) {
  if (row.status === 'created' || row.status === 'valid') {
    return 'success' as const;
  }
  if (row.status === 'duplicate') {
    return 'warning' as const;
  }
  return 'danger' as const;
}

export function RoomImportScreen() {
  const navigation = useAplusNavigation();
  const {previewRoomImport, commitRoomImport, reloadRooms} = useAppState();
  const [csvText, setCsvText] = useState(sampleCsv);
  const [rows, setRows] = useState<RoomImportPreviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  const handlePreview = async () => {
    setLoading(true);
    setRows(await previewRoomImport(csvText));
    setMessage(undefined);
    setLoading(false);
  };

  const handleCommit = async () => {
    setLoading(true);
    const result = await commitRoomImport(csvText);
    setRows(result);
    await reloadRooms();
    const created = result.filter(row => row.status === 'created').length;
    setMessage(`Đã tạo ${created} phòng. Dòng duplicate/invalid không ghi vào dữ liệu.`);
    setLoading(false);
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Import Excel phòng/người dùng" subtitle="UI-56 · Preview lỗi trước khi ghi" canGoBack onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">CSV mock thay cho Excel</AplusText>
        <AplusText variant="body" color={theme.colors.textMuted}>Mỗi dòng gồm: building,floor,roomNo,roomName. Preview sẽ chặn thiếu cột, sai tầng/toà và roomNo trùng trong cùng tầng.</AplusText>
        <StatusChip label="Không ghi nửa vời" tone="info" />
      </AplusCard>

      <AplusTextField
        label="Dữ liệu import"
        value={csvText}
        onChangeText={setCsvText}
        leftIcon="sync"
        multiline
        style={styles.importInput}
      />

      <View style={styles.actionRow}>
        <AplusButton title="Preview" leftIcon="refresh" variant="secondary" onPress={handlePreview} loading={loading} style={styles.flexButton} />
        <AplusButton title="Ghi dòng hợp lệ" leftIcon="check" onPress={handleCommit} loading={loading} disabled={rows.length === 0 && !csvText.trim()} style={styles.flexButton} />
      </View>

      {message ? <AplusCard style={styles.messageCard}><AplusText variant="caption">{message}</AplusText></AplusCard> : null}

      <View style={styles.list}>
        {rows.map(row => (
          <AplusCard key={`${row.line}-${row.roomNo}-${row.status}`} style={styles.rowCard}>
            <View style={styles.rowHeader}>
              <AplusText variant="body" style={styles.bold}>Dòng {row.line}: {row.roomNo}</AplusText>
              <StatusChip label={row.status} tone={toneFor(row)} />
            </View>
            <AplusText variant="caption">{row.buildingName} · {row.floorName} · {row.roomName}</AplusText>
            {row.error ? <AplusText variant="caption" color={theme.colors.warning}>{row.error}</AplusText> : null}
          </AplusCard>
        ))}
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {gap: theme.spacing.lg},
  card: {gap: theme.spacing.md},
  importInput: {minHeight: 130, textAlignVertical: 'top', paddingVertical: theme.spacing.md},
  actionRow: {flexDirection: 'row', gap: theme.spacing.md},
  flexButton: {flex: 1},
  messageCard: {borderColor: theme.colors.primary},
  list: {gap: theme.spacing.md},
  rowCard: {gap: theme.spacing.sm},
  rowHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md},
  bold: {fontWeight: theme.typography.weight.bold},
});

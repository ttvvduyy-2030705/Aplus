import React from 'react';
import {Modal, Pressable, StyleSheet, View} from 'react-native';
import {theme} from '@/theme/theme';
import {AplusButton} from './AplusButton';
import {AplusCard} from './AplusCard';
import {AplusText} from './AplusText';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({visible, title, message, confirmText = 'Xác nhận', cancelText = 'Huỷ', destructive, onCancel, onConfirm}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={() => undefined}>
          <AplusCard style={styles.card}>
            <AplusText variant="title" align="center">{title}</AplusText>
            <AplusText variant="body" color={theme.colors.textMuted} align="center">{message}</AplusText>
            <View style={styles.actions}>
              <AplusButton title={cancelText} variant="ghost" onPress={onCancel} style={styles.actionButton} />
              <AplusButton title={confirmText} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} style={styles.actionButton} />
            </View>
          </AplusCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  dialog: {
    width: '100%',
  },
  card: {
    gap: theme.spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});

import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {BaseScreen} from '@/components/base/BaseScreen';
import {AplusButton} from '@/components/base/AplusButton';
import {AplusCard} from '@/components/base/AplusCard';
import {AplusHeader} from '@/components/base/AplusHeader';
import {AplusIcon} from '@/components/base/AplusIcon';
import {AplusText} from '@/components/base/AplusText';
import {AplusTextField} from '@/components/base/AplusTextField';
import {StatusChip} from '@/components/base/StatusChip';
import {useAplusNavigation} from '@/navigation/NavigationContext';
import {useAppState} from '@/state/AppStateContext';
import {theme} from '@/theme/theme';
import type {AppLanguageCode, BrandingConfig} from '@/types/account';

export function BrandingSettingsScreen() {
  const navigation = useAplusNavigation();
  const {
    currentLanguage,
    localizationResources,
    brandingConfig,
    reloadAccountSecurity,
    changeLanguage,
    updateBrandingConfig,
  } = useAppState();
  const [draft, setDraft] = useState<BrandingConfig | undefined>();
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    reloadAccountSecurity();
  }, [reloadAccountSecurity]);

  useEffect(() => {
    setDraft(brandingConfig);
  }, [brandingConfig]);

  const updateDraft = (patch: Partial<BrandingConfig>) => {
    setDraft(prev => prev ? {...prev, ...patch} : prev);
  };

  const save = async () => {
    if (!draft) {
      return;
    }
    await updateBrandingConfig({
      projectName: draft.projectName,
      systemName: draft.systemName,
      hotline: draft.hotline,
      termsUrl: draft.termsUrl,
      privacyUrl: draft.privacyUrl,
    });
    setMessage('Đã lưu branding mock cho dự án.');
  };

  const selectLanguage = async (language: AppLanguageCode) => {
    await changeLanguage(language);
    setMessage(language === 'vi' ? 'Đã chuyển toàn bộ app sang Tiếng Việt.' : 'Switched the whole app to English.');
  };

  return (
    <BaseScreen contentStyle={styles.container}>
      <AplusHeader title="Ngôn ngữ & Branding" subtitle="UI-18 · localization và nhận diện dự án" canGoBack onBack={navigation.goBack} showLogo />

      <AplusCard style={styles.heroCard}>
        <AplusIcon name="settings" size={48} color={theme.colors.primary} boxed boxSize={84} />
        <AplusText variant="hero" align="center">{draft?.systemName ?? 'Aplus Lock'}</AplusText>
        <AplusText variant="body" align="center" color={theme.colors.textMuted}>Không hardcode string: chuẩn bị tài nguyên Việt/Anh và branding theo dự án.</AplusText>
        <View style={styles.chipRow}>
          <StatusChip label={currentLanguage === 'vi' ? 'Tiếng Việt' : 'English'} tone="info" />
          <StatusChip label={draft?.logoName ?? 'Logo đen'} tone="success" />
        </View>
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Ngôn ngữ</AplusText>
        <AplusText variant="caption">Bấm English hoặc Tiếng Việt để đổi ngôn ngữ toàn app ngay lập tức: tabbar, header, button, label, placeholder và các status chip dùng chung.</AplusText>
        <View style={styles.languageList}>
          {localizationResources.map(resource => {
            const selected = currentLanguage === resource.language;
            return (
              <Pressable key={resource.language} accessibilityRole="button" onPress={() => selectLanguage(resource.language)} style={[styles.languageItem, selected ? styles.selected : null]}>
                <View style={styles.languageText}>
                  <AplusText variant="body" style={styles.bold}>{resource.label}</AplusText>
                  <AplusText variant="caption">{resource.completion}% strings · {Object.keys(resource.strings).join(', ')}</AplusText>
                </View>
                <StatusChip label={selected ? 'Đang dùng' : 'Chọn'} tone={selected ? 'success' : 'muted'} />
              </Pressable>
            );
          })}
        </View>
      </AplusCard>

      <AplusCard style={styles.card}>
        <AplusText variant="subtitle">Branding dự án</AplusText>
        <AplusTextField label="Tên dự án" leftIcon="home" value={draft?.projectName ?? ''} onChangeText={projectName => updateDraft({projectName})} />
        <AplusTextField label="Tên hệ thống" leftIcon="lock" value={draft?.systemName ?? ''} onChangeText={systemName => updateDraft({systemName})} />
        <AplusTextField label="Hotline" leftIcon="phone" keyboardType="phone-pad" value={draft?.hotline ?? ''} onChangeText={hotline => updateDraft({hotline})} />
        <AplusTextField label="Điều khoản" leftIcon="shield" value={draft?.termsUrl ?? ''} onChangeText={termsUrl => updateDraft({termsUrl})} />
        <AplusTextField label="Chính sách bảo mật" leftIcon="shield" value={draft?.privacyUrl ?? ''} onChangeText={privacyUrl => updateDraft({privacyUrl})} />
        <View style={styles.logoPreview}>
          <AplusIcon name="lock" size={28} color={theme.colors.primary} boxed boxSize={54} />
          <View style={styles.logoText}>
            <AplusText variant="body" style={styles.bold}>Logo app nền đen</AplusText>
            <AplusText variant="caption">Giữ đúng yêu cầu bạn đã nhắc: logo không bị đổi sang nền trắng.</AplusText>
          </View>
        </View>
        {message ? <AplusText variant="caption" color={theme.colors.success}>{message}</AplusText> : null}
        <AplusButton title="Lưu branding" leftIcon="check" onPress={save} />
      </AplusCard>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  heroCard: {
    alignItems: 'center',
    gap: theme.spacing.md,
    borderColor: theme.colors.borderStrong,
  },
  card: {
    gap: theme.spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  languageList: {
    gap: theme.spacing.sm,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceStrong,
  },
  selected: {
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.primarySoft,
  },
  languageText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  logoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#050505',
  },
  logoText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  bold: {
    fontWeight: theme.typography.weight.bold,
  },
});

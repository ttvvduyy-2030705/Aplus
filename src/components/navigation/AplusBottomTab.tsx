import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {theme} from '@/theme/theme';
import {AplusText} from '@/components/base/AplusText';
import {AplusIcon, type AplusIconName} from '@/components/base/AplusIcon';
import type {MainTabRouteName} from '@/navigation/routes';

type TabItem = {
  route: MainTabRouteName;
  label: string;
  icon: AplusIconName;
};

type Props = {
  activeTab: MainTabRouteName;
  onChange: (tab: MainTabRouteName) => void;
};

const tabs: TabItem[] = [
  {route: 'Home', label: 'Nhà', icon: 'home'},
  {route: 'Access', label: 'Chìa khoá', icon: 'key'},
  {route: 'Activity', label: 'Lịch sử', icon: 'history'},
  {route: 'MoreHub', label: 'Thêm', icon: 'more'},
  {route: 'Profile', label: 'Tôi', icon: 'user'},
];

export function AplusBottomTab({activeTab, onChange}: Props) {
  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        const active = activeTab === tab.route;
        return (
          <Pressable key={tab.route} accessibilityRole="button" onPress={() => onChange(tab.route)} style={[styles.item, active ? styles.itemActive : null]}>
            <AplusIcon name={tab.icon} size={23} color={active ? theme.colors.primary : theme.colors.textMuted} />
            <AplusText variant="caption" color={active ? theme.colors.text : theme.colors.textMuted}>{tab.label}</AplusText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSoft,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  item: {
    flex: 1,
    minHeight: 56,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  itemActive: {
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
});

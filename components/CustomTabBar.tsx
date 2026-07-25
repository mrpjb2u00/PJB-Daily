import React from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useCalendarContext } from '@/contexts/CalendarContext';
import { getLocalTodayDateString } from '@/utils/date';

export const TAB_BAR_HEIGHT = 60;

const TAB_CONFIG: Record<string, { label: string; icon: string; iconFocused: string }> = {
  calendar: { label: 'Calendar', icon: 'calendar-outline', iconFocused: 'calendar' },
  index:    { label: 'To-Dos',   icon: 'checkbox-outline',  iconFocused: 'checkbox' },
  notes:    { label: 'Notes',    icon: 'document-text-outline', iconFocused: 'document-text' },
  profile:  { label: 'Profile',  icon: 'person-outline',    iconFocused: 'person' },
};

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme, isDark } = useTheme();
  const { selectedDate } = useCalendarContext();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';

  const activeRouteName = state.routes[state.index]?.name ?? '';

  const handleAddPress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activeRouteName === 'notes') {
      router.push('/edit-note');
    } else if (activeRouteName === 'calendar') {
      router.push({ pathname: '/add-task', params: { defaultDate: selectedDate } });
    } else {
      const today = getLocalTodayDateString();
      router.push({ pathname: '/add-task', params: { defaultDate: today } });
    }
  };

  const renderTab = (routeIndex: number) => {
    const route = state.routes[routeIndex];
    if (!route) return null;

    const isFocused = state.index === routeIndex;
    const color = isFocused ? theme.accent : theme.textTertiary;
    const cfg = TAB_CONFIG[route.name] ?? { label: route.name, icon: 'ellipse-outline', iconFocused: 'ellipse' };
    const iconName = (isFocused ? cfg.iconFocused : cfg.icon) as React.ComponentProps<typeof Ionicons>['name'];

    const onPress = () => {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        style={styles.tabItem}
        accessibilityRole="button"
        accessibilityLabel={cfg.label}
        accessibilityState={isFocused ? { selected: true } : {}}
      >
        <Ionicons name={iconName} size={22} color={color} />
        <Text style={[styles.tabLabel, { color, fontFamily: 'Inter_500Medium' }]}>
          {cfg.label}
        </Text>
      </Pressable>
    );
  };

  const bottomPad = Platform.OS === 'web' ? 8 : insets.bottom;
  const showAdd = activeRouteName !== 'profile';

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: bottomPad,
          borderTopColor: theme.border,
        },
      ]}
    >
      {isIOS && !isDark ? (
        <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#0F0F0F' : '#FFFFFF' }]} />
      )}

      {showAdd ? (
        <View style={styles.row}>
          <View style={styles.side}>
            {renderTab(0)}
            {renderTab(1)}
          </View>

          <Pressable
            onPress={handleAddPress}
            style={({ pressed }) => [
              styles.addWrap,
              { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
            accessibilityLabel="Add"
            accessibilityRole="button"
            testID="tab-add-button"
          >
            <LinearGradient
              colors={[theme.gradientStart, theme.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButton}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </LinearGradient>
          </Pressable>

          <View style={styles.side}>
            {renderTab(2)}
            {renderTab(3)}
          </View>
        </View>
      ) : (
        <View style={styles.rowFlat}>
          {renderTab(0)}
          {renderTab(1)}
          {renderTab(2)}
          {renderTab(3)}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  row: {
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowFlat: {
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    height: '100%',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_BAR_HEIGHT,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
  },
  addWrap: {
    marginHorizontal: 8,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
});

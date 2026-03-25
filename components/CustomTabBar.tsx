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
import { useAuth } from '@/contexts/AuthContext';

export const TAB_BAR_HEIGHT = 60;

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme, isDark } = useTheme();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';

  const activeRouteName = state.routes[state.index]?.name ?? '';

  const handleAddPress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activeRouteName === 'notes') {
      router.push('/edit-note');
    } else {
      router.push('/add-task');
    }
  };

  const handleLogout = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logout();
  };

  const renderTab = (routeIndex: number) => {
    const route = state.routes[routeIndex];
    if (!route) return null;

    const isFocused = state.index === routeIndex;
    const color = isFocused ? theme.accent : theme.textTertiary;

    let iconName: React.ComponentProps<typeof Ionicons>['name'];
    let label: string;

    if (route.name === 'notes') {
      iconName = isFocused ? 'document-text' : 'document-text-outline';
      label = 'Notes';
    } else if (route.name === 'profile') {
      iconName = isFocused ? 'person' : 'person-outline';
      label = 'Profile';
    } else {
      iconName = isFocused ? 'checkbox' : 'checkbox-outline';
      label = 'To-Dos';
    }

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
        accessibilityLabel={label}
        accessibilityState={isFocused ? { selected: true } : {}}
      >
        <Ionicons name={iconName} size={22} color={color} />
        <Text style={[styles.tabLabel, { color, fontFamily: 'Inter_500Medium' }]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  const bottomPad = Platform.OS === 'web' ? 8 : insets.bottom;

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
        <BlurView
          intensity={100}
          tint="light"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? '#0F0F0F' : '#FFFFFF' },
          ]}
        />
      )}

      <View style={styles.row}>
        <View style={styles.side}>
          {renderTab(0)}
          {renderTab(1)}
        </View>

        {activeRouteName === 'profile' ? (
          <View style={styles.addWrap} pointerEvents="none">
            <View style={styles.addButtonSpacer} />
          </View>
        ) : (
          <Pressable
            onPress={handleAddPress}
            style={({ pressed }) => [
              styles.addWrap,
              {
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.92 : 1 }],
              },
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
        )}

        <View style={styles.side}>
          {renderTab(2)}
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.tabItem,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Logout"
            testID="tab-logout-button"
          >
            <Ionicons name="log-out-outline" size={22} color={theme.destructive} />
            <Text style={[styles.tabLabel, { color: theme.destructive, fontFamily: 'Inter_500Medium' }]}>
              Logout
            </Text>
          </Pressable>
        </View>
      </View>
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
    height: '100%',
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
  addButtonSpacer: {
    width: 52,
    height: 52,
  },
});

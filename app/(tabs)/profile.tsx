import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useTheme();
  const { user } = useAuth();

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const handleThemeToggle = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    toggleTheme();
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View
        style={[
          styles.header,
          {
            paddingTop: (Platform.OS === 'web' ? webTopInset : Math.max(insets.top, 24)) + 12,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary, fontFamily: 'Inter_500Medium' }]}>
            Your account
          </Text>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
            Profile
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.avatarRow]}>
          <LinearGradient
            colors={[theme.gradientStart, theme.gradientEnd] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarCircle}
          >
            <Text style={[styles.avatarInitial, { fontFamily: 'Inter_700Bold' }]}>
              {user?.username?.charAt(0).toUpperCase() || '?'}
            </Text>
          </LinearGradient>
          <View style={styles.avatarInfo}>
            <Text style={[styles.avatarName, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
              {user?.username}
            </Text>
            <Text style={[styles.avatarEmail, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              {user?.email}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
          Preferences
        </Text>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable
            onPress={handleThemeToggle}
            style={({ pressed }) => [
              styles.row,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={[styles.rowIcon, { backgroundColor: theme.surfaceSecondary }]}>
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={18}
                color={isDark ? theme.gradientEnd : theme.gradientStart}
              />
            </View>
            <Text style={[styles.rowLabel, { color: theme.text, fontFamily: 'Inter_500Medium' }]}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
            <View style={[styles.themeIndicator, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '40', borderWidth: 1 }]}>
              <Text style={[styles.themeIndicatorText, { color: theme.accent, fontFamily: 'Inter_600SemiBold' }]}>
                {isDark ? 'ON' : 'OFF'}
              </Text>
            </View>
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
          Account
        </Text>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.row, styles.rowStatic]}>
            <View style={[styles.rowIcon, { backgroundColor: theme.surfaceSecondary }]}>
              <Ionicons name="person-outline" size={18} color={theme.accent} />
            </View>
            <View style={styles.rowTextGroup}>
              <Text style={[styles.rowMeta, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                Username
              </Text>
              <Text style={[styles.rowLabel, { color: theme.text, fontFamily: 'Inter_500Medium' }]}>
                {user?.username}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={[styles.row, styles.rowStatic]}>
            <View style={[styles.rowIcon, { backgroundColor: theme.surfaceSecondary }]}>
              <Ionicons name="mail-outline" size={18} color={theme.accent} />
            </View>
            <View style={styles.rowTextGroup}>
              <Text style={[styles.rowMeta, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                Email
              </Text>
              <Text style={[styles.rowLabel, { color: theme.text, fontFamily: 'Inter_500Medium' }]}>
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 28,
    color: '#fff',
  },
  avatarInfo: {
    flex: 1,
    gap: 4,
  },
  avatarName: {
    fontSize: 20,
  },
  avatarEmail: {
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowStatic: {
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextGroup: {
    flex: 1,
    gap: 2,
  },
  rowMeta: {
    fontSize: 11,
  },
  rowLabel: {
    fontSize: 15,
    flex: 1,
  },
  themeIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  themeIndicatorText: {
    fontSize: 11,
  },
  divider: {
    height: 1,
    marginLeft: 64,
  },
});

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  Switch,
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
  const { user, logout } = useAuth();

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const topPad = Platform.OS === 'web' ? webTopInset : Math.max(insets.top, 24);
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 20) + 16;

  const initial = user?.username?.charAt(0).toUpperCase() || '?';

  const handleThemeToggle = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    toggleTheme();
  };

  const handleLogout = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logout();
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── PROFILE HEADER CARD ── */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <LinearGradient
            colors={[theme.gradientStart + '22', theme.gradientEnd + '10']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCardGradient}
          >
            <LinearGradient
              colors={[theme.gradientStart, theme.gradientEnd] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarCircle}
            >
              <Text style={[styles.avatarInitial, { fontFamily: 'Inter_700Bold' }]}>
                {initial}
              </Text>
            </LinearGradient>

            <Text style={[styles.profileName, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
              {user?.username || 'User'}
            </Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              {user?.email || ''}
            </Text>
          </LinearGradient>
        </View>

        {/* ── PREFERENCES ── */}
        <SectionLabel label="Preferences" theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable
            onPress={handleThemeToggle}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: isDark ? '#3A2A00' : '#FFF4E6' }]}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny-outline'}
                size={18}
                color={isDark ? '#F4C68A' : '#E8734A'}
              />
            </View>
            <Text style={[styles.rowLabel, { color: theme.text, fontFamily: 'Inter_500Medium' }]}>
              Dark Mode
            </Text>
            <Switch
              value={isDark}
              onValueChange={handleThemeToggle}
              trackColor={{ false: theme.border, true: theme.accent + 'CC' }}
              thumbColor={Platform.OS === 'android' ? (isDark ? theme.accent : theme.surface) : undefined}
            />
          </Pressable>
        </View>

        {/* ── ACCOUNT ── */}
        <SectionLabel label="Account" theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: theme.accent + '15' }]}>
              <Ionicons name="person-outline" size={18} color={theme.accent} />
            </View>
            <View style={styles.rowTextStack}>
              <Text style={[styles.rowMeta, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                Username
              </Text>
              <Text style={[styles.rowValue, { color: theme.text, fontFamily: 'Inter_500Medium' }]}>
                {user?.username || '—'}
              </Text>
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: theme.border, marginLeft: 60 }]} />

          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: theme.accent + '15' }]}>
              <Ionicons name="mail-outline" size={18} color={theme.accent} />
            </View>
            <View style={styles.rowTextStack}>
              <Text style={[styles.rowMeta, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                Email
              </Text>
              <Text style={[styles.rowValue, { color: theme.text, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>
                {user?.email || '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── SESSION ── */}
        <SectionLabel label="Session" theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.destructive + '35' }]}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
            testID="profile-logout-button"
            accessibilityRole="button"
            accessibilityLabel="Sign Out"
          >
            <View style={[styles.iconWrap, { backgroundColor: theme.destructive + '15' }]}>
              <Ionicons name="log-out-outline" size={18} color={theme.destructive} />
            </View>
            <Text style={[styles.rowLabel, { color: theme.destructive, fontFamily: 'Inter_600SemiBold' }]}>
              Sign Out
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.destructive + '80'} />
          </Pressable>
        </View>

        <Text style={[styles.footerText, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
          To-Dos & Notes · PJBStudios
        </Text>

      </ScrollView>
    </View>
  );
}

function SectionLabel({ label, theme }: { label: string; theme: any }) {
  return (
    <Text style={[styles.sectionLabel, { color: theme.textTertiary, fontFamily: 'Inter_600SemiBold' }]}>
      {label.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },

  /* Profile card */
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 28,
  },
  profileCardGradient: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 20,
    gap: 6,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarInitial: {
    fontSize: 34,
    color: '#fff',
  },
  profileName: {
    fontSize: 22,
    lineHeight: 28,
  },
  profileEmail: {
    fontSize: 14,
    lineHeight: 18,
  },

  /* Section label */
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.1,
    marginBottom: 8,
    marginLeft: 2,
  },

  /* Card */
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
  },

  /* Row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
  },
  rowTextStack: {
    flex: 1,
    gap: 2,
  },
  rowMeta: {
    fontSize: 11,
  },
  rowValue: {
    fontSize: 15,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },

  /* Footer */
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});

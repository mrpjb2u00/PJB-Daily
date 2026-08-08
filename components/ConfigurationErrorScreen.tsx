import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AppCard } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import type { AppEnvState } from '@/lib/env';

interface ConfigurationErrorScreenProps {
  config: AppEnvState;
}

export default function ConfigurationErrorScreen({ config }: ConfigurationErrorScreenProps) {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppCard padding="large" radius="panel" style={styles.card}>
        <View style={[styles.iconWrap, { backgroundColor: theme.destructive + '15' }]}>
          <Ionicons name="alert-circle-outline" size={30} color={theme.destructive} />
        </View>
        <Text style={[styles.title, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
          PJB Daily could not start
        </Text>
        <Text style={[styles.message, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          PJB Daily could not start because its app configuration is incomplete. Please reinstall or contact support.
        </Text>
        {__DEV__ && !config.valid && (
          <Text style={[styles.devHint, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
            Development note: required public Supabase configuration is missing, malformed, or still set to placeholder values.
          </Text>
        )}
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  devHint: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});

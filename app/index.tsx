import React from 'react';
import {
  View,
  ActivityIndicator,
} from 'react-native';
import { Redirect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import WelcomeContent from '@/components/WelcomeContent';

export default function SplashScreen() {
  const { theme } = useTheme();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/calendar" />;
  }

  return <WelcomeContent />;
}

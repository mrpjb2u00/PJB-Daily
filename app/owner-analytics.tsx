import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppCard } from '@/components/ui';
import { Layout, Spacing, Typography } from '@/constants/design';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerAuthorization } from '@/contexts/OwnerAuthorizationContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function OwnerAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const {
    isOwner,
    isOwnerLoading,
    ownerAuthorizationError,
    refreshOwnerAuthorization,
  } = useOwnerAuthorization();
  const [routeRevalidating, setRouteRevalidating] = useState(true);
  const topPad = Math.max(insets.top, 24) + Spacing[8];
  const bottomPad = Math.max(insets.bottom, Layout.nativeBottomInsetFallback) + Spacing[24];

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (authLoading || !user) {
        setRouteRevalidating(false);
        return () => {
          active = false;
        };
      }

      setRouteRevalidating(true);
      refreshOwnerAuthorization().finally(() => {
        if (active) {
          setRouteRevalidating(false);
        }
      });

      return () => {
        active = false;
      };
    }, [authLoading, refreshOwnerAuthorization, user])
  );

  if (!authLoading && !user) {
    return <Redirect href="/" />;
  }

  const handleBack = () => {
    router.replace('/(tabs)/profile');
  };

  const renderContent = () => {
    if (authLoading || isOwnerLoading || routeRevalidating) {
      return (
        <AppCard style={styles.stateCard}>
          <ActivityIndicator color={theme.accent} size="large" />
          <Text style={[styles.stateTitle, { color: theme.text }]}>
            Checking owner access
          </Text>
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>
            Verifying whether this account can view owner tools.
          </Text>
        </AppCard>
      );
    }

    if (!isOwner) {
      return (
        <AppCard style={styles.stateCard}>
          <View style={[styles.iconCircle, { backgroundColor: theme.surfaceSecondary }]}>
            <Ionicons name="lock-closed-outline" size={28} color={theme.textSecondary} />
          </View>
          <Text style={[styles.stateTitle, { color: theme.text }]}>
            Owner tools unavailable
          </Text>
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>
            This account does not have owner access.
          </Text>
          {!!ownerAuthorizationError && (
            <Text style={[styles.errorText, { color: theme.destructive }]}>
              Owner access could not be verified right now.
            </Text>
          )}
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Return to Profile"
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.accent, opacity: pressed ? 0.82 : 1 },
            ]}
          >
            <Text style={styles.primaryButtonText}>Return to Profile</Text>
          </Pressable>
        </AppCard>
      );
    }

    return (
      <AppCard style={styles.placeholderCard}>
        <View style={[styles.iconCircle, { backgroundColor: theme.accent + '16' }]}>
          <Ionicons name="analytics-outline" size={30} color={theme.accent} />
        </View>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          Aggregate analytics are being prepared.
        </Text>
        <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
          This owner-only area will show privacy-conscious application usage summaries after the analytics foundation is implemented.
        </Text>
        <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
          Individual note contents, to-do contents, profile details, email addresses, and personal user data will not be displayed here.
        </Text>
      </AppCard>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Return to Profile"
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: theme.textTertiary }]}>
              OWNER TOOLS
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Owner Analytics
            </Text>
          </View>
        </View>

        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  bodyText: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  cardTitle: {
    ...Typography.sectionTitle,
    textAlign: 'center',
  },
  content: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.screenHorizontal,
    width: '100%',
    maxWidth: 640,
  },
  errorText: {
    ...Typography.caption,
    textAlign: 'center',
  },
  eyebrow: {
    ...Typography.overline,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing[12],
    marginBottom: Spacing[20],
  },
  headerText: {
    flex: 1,
    gap: Spacing[2],
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  placeholderCard: {
    alignItems: 'center',
    gap: Spacing[14],
    padding: Spacing[20],
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    marginTop: Spacing[4],
    paddingHorizontal: Spacing[18],
  },
  primaryButtonText: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  screen: {
    flex: 1,
  },
  stateCard: {
    alignItems: 'center',
    gap: Spacing[12],
    padding: Spacing[24],
  },
  stateText: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  stateTitle: {
    ...Typography.sectionTitle,
    textAlign: 'center',
  },
  title: {
    ...Typography.screenTitle,
  },
});

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  fetchOwnerAnalyticsSummary,
  OWNER_ANALYTICS_ERROR,
  type OwnerAnalyticsSummary,
} from '@/lib/ownerAnalyticsService';

type MetricTone = 'accent' | 'secondary' | 'default' | 'success';

interface MetricItem {
  label: string;
  value: string;
  tone?: MetricTone;
}

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

function formatCount(value: number): string {
  return numberFormatter.format(value);
}

function formatPercent(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
  })}%`;
}

function formatRefreshedAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

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
  const analyticsRequestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const [routeRevalidating, setRouteRevalidating] = useState(true);
  const [summary, setSummary] = useState<OwnerAnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsRefreshing, setAnalyticsRefreshing] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const topPad = Math.max(insets.top, 24) + Spacing[8];
  const bottomPad = Math.max(insets.bottom, Layout.nativeBottomInsetFallback) + Spacing[24];

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      analyticsRequestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    setSummary(null);
    setAnalyticsError(null);
    setAnalyticsLoading(false);
    setAnalyticsRefreshing(false);
    analyticsRequestIdRef.current += 1;
  }, [user?.id]);

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

  const loadAnalytics = useCallback(async (mode: 'initial' | 'manual') => {
    const requestId = analyticsRequestIdRef.current + 1;
    analyticsRequestIdRef.current = requestId;
    const isManual = mode === 'manual';

    setAnalyticsError(null);
    if (isManual) {
      setAnalyticsRefreshing(true);
    } else {
      setAnalyticsLoading(true);
    }

    try {
      const nextSummary = await fetchOwnerAnalyticsSummary();
      if (!mountedRef.current || analyticsRequestIdRef.current !== requestId) return;
      setSummary(nextSummary);
    } catch {
      if (!mountedRef.current || analyticsRequestIdRef.current !== requestId) return;
      setAnalyticsError(OWNER_ANALYTICS_ERROR);
      if (!summary) {
        setSummary(null);
      }
    } finally {
      if (mountedRef.current && analyticsRequestIdRef.current === requestId) {
        setAnalyticsLoading(false);
        setAnalyticsRefreshing(false);
      }
    }
  }, [summary]);

  useEffect(() => {
    if (authLoading || isOwnerLoading || routeRevalidating || !user || !isOwner) return;
    if (summary || analyticsLoading || analyticsRefreshing || analyticsError) return;

    loadAnalytics('initial');
  }, [
    analyticsError,
    analyticsLoading,
    analyticsRefreshing,
    authLoading,
    isOwner,
    isOwnerLoading,
    loadAnalytics,
    routeRevalidating,
    summary,
    user,
  ]);

  if (!authLoading && !user) {
    return <Redirect href="/" />;
  }

  const handleBack = () => {
    router.replace('/(tabs)/profile');
  };

  const handleRefresh = () => {
    if (analyticsLoading || analyticsRefreshing) return;
    loadAnalytics(summary ? 'manual' : 'initial');
  };

  const metricColor = (tone: MetricTone = 'default') => {
    if (tone === 'accent') return theme.accent;
    if (tone === 'secondary') return theme.accentSecondary;
    if (tone === 'success') return theme.success;
    return theme.text;
  };

  const renderMetricCard = (
    title: string,
    icon: keyof typeof Ionicons.glyphMap,
    tone: MetricTone,
    metrics: MetricItem[],
  ) => (
    <AppCard style={styles.metricCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.smallIconCircle, { backgroundColor: metricColor(tone) + '16' }]}>
          <Ionicons name={icon} size={18} color={metricColor(tone)} />
        </View>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          {title}
        </Text>
      </View>
      <View style={styles.metricGrid}>
        {metrics.map((metric) => (
          <View
            key={metric.label}
            accessibilityRole="summary"
            style={[styles.metricTile, { backgroundColor: theme.surfaceSecondary }]}
          >
            <Text style={[styles.metricValue, { color: metricColor(metric.tone) }]}>
              {metric.value}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>
              {metric.label}
            </Text>
          </View>
        ))}
      </View>
    </AppCard>
  );

  const renderLoadingState = (title: string, description: string) => (
    <AppCard style={styles.stateCard}>
      <ActivityIndicator
        accessibilityLabel={title}
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        color={theme.accent}
        size="large"
      />
      <Text style={[styles.stateTitle, { color: theme.text }]}>
        {title}
      </Text>
      <Text style={[styles.stateText, { color: theme.textSecondary }]}>
        {description}
      </Text>
    </AppCard>
  );

  const renderUnavailableState = () => (
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

  const renderAnalyticsError = () => (
    <AppCard style={styles.stateCard}>
      <View style={[styles.iconCircle, { backgroundColor: theme.destructive + '14' }]}>
        <Ionicons name="alert-circle-outline" size={30} color={theme.destructive} />
      </View>
      <Text style={[styles.stateTitle, { color: theme.text }]}>
        Unable to load analytics right now.
      </Text>
      <Text style={[styles.stateText, { color: theme.textSecondary }]}>
        Check your connection and try again.
      </Text>
      <Pressable
        onPress={handleRefresh}
        disabled={analyticsLoading || analyticsRefreshing}
        accessibilityRole="button"
        accessibilityLabel="Retry loading owner analytics"
        accessibilityState={{ disabled: analyticsLoading || analyticsRefreshing }}
        style={({ pressed }) => [
          styles.primaryButton,
          {
            backgroundColor: theme.accent,
            opacity: analyticsLoading || analyticsRefreshing ? 0.55 : pressed ? 0.82 : 1,
          },
        ]}
      >
        <Text style={styles.primaryButtonText}>
          Retry
        </Text>
      </Pressable>
    </AppCard>
  );

  const renderDashboard = () => {
    if (!summary) return null;
    return (
      <View style={styles.dashboard}>
        <AppCard style={styles.freshnessCard}>
          <View style={styles.freshnessText}>
            <Text style={[styles.freshnessLabel, { color: theme.textTertiary }]}>
              Last refreshed
            </Text>
            <Text style={[styles.freshnessValue, { color: theme.text }]}>
              {formatRefreshedAt(summary.generatedAt)}
            </Text>
          </View>
          {analyticsRefreshing && (
            <ActivityIndicator
              accessibilityLabel="Refreshing owner analytics"
              accessibilityRole="progressbar"
              accessibilityState={{ busy: true }}
              color={theme.accent}
              size="small"
            />
          )}
        </AppCard>

        {!!analyticsError && (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.inlineError, { color: theme.destructive }]}
          >
            {analyticsError}
          </Text>
        )}

        {renderMetricCard('Users', 'people-outline', 'accent', [
          { label: 'Registered Users', value: formatCount(summary.registeredUserCount), tone: 'accent' },
          { label: 'Profiles', value: formatCount(summary.profileCount) },
          { label: 'New Users, 30 Days', value: formatCount(summary.newRegisteredUsers30d) },
          { label: 'New Profiles, 30 Days', value: formatCount(summary.newProfiles30d) },
        ])}

        {renderMetricCard('To-Dos', 'checkmark-done-outline', 'success', [
          { label: 'Total', value: formatCount(summary.todoCount), tone: 'success' },
          { label: 'Open', value: formatCount(summary.openTodoCount) },
          { label: 'Completed', value: formatCount(summary.completedTodoCount) },
          { label: 'New, 30 Days', value: formatCount(summary.newTodos30d) },
          { label: 'Recurring', value: formatCount(summary.recurringTodoCount) },
          { label: 'With Due Dates', value: formatCount(summary.todosWithDueDateCount) },
        ])}

        {renderMetricCard('Notes', 'document-text-outline', 'secondary', [
          { label: 'Total', value: formatCount(summary.noteCount), tone: 'secondary' },
          { label: 'New, 30 Days', value: formatCount(summary.newNotes30d) },
          { label: 'Dated Notes', value: formatCount(summary.datedNoteCount) },
        ])}

        <AppCard style={styles.completionCard}>
          <Text style={[styles.completionValue, { color: theme.accent }]}>
            {formatPercent(summary.todoCompletionRate)}
          </Text>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            To-Do Completion Rate
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            {formatCount(summary.completedTodoCount)} of {formatCount(summary.todoCount)} to-dos completed.
          </Text>
        </AppCard>

        <AppCard style={styles.privacyCard}>
          <View style={[styles.smallIconCircle, styles.privacyIcon, { backgroundColor: theme.accentSecondary + '16' }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={theme.accentSecondary} />
          </View>
          <Text style={[styles.bodyText, styles.privacyText, { color: theme.textSecondary }]}>
            Analytics are aggregate-only. Individual notes, to-dos, and profile details are not shown.
          </Text>
        </AppCard>
      </View>
    );
  };

  const renderContent = () => {
    if (authLoading || isOwnerLoading || routeRevalidating) {
      return renderLoadingState('Checking owner access', 'Verifying whether this account can view owner tools.');
    }

    if (!isOwner) {
      return renderUnavailableState();
    }

    if (analyticsLoading && !summary) {
      return renderLoadingState('Loading analytics', 'Preparing aggregate app usage totals.');
    }

    if (analyticsError && !summary) {
      return renderAnalyticsError();
    }

    return renderDashboard();
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
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Aggregate app usage only
            </Text>
          </View>
          {isOwner && !isOwnerLoading && !routeRevalidating && (
            <Pressable
              onPress={handleRefresh}
              disabled={analyticsLoading || analyticsRefreshing}
              accessibilityRole="button"
              accessibilityLabel="Refresh owner analytics"
              accessibilityState={{ disabled: analyticsLoading || analyticsRefreshing }}
              style={({ pressed }) => [
                styles.refreshButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: analyticsLoading || analyticsRefreshing ? 0.55 : pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name="refresh" size={19} color={theme.text} />
            </Pressable>
          )}
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
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing[10],
  },
  cardTitle: {
    ...Typography.sectionTitle,
    flex: 1,
  },
  completionCard: {
    alignItems: 'center',
    gap: Spacing[8],
    padding: Spacing[20],
  },
  completionValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 42,
    lineHeight: 48,
  },
  content: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.screenHorizontal,
    width: '100%',
    maxWidth: 640,
  },
  dashboard: {
    gap: Spacing[14],
  },
  errorText: {
    ...Typography.caption,
    textAlign: 'center',
  },
  eyebrow: {
    ...Typography.overline,
  },
  freshnessCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing[12],
    padding: Spacing[14],
  },
  freshnessLabel: {
    ...Typography.caption,
  },
  freshnessText: {
    flex: 1,
    gap: Spacing[2],
  },
  freshnessValue: {
    ...Typography.bodySmall,
    fontFamily: 'Inter_600SemiBold',
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
  inlineError: {
    ...Typography.caption,
    textAlign: 'center',
  },
  metricCard: {
    gap: Spacing[14],
    padding: Spacing[16],
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[10],
  },
  metricLabel: {
    ...Typography.caption,
    textAlign: 'center',
  },
  metricTile: {
    alignItems: 'center',
    borderRadius: 12,
    flexBasis: '47%',
    flexGrow: 1,
    gap: Spacing[4],
    minWidth: 128,
    paddingHorizontal: Spacing[10],
    paddingVertical: Spacing[12],
  },
  metricValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
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
  privacyCard: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing[12],
    padding: Spacing[16],
  },
  privacyIcon: {
    flexShrink: 0,
  },
  privacyText: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'left',
  },
  refreshButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  screen: {
    flex: 1,
  },
  smallIconCircle: {
    alignItems: 'center',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
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
  subtitle: {
    ...Typography.bodySmall,
  },
  title: {
    ...Typography.screenTitle,
  },
});

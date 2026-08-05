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
  fetchOwnerAnalyticsTrends,
  fetchOwnerAnalyticsSummary,
  OWNER_ANALYTICS_ERROR,
  type OwnerAnalyticsSummary,
  type OwnerAnalyticsTrendBucket,
  type OwnerAnalyticsTrendPoint,
} from '@/lib/ownerAnalyticsService';
import { formatCalendarDate, parseCalendarDate } from '@/utils/date';

type MetricTone = 'accent' | 'secondary' | 'default' | 'success';

interface MetricItem {
  label: string;
  value: string;
  tone?: MetricTone;
}

type TrendRangeKey = '7d' | '30d' | '90d';
type TrendMetricKey = 'newRegisteredUsers' | 'newTodos' | 'completedTodos';

interface TrendRangeOption {
  bucket: OwnerAnalyticsTrendBucket;
  days: number;
  label: string;
}

interface TrendMetric {
  key: TrendMetricKey;
  label: string;
  tone: MetricTone;
}

const DEFAULT_TREND_RANGE: TrendRangeKey = '30d';

const TREND_RANGES: Record<TrendRangeKey, TrendRangeOption> = {
  '7d': { bucket: 'day', days: 7, label: '7 days' },
  '30d': { bucket: 'day', days: 30, label: '30 days' },
  '90d': { bucket: 'week', days: 90, label: '90 days' },
};

const TREND_RANGE_KEYS: TrendRangeKey[] = ['7d', '30d', '90d'];

const TREND_METRICS: TrendMetric[] = [
  { key: 'newRegisteredUsers', label: 'New Users', tone: 'accent' },
  { key: 'newTodos', label: 'New To-Dos', tone: 'success' },
  { key: 'completedTodos', label: 'Completed To-Dos', tone: 'secondary' },
];

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

function getTrendRangeParams(rangeKey: TrendRangeKey, now = new Date()) {
  const range = TREND_RANGES[rangeKey];
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - (range.days - 1));

  return {
    bucket: range.bucket,
    endDate: formatCalendarDate(end.getFullYear(), end.getMonth(), end.getDate()),
    startDate: formatCalendarDate(start.getFullYear(), start.getMonth(), start.getDate()),
  };
}

function formatBucketLabel(bucketStart: string, bucket: OwnerAnalyticsTrendBucket): string {
  const date = parseCalendarDate(bucketStart);
  if (!date) return bucketStart;

  const label = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(date);

  return bucket === 'week' ? `Week of ${label}` : label;
}

function trendMetricValue(point: OwnerAnalyticsTrendPoint, key: TrendMetricKey): number {
  return point[key];
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
  const trendsRequestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const [routeRevalidating, setRouteRevalidating] = useState(true);
  const [summary, setSummary] = useState<OwnerAnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<OwnerAnalyticsTrendPoint[] | null>(null);
  const [trendsRange, setTrendsRange] = useState<TrendRangeKey>(DEFAULT_TREND_RANGE);
  const [selectedTrendRange, setSelectedTrendRange] = useState<TrendRangeKey>(DEFAULT_TREND_RANGE);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsRefreshing, setAnalyticsRefreshing] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsRefreshing, setTrendsRefreshing] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const topPad = Math.max(insets.top, 24) + Spacing[8];
  const bottomPad = Math.max(insets.bottom, Layout.nativeBottomInsetFallback) + Spacing[24];

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      analyticsRequestIdRef.current += 1;
      trendsRequestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    setSummary(null);
    setTrends(null);
    setTrendsRange(DEFAULT_TREND_RANGE);
    setSelectedTrendRange(DEFAULT_TREND_RANGE);
    setAnalyticsError(null);
    setTrendsError(null);
    setAnalyticsLoading(false);
    setAnalyticsRefreshing(false);
    setTrendsLoading(false);
    setTrendsRefreshing(false);
    analyticsRequestIdRef.current += 1;
    trendsRequestIdRef.current += 1;
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
    const trendsRequestId = trendsRequestIdRef.current + 1;
    analyticsRequestIdRef.current = requestId;
    trendsRequestIdRef.current = trendsRequestId;
    const isManual = mode === 'manual';
    const rangeParams = getTrendRangeParams(selectedTrendRange);

    setAnalyticsError(null);
    setTrendsError(null);
    if (isManual) {
      setAnalyticsRefreshing(true);
      setTrendsRefreshing(true);
    } else {
      setAnalyticsLoading(true);
      setTrendsLoading(true);
    }

    try {
      const [summaryResult, trendsResult] = await Promise.allSettled([
        fetchOwnerAnalyticsSummary(),
        fetchOwnerAnalyticsTrends(rangeParams),
      ]);
      if (!mountedRef.current || analyticsRequestIdRef.current !== requestId) return;

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value);
      } else {
        setAnalyticsError(OWNER_ANALYTICS_ERROR);
        if (!summary) {
          setSummary(null);
        }
      }

      if (trendsRequestIdRef.current === trendsRequestId) {
        if (trendsResult.status === 'fulfilled') {
          setTrends(trendsResult.value);
          setTrendsRange(selectedTrendRange);
        } else {
          setTrendsError(OWNER_ANALYTICS_ERROR);
        }
      }
    } catch {
      if (!mountedRef.current || analyticsRequestIdRef.current !== requestId) return;
      setAnalyticsError(OWNER_ANALYTICS_ERROR);
      if (!summary) {
        setSummary(null);
      }
      setTrendsError(OWNER_ANALYTICS_ERROR);
    } finally {
      if (mountedRef.current && analyticsRequestIdRef.current === requestId) {
        setAnalyticsLoading(false);
        setAnalyticsRefreshing(false);
      }
      if (mountedRef.current && trendsRequestIdRef.current === trendsRequestId) {
        setTrendsLoading(false);
        setTrendsRefreshing(false);
      }
    }
  }, [selectedTrendRange, summary]);

  const loadTrends = useCallback(async (
    rangeKey: TrendRangeKey,
    previousRange: TrendRangeKey,
  ) => {
    const requestId = trendsRequestIdRef.current + 1;
    trendsRequestIdRef.current = requestId;
    const hasExistingTrends = !!trends;

    setTrendsError(null);
    if (hasExistingTrends) {
      setTrendsRefreshing(true);
    } else {
      setTrendsLoading(true);
    }

    try {
      const nextTrends = await fetchOwnerAnalyticsTrends(getTrendRangeParams(rangeKey));
      if (!mountedRef.current || trendsRequestIdRef.current !== requestId) return;
      setTrends(nextTrends);
      setTrendsRange(rangeKey);
    } catch {
      if (!mountedRef.current || trendsRequestIdRef.current !== requestId) return;
      setTrendsError(OWNER_ANALYTICS_ERROR);
      if (trends) {
        setSelectedTrendRange(previousRange);
      }
    } finally {
      if (mountedRef.current && trendsRequestIdRef.current === requestId) {
        setTrendsLoading(false);
        setTrendsRefreshing(false);
      }
    }
  }, [trends]);

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
    if (analyticsLoading || analyticsRefreshing || trendsLoading || trendsRefreshing) return;
    loadAnalytics(summary ? 'manual' : 'initial');
  };

  const handleTrendRangeChange = (rangeKey: TrendRangeKey) => {
    if (
      rangeKey === selectedTrendRange
      || trendsLoading
      || trendsRefreshing
      || analyticsLoading
      || analyticsRefreshing
    ) {
      return;
    }

    const previousRange = selectedTrendRange;
    setSelectedTrendRange(rangeKey);
    loadTrends(rangeKey, previousRange);
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

  const renderTrendRow = (metric: TrendMetric, points: OwnerAnalyticsTrendPoint[]) => {
    const values = points.map((point) => trendMetricValue(point, metric.key));
    const total = values.reduce((sum, value) => sum + value, 0);
    const maxValue = Math.max(...values, 0);
    const peakIndex = values.indexOf(maxValue);
    const range = TREND_RANGES[trendsRange];
    const peakLabel = peakIndex >= 0 && maxValue > 0
      ? formatBucketLabel(points[peakIndex].bucketStart, range.bucket)
      : 'none';
    const accessibilityLabel = `${metric.label}. ${formatCount(total)} total over ${range.label}. Peak bucket ${peakLabel} with ${formatCount(maxValue)}.`;

    return (
      <View
        key={metric.key}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="summary"
        style={styles.trendRow}
      >
        <View style={styles.trendRowHeader}>
          <Text style={[styles.trendMetricLabel, { color: theme.text }]}>
            {metric.label}
          </Text>
          <Text style={[styles.trendMetricValue, { color: metricColor(metric.tone) }]}>
            {formatCount(total)}
          </Text>
        </View>
        {maxValue === 0 ? (
          <Text style={[styles.trendZeroText, { color: theme.textTertiary }]}>
            No activity in this range.
          </Text>
        ) : (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.trendBars}
          >
            {points.map((point) => {
              const value = trendMetricValue(point, metric.key);
              const height = Math.max(4, Math.round((value / maxValue) * 42));
              return (
                <View
                  key={`${metric.key}-${point.bucketStart}`}
                  style={styles.trendBarSlot}
                >
                  <View
                    style={[
                      styles.trendBar,
                      {
                        backgroundColor: metricColor(metric.tone),
                        height,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderTrendsCard = () => {
    const range = TREND_RANGES[selectedTrendRange];
    const displayedTrends = trendsRange === selectedTrendRange ? trends : null;
    const visibleTrends = displayedTrends ?? trends;
    const trendSummary = visibleTrends
      ? TREND_METRICS.map((metric) => {
        const total = visibleTrends.reduce((sum, point) => sum + trendMetricValue(point, metric.key), 0);
        return `${metric.label} ${formatCount(total)}`;
      }).join('. ')
      : null;
    const allZero = !!visibleTrends && visibleTrends.every((point) => (
      TREND_METRICS.every((metric) => trendMetricValue(point, metric.key) === 0)
    ));

    return (
      <AppCard style={styles.trendsCard}>
        <View style={styles.trendsHeader}>
          <View style={styles.trendsTitleGroup}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Trends
            </Text>
            <Text style={[styles.trendsSubtitle, { color: theme.textSecondary }]}>
              {range.bucket === 'week' ? 'Weekly buckets' : 'Daily buckets'} for {range.label}
            </Text>
          </View>
          {(trendsLoading || trendsRefreshing) && (
            <ActivityIndicator
              accessibilityLabel="Loading owner analytics trends"
              accessibilityRole="progressbar"
              accessibilityState={{ busy: true }}
              color={theme.accent}
              size="small"
            />
          )}
        </View>

        <View style={[styles.rangeSelector, { backgroundColor: theme.surfaceSecondary }]}>
          {TREND_RANGE_KEYS.map((rangeKey) => {
            const selected = selectedTrendRange === rangeKey;
            const disabled = trendsLoading || trendsRefreshing || analyticsLoading || analyticsRefreshing;
            return (
              <Pressable
                key={rangeKey}
                onPress={() => handleTrendRangeChange(rangeKey)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={`Show owner analytics trends for ${TREND_RANGES[rangeKey].label}`}
                accessibilityState={{ disabled, selected }}
                style={({ pressed }) => [
                  styles.rangeButton,
                  {
                    backgroundColor: selected ? theme.accent : 'transparent',
                    opacity: disabled ? 0.55 : pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.rangeButtonText,
                    { color: selected ? '#fff' : theme.textSecondary },
                  ]}
                >
                  {TREND_RANGES[rangeKey].label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {!!trendsError && (
          <View style={styles.trendsErrorRow}>
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.inlineError, styles.trendsErrorText, { color: theme.destructive }]}
            >
              Trends could not be refreshed right now.
            </Text>
            <Pressable
              onPress={() => loadTrends(selectedTrendRange, trendsRange)}
              disabled={trendsLoading || trendsRefreshing}
              accessibilityRole="button"
              accessibilityLabel="Retry loading owner analytics trends"
              accessibilityState={{ disabled: trendsLoading || trendsRefreshing }}
              style={({ pressed }) => [
                styles.retryButton,
                {
                  borderColor: theme.border,
                  opacity: trendsLoading || trendsRefreshing ? 0.55 : pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text style={[styles.retryButtonText, { color: theme.text }]}>
                Retry
              </Text>
            </Pressable>
          </View>
        )}

        {trendsLoading && !visibleTrends ? (
          <View style={styles.trendsLoadingBody}>
            <ActivityIndicator
              accessibilityLabel="Loading trend data"
              accessibilityRole="progressbar"
              accessibilityState={{ busy: true }}
              color={theme.accent}
              size="small"
            />
            <Text style={[styles.stateText, { color: theme.textSecondary }]}>
              Loading trend buckets.
            </Text>
          </View>
        ) : visibleTrends && visibleTrends.length > 0 ? (
          <View style={styles.trendsBody}>
            {!!trendSummary && (
              <Text style={[styles.trendSummaryText, { color: theme.textSecondary }]}>
                {TREND_RANGES[trendsRange].label}: {trendSummary}.
              </Text>
            )}
            {allZero ? (
              <Text style={[styles.trendZeroText, { color: theme.textTertiary }]}>
                No trend activity in this range.
              </Text>
            ) : (
              TREND_METRICS.map((metric) => renderTrendRow(metric, visibleTrends))
            )}
          </View>
        ) : (
          <Text style={[styles.trendZeroText, { color: theme.textTertiary }]}>
            No trend buckets available yet.
          </Text>
        )}
      </AppCard>
    );
  };

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

        {renderTrendsCard()}

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
              disabled={analyticsLoading || analyticsRefreshing || trendsLoading || trendsRefreshing}
              accessibilityRole="button"
              accessibilityLabel="Refresh owner analytics"
              accessibilityState={{ disabled: analyticsLoading || analyticsRefreshing || trendsLoading || trendsRefreshing }}
              style={({ pressed }) => [
                styles.refreshButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: analyticsLoading || analyticsRefreshing || trendsLoading || trendsRefreshing ? 0.55 : pressed ? 0.7 : 1,
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
  rangeButton: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing[8],
  },
  rangeButtonText: {
    ...Typography.caption,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  rangeSelector: {
    borderRadius: 12,
    flexDirection: 'row',
    gap: Spacing[4],
    padding: Spacing[4],
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
  retryButton: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing[14],
  },
  retryButtonText: {
    ...Typography.caption,
    fontFamily: 'Inter_700Bold',
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
  trendBar: {
    borderRadius: 3,
    width: '100%',
  },
  trendBars: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: Spacing[2],
    height: 48,
  },
  trendBarSlot: {
    flex: 1,
    justifyContent: 'flex-end',
    minWidth: 3,
  },
  trendMetricLabel: {
    ...Typography.bodySmall,
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
  },
  trendMetricValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    lineHeight: 24,
  },
  trendRow: {
    gap: Spacing[8],
  },
  trendRowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing[8],
  },
  trendsBody: {
    gap: Spacing[14],
  },
  trendsCard: {
    gap: Spacing[14],
    padding: Spacing[16],
  },
  trendsErrorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing[10],
  },
  trendsErrorText: {
    flex: 1,
    textAlign: 'left',
  },
  trendsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing[12],
  },
  trendsLoadingBody: {
    alignItems: 'center',
    gap: Spacing[8],
    paddingVertical: Spacing[12],
  },
  trendsSubtitle: {
    ...Typography.caption,
  },
  trendsTitleGroup: {
    flex: 1,
    gap: Spacing[2],
  },
  trendSummaryText: {
    ...Typography.caption,
  },
  trendZeroText: {
    ...Typography.caption,
    textAlign: 'center',
  },
});

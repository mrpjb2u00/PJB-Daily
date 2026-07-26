import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { ThemeToggle } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTodos, Todo, RecurrenceType } from '@/contexts/TodoContext';
import TodoItem from '@/components/TodoItem';

type FilterOption = 'all' | RecurrenceType;
type SortOrder = 'newest' | 'oldest';

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All Tasks' },
  { value: 'none', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: '6months', label: 'Every 6 Months' },
  { value: 'yearly', label: 'Yearly' },
];

export default function TodosScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { todos, toggleTodo, deleteTodo, isLoading } = useTodos();
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterBtnLayout, setFilterBtnLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const filterBtnRef = useRef<View>(null);

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const filteredTodos = useMemo(() => {
    if (activeFilter === 'all') return todos;
    return todos.filter((t) => t.recurrence === activeFilter);
  }, [todos, activeFilter]);

  const { activeTodos, completedTodos, completedCount, totalCount } = useMemo(() => {
    const active = filteredTodos.filter((t) => !t.completed);
    const completed = filteredTodos.filter((t) => t.completed);
    return {
      activeTodos: active,
      completedTodos: completed,
      completedCount: completed.length,
      totalCount: filteredTodos.length,
    };
  }, [filteredTodos]);

  const sortedTodos = useMemo(() => {
    const sorted = (arr: Todo[]) =>
      sortOrder === 'oldest' ? [...arr].reverse() : arr;
    return [...sorted(activeTodos), ...sorted(completedTodos)];
  }, [activeTodos, completedTodos, sortOrder]);

  const handleSortToggle = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'));
  };

  const activeFilterLabel = FILTER_OPTIONS.find((f) => f.value === activeFilter)?.label || 'All Tasks';

  const handleEdit = (item: Todo) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/add-task', params: { id: item.id, title: item.title, recurrence: item.recurrence, defaultDate: item.dueDate || '' } });
  };

  const handleFilterPress = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    filterBtnRef.current?.measureInWindow((x, y, width, height) => {
      setFilterBtnLayout({ x, y, width, height });
      setShowFilterMenu(true);
    });
  };

  const handleFilterSelect = (value: FilterOption) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setActiveFilter(value);
    setShowFilterMenu(false);
  };

  const progressPercent = totalCount > 0 ? completedCount / totalCount : 0;

  const recurrenceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    todos.forEach((t) => {
      counts[t.recurrence] = (counts[t.recurrence] || 0) + 1;
    });
    return counts;
  }, [todos]);

  const renderHeader = () => (
    <Animated.View entering={FadeInDown.duration(400).delay(100)}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statsCard}
      >
        <View style={styles.statsRow}>
          <View>
            <Text style={[styles.statsLabel, { fontFamily: 'Inter_500Medium' }]}>Progress</Text>
            <Text style={[styles.statsValue, { fontFamily: 'Inter_700Bold' }]}>
              {completedCount}/{totalCount}
            </Text>
          </View>
          <View style={styles.progressRing}>
            <View style={[styles.progressBg, { borderColor: 'rgba(255,255,255,0.25)' }]} />
            <Text style={[styles.progressText, { fontFamily: 'Inter_700Bold' }]}>
              {totalCount > 0 ? Math.round(progressPercent * 100) : 0}%
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.filterRow}>
        <Pressable
          ref={filterBtnRef}
          onPress={handleFilterPress}
          style={[styles.filterBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
          testID="filter-dropdown"
        >
          <Ionicons name="filter" size={14} color={theme.accent} />
          <Text
            style={[styles.filterBtnText, { color: theme.text, fontFamily: 'Inter_500Medium' }]}
            numberOfLines={1}
          >
            {activeFilterLabel}
          </Text>
          <Ionicons name="chevron-down" size={14} color={theme.textTertiary} />
        </Pressable>
        {activeFilter !== 'all' && (
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              setActiveFilter('all');
            }}
            style={[styles.clearFilterBtn, { backgroundColor: theme.accent + '18' }]}
          >
            <Ionicons name="close-circle" size={14} color={theme.accent} />
            <Text style={[styles.clearFilterText, { color: theme.accent, fontFamily: 'Inter_500Medium' }]}>
              Clear
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleSortToggle}
          style={[styles.sortBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
          testID="sort-toggle"
        >
          <Ionicons
            name={sortOrder === 'newest' ? 'arrow-down' : 'arrow-up'}
            size={14}
            color={theme.accent}
          />
          <Text style={[styles.filterBtnText, { color: theme.text, fontFamily: 'Inter_500Medium' }]}>
            {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </Text>
        </Pressable>
      </View>

      {activeTodos.length > 0 && (
        <Text
          style={[
            styles.sectionLabel,
            { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' },
          ]}
        >
          Active
        </Text>
      )}
    </Animated.View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator
            size="large"
            color={theme.accent}
            accessible
            accessibilityLabel="Loading to-dos"
            accessibilityRole="progressbar"
            accessibilityState={{ busy: true }}
          />
        </View>
      );
    }
    return (
      <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyContainer}>
        <Feather name="check-circle" size={56} color={theme.textTertiary} />
        <Text
          style={[styles.emptyTitle, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}
        >
          {activeFilter === 'all' ? 'All clear' : 'No tasks found'}
        </Text>
        <Text
          style={[styles.emptyText, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}
        >
          {activeFilter === 'all'
            ? 'Tap the button below to add your first task'
            : `No ${activeFilterLabel.toLowerCase()} tasks yet`
          }
        </Text>
      </Animated.View>
    );
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
            {getGreeting()}, {user?.username}
          </Text>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
            My To-Dos
          </Text>
        </View>

        <View style={styles.headerRight}>
          <ThemeToggle />
        </View>
      </View>

      <FlatList
        data={sortedTodos}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View>
            {index === activeTodos.length && completedTodos.length > 0 && (
              <Text
                style={[
                  styles.sectionLabel,
                  { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
                ]}
              >
                Completed
              </Text>
            )}
            <TodoItem
              item={item}
              onToggle={() => toggleTodo(item.id)}
              onEdit={() => handleEdit(item)}
              onDelete={() => deleteTodo(item.id)}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 24 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={sortedTodos.length > 0}
      />

      <Modal
        visible={showFilterMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilterMenu(false)}>
          <Animated.View
            entering={FadeIn.duration(150)}
            style={[
              styles.filterMenu,
              {
                backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                borderColor: theme.border,
                top: filterBtnLayout.y + filterBtnLayout.height + 4,
                left: Math.max(16, filterBtnLayout.x),
              },
            ]}
          >
            {FILTER_OPTIONS.map((opt) => {
              const isActive = activeFilter === opt.value;
              const count = opt.value === 'all' ? todos.length : (recurrenceCounts[opt.value] || 0);
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleFilterSelect(opt.value)}
                  style={[
                    styles.filterMenuItem,
                    isActive && { backgroundColor: theme.accent + '15' },
                  ]}
                >
                  <View style={styles.filterMenuItemLeft}>
                    {isActive && <Ionicons name="checkmark" size={16} color={theme.accent} />}
                    <Text
                      style={[
                        styles.filterMenuItemText,
                        {
                          color: isActive ? theme.accent : theme.text,
                          fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular',
                          marginLeft: isActive ? 0 : 22,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.filterMenuCount,
                      {
                        color: isActive ? theme.accent : theme.textTertiary,
                        fontFamily: 'Inter_500Medium',
                      },
                    ]}
                  >
                    {count}
                  </Text>
                </Pressable>
              );
            })}
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
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
    zIndex: 10,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  statsCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 32,
    color: '#fff',
  },
  progressRing: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBg: {
    position: 'absolute' as const,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterBtnText: {
    fontSize: 13,
    maxWidth: 120,
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 'auto',
  },
  clearFilterText: {
    fontSize: 12,
  },
  sectionLabel: {
    fontSize: 13,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  filterMenu: {
    position: 'absolute',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 6,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  filterMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  filterMenuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterMenuItemText: {
    fontSize: 14,
  },
  filterMenuCount: {
    fontSize: 12,
    minWidth: 20,
    textAlign: 'right',
  },
});

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTodos } from '@/contexts/TodoContext';
import { useCalendarContext } from '@/contexts/CalendarContext';
import TodoItem from '@/components/TodoItem';
import { router } from 'expo-router';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatSelectedDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { todos, toggleTodo, deleteTodo, isLoading } = useTodos();
  const { selectedDate, setSelectedDate } = useCalendarContext();

  const today = new Date().toISOString().split('T')[0];

  const [viewYear, setViewYear] = useState<number>(() => {
    const [y] = selectedDate.split('-').map(Number);
    return y;
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const [, m] = selectedDate.split('-').map(Number);
    return m - 1;
  });

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const datesWithTasks = useMemo(() => {
    const set = new Set<string>();
    todos.forEach((t) => {
      if (t.dueDate) set.add(t.dueDate);
    });
    return set;
  }, [todos]);

  const tasksForSelected = useMemo(() => {
    return todos.filter((t) => t.dueDate === selectedDate);
  }, [todos, selectedDate]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const goToPrevMonth = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const handleDayPress = useCallback((day: number) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setSelectedDate(toDateStr(viewYear, viewMonth, day));
  }, [viewYear, viewMonth, setSelectedDate]);

  const handleEditTask = useCallback((item: any) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/add-task',
      params: { id: item.id, title: item.title, recurrence: item.recurrence, defaultDate: item.dueDate || '' },
    });
  }, []);

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
            My Calendar
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
      >
        <Animated.View entering={FadeInDown.duration(350).delay(80)}>
          <View style={[styles.calendarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.monthNav}>
              <Pressable
                onPress={goToPrevMonth}
                style={({ pressed }) => [styles.navBtn, { backgroundColor: theme.surfaceSecondary, opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="chevron-back" size={18} color={theme.text} />
              </Pressable>
              <Text style={[styles.monthLabel, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              <Pressable
                onPress={goToNextMonth}
                style={({ pressed }) => [styles.navBtn, { backgroundColor: theme.surfaceSecondary, opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="chevron-forward" size={18} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.dayHeaders}>
              {DAYS.map((d) => (
                <View key={d} style={styles.dayHeaderCell}>
                  <Text style={[styles.dayHeaderText, { color: theme.textTertiary, fontFamily: 'Inter_500Medium' }]}>
                    {d}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.grid}>
              {calendarDays.map((day, idx) => {
                if (!day) {
                  return <View key={`empty-${idx}`} style={styles.dayCell} />;
                }
                const dateStr = toDateStr(viewYear, viewMonth, day);
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === today;
                const hasTasks = datesWithTasks.has(dateStr);

                return (
                  <Pressable
                    key={dateStr}
                    onPress={() => handleDayPress(day)}
                    style={styles.dayCell}
                  >
                    <View
                      style={[
                        styles.dayInner,
                        isSelected && { backgroundColor: theme.accent },
                        !isSelected && isToday && { borderWidth: 2, borderColor: theme.accent },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          { fontFamily: isSelected || isToday ? 'Inter_700Bold' : 'Inter_400Regular' },
                          { color: isSelected ? '#fff' : isToday ? theme.accent : theme.text },
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                    {hasTasks && (
                      <View style={[styles.dot, { backgroundColor: isSelected ? 'rgba(255,255,255,0.9)' : theme.accent }]} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(350).delay(160)}>
          <View style={styles.tasksSection}>
            <Text style={[styles.dateLabel, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
              {formatSelectedDate(selectedDate)}
            </Text>

            {isLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color={theme.accent} />
              </View>
            ) : tasksForSelected.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={36} color={theme.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                  No tasks for this day
                </Text>
              </View>
            ) : (
              tasksForSelected.map((item) => (
                <TodoItem
                  key={item.id}
                  item={item}
                  onToggle={() => toggleTodo(item.id)}
                  onEdit={() => handleEditTask(item)}
                  onDelete={() => deleteTodo(item.id)}
                />
              ))
            )}
          </View>
        </Animated.View>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  calendarCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 17,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayHeaderText: {
    fontSize: 11,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInner: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 3,
  },
  tasksSection: {
    gap: 10,
  },
  dateLabel: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
  },
});

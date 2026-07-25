import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import CreateModal from '@/components/CreateModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTodos, type Todo } from '@/contexts/TodoContext';
import { useNotes } from '@/contexts/NotesContext';
import { useCalendarContext } from '@/contexts/CalendarContext';
import { router } from 'expo-router';
import { getItemsMapForMonth } from '@/utils/recurrence';
import { formatCalendarDate, getDaysInMonth, getLocalTodayDateString } from '@/utils/date';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const TABLET_BREAKPOINT = 768;
const COMPACT_PHONE_BREAKPOINT = 390;

interface CalendarCellData {
  key: string;
  dateStr: string;
  day: number;
  year: number;
  month: number;
  isCurrentMonth: boolean;
}

interface CalendarLayout {
  scrollHeight: number;
  monthNavHeight: number;
  dayHeadersHeight: number;
}

function normalizeYearMonth(year: number, month: number): { year: number; month: number } {
  return {
    year: year + Math.floor(month / 12),
    month: ((month % 12) + 12) % 12,
  };
}

function buildCalendarCells(year: number, month: number): CalendarCellData[] {
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const previousMonth = normalizeYearMonth(year, month - 1);
  const nextMonth = normalizeYearMonth(year, month + 1);
  const previousMonthDays = getDaysInMonth(previousMonth.year, previousMonth.month);
  const cells: CalendarCellData[] = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = previousMonthDays - i;
    cells.push({
      key: `previous-${day}`,
      dateStr: formatCalendarDate(previousMonth.year, previousMonth.month, day),
      day,
      year: previousMonth.year,
      month: previousMonth.month,
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      key: `current-${day}`,
      dateStr: formatCalendarDate(year, month, day),
      day,
      year,
      month,
      isCurrentMonth: true,
    });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      key: `next-${nextDay}`,
      dateStr: formatCalendarDate(nextMonth.year, nextMonth.month, nextDay),
      day: nextDay,
      year: nextMonth.year,
      month: nextMonth.month,
      isCurrentMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getCellHeightBounds(width: number): { min: number; max: number; fallback: number } {
  if (width >= TABLET_BREAKPOINT) {
    return { min: 112, max: Platform.OS === 'web' ? 138 : 154, fallback: 124 };
  }
  if (width < COMPACT_PHONE_BREAKPOINT) {
    return { min: 84, max: 104, fallback: 92 };
  }
  return { min: 92, max: 118, fallback: 102 };
}

function getDateNumberSize(width: number): number {
  if (width >= TABLET_BREAKPOINT) return 26;
  if (width < COMPACT_PHONE_BREAKPOINT) return 20;
  return 22;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { todos } = useTodos();
  const { notes } = useNotes();
  const { selectedDate, setSelectedDate } = useCalendarContext();

  const isTablet = screenWidth >= TABLET_BREAKPOINT;

  const today = getLocalTodayDateString();

  const [viewYear, setViewYear] = useState<number>(() => {
    const [y] = selectedDate.split('-').map(Number);
    return y;
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const [, m] = selectedDate.split('-').map(Number);
    return m - 1;
  });

  const [actionModal, setActionModal] = useState<{ visible: boolean; date: string }>({
    visible: false,
    date: '',
  });
  const [layout, setLayout] = useState<CalendarLayout>({
    scrollHeight: 0,
    monthNavHeight: 0,
    dayHeadersHeight: 0,
  });

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const previousMonth = useMemo(
    () => normalizeYearMonth(viewYear, viewMonth - 1),
    [viewYear, viewMonth],
  );
  const nextMonth = useMemo(
    () => normalizeYearMonth(viewYear, viewMonth + 1),
    [viewYear, viewMonth],
  );

  const itemMaps = useMemo(() => ({
    previous: getItemsMapForMonth(todos, notes, previousMonth.year, previousMonth.month),
    current: getItemsMapForMonth(todos, notes, viewYear, viewMonth),
    next: getItemsMapForMonth(todos, notes, nextMonth.year, nextMonth.month),
  }), [todos, notes, previousMonth.year, previousMonth.month, viewYear, viewMonth, nextMonth.year, nextMonth.month]);

  const todoById = useMemo(() => {
    const map = new Map<string, Todo>();
    todos.forEach((todo) => map.set(todo.id, todo));
    return map;
  }, [todos]);

  const calendarCells = useMemo(() => buildCalendarCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const rowCount = calendarCells.length / 7;
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 20) + 12;
  const heightBounds = getCellHeightBounds(screenWidth);
  const measuredGridHeight = layout.scrollHeight > 0
    ? layout.scrollHeight - layout.monthNavHeight - layout.dayHeadersHeight - bottomPad - 18
    : 0;
  const cellHeight = measuredGridHeight > 0
    ? clamp(Math.floor(measuredGridHeight / rowCount), heightBounds.min, heightBounds.max)
    : heightBounds.fallback;
  const dateNumberSize = getDateNumberSize(screenWidth);
  const maxVisible = isTablet
    ? (cellHeight >= 122 ? 3 : 2)
    : (cellHeight >= 92 ? 2 : 1);

  const getItemsForCell = useCallback((cell: CalendarCellData) => {
    if (cell.year === viewYear && cell.month === viewMonth) {
      return itemMaps.current.get(cell.dateStr) || [];
    }
    if (cell.year === previousMonth.year && cell.month === previousMonth.month) {
      return itemMaps.previous.get(cell.dateStr) || [];
    }
    return itemMaps.next.get(cell.dateStr) || [];
  }, [itemMaps, previousMonth.year, previousMonth.month, viewYear, viewMonth]);

  const updateMeasuredLayout = useCallback((key: keyof CalendarLayout, event: LayoutChangeEvent) => {
    const nextValue = Math.round(event.nativeEvent.layout.height);
    setLayout((current) => (
      current[key] === nextValue ? current : { ...current, [key]: nextValue }
    ));
  }, []);

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

  const handleDayPress = useCallback((cell: CalendarCellData) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setSelectedDate(cell.dateStr);
    if (!cell.isCurrentMonth) {
      setViewYear(cell.year);
      setViewMonth(cell.month);
    }
    const cellItems = getItemsForCell(cell);
    if (cellItems && cellItems.length > 0) {
      router.push({ pathname: '/date-details', params: { date: cell.dateStr } });
    } else {
      setActionModal({ visible: true, date: cell.dateStr });
    }
  }, [getItemsForCell, setSelectedDate]);

  const closeModal = useCallback(() => {
    setActionModal((prev) => ({ ...prev, visible: false }));
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
        onLayout={(event) => updateMeasuredLayout('scrollHeight', event)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
      >
        <Animated.View entering={FadeInDown.duration(350).delay(80)}>
          <View style={[styles.calendarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View
              style={styles.monthNav}
              onLayout={(event) => updateMeasuredLayout('monthNavHeight', event)}
            >
              <Pressable
                onPress={goToPrevMonth}
                style={({ pressed }) => [styles.navBtn, { backgroundColor: theme.surfaceSecondary, opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </Pressable>
              <Text style={[styles.monthLabel, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              <Pressable
                onPress={goToNextMonth}
                style={({ pressed }) => [styles.navBtn, { backgroundColor: theme.surfaceSecondary, opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="chevron-forward" size={20} color={theme.text} />
              </Pressable>
            </View>

            <View
              style={[styles.dayHeaders, { borderBottomColor: theme.border + '60' }]}
              onLayout={(event) => updateMeasuredLayout('dayHeadersHeight', event)}
            >
              {DAYS.map((d) => (
                <View key={d} style={styles.dayHeaderCell}>
                  <Text style={[styles.dayHeaderText, { color: theme.textTertiary, fontFamily: 'Inter_500Medium' }]}>
                    {d}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.grid}>
              {calendarCells.map((cell) => {
                const isSelected = cell.dateStr === selectedDate;
                const isToday = cell.dateStr === today;
                const cellItems = getItemsForCell(cell);
                const visibleItems = cellItems.slice(0, maxVisible);
                const extraCount = cellItems.length - maxVisible;

                return (
                  <Pressable
                    key={cell.key}
                    onPress={() => handleDayPress(cell)}
                    accessibilityRole="button"
                    accessibilityLabel={`${MONTH_NAMES[cell.month]} ${cell.day}, ${cell.year}`}
                    style={({ pressed }) => [
                      styles.dayCell,
                      {
                        borderColor: theme.border + '45',
                        height: cellHeight,
                        backgroundColor: cell.isCurrentMonth ? theme.surface : theme.surfaceSecondary + (isDark ? '18' : '60'),
                      },
                      isSelected && {
                        backgroundColor: theme.accent + (isDark ? '1F' : '14'),
                        borderColor: theme.accent + '8A',
                        borderWidth: 1,
                      },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <View
                      style={[
                        styles.dayNumberWrap,
                        {
                          width: dateNumberSize + 12,
                          height: dateNumberSize + 12,
                          borderRadius: Math.round((dateNumberSize + 12) / 2.8),
                        },
                        isSelected && { backgroundColor: theme.accent },
                        !isSelected && isToday && {
                          borderColor: theme.accent,
                          borderWidth: 1.5,
                          backgroundColor: theme.accent + '0F',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          {
                            fontSize: dateNumberSize,
                            lineHeight: dateNumberSize + 3,
                            fontFamily: isSelected || isToday ? 'Inter_700Bold' : 'Inter_500Medium',
                          },
                          {
                            color: isSelected
                              ? '#fff'
                              : isToday
                                ? theme.accent
                                : cell.isCurrentMonth
                                  ? theme.text
                                  : theme.textTertiary,
                          },
                          Platform.OS === 'android' && { includeFontPadding: false },
                        ]}
                      >
                        {cell.day}
                      </Text>
                    </View>

                    {visibleItems.map((item) => {
                      const pillColor = item.type === 'note' ? theme.accentSecondary : theme.accent;
                      const todo = item.type === 'todo' ? todoById.get(item.id) : undefined;
                      const isCompleted = Boolean(todo?.completed);
                      const isRecurring = Boolean(todo && todo.recurrence !== 'none');
                      const iconName = (item.type === 'note'
                        ? 'document-text'
                        : isRecurring
                          ? 'repeat'
                          : isCompleted
                            ? 'checkmark-circle'
                            : 'ellipse-outline') as React.ComponentProps<typeof Ionicons>['name'];
                      return (
                        <View
                          key={`${item.type}-${item.id}`}
                          style={[
                            styles.taskPill,
                            {
                              backgroundColor: pillColor + (isDark ? '24' : '1F'),
                              opacity: cell.isCurrentMonth ? 1 : 0.58,
                            },
                            isCompleted && { backgroundColor: theme.completedBg },
                          ]}
                        >
                          <Ionicons name={iconName} size={9} color={isCompleted ? theme.completedText : pillColor} />
                          <Text
                            style={[
                              styles.taskPillText,
                              {
                                color: isCompleted ? theme.completedText : pillColor,
                                fontFamily: 'Inter_600SemiBold',
                                textDecorationLine: isCompleted ? 'line-through' : 'none',
                              },
                              Platform.OS === 'android' && { includeFontPadding: false },
                            ]}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                        </View>
                      );
                    })}

                    {extraCount > 0 && (
                      <Text
                        style={[
                          styles.moreText,
                          {
                            color: cell.isCurrentMonth ? theme.accent : theme.textTertiary,
                            fontFamily: 'Inter_600SemiBold',
                          },
                          Platform.OS === 'android' && { includeFontPadding: false },
                        ]}
                      >
                        +{extraCount} more
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <CreateModal
        visible={actionModal.visible}
        onClose={closeModal}
        onCreateTodo={() => {
          closeModal();
          router.push({ pathname: '/add-task', params: { defaultDate: actionModal.date } });
        }}
        onCreateNote={() => {
          closeModal();
          router.push({ pathname: '/edit-note', params: { prefillDate: actionModal.date } });
        }}
      />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    flexGrow: 1,
  },
  calendarCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 19,
  },
  dayHeaders: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    paddingTop: 7,
    paddingHorizontal: 3,
    paddingBottom: 5,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  dayNumberWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    alignSelf: 'flex-start',
    marginLeft: 0,
  },
  dayNumber: {
    textAlign: 'center',
  },
  taskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 5,
    paddingHorizontal: 4,
    width: '100%',
    overflow: 'hidden',
    ...Platform.select({
      android: { minHeight: 16, paddingVertical: 1, marginBottom: 2 },
      default: { minHeight: 17, paddingVertical: 2, marginBottom: 2 },
    }),
  },
  taskPillText: {
    flex: 1,
    fontSize: 9.5,
    ...Platform.select({
      android: { lineHeight: 11 },
      default: { lineHeight: 12 },
    }),
  },
  moreText: {
    fontSize: 9,
    paddingLeft: 2,
    ...Platform.select({
      android: { lineHeight: 11, marginTop: 0 },
      default: { lineHeight: 12, marginTop: 1 },
    }),
  },
});

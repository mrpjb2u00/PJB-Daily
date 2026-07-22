import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import CreateModal from '@/components/CreateModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTodos } from '@/contexts/TodoContext';
import { useNotes } from '@/contexts/NotesContext';
import { useCalendarContext } from '@/contexts/CalendarContext';
import { router } from 'expo-router';
import { getItemsMapForMonth } from '@/utils/recurrence';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const TABLET_BREAKPOINT = 768;

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
  const maxVisible = isTablet ? 3 : 2;
  // Phone: date circle (22) + 2 pills (15ea) + gap + "+X more" (12) + padding = 76
  // Tablet: date circle (24) + 3 pills (16ea) + gap + "+X more" (13) + padding = 96
  const cellHeight = isTablet ? 96 : 76;

  const today = new Date().toISOString().split('T')[0];

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

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const itemsMap = useMemo(
    () => getItemsMapForMonth(todos, notes, viewYear, viewMonth),
    [todos, notes, viewYear, viewMonth],
  );

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
    const dateStr = toDateStr(viewYear, viewMonth, day);
    setSelectedDate(dateStr);
    const cellItems = itemsMap.get(dateStr);
    if (cellItems && cellItems.length > 0) {
      router.push({ pathname: '/date-details', params: { date: dateStr } });
    } else {
      setActionModal({ visible: true, date: dateStr });
    }
  }, [viewYear, viewMonth, setSelectedDate, itemsMap]);

  const closeModal = useCallback(() => {
    setActionModal((prev) => ({ ...prev, visible: false }));
  }, []);

  const bottomPad = Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 20) + 12;

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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
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

            <View style={[styles.dayHeaders, { borderBottomColor: theme.border + '60' }]}>
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
                  return (
                    <View
                      key={`empty-${idx}`}
                      style={[styles.dayCell, { borderColor: theme.border + '40', height: cellHeight }]}
                    />
                  );
                }
                const dateStr = toDateStr(viewYear, viewMonth, day);
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === today;
                const cellItems = itemsMap.get(dateStr) || [];
                const visibleItems = cellItems.slice(0, maxVisible);
                const extraCount = cellItems.length - maxVisible;

                return (
                  <Pressable
                    key={dateStr}
                    onPress={() => handleDayPress(day)}
                    style={({ pressed }) => [
                      styles.dayCell,
                      { borderColor: theme.border + '40', height: cellHeight },
                      isSelected && { backgroundColor: theme.accent + '18' },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <View
                      style={[
                        styles.dayNumberWrap,
                        isSelected && { backgroundColor: theme.accent },
                        !isSelected && isToday && { backgroundColor: theme.accent + '22' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          { fontFamily: isSelected || isToday ? 'Inter_700Bold' : 'Inter_400Regular' },
                          { color: isSelected ? '#fff' : isToday ? theme.accent : theme.text },
                          Platform.OS === 'android' && { includeFontPadding: false },
                        ]}
                      >
                        {day}
                      </Text>
                    </View>

                    {visibleItems.map((item) => {
                      const pillColor = item.type === 'note' ? theme.accentSecondary : theme.accent;
                      return (
                        <View
                          key={item.id}
                          style={[styles.taskPill, { backgroundColor: pillColor + '25' }]}
                        >
                          <Text
                            style={[
                              styles.taskPillText,
                              { color: pillColor, fontFamily: 'Inter_500Medium' },
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
                          { color: theme.accent, fontFamily: 'Inter_500Medium' },
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
  },
  calendarCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
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
    paddingTop: 5,
    paddingHorizontal: 2,
    paddingBottom: 4,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  dayNumberWrap: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    alignSelf: 'flex-start',
    marginLeft: 1,
  },
  dayNumber: {
    fontSize: 12,
  },
  taskPill: {
    borderRadius: 3,
    paddingHorizontal: 3,
    width: '100%',
    ...Platform.select({
      android: { paddingVertical: 1.5, marginBottom: 1.5 },
      default: { paddingVertical: 2, marginBottom: 2 },
    }),
  },
  taskPillText: {
    fontSize: 9,
    ...Platform.select({
      android: { lineHeight: 10 },
      default: { lineHeight: 11 },
    }),
  },
  moreText: {
    fontSize: 8.5,
    paddingLeft: 3,
    ...Platform.select({
      android: { lineHeight: 10, marginTop: 0 },
      default: { lineHeight: 12, marginTop: 1 },
    }),
  },
});

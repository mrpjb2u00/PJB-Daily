import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  Modal,
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
import { router } from 'expo-router';
import { getTasksMapForMonth } from '@/utils/recurrence';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MAX_VISIBLE = 3;

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
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
  const { todos } = useTodos();
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

  const [actionModal, setActionModal] = useState<{ visible: boolean; date: string }>({
    visible: false,
    date: '',
  });

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const tasksMap = useMemo(
    () => getTasksMapForMonth(todos, viewYear, viewMonth),
    [todos, viewYear, viewMonth],
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
    const cellTasks = tasksMap.get(dateStr);
    if (cellTasks && cellTasks.length > 0) {
      router.push({ pathname: '/date-details', params: { date: dateStr } });
    } else {
      setActionModal({ visible: true, date: dateStr });
    }
  }, [viewYear, viewMonth, setSelectedDate, tasksMap]);

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
                      style={[styles.dayCell, { borderColor: theme.border + '40' }]}
                    />
                  );
                }
                const dateStr = toDateStr(viewYear, viewMonth, day);
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === today;
                const cellTasks = tasksMap.get(dateStr) || [];
                const visibleTasks = cellTasks.slice(0, MAX_VISIBLE);
                const extraCount = cellTasks.length - MAX_VISIBLE;

                return (
                  <Pressable
                    key={dateStr}
                    onPress={() => handleDayPress(day)}
                    style={({ pressed }) => [
                      styles.dayCell,
                      { borderColor: theme.border + '40' },
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
                        ]}
                      >
                        {day}
                      </Text>
                    </View>

                    {visibleTasks.map((task) => (
                      <View
                        key={task.id}
                        style={[styles.taskPill, { backgroundColor: theme.accent + '25' }]}
                      >
                        <Text
                          style={[styles.taskPillText, { color: theme.accent, fontFamily: 'Inter_500Medium' }]}
                          numberOfLines={1}
                        >
                          {task.title}
                        </Text>
                      </View>
                    ))}

                    {extraCount > 0 && (
                      <Text style={[styles.moreText, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
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

      <Modal
        transparent
        visible={actionModal.visible}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeModal}>
          <View
            style={[styles.modalSheet, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalDateLabel, { color: theme.textSecondary, fontFamily: 'Inter_500Medium' }]}>
              {formatDateLabel(actionModal.date)}
            </Text>

            <Pressable
              style={({ pressed }) => [styles.modalBtn, { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 }]}
              onPress={() => {
                closeModal();
                router.push({ pathname: '/add-task', params: { defaultDate: actionModal.date } });
              }}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={[styles.modalBtnText, { color: '#fff', fontFamily: 'Inter_600SemiBold' }]}>
                Create To-Do
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.modalBtn,
                { backgroundColor: theme.surfaceSecondary, borderColor: theme.border, borderWidth: 1, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => {
                closeModal();
                router.push('/edit-note');
              }}
            >
              <Ionicons name="document-text" size={18} color={theme.text} />
              <Text style={[styles.modalBtnText, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
                Create Note
              </Text>
            </Pressable>

            <Pressable style={styles.modalCancelBtn} onPress={closeModal}>
              <Text style={[styles.modalCancelText, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
    height: 82,
    paddingTop: 4,
    paddingHorizontal: 2,
    paddingBottom: 3,
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
    paddingVertical: 1.5,
    marginBottom: 1.5,
    width: '100%',
  },
  taskPillText: {
    fontSize: 9,
    lineHeight: 12,
  },
  moreText: {
    fontSize: 8.5,
    lineHeight: 11,
    marginTop: 0.5,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  modalSheet: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 10,
  },
  modalDateLabel: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalBtnText: {
    fontSize: 16,
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCancelText: {
    fontSize: 15,
  },
});

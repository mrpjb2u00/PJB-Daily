import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useTodos } from '@/contexts/TodoContext';
import { getTasksForDate } from '@/utils/recurrence';
import TodoItem from '@/components/TodoItem';

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DateDetailsScreen() {
  const { theme, isDark } = useTheme();
  const { todos, toggleTodo, deleteTodo } = useTodos();
  const insets = useSafeAreaInsets();
  const { date } = useLocalSearchParams<{ date: string }>();

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const tasks = useMemo(
    () => (date ? getTasksForDate(todos, date) : []),
    [todos, date],
  );

  const handleEditTask = useCallback(
    (item: { id: string; title: string; recurrence: string; dueDate?: string }) => {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({
        pathname: '/add-task',
        params: {
          id: item.id,
          title: item.title,
          recurrence: item.recurrence,
          defaultDate: item.dueDate || '',
        },
      });
    },
    [],
  );

  const bottomPad =
    Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 20) + 20;

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View
        style={[
          styles.header,
          {
            paddingTop:
              (Platform.OS === 'web' ? webTopInset : insets.top) + 8,
            borderBottomColor: theme.border,
            backgroundColor: theme.background,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={26} color={theme.accent} />
        </Pressable>

        <Text
          style={[styles.dateTitle, { color: theme.text, fontFamily: 'Inter_700Bold' }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatDate(date)}
        </Text>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/add-task',
              params: { defaultDate: date || '' },
            })
          }
          hitSlop={12}
          style={({ pressed }) => [styles.addBtn, { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 }]}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
      >
        {tasks.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={44} color={theme.textTertiary} />
            <Text
              style={[styles.emptyTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}
            >
              No tasks this day
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}
            >
              Tap + to add one
            </Text>
          </Animated.View>
        ) : (
          tasks.map((item, i) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.duration(280).delay(i * 40)}
            >
              <TodoItem
                item={item}
                onToggle={() => toggleTodo(item.id)}
                onEdit={() => handleEditTask(item)}
                onDelete={() => deleteTodo(item.id)}
              />
            </Animated.View>
          ))
        )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateTitle: {
    flex: 1,
    fontSize: 17,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 14,
  },
});

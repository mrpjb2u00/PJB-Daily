import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTodos, Todo } from '@/contexts/TodoContext';
import TodoItem from '@/components/TodoItem';

export default function TodosScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { todos, toggleTodo, deleteTodo, isLoading } = useTodos();

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const { activeTodos, completedTodos, completedCount, totalCount } = useMemo(() => {
    const active = todos.filter((t) => !t.completed);
    const completed = todos.filter((t) => t.completed);
    return {
      activeTodos: active,
      completedTodos: completed,
      completedCount: completed.length,
      totalCount: todos.length,
    };
  }, [todos]);

  const sortedTodos = useMemo(() => [...activeTodos, ...completedTodos], [activeTodos, completedTodos]);

  const handleAdd = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/add-task');
  };

  const handleEdit = (item: Todo) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/add-task', params: { id: item.id, title: item.title, recurrence: item.recurrence } });
  };

  const handleLogout = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await logout();
    router.replace('/');
  };

  const progressPercent = totalCount > 0 ? completedCount / totalCount : 0;

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
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      );
    }
    return (
      <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyContainer}>
        <Feather name="check-circle" size={56} color={theme.textTertiary} />
        <Text
          style={[styles.emptyTitle, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}
        >
          All clear
        </Text>
        <Text
          style={[styles.emptyText, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}
        >
          Tap the button below to add your first task
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
            paddingTop: (Platform.OS === 'web' ? webTopInset : insets.top) + 12,
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
          <Pressable
            onPress={toggleTheme}
            style={[styles.iconBtn, { backgroundColor: theme.surfaceSecondary }]}
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={18}
              color={isDark ? theme.gradientEnd : theme.gradientStart}
            />
          </Pressable>
          <Pressable
            onPress={handleLogout}
            style={[styles.iconBtn, { backgroundColor: theme.surfaceSecondary }]}
            testID="logout-button"
            accessibilityLabel="Logout"
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={18} color={theme.textSecondary} />
          </Pressable>
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
          {
            paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={sortedTodos.length > 0}
      />

      <Animated.View
        entering={FadeInDown.duration(500).delay(300)}
        style={[
          styles.fabContainer,
          {
            bottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 70,
          },
        ]}
      >
        <Pressable
          onPress={handleAdd}
          style={({ pressed }) => [
            styles.fab,
            {
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            },
          ]}
        >
          <LinearGradient
            colors={[theme.gradientStart, theme.gradientEnd] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </Pressable>
      </Animated.View>
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
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  statsCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
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
  fabContainer: {
    position: 'absolute' as const,
    right: 24,
  },
  fab: {
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import CreateModal from '@/components/CreateModal';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { useTodos } from '@/contexts/TodoContext';
import { useNotes } from '@/contexts/NotesContext';
import { Note } from '@/contexts/NotesContext';
import { getTasksForDate } from '@/utils/recurrence';
import TodoItem from '@/components/TodoItem';
import NoteCard from '@/components/NoteCard';

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

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getNotesForDate(notes: Note[], dateStr: string): Note[] {
  return notes.filter((note) => note.date === dateStr);
}

const RING_SIZE = 88;
const RING_RADIUS = 32;
const RING_STROKE = 7;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ProgressCard({
  total,
  completed,
  theme,
}: {
  total: number;
  completed: number;
  theme: any;
}) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - percent / 100);

  return (
    <View
      style={[
        progressStyles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.shadow,
        },
      ]}
    >
      <View style={progressStyles.ringWrap}>
        <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={theme.border}
            strokeWidth={RING_STROKE}
            fill="none"
          />
          {percent > 0 && (
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={theme.accent}
              strokeWidth={RING_STROKE}
              fill="none"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          )}
        </Svg>
        <View style={progressStyles.ringCenter}>
          <Text style={[progressStyles.ringPercent, { color: theme.accent, fontFamily: 'Inter_700Bold' }]}>
            {percent}%
          </Text>
        </View>
      </View>

      <View style={progressStyles.info}>
        <Text style={[progressStyles.cardTitle, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
          DAILY PROGRESS
        </Text>
        {total === 0 ? (
          <Text style={[progressStyles.statusText, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
            No tasks yet
          </Text>
        ) : (
          <>
            <Text style={[progressStyles.mainText, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
              {percent}% Completed
            </Text>
            <Text style={[progressStyles.subText, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              {completed} of {total} to-do{total !== 1 ? 's' : ''} done
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: {
    fontSize: 17,
    lineHeight: 20,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 10,
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  mainText: {
    fontSize: 18,
    lineHeight: 22,
  },
  subText: {
    fontSize: 13,
  },
  statusText: {
    fontSize: 15,
    fontStyle: 'italic',
    marginTop: 2,
  },
});

function SectionHeader({
  label,
  color,
  count,
}: {
  label: string;
  color: string;
  count: number;
}) {
  return (
    <View style={sectionHeaderStyles.row}>
      <View style={[sectionHeaderStyles.dot, { backgroundColor: color }]} />
      <Text style={[sectionHeaderStyles.label, { color }]}>{label} ({count})</Text>
    </View>
  );
}

const sectionHeaderStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
    marginTop: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
});

export default function DateDetailsScreen() {
  const { theme, isDark } = useTheme();
  const { todos, toggleTodo, deleteTodo } = useTodos();
  const { notes, deleteNote } = useNotes();
  const insets = useSafeAreaInsets();
  const { date } = useLocalSearchParams<{ date: string }>();

  const [addModal, setAddModal] = useState(false);

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const tasks = useMemo(
    () => (date ? getTasksForDate(todos, date) : []),
    [todos, date],
  );

  const dateNotes = useMemo(
    () => (date ? getNotesForDate(notes, date) : []),
    [notes, date],
  );

  const completedCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks],
  );

  const isEmpty = tasks.length === 0 && dateNotes.length === 0;

  const countLabel = useMemo(() => {
    const parts: string[] = [];
    if (tasks.length > 0) parts.push(`${tasks.length} To-Do${tasks.length !== 1 ? 's' : ''}`);
    if (dateNotes.length > 0) parts.push(`${dateNotes.length} Note${dateNotes.length !== 1 ? 's' : ''}`);
    return parts.join(' · ');
  }, [tasks.length, dateNotes.length]);

  const handleEditTask = useCallback(
    (item: { id: string; title: string; recurrence: string; dueDate?: string }) => {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({
        pathname: '/add-task',
        params: {
          id: item.id,
          title: item.title,
          recurrence: item.recurrence,
          defaultDate: item.dueDate || date || '',
        },
      });
    },
    [date],
  );

  const handleEditNote = useCallback(
    (note: Note) => {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({
        pathname: '/edit-note',
        params: { id: note.id },
      });
    },
    [],
  );

  const handleAddTodo = useCallback(() => {
    setAddModal(false);
    router.push({ pathname: '/add-task', params: { defaultDate: date || '' } });
  }, [date]);

  const handleAddNote = useCallback(() => {
    setAddModal(false);
    router.push({ pathname: '/edit-note', params: { prefillDate: date || '' } });
  }, [date]);

  const bottomPad = Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 20) + 20;

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View
        style={[
          styles.header,
          {
            paddingTop: (Platform.OS === 'web' ? webTopInset : insets.top) + 8,
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

        <View style={styles.headerCenter}>
          <Text
            style={[styles.dateTitle, { color: theme.text, fontFamily: 'Inter_700Bold' }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatDate(date)}
          </Text>
          {!!countLabel && (
            <Text
              style={[styles.countLabel, { color: theme.textSecondary, fontFamily: 'Inter_500Medium' }]}
            >
              {countLabel}
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setAddModal(true);
          }}
          hitSlop={12}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
      >
        {isEmpty ? (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: theme.surfaceSecondary }]}>
              <Ionicons name="calendar-outline" size={36} color={theme.textTertiary} />
            </View>
            <Text
              style={[styles.emptyTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}
            >
              Nothing planned yet
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}
            >
              Add something for {formatDateShort(date)}
            </Text>
            <View style={styles.emptyActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.emptyBtn,
                  { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleAddTodo}
              >
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={[styles.emptyBtnText, { color: '#fff', fontFamily: 'Inter_600SemiBold' }]}>
                  Add To-Do
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.emptyBtn,
                  { backgroundColor: theme.accentSecondary, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleAddNote}
              >
                <Ionicons name="document-text" size={18} color="#fff" />
                <Text style={[styles.emptyBtnText, { color: '#fff', fontFamily: 'Inter_600SemiBold' }]}>
                  Add Note
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <>
            {tasks.length > 0 && (
              <Animated.View entering={FadeInDown.duration(260).delay(0)}>
                <ProgressCard
                  total={tasks.length}
                  completed={completedCount}
                  theme={theme}
                />
              </Animated.View>
            )}

            {tasks.length > 0 && (
              <Animated.View entering={FadeInDown.duration(280).delay(40)}>
                <SectionHeader
                  label="To-Dos"
                  color={theme.accent}
                  count={tasks.length}
                />
                {tasks.map((item, i) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInDown.duration(240).delay(60 + i * 35)}
                    style={styles.itemSpacing}
                  >
                    <TodoItem
                      item={item}
                      onToggle={() => toggleTodo(item.id)}
                      onEdit={() => handleEditTask(item)}
                      onDelete={() => deleteTodo(item.id)}
                    />
                  </Animated.View>
                ))}
              </Animated.View>
            )}

            {dateNotes.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(280).delay(tasks.length > 0 ? 100 : 40)}
                style={tasks.length > 0 ? styles.sectionGap : undefined}
              >
                <SectionHeader
                  label="Notes"
                  color={theme.accentSecondary}
                  count={dateNotes.length}
                />
                {dateNotes.map((note, i) => (
                  <Animated.View
                    key={note.id}
                    entering={FadeInDown.duration(240).delay(i * 35)}
                    style={styles.itemSpacing}
                  >
                    <NoteCard
                      item={note}
                      accentColor={theme.accentSecondary}
                      onEdit={() => handleEditNote(note)}
                      onDelete={() => deleteNote(note.id)}
                    />
                  </Animated.View>
                ))}
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>

      <CreateModal
        visible={addModal}
        onClose={() => setAddModal(false)}
        onCreateTodo={handleAddTodo}
        onCreateNote={handleAddNote}
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
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  dateTitle: {
    fontSize: 16,
    lineHeight: 21,
  },
  countLabel: {
    fontSize: 13,
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
    paddingTop: 20,
  },
  itemSpacing: {
    marginBottom: 6,
  },
  sectionGap: {
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 72,
    gap: 8,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
  },
  emptyBtnText: {
    fontSize: 15,
  },
});

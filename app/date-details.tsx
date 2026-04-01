import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
  return notes.filter((note) => {
    const d = new Date(note.createdAt);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}` === dateStr;
  });
}

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
      <Text style={[sectionHeaderStyles.label, { color }]}>{label}</Text>
      <View style={[sectionHeaderStyles.badge, { backgroundColor: color + '20' }]}>
        <Text style={[sectionHeaderStyles.badgeText, { color }]}>{count}</Text>
      </View>
    </View>
  );
}

const sectionHeaderStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
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
  badge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
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
              <Animated.View entering={FadeInDown.duration(280).delay(0)}>
                <SectionHeader
                  label="To-Dos"
                  color={theme.accent}
                  count={tasks.length}
                />
                {tasks.map((item, i) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInDown.duration(240).delay(i * 35)}
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
                entering={FadeInDown.duration(280).delay(tasks.length > 0 ? 80 : 0)}
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

      <Modal
        transparent
        visible={addModal}
        animationType="fade"
        onRequestClose={() => setAddModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setAddModal(false)}>
          <View
            style={[styles.modalSheet, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.dragHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.modalDay, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
              {formatDateShort(date)}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              What would you like to add?
            </Text>

            <Pressable
              style={({ pressed }) => [styles.modalBtn, { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 }]}
              onPress={handleAddTodo}
            >
              <View style={styles.modalBtnIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </View>
              <Text style={[styles.modalBtnText, { color: '#fff', fontFamily: 'Inter_600SemiBold' }]}>
                Create To-Do
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.modalBtn, { backgroundColor: theme.accentSecondary, opacity: pressed ? 0.85 : 1 }]}
              onPress={handleAddNote}
            >
              <View style={styles.modalBtnIcon}>
                <Ionicons name="document-text" size={20} color="#fff" />
              </View>
              <Text style={[styles.modalBtnText, { color: '#fff', fontFamily: 'Inter_600SemiBold' }]}>
                Create Note
              </Text>
            </Pressable>

            <Pressable style={styles.modalCancelBtn} onPress={() => setAddModal(false)}>
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
    paddingTop: 18,
  },
  sectionGap: {
    marginTop: 8,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 28,
  },
  modalSheet: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 10,
    alignItems: 'stretch',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalDay: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 16,
    gap: 12,
  },
  modalBtnIcon: {
    width: 24,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 16,
    flex: 1,
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 2,
  },
  modalCancelText: {
    fontSize: 15,
  },
});

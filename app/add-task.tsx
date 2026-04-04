import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Switch,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTodos, RecurrenceType, RECURRENCE_LABELS } from '@/contexts/TodoContext';

const RECURRENCE_OPTIONS: RecurrenceType[] = ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', '6months', 'yearly'];

type Priority = 'none' | 'low' | 'medium' | 'high';

const PRIORITY_OPTIONS: { key: Priority; label: string; color: string; icon: string }[] = [
  { key: 'none', label: 'None', color: '', icon: 'remove-outline' },
  { key: 'low', label: 'Low', color: '#2A9D8F', icon: 'arrow-down-outline' },
  { key: 'medium', label: 'Medium', color: '#E8734A', icon: 'remove-outline' },
  { key: 'high', label: 'High', color: '#E63946', icon: 'arrow-up-outline' },
];

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function SectionLabel({ label, theme }: { label: string; theme: any }) {
  return (
    <Text style={[styles.sectionLabel, { color: theme.textTertiary, fontFamily: 'Inter_600SemiBold' }]}>
      {label}
    </Text>
  );
}

export default function AddTaskScreen() {
  const { theme, isDark } = useTheme();
  const { addTodo, updateTodo } = useTodos();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; title?: string; recurrence?: string; defaultDate?: string }>();
  const isEditing = !!params.id;

  const [text, setText] = useState(params.title || '');
  const [recurrence, setRecurrence] = useState<RecurrenceType>((params.recurrence as RecurrenceType) || 'none');
  const [dueDate, setDueDate] = useState<string>(params.defaultDate || '');

  const [details, setDetails] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [priority, setPriority] = useState<Priority>('none');

  const titleRef = useRef<TextInput>(null);
  const subtaskRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => titleRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = () => {
    if (!text.trim()) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isEditing && params.id) {
      updateTodo(params.id, text, recurrence, dueDate || undefined);
    } else {
      addTodo(text, recurrence, dueDate || undefined);
    }
    router.back();
  };

  const handleClearDate = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setDueDate('');
  };

  const handleAddSubtask = useCallback(() => {
    const trimmed = newSubtask.trim();
    if (!trimmed) { setAddingSubtask(false); return; }
    setSubtasks((prev) => [...prev, trimmed]);
    setNewSubtask('');
    setTimeout(() => subtaskRef.current?.focus(), 50);
  }, [newSubtask]);

  const handleRemoveSubtask = (index: number) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComingSoon = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Coming Soon', 'Sharing and collaboration will be available in a future update.');
  };

  const bg = isDark ? '#1A1A1A' : '#FFFFFF';
  const cardBg = isDark ? '#252525' : '#F8F7F4';
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 20) + 16;

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'Edit Task' : 'New Task',
          headerStyle: { backgroundColor: bg },
          headerTitleStyle: { color: theme.text, fontFamily: 'Inter_600SemiBold', fontSize: 18 },
          headerShadowVisible: false,
          headerTintColor: theme.text,
          headerTitleAlign: 'center',
          headerStatusBarHeight: insets.top,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: theme.accent, fontFamily: 'Inter_500Medium' }]}>
                Cancel
              </Text>
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={[styles.wrapper, { backgroundColor: bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── TITLE ── */}
          <SectionLabel label="TITLE" theme={theme} />
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: theme.border }]}>
            <TextInput
              ref={titleRef}
              style={[styles.titleInput, { color: theme.text, fontFamily: 'Inter_400Regular' }]}
              placeholder="What do you need to do?"
              placeholderTextColor={theme.textTertiary}
              value={text}
              onChangeText={setText}
              returnKeyType="done"
              multiline
              maxLength={200}
            />
          </View>

          {/* ── DATE ── */}
          <SectionLabel label="DATE" theme={theme} />
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: theme.border }]}>
            {dueDate ? (
              <View style={styles.dateRow}>
                <View style={[styles.datePill, { backgroundColor: theme.accent + '18', borderColor: theme.accent + '40' }]}>
                  <Ionicons name="calendar" size={14} color={theme.accent} />
                  <Text style={[styles.dateText, { color: theme.accent, fontFamily: 'Inter_600SemiBold' }]}>
                    {formatDateLabel(dueDate)}
                  </Text>
                  <Pressable onPress={handleClearDate} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={theme.accent} />
                  </Pressable>
                </View>
              </View>
            ) : (
              <Text style={[styles.emptyFieldText, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                No due date set
              </Text>
            )}
          </View>

          {/* ── REPEAT ── */}
          <SectionLabel label="REPEAT" theme={theme} />
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: theme.border, paddingHorizontal: 0 }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recurrenceRow}
              keyboardShouldPersistTaps="handled"
            >
              {RECURRENCE_OPTIONS.map((opt) => {
                const isActive = recurrence === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                      setRecurrence(opt);
                    }}
                    style={[
                      styles.recurrenceChip,
                      {
                        backgroundColor: isActive ? theme.accent : theme.inputBg,
                        borderColor: isActive ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.recurrenceText,
                        {
                          color: isActive ? '#fff' : theme.textSecondary,
                          fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_500Medium',
                        },
                      ]}
                    >
                      {RECURRENCE_LABELS[opt]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ── DETAILS ── */}
          <SectionLabel label="DETAILS" theme={theme} />
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: theme.border }]}>
            <TextInput
              style={[styles.detailsInput, { color: theme.text, fontFamily: 'Inter_400Regular' }]}
              placeholder="Add details..."
              placeholderTextColor={theme.textTertiary}
              value={details}
              onChangeText={setDetails}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
          </View>

          {/* ── SUBTASKS ── */}
          <View style={styles.subtaskSectionHeader}>
            <Text style={[styles.sectionLabel, { color: theme.textTertiary, fontFamily: 'Inter_600SemiBold', marginTop: 20, marginBottom: 7 }]}>
              SUBTASKS
            </Text>
            {subtasks.length > 0 && (
              <View style={[styles.subtaskCountBadge, { backgroundColor: theme.accent + '20' }]}>
                <Text style={[styles.subtaskCountText, { color: theme.accent, fontFamily: 'Inter_600SemiBold' }]}>
                  {subtasks.length}
                </Text>
              </View>
            )}
          </View>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: theme.border, paddingVertical: 4 }]}>
            {subtasks.length === 0 && !addingSubtask && (
              <View style={[styles.subtaskEmptyState, { borderColor: theme.border }]}>
                <Ionicons name="list-outline" size={20} color={theme.textTertiary} />
                <Text style={[styles.subtaskHint, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                  Break this task into smaller steps
                </Text>
              </View>
            )}

            {subtasks.map((sub, i) => (
              <View
                key={i}
                style={[
                  styles.subtaskRow,
                  { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
                ]}
              >
                <Ionicons name="checkmark-circle-outline" size={17} color={theme.accent} />
                <Text style={[styles.subtaskText, { color: theme.text, fontFamily: 'Inter_400Regular' }]} numberOfLines={2}>
                  {sub}
                </Text>
                <Pressable onPress={() => handleRemoveSubtask(i)} hitSlop={10}>
                  <Ionicons name="close" size={16} color={theme.textTertiary} />
                </Pressable>
              </View>
            ))}

            {addingSubtask ? (
              <View style={[styles.subtaskRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
                <Ionicons name="checkmark-circle-outline" size={17} color={theme.accent + '60'} />
                <TextInput
                  ref={subtaskRef}
                  style={[styles.subtaskInput, { color: theme.text, fontFamily: 'Inter_400Regular' }]}
                  placeholder="Subtask title..."
                  placeholderTextColor={theme.textTertiary}
                  value={newSubtask}
                  onChangeText={setNewSubtask}
                  returnKeyType="done"
                  onSubmitEditing={handleAddSubtask}
                  autoFocus
                  blurOnSubmit={false}
                  onBlur={() => {
                    if (!newSubtask.trim()) setAddingSubtask(false);
                    else handleAddSubtask();
                  }}
                />
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.addSubtaskBtn,
                { backgroundColor: pressed ? theme.accent + '10' : 'transparent' },
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setAddingSubtask(true);
              }}
            >
              <Ionicons name="add" size={17} color={theme.accent} />
              <Text style={[styles.addSubtaskText, { color: theme.accent, fontFamily: 'Inter_500Medium' }]}>
                Add subtask
              </Text>
            </Pressable>
          </View>

          {/* ── OPTIONS ── */}
          <SectionLabel label="OPTIONS" theme={theme} />
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: theme.border }]}>
            <Text style={[styles.optionGroupLabel, { color: theme.textSecondary, fontFamily: 'Inter_500Medium' }]}>
              Priority
            </Text>
            <View style={styles.priorityRow}>
              {PRIORITY_OPTIONS.map(({ key, label, color, icon }) => {
                const isActive = priority === key;
                const chipColor = key === 'none' ? theme.textSecondary : color;
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                      setPriority(key);
                    }}
                    style={[
                      styles.priorityChip,
                      {
                        backgroundColor: isActive
                          ? (key === 'none' ? theme.surfaceSecondary : chipColor + '22')
                          : (key === 'none' ? theme.inputBg : chipColor + '0D'),
                        borderColor: isActive ? chipColor : (key === 'none' ? theme.border : chipColor + '40'),
                        borderWidth: isActive ? 1.5 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name={icon as any}
                      size={13}
                      color={isActive ? chipColor : (key === 'none' ? theme.textTertiary : chipColor + 'AA')}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        {
                          color: isActive ? chipColor : (key === 'none' ? theme.textSecondary : chipColor + 'CC'),
                          fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_500Medium',
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.optionDivider, { backgroundColor: theme.border }]} />

            <View style={[styles.optionRow, { opacity: 0.45 }]}>
              <Ionicons name="notifications-outline" size={18} color={theme.textSecondary} />
              <Text style={[styles.optionRowLabel, { color: theme.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                Reminder
              </Text>
              <Text style={[styles.optionComingSoon, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                Coming soon
              </Text>
            </View>
          </View>

          {/* ── SHARING ── */}
          <SectionLabel label="SHARING" theme={theme} />
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: theme.border }]}>
            <Pressable style={[styles.optionRow, { opacity: 0.45 }]} onPress={handleComingSoon}>
              <Ionicons name="people-outline" size={18} color={theme.textSecondary} />
              <Text style={[styles.optionRowLabel, { color: theme.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                Share this task
              </Text>
              <Switch
                value={false}
                disabled
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor={Platform.OS === 'android' ? theme.surface : undefined}
              />
            </Pressable>

            <View style={[styles.optionDivider, { backgroundColor: theme.border }]} />

            <Pressable style={[styles.optionRow, { opacity: 0.45 }]} onPress={handleComingSoon}>
              <Ionicons name="pencil-outline" size={18} color={theme.textSecondary} />
              <Text style={[styles.optionRowLabel, { color: theme.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                Allow edits
              </Text>
              <Switch
                value={false}
                disabled
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor={Platform.OS === 'android' ? theme.surface : undefined}
              />
            </Pressable>

            <Text style={[styles.sharingHint, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              Sharing and collaboration will be available in a future update.
            </Text>
          </View>

          {/* ── SAVE ── */}
          <Pressable
            onPress={handleSave}
            disabled={!text.trim()}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: text.trim() ? theme.accent : theme.accent + '22',
                borderWidth: text.trim() ? 0 : 1.5,
                borderColor: theme.accent + '55',
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Ionicons name="checkmark" size={22} color={text.trim() ? '#fff' : theme.accent + 'AA'} />
            <Text
              style={[
                styles.saveText,
                {
                  color: text.trim() ? '#fff' : theme.accent + 'AA',
                  fontFamily: 'Inter_600SemiBold',
                },
              ]}
            >
              {isEditing ? 'Update Task' : 'Add Task'}
            </Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  cancelBtn: {
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 0,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.1,
    marginBottom: 7,
    marginTop: 20,
    paddingHorizontal: 2,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 0,
  },
  titleInput: {
    fontSize: 16,
    minHeight: 44,
    maxHeight: 110,
    lineHeight: 22,
  },
  emptyFieldText: {
    fontSize: 14,
    paddingVertical: 4,
    fontStyle: 'italic',
  },
  dateRow: {
    flexDirection: 'row',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 13,
  },
  recurrenceRow: {
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  recurrenceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurrenceText: {
    fontSize: 13,
  },
  detailsInput: {
    fontSize: 14,
    minHeight: 72,
    lineHeight: 20,
  },
  subtaskSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtaskCountBadge: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    marginTop: 14,
  },
  subtaskCountText: {
    fontSize: 11,
  },
  subtaskEmptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 2,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  subtaskText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  subtaskInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  addSubtaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 8,
  },
  addSubtaskText: {
    fontSize: 14,
  },
  subtaskHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  optionGroupLabel: {
    fontSize: 13,
    marginBottom: 10,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  priorityText: {
    fontSize: 13,
  },
  optionDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  optionRowLabel: {
    flex: 1,
    fontSize: 14,
  },
  optionComingSoon: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  sharingHint: {
    fontSize: 12,
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
    marginTop: 28,
  },
  saveText: {
    fontSize: 16,
  },
});

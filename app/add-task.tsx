import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTodos, RecurrenceType, RECURRENCE_LABELS } from '@/contexts/TodoContext';

const RECURRENCE_OPTIONS: RecurrenceType[] = ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', '6months', 'yearly'];

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function AddTaskSheet() {
  const { theme, isDark } = useTheme();
  const { addTodo, updateTodo } = useTodos();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; title?: string; recurrence?: string; defaultDate?: string }>();
  const isEditing = !!params.id;

  const [text, setText] = useState(params.title || '');
  const [recurrence, setRecurrence] = useState<RecurrenceType>((params.recurrence as RecurrenceType) || 'none');
  const [dueDate, setDueDate] = useState<string>(params.defaultDate || '');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
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

  // On iOS the formSheet shifts up natively when the keyboard opens — KAV
  // would create phantom bottom space. On Android we need KAV explicitly.
  const isIOS = Platform.OS === 'ios';
  const keyboardOffset = isIOS ? 0 : insets.top;
  // Inside an iOS formSheet the sheet is floating — no home-indicator inset needed.
  // On Android/web the scroll content must clear the nav bar / home indicator.
  const bottomPad = isIOS ? 16 : Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 16);

  return (
    <KeyboardAvoidingView
      style={[styles.wrapper, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}
      behavior="padding"
      keyboardVerticalOffset={keyboardOffset}
      enabled={!isIOS}
    >
      <View style={[styles.header, isIOS && styles.headerIOS]}>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
          {isEditing ? 'Edit Task' : 'New Task'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBg,
                color: theme.text,
                fontFamily: 'Inter_400Regular',
                borderColor: theme.border,
              },
            ]}
            placeholder="What do you need to do?"
            placeholderTextColor={theme.textTertiary}
            value={text}
            onChangeText={setText}
            returnKeyType="done"
            multiline
            maxLength={200}
          />
        </View>

        {dueDate ? (
          <View style={styles.dateRow}>
            <View style={[styles.datePill, { backgroundColor: theme.accent + '18', borderColor: theme.accent + '40', borderWidth: 1 }]}>
              <Ionicons name="calendar" size={14} color={theme.accent} />
              <Text style={[styles.dateText, { color: theme.accent, fontFamily: 'Inter_600SemiBold' }]}>
                {formatDateLabel(dueDate)}
              </Text>
              <Pressable onPress={handleClearDate} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={theme.accent} />
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text style={[styles.label, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
          Repeat
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recurrenceRow}
          style={styles.recurrenceScroll}
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

        <Pressable
          onPress={handleSave}
          disabled={!text.trim()}
          style={({ pressed }) => [
            styles.saveButton,
            {
              backgroundColor: text.trim() ? theme.accent : theme.inputBg,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              marginTop: 24,
            },
          ]}
        >
          <Ionicons name="checkmark" size={22} color={text.trim() ? '#fff' : theme.textTertiary} />
          <Text
            style={[
              styles.saveText,
              {
                color: text.trim() ? '#fff' : theme.textTertiary,
                fontFamily: 'Inter_600SemiBold',
              },
            ]}
          >
            {isEditing ? 'Update' : 'Add Task'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerIOS: {
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 18,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  inputWrapper: {
    marginBottom: 14,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 52,
    maxHeight: 120,
  },
  dateRow: {
    marginBottom: 14,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  dateText: {
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  recurrenceScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  recurrenceRow: {
    gap: 8,
    paddingBottom: 4,
    alignItems: 'center',
  },
  recurrenceChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurrenceText: {
    fontSize: 13,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveText: {
    fontSize: 16,
  },
});

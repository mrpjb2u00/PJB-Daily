import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTodos, RecurrenceType, RECURRENCE_LABELS } from '@/contexts/TodoContext';

const RECURRENCE_OPTIONS: RecurrenceType[] = ['none', 'daily', 'weekly', 'monthly', 'quarterly', '6months', 'yearly'];

export default function AddTaskSheet() {
  const { theme, isDark } = useTheme();
  const { addTodo, updateTodo } = useTodos();
  const params = useLocalSearchParams<{ id?: string; title?: string; recurrence?: string }>();
  const isEditing = !!params.id;

  const [text, setText] = useState(params.title || '');
  const [recurrence, setRecurrence] = useState<RecurrenceType>((params.recurrence as RecurrenceType) || 'none');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = () => {
    if (!text.trim()) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (isEditing && params.id) {
      updateTodo(params.id, text, recurrence);
    } else {
      addTodo(text, recurrence);
    }
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
          {isEditing ? 'Edit Task' : 'New Task'}
        </Text>
      </View>

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

      <Text style={[styles.label, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
        Repeat
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recurrenceRow}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
  },
  inputWrapper: {
    marginBottom: 18,
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
  label: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  recurrenceRow: {
    gap: 8,
    paddingBottom: 20,
  },
  recurrenceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
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

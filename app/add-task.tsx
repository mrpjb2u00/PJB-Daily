import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTodos } from '@/contexts/TodoContext';

export default function AddTaskSheet() {
  const { theme, isDark } = useTheme();
  const { addTodo, updateTodo } = useTodos();
  const params = useLocalSearchParams<{ id?: string; title?: string }>();
  const isEditing = !!params.id;

  const [text, setText] = useState(params.title || '');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = () => {
    if (!text.trim()) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (isEditing && params.id) {
      updateTodo(params.id, text);
    } else {
      addTodo(text);
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
          onSubmitEditing={handleSave}
          returnKeyType="done"
          multiline
          maxLength={200}
        />
      </View>

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
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
  },
  inputWrapper: {
    marginBottom: 20,
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

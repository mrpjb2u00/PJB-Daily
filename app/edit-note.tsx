import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotes } from '@/contexts/NotesContext';

export default function EditNoteScreen() {
  const { theme, isDark } = useTheme();
  const { addNote, updateNote } = useNotes();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; title?: string; content?: string }>();
  const isEditing = !!params.id;

  const [title, setTitle] = useState(params.title || '');
  const [content, setContent] = useState(params.content || '');
  const titleRef = useRef<TextInput>(null);

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  useEffect(() => {
    const timer = setTimeout(() => titleRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (isEditing && params.id) {
      updateNote(params.id, title, content);
    } else {
      addNote(title, content);
    }
    router.back();
  };

  const hasContent = title.trim() || content.trim();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View
        style={[
          styles.header,
          {
            paddingTop: (Platform.OS === 'web' ? webTopInset : insets.top) + 8,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.headerBtn}
        >
          <Ionicons name="close" size={24} color={theme.textSecondary} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
          {isEditing ? 'Edit Note' : 'New Note'}
        </Text>

        <Pressable
          onPress={handleSave}
          disabled={!hasContent}
          hitSlop={8}
          style={[styles.headerBtn, { opacity: hasContent ? 1 : 0.4 }]}
        >
          <Ionicons name="checkmark" size={24} color={theme.accent} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.body}>
          <TextInput
            ref={titleRef}
            style={[
              styles.titleInput,
              { color: theme.text, fontFamily: 'Inter_700Bold' },
            ]}
            placeholder="Title"
            placeholderTextColor={theme.textTertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          <TextInput
            style={[
              styles.contentInput,
              { color: theme.text, fontFamily: 'Inter_400Regular' },
            ]}
            placeholder="Start writing..."
            placeholderTextColor={theme.textTertiary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            scrollEnabled
          />
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  titleInput: {
    fontSize: 24,
    marginBottom: 16,
    paddingVertical: 4,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
});

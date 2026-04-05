import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  AppState,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotes } from '@/contexts/NotesContext';

const DRAFT_KEY = 'draft:note:new';

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function EditNoteScreen() {
  const { theme, isDark } = useTheme();
  const { notes, addNote, updateNote, noteDateSupported } = useNotes();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; prefillDate?: string }>();
  const isEditing = !!params.id;

  const existingNote = isEditing ? notes.find((n) => n.id === params.id) : undefined;

  const [title, setTitle] = useState(existingNote?.title || '');
  const [content, setContent] = useState(existingNote?.content || '');
  const [date, setDate] = useState<string>(
    existingNote?.date || params.prefillDate || '',
  );
  const [draftRestored, setDraftRestored] = useState(false);

  const titleRef = useRef<TextInput>(null);
  const draftRef = useRef({ title, content, date });
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = useRef(false);

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  // Keep draftRef in sync with latest values
  useEffect(() => {
    draftRef.current = { title, content, date };
  }, [title, content, date]);

  // Load draft on mount for new notes only
  useEffect(() => {
    if (isEditing) return;
    AsyncStorage.getItem(DRAFT_KEY).then((raw) => {
      if (!raw) return;
      try {
        const draft = JSON.parse(raw);
        if (draft.title || draft.content) {
          setTitle(draft.title || '');
          setContent(draft.content || '');
          setDate(draft.date || params.prefillDate || '');
          setDraftRestored(true);
          setTimeout(() => setDraftRestored(false), 3000);
        }
      } catch {}
    });
  }, []);

  // Focus title after mount
  useEffect(() => {
    const timer = setTimeout(() => titleRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  // Debounced autosave on field changes (new notes only)
  useEffect(() => {
    if (isEditing) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draftRef.current));
    }, 1500);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [title, content, date, isEditing]);

  // Save draft when app goes to background (new notes only)
  useEffect(() => {
    if (isEditing) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draftRef.current));
      }
    });
    return () => sub.remove();
  }, [isEditing]);

  // Save draft on unmount if not saved (new notes only)
  useEffect(() => {
    return () => {
      if (!isEditing && !savedRef.current) {
        AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draftRef.current));
      }
    };
  }, [isEditing]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    savedRef.current = true;
    if (!isEditing) AsyncStorage.removeItem(DRAFT_KEY);

    if (isEditing && params.id) {
      updateNote(params.id, title, content, date || undefined);
    } else {
      addNote(title, content, date || undefined);
    }
    router.back();
  };

  const handleClearDate = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setDate('');
  };

  const hasContent = title.trim() || content.trim();
  const noteColor = theme.accentSecondary;

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
          <Ionicons name="checkmark" size={24} color={noteColor} />
        </Pressable>
      </View>

      {draftRestored && (
        <View style={[styles.draftBanner, { backgroundColor: noteColor + '18', borderBottomColor: noteColor + '30' }]}>
          <Ionicons name="document-text-outline" size={14} color={noteColor} />
          <Text style={[styles.draftBannerText, { color: noteColor, fontFamily: 'Inter_500Medium' }]}>
            Draft restored
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.body, { paddingBottom: Math.max(insets.bottom, 24) + 32 }]}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
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
            returnKeyType="next"
          />

          {noteDateSupported && (
            <View style={styles.dateRow}>
              {date ? (
                <View
                  style={[
                    styles.datePill,
                    {
                      backgroundColor: noteColor + '18',
                      borderColor: noteColor + '40',
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Ionicons name="calendar" size={14} color={noteColor} />
                  <Text
                    style={[styles.dateText, { color: noteColor, fontFamily: 'Inter_600SemiBold' }]}
                  >
                    {formatDateLabel(date)}
                  </Text>
                  <Pressable onPress={handleClearDate} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={noteColor} />
                  </Pressable>
                </View>
              ) : (
                <Text
                  style={[styles.datePlaceholder, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}
                >
                  No date — note won't appear on calendar
                </Text>
              )}
            </View>
          )}

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
            scrollEnabled={false}
          />
        </ScrollView>
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
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  draftBannerText: {
    fontSize: 13,
  },
  body: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  titleInput: {
    fontSize: 24,
    marginBottom: 12,
    paddingVertical: 4,
  },
  dateRow: {
    marginBottom: 14,
    minHeight: 32,
    justifyContent: 'center',
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
  datePlaceholder: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  contentInput: {
    minHeight: 300,
    fontSize: 16,
    lineHeight: 24,
  },
});

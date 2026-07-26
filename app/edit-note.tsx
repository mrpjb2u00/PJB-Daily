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
import { formatCalendarDateLabel } from '@/utils/date';

const DRAFT_KEY = 'draft:note:new';

function formatDateLabel(dateStr: string): string {
  return formatCalendarDateLabel(dateStr, { month: 'long', day: 'numeric', year: 'numeric' });
}

function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
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
  const contentRef = useRef<TextInput>(null);
  const draftRef = useRef({ title, content, date });
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = useRef(false);
  const initialIsEditingRef = useRef(isEditing);
  const initialPrefillDateRef = useRef(params.prefillDate);

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  useEffect(() => {
    draftRef.current = { title, content, date };
  }, [title, content, date]);

  useEffect(() => {
    if (initialIsEditingRef.current) return;
    AsyncStorage.getItem(DRAFT_KEY).then((raw) => {
      if (!raw) return;
      try {
        const draft = JSON.parse(raw);
        if (draft.title || draft.content) {
          setTitle(draft.title || '');
          setContent(draft.content || '');
          setDate(draft.date || initialPrefillDateRef.current || '');
          setDraftRestored(true);
          setTimeout(() => setDraftRestored(false), 3000);
        }
      } catch {}
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => titleRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

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

  useEffect(() => {
    if (isEditing) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draftRef.current));
      }
    });
    return () => sub.remove();
  }, [isEditing]);

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
  const words = wordCount(content);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          { paddingTop: (Platform.OS === 'web' ? webTopInset : insets.top) + 10 },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Close note editor"
          accessibilityHint="Closes the editor"
        >
          <Ionicons name="close" size={22} color={theme.textSecondary} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.textSecondary, fontFamily: 'Inter_500Medium' }]}>
          {isEditing ? 'Edit Note' : 'New Note'}
        </Text>

        <Pressable
          onPress={handleSave}
          disabled={!hasContent}
          hitSlop={12}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel={isEditing ? 'Save note' : 'Create note'}
          accessibilityState={{ disabled: !hasContent }}
        >
          <Text
            style={[
              styles.doneBtn,
              { color: hasContent ? noteColor : theme.textTertiary, fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            Done
          </Text>
        </Pressable>
      </View>

      {/* ── Draft restored banner ── */}
      {draftRestored && (
        <View
          accessible
          accessibilityLiveRegion="polite"
          style={[styles.draftBanner, { backgroundColor: noteColor + '15', borderBottomColor: noteColor + '25' }]}
        >
          <Ionicons name="document-text-outline" size={13} color={noteColor} />
          <Text style={[styles.draftBannerText, { color: noteColor, fontFamily: 'Inter_500Medium' }]}>
            Draft restored
          </Text>
        </View>
      )}

      {/* ── Keyboard-aware scrollable editor ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.body, { paddingBottom: Math.max(insets.bottom, 24) + 40 }]}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          {/* Title */}
          <TextInput
            ref={titleRef}
            style={[styles.titleInput, { color: theme.text, fontFamily: 'Inter_700Bold' }]}
            placeholder="Title"
            placeholderTextColor={theme.textTertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            returnKeyType="next"
            onSubmitEditing={() => contentRef.current?.focus()}
            blurOnSubmit={false}
          />

          {/* Date metadata row */}
          {noteDateSupported && (
            <View style={styles.metaRow}>
              {date ? (
                <Pressable
                  style={[styles.metaChip, { backgroundColor: noteColor + '15', borderColor: noteColor + '35' }]}
                  onPress={handleClearDate}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove note date, ${formatDateLabel(date)}`}
                >
                  <Ionicons name="calendar-outline" size={13} color={noteColor} />
                  <Text style={[styles.metaChipText, { color: noteColor, fontFamily: 'Inter_600SemiBold' }]}>
                    {formatDateLabel(date)}
                  </Text>
                  <Ionicons name="close-circle" size={14} color={noteColor + 'CC'} />
                </Pressable>
              ) : (
                <View
                  style={[styles.metaChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  accessibilityRole="text"
                  accessibilityLabel="No date"
                >
                  <Ionicons name="calendar-outline" size={13} color={theme.textTertiary} />
                  <Text style={[styles.metaChipText, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                    No date
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Divider between meta and content */}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Content */}
          <TextInput
            ref={contentRef}
            style={[styles.contentInput, { color: theme.text, fontFamily: 'Inter_400Regular' }]}
            placeholder="Start writing…"
            placeholderTextColor={theme.textTertiary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />

          {/* Live word count */}
          {words > 0 && (
            <View style={styles.wordCountRow}>
              <Text style={[styles.wordCount, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                {words} {words === 1 ? 'word' : 'words'}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerBtn: {
    minWidth: 56,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    letterSpacing: 0.1,
  },
  doneBtn: {
    fontSize: 16,
    textAlign: 'right',
  },

  /* Draft banner */
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  draftBannerText: {
    fontSize: 12,
  },

  /* Body / scroll content */
  body: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 22,
  },

  /* Title */
  titleInput: {
    fontSize: 28,
    lineHeight: 36,
    marginBottom: 14,
    paddingVertical: 0,
  },

  /* Metadata row */
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  metaChipText: {
    fontSize: 12,
  },

  /* Divider */
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 20,
  },

  /* Content */
  contentInput: {
    minHeight: 300,
    fontSize: 16,
    lineHeight: 27,
  },

  /* Word count */
  wordCountRow: {
    marginTop: 20,
    alignItems: 'flex-start',
  },
  wordCount: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
});

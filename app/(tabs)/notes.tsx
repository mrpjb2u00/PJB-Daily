import React from 'react';
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
import { useNotes, Note } from '@/contexts/NotesContext';

function NoteCard({ note, onPress, onDelete }: { note: Note; onPress: () => void; onDelete: () => void }) {
  const { theme } = useTheme();

  const dateStr = new Date(note.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  const preview = note.content.length > 80 ? note.content.slice(0, 80) + '...' : note.content;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.noteCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.noteContent}>
        <Text
          style={[styles.noteTitle, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}
          numberOfLines={1}
        >
          {note.title}
        </Text>
        {!!preview && (
          <Text
            style={[styles.notePreview, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}
            numberOfLines={2}
          >
            {preview}
          </Text>
        )}
        <Text style={[styles.noteDate, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
          {dateStr}
        </Text>
      </View>
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onDelete();
        }}
        hitSlop={8}
        style={styles.deleteBtn}
      >
        <Feather name="trash-2" size={16} color={theme.destructive} />
      </Pressable>
    </Pressable>
  );
}

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { notes, deleteNote, isLoading } = useNotes();

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const handleAdd = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/edit-note');
  };

  const handleEdit = (note: Note) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/edit-note', params: { id: note.id, title: note.title, content: note.content } });
  };

  const handleLogout = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/');
    setTimeout(() => logout(), 100);
  };

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
        <Feather name="file-text" size={56} color={theme.textTertiary} />
        <Text
          style={[styles.emptyTitle, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}
        >
          No notes yet
        </Text>
        <Text
          style={[styles.emptyText, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}
        >
          Tap the button below to create your first note
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
            paddingTop: (Platform.OS === 'web' ? webTopInset : Math.max(insets.top, 24)) + 12,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary, fontFamily: 'Inter_500Medium' }]}>
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </Text>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
            My Notes
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
          >
            <Ionicons name="log-out-outline" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteCard note={item} onPress={() => handleEdit(item)} onDelete={() => deleteNote(item.id)} />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={notes.length > 0}
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
            colors={[theme.accentSecondary, theme.gradientEnd] as [string, string]}
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
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  noteContent: {
    flex: 1,
    gap: 4,
  },
  noteTitle: {
    fontSize: 16,
  },
  notePreview: {
    fontSize: 13,
    lineHeight: 18,
  },
  noteDate: {
    fontSize: 11,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 8,
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

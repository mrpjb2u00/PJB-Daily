import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { Note } from '@/contexts/NotesContext';

interface NoteCardProps {
  item: Note;
  accentColor?: string;
  onEdit: () => void;
  onDelete: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function NoteCard({ item, accentColor, onEdit, onDelete }: NoteCardProps) {
  const { theme } = useTheme();
  const color = accentColor ?? theme.accentSecondary;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const handleEdit = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit();
  };

  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
      <AnimatedPressable
        style={[
          styles.container,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderLeftColor: color,
          },
          animatedStyle,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleEdit}
      >
        <View style={[styles.iconWrap, { backgroundColor: color + '1A' }]}>
          <Ionicons name="document-text" size={16} color={color} />
        </View>

        <View style={styles.textArea}>
          <Text
            style={[styles.title, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}
            numberOfLines={1}
          >
            {item.title || 'Untitled'}
          </Text>
          {!!item.content && (
            <Text
              style={[styles.preview, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}
              numberOfLines={2}
            >
              {item.content}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleEdit}
            hitSlop={8}
            style={styles.actionBtn}
          >
            <Feather name="edit-2" size={16} color={theme.textTertiary} />
          </Pressable>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onDelete();
            }}
            hitSlop={8}
            style={styles.actionBtn}
          >
            <Feather name="trash-2" size={16} color={theme.destructive} />
          </Pressable>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
    marginBottom: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  textArea: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionBtn: {
    padding: 6,
  },
});

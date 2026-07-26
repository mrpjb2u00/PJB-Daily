import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { Todo, RECURRENCE_LABELS } from '@/contexts/TodoContext';

interface TodoItemProps {
  item: Todo;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function TodoItem({ item, onToggle, onEdit, onDelete }: TodoItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const taskTitle = item.title.trim() || 'Untitled task';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle();
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
      <AnimatedPressable
        style={[
          styles.container,
          {
            backgroundColor: item.completed ? theme.completedBg : theme.surface,
            borderColor: theme.border,
          },
          animatedStyle,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleToggle}
        accessible={false}
      >
        <Pressable
          onPress={handleToggle}
          hitSlop={8}
          style={styles.checkArea}
          accessibilityRole="checkbox"
          accessibilityLabel={item.completed ? `Mark ${taskTitle} incomplete` : `Mark ${taskTitle} complete`}
          accessibilityState={{ checked: item.completed }}
          accessibilityHint="Double tap to toggle completion"
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: item.completed ? theme.success : theme.textTertiary,
                backgroundColor: item.completed ? theme.success : 'transparent',
              },
            ]}
          >
            {item.completed && (
              <Ionicons name="checkmark" size={14} color="#fff" />
            )}
          </View>
        </Pressable>

        <View style={styles.textArea}>
          <Text
            style={[
              styles.title,
              {
                color: item.completed ? theme.completedText : theme.text,
                textDecorationLine: item.completed ? 'line-through' : 'none',
                fontFamily: 'Inter_500Medium',
              },
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {item.recurrence !== 'none' && (
            <View style={[styles.recurrenceBadge, { backgroundColor: theme.accentSecondary + '20' }]}>
              <Ionicons name="repeat" size={10} color={theme.accentSecondary} />
              <Text
                style={[
                  styles.recurrenceText,
                  { color: theme.accentSecondary, fontFamily: 'Inter_500Medium' },
                ]}
              >
                {RECURRENCE_LABELS[item.recurrence]}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onEdit();
            }}
            hitSlop={8}
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${taskTitle}`}
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
            accessibilityRole="button"
            accessibilityLabel={`Delete ${taskTitle}`}
            accessibilityHint="Deletes this task"
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  checkArea: {
    marginRight: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
  },
  recurrenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recurrenceText: {
    fontSize: 11,
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

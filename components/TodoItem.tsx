import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { Todo } from '@/contexts/TodoContext';

interface TodoItemProps {
  item: Todo;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function TodoItem({ item, onToggle, onEdit, onDelete }: TodoItemProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(item.completed ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    checkScale.value = item.completed ? withSpring(0) : withSpring(1, { damping: 12 });
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
      >
        <Pressable onPress={handleToggle} hitSlop={8} style={styles.checkArea}>
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
              <Animated.View style={checkAnimStyle}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </Animated.View>
            )}
          </View>
        </Pressable>

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

        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onEdit();
            }}
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
  title: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
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

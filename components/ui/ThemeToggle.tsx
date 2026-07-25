import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controls, IconSizes, Radii } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export default function ThemeToggle({
  accessibilityLabel,
  style,
  testID,
}: ThemeToggleProps) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? (isDark ? 'Switch to light mode' : 'Switch to dark mode')}
      accessibilityRole="button"
      hitSlop={Math.max(0, (Controls.minTouchTarget - Controls.iconButton) / 2)}
      onPress={toggleTheme}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.surfaceSecondary,
          opacity: pressed ? 0.72 : 1,
        },
        style,
      ]}
      testID={testID}
    >
      <Ionicons
        color={isDark ? theme.gradientEnd : theme.gradientStart}
        name={isDark ? 'sunny' : 'moon'}
        size={IconSizes.medium}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: Radii.pill,
    height: Controls.iconButton,
    justifyContent: 'center',
    width: Controls.iconButton,
  },
});

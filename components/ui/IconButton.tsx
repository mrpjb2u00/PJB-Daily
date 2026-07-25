import React, { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Controls, Radii } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';

type IconButtonSize = 'compact' | 'default' | 'large';
type IconButtonVariant = 'ghost' | 'surface' | 'accent' | 'destructive';

interface IconButtonProps extends Omit<PressableProps, 'accessibilityLabel' | 'children' | 'style'> {
  accessibilityLabel: string;
  children: ReactNode;
  disabled?: boolean;
  size?: IconButtonSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: IconButtonVariant;
}

const SIZE_STYLES: Record<IconButtonSize, { size: number; radius: number }> = {
  compact: { size: Controls.iconButton, radius: Radii.pill },
  default: { size: Controls.minTouchTarget, radius: Radii.lg },
  large: { size: Controls.iconButtonLarge, radius: Radii.lg },
};

export default function IconButton({
  accessibilityLabel,
  accessibilityState,
  children,
  disabled = false,
  hitSlop,
  size = 'default',
  style,
  testID,
  variant = 'ghost',
  ...pressableProps
}: IconButtonProps) {
  const { theme } = useTheme();
  const sizeStyle = SIZE_STYLES[size];
  const disabledState = disabled || accessibilityState?.disabled;

  const backgroundColor = {
    accent: theme.accent,
    destructive: theme.destructive + '15',
    ghost: 'transparent',
    surface: theme.surfaceSecondary,
  }[variant];

  return (
    <Pressable
      {...pressableProps}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled: disabledState }}
      disabled={disabled}
      hitSlop={hitSlop ?? Math.max(0, (Controls.minTouchTarget - sizeStyle.size) / 2)}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderRadius: sizeStyle.radius,
          height: sizeStyle.size,
          opacity: disabledState ? 0.45 : pressed ? 0.72 : 1,
          width: sizeStyle.size,
        },
        style,
      ]}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

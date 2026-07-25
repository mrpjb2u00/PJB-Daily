import React, { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BorderWidths, Radii, Shadows, Spacing } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';

type AppCardPadding = 'none' | 'small' | 'default' | 'large';
type AppCardRadius = 'card' | 'largeCard' | 'panel' | 'modal';
type AppCardShadow = 'none' | 'card';

interface AppCardProps {
  backgroundColor?: string;
  bordered?: boolean;
  borderColor?: string;
  children: ReactNode;
  padding?: AppCardPadding;
  radius?: AppCardRadius;
  shadow?: AppCardShadow;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const PADDING: Record<AppCardPadding, number> = {
  default: Spacing.cardPadding,
  large: Spacing.modalPadding,
  none: 0,
  small: Spacing[12],
};

export default function AppCard({
  backgroundColor,
  bordered = true,
  borderColor,
  children,
  padding = 'default',
  radius = 'card',
  shadow = 'none',
  style,
  testID,
}: AppCardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: backgroundColor ?? theme.surface,
          borderColor: borderColor ?? theme.border,
          borderRadius: Radii[radius],
          borderWidth: bordered ? BorderWidths.thin : 0,
          padding: PADDING[padding],
        },
        shadow === 'card' && Shadows.card,
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});

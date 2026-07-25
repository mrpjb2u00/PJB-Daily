import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BorderWidths } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';

interface DividerProps {
  color?: string;
  inset?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Divider({ color, inset = 0, style }: DividerProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: color ?? theme.border,
          marginLeft: inset,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: BorderWidths.hairline,
    width: '100%',
  },
});

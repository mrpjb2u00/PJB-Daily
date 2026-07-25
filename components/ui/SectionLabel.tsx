import React, { type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Spacing, Typography } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';

interface SectionLabelProps {
  children: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  textStyle?: StyleProp<TextStyle>;
  trailing?: ReactNode;
}

export default function SectionLabel({
  children,
  color,
  style,
  testID,
  textStyle,
  trailing,
}: SectionLabelProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.row, style]} testID={testID}>
      <Text
        style={[
          styles.label,
          { color: color ?? theme.textTertiary },
          textStyle,
        ]}
      >
        {children.toUpperCase()}
      </Text>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing[8],
    justifyContent: 'space-between',
    marginBottom: Spacing[8],
    marginLeft: Spacing[2],
  },
  label: {
    ...Typography.overline,
  },
  trailing: {
    flexShrink: 0,
  },
});

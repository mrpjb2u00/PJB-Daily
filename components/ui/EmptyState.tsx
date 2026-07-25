import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Spacing, Typography } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';

interface EmptyStateProps {
  action?: ReactNode;
  description?: string;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  title: string;
}

export default function EmptyState({
  action,
  description,
  icon,
  style,
  testID,
  title,
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View
      accessibilityRole="summary"
      style={[styles.container, style]}
      testID={testID}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.title, { color: theme.textSecondary }]}>
        {title}
      </Text>
      {description ? (
        <Text style={[styles.description, { color: theme.textTertiary }]}>
          {description}
        </Text>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    marginTop: Spacing[8],
  },
  container: {
    alignItems: 'center',
    gap: Spacing[12],
    justifyContent: 'center',
    paddingHorizontal: Spacing[40],
    paddingTop: Spacing[60],
  },
  description: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.sectionTitle,
    textAlign: 'center',
  },
});

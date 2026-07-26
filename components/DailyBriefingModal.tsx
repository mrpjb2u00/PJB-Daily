import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionLabel } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { getGreeting } from '@/utils/dailyBriefing';
import type { BriefingSection, DailyBriefingContent } from '@/utils/dailyBriefing';

interface DailyBriefingModalProps {
  visible: boolean;
  firstName?: string;
  content: DailyBriefingContent | null;
  onOpenMyDay: () => void;
  onDismiss: () => void;
}

function BriefingSectionView({
  title,
  color,
  section,
  textColor,
}: {
  title: string;
  color: string;
  section: BriefingSection;
  textColor: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionDot, { backgroundColor: color }]} />
        <SectionLabel
          color={color}
          style={styles.sectionLabelWrap}
          textStyle={styles.sectionTitle}
        >
          {`${title} - ${section.count}`}
        </SectionLabel>
      </View>
      <View style={styles.itemList}>
        {section.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={[styles.itemBullet, { backgroundColor: color }]} />
            <Text style={[styles.itemText, { color: textColor, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
        ))}
        {section.moreCount > 0 && (
          <Text style={[styles.moreText, { color, fontFamily: 'Inter_600SemiBold' }]}>
            +{section.moreCount} more
          </Text>
        )}
      </View>
    </View>
  );
}

export default function DailyBriefingModal({
  visible,
  firstName,
  content,
  onOpenMyDay,
  onDismiss,
}: DailyBriefingModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const usesNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    if (!visible) {
      fade.setValue(0);
      translateY.setValue(18);
      return;
    }

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: usesNativeDriver,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: usesNativeDriver,
      }),
    ]).start();
  }, [fade, translateY, usesNativeDriver, visible]);

  if (!content) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={[styles.backdrop, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 18 }]}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: fade,
              transform: [{ translateY }],
            },
          ]}
          accessibilityRole="summary"
          accessibilityLabel="Daily Briefing"
        >
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: theme.accent + '18' }]}>
              <Ionicons name="sunny" size={22} color={theme.accent} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.greeting, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
                {getGreeting(new Date(), firstName)}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                Here&apos;s what&apos;s on your schedule today.
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {content.todos && (
              <BriefingSectionView
                title="DUE TODAY"
                color={theme.accent}
                section={content.todos}
                textColor={theme.text}
              />
            )}
            {content.overdueTodos && (
              <BriefingSectionView
                title="OVERDUE"
                color={theme.destructive}
                section={content.overdueTodos}
                textColor={theme.text}
              />
            )}
            {content.notes && (
              <BriefingSectionView
                title="NOTES FOR TODAY"
                color={theme.accentSecondary}
                section={content.notes}
                textColor={theme.text}
              />
            )}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              onPress={onOpenMyDay}
              accessibilityRole="button"
              accessibilityLabel="Open My Day"
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.primaryText, { fontFamily: 'Inter_700Bold' }]}>
                Open My Day
              </Text>
            </Pressable>
            <Pressable
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Maybe Later"
              style={({ pressed }) => [
                styles.secondaryButton,
                { backgroundColor: theme.surfaceSecondary, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.secondaryText, { color: theme.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>
                Maybe Later
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.signature, { color: isDark ? theme.textTertiary : theme.textSecondary, fontFamily: 'Inter_500Medium' }]}>
            Plan • Organize • Accomplish
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '88%',
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  greeting: {
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  contentScroll: {
    marginTop: 20,
  },
  content: {
    gap: 18,
    paddingBottom: 4,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.9,
  },
  sectionLabelWrap: {
    marginBottom: 0,
    marginLeft: 0,
  },
  itemList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    minHeight: 24,
  },
  itemBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    flexShrink: 0,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
  moreText: {
    fontSize: 13,
    marginTop: 2,
    paddingLeft: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryText: {
    fontSize: 15,
  },
  signature: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 16,
  },
});

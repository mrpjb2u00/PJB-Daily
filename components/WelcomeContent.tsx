import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { ThemeToggle } from '@/components/ui';
import { Breakpoints } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';

const logoPreview = require('../assets/branding/logo-v1-preview.png');

function FeatureRow({
  icon,
  text,
  theme,
  isLargeScreen,
}: {
  icon: any;
  text: string;
  theme: any;
  isLargeScreen: boolean;
}) {
  return (
    <View style={styles.featureRow}>
      <View
        style={[
          styles.featureIcon,
          isLargeScreen && styles.tabletFeatureIcon,
          { backgroundColor: theme.surfaceSecondary },
        ]}
      >
        <Ionicons name={icon} size={isLargeScreen ? 22 : 20} color={theme.accent} />
      </View>
      <Text style={[styles.featureText, { color: theme.text, fontFamily: 'Inter_500Medium' }]}>
        {text}
      </Text>
    </View>
  );
}

export default function WelcomeContent() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { theme, isDark } = useTheme();

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;
  const isLargeScreen = width >= Breakpoints.tablet;

  const handleGetStarted = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/auth');
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <LinearGradient
        colors={
          isDark
            ? ['rgba(240,158,114,0.12)', 'rgba(240,158,114,0)', 'rgba(78,205,196,0.08)']
            : ['rgba(232,115,74,0.1)', 'rgba(232,115,74,0)', 'rgba(42,157,143,0.06)']
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ThemeToggle
        style={[
          styles.themeBtn,
          {
            top: (Platform.OS === 'web' ? webTopInset : insets.top) + 12,
          },
        ]}
      />

      <View
        style={[
          styles.centerContent,
          {
            paddingTop: (Platform.OS === 'web' ? webTopInset : insets.top) + 60,
            paddingBottom: (Platform.OS === 'web' ? webBottomInset : insets.bottom) + 40,
          },
        ]}
      >
        <View style={styles.iconWrap}>
          <Image
            source={logoPreview}
            style={styles.logoImage}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>

        <Text
          style={[styles.title, { color: theme.text, fontFamily: 'Inter_700Bold' }]}
        >
          PJB Daily
        </Text>
        <Text
          style={[styles.subtitle, { color: theme.textSecondary, fontFamily: 'Inter_500Medium' }]}
        >
          Plan • Organize • Accomplish
        </Text>

        <View style={[styles.featureList, isLargeScreen && styles.tabletFeatureList]}>
          <FeatureRow
            icon="checkbox-outline"
            text="Organize your tasks"
            theme={theme}
            isLargeScreen={isLargeScreen}
          />
          <FeatureRow
            icon="repeat-outline"
            text="Set recurring reminders"
            theme={theme}
            isLargeScreen={isLargeScreen}
          />
          <FeatureRow
            icon="document-text-outline"
            text="Capture quick notes"
            theme={theme}
            isLargeScreen={isLargeScreen}
          />
        </View>

        <View style={isLargeScreen ? styles.tabletSpacer : styles.phoneSpacer} />

        <View style={styles.bottomSection}>
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [
              styles.getStartedBtn,
              {
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <LinearGradient
              colors={[theme.gradientStart, theme.gradientEnd] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.getStartedGradient}
            >
              <Text style={[styles.getStartedText, { fontFamily: 'Inter_600SemiBold' }]}>
                Get Started
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>

          <Text style={[styles.footerText, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
            Your productivity, simplified
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  themeBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    marginBottom: 24,
    marginTop: 40,
  },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: 28,
  },
  title: {
    fontSize: 32,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginTop: 6,
    marginBottom: 48,
  },
  featureList: {
    width: '100%',
    maxWidth: 320,
    gap: 18,
  },
  tabletFeatureList: {
    maxWidth: 380,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletFeatureIcon: {
    width: 44,
    height: 44,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  phoneSpacer: {
    flex: 1,
  },
  tabletSpacer: {
    flexGrow: 0.45,
    flexShrink: 1,
    height: 36,
    maxHeight: 64,
  },
  bottomSection: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 16,
  },
  getStartedBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  getStartedGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  getStartedText: {
    fontSize: 17,
    color: '#fff',
  },
  footerText: {
    fontSize: 13,
  },
});

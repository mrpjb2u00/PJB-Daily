import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, isLoading, login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  React.useEffect(() => {
    if (!isLoading && user) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (user) return null;

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = isLogin
      ? await login(username, password)
      : await register(username, email, password);

    setSubmitting(false);
    if (result.success) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } else {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error || 'Something went wrong');
    }
  };

  const canSubmit = isLogin
    ? username.trim() && password
    : username.trim() && email.trim() && password;

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Pressable
        onPress={toggleTheme}
        style={[
          styles.themeBtn,
          {
            top: (Platform.OS === 'web' ? webTopInset : insets.top) + 12,
            backgroundColor: theme.surfaceSecondary,
          },
        ]}
      >
        <Ionicons
          name={isDark ? 'sunny' : 'moon'}
          size={18}
          color={isDark ? theme.gradientEnd : theme.gradientStart}
        />
      </Pressable>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: (Platform.OS === 'web' ? webTopInset : insets.top) + 80,
              paddingBottom: insets.bottom + 40,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={[theme.gradientStart, theme.gradientEnd] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Ionicons name="checkmark-done" size={36} color="#fff" />
          </LinearGradient>

          <Text style={[styles.appTitle, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
            To-Dos & Notes
          </Text>
          <Text style={[styles.appSubtitle, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            by PJB
          </Text>

          <View style={styles.form}>
            <View style={styles.tabRow}>
              <Pressable
                onPress={() => { setIsLogin(true); setError(''); }}
                style={[
                  styles.tabBtn,
                  isLogin && { borderBottomColor: theme.accent, borderBottomWidth: 2 },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isLogin ? theme.accent : theme.textTertiary,
                      fontFamily: 'Inter_600SemiBold',
                    },
                  ]}
                >
                  Sign In
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { setIsLogin(false); setError(''); }}
                style={[
                  styles.tabBtn,
                  !isLogin && { borderBottomColor: theme.accent, borderBottomWidth: 2 },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: !isLogin ? theme.accent : theme.textTertiary,
                      fontFamily: 'Inter_600SemiBold',
                    },
                  ]}
                >
                  Sign Up
                </Text>
              </Pressable>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.border,
                  fontFamily: 'Inter_400Regular',
                },
              ]}
              placeholder="Username"
              placeholderTextColor={theme.textTertiary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {!isLogin && (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    borderColor: theme.border,
                    fontFamily: 'Inter_400Regular',
                  },
                ]}
                placeholder="Email"
                placeholderTextColor={theme.textTertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            )}

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.border,
                  fontFamily: 'Inter_400Regular',
                },
              ]}
              placeholder="Password"
              placeholderTextColor={theme.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {!!error && (
              <Text style={[styles.errorText, { color: theme.destructive, fontFamily: 'Inter_500Medium' }]}>
                {error}
              </Text>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={submitting || !canSubmit}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  opacity: submitting || !canSubmit ? 0.5 : pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <LinearGradient
                colors={[theme.gradientStart, theme.gradientEnd] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.submitText, { fontFamily: 'Inter_600SemiBold' }]}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 28,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 16,
    marginTop: 4,
    marginBottom: 36,
  },
  form: {
    width: '100%',
    maxWidth: 360,
    gap: 14,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 15,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  submitBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  submitGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 16,
    color: '#fff',
  },
});

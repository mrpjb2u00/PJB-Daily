import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { router, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, supabaseConfigured } from '@/lib/supabaseClient';

const SAVED_EMAIL_KEY = '@pjb_last_email';

function friendlyResetError(message: string): string {
  const map: Record<string, string> = {
    'Invalid API key': 'Authentication service is misconfigured. Please contact the app administrator.',
    'Email rate limit exceeded': 'Too many attempts. Please wait a moment and try again.',
    'For security purposes, you can only request this after 60 seconds.': 'Please wait 60 seconds before trying again.',
  };
  return map[message] || 'Something went wrong. Please try again later.';
}

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
  const [showForgotSheet, setShowForgotSheet] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  useEffect(() => {
    AsyncStorage.getItem(SAVED_EMAIL_KEY).then((saved) => {
      if (saved) setEmail(saved);
    });
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/calendar" />;
  }

  const openForgotPasswordSheet = () => {
    setResetEmail('');
    setResetMessage('');
    setResetError('');
    setShowForgotSheet(true);
  };

  const handleResetPassword = async () => {
    if (!supabaseConfigured) {
      setResetError('Authentication service is not configured. Please contact the app administrator.');
      return;
    }
    const trimmed = resetEmail.trim().toLowerCase();
    if (!trimmed) {
      setResetError('Please enter your email address');
      return;
    }
    setResetError('');
    setResetMessage('');
    setResetSubmitting(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(trimmed);
    setResetSubmitting(false);
    if (resetErr) {
      setResetError(friendlyResetError(resetErr.message));
    } else {
      setResetMessage('Check your email for a password reset link.');
      setTimeout(() => setShowForgotSheet(false), 3000);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = isLogin
      ? await login(email, password)
      : await register(username, email, password);

    setSubmitting(false);
    if (result.success) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await AsyncStorage.setItem(SAVED_EMAIL_KEY, email.trim().toLowerCase());
      router.replace('/(tabs)/calendar');
    } else {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error || 'Something went wrong');
    }
  };

  const canSubmit = isLogin
    ? email.trim() && password
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
            by PJBStudios
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
                placeholder="Username"
                placeholderTextColor={theme.textTertiary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
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
              placeholder="Email"
              placeholderTextColor={theme.textTertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
            />

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

            {isLogin && (
              <Pressable onPress={openForgotPasswordSheet} style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={{ color: theme.accent, fontFamily: 'Inter_500Medium', fontSize: 14 }}>
                  Forgot Password?
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showForgotSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowForgotSheet(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setShowForgotSheet(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheetKeyboard}
          >
            <View
              style={[styles.sheetContent, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}
            >
              <View style={styles.sheetHandle}>
                <View style={[styles.sheetHandleBar, { backgroundColor: theme.border }]} />
              </View>

              <Text style={[styles.sheetTitle, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
                Reset Password
              </Text>
              <Text style={[styles.sheetDesc, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                Enter your email and we'll send you a reset link.
              </Text>

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
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />

              {!!resetError && (
                <Text style={[styles.errorText, { color: theme.destructive, fontFamily: 'Inter_500Medium' }]}>
                  {resetError}
                </Text>
              )}

              {!!resetMessage && (
                <Text style={[styles.successText, { color: '#34C759', fontFamily: 'Inter_500Medium' }]}>
                  {resetMessage}
                </Text>
              )}

              <Pressable
                onPress={handleResetPassword}
                disabled={resetSubmitting || !resetEmail.trim()}
                style={({ pressed }) => [
                  styles.submitBtn,
                  {
                    opacity: resetSubmitting || !resetEmail.trim() ? 0.5 : pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    marginTop: 4,
                  },
                ]}
              >
                <LinearGradient
                  colors={[theme.gradientStart, theme.gradientEnd] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {resetSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={[styles.submitText, { fontFamily: 'Inter_600SemiBold' }]}>
                      Reset Password
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  successText: {
    fontSize: 13,
    textAlign: 'center',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    flex: 1,
  },
  sheetKeyboard: {
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 28,
    paddingBottom: 40,
    minHeight: '50%',
  },
  sheetHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetTitle: {
    fontSize: 22,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  sheetDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
});

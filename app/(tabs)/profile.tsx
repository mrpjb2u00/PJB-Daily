import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  Switch,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppCard, Divider, SectionLabel } from '@/components/ui';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerAuthorization } from '@/contexts/OwnerAuthorizationContext';
import { useTodos } from '@/contexts/TodoContext';
import { useNotes } from '@/contexts/NotesContext';
import { deleteCurrentAccount } from '@/lib/accountDeletionService';
import { supabase, supabaseConfigured } from '@/lib/supabaseClient';
import { formatBirthday } from '@/utils/profile';

type DeleteAccountStep = 'closed' | 'warning' | 'password' | 'confirm';

const OWNER_DELETE_BLOCKED_MESSAGE =
  'This account is currently designated as the application owner and cannot be deleted. Transfer ownership or contact support before deleting this account.';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logout, updateProfile, resetAfterAccountDeletion } = useAuth();
  const { isOwner, isOwnerLoading, ownerAuthorizationError } = useOwnerAuthorization();
  const { todos } = useTodos();
  const { notes } = useNotes();
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [birthdayMonth, setBirthdayMonth] = useState('');
  const [birthdayDay, setBirthdayDay] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [deleteStep, setDeleteStep] = useState<DeleteAccountStep>('closed');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [reauthSubmitting, setReauthSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const topPad = Platform.OS === 'web' ? webTopInset : Math.max(insets.top, 24);
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 20) + 16;

  useEffect(() => {
    setFirstName(user?.firstName || '');
    setUsername(user?.username || '');
    setBirthdayMonth(user?.birthdayMonth ? String(user.birthdayMonth) : '');
    setBirthdayDay(user?.birthdayDay ? String(user.birthdayDay) : '');
    setProfileMessage('');
    setProfileError('');
  }, [user]);

  const displayName = user?.firstName || user?.username || 'User';
  const initial = displayName.charAt(0).toUpperCase() || '?';
  const openTodoCount = todos.filter((t) => !t.completed).length;
  const noteCount = notes.length;

  const handleThemeToggle = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    toggleTheme();
  };

  const handleLogout = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logout();
  };

  const openDeleteAccountFlow = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setDeleteMessage('');
    setDeleteError('');
    setDeletePassword('');
    setDeleteStep('warning');
  };

  const closeDeleteAccountFlow = () => {
    if (reauthSubmitting || deleteSubmitting) return;
    setDeleteStep('closed');
    setDeletePassword('');
    setDeleteError('');
  };

  const continueToPassword = () => {
    setDeleteError('');
    setDeletePassword('');
    setDeleteStep('password');
  };

  const handlePasswordReauthentication = async () => {
    if (reauthSubmitting || deleteSubmitting) return;
    const email = user?.email?.trim().toLowerCase();

    if (!email || !deletePassword) {
      setDeleteError('Enter your password to continue.');
      return;
    }

    if (!supabaseConfigured) {
      setDeleteError('Account deletion is not available right now. Please try again later.');
      return;
    }

    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setDeleteError('');
    setReauthSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: deletePassword,
    });
    setReauthSubmitting(false);

    if (error) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setDeleteError('That password was not accepted. Please check it and try again.');
      return;
    }

    setDeletePassword('');
    setDeleteStep('confirm');
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteSubmitting || reauthSubmitting) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setDeleteError('');
    setDeleteSubmitting(true);
    const result = await deleteCurrentAccount();

    if (result.status === 'deleted') {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDeleteStep('closed');
      setDeletePassword('');
      setDeleteSubmitting(false);
      await resetAfterAccountDeletion();
      router.replace('/');
      return;
    }

    setDeleteSubmitting(false);

    if (result.status === 'owner_blocked') {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setDeleteStep('closed');
      setDeleteMessage(OWNER_DELETE_BLOCKED_MESSAGE);
      return;
    }

    if (result.status === 'unauthorized') {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setDeleteError('Your session needs to be refreshed before deleting this account. Please sign in again and retry.');
      return;
    }

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setDeleteError('We could not delete your account right now. Check your connection and try again.');
  };

  const handleOpenOwnerAnalytics = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    router.push('/owner-analytics');
  };

  const handleRemoveBirthday = () => {
    setBirthdayMonth('');
    setBirthdayDay('');
    setProfileMessage('');
    setProfileError('');
  };

  const handleSaveProfile = async () => {
    if (profileSubmitting) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setProfileMessage('');
    setProfileError('');
    setProfileSubmitting(true);
    const birthday = birthdayMonth.trim() || birthdayDay.trim()
      ? { month: Number(birthdayMonth), day: Number(birthdayDay) }
      : null;
    const result = await updateProfile(firstName, username, birthday);
    setProfileSubmitting(false);
    if (result.success) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setProfileMessage('Personal information saved.');
    } else {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setProfileError(result.error || 'Could not save personal information.');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── PROFILE HEADER CARD ── */}
        <AppCard padding="none" radius="panel" style={styles.profileCard}>
          <LinearGradient
            colors={[theme.gradientStart + '22', theme.gradientEnd + '10']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCardGradient}
          >
            <LinearGradient
              colors={[theme.gradientStart, theme.gradientEnd] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarCircle}
            >
              <Text style={[styles.avatarInitial, { fontFamily: 'Inter_700Bold' }]}>
                {initial}
              </Text>
            </LinearGradient>

            <Text style={[styles.profileName, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
              {displayName}
            </Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              {user?.email || ''}
            </Text>
          </LinearGradient>
        </AppCard>

        <SectionLabel textStyle={styles.sectionLabelText}>Personal Information</SectionLabel>
        <AppCard padding="none" style={[styles.card, styles.formCard]}>
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
            placeholder="First Name"
            placeholderTextColor={theme.textTertiary}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            autoCorrect={false}
            textContentType="givenName"
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
            placeholder="Username"
            placeholderTextColor={theme.textTertiary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
          />

          <View style={styles.birthdayGroup}>
            <View style={styles.birthdayHeader}>
              <Text style={[styles.helperText, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                Birthday optional. Used only for birthday greetings.
              </Text>
              <Text style={[styles.birthdayValue, { color: theme.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                {formatBirthday(Number(birthdayMonth), Number(birthdayDay))}
              </Text>
            </View>
            <View style={styles.birthdayRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.birthdayInput,
                  {
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    borderColor: theme.border,
                    fontFamily: 'Inter_400Regular',
                  },
                ]}
                placeholder="Month"
                placeholderTextColor={theme.textTertiary}
                value={birthdayMonth}
                onChangeText={setBirthdayMonth}
                keyboardType="number-pad"
                maxLength={2}
              />
              <TextInput
                style={[
                  styles.input,
                  styles.birthdayInput,
                  {
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    borderColor: theme.border,
                    fontFamily: 'Inter_400Regular',
                  },
                ]}
                placeholder="Day"
                placeholderTextColor={theme.textTertiary}
                value={birthdayDay}
                onChangeText={setBirthdayDay}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Pressable
                onPress={handleRemoveBirthday}
                accessibilityRole="button"
                accessibilityLabel="Remove Birthday"
                style={({ pressed }) => [
                  styles.clearBirthdayButton,
                  {
                    borderColor: theme.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>
          </View>

          {!!profileError && (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.feedbackText, { color: theme.destructive, fontFamily: 'Inter_500Medium' }]}
            >
              {profileError}
            </Text>
          )}
          {!!profileMessage && (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.feedbackText, { color: theme.success, fontFamily: 'Inter_500Medium' }]}
            >
              {profileMessage}
            </Text>
          )}

          <Pressable
            onPress={handleSaveProfile}
            disabled={profileSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Save Personal Information"
            accessibilityState={{ disabled: profileSubmitting }}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: theme.accent,
                opacity: profileSubmitting ? 0.55 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {profileSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[styles.saveButtonText, { fontFamily: 'Inter_700Bold' }]}>
                Save Personal Information
              </Text>
            )}
          </Pressable>
        </AppCard>

        {/* ── STATS ROW ── */}
        <View style={styles.statsRow}>
          <AppCard padding="none" style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.accent, fontFamily: 'Inter_700Bold' }]}>
              {openTodoCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textTertiary, fontFamily: 'Inter_500Medium' }]}>
              Open To-Dos
            </Text>
          </AppCard>
          <AppCard padding="none" style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.accentSecondary, fontFamily: 'Inter_700Bold' }]}>
              {noteCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textTertiary, fontFamily: 'Inter_500Medium' }]}>
              Notes
            </Text>
          </AppCard>
        </View>

        {/* ── PREFERENCES ── */}
        <SectionLabel textStyle={styles.sectionLabelText}>Preferences</SectionLabel>
        <AppCard padding="none" style={styles.card}>
          <Pressable
            onPress={handleThemeToggle}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: isDark ? '#3A2A00' : '#FFF4E6' }]}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny-outline'}
                size={18}
                color={isDark ? '#F4C68A' : '#E8734A'}
              />
            </View>
            <Text style={[styles.rowLabel, { color: theme.text, fontFamily: 'Inter_500Medium' }]}>
              Dark Mode
            </Text>
            <Switch
              value={isDark}
              onValueChange={handleThemeToggle}
              trackColor={{ false: theme.border, true: theme.accent + 'CC' }}
              thumbColor={Platform.OS === 'android' ? (isDark ? theme.accent : theme.surface) : undefined}
            />
          </Pressable>
        </AppCard>

        {/* ── ACCOUNT ── */}
        <SectionLabel textStyle={styles.sectionLabelText}>Account</SectionLabel>
        <AppCard padding="none" style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: theme.accent + '15' }]}>
              <Ionicons name="person-outline" size={18} color={theme.accent} />
            </View>
            <View style={styles.rowTextStack}>
              <Text style={[styles.rowMeta, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                Username
              </Text>
              <Text style={[styles.rowValue, { color: theme.text, fontFamily: 'Inter_500Medium' }]}>
                {user?.username || '—'}
              </Text>
            </View>
          </View>

          <Divider inset={60} />

          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: theme.accent + '15' }]}>
              <Ionicons name="mail-outline" size={18} color={theme.accent} />
            </View>
            <View style={styles.rowTextStack}>
              <Text style={[styles.rowMeta, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                Email
              </Text>
              <Text style={[styles.rowValue, { color: theme.text, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>
                {user?.email || '—'}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* ── SESSION ── */}
        {isOwner && !isOwnerLoading && !ownerAuthorizationError && (
          <>
            <SectionLabel textStyle={styles.sectionLabelText}>Owner</SectionLabel>
            <AppCard padding="none" style={styles.card}>
              <Pressable
                onPress={handleOpenOwnerAnalytics}
                style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Open Owner Analytics"
              >
                <View style={[styles.iconWrap, { backgroundColor: theme.accentSecondary + '15' }]}>
                  <Ionicons name="analytics-outline" size={18} color={theme.accentSecondary} />
                </View>
                <View style={styles.rowTextStack}>
                  <Text style={[styles.rowLabel, { color: theme.text, fontFamily: 'Inter_500Medium' }]}>
                    Owner Analytics
                  </Text>
                  <Text style={[styles.rowMeta, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                    Aggregate app insights
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
              </Pressable>
            </AppCard>
          </>
        )}

        <SectionLabel textStyle={styles.sectionLabelText}>Account Management</SectionLabel>
        <AppCard padding="none" borderColor={theme.destructive + '35'} style={styles.card}>
          <Pressable
            onPress={openDeleteAccountFlow}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Delete Account"
            accessibilityHint="Opens account deletion information and confirmation"
          >
            <View style={[styles.iconWrap, { backgroundColor: theme.destructive + '15' }]}>
              <Ionicons name="trash-outline" size={18} color={theme.destructive} />
            </View>
            <View style={styles.rowTextStack}>
              <Text style={[styles.rowLabel, { color: theme.destructive, fontFamily: 'Inter_600SemiBold' }]}>
                Delete Account
              </Text>
              <Text style={[styles.rowMeta, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                Permanently remove your account and data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.destructive + '80'} />
          </Pressable>
        </AppCard>

        {!!deleteMessage && (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.accountFeedbackText, { color: theme.destructive, fontFamily: 'Inter_500Medium' }]}
          >
            {deleteMessage}
          </Text>
        )}

        <SectionLabel textStyle={styles.sectionLabelText}>Session</SectionLabel>
        <AppCard padding="none" borderColor={theme.destructive + '35'} style={styles.card}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
            testID="profile-logout-button"
            accessibilityRole="button"
            accessibilityLabel="Sign Out"
          >
            <View style={[styles.iconWrap, { backgroundColor: theme.destructive + '15' }]}>
              <Ionicons name="log-out-outline" size={18} color={theme.destructive} />
            </View>
            <Text style={[styles.rowLabel, { color: theme.destructive, fontFamily: 'Inter_600SemiBold' }]}>
              Sign Out
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.destructive + '80'} />
          </Pressable>
        </AppCard>

        <Text style={[styles.footerText, { color: theme.textTertiary, fontFamily: 'Inter_400Regular' }]}>
          PJB Daily
        </Text>

      </ScrollView>

      <Modal
        visible={deleteStep !== 'closed'}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteAccountFlow}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={closeDeleteAccountFlow}
            accessible={false}
            importantForAccessibility="no"
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboard}
          >
            <View
              style={[styles.deleteSheet, { backgroundColor: theme.surface, borderColor: theme.border }]}
              accessibilityViewIsModal
            >
              {deleteStep === 'warning' && (
                <>
                  <View style={[styles.warningIcon, { backgroundColor: theme.destructive + '15' }]}>
                    <Ionicons name="warning-outline" size={24} color={theme.destructive} />
                  </View>
                  <Text style={[styles.modalTitle, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
                    Delete your account
                  </Text>
                  <Text style={[styles.modalBody, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                    Deleting your account permanently removes your profile, all To-Dos, all Notes, and Daily Briefing account history.
                  </Text>
                  <Text style={[styles.modalBodyStrong, { color: theme.destructive, fontFamily: 'Inter_600SemiBold' }]}>
                    This action cannot be undone.
                  </Text>
                  <View style={styles.modalActions}>
                    <Pressable
                      onPress={closeDeleteAccountFlow}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel account deletion"
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        { borderColor: theme.border, opacity: pressed ? 0.75 : 1 },
                      ]}
                    >
                      <Text style={[styles.secondaryButtonText, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={continueToPassword}
                      accessibilityRole="button"
                      accessibilityLabel="Continue account deletion"
                      style={({ pressed }) => [
                        styles.destructiveButton,
                        { backgroundColor: theme.destructive, opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <Text style={[styles.destructiveButtonText, { fontFamily: 'Inter_700Bold' }]}>
                        Continue
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}

              {deleteStep === 'password' && (
                <>
                  <Text style={[styles.modalTitle, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
                    Confirm Your Password
                  </Text>
                  <Text style={[styles.modalBody, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                    Re-enter the password for {user?.email || 'your account'} before continuing.
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
                    placeholder="Password"
                    placeholderTextColor={theme.textTertiary}
                    value={deletePassword}
                    onChangeText={(value) => {
                      setDeletePassword(value);
                      setDeleteError('');
                    }}
                    secureTextEntry
                    textContentType="password"
                    autoComplete="current-password"
                    returnKeyType="done"
                    editable={!reauthSubmitting}
                    accessibilityLabel="Current password"
                    onSubmitEditing={handlePasswordReauthentication}
                  />
                  {!!deleteError && (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={[styles.modalError, { color: theme.destructive, fontFamily: 'Inter_500Medium' }]}
                    >
                      {deleteError}
                    </Text>
                  )}
                  <View style={styles.modalActions}>
                    <Pressable
                      onPress={closeDeleteAccountFlow}
                      disabled={reauthSubmitting}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel account deletion"
                      accessibilityState={{ disabled: reauthSubmitting }}
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        { borderColor: theme.border, opacity: reauthSubmitting ? 0.55 : pressed ? 0.75 : 1 },
                      ]}
                    >
                      <Text style={[styles.secondaryButtonText, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handlePasswordReauthentication}
                      disabled={reauthSubmitting || !deletePassword}
                      accessibilityRole="button"
                      accessibilityLabel="Continue after password confirmation"
                      accessibilityState={{ disabled: reauthSubmitting || !deletePassword, busy: reauthSubmitting }}
                      style={({ pressed }) => [
                        styles.destructiveButton,
                        {
                          backgroundColor: theme.destructive,
                          opacity: reauthSubmitting || !deletePassword ? 0.55 : pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      {reauthSubmitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={[styles.destructiveButtonText, { fontFamily: 'Inter_700Bold' }]}>
                          Continue
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </>
              )}

              {deleteStep === 'confirm' && (
                <>
                  <View style={[styles.warningIcon, { backgroundColor: theme.destructive + '15' }]}>
                    <Ionicons name="trash-outline" size={24} color={theme.destructive} />
                  </View>
                  <Text style={[styles.modalTitle, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>
                    Delete Account
                  </Text>
                  <Text style={[styles.modalBody, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                    This will permanently delete your account and all associated data.
                  </Text>
                  <Text style={[styles.modalBodyStrong, { color: theme.destructive, fontFamily: 'Inter_600SemiBold' }]}>
                    This action cannot be undone.
                  </Text>
                  {!!deleteError && (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={[styles.modalError, { color: theme.destructive, fontFamily: 'Inter_500Medium' }]}
                    >
                      {deleteError}
                    </Text>
                  )}
                  <View style={styles.modalActions}>
                    <Pressable
                      onPress={closeDeleteAccountFlow}
                      disabled={deleteSubmitting}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel final account deletion"
                      accessibilityState={{ disabled: deleteSubmitting }}
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        { borderColor: theme.border, opacity: deleteSubmitting ? 0.55 : pressed ? 0.75 : 1 },
                      ]}
                    >
                      <Text style={[styles.secondaryButtonText, { color: theme.text, fontFamily: 'Inter_600SemiBold' }]}>
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleConfirmDeleteAccount}
                      disabled={deleteSubmitting}
                      accessibilityRole="button"
                      accessibilityLabel="Permanently delete account"
                      accessibilityState={{ disabled: deleteSubmitting, busy: deleteSubmitting }}
                      style={({ pressed }) => [
                        styles.destructiveButton,
                        {
                          backgroundColor: theme.destructive,
                          opacity: deleteSubmitting ? 0.55 : pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      {deleteSubmitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={[styles.destructiveButtonText, { fontFamily: 'Inter_700Bold' }]}>
                          Delete Account
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </>
              )}
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
  content: {
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },

  /* Profile card */
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  profileCardGradient: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 20,
    gap: 6,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarInitial: {
    fontSize: 34,
    color: '#fff',
  },
  profileName: {
    fontSize: 22,
    lineHeight: 28,
  },
  profileEmail: {
    fontSize: 14,
    lineHeight: 18,
  },

  /* Stats row */
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 30,
    lineHeight: 34,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },

  /* Section label */
  sectionLabelText: {
    letterSpacing: 1.1,
  },

  /* Card */
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
  },
  formCard: {
    padding: 14,
    gap: 12,
  },
  input: {
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  birthdayGroup: {
    gap: 8,
  },
  birthdayHeader: {
    gap: 2,
  },
  birthdayRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  birthdayInput: {
    flex: 1,
  },
  clearBirthdayButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
  },
  birthdayValue: {
    fontSize: 13,
    lineHeight: 18,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  accountFeedbackText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -12,
    marginBottom: 24,
    textAlign: 'center',
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
  },

  /* Row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
  },
  rowTextStack: {
    flex: 1,
    gap: 2,
  },
  rowMeta: {
    fontSize: 11,
  },
  rowValue: {
    fontSize: 15,
  },
  /* Footer */
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalKeyboard: {
    justifyContent: 'center',
  },
  deleteSheet: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  warningIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  modalBodyStrong: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  modalError: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    fontSize: 15,
    textAlign: 'center',
  },
  destructiveButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  destructiveButtonText: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
  },
});

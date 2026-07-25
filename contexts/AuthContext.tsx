import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase, supabaseConfigured } from '@/lib/supabaseClient';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { validateProfileInput } from '@/utils/profile';

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  birthdayMonth?: number | null;
  birthdayDay?: number | null;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    firstName: string,
    username: string,
    email: string,
    password: string,
    birthday?: { month: number; day: number } | null,
  ) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (
    firstName: string,
    username: string,
    birthday?: { month: number; day: number } | null,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const NOT_CONFIGURED_MSG = 'Authentication service is not configured. Please contact the app administrator.';
const PROFILE_TABLE = 'profiles';

function friendlyError(message: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials': 'Incorrect email or password. Please try again.',
    'Invalid API key': 'Authentication service is misconfigured. Please contact the app administrator.',
    'User already registered': 'An account with this email already exists. Try signing in instead.',
    'Email rate limit exceeded': 'Too many attempts. Please wait a moment and try again.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters.',
    'For security purposes, you can only request this after 60 seconds.': 'Please wait 60 seconds before trying again.',
    'Signup requires a valid password': 'Please enter a valid password (at least 6 characters).',
    'Email not confirmed': 'Please check your email and confirm your account before signing in.',
    'New password should be different from the old password.': 'Your new password must be different from your current one.',
  };
  return map[message] || 'Something went wrong. Please try again later.';
}

interface ProfileRow {
  username?: string | null;
  first_name?: string | null;
  birthday_month?: number | null;
  birthday_day?: number | null;
}

function authUserToUser(authUser: SupabaseUser | null | undefined, profile?: ProfileRow | null): User | null {
  if (!authUser) return null;
  const meta = authUser.user_metadata || {};
  return {
    id: authUser.id,
    username: profile?.username || meta.username || authUser.email?.split('@')[0] || 'user',
    email: authUser.email || '',
    firstName: profile?.first_name || (typeof meta.first_name === 'string' ? meta.first_name : undefined),
    birthdayMonth: typeof profile?.birthday_month === 'number'
      ? profile.birthday_month
      : typeof meta.birthday_month === 'number' ? meta.birthday_month : null,
    birthdayDay: typeof profile?.birthday_day === 'number'
      ? profile.birthday_day
      : typeof meta.birthday_day === 'number' ? meta.birthday_day : null,
  };
}

function isMissingProfileTableError(code?: string): boolean {
  return code === '42P01' || code === 'PGRST205';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserFromSession = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      return;
    }

    const { data, error } = await supabase
      .from(PROFILE_TABLE)
      .select('username, first_name, birthday_month, birthday_day')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error && !isMissingProfileTableError(error.code)) {
      console.error('Failed to load profile:', error.message);
    }

    setUser(authUserToUser(session.user, error ? null : data));
  }, []);

  const saveProfileRow = useCallback(async (
    userId: string,
    firstName: string,
    username: string,
    birthdayMonth: number | null,
    birthdayDay: number | null,
  ) => {
    const { error } = await supabase
      .from(PROFILE_TABLE)
      .upsert({
        id: userId,
        username,
        first_name: firstName,
        birthday_month: birthdayMonth,
        birthday_day: birthdayDay,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      return {
        success: false,
        error: isMissingProfileTableError(error.code)
          ? 'Profile storage is not ready yet. Please apply the reviewed profile migration first.'
          : error.message,
      };
    }

    return { success: true };
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUserFromSession(session).finally(() => setIsLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUserFromSession(session);
    });

    return () => subscription.unsubscribe();
  }, [loadUserFromSession]);

  const login = useCallback(async (email: string, password: string) => {
    if (!supabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_MSG };
    }
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail || !password) {
      return { success: false, error: 'Please fill in all fields' };
    }
    const { error } = await supabase.auth.signInWithPassword({ email: trimEmail, password });
    if (error) return { success: false, error: friendlyError(error.message) };
    return { success: true };
  }, []);

  const register = useCallback(async (
    firstName: string,
    username: string,
    email: string,
    password: string,
    birthday?: { month: number; day: number } | null,
  ) => {
    if (!supabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_MSG };
    }
    const profile = validateProfileInput({ firstName, username, birthday });
    if (!profile.valid) {
      return { success: false, error: profile.error };
    }
    const trimUser = profile.username || '';
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail || !password) {
      return { success: false, error: 'Please fill in all fields' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimEmail)) {
      return { success: false, error: 'Please enter a valid email address' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    const { data, error } = await supabase.auth.signUp({
      email: trimEmail,
      password,
      options: {
        data: {
          username: trimUser,
          first_name: profile.firstName,
          birthday_month: profile.birthdayMonth,
          birthday_day: profile.birthdayDay,
        },
      },
    });
    if (error) return { success: false, error: friendlyError(error.message) };
    if (data.user) {
      const profileResult = await saveProfileRow(
        data.user.id,
        profile.firstName || '',
        trimUser,
        profile.birthdayMonth ?? null,
        profile.birthdayDay ?? null,
      );
      if (!profileResult.success) return profileResult;
    }
    return { success: true };
  }, [saveProfileRow]);

  const updateProfile = useCallback(async (
    firstName: string,
    username: string,
    birthday?: { month: number; day: number } | null,
  ) => {
    if (!supabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_MSG };
    }
    if (!user) {
      return { success: false, error: 'Please sign in before updating your profile.' };
    }
    const profile = validateProfileInput({ firstName, username, birthday });
    if (!profile.valid) {
      return { success: false, error: profile.error };
    }

    const profileResult = await saveProfileRow(
      user.id,
      profile.firstName || '',
      profile.username || '',
      profile.birthdayMonth ?? null,
      profile.birthdayDay ?? null,
    );
    if (!profileResult.success) return profileResult;

    const { data, error } = await supabase.auth.updateUser({
      data: {
        username: profile.username,
        first_name: profile.firstName,
        birthday_month: profile.birthdayMonth,
        birthday_day: profile.birthdayDay,
      },
    });
    if (error) return { success: false, error: friendlyError(error.message) };
    setUser(authUserToUser(data.user, {
      username: profile.username,
      first_name: profile.firstName,
      birthday_month: profile.birthdayMonth,
      birthday_day: profile.birthdayDay,
    }));
    return { success: true };
  }, [saveProfileRow, user]);

  const logout = useCallback(async () => {
    if (supabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    register,
    updateProfile,
    logout,
  }), [user, isLoading, login, register, updateProfile, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

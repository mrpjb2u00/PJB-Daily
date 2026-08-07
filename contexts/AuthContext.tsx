import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase, supabaseConfigured } from '@/lib/supabaseClient';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { ensureProfile, fetchProfile, saveProfile, type Profile } from '@/lib/profileService';
import { clearAccountLocalState } from '@/lib/accountLocalCleanup';
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
  resetAfterAccountDeletion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const NOT_CONFIGURED_MSG = 'Authentication service is not configured. Please contact the app administrator.';

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

function authUserToUser(authUser: SupabaseUser | null | undefined, profile: Profile | null): User | null {
  if (!authUser) return null;

  return {
    id: authUser.id,
    username: profile?.username || '',
    email: authUser.email || '',
    firstName: profile?.firstName || undefined,
    birthdayMonth: profile?.birthdayMonth ?? null,
    birthdayDay: profile?.birthdayDay ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserFromSession = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setAuthUser(null);
      setProfile(null);
      return;
    }

    setAuthUser(session.user);
    const { profile: loadedProfile, error } = await fetchProfile(session.user.id);
    if (error) {
      console.error('Failed to load profile:', error);
      setProfile(null);
      return;
    }

    if (loadedProfile) {
      setProfile(loadedProfile);
      return;
    }

    const { profile: createdProfile, error: createError } = await ensureProfile(session.user.id);
    if (createError) {
      console.error('Failed to create missing profile:', createError);
      setProfile(null);
      return;
    }

    setProfile(createdProfile);
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
    const { error } = await supabase.auth.signUp({
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
    return { success: true };
  }, []);

  const updateProfile = useCallback(async (
    firstName: string,
    username: string,
    birthday?: { month: number; day: number } | null,
  ) => {
    if (!supabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_MSG };
    }
    if (!authUser) {
      return { success: false, error: 'Please sign in before updating your profile.' };
    }
    const profile = validateProfileInput({ firstName, username, birthday });
    if (!profile.valid) {
      return { success: false, error: profile.error };
    }

    const result = await saveProfile({
      id: authUser.id,
      username: profile.username || '',
      firstName: profile.firstName || '',
      birthdayMonth: profile.birthdayMonth ?? null,
      birthdayDay: profile.birthdayDay ?? null,
    });
    if (result.error) return { success: false, error: result.error };
    setProfile(result.profile);
    return { success: true };
  }, [authUser]);

  const logout = useCallback(async () => {
    if (supabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      setAuthUser(null);
      setProfile(null);
    }
  }, []);

  const resetAfterAccountDeletion = useCallback(async () => {
    const deletedUserId = authUser?.id ?? null;

    if (supabaseConfigured) {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // The server-side user may already be gone; local cleanup still must continue.
      }
    }

    await clearAccountLocalState(deletedUserId);
    setAuthUser(null);
    setProfile(null);
    setIsLoading(false);
  }, [authUser?.id]);

  const user = useMemo(() => authUserToUser(authUser, profile), [authUser, profile]);

  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    register,
    updateProfile,
    logout,
    resetAfterAccountDeletion,
  }), [user, isLoading, login, register, updateProfile, logout, resetAfterAccountDeletion]);

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

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase, supabaseConfigured } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
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

function sessionToUser(session: Session | null): User | null {
  if (!session?.user) return null;
  const meta = session.user.user_metadata || {};
  return {
    id: session.user.id,
    username: meta.username || session.user.email?.split('@')[0] || 'user',
    email: session.user.email || '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(sessionToUser(session));
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(sessionToUser(session));
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const register = useCallback(async (username: string, email: string, password: string) => {
    if (!supabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_MSG };
    }
    const trimUser = username.trim().toLowerCase();
    const trimEmail = email.trim().toLowerCase();
    if (!trimUser || !trimEmail || !password) {
      return { success: false, error: 'Please fill in all fields' };
    }
    if (trimUser.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters' };
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
      options: { data: { username: trimUser } },
    });
    if (error) return { success: false, error: friendlyError(error.message) };
    return { success: true };
  }, []);

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
    logout,
  }), [user, isLoading, login, register, logout]);

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

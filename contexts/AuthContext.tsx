import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

interface User {
  username: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function sessionToUser(session: Session | null): User | null {
  if (!session?.user) return null;
  const meta = session.user.user_metadata || {};
  return {
    username: meta.username || session.user.email?.split('@')[0] || 'user',
    email: session.user.email || '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail || !password) {
      return { success: false, error: 'Please fill in all fields' };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: trimEmail,
      password,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
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
      options: {
        data: { username: trimUser },
      },
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
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

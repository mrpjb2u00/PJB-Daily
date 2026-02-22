import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  username: string;
  email: string;
}

interface StoredUser {
  username: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USERS_KEY = '@pjb_users';
const SESSION_KEY = '@pjb_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then((data) => {
      if (data) {
        try {
          setUser(JSON.parse(data));
        } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const getUsers = useCallback(async (): Promise<StoredUser[]> => {
    const data = await AsyncStorage.getItem(USERS_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {}
    }
    return [];
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail || !password) {
      return { success: false, error: 'Please fill in all fields' };
    }
    const users = await getUsers();
    const found = users.find((u) => u.email === trimEmail && u.password === password);
    if (!found) {
      return { success: false, error: 'Invalid email or password' };
    }
    const session: User = { username: found.username, email: found.email };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return { success: true };
  }, [getUsers]);

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
    if (password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters' };
    }
    const users = await getUsers();
    if (users.find((u) => u.username === trimUser)) {
      return { success: false, error: 'Username already taken' };
    }
    if (users.find((u) => u.email === trimEmail)) {
      return { success: false, error: 'Email already registered' };
    }
    const newUser: StoredUser = { username: trimUser, email: trimEmail, password };
    users.push(newUser);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    const session: User = { username: trimUser, email: trimEmail };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return { success: true };
  }, [getUsers]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
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

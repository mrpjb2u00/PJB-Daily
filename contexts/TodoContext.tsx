import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { useAuth } from '@/contexts/AuthContext';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | '6months' | 'yearly';

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: 'None',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  '6months': 'Every 6 Months',
  yearly: 'Yearly',
};

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  recurrence: RecurrenceType;
  lastCompletedAt?: number;
}

interface TodoContextValue {
  todos: Todo[];
  addTodo: (title: string, recurrence: RecurrenceType) => void;
  updateTodo: (id: string, title: string, recurrence: RecurrenceType) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
  isLoading: boolean;
}

const TodoContext = createContext<TodoContextValue | null>(null);

function getStorageKey(username: string) {
  return `@pjb_todos_${username}`;
}

function getNextDueDate(recurrence: RecurrenceType, fromDate: number): number {
  const d = new Date(fromDate);
  switch (recurrence) {
    case 'daily': d.setDate(d.getDate() + 1); break;
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case '6months': d.setMonth(d.getMonth() + 6); break;
    case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
    default: return 0;
  }
  return d.getTime();
}

export function TodoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTodos([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    AsyncStorage.getItem(getStorageKey(user.username)).then((data) => {
      if (data) {
        try {
          const loaded: Todo[] = JSON.parse(data);
          const now = Date.now();
          const processed = loaded.map((t) => {
            if (t.completed && t.recurrence !== 'none' && t.lastCompletedAt) {
              const nextDue = getNextDueDate(t.recurrence, t.lastCompletedAt);
              if (now >= nextDue) {
                return { ...t, completed: false, lastCompletedAt: undefined };
              }
            }
            return t;
          });
          setTodos(processed);
        } catch {}
      }
      setIsLoading(false);
    });
  }, [user]);

  const persist = useCallback((updated: Todo[]) => {
    if (user) {
      AsyncStorage.setItem(getStorageKey(user.username), JSON.stringify(updated));
    }
  }, [user]);

  const addTodo = useCallback((title: string, recurrence: RecurrenceType) => {
    const newTodo: Todo = {
      id: Crypto.randomUUID(),
      title: title.trim(),
      completed: false,
      createdAt: Date.now(),
      recurrence,
    };
    setTodos((prev) => {
      const updated = [newTodo, ...prev];
      persist(updated);
      return updated;
    });
  }, [persist]);

  const updateTodo = useCallback((id: string, title: string, recurrence: RecurrenceType) => {
    setTodos((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, title: title.trim(), recurrence } : t));
      persist(updated);
      return updated;
    });
  }, [persist]);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== id) return t;
        const nowCompleted = !t.completed;
        return {
          ...t,
          completed: nowCompleted,
          lastCompletedAt: nowCompleted ? Date.now() : undefined,
        };
      });
      persist(updated);
      return updated;
    });
  }, [persist]);

  const value = useMemo(() => ({
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    isLoading,
  }), [todos, addTodo, updateTodo, deleteTodo, toggleTodo, isLoading]);

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
}

export function useTodos() {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error('useTodos must be used within TodoProvider');
  return ctx;
}

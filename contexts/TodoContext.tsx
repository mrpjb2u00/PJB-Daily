import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, supabaseConfigured } from '@/lib/supabaseClient';

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
  dueDate?: string;
}

interface TodoContextValue {
  todos: Todo[];
  addTodo: (title: string, recurrence: RecurrenceType, dueDate?: string) => void;
  updateTodo: (id: string, title: string, recurrence: RecurrenceType, dueDate?: string) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
  isLoading: boolean;
  dueDateSupported: boolean;
}

const TodoContext = createContext<TodoContextValue | null>(null);

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

function processRecurrence(todos: Todo[]): Todo[] {
  const now = Date.now();
  return todos.map((t) => {
    if (t.completed && t.recurrence !== 'none' && t.lastCompletedAt) {
      const nextDue = getNextDueDate(t.recurrence, t.lastCompletedAt);
      if (now >= nextDue) {
        return { ...t, completed: false, lastCompletedAt: undefined };
      }
    }
    return t;
  });
}

function rowToTodo(row: any): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: new Date(row.created_at).getTime(),
    recurrence: row.recurrence || 'none',
    lastCompletedAt: row.last_completed_at ? new Date(row.last_completed_at).getTime() : undefined,
    dueDate: row.due_date ?? undefined,
  };
}

export function TodoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dueDateRef = useRef<boolean>(false);
  const [dueDateSupported, setDueDateSupported] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase
      .from('todos')
      .select('due_date')
      .limit(1)
      .then(({ error }) => {
        const supported = !error || error.code !== '42703';
        dueDateRef.current = supported;
        setDueDateSupported(supported);
      });
  }, []);

  useEffect(() => {
    if (!user || !supabaseConfigured) {
      setTodos([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load todos:', error.message);
          setTodos([]);
        } else {
          const loaded = (data || []).map(rowToTodo);
          setTodos(processRecurrence(loaded));
        }
        setIsLoading(false);
      });
  }, [user]);

  const addTodo = useCallback(async (title: string, recurrence: RecurrenceType, dueDate?: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    const insertData: Record<string, any> = {
      user_id: user.id,
      title: title.trim(),
      completed: false,
      recurrence,
      created_at: now,
    };
    if (dueDate && dueDateRef.current) insertData.due_date = dueDate;

    const { data, error } = await supabase
      .from('todos')
      .insert(insertData)
      .select()
      .single();
    if (error) {
      console.error('Failed to add todo:', error.message);
      return;
    }
    setTodos((prev) => [rowToTodo(data), ...prev]);
  }, [user]);

  const updateTodo = useCallback(async (id: string, title: string, recurrence: RecurrenceType, dueDate?: string) => {
    if (!user) return;
    const updates: Record<string, any> = { title: title.trim(), recurrence };
    if (dueDate !== undefined && dueDateRef.current) updates.due_date = dueDate || null;

    const { error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('Failed to update todo:', error.message);
      return;
    }
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, title: title.trim(), recurrence, dueDate: dueDate || undefined } : t)));
  }, [user]);

  const deleteTodo = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('Failed to delete todo:', error.message);
      return;
    }
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, [user]);

  const toggleTodo = useCallback(async (id: string) => {
    if (!user) return;
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    const nowCompleted = !todo.completed;
    const lastCompletedAt = nowCompleted ? new Date().toISOString() : null;
    const { error } = await supabase
      .from('todos')
      .update({ completed: nowCompleted, last_completed_at: lastCompletedAt })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('Failed to toggle todo:', error.message);
      return;
    }
    setTodos((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      return {
        ...t,
        completed: nowCompleted,
        lastCompletedAt: nowCompleted ? Date.now() : undefined,
      };
    }));
  }, [user, todos]);

  const value = useMemo(() => ({
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    isLoading,
    dueDateSupported,
  }), [todos, addTodo, updateTodo, deleteTodo, toggleTodo, isLoading, dueDateSupported]);

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

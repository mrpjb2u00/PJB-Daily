import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

interface TodoContextValue {
  todos: Todo[];
  addTodo: (title: string) => void;
  updateTodo: (id: string, title: string) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
  isLoading: boolean;
}

const TodoContext = createContext<TodoContextValue | null>(null);

const TODOS_KEY = '@taskflow_todos';

export function TodoProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(TODOS_KEY).then((data) => {
      if (data) {
        try {
          setTodos(JSON.parse(data));
        } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const persist = useCallback((updated: Todo[]) => {
    AsyncStorage.setItem(TODOS_KEY, JSON.stringify(updated));
  }, []);

  const addTodo = useCallback((title: string) => {
    const newTodo: Todo = {
      id: Crypto.randomUUID(),
      title: title.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    setTodos((prev) => {
      const updated = [newTodo, ...prev];
      persist(updated);
      return updated;
    });
  }, [persist]);

  const updateTodo = useCallback((id: string, title: string) => {
    setTodos((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, title: title.trim() } : t));
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
      const updated = prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
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

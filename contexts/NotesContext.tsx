import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { useAuth } from '@/contexts/AuthContext';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface NotesContextValue {
  notes: Note[];
  addNote: (title: string, content: string) => void;
  updateNote: (id: string, title: string, content: string) => void;
  deleteNote: (id: string) => void;
  isLoading: boolean;
}

const NotesContext = createContext<NotesContextValue | null>(null);

function getStorageKey(username: string) {
  return `@pjb_notes_${username}`;
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    AsyncStorage.getItem(getStorageKey(user.username)).then((data) => {
      if (data) {
        try {
          setNotes(JSON.parse(data));
        } catch {}
      }
      setIsLoading(false);
    });
  }, [user]);

  const persist = useCallback((updated: Note[]) => {
    if (user) {
      AsyncStorage.setItem(getStorageKey(user.username), JSON.stringify(updated));
    }
  }, [user]);

  const addNote = useCallback((title: string, content: string) => {
    const now = Date.now();
    const newNote: Note = {
      id: Crypto.randomUUID(),
      title: title.trim() || 'Untitled',
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => {
      const updated = [newNote, ...prev];
      persist(updated);
      return updated;
    });
  }, [persist]);

  const updateNote = useCallback((id: string, title: string, content: string) => {
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === id
          ? { ...n, title: title.trim() || 'Untitled', content: content.trim(), updatedAt: Date.now() }
          : n,
      );
      persist(updated);
      return updated;
    });
  }, [persist]);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const value = useMemo(() => ({
    notes,
    addNote,
    updateNote,
    deleteNote,
    isLoading,
  }), [notes, addNote, updateNote, deleteNote, isLoading]);

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
}

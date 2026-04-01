import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, supabaseConfigured } from '@/lib/supabaseClient';

export interface Note {
  id: string;
  title: string;
  content: string;
  date?: string;
  createdAt: number;
  updatedAt: number;
}

interface NotesContextValue {
  notes: Note[];
  addNote: (title: string, content: string, date?: string) => void;
  updateNote: (id: string, title: string, content: string, date?: string) => void;
  deleteNote: (id: string) => void;
  isLoading: boolean;
  noteDateSupported: boolean;
}

const NotesContext = createContext<NotesContextValue | null>(null);

function rowToNote(row: any): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content || '',
    date: row.date ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const noteDateRef = useRef<boolean>(false);
  const [noteDateSupported, setNoteDateSupported] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase
      .from('notes')
      .select('date')
      .limit(1)
      .then(({ error }) => {
        const supported = !error || error.code !== '42703';
        noteDateRef.current = supported;
        setNoteDateSupported(supported);
      });
  }, []);

  useEffect(() => {
    if (!user || !supabaseConfigured) {
      setNotes([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load notes:', error.message);
          setNotes([]);
        } else {
          setNotes((data || []).map(rowToNote));
        }
        setIsLoading(false);
      });
  }, [user]);

  const addNote = useCallback(async (title: string, content: string, date?: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    const insertData: Record<string, any> = {
      user_id: user.id,
      title: title.trim() || 'Untitled',
      content: content.trim(),
      created_at: now,
      updated_at: now,
    };
    if (date && noteDateRef.current) insertData.date = date;

    const { data, error } = await supabase
      .from('notes')
      .insert(insertData)
      .select()
      .single();
    if (error) {
      console.error('Failed to add note:', error.message);
      return;
    }
    setNotes((prev) => [rowToNote(data), ...prev]);
  }, [user]);

  const updateNote = useCallback(async (id: string, title: string, content: string, date?: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    const updates: Record<string, any> = {
      title: title.trim() || 'Untitled',
      content: content.trim(),
      updated_at: now,
    };
    if (noteDateRef.current) updates.date = date || null;

    const { error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('Failed to update note:', error.message);
      return;
    }
    setNotes((prev) => prev.map((n) =>
      n.id === id
        ? { ...n, title: title.trim() || 'Untitled', content: content.trim(), date: date || undefined, updatedAt: Date.now() }
        : n,
    ));
  }, [user]);

  const deleteNote = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('Failed to delete note:', error.message);
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, [user]);

  const value = useMemo(() => ({
    notes,
    addNote,
    updateNote,
    deleteNote,
    isLoading,
    noteDateSupported,
  }), [notes, addNote, updateNote, deleteNote, isLoading, noteDateSupported]);

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

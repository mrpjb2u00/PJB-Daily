import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, supabaseConfigured } from '@/lib/supabaseClient';

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

function rowToNote(row: any): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content || '',
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const addNote = useCallback(async (title: string, content: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: title.trim() || 'Untitled',
        content: content.trim(),
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();
    if (error) {
      console.error('Failed to add note:', error.message);
      return;
    }
    setNotes((prev) => [rowToNote(data), ...prev]);
  }, [user]);

  const updateNote = useCallback(async (id: string, title: string, content: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('notes')
      .update({ title: title.trim() || 'Untitled', content: content.trim(), updated_at: now })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      console.error('Failed to update note:', error.message);
      return;
    }
    setNotes((prev) => prev.map((n) =>
      n.id === id
        ? { ...n, title: title.trim() || 'Untitled', content: content.trim(), updatedAt: Date.now() }
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

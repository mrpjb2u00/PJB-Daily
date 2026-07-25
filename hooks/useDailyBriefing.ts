import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTodos } from '@/contexts/TodoContext';
import { useNotes } from '@/contexts/NotesContext';
import { getLocalTodayDateString } from '@/utils/date';
import {
  buildDailyBriefingContent,
  getDailyBriefingStorageKey,
  getSafeFirstName,
  type DailyBriefingContent,
} from '@/utils/dailyBriefing';

interface DailyBriefingState {
  visible: boolean;
  today: string;
  firstName?: string;
  content: DailyBriefingContent | null;
  openMyDay: () => void;
  dismiss: () => void;
}

const SHOW_DELAY_MS = 400;

export function useDailyBriefing(): DailyBriefingState {
  const { user, isLoading: authLoading } = useAuth();
  const { todos, isLoading: todosLoading } = useTodos();
  const { notes, isLoading: notesLoading } = useNotes();
  const [visible, setVisible] = useState(false);
  const viewedKeysRef = useRef<Set<string>>(new Set());
  const pendingKeyRef = useRef<string | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const today = getLocalTodayDateString();
  const firstName = getSafeFirstName(user?.username);
  const content = useMemo(
    () => buildDailyBriefingContent(todos, notes, today),
    [todos, notes, today],
  );

  const storageKey = user ? getDailyBriefingStorageKey(user.id, today) : null;

  const markViewed = useCallback(async () => {
    if (!storageKey) return;
    viewedKeysRef.current.add(storageKey);
    await AsyncStorage.setItem(storageKey, 'true');
  }, [storageKey]);

  useEffect(() => {
    if (authLoading || todosLoading || notesLoading || !user || !content || !storageKey) return;
    if (visible || viewedKeysRef.current.has(storageKey) || pendingKeyRef.current === storageKey) return;

    let cancelled = false;
    pendingKeyRef.current = storageKey;

    AsyncStorage.getItem(storageKey).then((stored) => {
      if (cancelled) return;
      if (stored === 'true') {
        viewedKeysRef.current.add(storageKey);
        pendingKeyRef.current = null;
        return;
      }

      showTimerRef.current = setTimeout(() => {
        if (cancelled) return;
        setVisible(true);
        viewedKeysRef.current.add(storageKey);
        AsyncStorage.setItem(storageKey, 'true');
        pendingKeyRef.current = null;
        showTimerRef.current = null;
      }, SHOW_DELAY_MS);
    });

    return () => {
      cancelled = true;
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      if (pendingKeyRef.current === storageKey) pendingKeyRef.current = null;
    };
  }, [authLoading, todosLoading, notesLoading, user, content, storageKey, visible]);

  const dismiss = useCallback(() => {
    setVisible(false);
    markViewed();
  }, [markViewed]);

  const openMyDay = useCallback(() => {
    setVisible(false);
    markViewed();
    router.push({ pathname: '/date-details', params: { date: today } });
  }, [markViewed, today]);

  return {
    visible,
    today,
    firstName,
    content,
    openMyDay,
    dismiss,
  };
}

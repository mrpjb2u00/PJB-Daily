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
  const [checkedStorageKey, setCheckedStorageKey] = useState<string | null>(null);
  const viewedKeysRef = useRef<Set<string>>(new Set());
  const visibleStorageKeyRef = useRef<string | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const today = getLocalTodayDateString();
  const firstName = user?.firstName;
  const content = useMemo(
    () => buildDailyBriefingContent(todos, notes, today),
    [todos, notes, today],
  );

  const storageKey = user ? getDailyBriefingStorageKey(user.id, today) : null;

  const markViewedKey = useCallback((key: string) => {
    if (viewedKeysRef.current.has(key)) return;
    viewedKeysRef.current.add(key);
    AsyncStorage.setItem(key, 'true');
  }, []);

  useEffect(() => {
    setCheckedStorageKey(null);

    if (!storageKey) return;

    if (viewedKeysRef.current.has(storageKey)) {
      setCheckedStorageKey(storageKey);
      return;
    }

    let cancelled = false;

    AsyncStorage.getItem(storageKey).then((stored) => {
      if (cancelled) return;
      if (stored === 'true') {
        viewedKeysRef.current.add(storageKey);
      }

      setCheckedStorageKey(storageKey);
    });

    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    if (authLoading || todosLoading || notesLoading || !user || !content || !storageKey) return;
    if (checkedStorageKey !== storageKey) return;
    if (visible || viewedKeysRef.current.has(storageKey)) return;

    let cancelled = false;

    showTimerRef.current = setTimeout(() => {
      if (cancelled) return;
      visibleStorageKeyRef.current = storageKey;
      setVisible(true);
      markViewedKey(storageKey);
      showTimerRef.current = null;
    }, SHOW_DELAY_MS);

    return () => {
      cancelled = true;
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
    };
  }, [authLoading, checkedStorageKey, content, markViewedKey, notesLoading, storageKey, todosLoading, user, visible]);

  const dismiss = useCallback(() => {
    setVisible(false);
    const viewedKey = visibleStorageKeyRef.current ?? storageKey;
    visibleStorageKeyRef.current = null;
    if (viewedKey) markViewedKey(viewedKey);
  }, [markViewedKey, storageKey]);

  const openMyDay = useCallback(() => {
    setVisible(false);
    const viewedKey = visibleStorageKeyRef.current ?? storageKey;
    visibleStorageKeyRef.current = null;
    if (viewedKey) markViewedKey(viewedKey);
    router.push({ pathname: '/date-details', params: { date: today } });
  }, [markViewedKey, storageKey, today]);

  return {
    visible,
    today,
    firstName,
    content,
    openMyDay,
    dismiss,
  };
}

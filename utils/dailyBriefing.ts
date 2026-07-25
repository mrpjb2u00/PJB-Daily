import type { Note } from '@/contexts/NotesContext';
import type { Todo } from '@/contexts/TodoContext';
import { taskOccursOnDate } from './recurrence';

const PREVIEW_LIMIT = 3;
const STORAGE_PREFIX = '@pjb_daily_briefing_viewed';

export interface BriefingItemPreview {
  id: string;
  title: string;
}

export interface BriefingSection {
  count: number;
  items: BriefingItemPreview[];
  moreCount: number;
}

export interface DailyBriefingContent {
  todos?: BriefingSection;
  notes?: BriefingSection;
}

export function getDailyBriefingStorageKey(userId: string, dateStr: string): string {
  return `${STORAGE_PREFIX}:${userId}:${dateStr}`;
}

export function getGreeting(date = new Date(), firstName?: string): string {
  const hour = date.getHours();
  const period = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  return firstName ? `${period}, ${firstName}` : `${period}!`;
}

export function getSafeFirstName(username?: string): string | undefined {
  const trimmed = username?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'user' || trimmed.includes('@')) return undefined;

  const first = trimmed.split(/\s+/)[0];
  if (!/[a-z]/i.test(first)) return undefined;

  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function createPreviewSection(items: BriefingItemPreview[]): BriefingSection | undefined {
  if (items.length === 0) return undefined;

  return {
    count: items.length,
    items: items.slice(0, PREVIEW_LIMIT),
    moreCount: Math.max(0, items.length - PREVIEW_LIMIT),
  };
}

export function getTodayOpenTodos(todos: Todo[], today: string): BriefingItemPreview[] {
  return todos
    .filter((todo) => !todo.completed && taskOccursOnDate(todo, today))
    .map((todo) => ({
      id: todo.id,
      title: todo.title.trim() || 'Untitled To-Do',
    }));
}

export function getTodayDatedNotes(notes: Note[], today: string): BriefingItemPreview[] {
  return notes
    .filter((note) => note.date === today)
    .map((note) => ({
      id: note.id,
      title: note.title.trim() || 'Untitled',
    }));
}

export function buildDailyBriefingContent(
  todos: Todo[],
  notes: Note[],
  today: string,
): DailyBriefingContent | null {
  const todoSection = createPreviewSection(getTodayOpenTodos(todos, today));
  const noteSection = createPreviewSection(getTodayDatedNotes(notes, today));

  if (!todoSection && !noteSection) return null;

  return {
    todos: todoSection,
    notes: noteSection,
  };
}

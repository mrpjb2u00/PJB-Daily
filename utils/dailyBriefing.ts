import type { Note } from '@/contexts/NotesContext';
import type { Todo } from '@/contexts/TodoContext';
import { taskOccursOnDate } from './recurrence';

const TODAY_TODO_PREVIEW_LIMIT = 3;
const OVERDUE_TODO_PREVIEW_LIMIT = 2;
const TODAY_NOTE_PREVIEW_LIMIT = 2;
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
  overdueTodos?: BriefingSection;
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

export function createPreviewSection(
  items: BriefingItemPreview[],
  limit: number,
): BriefingSection | undefined {
  if (items.length === 0) return undefined;

  return {
    count: items.length,
    items: items.slice(0, limit),
    moreCount: Math.max(0, items.length - limit),
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

export function getOverdueOpenTodos(todos: Todo[], today: string): BriefingItemPreview[] {
  return todos
    .filter((todo) => (
      !todo.completed
      && todo.recurrence === 'none'
      && !!todo.dueDate
      && todo.dueDate < today
    ))
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
  const todoSection = createPreviewSection(getTodayOpenTodos(todos, today), TODAY_TODO_PREVIEW_LIMIT);
  const overdueTodoSection = createPreviewSection(getOverdueOpenTodos(todos, today), OVERDUE_TODO_PREVIEW_LIMIT);
  const noteSection = createPreviewSection(getTodayDatedNotes(notes, today), TODAY_NOTE_PREVIEW_LIMIT);

  if (!todoSection && !overdueTodoSection && !noteSection) return null;

  return {
    todos: todoSection,
    overdueTodos: overdueTodoSection,
    notes: noteSection,
  };
}

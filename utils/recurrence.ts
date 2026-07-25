import type { Todo, RecurrenceType } from '@/contexts/TodoContext';
import {
  daysBetweenCalendarDates,
  formatCalendarDate,
  getDaysInMonth,
  parseCalendarDate,
} from './date';

function monthsBetween(start: Date, target: Date): number {
  return (target.getFullYear() - start.getFullYear()) * 12
    + (target.getMonth() - start.getMonth());
}

function canonicalDay(startDay: number, targetYear: number, targetMonth: number): number {
  return Math.min(startDay, getDaysInMonth(targetYear, targetMonth));
}

export function taskOccursOnDate(todo: Todo, dateStr: string): boolean {
  if (!todo.dueDate) return false;

  const start = parseCalendarDate(todo.dueDate);
  const target = parseCalendarDate(dateStr);

  if (!start || !target) return false;

  const startDay = start.getDate();

  switch (todo.recurrence as RecurrenceType) {
    case 'none':
      return target.getTime() === start.getTime();

    case 'daily':
      return target >= start;

    case 'weekly': {
      if (target < start) return false;
      return daysBetweenCalendarDates(start, target) % 7 === 0;
    }

    case 'biweekly': {
      if (target < start) return false;
      return daysBetweenCalendarDates(start, target) % 14 === 0;
    }

    case 'monthly': {
      if (target < start) return false;
      const expected = canonicalDay(startDay, target.getFullYear(), target.getMonth());
      return target.getDate() === expected;
    }

    case 'quarterly': {
      if (target < start) return false;
      const expected = canonicalDay(startDay, target.getFullYear(), target.getMonth());
      if (target.getDate() !== expected) return false;
      return monthsBetween(start, target) % 3 === 0;
    }

    case '6months': {
      if (target < start) return false;
      const expected = canonicalDay(startDay, target.getFullYear(), target.getMonth());
      if (target.getDate() !== expected) return false;
      return monthsBetween(start, target) % 6 === 0;
    }

    case 'yearly': {
      if (target < start) return false;
      if (target.getMonth() !== start.getMonth()) return false;
      const expected = canonicalDay(startDay, target.getFullYear(), target.getMonth());
      return target.getDate() === expected;
    }

    default:
      return false;
  }
}

export function getTasksForDate(todos: Todo[], dateStr: string): Todo[] {
  return todos.filter((t) => taskOccursOnDate(t, dateStr));
}

export function getDatesWithTasksInMonth(
  todos: Todo[],
  year: number,
  month: number,
): Set<string> {
  const set = new Set<string>();
  const daysInMonth = getDaysInMonth(year, month);

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatCalendarDate(year, month, day);
    for (const todo of todos) {
      if (taskOccursOnDate(todo, dateStr)) {
        set.add(dateStr);
        break;
      }
    }
  }

  return set;
}

export function getTasksMapForMonth(
  todos: Todo[],
  year: number,
  month: number,
): Map<string, Todo[]> {
  const map = new Map<string, Todo[]>();
  const daysInMonth = getDaysInMonth(year, month);

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatCalendarDate(year, month, day);
    const tasks: Todo[] = [];
    for (const todo of todos) {
      if (taskOccursOnDate(todo, dateStr)) {
        tasks.push(todo);
      }
    }
    if (tasks.length > 0) {
      map.set(dateStr, tasks);
    }
  }

  return map;
}

export interface CalendarItem {
  id: string;
  title: string;
  type: 'todo' | 'note';
}

export function getItemsMapForMonth(
  todos: Todo[],
  notes: { id: string; title: string; date?: string }[],
  year: number,
  month: number,
): Map<string, CalendarItem[]> {
  const map = new Map<string, CalendarItem[]>();
  const daysInMonth = getDaysInMonth(year, month);

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatCalendarDate(year, month, day);
    const items: CalendarItem[] = [];

    for (const todo of todos) {
      if (taskOccursOnDate(todo, dateStr)) {
        items.push({ id: todo.id, title: todo.title, type: 'todo' });
      }
    }

    for (const note of notes) {
      if (note.date === dateStr) {
        items.push({ id: note.id, title: note.title, type: 'note' });
      }
    }

    if (items.length > 0) {
      map.set(dateStr, items);
    }
  }

  return map;
}

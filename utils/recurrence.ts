import type { Todo, RecurrenceType } from '@/contexts/TodoContext';

function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const aTime = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bTime = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bTime - aTime) / msPerDay);
}

function monthsBetween(start: Date, target: Date): number {
  return (target.getFullYear() - start.getFullYear()) * 12
    + (target.getMonth() - start.getMonth());
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function canonicalDay(startDay: number, targetYear: number, targetMonth: number): number {
  return Math.min(startDay, lastDayOfMonth(targetYear, targetMonth));
}

export function taskOccursOnDate(todo: Todo, dateStr: string): boolean {
  if (!todo.dueDate) return false;

  const start = parseDateStr(todo.dueDate);
  const target = parseDateStr(dateStr);

  if (isNaN(start.getTime()) || isNaN(target.getTime())) return false;

  const startDay = start.getDate();

  switch (todo.recurrence as RecurrenceType) {
    case 'none':
      return target.getTime() === start.getTime();

    case 'daily':
      return target >= start;

    case 'weekly': {
      if (target < start) return false;
      return daysBetween(start, target) % 7 === 0;
    }

    case 'biweekly': {
      if (target < start) return false;
      return daysBetween(start, target) % 14 === 0;
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
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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

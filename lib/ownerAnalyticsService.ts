import { supabase } from '@/lib/supabaseClient';

const OWNER_ANALYTICS_ERROR = 'Unable to load analytics right now.';

interface OwnerAnalyticsSummaryRow {
  generated_at: unknown;
  registered_user_count: unknown;
  profile_count: unknown;
  new_registered_users_30d: unknown;
  new_profiles_30d: unknown;
  todo_count: unknown;
  completed_todo_count: unknown;
  open_todo_count: unknown;
  todo_completion_rate: unknown;
  new_todos_30d: unknown;
  recurring_todo_count: unknown;
  todos_with_due_date_count: unknown;
  note_count: unknown;
  new_notes_30d: unknown;
  dated_note_count: unknown;
}

export interface OwnerAnalyticsSummary {
  generatedAt: string;
  registeredUserCount: number;
  profileCount: number;
  newRegisteredUsers30d: number;
  newProfiles30d: number;
  todoCount: number;
  completedTodoCount: number;
  openTodoCount: number;
  todoCompletionRate: number;
  newTodos30d: number;
  recurringTodoCount: number;
  todosWithDueDateCount: number;
  noteCount: number;
  newNotes30d: number;
  datedNoteCount: number;
}

function toFiniteNumber(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error(OWNER_ANALYTICS_ERROR);
  }
  return numeric;
}

function toGeneratedAt(value: unknown): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new Error(OWNER_ANALYTICS_ERROR);
  }
  return value;
}

function normalizeSummaryRow(data: unknown): OwnerAnalyticsSummaryRow {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') {
    throw new Error(OWNER_ANALYTICS_ERROR);
  }
  return row as OwnerAnalyticsSummaryRow;
}

function rowToSummary(row: OwnerAnalyticsSummaryRow): OwnerAnalyticsSummary {
  return {
    generatedAt: toGeneratedAt(row.generated_at),
    registeredUserCount: toFiniteNumber(row.registered_user_count),
    profileCount: toFiniteNumber(row.profile_count),
    newRegisteredUsers30d: toFiniteNumber(row.new_registered_users_30d),
    newProfiles30d: toFiniteNumber(row.new_profiles_30d),
    todoCount: toFiniteNumber(row.todo_count),
    completedTodoCount: toFiniteNumber(row.completed_todo_count),
    openTodoCount: toFiniteNumber(row.open_todo_count),
    todoCompletionRate: toFiniteNumber(row.todo_completion_rate),
    newTodos30d: toFiniteNumber(row.new_todos_30d),
    recurringTodoCount: toFiniteNumber(row.recurring_todo_count),
    todosWithDueDateCount: toFiniteNumber(row.todos_with_due_date_count),
    noteCount: toFiniteNumber(row.note_count),
    newNotes30d: toFiniteNumber(row.new_notes_30d),
    datedNoteCount: toFiniteNumber(row.dated_note_count),
  };
}

export async function fetchOwnerAnalyticsSummary(): Promise<OwnerAnalyticsSummary> {
  const { data, error } = await supabase.rpc('owner_analytics_summary');

  if (error) {
    throw new Error(OWNER_ANALYTICS_ERROR);
  }

  return rowToSummary(normalizeSummaryRow(data));
}

export { OWNER_ANALYTICS_ERROR };

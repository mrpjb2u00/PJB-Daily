import { supabase } from '@/lib/supabaseClient';
import { parseCalendarDate } from '@/utils/date';

const OWNER_ANALYTICS_ERROR = 'Unable to load analytics right now.';

export type OwnerAnalyticsTrendBucket = 'day' | 'week' | 'month';

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

interface OwnerAnalyticsTrendRow {
  bucket_start: unknown;
  new_registered_users: unknown;
  new_profiles: unknown;
  new_todos: unknown;
  completed_todos: unknown;
  new_notes: unknown;
  dated_notes: unknown;
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

export interface OwnerAnalyticsTrendPoint {
  bucketStart: string;
  newRegisteredUsers: number;
  newProfiles: number;
  newTodos: number;
  completedTodos: number;
  newNotes: number;
  datedNotes: number;
}

interface FetchOwnerAnalyticsTrendsParams {
  startDate: string;
  endDate: string;
  bucket: OwnerAnalyticsTrendBucket;
}

function toFiniteNumber(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error(OWNER_ANALYTICS_ERROR);
  }
  return numeric;
}

function toNonNegativeInteger(value: unknown): number {
  const numeric = toFiniteNumber(value);
  if (!Number.isInteger(numeric) || numeric < 0) {
    throw new Error(OWNER_ANALYTICS_ERROR);
  }
  return numeric;
}

function toCalendarDate(value: unknown): string {
  if (
    typeof value !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/.test(value)
    || !parseCalendarDate(value)
  ) {
    throw new Error(OWNER_ANALYTICS_ERROR);
  }
  return value;
}

function toTrendBucket(value: OwnerAnalyticsTrendBucket): OwnerAnalyticsTrendBucket {
  if (value !== 'day' && value !== 'week' && value !== 'month') {
    throw new Error(OWNER_ANALYTICS_ERROR);
  }
  return value;
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

function normalizeTrendRows(data: unknown): OwnerAnalyticsTrendRow[] {
  if (!Array.isArray(data)) {
    throw new Error(OWNER_ANALYTICS_ERROR);
  }
  return data.map((row) => {
    if (!row || typeof row !== 'object') {
      throw new Error(OWNER_ANALYTICS_ERROR);
    }
    return row as OwnerAnalyticsTrendRow;
  });
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

function rowToTrendPoint(row: OwnerAnalyticsTrendRow): OwnerAnalyticsTrendPoint {
  return {
    bucketStart: toCalendarDate(row.bucket_start),
    newRegisteredUsers: toNonNegativeInteger(row.new_registered_users),
    newProfiles: toNonNegativeInteger(row.new_profiles),
    newTodos: toNonNegativeInteger(row.new_todos),
    completedTodos: toNonNegativeInteger(row.completed_todos),
    newNotes: toNonNegativeInteger(row.new_notes),
    datedNotes: toNonNegativeInteger(row.dated_notes),
  };
}

export async function fetchOwnerAnalyticsSummary(): Promise<OwnerAnalyticsSummary> {
  const { data, error } = await supabase.rpc('owner_analytics_summary');

  if (error) {
    throw new Error(OWNER_ANALYTICS_ERROR);
  }

  return rowToSummary(normalizeSummaryRow(data));
}

export async function fetchOwnerAnalyticsTrends({
  startDate,
  endDate,
  bucket,
}: FetchOwnerAnalyticsTrendsParams): Promise<OwnerAnalyticsTrendPoint[]> {
  const safeStartDate = toCalendarDate(startDate);
  const safeEndDate = toCalendarDate(endDate);
  const safeBucket = toTrendBucket(bucket);

  const { data, error } = await supabase.rpc('owner_analytics_trends', {
    start_date: safeStartDate,
    end_date: safeEndDate,
    bucket: safeBucket,
  });

  if (error) {
    throw new Error(OWNER_ANALYTICS_ERROR);
  }

  return normalizeTrendRows(data)
    .map(rowToTrendPoint)
    .sort((a, b) => a.bucketStart.localeCompare(b.bucketStart));
}

export { OWNER_ANALYTICS_ERROR };

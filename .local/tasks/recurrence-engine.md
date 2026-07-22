# Calendar Recurrence Engine

## What & Why
The calendar currently only shows a dot indicator or task entry for a to-do on its exact `dueDate`. A weekly task starting March 1 shows nothing on March 8, 15, or 22. The recurrence fields exist in the data model but are never consulted when deciding which dates to highlight or what to display in the day-detail list.

This task builds a reusable recurrence engine and wires it into the calendar so dots and the selected-day task list reflect all occurrences within the viewed month.

## Done looks like
- A daily task starting on a given date shows a dot on every day of the calendar from that date onward.
- A weekly task shows a dot every 7 days from its start date across the whole month.
- A biweekly task shows a dot every 14 days.
- A monthly task shows a dot on the same day-of-month each month (skipped gracefully if the month is shorter, e.g. Feb 30).
- Tapping any of those dots opens the day-detail panel and the task appears there.
- Tasks with no `dueDate` still appear in the To-Dos tab but are invisible to the calendar (no crash, no noise).
- Existing one-time tasks with a `dueDate` and `recurrence: 'none'` are unaffected.
- Quarterly, 6-month, and yearly recurrences also work correctly (following the same day-of-month rule).

## Out of scope
- Calendar UI redesign (dots stay as dots; no inline task labels yet).
- Adding Notes to the calendar.
- Priority colors or any visual polish beyond what already exists.
- Database schema changes.

## Tasks

1. **Create `utils/recurrence.ts`** — Write a pure utility module with:
   - `taskOccursOnDate(todo, dateStr): boolean` — the core function. Parses `dueDate` as a local date (`new Date(y, m-1, d)` — never `new Date(isoString)` to avoid UTC timezone shifts), then applies the recurrence rule: `none` → exact match; `daily` → any date ≥ start; `weekly` → `(target - start) % 7 === 0` days; `biweekly` → `% 14 === 0`; `monthly/quarterly/6months/yearly` → same day-of-month at the correct interval. Returns `false` for any todo missing `dueDate`.
   - `getTasksForDate(todos, dateStr): Todo[]` — filters the todo list using `taskOccursOnDate`.
   - `getDatesWithTasksInMonth(todos, year, month): Set<string>` — iterates every day in the given month and collects dates where at least one todo occurs.

2. **Add `biweekly` to the recurrence type** — Add `'biweekly'` to `RecurrenceType`, `RECURRENCE_LABELS`, and `RECURRENCE_OPTIONS` in the relevant files so users can select it when creating a task.

3. **Wire the recurrence engine into the calendar** — Replace the two simple `useMemo` blocks in the calendar screen that compute `datesWithTasks` and `tasksForSelected` with calls to `getDatesWithTasksInMonth` and `getTasksForDate` from the new utility. No other UI changes.

## Relevant files
- `contexts/TodoContext.tsx:5-15`
- `app/(tabs)/calendar.tsx:66-76`
- `app/add-task.tsx:10`

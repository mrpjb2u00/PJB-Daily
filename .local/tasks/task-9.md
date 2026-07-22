---
title: Planner-style calendar upgrade
---
# Planner-Style Calendar Upgrade

## What & Why
Transform the Calendar tab from a compact dot-indicator grid into a full
planner view where each day cell shows the actual task titles inside it.
Tapping a day with tasks opens a DateDetailsScreen; tapping an empty day
shows an action modal to quickly create a To-Do or Note. The separate
task list below the calendar is removed — the grid is now the primary view.

## Done looks like
- Each day cell is noticeably taller, showing up to 3 task title pills
  (truncated with ellipsis) plus a "+X more" line when there are more
- The task list section below the calendar is gone
- Tapping a day that has tasks navigates to a new DateDetailsScreen (back
  arrow returns to Calendar)
- Tapping an empty day shows a modal with "Create To-Do", "Create Note",
  and "Cancel" options; choosing Create To-Do opens the add-task modal
  with the tapped date pre-filled; choosing Create Note opens the
  edit-note modal
- DateDetailsScreen shows the formatted date at the top, then the full
  list of tasks for that date using the existing TodoItem card design,
  with edit/delete/toggle all working
- Calendar rendering stays smooth when switching months (tasks are
  computed once per month view, not per-cell)
- No recurrence logic is changed; no existing functionality is removed

## Out of scope
- Notes inside calendar cells (prepared for future, not implemented now)
- Drag-and-drop, time scheduling, filters
- Any changes to the To-Dos, Notes, or Profile tabs

## Tasks
1. **Add `getTasksMapForMonth()` utility** — In `utils/recurrence.ts`, add a
   new exported function that returns a `Map<string, Todo[]>` mapping each
   date string in the month to its list of matching tasks. This replaces
   the per-cell `getTasksForDate` call and allows O(n*days) computation
   once per month instead of per-render.

2. **Rebuild calendar day cells as planner cells** — In
   `app/(tabs)/calendar.tsx`, replace the current `aspectRatio: 1` square
   cells with taller top-aligned cells. Each cell shows the date number at
   the top-left, then up to 3 small task-title rows (accent-colored,
   truncated), then a "+X more" line if needed. Remove the existing dot
   indicator. Use the `getTasksMapForMonth()` result (memoized) to power
   the cell content. Remove the `tasksSection` / task list below the
   calendar entirely.

3. **New tap behavior with action modal** — In `app/(tabs)/calendar.tsx`,
   update `handleDayPress` so that: if the tapped day has tasks, it calls
   `router.push('/date-details')` with the date as a param; if empty, it
   shows a themed in-component modal (React Native `Modal`) with
   "Create To-Do", "Create Note", and "Cancel" buttons. "Create To-Do"
   navigates to `/add-task` with `defaultDate` set. "Create Note"
   navigates to `/edit-note`.

4. **Register `date-details` in the root Stack** — In `app/_layout.tsx`,
   add a `Stack.Screen` for `date-details` with `headerShown: false`
   (the screen renders its own themed header with a back button).

5. **Create DateDetailsScreen** — Create `app/date-details.tsx`. It reads
   the `date` param from `useLocalSearchParams`, calls `getTasksForDate`
   for that date, and renders: a themed header with a back button and the
   formatted date, then a `ScrollView` with `TodoItem` cards (with
   working toggle/edit/delete wired to the existing context actions).
   If no tasks exist (edge case navigation), show a brief empty state.

## Relevant files
- `utils/recurrence.ts`
- `app/(tabs)/calendar.tsx`
- `app/_layout.tsx`
- `components/TodoItem.tsx`
- `contexts/TodoContext.tsx`
- `contexts/CalendarContext.tsx`
---
title: Recurrence fallback + Add Task polish
---
# Recurrence Fallback + Add Task Polish

## What & Why

Two focused fixes:

**Part 1 — End-of-month recurrence fallback.**
Monthly, quarterly, 6-month, and yearly recurring tasks that start on a day not present in every month (e.g. Jan 31, Aug 31, Feb 29) currently disappear for shorter months because the engine does an exact day-of-month match. The fix is to use the *last valid day of the target month* as a fallback when the original day overflows it.

**Part 2 — Add Task sheet cross-platform consistency.**
The sheet uses a fixed `keyboardVerticalOffset: 90` and `behavior="height"` on Android, both of which produce unreliable results. On Android the keyboard can cover the save button; spacing and insets feel different from iOS. Wrapping the form content in a scrollable container and applying safe-area insets makes the experience consistent.

## Done looks like

- A task starting Jan 31 with monthly recurrence shows a dot on Feb 28/29, Mar 31, Apr 30, May 31, Jun 30, etc.
- A task starting Aug 31 quarterly shows correctly on Nov 30, Feb 28/29, and May 31.
- A Feb 29 yearly task falls on Feb 28 in non-leap years.
- No recurrence type duplicates an occurrence or skips a month it should hit.
- The Add Task sheet looks and behaves identically on iPhone and Android: clean header, input field, date pill, repeat chips, and save button all visible with consistent spacing.
- The keyboard does not cover the save button on either platform.
- Safe area insets are respected (bottom home indicator / navigation bar).

## Out of scope
- Calendar UI redesign.
- Notes in the calendar.
- Any changes to navigation, tab bar, or login flow.

## Tasks

1. **Fix end-of-month fallback in recurrence engine** — In `utils/recurrence.ts`, add a helper `lastDayOfMonth(year, month)` that returns the last valid day number for a given year/month. Replace the direct `target.getDate() !== start.getDate()` check in the `monthly`, `quarterly`, `6months`, and `yearly` cases with a check against `min(start.getDate(), lastDayOfMonth(targetYear, targetMonth))`. The logic: compute what the canonical occurrence day would be in the target month, then check whether `target.getDate()` equals that canonical day.

2. **Improve Add Task sheet layout for cross-platform consistency** — In `app/add-task.tsx`, wrap the form body in a `ScrollView` with `keyboardShouldPersistTaps="handled"` so Android can scroll when the keyboard appears. Replace the `behavior="height"` / fixed `keyboardVerticalOffset` approach with `behavior="padding"` on both platforms using a dynamically computed offset. Apply `insets.bottom` as bottom padding on the scroll content so the save button is never hidden behind the home indicator or Android nav bar. Keep all existing UI elements and styles; only fix the layout/scrolling/inset mechanics.

## Relevant files
- `utils/recurrence.ts`
- `app/add-task.tsx`
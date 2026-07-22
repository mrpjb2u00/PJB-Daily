# Recurrence

## Source and status

This document was distilled from historical implementation notes in `.local/tasks`. It records durable intent and constraints, but it should be verified against the current code during the broader Phase 0 audit.

## Established current behavior from historical notes

The app has recurrence fields in the to-do data model. Historical notes indicate the calendar originally considered only a task's exact `dueDate` when showing calendar indicators and selected-day task lists. Tasks without a `dueDate` are intended to remain visible in the To-Dos tab but not appear on the calendar.

Existing one-time tasks with a `dueDate` and `recurrence: 'none'` are intended to remain exact-date tasks.

## Intended recurrence rules

Calendar recurrence should be handled by a reusable, pure recurrence utility rather than duplicated screen logic.

Intended rules from the historical notes:

- `none`: occurs only on the exact due date.
- `daily`: occurs every day from the start date onward.
- `weekly`: occurs every 7 days from the start date.
- `biweekly`: occurs every 14 days from the start date.
- `monthly`: occurs on the same day-of-month when valid.
- `quarterly`: follows the same day-of-month rule at a three-month interval.
- `6months`: follows the same day-of-month rule at a six-month interval.
- `yearly`: follows the same day-of-month rule at a twelve-month interval.

Date parsing should avoid UTC timezone shifts. Historical notes explicitly called for parsing local date strings into local dates instead of relying on `new Date(isoString)`.

## End-of-month fallback decision

Recurring tasks that start on dates such as January 31, August 31, or February 29 should not disappear in shorter target months. The intended design is to fall back to the last valid day of the target month.

Examples from the historical notes:

- A monthly task starting January 31 should occur on February 28 or 29, March 31, April 30, and so on.
- A quarterly task starting August 31 should occur on November 30, February 28 or 29, and May 31.
- A yearly February 29 task should occur on February 28 in non-leap years.

The recurrence engine should not duplicate occurrences or skip valid recurrence months.

## Calendar integration intent

The calendar should use recurrence-aware helpers when computing dates with tasks and the list of tasks for a selected date. Historical notes also describe a month-level task map helper so each month view can compute task occurrences once and reuse the result for day cells.

## Known constraints

Historical notes explicitly kept these items out of scope for the recurrence work:

- Database schema changes.
- Notes appearing in calendar recurrence logic.
- Calendar visual redesign as part of the initial recurrence engine work.
- Changes to unrelated tabs or authentication flows.

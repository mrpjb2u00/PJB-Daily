# Calendar Workflow

## Source and status

This document was distilled from historical implementation notes in `.local/tasks`. It records durable product and UX intent, but it should be verified against the current code during the broader Phase 0 audit.

## Established product direction

The app is intended to use a calendar-centered productivity workflow. Historical notes describe the Calendar tab evolving from a compact dot-indicator grid toward a planner-style view where each day can show task titles directly in the calendar.

## Intended planner-style calendar design

The durable design intent is for the calendar grid to become the primary daily planning surface:

- Day cells are taller and top-aligned rather than compact square indicators.
- Each day cell can show a limited number of task title rows.
- Longer task titles should be truncated rather than breaking layout.
- When a day has more tasks than can be shown inline, the cell should show a compact overflow indicator.
- The separate task list below the calendar is intended to be removed once the planner grid carries the task summary.

## Intended day interaction model

Historical notes describe two different tap behaviors depending on whether a day has tasks:

- Tapping a day with tasks should open a date-details screen for that date.
- Tapping an empty day should open an action modal with creation options.

The intended creation options from the notes are:

- Create To-Do, prefilled with the tapped date.
- Create Note.
- Cancel.

## Intended date-details screen

The date-details screen is intended to show:

- A themed header with a back affordance.
- The formatted date.
- The full task list for that date using the existing task card design.
- Existing task actions such as edit, delete, and complete/toggle.
- A small empty state if the screen is reached with no tasks for the date.

## Performance decision

Calendar rendering should remain smooth when switching months. Historical notes recommend computing the task map once per visible month instead of asking each cell to independently compute matching tasks.

## Known constraints

Historical notes kept these items out of scope for the planner-style calendar work:

- Notes shown inside calendar cells.
- Drag-and-drop scheduling.
- Time scheduling.
- Filters.
- Changes to To-Dos, Notes, or Profile tabs beyond calendar navigation needs.
- Changes to recurrence rules during the planner UI work.

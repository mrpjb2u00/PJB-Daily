---
title: Fix Android Add Task header layout
---
# Fix Android Add Task Header Layout

## What & Why
Two Android header issues appeared after switching to a full-screen modal:

1. **Title not centered** — Android's Stack navigator left-aligns header titles
   by default. iOS centers them automatically. Adding `headerTitleAlign: 'center'`
   makes both platforms consistent.

2. **Header overlapping status bar on older Android** (LG G8 ThinQ with notch) —
   Android modals don't always apply the status bar height to the header on older
   devices, so the Cancel button and title appear jammed against the very top of
   the screen. The fix is to pass `headerStatusBarHeight` explicitly using the
   `insets.top` value already available in the component via `useSafeAreaInsets()`.

## Done looks like
- "New Task" / "Edit Task" title is horizontally centered in the header on all
  Android devices (matching iOS appearance)
- On the LG G8 ThinQ (and similar older Android devices with notches), the header
  sits correctly below the status bar with proper spacing — Cancel and New Task
  title are not cut off or overlapping the notch area
- Galaxy S25 and iPhone appearance are unchanged

## Out of scope
- Any data logic, recurrence, or notes changes
- Changes to the Notes edit modal or any other screen

## Tasks
1. **Center the header title on Android** — Add `headerTitleAlign: 'center'` to
   the `<Stack.Screen options>` in `add-task.tsx`.

2. **Fix status bar overlap on older Android** — Add
   `headerStatusBarHeight: insets.top` to the same `<Stack.Screen options>` block.
   `insets` is already provided by `useSafeAreaInsets()` which is already imported
   and used in the component.

## Relevant files
- `app/add-task.tsx`
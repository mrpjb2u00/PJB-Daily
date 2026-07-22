---
title: Fix Android Add Task blank space
---
# Fix Android Add Task Blank Space

## What & Why
After switching to a full-screen modal, `behavior="padding"` was set on
`KeyboardAvoidingView` for all platforms. On Android this conflicts with the
system's own keyboard-avoidance (adjustResize), producing a large blank white
area below the content when the screen loads. iOS works correctly with
`behavior="padding"`; Android requires `behavior="height"` to shrink the
container height instead of adding padding.

## Done looks like
- Android: Add Task modal opens with content filling the top of the screen and
  no empty white gap at the bottom
- iOS: layout is unchanged — content stacks correctly from the header downward
- Both platforms: keyboard still pushes content up correctly when typing

## Out of scope
- Any visual or data-logic changes beyond this one fix
- Changes to the Notes modal or any other screen

## Tasks
1. **Restore platform-conditional KAV behavior** — Change the
   `KeyboardAvoidingView` in `add-task.tsx` from the fixed `behavior="padding"`
   back to `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` so Android
   gets the correct mode.

## Relevant files
- `app/add-task.tsx`
---
title: Switch Add Task to full-screen modal
---
# Switch Add Task to Full-Screen Modal

## What & Why
The Add Task screen is currently a partial-height iOS formSheet (55% of screen).
This presentation has a known React Native / Expo Go quirk where iOS sizes the
underlying view at 100% screen height even though only 55% is visible, causing
React Native to lay out content in an invisible full-height box. No amount of
flex/padding tricks reliably fixes this because the root cause is a platform
sizing mismatch — not a layout bug in our code.

Switching to a standard full-screen modal eliminates this entirely: iOS and
React Native agree on the content height, so the input/date/chips/button stack
correctly from the top every time.

## Done looks like
- Tapping + opens a full-screen modal that slides up from the bottom (same
  gesture feel as before on both iPhone and Android)
- "New Task" / "Edit Task" title is visible at the top on both platforms
- Text input, date pill, REPEAT chips, and Add Task button all appear
  immediately below the title with no empty gap
- Layout is identical on iPhone (Expo Go) and Android
- Saving or cancelling returns to the previous screen

## Out of scope
- Changing any data logic (add/edit/save still works the same)
- Changing the Notes edit modal or any other screen
- Any backend changes

## Tasks
1. **Change presentation to full-screen modal** — In `_layout.tsx`, change
   `add-task` Stack.Screen from `presentation: "formSheet"` to
   `presentation: "modal"`. Remove `sheetAllowedDetents` and
   `sheetGrabberVisible` (formSheet-only options). Set `headerShown: true`
   unconditionally (no platform guard needed with a full modal).

2. **Simplify add-task layout** — In `add-task.tsx`, remove all iOS-specific
   workarounds: the `!isIOS` custom header guard, platform-conditional KAV
   `enabled` prop, platform-conditional `bottomPad` and `keyboardOffset`.
   Use a single consistent layout: KAV with `behavior="padding"` on both
   platforms, one header driven entirely by `<Stack.Screen options>`, normal
   ScrollView with safe-area bottom padding. Add a close/cancel button to the
   header so users can dismiss without swiping.

## Relevant files
- `app/_layout.tsx`
- `app/add-task.tsx`
# Add Task Modal

## Source and status

This document was distilled from historical implementation notes in `.local/tasks`. It records durable UX and platform intent, but it should be verified against the current code during the broader Phase 0 audit.

## Established UX goal

The Add Task experience should be consistent across iPhone and Android. The form should keep the title, task input, date control, repeat controls, and save action visible and comfortably spaced while respecting keyboard behavior and safe areas.

## Historical iOS formSheet constraint

Historical notes describe persistent iOS formSheet layout problems:

- A custom header could be clipped by the sheet's rounded top area and native grabber region.
- Keyboard expansion could reveal a grey native sheet background below the save button.
- React Native and Expo Go could lay out the underlying view as full height even when only a partial-height sheet was visible.

The notes first identified native sheet headers and stretched scroll content as fixes for the formSheet version. Later notes record a stronger design decision: use a standard full-screen modal for Add Task so React Native and the visible modal agree on available height.

## Intended modal behavior

The durable intent from the notes is:

- Add Task opens as a modal from the bottom.
- New Task and Edit Task titles are visible at the top on both platforms.
- The content stack begins immediately below the header without large empty gaps.
- Saving or cancelling returns to the previous screen.
- Add/edit/save data behavior remains unchanged by layout work.
- Notes editing and other screens are not affected by Add Task layout changes.

## Keyboard and safe-area decisions

Historical notes identify platform-specific keyboard behavior:

- iOS works correctly with `KeyboardAvoidingView` padding behavior.
- Android can produce large blank space when padding behavior conflicts with system keyboard resizing.
- Android should use height behavior for the Add Task keyboard container.
- Safe-area bottom insets should be respected so the save button is not hidden by the home indicator or navigation bar.
- Scroll behavior should allow the form to remain usable when the keyboard is open.

## Header decisions

Historical notes call for using the navigation header for Add Task rather than a custom header view fighting with native modal chrome. They also identify Android-specific header requirements:

- Android header titles should be explicitly centered to match iOS.
- Older Android devices with notches may need explicit status-bar height handling so the title and cancel action are not pressed against the top edge.

## Known historical fixes and constraints

The notes record historical fixes for:

- iOS sheet header clipping.
- iOS grey gap beneath the save button.
- Full-screen modal conversion.
- Android blank space caused by keyboard padding behavior.
- Android header alignment and status-bar spacing.

These notes were scoped to layout and navigation presentation only. They intentionally excluded backend changes, task data logic changes, recurrence behavior changes, and unrelated modal screens.

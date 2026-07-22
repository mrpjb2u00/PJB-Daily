# Platform Notes

## Source and status

This document was distilled from historical implementation notes in `.local/tasks`. It records durable engineering observations and constraints, but it should be verified against the current code during the broader Phase 0 audit.

## iOS observations

Historical notes record these iOS-specific layout observations:

- Partial-height formSheet presentation can create layout mismatches between visible sheet height and React Native's measured content height.
- Native sheet chrome can clip or crowd custom headers.
- Dark blur effects may render lighter than the intended dark theme background.
- Light-mode blur in the tab bar was considered desirable on iOS.

## Android observations

Historical notes record these Android-specific layout observations:

- `KeyboardAvoidingView` padding behavior can conflict with Android system keyboard resizing and create a large blank area.
- Android modal headers may left-align titles by default, unlike iOS.
- Older Android devices with notches may require explicit safe-area/status-bar spacing for modal headers.

## Cross-platform UX constraints

The app should preserve consistent behavior across iPhone and Android while allowing platform-specific implementation details where needed. Historical notes specifically mention consistency for:

- Add Task modal header visibility.
- Keyboard-safe save button placement.
- Safe-area handling around bottom navigation and modal content.
- Calendar performance when switching months.

## Workflow note

Historical notes mention a prior workflow configuration issue in a Replit-oriented setup that could start duplicate Metro instances and cause port conflicts. That material appears to be environment workflow history rather than app source behavior. It should not drive production app architecture decisions unless the broader audit confirms related configuration still exists and matters.

## Known constraints

These notes are historical observations, not proof of current behavior. They should guide QA scenarios during the broader audit, especially on iPhone, modern Android devices, and older Android devices with notches.

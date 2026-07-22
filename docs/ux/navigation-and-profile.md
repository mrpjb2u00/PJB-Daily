# Navigation And Profile

## Source and status

This document was distilled from historical implementation notes in `.local/tasks`. It records durable navigation and UX intent, but it should be verified against the current code during the broader Phase 0 audit.

## Established navigation direction

Historical notes describe a custom bottom tab bar with To-Dos, Notes, a centered add action, Profile, and Logout. The intent was to make logout easier to find and to keep the tab layout visually balanced.

## Tab bar dark mode decision

On iOS, a dark `BlurView` background was observed to look too light and washed out compared with the app's intended dark background. The durable design decision from the notes is:

- Use a solid dark background in dark mode.
- Keep the iOS blur effect only for light mode.
- Use solid backgrounds for Android and web.

## Logout placement decision

Historical notes describe moving logout from Profile content into the bottom tab bar. The durable intent is:

- Logout is a top-level action in the bottom navigation.
- Logout uses a destructive/red treatment to distinguish it from normal navigation tabs.
- The Profile screen should not also show a duplicate Sign Out button once logout is in the tab bar.
- Header logout buttons in To-Dos and Notes are redundant and should not duplicate the tab bar logout action.

## Add button behavior on Profile

The centered add action is useful on task/note-oriented tabs, but historical notes identify it as inappropriate on the Profile tab. The intended behavior is:

- Hide or disable the centered add button on Profile.
- Preserve the balanced tab bar spacing with a non-interactive spacer when needed.
- Keep the add button available on the regular productivity screens.

## Known constraints

Historical notes explicitly excluded broader navigation redesign, confirmation dialogs for logout, and changes to native tab behavior used by newer iOS-specific navigation surfaces.

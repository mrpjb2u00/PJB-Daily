# iOS Add Task Sheet Layout Fix

## What & Why
The Add Task formSheet on iPhone has two persistent cosmetic bugs:
1. "New Task" title is invisible — the custom header View is clipped by the iOS formSheet's rounded top edge and native grabber area, which overlay/consume the first ~30–36pt of content regardless of paddingTop
2. Grey gap below the "Add Task" button — when the iOS keyboard opens, the formSheet expands upward past its 55% detent to fill space above the keyboard; our content doesn't fill that extra height, exposing the native sheet background

The root fix for (1) is to use the native iOS navigation header that formSheet already supports, rather than a custom View header that fights with the sheet's own top chrome. The root fix for (2) is to make the scroll content stretch to fill the full available height so no native background shows through.

## Done looks like
- "New Task" / "Edit Task" title is clearly visible at the top of the sheet on iPhone, rendered in the native iOS sheet header bar
- No grey gap appears below the "Add Task" button when the keyboard is open on iPhone
- Android layout is unchanged and still looks correct
- The sheet still opens as a formSheet (not full-screen modal) — same interaction feel

## Out of scope
- Changing any other screen's layout or navigation
- Modifying the sheet's detent/height or presentation style
- Any backend or data changes

## Tasks
1. **Enable native header for add-task on iOS** — In `_layout.tsx`, set `headerShown: true` for the `add-task` Stack.Screen. In `add-task.tsx`, remove the custom header View and use `<Stack.Screen options={{ title: isEditing ? 'Edit Task' : 'New Task' }} />` inside the component to set the dynamic title. Style the native header to match the app's theme (background color, text color).

2. **Fill sheet height to eliminate grey gap** — In `add-task.tsx`, add `flexGrow: 1` to the ScrollView's `contentContainerStyle` and wrap the form content in a `justifyContent: 'space-between'` View so the "Add Task" button is always pushed to the bottom of the available sheet area, leaving no exposed native background.

## Relevant files
- `app/_layout.tsx`
- `app/add-task.tsx`

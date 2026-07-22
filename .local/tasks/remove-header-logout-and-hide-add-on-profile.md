# Remove Header Logout & Hide Add on Profile

## What & Why
Two small cleanup changes following the tab bar redesign:

1. The logout button in the header (top-right) of both To-Dos and Notes screens
   is now redundant — logout lives in the bottom nav bar. Remove it from both
   headers.

2. The "+" add button in the center of the tab bar makes no sense on the Profile
   screen. Hide it when the user is on the Profile tab so the button doesn't
   appear where it's not useful.

## Done looks like
- To-Dos and Notes screen headers show only the theme toggle icon (no logout icon)
- Profile screen bottom tab bar shows [To-Dos] [Notes] [invisible spacer] [Profile] [Logout]
  — the center area is blank/empty, preserving the balanced layout without the button
- No "+" button appears or is tappable on the Profile tab
- All other screens (To-Dos, Notes) still show the "+" button as normal

## Out of scope
- Any other header or nav bar changes
- Modifying the NativeTabLayout (iOS 26+ liquid glass)

## Tasks
1. **Remove header logout from To-Dos screen** — Delete the logout `Pressable`
   button from the header, the `handleLogout` function, and `logout` from the
   `useAuth` destructuring in `index.tsx`.

2. **Remove header logout from Notes screen** — Same removal in `notes.tsx`.

3. **Hide "+" button on Profile tab** — In `CustomTabBar`, when `activeRouteName`
   is `'profile'`, render a non-interactive transparent `View` of the same
   dimensions as the add button instead of the `Pressable` gradient circle.

## Relevant files
- `app/(tabs)/index.tsx:41,87,258-266`
- `app/(tabs)/notes.tsx:80,92,153-158`
- `components/CustomTabBar.tsx:21-28,112-133`

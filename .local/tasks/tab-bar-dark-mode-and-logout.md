# Tab Bar: Dark Mode Fix & Logout Button

## What & Why
Two visual polish fixes to the custom bottom navigation bar, observed on real devices (iPhone, LG G8, Galaxy S25):

1. **iOS dark mode background is too light**: The `BlurView` with `tint='dark'` produces a washed-out gray on iOS instead of matching the app's true dark background (`#0F0F0F`). Fix: use a solid dark background in dark mode on all platforms; only use the blur effect on iOS in light mode.

2. **Tab bar layout imbalance + logout buried in Profile**: The current 4-item layout feels unbalanced, and the logout action is hidden inside the Profile screen. Move logout into the tab bar as a fifth item so the layout becomes evenly spaced: **[To-Dos] [Notes] [+] [Profile] [Logout]**.

## Done looks like
- In dark mode on iPhone, the tab bar background is a true dark color (matches `#0F0F0F`), not a gray/washed-out blur
- In light mode on iPhone, the blur effect is still applied (looks translucent and elegant)
- Android and web show a solid background in both modes (unchanged from current behavior)
- Tab bar shows five items in this order left to right: **To-Dos — Notes — [+] — Profile — Logout**
- Logout icon (log-out outline) uses the red/destructive color to distinguish it from the navigation tabs
- Tapping Logout triggers logout with haptic feedback (same as current profile screen behavior)
- The "Sign Out" button is removed from the Profile screen scroll content (no duplication)
- Profile screen paddingBottom reduced to 24px (no longer needs to account for a button at the bottom)

## Out of scope
- Changing any other colors, gradients, or design elements
- Adding a confirmation dialog before logout (keep same behavior as today)
- NativeTabLayout (used on iOS 26+ with liquid glass) — no changes needed there

## Tasks
1. **Fix iOS dark mode background** — In `CustomTabBar`, replace the `BlurView`-always-on-iOS approach with: solid dark background in dark mode (all platforms), BlurView blur in light mode on iOS only.

2. **Add logout to tab bar, restructure layout** — In `CustomTabBar`, add the logout button as a fifth item using `useAuth`'s `logout` function. Rearrange the layout so left side holds To-Dos + Notes and right side holds Profile + Logout, with the `+` button centered between them. Logout icon uses the theme's destructive (red) color.

3. **Clean up Profile screen** — Remove the "Sign Out" `Pressable` button and its associated styles from the Profile screen. Adjust content `paddingBottom` to 24px.

## Relevant files
- `components/CustomTabBar.tsx`
- `app/(tabs)/profile.tsx:152-168`
- `contexts/AuthContext.tsx`
- `constants/colors.ts`

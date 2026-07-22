# Objective
Fix mobile logout — `CommonActions.reset` with `{ name: 'index' }` fails because expo-router uses different internal route names. Replace with `router.replace('/')` for mobile, which should now work since the old "redirect back to tabs" auth guard logic was removed.

# Tasks

### T001: Replace CommonActions.reset with router.replace for mobile
- **Blocked By**: []
- **Details**:
  - In `app/_layout.tsx`, replace the mobile branch of the auth guard:
    - Remove `CommonActions` and `useNavigation` imports
    - Change the mobile logout redirect from `navigation.dispatch(CommonActions.reset(...))` to `router.replace('/')`
  - Files: `app/_layout.tsx`
  - Acceptance: Mobile logout navigates to welcome screen without error

### T002: Test on web
- **Blocked By**: [T001]
- **Details**:
  - Run automated test: login → logout → re-login cycle
  - Acceptance: Web still works (uses window.location.href path, unchanged)

# Phase 0 Risks And Recommendations

Audit date: 2026-07-22

Phase 1 rebrand note: The visible product name changed to PJB Daily after these Phase 0 findings. Technical identifiers containing the former naming scheme remain protected for release continuity.

## Critical

No Critical findings were identified from local inspection. This does not certify Supabase RLS, production credentials, store configuration, or EAS remote state because those were not queried in Phase 0.

## High

### Expo config ignores root-level settings

Description: `app.json` has a root-level `expo` object and also has sibling root-level `web`, `plugins`, and `experiments` keys. Expo ignores those extra root-level keys.

Evidence: `npx --no-install expo config --type public` emitted: `Root-level "expo" object found. Ignoring extra keys in Expo config: "web", "plugins", "experiments"`.

Potential impact: Explicit plugin configuration, favicon config, typed routes, and React Compiler experiment settings may not be applied. This may affect prebuild/build behavior and could cause confusion when changing Expo config.

Recommended future action: Move `web`, `plugins`, and `experiments` inside the `expo` object in a focused configuration correction. Preserve all protected production identifiers exactly. Re-run Expo config, lint, TypeScript, and dev-server checks afterward.

Suggested phase for correction: Phase 1 or early release-readiness phase.

Blocks rebranding or release: Blocks release-readiness confidence until corrected or consciously accepted. Does not block documentation-only Phase 0.

### TypeScript check currently fails

Description: `npx --no-install tsc --noEmit` fails.

Evidence: Errors include NativeTabs icon prop/type issues in `app/(tabs)/_layout.tsx`, `headerStatusBarHeight` not recognized in `app/add-task.tsx`, and an implicit `any` in `server/index.ts`.

Potential impact: Type-level regressions can hide runtime issues and reduce confidence before release. The NativeTabs typing issues are especially relevant to platform-specific navigation.

Recommended future action: Fix type errors in small commits after preserving current behavior. Confirm whether the runtime behavior is correct and whether types need updated usage or narrow local typing.

Suggested phase for correction: Phase 1 stabilization.

Blocks rebranding or release: Should block production release until resolved or explicitly waived with tested runtime evidence.

### Lint currently fails

Description: `npm run lint` exits with one error and eight warnings.

Evidence: `react/no-unescaped-entities` error in `app/auth.tsx`; warnings include unused variables/imports, duplicate imports, and missing hook dependencies.

Potential impact: Lint failure weakens CI/release confidence and may hide small quality issues. Hook dependency warnings may indicate stale state or effects that do not update when params change.

Recommended future action: Fix lint errors and review warnings manually. Do not run automatic lint fix without review.

Suggested phase for correction: Phase 1 stabilization.

Blocks rebranding or release: The lint error should block release-readiness checks until fixed or explicitly waived.

## Medium

### Supabase schema compatibility probes imply historical schema drift

Description: Todo and Notes contexts probe for `todos.due_date` and `notes.date` before using date columns.

Evidence: `TodoContext` selects `due_date` and disables date writes if error code `42703` is returned. `NotesContext` performs the same pattern for `date`.

Potential impact: The app may operate in degraded mode if production tables lack these columns, causing calendar integration to be incomplete. The code protects against crashes but can silently omit due dates or note dates.

Recommended future action: During a Supabase-safe audit, verify table schemas, RLS policies, and production columns without modifying data. Document expected schema in project docs.

Suggested phase for correction: Phase 0 follow-up or Phase 1 data audit, read-only first.

Blocks rebranding or release: Potentially blocks release if production schema does not match intended calendar/date features.

### Todo editor has UI-only fields not persisted to Supabase

Description: `app/add-task.tsx` contains details, subtasks, priority, reminder, and sharing UI, but `TodoContext` persists only title, recurrence, completed state, timestamps, and optional due date.

Evidence: `handleSave` calls `addTodo(text, recurrence, dueDate)` or `updateTodo(id, text, recurrence, dueDate)`. Context insert/update methods do not include details, subtasks, or priority fields.

Potential impact: Users may enter details/subtasks/priority expecting persistence, but those values may be lost on save. This is a product/UX risk if the UI is reachable in production.

Recommended future action: Verify current intended product scope. Either persist these fields with a planned Supabase schema change or mark/hide non-persisted fields until supported.

Suggested phase for correction: Phase 1 product stabilization, with Supabase schema planning if persistence is desired.

Blocks rebranding or release: Could block release if these fields are user-visible and expected to work.

### Logout behavior appears duplicated between Profile and historical docs

Description: Durable docs from `.local/tasks` recorded an intended move of logout into the tab bar, but current code still has Profile sign out and the custom tab bar has no logout item.

Evidence: `ProfileScreen` renders a Session card with Sign Out. `CustomTabBar` config includes Calendar, To-Dos, Notes, and Profile only.

Potential impact: Product documentation and current implementation may be out of sync. This is not necessarily a bug, but it needs owner decision before UX polishing.

Recommended future action: Decide whether Profile-only logout is the current desired behavior or whether the tab-bar logout plan remains active.

Suggested phase for correction: Phase 1 UX decision.

Blocks rebranding or release: Does not block rebranding; may affect final UX polish.

### EAS CLI is not available on PATH

Description: Earlier safety inspection found EAS CLI unavailable on PATH.

Evidence: `eas --version` returned not installed or not on PATH during Phase 0 safety inspection.

Potential impact: Local EAS project/credential/build inspection cannot run without using a project-local npx command or installing/using an approved tool later.

Recommended future action: For release work, use approved EAS access method and verify remote project linkage, build profiles, credentials, version numbers, and Play internal testing state.

Suggested phase for correction: Release-readiness phase.

Blocks rebranding or release: Blocks final release verification until EAS can be inspected safely.

## Low

### Expo Doctor could not run without installing

Description: `npx --no-install expo-doctor` could not run because `expo-doctor` is not installed locally.

Evidence: npm reported that `expo-doctor@1.20.1` was missing and `--no-install` prevented installation.

Potential impact: Dependency and Expo health recommendations were not collected.

Recommended future action: With approval, run Expo Doctor using an approved install-free or temporary tool strategy, or add it as a deliberate dev dependency if the project owner wants it in the workflow.

Suggested phase for correction: Phase 1 or release-readiness.

Blocks rebranding or release: Does not block Phase 1, but release readiness should include Expo Doctor or equivalent checks.

### Replit/server scaffolding appears separate from mobile production app

Description: The repo includes Express server, static build scripts, Drizzle schema, and Replit workflow files that appear to support Replit hosting/static Expo workflows rather than the mobile app's Supabase-backed runtime.

Evidence: `server/`, `shared/schema.ts`, `drizzle.config.ts`, `scripts/build.js`, `.replit`, and `replit.md` are present. Mobile app code uses Supabase directly for auth/todos/notes.

Potential impact: Extra scaffolding can confuse ownership and release process if not documented. Some TypeScript checks include server files and currently fail on server typing.

Recommended future action: Document what is production-critical for mobile versus Replit/static support. Consider narrowing TypeScript checks or fixing server typing if these files remain in the main project.

Suggested phase for correction: Phase 1 engineering hygiene.

Blocks rebranding or release: Does not directly block mobile rebranding, but affects repo clarity.

### Attached assets include historical prompts and screenshots

Description: `attached_assets/` contains many historical prompt text files and screenshots.

Evidence: repository file listing shows numerous `Pasted-...txt` files and image captures under `attached_assets/`.

Potential impact: These may increase repository size and can contain historical implementation context or user-provided text. They should be reviewed before any remote push.

Recommended future action: Owner review before publishing the repository. Preserve only durable assets or move historical context into docs if useful.

Suggested phase for correction: Before remote push or collaboration setup.

Blocks rebranding or release: Does not block app release through EAS unless included in bundles unexpectedly; should be checked before source sharing.

## Informational

### Development server starts

Description: Expo Metro started and responded on `/status` during Phase 0.

Evidence: Brief server start check returned HTTP 200 from `http://localhost:8081/status`; server was then stopped.

Potential impact: Confirms the project can start at the Metro level in the current environment. It does not prove app functionality on a device or emulator.

Recommended future action: In Phase 1, run device or emulator QA for auth, calendar, todos, notes, recurrence, dark mode, and logout.

Suggested phase for correction: Phase 1 QA.

Blocks rebranding or release: No.

### Production identifiers are present and preserved

Description: Protected identifiers are present in `app.json` and match the owner-provided references.

Evidence: `app.json` contains slug `todos-and-notes-by-pjb`, scheme `todosandnotes`, Android package `com.pjbstudios.todosandnotes`, iOS bundle identifier `com.pjbstudios.todosandnotes`, and EAS project ID `9f5ecc15-c74b-4aa9-86d8-b850ce80fbf8`.

Potential impact: The current local config points to the existing production app identity.

Recommended future action: Treat these as immutable unless an explicit migration plan is approved.

Suggested phase for correction: Ongoing preservation rule.

Blocks rebranding or release: No, as long as preserved.

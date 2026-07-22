# replit.md

## Overview

PJB Daily is a cross-platform productivity app built with Expo (React Native) that allows users to manage to-do items and notes. It features Supabase-based user authentication, dark/light theme support, recurring tasks, and a clean modern UI. The app runs on iOS, Android, and web via Expo, with an Express backend server for API support and static file serving.

The app was originally developed as "To-Dos & Notes by PJBStudios." Protected production identifiers may still use the former naming scheme for release continuity and must not be changed without an approved migration plan.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with React Native 0.81, using expo-router for file-based routing
- **Navigation**: File-based routing via `expo-router` with a tab layout (`(tabs)/`) containing four main screens: Calendar (default/home), To-Dos, Notes, and Profile. Modal screens for adding/editing tasks and notes are presented as form sheets or modals. Tapping a calendar day with tasks navigates to `app/date-details.tsx` (full CRUD); tapping an empty day shows an action modal ("Create To-Do" / "Create Note" / "Cancel").
- **State Management**: React Context API is used for all app state:
  - `ThemeContext` — dark/light mode toggle, persisted via AsyncStorage
  - `AuthContext` — Supabase-only authentication (signInWithPassword, signUp, signOut) with session persistence. No local fallback — requires Supabase to be configured via `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` environment variables.
  - `TodoContext` — CRUD operations for todos with recurrence support and optional `dueDate` (YYYY-MM-DD), persisted in Supabase `todos` table per user. Probes for `due_date` column at startup and gracefully skips it if missing.
  - `NotesContext` — CRUD operations for notes with optional `date` (YYYY-MM-DD) field, persisted in Supabase `notes` table per user. Probes for `date` column at startup and gracefully skips it if missing. Exposes `noteDateSupported` boolean.
  - `CalendarContext` — lightweight shared state for the calendar's selected date (string YYYY-MM-DD). Used by CalendarScreen and CustomTabBar (so + button passes the selected date to add-task).
- **Calendar screen (`app/(tabs)/calendar.tsx`)**: Planner-style grid with fixed-height cells. Each cell shows the date number at the top + up to N small colored item pills + "+N more" overflow. To-Do pills are orange (theme.accent); Note pills are teal (theme.accentSecondary). Tapping a cell with any items navigates to DateDetails; tapping an empty cell shows an action modal. Item data comes from `getItemsMapForMonth()` in `utils/recurrence.ts` which combines todos and dated notes.
- **Date Details screen (`app/date-details.tsx`)**: Shows all To-Dos and Notes for a selected date. Header shows date + live item count ("3 To-Dos · 2 Notes"). Separate colored sections for To-Dos (orange) and Notes (teal). Empty state with Add To-Do + Add Note action buttons. Full CRUD for both types.
- **Note creation flow**: `edit-note.tsx` accepts `prefillDate` param (passed from calendar modal and Date Details modal). Shows a teal date pill with clear button when `noteDateSupported=true`. Date is saved to Supabase `notes.date` column.
- **Data Persistence**: Todos and notes are stored in Supabase PostgreSQL tables with Row Level Security (RLS) ensuring per-user data isolation. Theme preference is stored locally via AsyncStorage. Authentication is handled exclusively by Supabase (no local auth fallback).
- **Styling**: Custom color system defined in `constants/colors.ts` with light and dark themes. Uses Inter font family loaded via `@expo-google-fonts/inter`. No CSS-in-JS library — uses React Native `StyleSheet.create`.
- **Animations**: `react-native-reanimated` for item animations (fade in/out, spring press effects)
- **Haptics**: `expo-haptics` for tactile feedback on interactions (iOS/Android only)

### Backend (Express)

- **Framework**: Express 5 running as a Node.js server
- **Purpose**: Currently serves as a proxy/static file server. The routes file (`server/routes.ts`) is mostly empty — API routes should be prefixed with `/api`.
- **CORS**: Configured to allow Replit domains and localhost origins for development
- **Storage Layer**: `server/storage.ts` defines an `IStorage` interface with a `MemStorage` in-memory implementation for users. This is a placeholder — not actively used by the frontend.
- **Build**: Server is bundled with esbuild for production (`server:build` script)

### Supabase Database

- **Todos table**: `id` (UUID, PK), `user_id` (UUID, FK to auth.users), `title` (text), `completed` (boolean), `recurrence` (text), `last_completed_at` (timestamptz), `created_at` (timestamptz), `due_date` (date, nullable — **requires manual migration**: `ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_date date;`)
- **Notes table**: `id` (UUID, PK), `user_id` (UUID, FK to auth.users), `title` (text), `content` (text), `created_at` (timestamptz), `updated_at` (timestamptz), `date` (date, nullable — **requires manual migration**: `ALTER TABLE notes ADD COLUMN IF NOT EXISTS date date;`)
- **Row Level Security (RLS)**: Enabled on both tables. Each user can only SELECT, INSERT, UPDATE, DELETE their own rows (via `auth.uid() = user_id` policies).
- **Drizzle ORM**: Also configured via `drizzle.config.ts` with a `users` table in `shared/schema.ts`, but not actively used by the app (Supabase client is used directly).

### Key Architecture Decisions

1. **Supabase-backed data storage**: Todos and notes are stored in Supabase PostgreSQL tables, enabling cross-device sync when users log in from different devices. Theme preference remains in AsyncStorage for instant local access.

2. **Context-based state with Supabase**: React Contexts manage all app state. TodoContext and NotesContext perform CRUD operations directly against Supabase tables using the Supabase JS client. State is loaded on login and updated optimistically after successful Supabase operations.

3. **Per-user data isolation via RLS**: Supabase Row Level Security policies ensure each user can only access their own todos and notes. The `user_id` column links data to `auth.users(id)`.

4. **Expo Router file-based routing**: Routes are determined by file structure in the `app/` directory. The tab navigator lives in `app/(tabs)/` with `todos.tsx` and `notes.tsx` screens.

5. **Auth navigation strategy**: Uses a split approach — declarative `<Redirect>` components in `index.tsx` and `auth.tsx` for login redirects, and an auth guard in `_layout.tsx` for logout redirects (web: `window.location.href` for full page reload; mobile: `reloadAppAsync` from expo to restart the JS bundle). Tab layout shows a loading spinner when user is null (never returns null, which would cause white screens). No timing flags or imperative navigation in logout handlers — they simply call `await logout()`. Note: expo-router's `router.replace('/')` does NOT work on native when navigating from a tab navigator to a root screen — this is a known limitation.

6. **Mobile logout via component swap**: On mobile, navigation from tabs to root doesn't work reliably (`router.replace`, `CommonActions.reset`, and `reloadAppAsync` all fail in Expo Go). Instead, the `(tabs)/_layout.tsx` renders the `WelcomeContent` component directly when `!user`, bypassing navigation entirely. The shared `WelcomeContent` component (`components/WelcomeContent.tsx`) is used by both `app/index.tsx` and the tab layout. On web, the auth guard in `_layout.tsx` uses `window.location.href = '/'` for a clean page reload.

### Project Scripts

- `npm run expo:dev` — Start Expo dev server (configured for Replit)
- `npm run server:dev` — Start Express backend in development mode
- `npm run db:push` — Push Drizzle schema to PostgreSQL
- `npm run expo:static:build` — Build static web bundle
- `npm run server:build` — Bundle server for production
- `npm run server:prod` — Run production server

## External Dependencies

- **Supabase** — Primary data store for todos, notes, and user authentication. Requires `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` environment variables.
- **AsyncStorage** — Used for theme preference persistence only
- **Expo Services** — Font loading, haptics, crypto (UUID generation), image picker, linear gradient, blur effects
- **TanStack React Query** — Installed and configured but not actively used for data fetching yet
- **Express** — Backend server for API endpoints and static file serving
- **Drizzle ORM + Zod** — Database schema definition and validation (ready for future use)

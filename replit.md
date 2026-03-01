# replit.md

## Overview

"To-Dos & Notes by PJBStudios" is a cross-platform productivity app built with Expo (React Native) that allows users to manage to-do items and notes. It features Supabase-based user authentication, dark/light theme support, recurring tasks, and a clean modern UI. The app runs on iOS, Android, and web via Expo, with an Express backend server for API support and static file serving.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with React Native 0.81, using expo-router for file-based routing
- **Navigation**: File-based routing via `expo-router` with a tab layout (`(tabs)/`) containing two main screens: Todos and Notes. Modal screens for adding/editing tasks and notes are presented as form sheets or modals.
- **State Management**: React Context API is used for all app state:
  - `ThemeContext` — dark/light mode toggle, persisted via AsyncStorage
  - `AuthContext` — Supabase-only authentication (signInWithPassword, signUp, signOut) with session persistence. No local fallback — requires Supabase to be configured via `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` environment variables.
  - `TodoContext` — CRUD operations for todos with recurrence support, persisted in Supabase `todos` table per user
  - `NotesContext` — CRUD operations for notes, persisted in Supabase `notes` table per user
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

- **Todos table**: `id` (UUID, PK), `user_id` (UUID, FK to auth.users), `title` (text), `completed` (boolean), `recurrence` (text), `last_completed_at` (timestamptz), `created_at` (timestamptz)
- **Notes table**: `id` (UUID, PK), `user_id` (UUID, FK to auth.users), `title` (text), `content` (text), `created_at` (timestamptz), `updated_at` (timestamptz)
- **Row Level Security (RLS)**: Enabled on both tables. Each user can only SELECT, INSERT, UPDATE, DELETE their own rows (via `auth.uid() = user_id` policies).
- **Drizzle ORM**: Also configured via `drizzle.config.ts` with a `users` table in `shared/schema.ts`, but not actively used by the app (Supabase client is used directly).

### Key Architecture Decisions

1. **Supabase-backed data storage**: Todos and notes are stored in Supabase PostgreSQL tables, enabling cross-device sync when users log in from different devices. Theme preference remains in AsyncStorage for instant local access.

2. **Context-based state with Supabase**: React Contexts manage all app state. TodoContext and NotesContext perform CRUD operations directly against Supabase tables using the Supabase JS client. State is loaded on login and updated optimistically after successful Supabase operations.

3. **Per-user data isolation via RLS**: Supabase Row Level Security policies ensure each user can only access their own todos and notes. The `user_id` column links data to `auth.users(id)`.

4. **Expo Router file-based routing**: Routes are determined by file structure in the `app/` directory. The tab navigator lives in `app/(tabs)/` with `todos.tsx` and `notes.tsx` screens.

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
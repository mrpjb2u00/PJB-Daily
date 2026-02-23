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
  - `TodoContext` — CRUD operations for todos with recurrence support, persisted per-user in AsyncStorage
  - `NotesContext` — CRUD operations for notes, persisted per-user in AsyncStorage
- **Data Persistence**: Todos, notes, and theme preference are stored locally using `@react-native-async-storage/async-storage`. Authentication is handled exclusively by Supabase (no local auth fallback).
- **Styling**: Custom color system defined in `constants/colors.ts` with light and dark themes. Uses Inter font family loaded via `@expo-google-fonts/inter`. No CSS-in-JS library — uses React Native `StyleSheet.create`.
- **Animations**: `react-native-reanimated` for item animations (fade in/out, spring press effects)
- **Haptics**: `expo-haptics` for tactile feedback on interactions (iOS/Android only)

### Backend (Express)

- **Framework**: Express 5 running as a Node.js server
- **Purpose**: Currently serves as a proxy/static file server. The routes file (`server/routes.ts`) is mostly empty — API routes should be prefixed with `/api`.
- **CORS**: Configured to allow Replit domains and localhost origins for development
- **Storage Layer**: `server/storage.ts` defines an `IStorage` interface with a `MemStorage` in-memory implementation for users. This is a placeholder — not actively used by the frontend.
- **Build**: Server is bundled with esbuild for production (`server:build` script)

### Database Schema (Drizzle ORM — Not Actively Used)

- **ORM**: Drizzle ORM with PostgreSQL dialect configured via `drizzle.config.ts`
- **Schema**: Defined in `shared/schema.ts` — currently only has a `users` table with `id`, `username`, and `password` fields
- **Validation**: Uses `drizzle-zod` to generate Zod schemas from the Drizzle table definitions
- **Status**: The schema exists but the app currently uses AsyncStorage for all data. The database infrastructure is ready to be connected when needed. Run `npm run db:push` to push schema to a provisioned PostgreSQL database.

### Key Architecture Decisions

1. **Local-first data storage**: All data lives in AsyncStorage on the device. This was chosen for simplicity and offline-first capability, but means no cross-device sync. The server and database schema are scaffolded for future migration to server-side storage.

2. **Context-based state over server queries**: Despite having `@tanstack/react-query` and an API client (`lib/query-client.ts`) set up, the app doesn't use them for data fetching. All state flows through React Contexts that read/write AsyncStorage directly.

3. **Per-user data isolation**: Todos and notes are stored with user-specific AsyncStorage keys (e.g., `@pjb_todos_username`), providing simple multi-user support without a backend.

4. **Expo Router file-based routing**: Routes are determined by file structure in the `app/` directory. The tab navigator lives in `app/(tabs)/` with `todos.tsx` and `notes.tsx` screens.

### Project Scripts

- `npm run expo:dev` — Start Expo dev server (configured for Replit)
- `npm run server:dev` — Start Express backend in development mode
- `npm run db:push` — Push Drizzle schema to PostgreSQL
- `npm run expo:static:build` — Build static web bundle
- `npm run server:build` — Bundle server for production
- `npm run server:prod` — Run production server

## External Dependencies

- **PostgreSQL** (via Drizzle ORM) — Schema defined but not actively queried by the app. Requires `DATABASE_URL` environment variable when using `db:push`.
- **AsyncStorage** — Primary data store for all user data, todos, notes, and preferences
- **Expo Services** — Font loading, haptics, crypto (UUID generation), image picker, linear gradient, blur effects
- **TanStack React Query** — Installed and configured but not actively used for data fetching yet
- **Express** — Backend server for API endpoints and static file serving
- **Drizzle ORM + Zod** — Database schema definition and validation (ready for future use)
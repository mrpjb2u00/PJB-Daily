# Phase 0 Release Identifiers

Audit date: 2026-07-22

## Source and status

This document records release-critical identifiers from the Phase 0 audit and from the production references provided by the project owner. It does not include secret values. These identifiers must be re-verified before any release, build, rebranding, or store submission work.

Phase 1 rebrand note: The visible product name changed to PJB Daily after Phase 0. The identifiers below document the Phase 0 production baseline and must remain unchanged unless a separately approved migration occurs.

## Protected Production Identifiers

| Identifier | Current value | Source | Preservation status |
|---|---|---|---|
| Expo account | `mrpjb2u` | owner-provided production reference | Immutable for existing production app linkage |
| EAS project | `@mrpjb2u/todos-and-notes-by-pjb` | owner-provided production reference | Immutable for existing production app linkage |
| EAS project ID | `9f5ecc15-c74b-4aa9-86d8-b850ce80fbf8` | `app.json` and owner-provided reference | Immutable |
| Expo display name | `To-Dos & Notes by PJBStudios` | `app.json` | Preserve until approved rebranding phase |
| Expo slug | `todos-and-notes-by-pjb` | `app.json` and owner-provided reference | Immutable for current EAS project linkage unless explicitly migrated |
| URL scheme | `todosandnotes` | `app.json` | Immutable unless deep-link migration is planned |
| Android application ID | `com.pjbstudios.todosandnotes` | `app.json` | Immutable for existing Play Store app |
| iOS bundle identifier | `com.pjbstudios.todosandnotes` | `app.json` | Immutable for existing app identity |
| Current app version | `1.0.0` | `app.json` and `package.json` | Do not change during Phase 0 |

## Version Code And Build Number Management

`app.json` does not define Android `versionCode`.

`app.json` does not define iOS `buildNumber`.

`eas.json` sets:

- `cli.version`: `>= 18.0.6`
- `cli.appVersionSource`: `remote`
- `build.production.autoIncrement`: `true`

Interpretation: Android version code and iOS build number appear to be managed by EAS remote app versioning, with production builds configured to auto-increment. This was not verified against EAS remote state because Phase 0 did not query or mutate EAS services.

## Expo And Asset Paths

| Setting | Current value |
|---|---|
| App icon | `./assets/images/icon.png` |
| Splash image | `./assets/images/splash-icon.png` |
| Splash resize mode | `contain` |
| Splash background color | `#F8F7F4` |
| Android adaptive icon foreground | `./assets/images/android-icon-foreground.png` |
| Android adaptive icon background image | `./assets/images/android-icon-background.png` |
| Android adaptive icon monochrome | `./assets/images/android-icon-monochrome.png` |
| Android adaptive icon background color | `#E6F4FE` |
| Favicon path | `./assets/images/favicon.png`, but currently under an ignored root-level `web` key in `app.json` |

## Environment Variable Names

Mobile Supabase public environment variable names:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Other environment variable names observed in support scripts/server code:

- `EXPO_PUBLIC_DOMAIN`
- `DATABASE_URL`
- `REPLIT_DEV_DOMAIN`
- `REPLIT_DOMAINS`
- `REPLIT_INTERNAL_APP_DOMAIN`
- `PORT`
- `NODE_ENV`

No environment-variable values are recorded in this document.

## Immutable For Existing Production App

These must not be changed without a deliberate migration/release plan:

- Android application ID: `com.pjbstudios.todosandnotes`
- iOS bundle identifier: `com.pjbstudios.todosandnotes`
- EAS project ID: `9f5ecc15-c74b-4aa9-86d8-b850ce80fbf8`
- EAS project linkage: `@mrpjb2u/todos-and-notes-by-pjb`
- Expo slug: `todos-and-notes-by-pjb`
- URL scheme: `todosandnotes`
- Current Supabase project and its auth/data environment values
- App version/build-number management approach until release planning explicitly changes it

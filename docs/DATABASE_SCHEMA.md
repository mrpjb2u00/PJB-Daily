# PJB Daily Database Schema Reference

**Status:** Initial reference based on verified Phase 7.1 live database audit findings.

For full detail, see [Database Audit Report](./DATABASE_AUDIT_REPORT.md).

## Tables

Verified live tables before Phase 7.2:

- `public.profiles`
- `public.todos`
- `public.notes`

No related public owner, admin, analytics, telemetry, activity, or deletion tables existed during the Phase 7.1 audit.

## public.profiles

Columns:

- `id` UUID
- `username`
- `first_name`
- `birthday_month`
- `birthday_day`
- `created_at`
- `updated_at`

Primary key:

- `profiles.id`

Foreign key:

- `profiles.id` references `auth.users.id`
- `ON DELETE CASCADE`

Constraints:

- birthday completeness check
- birthday validity check
- username length check
- first-name length check

The inspected profile check constraints were marked `NOT VALID`.

Username uniqueness:

- `profiles_username_normalized_unique_idx`
- expression: `lower(btrim(username))`

## public.todos

Columns:

- `id` UUID
- `user_id` UUID
- `title`
- `completed`, default `false`
- `recurrence`, default `'none'`
- `last_completed_at`
- `created_at`
- `due_date`

Primary key:

- `todos.id`

Foreign key:

- `todos.user_id` references `auth.users.id`
- `ON DELETE CASCADE`

## public.notes

Columns:

- `id` UUID
- `user_id` UUID
- `title`
- `content`
- `created_at`
- `updated_at`
- `date`, nullable

Primary key:

- `notes.id`

Foreign key:

- `notes.user_id` references `auth.users.id`
- `ON DELETE CASCADE`

## private.app_roles

Phase 7.2 adds `private.app_roles` as the database-owned role-membership table for owner authorization.

Columns:

- `user_id` UUID
- `role`
- `created_at`

Primary key:

- `(user_id, role)`

Foreign key:

- `app_roles.user_id` references `auth.users.id`
- `ON DELETE CASCADE`

Supported roles:

- `owner`

`private.app_roles` is intentionally not stored in `public.profiles`. It has RLS enabled and no direct `anon` or `authenticated` table grants or client-facing table policies.

## public.is_owner()

Phase 7.2 adds `public.is_owner()` as the only client-facing owner check.

The function:

- accepts no arguments
- uses `auth.uid()` internally
- returns `false` for unauthenticated callers
- returns only a boolean
- does not expose role rows, user ids, email addresses, usernames, birthdays, or profile fields

Future owner analytics must remain aggregate-only. Owner dashboard queries should use separate owner-guarded RPCs or views that independently enforce authorization and never return task or note content.

## public.owner_analytics_summary()

Phase 7.3 adds `public.owner_analytics_summary()` as the first deployed owner analytics RPC.

The function:

- accepts no arguments
- independently checks `public.is_owner()`
- returns exactly one aggregate summary row
- returns numeric and timestamp values only
- does not return user IDs, email addresses, usernames, names, birthdays, auth metadata, to-do titles, note titles, note bodies, or raw rows

The first summary includes aggregate counts for registered users, profiles, to-dos, completed/open to-dos, to-do completion rate, recurring to-dos, to-dos with due dates, notes, dated notes, and 30-day new-row counts.

Mobile application integration reads this RPC through the owner analytics service. Active-user, login, platform, app-version, Daily Briefing engagement, and similar usage analytics are not supported by the current schema because there is no database-backed activity telemetry.

## public.owner_analytics_trends(start_date date, end_date date, bucket text)

Phase 7.4 adds `public.owner_analytics_trends(start_date date, end_date date, bucket text)` for deployed owner analytics trend buckets.

The function:

- independently checks `public.is_owner()`
- supports `day`, `week`, and `month` buckets
- accepts an inclusive date range of at most 366 days
- validates invalid parameters with SQLSTATE `22023`
- returns zero-filled buckets ordered by `bucket_start` ascending
- returns aggregate counts only
- does not add telemetry or return user IDs, email addresses, usernames, names, birthdays, auth metadata, to-do titles, note titles, note bodies, or raw rows

Return columns:

- `bucket_start`
- `new_registered_users`
- `new_profiles`
- `new_todos`
- `completed_todos`
- `new_notes`
- `dated_notes`

`completed_todos` uses `public.todos.last_completed_at`, so it can count only the latest recorded completion timestamp per to-do and cannot reconstruct historical repeated completion events. Phase 7.4B client integration displays New Users, New To-Dos, and Completed To-Dos trends while normalizing the full RPC response for future metric expansion.

## Account Lifecycle

Phase 8.2 adds a Supabase Edge Function named `delete-account`. It is deployed with JWT verification enabled, and the Profile screen integrates the production Delete Account flow with password re-entry and final confirmation.

The function deletes only the currently authenticated Supabase Auth caller through server-side privileged credentials. It does not accept a user id, email address, or deletion target from the request body. Owner self-deletion is blocked before the auth user deletion step.

No new deletion, telemetry, or audit table exists in v1. When a non-owner auth user is deleted, existing foreign keys cascade server-owned user data:

- `public.profiles.id` references `auth.users.id` with `ON DELETE CASCADE`
- `public.todos.user_id` references `auth.users.id` with `ON DELETE CASCADE`
- `public.notes.user_id` references `auth.users.id` with `ON DELETE CASCADE`
- `private.app_roles.user_id` references `auth.users.id` with `ON DELETE CASCADE`

Client-side local cleanup runs only after the deployed function confirms deletion. Owner-blocked, unauthorized, network, and server-failure responses preserve local state.

## RLS Ownership Model

RLS is enabled on:

- `profiles`
- `todos`
- `notes`

RLS is not forced.

Ownership checks:

- Profiles: `auth.uid() = id`
- Todos: `auth.uid() = user_id`
- Notes: `auth.uid() = user_id`

Todos and notes have `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies.

Future policy-hardening opportunities:

- review policies assigned to `public`
- add explicit `WITH CHECK` clauses to UPDATE policies

## Triggers And Functions

Triggers:

- `pjb_profiles_set_updated_at`: `BEFORE UPDATE` on `public.profiles`
- Auth trigger: `AFTER INSERT` on `auth.users`, calls `public.pjb_profiles_create_for_auth_user()`

Functions:

- `public.pjb_profiles_create_for_auth_user`
- `public.pjb_profiles_set_updated_at`

Both return `trigger`, use `SECURITY DEFINER`, and set `search_path` to `public, pg_temp`.

Function bodies were not audited.

## Indexes

Confirmed:

- primary-key indexes
- `profiles_username_normalized_unique_idx`

Possible future performance indexes, if query volume justifies them:

- `todos.user_id`
- `todos.due_date`
- `notes.user_id`
- `notes.date`

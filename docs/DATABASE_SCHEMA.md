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

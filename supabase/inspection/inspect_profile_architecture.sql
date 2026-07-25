-- PJB Daily Phase 3.1A profile architecture inspection.
-- READ ONLY: run these queries in the Supabase SQL Editor before applying
-- supabase/migrations/20260725000000_add_personal_profile_information.sql.
-- Bring the result sets back for review. Do not run the migration until table
-- names, policies, duplicates, and trigger behavior are confirmed.
-- If query 1 returns null, skip queries 11 through 16 until the intended
-- profile table name has been confirmed; those queries reference public.profiles.

-- 1. Does public.profiles exist?
select
  to_regclass('public.profiles') as public_profiles_table;

-- 2. public.profiles columns and types.
select
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
order by ordinal_position;

-- 3. public.profiles constraints.
select
  con.conname as constraint_name,
  con.contype as constraint_type,
  pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class cls on cls.oid = con.conrelid
join pg_namespace nsp on nsp.oid = cls.relnamespace
where nsp.nspname = 'public'
  and cls.relname = 'profiles'
order by con.conname;

-- 4. public.profiles indexes.
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'profiles'
order by indexname;

-- 5. public.profiles RLS status.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'profiles';

-- 6. All policies on public.profiles.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles'
order by policyname;

-- 7. Triggers on public.profiles.
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'profiles'
order by trigger_name, event_manipulation;

-- 8. Triggers on auth.users.
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'auth'
  and event_object_table = 'users'
order by trigger_name, event_manipulation;

-- 9. Functions likely associated with profile creation or timestamp updates.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'auth')
  and (
    p.proname ilike '%profile%'
    or p.proname ilike '%user%'
    or p.proname ilike '%updated%'
  )
order by n.nspname, p.proname;

-- 10. Public tables with profile-like columns.
select
  table_schema,
  table_name,
  array_agg(column_name order by ordinal_position) as matching_columns
from information_schema.columns
where table_schema = 'public'
  and column_name in (
    'user_id',
    'username',
    'first_name',
    'birthday_month',
    'birthday_day',
    'birth_month',
    'birth_day',
    'birthday'
  )
group by table_schema, table_name
order by table_name;

-- 11. Auth user count and profile row count.
select
  (select count(*) from auth.users) as auth_user_count,
  (select count(*) from public.profiles) as profile_row_count
where to_regclass('public.profiles') is not null;

-- 12. Auth users missing profile rows.
select
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data
from auth.users u
left join public.profiles p on p.id = u.id
where to_regclass('public.profiles') is not null
  and p.id is null
order by u.created_at;

-- 13. Profile rows with no matching Auth user.
select
  p.id,
  p.username,
  p.created_at,
  p.updated_at
from public.profiles p
left join auth.users u on u.id = p.id
where to_regclass('public.profiles') is not null
  and u.id is null
order by p.created_at;

-- 14. Exact duplicate nonblank usernames.
select
  username,
  count(*) as row_count,
  array_agg(id order by id) as profile_ids
from public.profiles
where to_regclass('public.profiles') is not null
  and username is not null
  and btrim(username) <> ''
group by username
having count(*) > 1
order by lower(btrim(username));

-- 15. Case-insensitive normalized duplicate usernames.
select
  lower(btrim(username)) as normalized_username,
  count(*) as row_count,
  array_agg(id order by id) as profile_ids,
  array_agg(username order by username) as usernames
from public.profiles
where to_regclass('public.profiles') is not null
  and username is not null
  and btrim(username) <> ''
group by lower(btrim(username))
having count(*) > 1
order by normalized_username;

-- 16. Null or blank usernames.
select
  id,
  username,
  created_at,
  updated_at
from public.profiles
where to_regclass('public.profiles') is not null
  and (username is null or btrim(username) = '')
order by created_at;

-- 17. Existing first-name or birthday-like columns anywhere public.
select
  table_schema,
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and (
    column_name ilike '%first%name%'
    or column_name ilike '%birth%'
    or column_name ilike '%birthday%'
  )
order by table_name, column_name;

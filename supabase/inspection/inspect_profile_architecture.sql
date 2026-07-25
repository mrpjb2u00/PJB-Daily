-- PJB Daily Phase 3.1C profile architecture inspection.
-- READ ONLY: run this whole file in the Supabase SQL Editor before applying
-- supabase/migrations/20260725000000_add_personal_profile_information.sql.
--
-- Migration approval is blocked by any normalized Auth username duplicates,
-- unexpected profile-like tables, unsafe profile policies, orphan profiles,
-- duplicate profile usernames, or malformed username metadata that needs an
-- owner decision before backfill.

-- 1. Does public.profiles exist?
select
  to_regclass('public.profiles') as public_profiles_table;

-- 2. Total Auth users.
select
  count(*) as auth_user_count
from auth.users;

-- 3. Auth username metadata health summary.
select
  count(*) filter (where not (raw_user_meta_data ? 'username')) as missing_username_metadata,
  count(*) filter (where raw_user_meta_data ? 'username' and raw_user_meta_data ->> 'username' is null) as null_username_metadata,
  count(*) filter (where raw_user_meta_data ->> 'username' is not null and btrim(raw_user_meta_data ->> 'username') = '') as blank_username_metadata,
  count(*) filter (where length(btrim(coalesce(raw_user_meta_data ->> 'username', ''))) > 50) as usernames_over_50_chars,
  count(*) filter (
    where raw_user_meta_data ->> 'username' is not null
      and btrim(raw_user_meta_data ->> 'username') <> ''
      and length(btrim(raw_user_meta_data ->> 'username')) < 3
  ) as usernames_under_3_chars
from auth.users;

-- 4. Raw and normalized Auth username metadata.
select
  id,
  email,
  raw_user_meta_data ->> 'username' as raw_username,
  nullif(btrim(raw_user_meta_data ->> 'username'), '') as trimmed_username,
  lower(nullif(btrim(raw_user_meta_data ->> 'username'), '')) as normalized_username,
  length(btrim(coalesce(raw_user_meta_data ->> 'username', ''))) as trimmed_username_length
from auth.users
order by created_at, id;

-- 5. Auth users with missing, null, blank, too-short, or too-long username metadata.
select
  id,
  email,
  raw_user_meta_data ->> 'username' as raw_username,
  case
    when not (raw_user_meta_data ? 'username') then 'missing'
    when raw_user_meta_data ->> 'username' is null then 'null'
    when btrim(raw_user_meta_data ->> 'username') = '' then 'blank'
    when length(btrim(raw_user_meta_data ->> 'username')) < 3 then 'too_short'
    when length(btrim(raw_user_meta_data ->> 'username')) > 50 then 'too_long'
    else 'ok'
  end as username_status
from auth.users
where not (raw_user_meta_data ? 'username')
  or raw_user_meta_data ->> 'username' is null
  or btrim(raw_user_meta_data ->> 'username') = ''
  or length(btrim(raw_user_meta_data ->> 'username')) < 3
  or length(btrim(raw_user_meta_data ->> 'username')) > 50
order by username_status, created_at, id;

-- 6. Exact duplicate raw Auth usernames.
select
  raw_user_meta_data ->> 'username' as raw_username,
  count(*) as affected_user_count,
  array_agg(id order by id) as auth_user_ids,
  array_agg(email order by email) as emails
from auth.users
where raw_user_meta_data ->> 'username' is not null
  and btrim(raw_user_meta_data ->> 'username') <> ''
group by raw_user_meta_data ->> 'username'
having count(*) > 1
order by raw_username;

-- 7. Case-insensitive trimmed duplicate Auth usernames.
-- Any rows here block migration approval until resolved manually.
select
  lower(btrim(raw_user_meta_data ->> 'username')) as normalized_username,
  count(*) as affected_user_count,
  array_agg(id order by id) as auth_user_ids,
  array_agg(email order by email) as emails,
  array_agg(raw_user_meta_data ->> 'username' order by raw_user_meta_data ->> 'username') as raw_usernames
from auth.users
where raw_user_meta_data ->> 'username' is not null
  and btrim(raw_user_meta_data ->> 'username') <> ''
group by lower(btrim(raw_user_meta_data ->> 'username'))
having count(*) > 1
order by normalized_username;

-- 8. Public tables with profile-like columns.
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

-- 9. public.profiles columns and types. Safe when the table is absent.
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

-- 10. public.profiles constraints. Safe when the table is absent.
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

-- 11. public.profiles indexes. Safe when the table is absent.
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'profiles'
order by indexname;

-- 12. public.profiles RLS status. Safe when the table is absent.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'profiles';

-- 13. All policies on public.profiles. Safe when the table is absent.
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

-- 14. Triggers on public.profiles. Safe when the table is absent.
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'profiles'
order by trigger_name, event_manipulation;

-- 15. Triggers on auth.users.
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'auth'
  and event_object_table = 'users'
order by trigger_name, event_manipulation;

-- 16. Functions likely associated with profile creation or timestamp updates.
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

-- 17. public.profiles row count. Returns XML result or a skipped marker.
select case
  when to_regclass('public.profiles') is null then '<skipped reason="public.profiles does not exist"/>'::xml
  else query_to_xml('select count(*) as profile_row_count from public.profiles', true, false, '')
end as profile_row_count_result;

-- 18. Auth users missing profile rows. Returns XML result or a skipped marker.
select case
  when to_regclass('public.profiles') is null then '<skipped reason="public.profiles does not exist"/>'::xml
  else query_to_xml(
    'select u.id, u.email, u.created_at, u.raw_user_meta_data
     from auth.users u
     left join public.profiles p on p.id = u.id
     where p.id is null
     order by u.created_at, u.id',
    true,
    false,
    ''
  )
end as auth_users_missing_profiles_result;

-- 19. Profile rows with no matching Auth user. Returns XML result or a skipped marker.
select case
  when to_regclass('public.profiles') is null then '<skipped reason="public.profiles does not exist"/>'::xml
  else query_to_xml(
    'select p.id, p.username, p.created_at, p.updated_at
     from public.profiles p
     left join auth.users u on u.id = p.id
     where u.id is null
     order by p.created_at, p.id',
    true,
    false,
    ''
  )
end as orphan_profiles_result;

-- 20. Exact duplicate profile usernames. Returns XML result or a skipped marker.
select case
  when to_regclass('public.profiles') is null then '<skipped reason="public.profiles does not exist"/>'::xml
  else query_to_xml(
    'select username, count(*) as row_count, array_agg(id order by id) as profile_ids
     from public.profiles
     where username is not null and btrim(username) <> ''''
     group by username
     having count(*) > 1
     order by lower(btrim(username))',
    true,
    false,
    ''
  )
end as exact_duplicate_profile_usernames_result;

-- 21. Case-insensitive trimmed duplicate profile usernames. Returns XML result or a skipped marker.
select case
  when to_regclass('public.profiles') is null then '<skipped reason="public.profiles does not exist"/>'::xml
  else query_to_xml(
    'select lower(btrim(username)) as normalized_username, count(*) as row_count,
            array_agg(id order by id) as profile_ids,
            array_agg(username order by username) as usernames
     from public.profiles
     where username is not null and btrim(username) <> ''''
     group by lower(btrim(username))
     having count(*) > 1
     order by normalized_username',
    true,
    false,
    ''
  )
end as normalized_duplicate_profile_usernames_result;

-- 22. Null or blank profile usernames. Returns XML result or a skipped marker.
select case
  when to_regclass('public.profiles') is null then '<skipped reason="public.profiles does not exist"/>'::xml
  else query_to_xml(
    'select id, username, created_at, updated_at
     from public.profiles
     where username is null or btrim(username) = ''''
     order by created_at, id',
    true,
    false,
    ''
  )
end as null_or_blank_profile_usernames_result;

-- 23. Existing first-name or birthday-like columns anywhere public.
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

-- Phase 3.1A: personal profile information for PJB Daily.
-- Review-only migration. Do not apply to production until
-- supabase/inspection/inspect_profile_architecture.sql has been run and reviewed.
--
-- Intended architecture:
-- - Supabase Auth remains the authentication source.
-- - public.profiles is the application profile source of truth.
-- - Auth user metadata seeds initial profile creation and remains compatibility data only.
-- - This migration is additive and preserves existing Auth users/profile rows.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  first_name text,
  birthday_month smallint,
  birthday_day smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists username text,
  add column if not exists first_name text,
  add column if not exists birthday_month smallint,
  add column if not exists birthday_day smallint,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_first_name_length_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_first_name_length_check
      check (first_name is null or length(btrim(first_name)) between 1 and 50)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_length_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_username_length_check
      check (username is null or btrim(username) = '' or length(btrim(username)) >= 3)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_birthday_complete_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_birthday_complete_check
      check (
        (birthday_month is null and birthday_day is null)
        or (birthday_month is not null and birthday_day is not null)
      )
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_birthday_real_date_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_birthday_real_date_check
      check (
        (birthday_month is null and birthday_day is null)
        or (
          birthday_month between 1 and 12
          and birthday_day between 1 and case birthday_month
            when 1 then 31
            when 2 then 29
            when 3 then 31
            when 4 then 30
            when 5 then 31
            when 6 then 30
            when 7 then 31
            when 8 then 31
            when 9 then 30
            when 10 then 31
            when 11 then 30
            when 12 then 31
          end
        )
      )
      not valid;
  end if;
end $$;

create or replace function public.pjb_profiles_set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'pjb_profiles_set_updated_at'
      and tgrelid = 'public.profiles'::regclass
  ) then
    create trigger pjb_profiles_set_updated_at
      before update on public.profiles
      for each row
      execute function public.pjb_profiles_set_updated_at();
  end if;
end $$;

create or replace function public.pjb_profiles_create_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  raw_username text := nullif(btrim(new.raw_user_meta_data ->> 'username'), '');
  raw_first_name text := nullif(btrim(new.raw_user_meta_data ->> 'first_name'), '');
  raw_birthday_month text := new.raw_user_meta_data ->> 'birthday_month';
  raw_birthday_day text := new.raw_user_meta_data ->> 'birthday_day';
  parsed_birthday_month smallint;
  parsed_birthday_day smallint;
begin
  if raw_username is not null and length(raw_username) < 3 then
    raw_username := null;
  end if;

  if raw_first_name is not null and length(raw_first_name) > 50 then
    raw_first_name := null;
  end if;

  if raw_birthday_month ~ '^[0-9]+$' then
    parsed_birthday_month := raw_birthday_month::smallint;
  end if;

  if raw_birthday_day ~ '^[0-9]+$' then
    parsed_birthday_day := raw_birthday_day::smallint;
  end if;

  if not (
    parsed_birthday_month between 1 and 12
    and parsed_birthday_day between 1 and case parsed_birthday_month
      when 1 then 31
      when 2 then 29
      when 3 then 31
      when 4 then 30
      when 5 then 31
      when 6 then 30
      when 7 then 31
      when 8 then 31
      when 9 then 30
      when 10 then 31
      when 11 then 30
      when 12 then 31
    end
  ) then
    parsed_birthday_month := null;
    parsed_birthday_day := null;
  end if;

  insert into public.profiles (
    id,
    username,
    first_name,
    birthday_month,
    birthday_day
  )
  values (
    new.id,
    raw_username,
    raw_first_name,
    parsed_birthday_month,
    parsed_birthday_day
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'pjb_profiles_create_for_auth_user'
      and tgrelid = 'auth.users'::regclass
  ) then
    create trigger pjb_profiles_create_for_auth_user
      after insert on auth.users
      for each row
      execute function public.pjb_profiles_create_for_auth_user();
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from public.profiles
    where username is not null
      and btrim(username) <> ''
    group by lower(btrim(username))
    having count(*) > 1
  ) then
    raise exception 'Cannot create normalized username uniqueness index: duplicate trimmed case-insensitive usernames exist. Run supabase/inspection/inspect_profile_architecture.sql and resolve duplicates manually.';
  end if;
end $$;

create unique index if not exists profiles_username_normalized_unique_idx
  on public.profiles (lower(btrim(username)))
  where username is not null
    and btrim(username) <> '';

insert into public.profiles (
  id,
  username,
  first_name,
  birthday_month,
  birthday_day
)
select
  u.id,
  case
    when length(nullif(btrim(u.raw_user_meta_data ->> 'username'), '')) >= 3
      then nullif(btrim(u.raw_user_meta_data ->> 'username'), '')
    else null
  end as username,
  case
    when length(nullif(btrim(u.raw_user_meta_data ->> 'first_name'), '')) between 1 and 50
      then nullif(btrim(u.raw_user_meta_data ->> 'first_name'), '')
    else null
  end as first_name,
  case
    when (u.raw_user_meta_data ->> 'birthday_month') ~ '^[0-9]+$'
      and (u.raw_user_meta_data ->> 'birthday_day') ~ '^[0-9]+$'
      and (u.raw_user_meta_data ->> 'birthday_month')::smallint between 1 and 12
      and (u.raw_user_meta_data ->> 'birthday_day')::smallint between 1 and case (u.raw_user_meta_data ->> 'birthday_month')::smallint
        when 1 then 31
        when 2 then 29
        when 3 then 31
        when 4 then 30
        when 5 then 31
        when 6 then 30
        when 7 then 31
        when 8 then 31
        when 9 then 30
        when 10 then 31
        when 11 then 30
        when 12 then 31
      end
      then (u.raw_user_meta_data ->> 'birthday_month')::smallint
    else null
  end as birthday_month,
  case
    when (u.raw_user_meta_data ->> 'birthday_month') ~ '^[0-9]+$'
      and (u.raw_user_meta_data ->> 'birthday_day') ~ '^[0-9]+$'
      and (u.raw_user_meta_data ->> 'birthday_month')::smallint between 1 and 12
      and (u.raw_user_meta_data ->> 'birthday_day')::smallint between 1 and case (u.raw_user_meta_data ->> 'birthday_month')::smallint
        when 1 then 31
        when 2 then 29
        when 3 then 31
        when 4 then 30
        when 5 then 31
        when 6 then 30
        when 7 then 31
        when 8 then 31
        when 9 then 30
        when 10 then 31
        when 11 then 30
        when 12 then 31
      end
      then (u.raw_user_meta_data ->> 'birthday_day')::smallint
    else null
  end as birthday_day
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.id = u.id
)
on conflict (id) do nothing;

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can read own profile'
  ) then
    create policy "Users can read own profile"
      on public.profiles
      for select
      to authenticated
      using (auth.uid() = id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile"
      on public.profiles
      for insert
      to authenticated
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile"
      on public.profiles
      for update
      to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

grant select, insert, update on public.profiles to authenticated;

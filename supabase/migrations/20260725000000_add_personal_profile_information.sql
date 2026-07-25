-- Phase 3.1: personal profile information for PJB Daily.
-- Review-only migration. Do not apply to production until manually approved.
-- This preserves existing users by keeping first_name and birthday fields nullable.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists username text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists first_name text,
  add column if not exists birthday_month smallint,
  add column if not exists birthday_day smallint;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (username)
  where username is not null;

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
      check (first_name is null or length(btrim(first_name)) between 1 and 50);
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
      );
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
      );
  end if;
end $$;

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
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

-- Phase 7.4A: owner analytics trend buckets for PJB Daily.
-- Local-only migration. Do not apply to production until reviewed.
--
-- Intended architecture:
-- - Owner analytics are exposed through owner-authorized RPCs only.
-- - public.owner_analytics_trends(start_date, end_date, bucket) returns
--   aggregate bucket counts only.
-- - No user IDs, emails, profile fields, to-do titles, note titles, note bodies,
--   auth metadata, or raw rows are returned.
-- - completed_todos uses public.todos.last_completed_at. This can count only
--   the latest recorded completion timestamp per to-do, not historical repeated
--   completion events.
-- - The mobile application must not query protected tables directly for analytics.

create or replace function public.owner_analytics_trends(
  start_date date,
  end_date date,
  bucket text
)
returns table (
  bucket_start date,
  new_registered_users bigint,
  new_profiles bigint,
  new_todos bigint,
  completed_todos bigint,
  new_notes bigint,
  dated_notes bigint
)
language plpgsql
security definer
stable
set search_path = pg_catalog, pg_temp
as $$
begin
  if public.is_owner() is not true then
    raise exception using
      errcode = '42501',
      message = 'Not authorized';
  end if;

  if $1 is null then
    raise exception using
      errcode = '22023',
      message = 'start_date must not be null';
  end if;

  if $2 is null then
    raise exception using
      errcode = '22023',
      message = 'end_date must not be null';
  end if;

  if $1 > $2 then
    raise exception using
      errcode = '22023',
      message = 'start_date must be on or before end_date';
  end if;

  if $3 is null or $3 not in ('day', 'week', 'month') then
    raise exception using
      errcode = '22023',
      message = 'bucket must be one of day, week, or month';
  end if;

  if ($2 - $1) > 365 then
    raise exception using
      errcode = '22023',
      message = 'date range must be 366 days or less';
  end if;

  return query
  with buckets as (
    select generated_bucket.bucket_start::date as bucket_start
    from pg_catalog.generate_series(
      case
        when $3 = 'day' then $1
        when $3 = 'week' then pg_catalog.date_trunc('week', $1::timestamp)::date
        else pg_catalog.date_trunc('month', $1::timestamp)::date
      end,
      case
        when $3 = 'day' then $2
        when $3 = 'week' then pg_catalog.date_trunc('week', $2::timestamp)::date
        else pg_catalog.date_trunc('month', $2::timestamp)::date
      end,
      case
        when $3 = 'day' then '1 day'::interval
        when $3 = 'week' then '1 week'::interval
        else '1 month'::interval
      end
    ) as generated_bucket(bucket_start)
  ),
  registered_users_by_bucket as (
    select
      case
        when $3 = 'day' then u.created_at::date
        when $3 = 'week' then pg_catalog.date_trunc('week', u.created_at::date::timestamp)::date
        else pg_catalog.date_trunc('month', u.created_at::date::timestamp)::date
      end as bucket_start,
      count(*)::bigint as new_registered_users
    from auth.users u
    where u.created_at::date between $1 and $2
    group by 1
  ),
  profiles_by_bucket as (
    select
      case
        when $3 = 'day' then p.created_at::date
        when $3 = 'week' then pg_catalog.date_trunc('week', p.created_at::date::timestamp)::date
        else pg_catalog.date_trunc('month', p.created_at::date::timestamp)::date
      end as bucket_start,
      count(*)::bigint as new_profiles
    from public.profiles p
    where p.created_at::date between $1 and $2
    group by 1
  ),
  new_todos_by_bucket as (
    select
      case
        when $3 = 'day' then t.created_at::date
        when $3 = 'week' then pg_catalog.date_trunc('week', t.created_at::date::timestamp)::date
        else pg_catalog.date_trunc('month', t.created_at::date::timestamp)::date
      end as bucket_start,
      count(*)::bigint as new_todos
    from public.todos t
    where t.created_at::date between $1 and $2
    group by 1
  ),
  completed_todos_by_bucket as (
    select
      case
        when $3 = 'day' then t.last_completed_at::date
        when $3 = 'week' then pg_catalog.date_trunc('week', t.last_completed_at::date::timestamp)::date
        else pg_catalog.date_trunc('month', t.last_completed_at::date::timestamp)::date
      end as bucket_start,
      count(*)::bigint as completed_todos
    from public.todos t
    where t.last_completed_at::date between $1 and $2
    group by 1
  ),
  new_notes_by_bucket as (
    select
      case
        when $3 = 'day' then n.created_at::date
        when $3 = 'week' then pg_catalog.date_trunc('week', n.created_at::date::timestamp)::date
        else pg_catalog.date_trunc('month', n.created_at::date::timestamp)::date
      end as bucket_start,
      count(*)::bigint as new_notes
    from public.notes n
    where n.created_at::date between $1 and $2
    group by 1
  ),
  dated_notes_by_bucket as (
    select
      case
        when $3 = 'day' then n.date
        when $3 = 'week' then pg_catalog.date_trunc('week', n.date::timestamp)::date
        else pg_catalog.date_trunc('month', n.date::timestamp)::date
      end as bucket_start,
      count(*)::bigint as dated_notes
    from public.notes n
    where n.date between $1 and $2
    group by 1
  )
  select
    b.bucket_start,
    coalesce(ru.new_registered_users, 0)::bigint as new_registered_users,
    coalesce(pb.new_profiles, 0)::bigint as new_profiles,
    coalesce(nt.new_todos, 0)::bigint as new_todos,
    coalesce(ct.completed_todos, 0)::bigint as completed_todos,
    coalesce(nn.new_notes, 0)::bigint as new_notes,
    coalesce(dn.dated_notes, 0)::bigint as dated_notes
  from buckets b
  left join registered_users_by_bucket ru on ru.bucket_start = b.bucket_start
  left join profiles_by_bucket pb on pb.bucket_start = b.bucket_start
  left join new_todos_by_bucket nt on nt.bucket_start = b.bucket_start
  left join completed_todos_by_bucket ct on ct.bucket_start = b.bucket_start
  left join new_notes_by_bucket nn on nn.bucket_start = b.bucket_start
  left join dated_notes_by_bucket dn on dn.bucket_start = b.bucket_start
  order by b.bucket_start asc;
end;
$$;

comment on function public.owner_analytics_trends(date, date, text) is
  'Returns owner-authorized aggregate trend buckets without exposing individual user content, identifiers, profile fields, auth metadata, or raw rows. The RPC adds no telemetry and uses only existing row timestamps and dates.';

revoke all on function public.owner_analytics_trends(date, date, text) from public;
revoke all on function public.owner_analytics_trends(date, date, text) from anon;
revoke all on function public.owner_analytics_trends(date, date, text) from authenticated;

grant execute on function public.owner_analytics_trends(date, date, text) to authenticated;
-- service_role execute is intentional for administrative and future server-side checks.
grant execute on function public.owner_analytics_trends(date, date, text) to service_role;

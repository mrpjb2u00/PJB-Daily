-- Phase 7.3 Step 2: owner analytics aggregate summary RPC for PJB Daily.
-- Review-only migration. Do not apply to production until reviewed.
--
-- Intended architecture:
-- - Owner analytics are exposed through owner-authorized RPCs only.
-- - public.owner_analytics_summary() returns aggregate statistics only.
-- - No user IDs, emails, profile fields, to-do titles, note titles, note bodies,
--   auth metadata, or raw rows are returned.
-- - The mobile application must not query protected tables directly for analytics.

create or replace function public.owner_analytics_summary()
returns table (
  generated_at timestamptz,
  registered_user_count bigint,
  profile_count bigint,
  new_registered_users_30d bigint,
  new_profiles_30d bigint,
  todo_count bigint,
  completed_todo_count bigint,
  open_todo_count bigint,
  todo_completion_rate numeric,
  new_todos_30d bigint,
  recurring_todo_count bigint,
  todos_with_due_date_count bigint,
  note_count bigint,
  new_notes_30d bigint,
  dated_note_count bigint
)
language plpgsql
security definer
stable
set search_path = pg_catalog, pg_temp
as $$
begin
  if public.is_owner() is not true then
    raise exception 'Not authorized';
  end if;

  return query
  with todo_summary as (
    select
      count(*) as total_count,
      count(*) filter (where t.completed is true) as completed_count,
      count(*) filter (where t.completed is not true) as open_count,
      count(*) filter (
        where t.created_at >= current_timestamp - interval '30 days'
      ) as new_count_30d,
      count(*) filter (
        where t.recurrence is not null
          and btrim(t.recurrence) <> ''
          and lower(btrim(t.recurrence)) <> 'none'
      ) as recurring_count,
      count(*) filter (where t.due_date is not null) as with_due_date_count
    from public.todos t
  ),
  note_summary as (
    select
      count(*) as total_count,
      count(*) filter (
        where n.created_at >= current_timestamp - interval '30 days'
      ) as new_count_30d,
      count(*) filter (where n.date is not null) as dated_count
    from public.notes n
  )
  select
    current_timestamp as generated_at,
    (select count(*) from auth.users) as registered_user_count,
    (select count(*) from public.profiles) as profile_count,
    (
      select count(*)
      from auth.users u
      where u.created_at >= current_timestamp - interval '30 days'
    ) as new_registered_users_30d,
    (
      select count(*)
      from public.profiles p
      where p.created_at >= current_timestamp - interval '30 days'
    ) as new_profiles_30d,
    ts.total_count as todo_count,
    ts.completed_count as completed_todo_count,
    ts.open_count as open_todo_count,
    case
      when ts.total_count = 0 then 0::numeric
      else round((ts.completed_count::numeric / ts.total_count::numeric) * 100, 2)
    end as todo_completion_rate,
    ts.new_count_30d as new_todos_30d,
    ts.recurring_count as recurring_todo_count,
    ts.with_due_date_count as todos_with_due_date_count,
    ns.total_count as note_count,
    ns.new_count_30d as new_notes_30d,
    ns.dated_count as dated_note_count
  from todo_summary ts
  cross join note_summary ns;
end;
$$;

comment on function public.owner_analytics_summary() is
  'Returns owner-authorized aggregate application statistics without exposing individual user content, identifiers, profile fields, or raw rows.';

revoke all on function public.owner_analytics_summary() from public;
revoke all on function public.owner_analytics_summary() from anon;
revoke all on function public.owner_analytics_summary() from authenticated;

grant execute on function public.owner_analytics_summary() to authenticated;
-- service_role execute is intentional for administrative and future server-side checks.
grant execute on function public.owner_analytics_summary() to service_role;

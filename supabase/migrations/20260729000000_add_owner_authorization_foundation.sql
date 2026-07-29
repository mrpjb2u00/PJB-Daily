-- Phase 7.2 Step 1: owner authorization foundation for PJB Daily.
-- Review-only migration. Do not apply to production until reviewed.
--
-- Intended architecture:
-- - Supabase Auth remains the authentication source.
-- - private.app_roles stores database-owned application role memberships.
-- - public.is_owner() is the only client-facing owner authorization check.
-- - Owner membership is assigned manually after this migration is applied.
-- - No owner role is stored in public.profiles.
-- - No service-role key is used by the mobile application.

create schema if not exists private;

comment on schema private is
  'Private application schema for server-side authorization data. This schema is not intended for direct mobile client access.';

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table if not exists private.app_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  constraint app_roles_pkey primary key (user_id, role),
  constraint app_roles_role_check check (role in ('owner'))
);

comment on table private.app_roles is
  'Private application role-membership table. Phase 7.2 supports only the owner role and does not expose direct client access.';

comment on column private.app_roles.user_id is
  'Authenticated user id from auth.users. Rows are deleted automatically when the auth user is deleted.';

comment on column private.app_roles.role is
  'Application role name. The only supported Phase 7.2 value is owner.';

alter table private.app_roles enable row level security;

revoke all on table private.app_roles from public;
revoke all on table private.app_roles from anon;
revoke all on table private.app_roles from authenticated;

create or replace function public.is_owner()
returns boolean
language sql
security definer
stable
set search_path = pg_catalog, pg_temp
as $$
  select exists (
    select 1
    from private.app_roles ar
    where ar.user_id = auth.uid()
      and ar.role = 'owner'
  );
$$;

comment on function public.is_owner() is
  'Returns true only when the current authenticated user has private owner membership. The RPC returns a boolean so membership rows and user identifiers are never exposed to clients.';

revoke all on function public.is_owner() from public;
revoke all on function public.is_owner() from anon;
revoke all on function public.is_owner() from authenticated;

grant execute on function public.is_owner() to authenticated;
-- service_role execute is intentional for administrative and future server-side checks.
grant execute on function public.is_owner() to service_role;

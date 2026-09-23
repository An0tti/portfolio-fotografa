begin;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_timestamp_order check (updated_at >= created_at)
);

-- At most one active administrator; inactive historical records are allowed.
create unique index admin_users_single_active on public.admin_users (active) where active;

create function public.set_admin_users_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.created_at := old.created_at;
  new.updated_at := greatest(clock_timestamp(), old.updated_at);
  return new;
end;
$$;
revoke all on function public.set_admin_users_updated_at() from public, anon, authenticated;

create trigger admin_users_updated_at before update on public.admin_users
for each row execute function public.set_admin_users_updated_at();

alter table public.admin_users enable row level security;
alter table public.admin_users force row level security;

revoke all on table public.admin_users from public, anon, authenticated, service_role;
grant select on table public.admin_users to authenticated;
grant select, insert, update, delete on table public.admin_users to service_role;

create policy admin_users_select_own_active on public.admin_users
for select to authenticated
using ((select auth.uid()) = user_id and active);

-- No API write policy. Provisioning is a controlled operation in a later phase.
commit;

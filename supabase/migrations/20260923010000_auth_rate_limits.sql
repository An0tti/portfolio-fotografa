-- Phase 3 only: fixed, atomic limits; no identities or raw email addresses stored.
create table public.auth_rate_limits (
  operation text not null check (operation in ('login', 'recover', 'password', 'callback')),
  identifier text not null check (identifier = 'global' or identifier ~ '^[a-f0-9]{64}$'),
  window_start timestamptz not null,
  attempts integer not null check (attempts > 0),
  primary key (operation, identifier)
);
alter table public.auth_rate_limits enable row level security;
alter table public.auth_rate_limits force row level security;
revoke all on public.auth_rate_limits from public, anon, authenticated, service_role;

create function public.consume_auth_rate_limit(p_operation text, p_key text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  current_time_value timestamptz := clock_timestamp();
  attempt_count integer;
  max_attempts integer;
begin
  if p_operation not in ('login', 'recover', 'password', 'callback')
    or p_operation is null or p_key is null
    or not (p_key = 'global' or p_key ~ '^[a-f0-9]{64}$') then
    raise exception 'Invalid rate limit input' using errcode = '22023';
  end if;
  max_attempts := case when p_key = 'global' then 60 when p_operation = 'recover' then 3 else 10 end;
  -- Retention at most 24h of inactivity, cleaned on the next authentication attempt.
  delete from public.auth_rate_limits where window_start < current_time_value - interval '24 hours';
  insert into public.auth_rate_limits as limits (operation, identifier, window_start, attempts)
    values (p_operation, p_key, current_time_value, 1)
  on conflict (operation, identifier) do update set
    window_start = case when limits.window_start <= current_time_value - interval '15 minutes'
      then current_time_value else limits.window_start end,
    attempts = case when limits.window_start <= current_time_value - interval '15 minutes'
      then 1 else least(limits.attempts + 1, 1000000) end
  returning attempts into attempt_count;
  return attempt_count <= max_attempts;
end;
$$;
revoke all on function public.consume_auth_rate_limit(text, text) from public, anon, authenticated;
grant execute on function public.consume_auth_rate_limit(text, text) to service_role;

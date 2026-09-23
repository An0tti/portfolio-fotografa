begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(18);

-- Inspect real objects without calling the real RPC or writing to them.
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.auth_rate_limits'::regclass), 'RLS enabled and forced');
select ok(not has_table_privilege('authenticated', 'public.auth_rate_limits', 'SELECT,INSERT,UPDATE,DELETE'), 'no authenticated table access');
select ok(not has_table_privilege('service_role', 'public.auth_rate_limits', 'SELECT,INSERT,UPDATE,DELETE'), 'service uses RPC only');
select ok(not has_function_privilege('anon', 'public.consume_auth_rate_limit(text,text)', 'EXECUTE'), 'anonymous RPC denied');
select ok(not has_function_privilege('authenticated', 'public.consume_auth_rate_limit(text,text)', 'EXECUTE'), 'authenticated RPC denied');
select ok(has_function_privilege('service_role', 'public.consume_auth_rate_limit(text,text)', 'EXECUTE'), 'service RPC allowed');

-- Session-private, initially empty table: no existing rows are copied.
-- Constraints and indexes are copied; real RLS/grants are checked above.
create temporary table phase3_test_auth_rate_limits
  (like public.auth_rate_limits including all);

-- The real function's retention cleanup can touch unrelated expired rows.
-- Copy its installed body, redirect storage and freeze time for these tests.
-- This does not test execution of the real RPC under service_role.
do $setup$
declare
  test_body text;
begin
  select prosrc into strict test_body
  from pg_proc
  where oid = 'public.consume_auth_rate_limit(text,text)'::regprocedure;

  if position('public.auth_rate_limits' in test_body) = 0
    or position('clock_timestamp()' in test_body) = 0 then
    raise exception 'Rate limit implementation changed; review isolated test setup';
  end if;

  test_body := replace(test_body, 'public.auth_rate_limits', 'pg_temp.phase3_test_auth_rate_limits');
  test_body := replace(test_body, 'clock_timestamp()', 'transaction_timestamp()');

  execute format(
    'create function pg_temp.phase3_test_consume_auth_rate_limit(p_operation text, p_key text)
     returns boolean language plpgsql security definer set search_path = %L as %L',
    '', test_body
  );
end;
$setup$;

-- Artificial keys: repeated a1 = recovery; repeated b2 = ordinary login.
-- Session-private storage prevents collisions, including concurrent runs.
-- The literal global key is required to exercise the global branch.
select ok(pg_temp.phase3_test_consume_auth_rate_limit('recover', repeat('a1', 32)), 'first recovery allowed');
select ok(pg_temp.phase3_test_consume_auth_rate_limit('recover', repeat('a1', 32)), 'second recovery allowed');
select ok(pg_temp.phase3_test_consume_auth_rate_limit('recover', repeat('a1', 32)), 'third recovery allowed');
select ok(not pg_temp.phase3_test_consume_auth_rate_limit('recover', repeat('a1', 32)), 'fourth recovery blocked');
select throws_ok($$select pg_temp.phase3_test_consume_auth_rate_limit('invalid', 'global')$$, '22023', null, 'unknown operation rejected');
select throws_ok($$select pg_temp.phase3_test_consume_auth_rate_limit('login', 'raw-email@example.test')$$, '22023', null, 'raw identifier rejected');

update pg_temp.phase3_test_auth_rate_limits
set window_start = transaction_timestamp() - interval '16 minutes'
where operation = 'recover' and identifier = repeat('a1', 32);
select ok(pg_temp.phase3_test_consume_auth_rate_limit('recover', repeat('a1', 32)), 'window resets');

update pg_temp.phase3_test_auth_rate_limits
set window_start = transaction_timestamp() - interval '25 hours'
where operation = 'recover' and identifier = repeat('a1', 32);
-- Creates the artificial login fixture and triggers isolated retention.
select pg_temp.phase3_test_consume_auth_rate_limit('login', repeat('b2', 32));
select is((select count(*) from pg_temp.phase3_test_auth_rate_limits
  where operation = 'recover' and identifier = repeat('a1', 32)), 0::bigint, 'old fixture cleaned');

-- Reset only this fixture to assert attempts 1 through 10 explicitly.
delete from pg_temp.phase3_test_auth_rate_limits
where operation = 'login' and identifier = repeat('b2', 32);
select ok((select bool_and(pg_temp.phase3_test_consume_auth_rate_limit('login', repeat('b2', 32)))
  from generate_series(1, 10)), 'ordinary login attempts 1 through 10 allowed');
select ok(not pg_temp.phase3_test_consume_auth_rate_limit('login', repeat('b2', 32)), 'ordinary login attempt 11 blocked');

select ok((select bool_and(pg_temp.phase3_test_consume_auth_rate_limit('login', 'global'))
  from generate_series(1, 60)), 'global login attempts 1 through 60 allowed');
select ok(not pg_temp.phase3_test_consume_auth_rate_limit('login', 'global'), 'global login attempt 61 blocked');

select * from finish();
rollback;

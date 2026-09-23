begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(16);

select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.admin_users'::regclass), 'RLS enabled and forced');
select ok(not has_table_privilege('anon', 'public.admin_users', 'SELECT'), 'anonymous has no select grant');
select ok(not has_table_privilege('authenticated', 'public.admin_users', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'), 'authenticated has no write grants');

-- Fixtures only inside a rolled-back disposable database test; no real account provisioning.
insert into auth.users (id) values
 ('00000000-0000-4000-8000-000000000001'),
 ('00000000-0000-4000-8000-000000000002'),
 ('00000000-0000-4000-8000-000000000003');
insert into public.admin_users (user_id, active) values
 ('00000000-0000-4000-8000-000000000001', true),
 ('00000000-0000-4000-8000-000000000002', false);

select throws_ok($$insert into public.admin_users(user_id) values ('00000000-0000-4000-8000-000000000099')$$, '23503', null, 'FK rejects missing auth user');
select throws_ok($$insert into public.admin_users(user_id) values ('00000000-0000-4000-8000-000000000001')$$, '23505', null, 'PK rejects duplicates');
select throws_ok($$update public.admin_users set active = true where user_id = '00000000-0000-4000-8000-000000000002'$$, '23505', null, 'only one active admin');
select throws_ok($$insert into public.admin_users(user_id, active) values ('00000000-0000-4000-8000-000000000003', null)$$, '23502', null, 'active cannot be null');

set local role anon;
select throws_ok('select * from public.admin_users', '42501', null, 'anonymous read denied');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);
select is((select count(*) from public.admin_users), 0::bigint, 'non-admin sees no rows');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
select is((select count(*) from public.admin_users), 0::bigint, 'inactive admin sees no rows');
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
select is((select count(*) from public.admin_users), 1::bigint, 'active admin sees own row only');
select throws_ok($$insert into public.admin_users(user_id) values ('00000000-0000-4000-8000-000000000003')$$, '42501', null, 'self-promotion denied');
select throws_ok('update public.admin_users set active = false', '42501', null, 'admin cannot update through API');
select throws_ok('delete from public.admin_users', '42501', null, 'admin cannot delete through API');
reset role;
set local role service_role;
select is((select count(*) from public.admin_users), 2::bigint, 'controlled privileged access sees rows');
reset role;
delete from auth.users where id = '00000000-0000-4000-8000-000000000002';
select is((select count(*) from public.admin_users), 1::bigint, 'auth deletion cascades');

select * from finish();
rollback;

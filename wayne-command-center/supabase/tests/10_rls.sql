-- RLS & integrity tests. Each failed expectation raises an exception (psql -v ON_ERROR_STOP=1).
\set alice '11111111-1111-1111-1111-111111111111'
\set bob   '22222222-2222-2222-2222-222222222222'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'alice', 'alice@example.test', '{"full_name":"Alice"}'),
  (:'bob',   'bob@example.test',   '{}');

do $$ begin
  assert (select count(*) from public.profiles) = 2, 'profiles created by trigger';
  assert (select full_name from public.profiles where id = '11111111-1111-1111-1111-111111111111') = 'Alice', 'full_name copied';
end $$;

-- ── Alice creates data ──
set role authenticated;
set request.jwt.claim.sub = :'alice';

insert into public.departments (name) values ('Wayne Enterprises');
insert into public.projects (name, department_id, status)
  select 'Project Alpha', id, 'active' from public.departments;
insert into public.tasks (title, project_id, status)
  select 'Alpha task', id, 'done' from public.projects;
insert into public.decisions (title) values ('Use Supabase');
insert into public.milestones (title, project_id) select 'Alpha M1', id from public.projects;
insert into public.agents (name, skill_command) values ('Research', '/research');
insert into public.research_entries (title) values ('Market scan');
insert into public.weekly_reports (week_start) values ('2026-11-09');

do $$ begin
  assert (select count(*) from public.projects) = 1, 'alice sees her project';
  assert (select completed_at is not null from public.tasks limit 1), 'completed_at set on done';
  assert (select owner_id from public.tasks limit 1) = auth.uid(), 'owner defaults to auth.uid()';
end $$;

-- A5: completed_at is derived from status only and cannot be forged
reset role;
set session_replication_role = replica;  -- bypass triggers to simulate an older completion timestamp
update public.tasks set completed_at = '2000-01-01T00:00:00Z';
set session_replication_role = origin;
set role authenticated;
set request.jwt.claim.sub = :'alice';
update public.tasks set title = 'Alpha task (renamed)';
do $$ begin
  assert (select completed_at = '2000-01-01T00:00:00Z' from public.tasks limit 1), 'completed_at kept while status stays done';
end $$;
update public.tasks set completed_at = '1999-01-01T00:00:00Z';
do $$ begin
  assert (select completed_at = '2000-01-01T00:00:00Z' from public.tasks limit 1), 'completed_at not writable while done';
end $$;
update public.tasks set title = 'Alpha task';

update public.tasks set status = 'todo';
do $$ begin
  assert (select completed_at is null from public.tasks limit 1), 'completed_at cleared when reopened';
end $$;
update public.tasks set completed_at = now();
do $$ begin
  assert (select completed_at is null from public.tasks limit 1), 'completed_at not writable while open';
end $$;
insert into public.tasks (title, status, completed_at) values ('Forged', 'todo', now());
do $$ begin
  assert (select completed_at is null from public.tasks where title = 'Forged'), 'completed_at not settable on insert of open task';
end $$;
insert into public.tasks (title, status, completed_at) values ('Forged done', 'done', '2000-01-01T00:00:00Z');
do $$ begin
  assert (select completed_at > now() - interval '1 minute' from public.tasks where title = 'Forged done'),
    'completed_at derived from now() on insert of done task';
end $$;
delete from public.tasks where title in ('Forged', 'Forged done');

-- ── Bob cannot see or touch Alice's data ──
set request.jwt.claim.sub = :'bob';
do $$ begin
  assert (select count(*) from public.projects) = 0, 'bob sees no projects';
  assert (select count(*) from public.tasks) = 0, 'bob sees no tasks';
  assert (select count(*) from public.profiles) = 1, 'bob sees only own profile';
  assert (select count(*) from public.milestones) = 0, 'bob sees no milestones';
  assert (select count(*) from public.agents) = 0, 'bob sees no agents';
  assert (select count(*) from public.research_entries) = 0, 'bob sees no research entries';
  assert (select count(*) from public.weekly_reports) = 0, 'bob sees no weekly reports';
  assert (select count(*) from public.decisions) = 0, 'bob sees no decisions';
end $$;

update public.tasks set title = 'hacked';
delete from public.decisions;

-- Bob cannot insert rows owned by Alice
do $$ begin
  begin
    insert into public.decisions (owner_id, title) values ('11111111-1111-1111-1111-111111111111', 'spoof');
    raise exception 'spoofed owner insert succeeded';
  exception when insufficient_privilege then null;  -- RLS violation
  end;
end $$;

-- Bob cannot hand his own rows over to Alice (owner reassignment via UPDATE)
insert into public.decisions (title) values ('Bob decision');
do $$ begin
  begin
    update public.decisions set owner_id = '11111111-1111-1111-1111-111111111111' where title = 'Bob decision';
    raise exception 'owner reassignment succeeded';
  exception when insufficient_privilege then null;  -- RLS with check violation
  end;
  assert (select owner_id from public.decisions where title = 'Bob decision') = auth.uid(), 'bob still owns his decision';
end $$;
delete from public.decisions where title = 'Bob decision';

-- A4: only known time zones are accepted
update public.profiles set timezone = 'America/New_York' where id = auth.uid();
do $$ begin
  begin
    update public.profiles set timezone = 'Mars/Olympus' where id = auth.uid();
    raise exception 'invalid time zone accepted';
  exception when check_violation then null;
  end;
  assert (select timezone from public.profiles where id = auth.uid()) = 'America/New_York', 'valid time zone stored';
end $$;
update public.profiles set timezone = 'Europe/Berlin' where id = auth.uid();

-- Bob cannot attach his task to Alice's project (composite FK)
reset role;
create temp table alice_project as select id from public.projects;
grant select on alice_project to authenticated;
set role authenticated;
set request.jwt.claim.sub = :'bob';
do $$ begin
  begin
    insert into public.tasks (title, project_id) select 'sneaky', id from alice_project;
    raise exception 'cross-owner FK insert succeeded';
  exception when foreign_key_violation then null;
  end;
end $$;

-- Bob cannot change protected profile columns of others, and can only update own allowed columns
update public.profiles set full_name = 'Bob' where id = auth.uid();
do $$ begin
  begin
    update public.profiles set id = gen_random_uuid() where id = auth.uid();
    raise exception 'profile id update succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Validation constraints
do $$ begin
  begin
    insert into public.research_entries (title, source_url) values ('x', 'javascript:alert(1)');
    raise exception 'invalid URL accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.agents (name, skill_command) values ('x', 'rm -rf');
    raise exception 'invalid skill command accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.weekly_reports (week_start) values ('2026-11-11'); -- Wednesday
    raise exception 'non-monday week accepted';
  exception when check_violation then null;
  end;
end $$;

-- A3: trigger functions are not executable by API roles …
reset role;
do $$
declare
  r text;
  f text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    foreach f in array array['public.handle_new_user()', 'public.set_updated_at()',
                             'public.sync_task_completed_at()', 'public.validate_profile_timezone()'] loop
      assert not has_function_privilege(r, f, 'execute'), format('%s can execute %s', r, f);
    end loop;
  end loop;
end $$;

-- … yet the triggers still fire for those roles.
grant insert on auth.users to authenticated;
set role authenticated;
set request.jwt.claim.sub = :'bob';
insert into auth.users (id, email, raw_user_meta_data)
  values ('33333333-3333-3333-3333-333333333333', 'carol@example.test', '{"full_name":"Carol"}');
reset role;
revoke insert on auth.users from authenticated;
do $$ begin
  assert (select full_name from public.profiles where id = '33333333-3333-3333-3333-333333333333') = 'Carol',
    'handle_new_user fires without EXECUTE';
end $$;
delete from auth.users where id = '33333333-3333-3333-3333-333333333333';

set role authenticated;
set request.jwt.claim.sub = :'alice';
insert into public.tasks (title) values ('Trigger check');
update public.tasks set updated_at = '2000-01-01T00:00:00Z', status = 'done' where title = 'Trigger check';
do $$ begin
  assert (select updated_at > '2000-01-01T00:00:00Z' from public.tasks where title = 'Trigger check'), 'set_updated_at fires without EXECUTE';
  assert (select completed_at is not null from public.tasks where title = 'Trigger check'), 'sync_task_completed_at fires without EXECUTE';
end $$;
delete from public.tasks where title = 'Trigger check';
update public.profiles set full_name = 'Alice' where id = auth.uid();  -- profile timezone trigger untouched on name-only update
reset role;

-- A7: profiles keep RLS enabled for clients (FORCE deliberately not used, see hardening migration)
do $$ begin
  assert (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles RLS enabled';
end $$;

-- Anonymous role has no access at all
reset role;
set role anon;
do $$ begin
  begin
    perform 1 from public.tasks;
    raise exception 'anon could read tasks';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Alice's data is intact
reset role;
do $$ begin
  assert (select title from public.tasks) = 'Alpha task', 'alice task untouched';
  assert (select count(*) from public.decisions) = 1, 'alice decision untouched';
  assert (select full_name from public.profiles where id = '22222222-2222-2222-2222-222222222222') = 'Bob', 'bob updated own name';
end $$;

-- Department deletion detaches project without deleting it
set role authenticated;
set request.jwt.claim.sub = :'alice';
delete from public.departments;
do $$ begin
  assert (select department_id is null from public.projects), 'project detached from deleted department';
  assert (select owner_id from public.projects) = auth.uid(), 'owner kept on set null';
end $$;

\echo 'ALL RLS TESTS PASSED'

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
-- M-1: the API role cannot even name completed_at in a write (column privileges) …
do $$ begin
  begin
    update public.tasks set completed_at = '1999-01-01T00:00:00Z';
    raise exception 'completed_at update accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.tasks (title, status, completed_at) values ('Forged', 'todo', now());
    raise exception 'completed_at insert accepted';
  exception when insufficient_privilege then null;
  end;
end $$;
-- … and the A5 trigger still ignores it for any role that can (checked as table owner).
reset role;
update public.tasks set completed_at = '1999-01-01T00:00:00Z';
do $$ begin
  assert (select completed_at = '2000-01-01T00:00:00Z' from public.tasks limit 1), 'completed_at not writable while done';
end $$;
set role authenticated;
set request.jwt.claim.sub = :'alice';
update public.tasks set title = 'Alpha task';

update public.tasks set status = 'todo';
do $$ begin
  assert (select completed_at is null from public.tasks limit 1), 'completed_at cleared when reopened';
end $$;
reset role;
update public.tasks set completed_at = now();
do $$ begin
  assert (select completed_at is null from public.tasks limit 1), 'completed_at not writable while open';
end $$;
insert into public.tasks (owner_id, title, status, completed_at) values ('11111111-1111-1111-1111-111111111111', 'Forged', 'todo', now());
do $$ begin
  assert (select completed_at is null from public.tasks where title = 'Forged'), 'completed_at not settable on insert of open task';
end $$;
insert into public.tasks (owner_id, title, status, completed_at) values ('11111111-1111-1111-1111-111111111111', 'Forged done', 'done', '2000-01-01T00:00:00Z');
do $$ begin
  assert (select completed_at > now() - interval '1 minute' from public.tasks where title = 'Forged done'),
    'completed_at derived from now() on insert of done task';
end $$;
delete from public.tasks where title in ('Forged', 'Forged done');
set role authenticated;
set request.jwt.claim.sub = :'alice';

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
-- updated_at is not client-writable (M-1): backdate it as owner without triggers, then update as the API role.
reset role;
set session_replication_role = replica;
update public.tasks set updated_at = '2000-01-01T00:00:00Z' where title = 'Trigger check';
set session_replication_role = origin;
set role authenticated;
set request.jwt.claim.sub = :'alice';
update public.tasks set status = 'done' where title = 'Trigger check';
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

-- ── M-1: least-privilege table grants ──
reset role;
do $$
declare
  r text;
  t text;
  p text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    foreach t in array array['profiles','departments','projects','milestones','tasks',
                             'research_entries','decisions','agents','weekly_reports'] loop
      foreach p in array array['TRUNCATE', 'REFERENCES', 'TRIGGER'] loop
        assert not has_table_privilege(r, 'public.' || t, p), format('%s has %s on %s', r, p, t);
      end loop;
      assert not has_any_column_privilege('anon', 'public.' || t, 'SELECT, INSERT, UPDATE'), format('anon has privileges on %s', t);
      assert has_table_privilege('authenticated', 'public.' || t, 'SELECT'), format('authenticated cannot read %s', t);
      foreach p in array array['id', 'created_at', 'updated_at'] loop
        assert not has_column_privilege('authenticated', 'public.' || t, p, 'INSERT'), format('%s.%s insertable', t, p);
        assert not has_column_privilege('authenticated', 'public.' || t, p, 'UPDATE'), format('%s.%s updatable', t, p);
      end loop;
      if t <> 'profiles' then
        assert not has_column_privilege('authenticated', 'public.' || t, 'owner_id', 'INSERT'), format('%s.owner_id insertable', t);
        assert not has_column_privilege('authenticated', 'public.' || t, 'owner_id', 'UPDATE'), format('%s.owner_id updatable', t);
        assert has_table_privilege('authenticated', 'public.' || t, 'DELETE'), format('authenticated cannot delete from %s', t);
      end if;
    end loop;
  end loop;
  assert not has_table_privilege('authenticated', 'public.profiles', 'INSERT'), 'profiles insertable';
  assert not has_table_privilege('authenticated', 'public.profiles', 'DELETE'), 'profiles deletable';
  assert not has_column_privilege('authenticated', 'public.tasks', 'completed_at', 'UPDATE'), 'tasks.completed_at updatable';
end $$;

-- Tables created later no longer inherit TRUNCATE/REFERENCES/TRIGGER through default privileges.
create table public._privilege_probe (id int);
do $$ begin
  assert not has_table_privilege('authenticated', 'public._privilege_probe', 'TRUNCATE'), 'default TRUNCATE';
  assert not has_table_privilege('authenticated', 'public._privilege_probe', 'REFERENCES'), 'default REFERENCES';
  assert not has_table_privilege('authenticated', 'public._privilege_probe', 'TRIGGER'), 'default TRIGGER';
  assert not has_table_privilege('anon', 'public._privilege_probe', 'TRUNCATE'), 'default TRUNCATE (anon)';
end $$;
drop table public._privilege_probe;

-- TRUNCATE would bypass RLS: Bob must not be able to wipe Alice's rows.
set role authenticated;
set request.jwt.claim.sub = :'bob';
do $$ begin
  begin
    truncate public.tasks;
    raise exception 'truncate succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
do $$ begin
  assert (select count(*) from public.tasks where owner_id = '11111111-1111-1111-1111-111111111111') = 1, 'alice tasks survive truncate attempt';
end $$;

-- Protected columns cannot be written, not even with one's own values.
set role authenticated;
set request.jwt.claim.sub = :'alice';
do $$ begin
  begin
    insert into public.tasks (owner_id, title) values ('11111111-1111-1111-1111-111111111111', 'explicit owner');
    raise exception 'insert with explicit owner_id succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.decisions (title, created_at) values ('backdated', '2000-01-01');
    raise exception 'insert with explicit created_at succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.projects (id, name) values (gen_random_uuid(), 'explicit id');
    raise exception 'insert with explicit id succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.projects set updated_at = '2000-01-01';
    raise exception 'updated_at update succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.profiles (id) values ('11111111-1111-1111-1111-111111111111');
    raise exception 'profile insert succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;

-- The app's own write paths (saveEntity/patchEntity/deleteEntity, reports, profile) keep working,
-- including PostgREST-style RETURNING id.
do $$
declare
  dep uuid;
  proj uuid;
  rid uuid;
begin
  insert into public.departments (name, lead, description) values ('Ops', 'Lucius', 'x') returning id into dep;
  update public.departments set name = 'Operations', lead = null, description = 'y' where id = dep returning id into rid;
  assert rid = dep, 'department update';
  insert into public.projects (name, department_id, status, priority, progress, start_date, due_date, description)
    values ('Beta', dep, 'planned', 'high', 10, '2026-11-01', '2026-12-01', 'b') returning id into proj;
  update public.projects set progress = 50, status = 'active', department_id = null where id = proj;
  insert into public.milestones (project_id, title, due_date) values (proj, 'Beta M1', '2026-11-20');
  update public.milestones set title = 'Beta M1 (renamed)', due_date = null, project_id = proj where project_id = proj;
  insert into public.tasks (title, project_id, status, priority, due_date, description) values ('Beta task', proj, 'todo', 'low', '2026-11-30', 'd');
  update public.tasks set status = 'in_progress', title = 'Beta task 2', project_id = null where title = 'Beta task';
  insert into public.research_entries (title, project_id, source_url, tags, status, confidence, summary)
    values ('Beta research', proj, 'https://example.test', array['ki', repeat('t', 40)], 'draft', 'high', 's');
  update public.research_entries set tags = array['a'], status = 'verified' where title = 'Beta research';
  insert into public.decisions (title, project_id, status, decided_at, context, decision, alternatives, rationale)
    values ('Beta decision', proj, 'accepted', '2026-11-10', 'c', 'd', 'a', 'r');
  update public.decisions set rationale = 'r2' where title = 'Beta decision';
  insert into public.agents (name, role, skill_command, department_id, status, description) values ('Beta agent', 'r', '/beta', dep, 'active', 'd');
  update public.agents set status = 'paused', skill_command = null where name = 'Beta agent';
  insert into public.weekly_reports (week_start, metrics) values ('2026-11-02', '{"tasks_completed": 3, "completed_task_titles": ["a"]}');
  update public.weekly_reports set metrics = '{"tasks_completed": 4}', summary = 's', wins = 'w', blockers = 'b', next_steps = 'n' where week_start = '2026-11-02';
  update public.profiles set full_name = 'Alice', timezone = 'Europe/Berlin' where id = auth.uid();
  delete from public.weekly_reports where week_start = '2026-11-02';
  delete from public.agents where name = 'Beta agent';
  delete from public.decisions where title = 'Beta decision';
  delete from public.research_entries where title = 'Beta research';
  delete from public.tasks where title = 'Beta task 2';
  delete from public.milestones where project_id = proj;
  delete from public.projects where id = proj;
  delete from public.departments where id = dep;
end $$;

-- ── M-2: database-side limits ──
-- N-1: the app's worst case (25 completed task titles × 200 characters of 4-byte UTF-8, ~20 KB) must fit.
do $$
declare worst jsonb;
begin
  select jsonb_build_object('tasks_completed', 25, 'completed_task_titles', jsonb_agg(repeat('😀', 200)))
    into worst from generate_series(1, 25);
  assert pg_column_size(worst) > 16384, 'worst case exceeds the former 16 KB limit';
  insert into public.weekly_reports (week_start, metrics) values ('2026-10-19', worst);
  assert (select jsonb_array_length(metrics -> 'completed_task_titles') from public.weekly_reports where week_start = '2026-10-19') = 25,
    'worst-case weekly report metrics stored';
  delete from public.weekly_reports where week_start = '2026-10-19';
end $$;

do $$ begin
  begin
    insert into public.weekly_reports (week_start, metrics)
      select '2026-10-26', jsonb_object_agg(i::text, md5(i::text)) from generate_series(1, 120000) as i;  -- ~5 MB
    raise exception 'oversized metrics accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.weekly_reports (week_start, metrics) values ('2026-10-26', '[1, 2]');
    raise exception 'non-object metrics accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.research_entries (title, tags) values ('long tag', array[repeat('x', 41)]);
    raise exception '41-character tag accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.research_entries (title, tags) values ('empty tag', array['ok', '']);
    raise exception 'empty tag accepted';
  exception when check_violation then null;
  end;
  begin
    update public.research_entries set tags = array[repeat('x', 41)] where title = 'Market scan';
    raise exception '41-character tag accepted on update';
  exception when check_violation then null;
  end;
end $$;

-- milestones.completed_at is decided by the server (toggleMilestone sends "now" or null).
do $$
declare
  first_done timestamptz;
begin
  update public.milestones set completed_at = '1999-01-01' where title = 'Alpha M1';
  select completed_at into first_done from public.milestones where title = 'Alpha M1';
  assert first_done > now() - interval '1 minute', 'milestone completion uses now(), not the client time';
  update public.milestones set completed_at = '2000-01-01' where title = 'Alpha M1';
  assert (select completed_at from public.milestones where title = 'Alpha M1') = first_done, 'reached milestone keeps its timestamp';
  update public.milestones set completed_at = null where title = 'Alpha M1';
  assert (select completed_at is null from public.milestones where title = 'Alpha M1'), 'reopening clears completed_at';
  insert into public.milestones (project_id, title, completed_at) select id, 'Forged M', '1999-01-01' from public.projects where name = 'Project Alpha';
  assert (select completed_at > now() - interval '1 minute' from public.milestones where title = 'Forged M'), 'completed_at on insert uses now()';
  delete from public.milestones where title = 'Forged M';
end $$;
reset role;

-- New functions: the trigger is not callable via RPC; the CHECK helper only by authenticated (needed for writes).
do $$ begin
  assert not has_function_privilege('anon', 'public.sync_milestone_completed_at()', 'execute'), 'anon can execute milestone trigger';
  assert not has_function_privilege('authenticated', 'public.sync_milestone_completed_at()', 'execute'), 'authenticated can execute milestone trigger';
  assert not has_function_privilege('anon', 'public.research_tags_valid(text[])', 'execute'), 'anon can execute tag check';
  assert (select provolatile = 'i' from pg_proc where oid = 'public.research_tags_valid(text[])'::regprocedure), 'tag check immutable';
end $$;

\echo 'ALL RLS TESTS PASSED'

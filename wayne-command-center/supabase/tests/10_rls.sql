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

do $$ begin
  assert (select count(*) from public.projects) = 1, 'alice sees her project';
  assert (select completed_at is not null from public.tasks limit 1), 'completed_at set on done';
  assert (select owner_id from public.tasks limit 1) = auth.uid(), 'owner defaults to auth.uid()';
end $$;

update public.tasks set status = 'todo';
do $$ begin
  assert (select completed_at is null from public.tasks limit 1), 'completed_at cleared when reopened';
end $$;

-- ── Bob cannot see or touch Alice's data ──
set request.jwt.claim.sub = :'bob';
do $$ begin
  assert (select count(*) from public.projects) = 0, 'bob sees no projects';
  assert (select count(*) from public.tasks) = 0, 'bob sees no tasks';
  assert (select count(*) from public.profiles) = 1, 'bob sees only own profile';
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

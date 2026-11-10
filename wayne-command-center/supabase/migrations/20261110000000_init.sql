-- Wayne Command Center — initial schema
-- Every table is owner-scoped and protected by Row Level Security.
-- Composite foreign keys (fk_id, owner_id) prevent references to other users' rows.

create extension if not exists pgcrypto;

-- ─── helpers ───────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─── profiles ──────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 120),
  timezone    text not null default 'Europe/Berlin' check (char_length(timezone) between 1 and 64),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── departments ───────────────────────────────────────────────────────────
create table public.departments (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 120),
  description  text check (char_length(description) <= 2000),
  lead         text check (char_length(lead) <= 120),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, owner_id),
  unique (owner_id, name)
);

-- ─── projects ──────────────────────────────────────────────────────────────
create table public.projects (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  department_id  uuid,
  name           text not null check (char_length(name) between 1 and 160),
  description    text check (char_length(description) <= 4000),
  status         text not null default 'planned'
                 check (status in ('planned', 'active', 'on_hold', 'completed', 'archived')),
  priority       text not null default 'medium'
                 check (priority in ('low', 'medium', 'high', 'critical')),
  progress       smallint not null default 0 check (progress between 0 and 100),
  start_date     date,
  due_date       date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (id, owner_id),
  check (due_date is null or start_date is null or due_date >= start_date),
  foreign key (department_id, owner_id)
    references public.departments (id, owner_id) on delete set null (department_id)
);

-- ─── milestones ────────────────────────────────────────────────────────────
create table public.milestones (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id    uuid not null,
  title         text not null check (char_length(title) between 1 and 160),
  due_date      date,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  foreign key (project_id, owner_id)
    references public.projects (id, owner_id) on delete cascade
);

-- ─── tasks ─────────────────────────────────────────────────────────────────
create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id    uuid,
  title         text not null check (char_length(title) between 1 and 200),
  description   text check (char_length(description) <= 4000),
  status        text not null default 'todo'
                check (status in ('todo', 'in_progress', 'blocked', 'done')),
  priority      text not null default 'medium'
                check (priority in ('low', 'medium', 'high', 'critical')),
  due_date      date,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  foreign key (project_id, owner_id)
    references public.projects (id, owner_id) on delete set null (project_id)
);

create or replace function public.sync_task_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'done' and (tg_op = 'INSERT' or old.status is distinct from 'done') then
    new.completed_at := now();
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger tasks_completed_at
  before insert or update of status on public.tasks
  for each row execute function public.sync_task_completed_at();

-- ─── research ──────────────────────────────────────────────────────────────
create table public.research_entries (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id  uuid,
  title       text not null check (char_length(title) between 1 and 200),
  summary     text check (char_length(summary) <= 8000),
  source_url  text check (source_url is null or (char_length(source_url) <= 2048 and source_url ~* '^https?://')),
  tags        text[] not null default '{}' check (cardinality(tags) <= 20),
  status      text not null default 'draft' check (status in ('draft', 'in_review', 'verified')),
  confidence  text not null default 'medium' check (confidence in ('low', 'medium', 'high')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  foreign key (project_id, owner_id)
    references public.projects (id, owner_id) on delete set null (project_id)
);

-- ─── decisions ─────────────────────────────────────────────────────────────
create table public.decisions (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id    uuid,
  title         text not null check (char_length(title) between 1 and 200),
  context       text check (char_length(context) <= 8000),
  decision      text check (char_length(decision) <= 8000),
  alternatives  text check (char_length(alternatives) <= 8000),
  rationale     text check (char_length(rationale) <= 8000),
  status        text not null default 'proposed'
                check (status in ('proposed', 'accepted', 'rejected', 'superseded')),
  decided_at    date not null default current_date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  foreign key (project_id, owner_id)
    references public.projects (id, owner_id) on delete set null (project_id)
);

-- ─── agents ────────────────────────────────────────────────────────────────
create table public.agents (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  department_id  uuid,
  name           text not null check (char_length(name) between 1 and 120),
  role           text check (char_length(role) <= 160),
  skill_command  text check (skill_command is null or skill_command ~ '^/[a-z0-9][a-z0-9-]{0,63}$'),
  description    text check (char_length(description) <= 4000),
  status         text not null default 'active' check (status in ('active', 'paused', 'retired')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (owner_id, name),
  foreign key (department_id, owner_id)
    references public.departments (id, owner_id) on delete set null (department_id)
);

-- ─── weekly reports ────────────────────────────────────────────────────────
create table public.weekly_reports (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start  date not null check (extract(isodow from week_start) = 1),
  summary     text check (char_length(summary) <= 8000),
  wins        text check (char_length(wins) <= 8000),
  blockers    text check (char_length(blockers) <= 8000),
  next_steps  text check (char_length(next_steps) <= 8000),
  metrics     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (owner_id, week_start)
);

-- ─── indexes ───────────────────────────────────────────────────────────────
create index projects_owner_status_idx   on public.projects (owner_id, status);
create index projects_department_idx     on public.projects (department_id);
create index milestones_project_idx      on public.milestones (project_id);
create index tasks_owner_status_idx      on public.tasks (owner_id, status);
create index tasks_owner_due_idx         on public.tasks (owner_id, due_date);
create index tasks_project_idx           on public.tasks (project_id);
create index tasks_owner_completed_idx   on public.tasks (owner_id, completed_at);
create index research_owner_idx          on public.research_entries (owner_id, created_at desc);
create index research_tags_idx           on public.research_entries using gin (tags);
create index research_project_idx        on public.research_entries (project_id);
create index decisions_owner_date_idx    on public.decisions (owner_id, decided_at desc);
create index decisions_project_idx       on public.decisions (project_id);
create index agents_department_idx       on public.agents (department_id);

-- ─── updated_at triggers ───────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['profiles','departments','projects','milestones','tasks',
                           'research_entries','decisions','agents','weekly_reports']
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_updated_at', t);
  end loop;
end;
$$;

-- ─── row level security ────────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "profiles: read own"   on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

do $$
declare t text;
begin
  foreach t in array array['departments','projects','milestones','tasks',
                           'research_entries','decisions','agents','weekly_reports']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format(
      'create policy "%s: select own" on public.%I for select to authenticated using ((select auth.uid()) = owner_id)', t, t);
    execute format(
      'create policy "%s: insert own" on public.%I for insert to authenticated with check ((select auth.uid()) = owner_id)', t, t);
    execute format(
      'create policy "%s: update own" on public.%I for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id)', t, t);
    execute format(
      'create policy "%s: delete own" on public.%I for delete to authenticated using ((select auth.uid()) = owner_id)', t, t);
  end loop;
end;
$$;

-- Anonymous visitors get nothing; authenticated users only what RLS allows.
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on
  public.departments, public.projects, public.milestones, public.tasks,
  public.research_entries, public.decisions, public.agents, public.weekly_reports
  to authenticated;
revoke insert, update, delete, truncate on public.profiles from authenticated;
grant select, update (full_name, timezone) on public.profiles to authenticated;

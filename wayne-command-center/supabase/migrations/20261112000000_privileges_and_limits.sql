-- Wayne Command Center — least-privilege table grants and database-side limits
-- (follow-up to 20261110000000_init.sql and 20261111000000_security_hardening.sql)

-- ─── M-1: least-privilege table grants ───────────────────────────────────────
-- Supabase's default privileges give anon/authenticated ALL on new tables, including TRUNCATE
-- (bypasses RLS), REFERENCES and TRIGGER. Start from nothing and grant only what the app uses.
-- INSERT/UPDATE are column-level: id, owner_id, created_at and updated_at are never client-writable
-- (owner_id defaults to auth.uid(); timestamps come from defaults/triggers). tasks.completed_at is
-- derived from status by a trigger and is therefore not writable either.
revoke all on all tables in schema public from anon, authenticated;

grant select on
  public.profiles, public.departments, public.projects, public.milestones, public.tasks,
  public.research_entries, public.decisions, public.agents, public.weekly_reports
  to authenticated;

grant delete on
  public.departments, public.projects, public.milestones, public.tasks,
  public.research_entries, public.decisions, public.agents, public.weekly_reports
  to authenticated;

grant insert (name, description, lead),
      update (name, description, lead)
  on public.departments to authenticated;

grant insert (department_id, name, description, status, priority, progress, start_date, due_date),
      update (department_id, name, description, status, priority, progress, start_date, due_date)
  on public.projects to authenticated;

-- completed_at stays writable (toggleMilestone), but the trigger below decides the actual timestamp.
grant insert (project_id, title, due_date, completed_at),
      update (project_id, title, due_date, completed_at)
  on public.milestones to authenticated;

grant insert (project_id, title, description, status, priority, due_date),
      update (project_id, title, description, status, priority, due_date)
  on public.tasks to authenticated;

grant insert (project_id, title, summary, source_url, tags, status, confidence),
      update (project_id, title, summary, source_url, tags, status, confidence)
  on public.research_entries to authenticated;

grant insert (project_id, title, context, decision, alternatives, rationale, status, decided_at),
      update (project_id, title, context, decision, alternatives, rationale, status, decided_at)
  on public.decisions to authenticated;

grant insert (department_id, name, role, skill_command, description, status),
      update (department_id, name, role, skill_command, description, status)
  on public.agents to authenticated;

grant insert (week_start, summary, wins, blockers, next_steps, metrics),
      update (week_start, summary, wins, blockers, next_steps, metrics)
  on public.weekly_reports to authenticated;

-- profiles rows are created by handle_new_user(); clients may only edit these two columns.
grant update (full_name, timezone) on public.profiles to authenticated;

-- Future tables created by the migration role no longer hand out these privileges automatically.
alter default privileges in schema public revoke truncate, references, trigger on tables from anon, authenticated;

-- ─── M-2: database-side limits ───────────────────────────────────────────────
-- weekly_reports.metrics: a JSON object of bounded size. The app writes ~1–5 KB; the worst case
-- (25 task titles × 200 characters of 4-byte UTF-8) is ~20 KB, so 64 KB leaves headroom while still
-- rejecting abuse (pg_column_size measures the uncompressed value here).
alter table public.weekly_reports
  add constraint weekly_reports_metrics_object check (jsonb_typeof(metrics) = 'object'),
  add constraint weekly_reports_metrics_size check (pg_column_size(metrics) <= 65536);

-- research_entries.tags: every tag 1–40 characters (array length is already limited to 20).
create or replace function public.research_tags_valid(tags text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(bool_and(t is not null and char_length(t) between 1 and 40), true)
  from pg_catalog.unnest(tags) as t
$$;

alter table public.research_entries
  add constraint research_entries_tags_length check (public.research_tags_valid(tags));

-- milestones.completed_at is decided by the server: setting it marks the milestone as reached *now*;
-- a client-supplied timestamp is ignored, and an already reached milestone keeps its timestamp.
create or replace function public.sync_milestone_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.completed_at is null then
    return new;
  end if;
  if tg_op = 'INSERT' or old.completed_at is null then
    new.completed_at := now();
  else
    new.completed_at := old.completed_at;
  end if;
  return new;
end;
$$;

create trigger milestones_completed_at
  before insert or update on public.milestones
  for each row execute function public.sync_milestone_completed_at();

-- Trigger functions do not need EXECUTE for the acting role, so the trigger is not callable via RPC.
revoke execute on function public.sync_milestone_completed_at() from public, anon, authenticated;
-- A CHECK constraint, unlike a trigger, runs its function with the privileges of the writing role:
-- without EXECUTE every research insert/update by `authenticated` fails ("permission denied for
-- function"). The function is pure (immutable, no table access, returns only a boolean about its own
-- argument), so `authenticated` keeps EXECUTE; public and anon do not.
revoke execute on function public.research_tags_valid(text[]) from public, anon;
grant execute on function public.research_tags_valid(text[]) to authenticated;

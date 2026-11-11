-- Wayne Command Center — security hardening (follow-up to 20261110000000_init.sql)

-- ─── A4: profiles.timezone only accepts zones Postgres knows ─────────────────
-- A CHECK constraint cannot query pg_timezone_names, so a BEFORE trigger enforces it.
create or replace function public.validate_profile_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Unbekannte Zeitzone: %', new.timezone
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger profiles_validate_timezone
  before insert or update of timezone on public.profiles
  for each row execute function public.validate_profile_timezone();

-- ─── A5: tasks.completed_at is derived from status only ──────────────────────
-- Runs on every INSERT/UPDATE (not just "update of status"), so a client cannot set
-- completed_at directly. While a task stays 'done', the original timestamp is kept.
create or replace function public.sync_task_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'done' then
    if tg_op = 'INSERT' or old.status is distinct from 'done' then
      new.completed_at := now();
    else
      new.completed_at := old.completed_at;
    end if;
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_completed_at on public.tasks;
create trigger tasks_completed_at
  before insert or update on public.tasks
  for each row execute function public.sync_task_completed_at();

-- ─── A3: trigger functions are not callable via RPC ──────────────────────────
-- Triggers do not need EXECUTE for the acting role; this only blocks direct calls (e.g. /rpc).
revoke execute on function public.handle_new_user()           from public, anon, authenticated;
revoke execute on function public.set_updated_at()            from public, anon, authenticated;
revoke execute on function public.sync_task_completed_at()    from public, anon, authenticated;
revoke execute on function public.validate_profile_timezone() from public, anon, authenticated;

-- ─── A7 (deliberately not applied) ───────────────────────────────────────────
-- profiles keeps ENABLE (not FORCE) row level security: handle_new_user() is a SECURITY DEFINER
-- trigger owned by the table owner and inserts the profile on sign-up. FORCE could block that insert
-- on hosted Supabase, depending on the owner's BYPASSRLS attribute. Clients are still fully
-- restricted by the policies above; only the owner role is exempt.

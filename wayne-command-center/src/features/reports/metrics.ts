import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { todayInZone, weekRange } from "@/lib/dates";
import type { WeeklyMetrics } from "@/lib/types";

type CountResult = { count: number | null; error: { code?: string; message?: string } | null };

function count(r: CountResult, label: string): number {
  if (r.error) {
    console.error(`[reports] ${label}:`, r.error.code, r.error.message);
    throw new Error("Kennzahlen konnten nicht berechnet werden.");
  }
  return r.count ?? 0;
}

/** Computes weekly metrics from the user's real data (RLS-scoped client). */
export async function computeWeeklyMetrics(supabase: SupabaseClient, weekStart: string, timeZone: string): Promise<WeeklyMetrics> {
  const { weekEnd, fromUtc, toUtc } = weekRange(weekStart, timeZone);
  const today = todayInZone(timeZone);
  const head = { count: "exact" as const, head: true };

  const [completed, created, open, overdue, blocked, decisions, research, milestones, active, titles] = await Promise.all([
    supabase.from("tasks").select("id", head).gte("completed_at", fromUtc).lt("completed_at", toUtc),
    supabase.from("tasks").select("id", head).gte("created_at", fromUtc).lt("created_at", toUtc),
    supabase.from("tasks").select("id", head).neq("status", "done"),
    supabase.from("tasks").select("id", head).neq("status", "done").lt("due_date", today),
    supabase.from("tasks").select("id", head).eq("status", "blocked"),
    supabase.from("decisions").select("id", head).gte("decided_at", weekStart).lte("decided_at", weekEnd),
    supabase.from("research_entries").select("id", head).gte("created_at", fromUtc).lt("created_at", toUtc),
    supabase.from("milestones").select("id", head).gte("completed_at", fromUtc).lt("completed_at", toUtc),
    supabase.from("projects").select("id", head).eq("status", "active"),
    supabase.from("tasks").select("title").gte("completed_at", fromUtc).lt("completed_at", toUtc).order("completed_at").limit(25),
  ]);

  if (titles.error) count({ count: null, error: titles.error }, "titles");

  return {
    generated_at: new Date().toISOString(),
    week_start: weekStart,
    week_end: weekEnd,
    timezone: timeZone,
    tasks_completed: count(completed, "completed"),
    tasks_created: count(created, "created"),
    open_tasks: count(open, "open"),
    overdue_tasks: count(overdue, "overdue"),
    blocked_tasks: count(blocked, "blocked"),
    decisions_made: count(decisions, "decisions"),
    research_added: count(research, "research"),
    milestones_completed: count(milestones, "milestones"),
    active_projects: count(active, "active"),
    completed_task_titles: (titles.data ?? []).map((t: { title: string }) => t.title),
  };
}

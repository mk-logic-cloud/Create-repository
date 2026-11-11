import "server-only";
import { db } from "@/lib/auth";
import { assertQuery } from "@/lib/crud";
import { addDays } from "@/lib/dates";
import { sortTasks } from "@/features/tasks/queries";
import { PROJECT_COLUMNS } from "@/features/projects/queries";
import type { Decision, Project, Task } from "@/lib/types";

export async function getDashboard(today: string) {
  const supabase = await db();
  const head = { count: "exact" as const, head: true };
  const since30 = addDays(today, -30);

  const [open, overdue, blocked, activeProjects, decisions30, research, agents, upcoming, projects, recentDecisions] = await Promise.all([
    supabase.from("tasks").select("id", head).neq("status", "done"),
    supabase.from("tasks").select("id", head).neq("status", "done").lt("due_date", today),
    supabase.from("tasks").select("id", head).eq("status", "blocked"),
    supabase.from("projects").select("id", head).eq("status", "active"),
    supabase.from("decisions").select("id", head).gte("decided_at", since30),
    supabase.from("research_entries").select("id", head),
    supabase.from("agents").select("id", head).eq("status", "active"),
    supabase
      .from("tasks")
      .select("id, project_id, title, description, status, priority, due_date, completed_at, created_at, updated_at")
      .neq("status", "done")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(40),
    supabase.from("projects").select(PROJECT_COLUMNS).eq("status", "active").order("due_date", { ascending: true, nullsFirst: false }).limit(6),
    supabase.from("decisions").select("id, project_id, title, status, decided_at, created_at").order("decided_at", { ascending: false }).limit(5),
  ]);

  const n = (r: { count: number | null; error: unknown }, label: string) => {
    assertQuery({ data: null, error: r.error as never }, label);
    return r.count ?? 0;
  };

  return {
    kpis: {
      open: n(open, "kpi open"),
      overdue: n(overdue, "kpi overdue"),
      blocked: n(blocked, "kpi blocked"),
      activeProjects: n(activeProjects, "kpi projects"),
      decisions30: n(decisions30, "kpi decisions"),
      research: n(research, "kpi research"),
      agents: n(agents, "kpi agents"),
    },
    upcoming: sortTasks(assertQuery<Task[]>(upcoming, "upcoming")).slice(0, 7),
    projects: assertQuery<Project[]>(projects, "active projects"),
    decisions: assertQuery<Pick<Decision, "id" | "project_id" | "title" | "status" | "decided_at" | "created_at">[]>(recentDecisions, "recent decisions"),
  };
}

import "server-only";
import { db } from "@/lib/auth";
import { assertQuery } from "@/lib/crud";
import { likePattern } from "@/lib/search";
import type { Project, Task } from "@/lib/types";

export const PROJECT_COLUMNS = "id, department_id, name, description, status, priority, progress, start_date, due_date, created_at, updated_at";

export async function listProjects(opts: { includeArchived?: boolean; status?: string; department?: string; q?: string } = {}): Promise<Project[]> {
  const supabase = await db();
  let q = supabase.from("projects").select(PROJECT_COLUMNS).order("due_date", { ascending: true, nullsFirst: false }).order("name");
  if (opts.status) q = q.eq("status", opts.status);
  else if (!opts.includeArchived) q = q.neq("status", "archived");
  if (opts.department) q = q.eq("department_id", opts.department);
  if (opts.q) q = q.ilike("name", likePattern(opts.q));
  return assertQuery<Project[]>(await q, "list projects");
}

export type TaskStats = { total: number; done: number; blocked: number; overdue: number };

/** Aggregates task counts per project from the user's tasks. */
export async function getTaskStatsByProject(today: string): Promise<Map<string, TaskStats>> {
  const supabase = await db();
  const rows = assertQuery<Pick<Task, "project_id" | "status" | "due_date">[]>(
    await supabase.from("tasks").select("project_id, status, due_date").not("project_id", "is", null).limit(10000),
    "task stats",
  );
  const stats = new Map<string, TaskStats>();
  for (const r of rows) {
    if (!r.project_id) continue;
    const s = stats.get(r.project_id) ?? { total: 0, done: 0, blocked: 0, overdue: 0 };
    s.total++;
    if (r.status === "done") s.done++;
    if (r.status === "blocked") s.blocked++;
    if (r.status !== "done" && r.due_date && r.due_date < today) s.overdue++;
    stats.set(r.project_id, s);
  }
  return stats;
}

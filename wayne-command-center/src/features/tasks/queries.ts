import "server-only";
import { db } from "@/lib/auth";
import { assertQuery } from "@/lib/crud";
import { PRIORITY, TASK_STATUS, type Priority, type TaskStatus } from "@/lib/domain";
import { likePattern, pickEnum, pickString, pickUuid } from "@/lib/search";
import type { Task } from "@/lib/types";

export type TaskFilter = { status?: TaskStatus | "open"; priority?: Priority; project?: string; q?: string };

export const TASK_LIMIT = 300;

/** Parses untrusted search params into a safe filter. */
export function parseTaskFilter(sp: Record<string, string | string[] | undefined>): TaskFilter {
  return {
    status: pickEnum(sp, "status", ["open", ...TASK_STATUS.values] as const),
    priority: pickEnum(sp, "priority", PRIORITY.values),
    project: pickUuid(sp, "project"),
    q: pickString(sp, "q"),
  };
}

const PRIORITY_RANK: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const STATUS_RANK: Record<TaskStatus, number> = { blocked: 0, in_progress: 1, todo: 2, done: 3 };

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") ||
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      b.created_at.localeCompare(a.created_at),
  );
}

export async function listTasks(filter: TaskFilter): Promise<Task[]> {
  const supabase = await db();
  let query = supabase
    .from("tasks")
    .select("id, project_id, title, description, status, priority, due_date, completed_at, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(TASK_LIMIT);
  if (filter.status === "open") query = query.neq("status", "done");
  else if (filter.status) query = query.eq("status", filter.status);
  if (filter.priority) query = query.eq("priority", filter.priority);
  if (filter.project) query = query.eq("project_id", filter.project);
  if (filter.q) query = query.ilike("title", likePattern(filter.q));
  return sortTasks(assertQuery<Task[]>(await query, "list tasks"));
}

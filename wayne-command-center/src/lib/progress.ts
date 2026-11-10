import { daysBetween } from "@/lib/dates";
import type { ProjectStatus } from "@/lib/domain";

export type HealthLevel = "on_track" | "at_risk" | "off_track" | "paused" | "done";

export const HEALTH_META: Record<HealthLevel, { label: string; variant: "success" | "warning" | "danger" | "neutral" | "default" }> = {
  on_track: { label: "Im Plan", variant: "success" },
  at_risk: { label: "Gefährdet", variant: "warning" },
  off_track: { label: "Verzug", variant: "danger" },
  paused: { label: "Pausiert", variant: "neutral" },
  done: { label: "Abgeschlossen", variant: "default" },
};

type Input = {
  status: ProjectStatus;
  progress: number;
  due_date: string | null;
  tasks: { total: number; done: number; blocked: number; overdue: number };
  milestones: { due_date: string | null; completed_at: string | null }[];
};

/** Rule-based project health. Transparent reasons instead of an opaque score. */
export function projectHealth(p: Input, today: string): { level: HealthLevel; reasons: string[] } {
  if (p.status === "completed" || p.status === "archived") return { level: "done", reasons: [] };
  if (p.status === "on_hold") return { level: "paused", reasons: ["Projekt ist pausiert."] };

  const reasons: string[] = [];
  const overdueMilestones = p.milestones.filter((m) => !m.completed_at && m.due_date && m.due_date < today).length;

  if (p.due_date && p.due_date < today) {
    reasons.push(`Projekt seit ${daysBetween(p.due_date, today)} Tag(en) überfällig.`);
    return { level: "off_track", reasons };
  }
  if (p.tasks.overdue > 0) reasons.push(`${p.tasks.overdue} überfällige Aufgabe(n).`);
  if (p.tasks.blocked > 0) reasons.push(`${p.tasks.blocked} blockierte Aufgabe(n).`);
  if (overdueMilestones > 0) reasons.push(`${overdueMilestones} überfällige(r) Meilenstein(e).`);
  if (p.due_date) {
    const left = daysBetween(today, p.due_date);
    if (left <= 14 && p.progress < 70) reasons.push(`Nur noch ${left} Tag(e) bei ${p.progress} % Fortschritt.`);
  }
  return { level: reasons.length ? "at_risk" : "on_track", reasons };
}

export const completionRate = (done: number, total: number) => (total === 0 ? null : Math.round((done / total) * 100));

import type { BadgeVariant } from "@/components/ui/badge";

type Meta = { label: string; variant: BadgeVariant };
const defineEnum = <const T extends readonly string[]>(values: T, meta: Record<T[number], Meta>) => ({ values, meta });

export const PRIORITY = defineEnum(["low", "medium", "high", "critical"], {
  low: { label: "Niedrig", variant: "neutral" },
  medium: { label: "Mittel", variant: "info" },
  high: { label: "Hoch", variant: "warning" },
  critical: { label: "Kritisch", variant: "danger" },
});
export type Priority = (typeof PRIORITY.values)[number];

export const TASK_STATUS = defineEnum(["todo", "in_progress", "blocked", "done"], {
  todo: { label: "Offen", variant: "neutral" },
  in_progress: { label: "In Arbeit", variant: "info" },
  blocked: { label: "Blockiert", variant: "danger" },
  done: { label: "Erledigt", variant: "success" },
});
export type TaskStatus = (typeof TASK_STATUS.values)[number];

export const PROJECT_STATUS = defineEnum(["planned", "active", "on_hold", "completed", "archived"], {
  planned: { label: "Geplant", variant: "neutral" },
  active: { label: "Aktiv", variant: "default" },
  on_hold: { label: "Pausiert", variant: "warning" },
  completed: { label: "Abgeschlossen", variant: "success" },
  archived: { label: "Archiviert", variant: "neutral" },
});
export type ProjectStatus = (typeof PROJECT_STATUS.values)[number];

export const RESEARCH_STATUS = defineEnum(["draft", "in_review", "verified"], {
  draft: { label: "Entwurf", variant: "neutral" },
  in_review: { label: "In Prüfung", variant: "warning" },
  verified: { label: "Verifiziert", variant: "success" },
});
export type ResearchStatus = (typeof RESEARCH_STATUS.values)[number];

export const CONFIDENCE = defineEnum(["low", "medium", "high"], {
  low: { label: "Niedrig", variant: "danger" },
  medium: { label: "Mittel", variant: "warning" },
  high: { label: "Hoch", variant: "success" },
});
export type Confidence = (typeof CONFIDENCE.values)[number];

export const DECISION_STATUS = defineEnum(["proposed", "accepted", "rejected", "superseded"], {
  proposed: { label: "Vorgeschlagen", variant: "info" },
  accepted: { label: "Angenommen", variant: "success" },
  rejected: { label: "Abgelehnt", variant: "danger" },
  superseded: { label: "Ersetzt", variant: "neutral" },
});
export type DecisionStatus = (typeof DECISION_STATUS.values)[number];

export const AGENT_STATUS = defineEnum(["active", "paused", "retired"], {
  active: { label: "Aktiv", variant: "success" },
  paused: { label: "Pausiert", variant: "warning" },
  retired: { label: "Stillgelegt", variant: "neutral" },
});
export type AgentStatus = (typeof AGENT_STATUS.values)[number];

export function options<T extends string>(e: { values: readonly T[]; meta: Record<T, Meta> }) {
  return e.values.map((v) => ({ value: v, label: e.meta[v].label }));
}

import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Check, Flag, Pencil, Plus, RotateCcw } from "lucide-react";
import { ActionButton } from "@/components/entity/action-button";
import { DeleteButton } from "@/components/entity/delete-button";
import { EmptyState } from "@/components/entity/empty-state";
import { EntityFormDialog } from "@/components/entity/entity-form-dialog";
import type { FieldDef } from "@/components/entity/types";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { db, getProfile } from "@/lib/auth";
import { assertQuery } from "@/lib/crud";
import { formatDate, todayInZone } from "@/lib/dates";
import { completionRate, HEALTH_META, projectHealth, type HealthLevel } from "@/lib/progress";
import type { Milestone } from "@/lib/types";
import { cn } from "@/lib/utils";
import { deleteMilestone, saveMilestone, toggleMilestone } from "@/features/progress/actions";
import { getTaskStatsByProject, listProjects } from "@/features/projects/queries";

export const metadata: Metadata = { title: "Fortschritt" };

const milestoneFields: FieldDef[] = [
  { name: "title", label: "Meilenstein", type: "text", required: true, maxLength: 160, full: true },
  { name: "due_date", label: "Zieldatum", type: "date" },
];

const ORDER: HealthLevel[] = ["off_track", "at_risk", "on_track", "paused", "done"];

export default async function ProgressPage() {
  const profile = await getProfile();
  const today = todayInZone(profile?.timezone ?? "Europe/Berlin");
  const supabase = await db();
  const [projects, stats, milestoneRows] = await Promise.all([
    listProjects(),
    getTaskStatsByProject(today),
    supabase.from("milestones").select("id, project_id, title, due_date, completed_at").order("due_date", { ascending: true, nullsFirst: false }),
  ]);
  const milestones = assertQuery<Milestone[]>(milestoneRows, "list milestones");
  const byProject = new Map<string, Milestone[]>();
  for (const m of milestones) byProject.set(m.project_id, [...(byProject.get(m.project_id) ?? []), m]);

  const rows = projects
    .map((p) => {
      const t = stats.get(p.id) ?? { total: 0, done: 0, blocked: 0, overdue: 0 };
      const ms = byProject.get(p.id) ?? [];
      return { p, t, ms, health: projectHealth({ ...p, tasks: t, milestones: ms }, today) };
    })
    .sort((a, b) => ORDER.indexOf(a.health.level) - ORDER.indexOf(b.health.level));

  const counts = ORDER.map((level) => ({ level, n: rows.filter((r) => r.health.level === level).length })).filter((c) => c.n > 0);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Steuerung" title="Fortschrittskontrolle" description="Ampel je Projekt aus Fälligkeit, Aufgabenlage und Meilensteinen — mit nachvollziehbaren Gründen." />
      {rows.length === 0 ? (
        <EmptyState icon={BarChart3} title="Keine Projekte" description="Sobald Projekte existieren, erscheint hier ihre Fortschrittsampel." action={<Button asChild><Link href="/projects">Zu den Projekten</Link></Button>} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {counts.map((c) => <Badge key={c.level} variant={HEALTH_META[c.level].variant}>{HEALTH_META[c.level].label}: {c.n}</Badge>)}
          </div>
          <div className="space-y-4">
            {rows.map(({ p, t, ms, health }) => {
              const rate = completionRate(t.done, t.total);
              const msDone = ms.filter((m) => m.completed_at).length;
              return (
                <article key={p.id} className="glass space-y-5 rounded-2xl p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[15px] font-semibold">{p.name}</h2>
                        <Badge variant={HEALTH_META[health.level].variant}>{HEALTH_META[health.level].label}</Badge>
                      </div>
                      {health.reasons.length > 0 && (
                        <ul className="space-y-0.5 text-xs text-muted-foreground">{health.reasons.map((r) => <li key={r}>· {r}</li>)}</ul>
                      )}
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground">Fällig: <span className="text-foreground">{formatDate(p.due_date)}</span></p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Metric label="Einschätzung" value={`${p.progress} %`}><Progress value={p.progress} aria-label="Eingeschätzter Fortschritt" /></Metric>
                    <Metric label="Aufgaben erledigt" value={rate === null ? "—" : `${rate} % · ${t.done}/${t.total}`}>
                      <Progress value={rate ?? 0} aria-label="Aufgabenquote" />
                    </Metric>
                    <Metric label="Meilensteine" value={ms.length ? `${msDone}/${ms.length}` : "—"}>
                      <Progress value={ms.length ? (msDone / ms.length) * 100 : 0} aria-label="Meilensteine erreicht" />
                    </Metric>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Meilensteine</h3>
                      <EntityFormDialog
                        title={`Meilenstein für ${p.name}`}
                        action={saveMilestone}
                        fields={milestoneFields}
                        hidden={{ project_id: p.id }}
                        trigger={<Button variant="ghost" size="sm"><Plus /> Meilenstein</Button>}
                      />
                    </div>
                    {ms.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Noch keine Meilensteine definiert.</p>
                    ) : (
                      <ul className="divide-y divide-white/[0.05] rounded-xl bg-white/[0.02]">
                        {ms.map((m) => {
                          const late = !m.completed_at && m.due_date && m.due_date < today;
                          return (
                            <li key={m.id} className="flex items-center gap-2 px-3 py-2">
                              <ActionButton action={toggleMilestone} fields={{ id: m.id, complete: m.completed_at ? "0" : "1" }} label={m.completed_at ? "Wieder öffnen" : "Als erreicht markieren"} size="icon-sm">
                                {m.completed_at ? <RotateCcw /> : <Check className="opacity-50" />}
                              </ActionButton>
                              <Flag className={cn("size-3.5 shrink-0", m.completed_at ? "text-success" : late ? "text-destructive" : "text-muted-foreground")} />
                              <span className={cn("min-w-0 flex-1 truncate text-sm", m.completed_at && "text-muted-foreground line-through decoration-white/20")}>{m.title}</span>
                              <span className={cn("shrink-0 text-xs", late ? "text-destructive" : "text-muted-foreground")}>{formatDate(m.due_date, true)}</span>
                              <EntityFormDialog
                                title="Meilenstein bearbeiten"
                                action={saveMilestone}
                                fields={milestoneFields}
                                values={m}
                                hidden={{ project_id: p.id }}
                                trigger={<Button variant="ghost" size="icon-sm" aria-label={`${m.title} bearbeiten`}><Pencil /></Button>}
                              />
                              <DeleteButton id={m.id} action={deleteMilestone} label={m.title} />
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-xl bg-white/[0.025] p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-sm tabular-nums">{value}</span>
      </div>
      {children}
    </div>
  );
}

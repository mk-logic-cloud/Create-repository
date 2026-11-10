import type { Metadata } from "next";
import { CalendarRange, Pencil, RefreshCw } from "lucide-react";
import { ActionButton } from "@/components/entity/action-button";
import { DeleteButton } from "@/components/entity/delete-button";
import { EmptyState } from "@/components/entity/empty-state";
import { EntityFormDialog } from "@/components/entity/entity-form-dialog";
import type { FieldDef } from "@/components/entity/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { db, getProfile } from "@/lib/auth";
import { assertQuery } from "@/lib/crud";
import { formatDate, formatDateTime, isoWeek, todayInZone } from "@/lib/dates";
import type { WeeklyReport } from "@/lib/types";
import { deleteReport, refreshReportMetrics, saveReportNotes } from "@/features/reports/actions";
import { CreateReportForm } from "@/features/reports/create-report-form";

export const metadata: Metadata = { title: "Wochenberichte" };

const noteFields: FieldDef[] = [
  { name: "summary", label: "Zusammenfassung", type: "textarea", maxLength: 8000 },
  { name: "wins", label: "Erfolge", type: "textarea", maxLength: 8000 },
  { name: "blockers", label: "Hindernisse & Risiken", type: "textarea", maxLength: 8000 },
  { name: "next_steps", label: "Fokus nächste Woche", type: "textarea", maxLength: 8000 },
];

const METRICS: { key: keyof WeeklyReport["metrics"]; label: string }[] = [
  { key: "tasks_completed", label: "Aufgaben erledigt" },
  { key: "tasks_created", label: "Aufgaben neu" },
  { key: "decisions_made", label: "Entscheidungen" },
  { key: "research_added", label: "Research neu" },
  { key: "milestones_completed", label: "Meilensteine" },
  { key: "open_tasks", label: "Offen (Stand)" },
  { key: "overdue_tasks", label: "Überfällig (Stand)" },
  { key: "blocked_tasks", label: "Blockiert (Stand)" },
];

export default async function ReportsPage() {
  const profile = await getProfile();
  const tz = profile?.timezone ?? "Europe/Berlin";
  const supabase = await db();
  const reports = assertQuery<WeeklyReport[]>(
    await supabase.from("weekly_reports").select("id, week_start, summary, wins, blockers, next_steps, metrics, created_at, updated_at").order("week_start", { ascending: false }).limit(104),
    "list reports",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Rückblick"
        title="Wochenberichte"
        description="Kennzahlen werden beim Erstellen aus Ihren Daten berechnet und eingefroren; Ihre Einschätzung ergänzen Sie selbst."
        actions={<CreateReportForm today={todayInZone(tz)} />}
      />
      {reports.length === 0 ? (
        <EmptyState icon={CalendarRange} title="Noch keine Berichte" description="Wählen Sie oben einen Tag der gewünschten Woche und erstellen Sie den ersten Bericht." />
      ) : (
        <div className="space-y-4">
          {reports.map((r) => {
            const m = r.metrics ?? {};
            const notes = noteFields.filter((f) => r[f.name as keyof WeeklyReport]);
            return (
              <article key={r.id} className="glass space-y-5 rounded-2xl p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">KW {isoWeek(r.week_start)}</p>
                    <h2 className="text-[15px] font-semibold">{formatDate(r.week_start)} – {formatDate(m.week_end ?? null)}</h2>
                    <p className="text-xs text-muted-foreground">Kennzahlen-Stand: {formatDateTime(m.generated_at ?? null, tz)}</p>
                  </div>
                  <div className="-ml-2 flex shrink-0 items-center sm:ml-0">
                    <ActionButton action={refreshReportMetrics} fields={{ id: r.id }} label="Kennzahlen neu berechnen" size="icon-sm"><RefreshCw /></ActionButton>
                    <EntityFormDialog
                      title={`Bericht KW ${isoWeek(r.week_start)}`}
                      action={saveReportNotes}
                      fields={noteFields}
                      values={{ id: r.id, summary: r.summary, wins: r.wins, blockers: r.blockers, next_steps: r.next_steps }}
                      trigger={<Button variant="ghost" size="icon-sm" aria-label="Bericht bearbeiten"><Pencil /></Button>}
                    />
                    <DeleteButton id={r.id} action={deleteReport} label={`Bericht KW ${isoWeek(r.week_start)}`} />
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {METRICS.map(({ key, label }) => (
                    <div key={key} className="rounded-xl bg-white/[0.025] p-3">
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="mt-1 font-mono text-xl tabular-nums">{typeof m[key] === "number" ? (m[key] as number) : "—"}</dd>
                    </div>
                  ))}
                </dl>
                {m.completed_task_titles && m.completed_task_titles.length > 0 && (
                  <details className="group text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Erledigte Aufgaben ({m.completed_task_titles.length})</summary>
                    <ul className="mt-2 list-disc space-y-0.5 pl-5 text-muted-foreground marker:text-primary">
                      {m.completed_task_titles.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </details>
                )}
                {notes.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {notes.map((f) => (
                      <div key={f.name} className="space-y-1">
                        <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{f.label}</h3>
                        <p className="whitespace-pre-line text-sm">{r[f.name as keyof WeeklyReport] as string}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Noch keine Einschätzung ergänzt.</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}


import type { Metadata } from "next";
import { FolderKanban, Pencil, Plus, Scale } from "lucide-react";
import { DeleteButton } from "@/components/entity/delete-button";
import { EmptyState } from "@/components/entity/empty-state";
import { EntityFormDialog } from "@/components/entity/entity-form-dialog";
import { EnumBadge } from "@/components/entity/enum-badge";
import { FilterBar } from "@/components/entity/filter-bar";
import type { FieldDef, FieldOption } from "@/components/entity/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { db, getProfile } from "@/lib/auth";
import { assertQuery } from "@/lib/crud";
import { formatDate, todayInZone } from "@/lib/dates";
import { DECISION_STATUS, options } from "@/lib/domain";
import { likePattern, pickEnum, pickString, pickUuid } from "@/lib/search";
import type { Decision } from "@/lib/types";
import { deleteDecision, saveDecision } from "@/features/decisions/actions";
import { getProjectLookup, nameMap, toOptions } from "@/features/shared/lookups";

export const metadata: Metadata = { title: "Entscheidungen" };

const fields = (projects: FieldOption[]): FieldDef[] => [
  { name: "title", label: "Titel", type: "text", required: true, maxLength: 200, full: true },
  { name: "decided_at", label: "Datum", type: "date", required: true },
  { name: "status", label: "Status", type: "select", required: true, options: options(DECISION_STATUS) },
  { name: "project_id", label: "Projekt", type: "select", options: projects, emptyOption: "Kein Projekt", full: true },
  { name: "context", label: "Kontext — Ausgangslage", type: "textarea", maxLength: 8000 },
  { name: "decision", label: "Entscheidung", type: "textarea", maxLength: 8000 },
  { name: "alternatives", label: "Verworfene Alternativen", type: "textarea", maxLength: 8000 },
  { name: "rationale", label: "Begründung & Konsequenzen", type: "textarea", maxLength: 8000 },
];

const SECTIONS = [
  ["context", "Kontext"],
  ["decision", "Entscheidung"],
  ["alternatives", "Alternativen"],
  ["rationale", "Begründung"],
] as const;

export default async function DecisionsPage({ searchParams }: PageProps<"/decisions">) {
  const sp = await searchParams;
  const q = pickString(sp, "q");
  const status = pickEnum(sp, "status", DECISION_STATUS.values);
  const project = pickUuid(sp, "project");

  const supabase = await db();
  let query = supabase
    .from("decisions")
    .select("id, project_id, title, context, decision, alternatives, rationale, status, decided_at, created_at")
    .order("decided_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) query = query.ilike("title", likePattern(q));
  if (status) query = query.eq("status", status);
  if (project) query = query.eq("project_id", project);

  const [decisions, projects, profile] = await Promise.all([
    query.then((r) => assertQuery<Decision[]>(r, "list decisions")),
    getProjectLookup(),
    getProfile(),
  ]);
  const projectOptions = toOptions(projects);
  const projectNames = nameMap(projects);
  const f = fields(projectOptions);
  const filtered = Boolean(q || status || project);
  const today = todayInZone(profile?.timezone ?? "Europe/Berlin");

  const createButton = (
    <EntityFormDialog
      title="Entscheidung protokollieren"
      description="Halten Sie fest, was entschieden wurde — und warum."
      action={saveDecision}
      fields={f}
      values={{ status: "proposed", decided_at: today, project_id: project }}
      trigger={<Button><Plus /> Entscheidung</Button>}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Governance" title="Entscheidungsprotokoll" description="Nachvollziehbare Entscheidungen mit Kontext, Alternativen und Begründung." actions={createButton} />
      <FilterBar
        basePath="/decisions"
        q={q}
        searchLabel="Entscheidungen durchsuchen"
        selects={[
          { name: "status", label: "Status", value: status, all: "Alle Status", options: options(DECISION_STATUS) },
          { name: "project", label: "Projekt", value: project, all: "Alle Projekte", options: projectOptions },
        ]}
      />
      {decisions.length === 0 ? (
        <EmptyState
          icon={Scale}
          title={filtered ? "Keine Treffer" : "Noch keine Entscheidungen"}
          description={filtered ? "Für diese Filter gibt es keine Einträge." : "Ein gutes Protokoll verhindert, dass dieselbe Frage zweimal entschieden wird."}
          action={filtered ? undefined : createButton}
        />
      ) : (
        <ol className="relative space-y-4 border-l border-white/[0.08] pl-5 sm:pl-6">
          {decisions.map((d) => (
            <li key={d.id} className="relative">
              <span className="absolute -left-[calc(1.25rem+4.5px)] top-6 size-2 rounded-full bg-primary ring-4 ring-background sm:-left-[calc(1.5rem+4.5px)]" aria-hidden />
              <article className="glass space-y-4 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-2">
                    <p className="font-mono text-xs text-muted-foreground">{formatDate(d.decided_at)}</p>
                    <h2 className="text-[15px] font-semibold leading-snug">{d.title}</h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <EnumBadge value={d.status} meta={DECISION_STATUS.meta} />
                      {d.project_id && <span className="inline-flex items-center gap-1"><FolderKanban className="size-3" />{projectNames.get(d.project_id)}</span>}
                    </div>
                  </div>
                  <div className="-mr-2 -mt-1 flex shrink-0">
                    <EntityFormDialog
                      title="Entscheidung bearbeiten"
                      action={saveDecision}
                      fields={f}
                      values={d}
                      trigger={<Button variant="ghost" size="icon-sm" aria-label={`${d.title} bearbeiten`}><Pencil /></Button>}
                    />
                    <DeleteButton id={d.id} action={deleteDecision} label={d.title} />
                  </div>
                </div>
                {SECTIONS.some(([k]) => d[k]) && (
                  <dl className="grid gap-3 sm:grid-cols-2">
                    {SECTIONS.filter(([k]) => d[k]).map(([k, label]) => (
                      <div key={k} className="space-y-1 rounded-xl bg-white/[0.025] p-3">
                        <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
                        <dd className="whitespace-pre-line text-sm">{d[k]}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </article>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

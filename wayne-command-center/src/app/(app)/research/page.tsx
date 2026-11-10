import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FolderKanban, Library, Pencil, Plus } from "lucide-react";
import { DeleteButton } from "@/components/entity/delete-button";
import { EmptyState } from "@/components/entity/empty-state";
import { EntityFormDialog } from "@/components/entity/entity-form-dialog";
import { EnumBadge } from "@/components/entity/enum-badge";
import { FilterBar } from "@/components/entity/filter-bar";
import type { FieldDef, FieldOption } from "@/components/entity/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/auth";
import { assertQuery } from "@/lib/crud";
import { formatDate } from "@/lib/dates";
import { CONFIDENCE, options, RESEARCH_STATUS } from "@/lib/domain";
import { likePattern, pickEnum, pickString } from "@/lib/search";
import type { ResearchEntry } from "@/lib/types";
import { deleteResearch, saveResearch } from "@/features/research/actions";
import { getProjectLookup, nameMap, toOptions } from "@/features/shared/lookups";

export const metadata: Metadata = { title: "Research" };

const fields = (projects: FieldOption[]): FieldDef[] => [
  { name: "title", label: "Titel", type: "text", required: true, maxLength: 200, full: true },
  { name: "source_url", label: "Quelle (URL)", type: "url", placeholder: "https://…", full: true },
  { name: "project_id", label: "Projekt", type: "select", options: projects, emptyOption: "Kein Projekt" },
  { name: "tags", label: "Tags", type: "tags", placeholder: "markt, wettbewerb", hint: "Kommagetrennt, max. 20." },
  { name: "status", label: "Status", type: "select", required: true, options: options(RESEARCH_STATUS) },
  { name: "confidence", label: "Konfidenz", type: "select", required: true, options: options(CONFIDENCE) },
  { name: "summary", label: "Zusammenfassung & Erkenntnisse", type: "textarea", maxLength: 8000, rows: 6 },
];

function hostOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default async function ResearchPage({ searchParams }: PageProps<"/research">) {
  const sp = await searchParams;
  const q = pickString(sp, "q");
  const status = pickEnum(sp, "status", RESEARCH_STATUS.values);
  const tag = pickString(sp, "tag", 40)?.toLowerCase();

  const supabase = await db();
  let query = supabase
    .from("research_entries")
    .select("id, project_id, title, summary, source_url, tags, status, confidence, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) query = query.ilike("title", likePattern(q));
  if (status) query = query.eq("status", status);
  if (tag) query = query.contains("tags", [tag]);

  const [entries, projects] = await Promise.all([query.then((r) => assertQuery<ResearchEntry[]>(r, "list research")), getProjectLookup()]);
  const projectOptions = toOptions(projects);
  const projectNames = nameMap(projects);
  const f = fields(projectOptions);
  const filtered = Boolean(q || status || tag);

  const createButton = (
    <EntityFormDialog title="Neuer Research-Eintrag" action={saveResearch} fields={f} values={{ status: "draft", confidence: "medium" }} trigger={<Button><Plus /> Eintrag</Button>} />
  );

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Wissen" title="Research-Verzeichnis" description="Quellen, Erkenntnisse und deren Verlässlichkeit — zentral auffindbar." actions={createButton} />
      <FilterBar
        basePath="/research"
        q={q}
        hidden={{ tag }}
        searchLabel="Titel durchsuchen"
        selects={[{ name: "status", label: "Status", value: status, all: "Alle Status", options: options(RESEARCH_STATUS) }]}
      />
      {tag && (
        <p className="text-sm text-muted-foreground">
          Gefiltert nach Tag <span className="text-foreground">#{tag}</span> · <Link href="/research" className="text-primary hover:underline">entfernen</Link>
        </p>
      )}
      {entries.length === 0 ? (
        <EmptyState
          icon={Library}
          title={filtered ? "Keine Treffer" : "Noch keine Einträge"}
          description={filtered ? "Für diese Suche gibt es keine Einträge." : "Halten Sie Quellen und Erkenntnisse fest, bevor sie verloren gehen."}
          action={filtered ? undefined : createButton}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {entries.map((e) => (
            <article key={e.id} className="glass flex flex-col gap-3 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="min-w-0 text-[15px] font-semibold leading-snug">{e.title}</h2>
                <div className="-mr-2 -mt-1 flex shrink-0">
                  <EntityFormDialog
                    title="Eintrag bearbeiten"
                    action={saveResearch}
                    fields={f}
                    values={e}
                    trigger={<Button variant="ghost" size="icon-sm" aria-label={`${e.title} bearbeiten`}><Pencil /></Button>}
                  />
                  <DeleteButton id={e.id} action={deleteResearch} label={e.title} />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <EnumBadge value={e.status} meta={RESEARCH_STATUS.meta} />
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  Konfidenz <EnumBadge value={e.confidence} meta={CONFIDENCE.meta} />
                </span>
              </div>
              {e.summary && <p className="line-clamp-4 whitespace-pre-line text-sm text-muted-foreground">{e.summary}</p>}
              {e.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {e.tags.map((t) => (
                    <Link key={t} href={`/research?tag=${encodeURIComponent(t)}`} className="rounded-full bg-white/[0.05] px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground">#{t}</Link>
                  ))}
                </div>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/[0.06] pt-3 text-xs text-muted-foreground">
                <span>{formatDate(e.created_at)}</span>
                {e.project_id && <span className="inline-flex items-center gap-1"><FolderKanban className="size-3" />{projectNames.get(e.project_id)}</span>}
                {e.source_url && (
                  <a href={e.source_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-w-0 items-center gap-1 text-primary hover:underline">
                    <ExternalLink className="size-3 shrink-0" /><span className="truncate">{hostOf(e.source_url)}</span>
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

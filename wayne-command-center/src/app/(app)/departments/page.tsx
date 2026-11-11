import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Building2, FolderKanban, Pencil, Plus, UserRound } from "lucide-react";
import { DeleteButton } from "@/components/entity/delete-button";
import { EmptyState } from "@/components/entity/empty-state";
import { EntityFormDialog } from "@/components/entity/entity-form-dialog";
import type { FieldDef } from "@/components/entity/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/auth";
import { assertQuery } from "@/lib/crud";
import type { Department } from "@/lib/types";
import { deleteDepartment, saveDepartment } from "@/features/departments/actions";

export const metadata: Metadata = { title: "Abteilungen" };

const fields: FieldDef[] = [
  { name: "name", label: "Name", type: "text", required: true, maxLength: 120 },
  { name: "lead", label: "Leitung", type: "text", maxLength: 120, placeholder: "Person oder Agent" },
  { name: "description", label: "Auftrag & Verantwortung", type: "textarea", maxLength: 2000, rows: 4 },
];

function countBy(rows: { department_id: string | null; status: string }[], skip: string) {
  const m = new Map<string, number>();
  for (const r of rows) if (r.department_id && r.status !== skip) m.set(r.department_id, (m.get(r.department_id) ?? 0) + 1);
  return m;
}

export default async function DepartmentsPage() {
  const supabase = await db();
  const [departments, projects, agents] = await Promise.all([
    supabase.from("departments").select("id, name, description, lead, created_at").order("name"),
    supabase.from("projects").select("department_id, status").not("department_id", "is", null),
    supabase.from("agents").select("department_id, status").not("department_id", "is", null),
  ]);
  const list = assertQuery<Department[]>(departments, "list departments");
  const projectCount = countBy(assertQuery(projects, "dept projects"), "archived");
  const agentCount = countBy(assertQuery(agents, "dept agents"), "retired");

  const createButton = (
    <EntityFormDialog title="Neue Abteilung" action={saveDepartment} fields={fields} trigger={<Button><Plus /> Abteilung</Button>} />
  );

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Organisation" title="Abteilungen" description="Bereiche mit klarer Verantwortung — Projekte und Agenten werden ihnen zugeordnet." actions={createButton} />
      {list.length === 0 ? (
        <EmptyState icon={Building2} title="Noch keine Abteilungen" description="Zum Beispiel: Strategie, Finanzen, Recht, Vertrieb, Technologie." action={createButton} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((d) => (
            <article key={d.id} className="glass flex flex-col gap-4 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-primary"><Building2 className="size-4" /></div>
                  <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-semibold">{d.name}</h2>
                    {d.lead && <p className="flex items-center gap-1 text-xs text-muted-foreground"><UserRound className="size-3" />{d.lead}</p>}
                  </div>
                </div>
                <div className="-mr-2 flex shrink-0">
                  <EntityFormDialog
                    title="Abteilung bearbeiten"
                    action={saveDepartment}
                    fields={fields}
                    values={d}
                    trigger={<Button variant="ghost" size="icon-sm" aria-label={`${d.name} bearbeiten`}><Pencil /></Button>}
                  />
                  <DeleteButton id={d.id} action={deleteDepartment} label={d.name} />
                </div>
              </div>
              {d.description && <p className="line-clamp-3 text-sm text-muted-foreground">{d.description}</p>}
              <div className="mt-auto flex gap-4 border-t border-white/[0.06] pt-3 text-xs text-muted-foreground">
                <Link href={`/projects?department=${d.id}`} className="inline-flex items-center gap-1 hover:text-foreground">
                  <FolderKanban className="size-3" />{projectCount.get(d.id) ?? 0} Projekte
                </Link>
                <Link href={`/agents?department=${d.id}`} className="inline-flex items-center gap-1 hover:text-foreground">
                  <Bot className="size-3" />{agentCount.get(d.id) ?? 0} Agenten
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

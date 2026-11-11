import type { Metadata } from "next";
import { Bot, Building2, Pencil, Plus, Terminal } from "lucide-react";
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
import { AGENT_STATUS, options } from "@/lib/domain";
import { pickEnum, pickUuid } from "@/lib/search";
import type { Agent } from "@/lib/types";
import { deleteAgent, saveAgent } from "@/features/agents/actions";
import { getDepartmentLookup, nameMap, toOptions } from "@/features/shared/lookups";

export const metadata: Metadata = { title: "Agenten" };

const fields = (departments: FieldOption[]): FieldDef[] => [
  { name: "name", label: "Name", type: "text", required: true, maxLength: 120 },
  { name: "role", label: "Rolle", type: "text", maxLength: 160, placeholder: "z. B. Research-Analyst" },
  { name: "skill_command", label: "Skill-Befehl", type: "text", maxLength: 65, placeholder: "/deep-research", hint: "Slash-Befehl aus .claude/skills" },
  { name: "department_id", label: "Abteilung", type: "select", options: departments, emptyOption: "Keine Abteilung" },
  { name: "status", label: "Status", type: "select", required: true, options: options(AGENT_STATUS) },
  { name: "description", label: "Auftrag & Grenzen", type: "textarea", maxLength: 4000, rows: 4 },
];

export default async function AgentsPage({ searchParams }: PageProps<"/agents">) {
  const sp = await searchParams;
  const status = pickEnum(sp, "status", AGENT_STATUS.values);
  const department = pickUuid(sp, "department");

  const supabase = await db();
  let query = supabase
    .from("agents")
    .select("id, department_id, name, role, skill_command, description, status, created_at, updated_at")
    .order("status")
    .order("name");
  if (status) query = query.eq("status", status);
  if (department) query = query.eq("department_id", department);

  const [agents, departments] = await Promise.all([query.then((r) => assertQuery<Agent[]>(r, "list agents")), getDepartmentLookup()]);
  const deptOptions = toOptions(departments);
  const deptNames = nameMap(departments);
  const f = fields(deptOptions);
  const filtered = Boolean(status || department);

  const createButton = (
    <EntityFormDialog title="Agent registrieren" action={saveAgent} fields={f} values={{ status: "active", department_id: department }} trigger={<Button><Plus /> Agent</Button>} />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Automatisierung"
        title="Agentenübersicht"
        description="Register Ihrer Spezialagenten mit Rolle, zuständiger Abteilung und Skill-Befehl. Status wird von Ihnen gepflegt."
        actions={createButton}
      />
      <FilterBar
        basePath="/agents"
        selects={[
          { name: "status", label: "Status", value: status, all: "Alle Status", options: options(AGENT_STATUS) },
          { name: "department", label: "Abteilung", value: department, all: "Alle Abteilungen", options: deptOptions },
        ]}
        searchable={false}
      />
      {agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title={filtered ? "Keine Treffer" : "Noch keine Agenten"}
          description={filtered ? "Für diese Filter gibt es keine Agenten." : "Registrieren Sie z. B. einen Research-Agenten mit dem Befehl /deep-research."}
          action={filtered ? undefined : createButton}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((a) => (
            <article key={a.id} className="glass flex flex-col gap-4 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-primary"><Bot className="size-4" /></div>
                  <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-semibold">{a.name}</h2>
                    {a.role && <p className="truncate text-xs text-muted-foreground">{a.role}</p>}
                  </div>
                </div>
                <div className="-mr-2 flex shrink-0">
                  <EntityFormDialog
                    title="Agent bearbeiten"
                    action={saveAgent}
                    fields={f}
                    values={a}
                    trigger={<Button variant="ghost" size="icon-sm" aria-label={`${a.name} bearbeiten`}><Pencil /></Button>}
                  />
                  <DeleteButton id={a.id} action={deleteAgent} label={a.name} />
                </div>
              </div>
              {a.description && <p className="line-clamp-3 text-sm text-muted-foreground">{a.description}</p>}
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.06] pt-3 text-xs text-muted-foreground">
                <EnumBadge value={a.status} meta={AGENT_STATUS.meta} />
                {a.skill_command && <code className="inline-flex items-center gap-1 rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[11px] text-foreground"><Terminal className="size-3" />{a.skill_command}</code>}
                {a.department_id && <span className="inline-flex items-center gap-1"><Building2 className="size-3" />{deptNames.get(a.department_id)}</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

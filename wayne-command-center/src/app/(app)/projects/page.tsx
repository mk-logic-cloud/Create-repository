import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Calendar, FolderKanban, ListChecks, Pencil, Plus } from "lucide-react";
import { DeleteButton } from "@/components/entity/delete-button";
import { EmptyState } from "@/components/entity/empty-state";
import { EntityFormDialog } from "@/components/entity/entity-form-dialog";
import { EnumBadge } from "@/components/entity/enum-badge";
import { FilterBar } from "@/components/entity/filter-bar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getProfile } from "@/lib/auth";
import { formatDate, todayInZone } from "@/lib/dates";
import { options, PRIORITY, PROJECT_STATUS } from "@/lib/domain";
import { pickEnum, pickString, pickUuid } from "@/lib/search";
import { cn } from "@/lib/utils";
import { deleteProject, saveProject } from "@/features/projects/actions";
import { projectFields } from "@/features/projects/fields";
import { getTaskStatsByProject, listProjects } from "@/features/projects/queries";
import { getDepartmentLookup, nameMap, toOptions } from "@/features/shared/lookups";

export const metadata: Metadata = { title: "Projekte" };

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const sp = await searchParams;
  const status = pickEnum(sp, "status", PROJECT_STATUS.values);
  const department = pickUuid(sp, "department");
  const q = pickString(sp, "q");

  const profile = await getProfile();
  const today = todayInZone(profile?.timezone ?? "Europe/Berlin");
  const [projects, departments, stats] = await Promise.all([
    listProjects({ status, department, q }),
    getDepartmentLookup(),
    getTaskStatsByProject(today),
  ]);
  const deptOptions = toOptions(departments);
  const deptNames = nameMap(departments);
  const fields = projectFields(deptOptions);

  const createButton = (
    <EntityFormDialog
      title="Neues Projekt"
      action={saveProject}
      fields={fields}
      values={{ status: "planned", priority: "medium", progress: 0, department_id: department }}
      trigger={<Button><Plus /> Projekt</Button>}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Portfolio" title="Projekte" description="Status, Verantwortung und Fortschritt aller laufenden Vorhaben." actions={createButton} />
      <FilterBar
        basePath="/projects"
        q={q}
        searchLabel="Projekte durchsuchen"
        selects={[
          { name: "status", label: "Status", value: status, all: "Alle (ohne Archiv)", options: options(PROJECT_STATUS) },
          { name: "department", label: "Abteilung", value: department, all: "Alle Abteilungen", options: deptOptions },
        ]}
      />
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={status || department || q ? "Keine Treffer" : "Noch keine Projekte"}
          description="Projekte bündeln Aufgaben, Research und Entscheidungen."
          action={status || department || q ? undefined : createButton}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const s = stats.get(p.id);
            const overdue = p.due_date && p.due_date < today && p.status !== "completed" && p.status !== "archived";
            return (
              <article key={p.id} className="glass flex flex-col gap-4 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-2">
                    <h2 className="truncate text-[15px] font-semibold">{p.name}</h2>
                    <div className="flex flex-wrap gap-1.5">
                      <EnumBadge value={p.status} meta={PROJECT_STATUS.meta} />
                      <EnumBadge value={p.priority} meta={PRIORITY.meta} />
                    </div>
                  </div>
                  <div className="-mr-2 -mt-1 flex shrink-0">
                    <EntityFormDialog
                      title="Projekt bearbeiten"
                      action={saveProject}
                      fields={fields}
                      values={p}
                      trigger={<Button variant="ghost" size="icon-sm" aria-label={`${p.name} bearbeiten`}><Pencil /></Button>}
                    />
                    <DeleteButton id={p.id} action={deleteProject} label={p.name} />
                  </div>
                </div>
                {p.description && <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                <div className="mt-auto space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Fortschritt</span>
                    <span className="font-mono tabular-nums text-foreground">{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} aria-label={`Fortschritt ${p.name}`} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-white/[0.06] pt-3 text-xs text-muted-foreground">
                  {p.department_id && <span className="inline-flex items-center gap-1"><Building2 className="size-3" />{deptNames.get(p.department_id)}</span>}
                  <Link href={`/tasks?project=${p.id}`} className="inline-flex items-center gap-1 hover:text-foreground">
                    <ListChecks className="size-3" />{s ? `${s.done}/${s.total} Aufgaben` : "0 Aufgaben"}
                  </Link>
                  {p.due_date && (
                    <span className={cn("inline-flex items-center gap-1", overdue && "text-destructive")}>
                      <Calendar className="size-3" />{formatDate(p.due_date, true)}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

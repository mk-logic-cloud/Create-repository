import type { Metadata } from "next";
import { CheckSquare, Plus } from "lucide-react";
import { EmptyState } from "@/components/entity/empty-state";
import { EntityFormDialog } from "@/components/entity/entity-form-dialog";
import { FilterBar } from "@/components/entity/filter-bar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/auth";
import { todayInZone } from "@/lib/dates";
import { options, PRIORITY, TASK_STATUS } from "@/lib/domain";
import { getProjectLookup, nameMap, toOptions } from "@/features/shared/lookups";
import { saveTask } from "@/features/tasks/actions";
import { taskFields } from "@/features/tasks/fields";
import { listTasks, parseTaskFilter, TASK_LIMIT } from "@/features/tasks/queries";
import { TaskList } from "@/features/tasks/task-list";

export const metadata: Metadata = { title: "Aufgaben" };

export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  const filter = parseTaskFilter(await searchParams);
  const [tasks, projects, profile] = await Promise.all([listTasks(filter), getProjectLookup(), getProfile()]);
  const projectOptions = toOptions(projects);
  const today = todayInZone(profile?.timezone ?? "Europe/Berlin");
  const filtered = Boolean(filter.q || filter.status || filter.priority || filter.project);

  const createButton = (
    <EntityFormDialog
      title="Neue Aufgabe"
      action={saveTask}
      fields={taskFields(projectOptions)}
      values={{ status: "todo", priority: "medium", project_id: filter.project }}
      trigger={<Button><Plus /> Aufgabe</Button>}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Ausführung" title="Aufgaben" description="Alles, was zu tun ist — priorisiert und nach Fälligkeit sortiert." actions={createButton} />
      <FilterBar
        basePath="/tasks"
        q={filter.q}
        searchLabel="Aufgaben durchsuchen"
        selects={[
          { name: "status", label: "Status", value: filter.status, all: "Alle Status", options: [{ value: "open", label: "Alle offenen" }, ...options(TASK_STATUS)] },
          { name: "priority", label: "Priorität", value: filter.priority, all: "Alle Prioritäten", options: options(PRIORITY) },
          { name: "project", label: "Projekt", value: filter.project, all: "Alle Projekte", options: projectOptions },
        ]}
      />
      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={filtered ? "Keine Treffer" : "Noch keine Aufgaben"}
          description={filtered ? "Für diese Filter gibt es keine Aufgaben." : "Legen Sie Ihre erste Aufgabe an — sie erscheint sofort im Dashboard."}
          action={filtered ? undefined : createButton}
        />
      ) : (
        <>
          <TaskList tasks={tasks} projects={projectOptions} projectNames={nameMap(projects)} today={today} />
          <p className="text-xs text-muted-foreground">
            {tasks.length} {tasks.length === 1 ? "Aufgabe" : "Aufgaben"}
            {tasks.length >= TASK_LIMIT && ` · Anzeige auf ${TASK_LIMIT} begrenzt, bitte Filter nutzen`}
          </p>
        </>
      )}
    </div>
  );
}

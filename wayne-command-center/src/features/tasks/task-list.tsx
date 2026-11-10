import { Calendar, Check, FolderKanban, Pencil, RotateCcw } from "lucide-react";
import { ActionButton } from "@/components/entity/action-button";
import { DeleteButton } from "@/components/entity/delete-button";
import { EntityFormDialog } from "@/components/entity/entity-form-dialog";
import { EnumBadge } from "@/components/entity/enum-badge";
import type { FieldOption } from "@/components/entity/types";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { PRIORITY, TASK_STATUS } from "@/lib/domain";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { deleteTask, saveTask, setTaskStatus } from "./actions";
import { taskFields } from "./fields";

export function TaskList({ tasks, projects, projectNames, today, compact = false }: {
  tasks: Task[];
  projects: FieldOption[];
  projectNames: Map<string, string>;
  today: string;
  compact?: boolean;
}) {
  return (
    <ul className="glass divide-y divide-white/[0.06] overflow-hidden rounded-2xl">
      {tasks.map((t) => {
        const done = t.status === "done";
        const overdue = !done && t.due_date !== null && t.due_date < today;
        return (
          <li key={t.id} className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.025] sm:items-center">
            <ActionButton
              action={setTaskStatus}
              fields={{ id: t.id, status: done ? "todo" : "done" }}
              label={done ? "Wieder öffnen" : "Als erledigt markieren"}
              size="icon-sm"
              variant="outline"
            >
              {done ? <RotateCcw /> : <Check className="opacity-40" />}
            </ActionButton>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className={cn("text-sm font-medium leading-snug", done && "text-muted-foreground line-through decoration-white/20")}>{t.title}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                <EnumBadge value={t.status} meta={TASK_STATUS.meta} />
                {!compact && <EnumBadge value={t.priority} meta={PRIORITY.meta} />}
                {t.project_id && (
                  <span className="inline-flex items-center gap-1"><FolderKanban className="size-3" />{projectNames.get(t.project_id) ?? "—"}</span>
                )}
                {t.due_date && (
                  <span className={cn("inline-flex items-center gap-1", overdue && "text-destructive")}>
                    <Calendar className="size-3" />{overdue ? "Überfällig · " : ""}{formatDate(t.due_date, true)}
                  </span>
                )}
              </div>
            </div>
            {!compact && (
              <div className="flex shrink-0 items-center">
                <EntityFormDialog
                  title="Aufgabe bearbeiten"
                  action={saveTask}
                  fields={taskFields(projects)}
                  values={t}
                  trigger={<Button variant="ghost" size="icon-sm" aria-label={`${t.title} bearbeiten`}><Pencil /></Button>}
                />
                <DeleteButton id={t.id} action={deleteTask} label={t.title} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

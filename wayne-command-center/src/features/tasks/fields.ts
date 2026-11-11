import type { FieldDef, FieldOption } from "@/components/entity/types";
import { options, PRIORITY, TASK_STATUS } from "@/lib/domain";

export const taskFields = (projects: FieldOption[]): FieldDef[] => [
  { name: "title", label: "Titel", type: "text", required: true, maxLength: 200, full: true, placeholder: "Was ist zu tun?" },
  { name: "project_id", label: "Projekt", type: "select", options: projects, emptyOption: "Kein Projekt" },
  { name: "due_date", label: "Fällig am", type: "date" },
  { name: "status", label: "Status", type: "select", required: true, options: options(TASK_STATUS) },
  { name: "priority", label: "Priorität", type: "select", required: true, options: options(PRIORITY) },
  { name: "description", label: "Beschreibung", type: "textarea", maxLength: 4000, rows: 4 },
];

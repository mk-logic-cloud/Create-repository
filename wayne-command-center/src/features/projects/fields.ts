import type { FieldDef, FieldOption } from "@/components/entity/types";
import { options, PRIORITY, PROJECT_STATUS } from "@/lib/domain";

export const projectFields = (departments: FieldOption[]): FieldDef[] => [
  { name: "name", label: "Name", type: "text", required: true, maxLength: 160, full: true },
  { name: "department_id", label: "Abteilung", type: "select", options: departments, emptyOption: "Keine Abteilung" },
  { name: "status", label: "Status", type: "select", required: true, options: options(PROJECT_STATUS) },
  { name: "priority", label: "Priorität", type: "select", required: true, options: options(PRIORITY) },
  { name: "progress", label: "Fortschritt (%)", type: "number", required: true, min: 0, max: 100, hint: "Ihre Einschätzung, 0–100." },
  { name: "start_date", label: "Start", type: "date" },
  { name: "due_date", label: "Fällig am", type: "date" },
  { name: "description", label: "Beschreibung", type: "textarea", maxLength: 4000, rows: 4 },
];

export type FieldOption = { value: string; label: string };

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "date" | "number" | "url" | "tags";
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: FieldOption[];
  /** Adds an empty choice to selects (for optional relations). */
  emptyOption?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  rows?: number;
  /** Spans both columns on wide dialogs. */
  full?: boolean;
};

export type FormValues = Record<string, string | number | string[] | null | undefined>;

export type ServerAction = (prev: import("@/lib/action-state").ActionState, formData: FormData) => Promise<import("@/lib/action-state").ActionState>;

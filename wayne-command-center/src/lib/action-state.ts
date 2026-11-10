export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Submitted values echoed back on failure so the form can be restored (never secrets). */
  values?: Record<string, string>;
  /** Changes on every result so clients can react to repeated identical outcomes. */
  at?: number;
};

export const initialActionState: ActionState = { status: "idle" };

export const ok = (message: string): ActionState => ({ status: "success", message, at: Date.now() });
export const fail = (message: string, fieldErrors?: ActionState["fieldErrors"], values?: ActionState["values"]): ActionState => ({
  status: "error",
  message,
  fieldErrors,
  values,
  at: Date.now(),
});

const SECRET_FIELDS = new Set(["password", "confirm"]);

/** String form values without secrets, for restoring a form after a failed submit. */
export function echoValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  formData.forEach((v, k) => {
    if (typeof v === "string" && !k.startsWith("$ACTION") && !SECRET_FIELDS.has(k)) out[k] = v.slice(0, 10_000);
  });
  return out;
}

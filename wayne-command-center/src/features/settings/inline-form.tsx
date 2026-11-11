"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormFields } from "@/components/entity/form-fields";
import type { FieldDef, FormValues, ServerAction } from "@/components/entity/types";
import { Button } from "@/components/ui/button";
import { initialActionState } from "@/lib/action-state";

/** Always-visible form with toast feedback (used on the settings page). */
export function InlineForm({ action, fields, values, submitLabel, resetOnSuccess }: { action: ServerAction; fields: FieldDef[]; values?: FormValues; submitLabel: string; resetOnSuccess?: boolean }) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      if (resetOnSuccess) ref.current?.reset();
    }
    if (state.status === "error") toast.error(state.message);
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className="grid gap-4" noValidate>
      <FormFields key={state.at ?? 0} fields={fields} values={state.status === "error" ? (state.values ?? values) : values} errors={state.status === "error" ? state.fieldErrors : undefined} />
      <div><Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />}{submitLabel}</Button></div>
    </form>
  );
}

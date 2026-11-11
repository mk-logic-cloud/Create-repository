"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { initialActionState } from "@/lib/action-state";
import type { ServerAction } from "./types";

/** Small one-click form (e.g. toggle status) with toast feedback. */
export function ActionButton({
  action,
  fields,
  children,
  label,
  variant = "ghost",
  size = "sm",
}: {
  action: ServerAction;
  fields: Record<string, string>;
  children: ReactNode;
  label: string;
  variant?: "ghost" | "outline" | "secondary" | "default";
  size?: "sm" | "icon-sm" | "default";
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  useEffect(() => {
    if (state.status === "error") toast.error(state.message ?? "Aktion fehlgeschlagen.");
  }, [state]);

  return (
    <form action={formAction}>
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <Button type="submit" variant={variant} size={size} disabled={pending} aria-label={label} title={label}>
        {pending ? <Loader2 className="animate-spin" /> : children}
      </Button>
    </form>
  );
}

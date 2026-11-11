"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState, type ActionState } from "@/lib/action-state";

type AuthField = {
  name: string;
  label: string;
  type: "email" | "password" | "text";
  autoComplete: string;
  hint?: string;
  required?: boolean;
};

export function AuthForm({
  action,
  fields,
  submitLabel,
  hidden,
  hideOnSuccess,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  fields: AuthField[];
  submitLabel: string;
  hidden?: Record<string, string>;
  hideOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  if (hideOnSuccess && state.status === "success") {
    return (
      <Alert variant="success">
        <CheckCircle2 />
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {state.status === "error" && state.message && (
        <Alert variant="destructive"><AlertDescription>{state.message}</AlertDescription></Alert>
      )}
      {state.status === "success" && state.message && (
        <Alert variant="success"><CheckCircle2 /><AlertDescription>{state.message}</AlertDescription></Alert>
      )}
      {fields.map((f) => {
        const err = state.fieldErrors?.[f.name]?.[0];
        const id = `auth-${f.name}`;
        return (
          <div key={`${f.name}-${state.at ?? 0}`} className="grid gap-1.5">
            <Label htmlFor={id}>{f.label}</Label>
            <Input
              id={id}
              name={f.name}
              type={f.type}
              autoComplete={f.autoComplete}
              required={f.required ?? true}
              defaultValue={f.type === "password" ? undefined : state.values?.[f.name]}
              aria-invalid={err ? true : undefined}
              aria-describedby={err || f.hint ? `${id}-msg` : undefined}
            />
            {(err || f.hint) && (
              <p id={`${id}-msg`} className={err ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{err ?? f.hint}</p>
            )}
          </div>
        );
      })}
      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}

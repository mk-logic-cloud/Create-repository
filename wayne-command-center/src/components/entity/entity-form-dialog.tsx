"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { initialActionState, type ActionState } from "@/lib/action-state";
import { FormFields } from "./form-fields";
import type { FieldDef, FormValues, ServerAction } from "./types";

type Props = {
  title: string;
  description?: string;
  action: ServerAction;
  fields: FieldDef[];
  values?: FormValues & { id?: string };
  hidden?: Record<string, string>;
  submitLabel?: string;
  trigger: ReactNode;
};

export function EntityFormDialog(props: Props) {
  const [open, setOpen] = useState(false);
  const [instance, setInstance] = useState(0);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setInstance((i) => i + 1); // fresh form state on every open
      }}
    >
      <DialogTrigger asChild>{props.trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          {props.description ? <DialogDescription>{props.description}</DialogDescription> : <DialogDescription className="sr-only">{props.title}</DialogDescription>}
        </DialogHeader>
        {open && <EntityForm key={instance} {...props} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function EntityForm({ action, fields, values, hidden, submitLabel, onDone }: Props & { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await action(prev, fd);
    if (result.status === "success") {
      toast.success(result.message ?? "Gespeichert.");
      onDone();
    }
    return result;
  }, initialActionState);

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {state.status === "error" && state.message && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <FormFields key={state.at ?? 0} fields={fields} values={state.values ?? values} errors={state.status === "error" ? state.fieldErrors : undefined} />
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>Abbrechen</Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {submitLabel ?? "Speichern"}
        </Button>
      </DialogFooter>
    </form>
  );
}

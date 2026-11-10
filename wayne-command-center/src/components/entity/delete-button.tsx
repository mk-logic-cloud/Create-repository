"use client";

import { useActionState, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { initialActionState, type ActionState } from "@/lib/action-state";
import type { ServerAction } from "./types";

export function DeleteButton({ id, action, label }: { id: string; action: ServerAction; label: string }) {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await action(prev, fd);
    if (result.status === "success") {
      toast.success(result.message ?? "Gelöscht.");
      setOpen(false);
    } else {
      toast.error(result.message ?? "Löschen fehlgeschlagen.");
    }
    return result;
  }, initialActionState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`${label} löschen`}>
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Wirklich löschen?</DialogTitle>
          <DialogDescription>„{label}“ wird dauerhaft entfernt. Dies kann nicht rückgängig gemacht werden.</DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="id" value={id} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Löschen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

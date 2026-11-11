"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/action-state";
import { updatePassword } from "@/features/auth/actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initialActionState);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") { toast.success(state.message); ref.current?.reset(); }
    if (state.status === "error") toast.error(state.message);
  }, [state]);
  const err = (k: string) => (state.status === "error" ? state.fieldErrors?.[k]?.[0] : undefined);

  return (
    <form ref={ref} action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="pw-current_password">Aktuelles Passwort</Label>
        <Input
          id="pw-current_password"
          name="current_password"
          type="password"
          autoComplete="current-password"
          aria-invalid={err("current_password") ? true : undefined}
          aria-describedby="pw-current_password-msg"
        />
        <p id="pw-current_password-msg" className={err("current_password") ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {err("current_password") ?? "Erforderlich, wenn Ihre Anmeldung länger als 10 Minuten zurückliegt."}
        </p>
      </div>
      {(["password", "confirm"] as const).map((name) => (
        <div key={name} className="grid gap-1.5">
          <Label htmlFor={`pw-${name}`}>{name === "password" ? "Neues Passwort" : "Wiederholen"}</Label>
          <Input id={`pw-${name}`} name={name} type="password" autoComplete="new-password" aria-invalid={err(name) ? true : undefined} />
          {err(name) && <p className="text-xs text-destructive">{err(name)}</p>}
        </div>
      ))}
      <p className="text-xs text-muted-foreground sm:col-span-2">Mindestens 10 Zeichen, Buchstaben und Ziffern. Nach der Änderung werden alle anderen Sitzungen abgemeldet.</p>
      <div><Button type="submit" variant="secondary" disabled={pending}>{pending && <Loader2 className="animate-spin" />}Passwort ändern</Button></div>
    </form>
  );
}

"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="glass mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-3xl p-8 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive"><AlertTriangle className="size-5" /></div>
      <h2 className="text-lg font-semibold">Etwas ist schiefgelaufen</h2>
      <p className="text-sm text-muted-foreground">
        Die Daten konnten nicht geladen werden. Bitte versuchen Sie es erneut.
        {error.digest && <span className="mt-2 block font-mono text-xs opacity-60">Referenz: {error.digest}</span>}
      </p>
      <Button onClick={reset}><RotateCcw /> Erneut versuchen</Button>
    </div>
  );
}

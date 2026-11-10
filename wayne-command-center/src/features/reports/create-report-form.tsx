"use client";

import { useActionState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialActionState } from "@/lib/action-state";
import { createWeeklyReport } from "./actions";

export function CreateReportForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(createWeeklyReport, initialActionState);
  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label htmlFor="report-week" className="sr-only">Woche (beliebiger Tag)</label>
      <Input id="report-week" name="week" type="date" defaultValue={today} max={today} className="sm:w-44" aria-describedby="report-week-hint" />
      <span id="report-week-hint" className="sr-only">Ein beliebiger Tag der gewünschten Woche.</span>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Plus />} Bericht erstellen
      </Button>
    </form>
  );
}

"use server";

import { z } from "zod";
import { echoValues, fail, ok, type ActionState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { describeDbError, formToObject, revalidate } from "@/lib/crud";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation/schemas";

export async function saveProfile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fail("Bitte die Eingaben prüfen.", z.flattenError(parsed.error).fieldErrors as ActionState["fieldErrors"], echoValues(fd));
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
    if (error) return fail(describeDbError(error, "update profile"));
    revalidate(["/", "/settings"]);
    return ok("Profil gespeichert.");
  } catch (e) {
    console.error("[settings] profile:", e);
    return fail("Verbindung zur Datenbank fehlgeschlagen.");
  }
}

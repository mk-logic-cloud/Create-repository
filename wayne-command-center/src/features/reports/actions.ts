"use server";

import { z } from "zod";
import { fail, ok, type ActionState } from "@/lib/action-state";
import { getProfile, requireUser } from "@/lib/auth";
import { deleteEntity, describeDbError, revalidate, saveEntity } from "@/lib/crud";
import { startOfIsoWeek, todayInZone } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { idSchema } from "@/lib/validation/fields";
import { weeklyReportSchema } from "@/lib/validation/schemas";
import { computeWeeklyMetrics } from "./metrics";

const PATHS = ["/reports"];
const weekInput = z.preprocess((v) => (typeof v === "string" && v ? v : undefined), z.iso.date("Ungültiges Datum.").optional());

export async function createWeeklyReport(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = weekInput.safeParse(fd.get("week"));
  if (!parsed.success) return fail("Bitte ein gültiges Datum wählen.", { week: ["Ungültiges Datum."] });

  const tz = (await getProfile())?.timezone ?? "Europe/Berlin";
  const today = todayInZone(tz);
  const weekStart = startOfIsoWeek(parsed.data ?? today);
  if (weekStart > today) return fail("Berichte für zukünftige Wochen sind nicht möglich.", { week: ["Datum liegt in der Zukunft."] });

  try {
    const supabase = await createClient();
    const metrics = await computeWeeklyMetrics(supabase, weekStart, tz);
    const { error } = await supabase.from("weekly_reports").insert({ week_start: weekStart, metrics });
    if (error) {
      if (error.code === "23505") return fail("Für diese Woche existiert bereits ein Bericht. Aktualisieren Sie dort die Kennzahlen.");
      return fail(describeDbError(error, "insert weekly report"));
    }
    revalidate(PATHS);
    return ok("Wochenbericht erstellt.");
  } catch (e) {
    console.error("[reports] create:", e);
    return fail("Bericht konnte nicht erstellt werden.");
  }
}

export async function refreshReportMetrics(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(fd.get("id"));
  if (!id.success) return fail("Ungültige ID.");
  try {
    const supabase = await createClient();
    const { data: report, error: readError } = await supabase.from("weekly_reports").select("week_start").eq("id", id.data).maybeSingle();
    if (readError) return fail(describeDbError(readError, "read report"));
    if (!report) return fail("Bericht nicht gefunden.");
    const tz = (await getProfile())?.timezone ?? "Europe/Berlin";
    const metrics = await computeWeeklyMetrics(supabase, report.week_start as string, tz);
    const { error } = await supabase.from("weekly_reports").update({ metrics }).eq("id", id.data);
    if (error) return fail(describeDbError(error, "refresh report"));
    revalidate(PATHS);
    return ok("Kennzahlen aktualisiert.");
  } catch (e) {
    console.error("[reports] refresh:", e);
    return fail("Kennzahlen konnten nicht aktualisiert werden.");
  }
}

export async function saveReportNotes(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (!fd.get("id")) return fail("Bericht fehlt.");
  return saveEntity("weekly_reports", weeklyReportSchema, fd, PATHS, { created: "Gespeichert.", updated: "Bericht gespeichert." });
}

export async function deleteReport(_prev: ActionState, fd: FormData) {
  return deleteEntity("weekly_reports", fd, PATHS, "Bericht gelöscht.");
}

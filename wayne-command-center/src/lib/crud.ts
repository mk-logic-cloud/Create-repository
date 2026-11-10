import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { echoValues, fail, ok, type ActionState } from "@/lib/action-state";
import { idSchema } from "@/lib/validation/fields";

export type Table =
  | "departments" | "projects" | "milestones" | "tasks"
  | "research_entries" | "decisions" | "agents" | "weekly_reports";

type PgError = { code?: string; message?: string } | null;

/** Translates database errors into user-facing messages without leaking internals. */
export function describeDbError(error: PgError, context: string): string {
  console.error(`[db] ${context}:`, error?.code, error?.message);
  switch (error?.code) {
    case "23505": return "Ein Eintrag mit diesem Namen existiert bereits.";
    case "23503": return "Der verknüpfte Datensatz existiert nicht (mehr).";
    case "23514":
    case "22P02":
    case "22007":
    case "22008": return "Die Eingabe ist ungültig.";
    case "42501": return "Dafür fehlt die Berechtigung.";
    default: return "Speichern fehlgeschlagen. Bitte erneut versuchen.";
  }
}

export function formToObject(formData: FormData): Record<string, FormDataEntryValue> {
  const out: Record<string, FormDataEntryValue> = {};
  for (const [k, v] of formData.entries()) if (!k.startsWith("$ACTION")) out[k] = v;
  return out;
}

export function revalidate(paths: string[]) {
  for (const p of new Set(paths)) revalidatePath(p);
}

/** Validated insert or update (when the form carries an `id`). */
export async function saveEntity<S extends z.ZodType<Record<string, unknown>>>(
  table: Table,
  schema: S,
  formData: FormData,
  paths: string[],
  labels: { created: string; updated: string },
): Promise<ActionState> {
  await requireUser();
  const echo = echoValues(formData);
  const rawId = formData.get("id");
  const id = rawId ? idSchema.safeParse(rawId) : null;
  if (id && !id.success) return fail("Ungültige ID.", undefined, echo);

  const parsed = schema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return fail("Bitte die markierten Felder prüfen.", z.flattenError(parsed.error).fieldErrors as ActionState["fieldErrors"], echo);
  }

  try {
    const supabase = await createClient();
    if (id?.success) {
      const { data, error } = await supabase.from(table).update(parsed.data as never).eq("id", id.data).select("id");
      if (error) return fail(describeDbError(error, `update ${table}`), undefined, echo);
      if (!data?.length) return fail("Eintrag nicht gefunden.", undefined, echo);
      revalidate(paths);
      return ok(labels.updated);
    }
    const { error } = await supabase.from(table).insert(parsed.data as never);
    if (error) return fail(describeDbError(error, `insert ${table}`), undefined, echo);
    revalidate(paths);
    return ok(labels.created);
  } catch (e) {
    console.error(`[db] ${table}:`, e);
    return fail("Verbindung zur Datenbank fehlgeschlagen.", undefined, echo);
  }
}

/** Partial update of explicitly validated columns (e.g. quick status changes). */
export async function patchEntity(
  table: Table,
  id: unknown,
  values: Record<string, unknown>,
  paths: string[],
  message: string,
): Promise<ActionState> {
  await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return fail("Ungültige ID.");
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(table).update(values as never).eq("id", parsedId.data).select("id");
    if (error) return fail(describeDbError(error, `patch ${table}`));
    if (!data?.length) return fail("Eintrag nicht gefunden.");
    revalidate(paths);
    return ok(message);
  } catch (e) {
    console.error(`[db] ${table}:`, e);
    return fail("Verbindung zur Datenbank fehlgeschlagen.");
  }
}

export async function deleteEntity(table: Table, formData: FormData, paths: string[], message: string): Promise<ActionState> {
  await requireUser();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return fail("Ungültige ID.");
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(table).delete().eq("id", id.data).select("id");
    if (error) return fail(describeDbError(error, `delete ${table}`));
    if (!data?.length) return fail("Eintrag nicht gefunden.");
    revalidate(paths);
    return ok(message);
  } catch (e) {
    console.error(`[db] ${table}:`, e);
    return fail("Verbindung zur Datenbank fehlgeschlagen.");
  }
}

/** Throws a generic error for Server Components; error.tsx renders it. */
export function assertQuery<T>(result: { data: T | null; error: PgError }, context: string): T {
  if (result.error) {
    console.error(`[db] ${context}:`, result.error.code, result.error.message);
    throw new Error("Daten konnten nicht geladen werden.");
  }
  return (result.data ?? ([] as unknown)) as T;
}

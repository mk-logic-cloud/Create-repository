import "server-only";
import { cache } from "react";
import { db } from "@/lib/auth";
import { assertQuery } from "@/lib/crud";
import type { FieldOption } from "@/components/entity/types";

export type Lookup = { id: string; name: string };

export const getProjectLookup = cache(async (): Promise<Lookup[]> => {
  const supabase = await db();
  const rows = assertQuery<{ id: string; name: string; status: string }[]>(
    await supabase.from("projects").select("id, name, status").order("name"),
    "project lookup",
  );
  return rows.map((r) => ({ id: r.id, name: r.status === "archived" ? `${r.name} (archiviert)` : r.name }));
});

export const getDepartmentLookup = cache(async (): Promise<Lookup[]> => {
  const supabase = await db();
  return assertQuery(await supabase.from("departments").select("id, name").order("name"), "department lookup");
});

export const toOptions = (rows: Lookup[]): FieldOption[] => rows.map((r) => ({ value: r.id, label: r.name }));
export const nameMap = (rows: Lookup[]) => new Map(rows.map((r) => [r.id, r.name]));

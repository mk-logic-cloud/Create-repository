"use server";

import type { ActionState } from "@/lib/action-state";
import { deleteEntity, saveEntity } from "@/lib/crud";
import { departmentSchema } from "@/lib/validation/schemas";

const PATHS = ["/departments", "/projects", "/agents", "/"];

export async function saveDepartment(_prev: ActionState, fd: FormData) {
  return saveEntity("departments", departmentSchema, fd, PATHS, { created: "Abteilung angelegt.", updated: "Abteilung gespeichert." });
}

export async function deleteDepartment(_prev: ActionState, fd: FormData) {
  return deleteEntity("departments", fd, PATHS, "Abteilung gelöscht. Zugeordnete Projekte und Agenten bleiben erhalten.");
}

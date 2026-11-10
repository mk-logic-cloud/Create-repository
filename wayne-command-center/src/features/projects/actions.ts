"use server";

import type { ActionState } from "@/lib/action-state";
import { deleteEntity, saveEntity } from "@/lib/crud";
import { projectSchema } from "@/lib/validation/schemas";

const PATHS = ["/projects", "/", "/progress", "/departments", "/tasks"];

export async function saveProject(_prev: ActionState, fd: FormData) {
  return saveEntity("projects", projectSchema, fd, PATHS, { created: "Projekt angelegt.", updated: "Projekt gespeichert." });
}

export async function deleteProject(_prev: ActionState, fd: FormData) {
  return deleteEntity("projects", fd, PATHS, "Projekt gelöscht.");
}

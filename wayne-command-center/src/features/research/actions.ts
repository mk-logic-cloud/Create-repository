"use server";

import type { ActionState } from "@/lib/action-state";
import { deleteEntity, saveEntity } from "@/lib/crud";
import { researchSchema } from "@/lib/validation/schemas";

const PATHS = ["/research", "/"];

export async function saveResearch(_prev: ActionState, fd: FormData) {
  return saveEntity("research_entries", researchSchema, fd, PATHS, { created: "Eintrag angelegt.", updated: "Eintrag gespeichert." });
}

export async function deleteResearch(_prev: ActionState, fd: FormData) {
  return deleteEntity("research_entries", fd, PATHS, "Eintrag gelöscht.");
}

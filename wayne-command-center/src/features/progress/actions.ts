"use server";

import type { ActionState } from "@/lib/action-state";
import { deleteEntity, patchEntity, saveEntity } from "@/lib/crud";
import { milestoneSchema } from "@/lib/validation/schemas";

const PATHS = ["/progress", "/"];

export async function saveMilestone(_prev: ActionState, fd: FormData) {
  return saveEntity("milestones", milestoneSchema, fd, PATHS, { created: "Meilenstein angelegt.", updated: "Meilenstein gespeichert." });
}

export async function toggleMilestone(_prev: ActionState, fd: FormData) {
  const complete = fd.get("complete") === "1";
  return patchEntity("milestones", fd.get("id"), { completed_at: complete ? new Date().toISOString() : null }, PATHS,
    complete ? "Meilenstein erreicht." : "Meilenstein wieder geöffnet.");
}

export async function deleteMilestone(_prev: ActionState, fd: FormData) {
  return deleteEntity("milestones", fd, PATHS, "Meilenstein gelöscht.");
}

"use server";

import type { ActionState } from "@/lib/action-state";
import { deleteEntity, saveEntity } from "@/lib/crud";
import { agentSchema } from "@/lib/validation/schemas";

const PATHS = ["/agents", "/departments", "/"];

export async function saveAgent(_prev: ActionState, fd: FormData) {
  return saveEntity("agents", agentSchema, fd, PATHS, { created: "Agent registriert.", updated: "Agent gespeichert." });
}

export async function deleteAgent(_prev: ActionState, fd: FormData) {
  return deleteEntity("agents", fd, PATHS, "Agent entfernt.");
}

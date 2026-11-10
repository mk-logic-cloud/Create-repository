"use server";

import type { ActionState } from "@/lib/action-state";
import { deleteEntity, saveEntity } from "@/lib/crud";
import { decisionSchema } from "@/lib/validation/schemas";

const PATHS = ["/decisions", "/"];

export async function saveDecision(_prev: ActionState, fd: FormData) {
  return saveEntity("decisions", decisionSchema, fd, PATHS, { created: "Entscheidung protokolliert.", updated: "Entscheidung gespeichert." });
}

export async function deleteDecision(_prev: ActionState, fd: FormData) {
  return deleteEntity("decisions", fd, PATHS, "Entscheidung gelöscht.");
}

"use server";

import type { ActionState } from "@/lib/action-state";
import { fail } from "@/lib/action-state";
import { deleteEntity, patchEntity, saveEntity } from "@/lib/crud";
import { taskSchema, taskStatusSchema } from "@/lib/validation/schemas";

const PATHS = ["/tasks", "/", "/progress"];

export async function saveTask(_prev: ActionState, fd: FormData) {
  return saveEntity("tasks", taskSchema, fd, PATHS, { created: "Aufgabe angelegt.", updated: "Aufgabe gespeichert." });
}

export async function setTaskStatus(_prev: ActionState, fd: FormData) {
  const parsed = taskStatusSchema.safeParse({ status: fd.get("status") });
  if (!parsed.success) return fail("Ungültiger Status.");
  return patchEntity("tasks", fd.get("id"), parsed.data, PATHS, "Status aktualisiert.");
}

export async function deleteTask(_prev: ActionState, fd: FormData) {
  return deleteEntity("tasks", fd, PATHS, "Aufgabe gelöscht.");
}

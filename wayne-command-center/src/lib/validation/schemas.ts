import { z } from "zod";
import {
  AGENT_STATUS, CONFIDENCE, DECISION_STATUS, PRIORITY, PROJECT_STATUS, RESEARCH_STATUS, TASK_STATUS,
} from "@/lib/domain";
import {
  enumOf, optionalDate, optionalHttpUrl, optionalId, optionalText, percent, requiredDate, requiredText, tagList,
} from "./fields";

export const departmentSchema = z.object({
  name: requiredText(120, "Name"),
  lead: optionalText(120),
  description: optionalText(2000),
});

export const projectSchema = z
  .object({
    name: requiredText(160, "Name"),
    department_id: optionalId,
    status: enumOf(PROJECT_STATUS.values, "Status"),
    priority: enumOf(PRIORITY.values, "Priorität"),
    progress: percent,
    start_date: optionalDate,
    due_date: optionalDate,
    description: optionalText(4000),
  })
  .refine((p) => !p.start_date || !p.due_date || p.due_date >= p.start_date, {
    path: ["due_date"],
    message: "Fälligkeit muss nach dem Start liegen.",
  });

export const milestoneSchema = z.object({
  project_id: z.uuid("Projekt fehlt."),
  title: requiredText(160, "Titel"),
  due_date: optionalDate,
});

export const taskSchema = z.object({
  title: requiredText(200, "Titel"),
  project_id: optionalId,
  status: enumOf(TASK_STATUS.values, "Status"),
  priority: enumOf(PRIORITY.values, "Priorität"),
  due_date: optionalDate,
  description: optionalText(4000),
});

export const taskStatusSchema = z.object({ status: enumOf(TASK_STATUS.values, "Status") });

export const researchSchema = z.object({
  title: requiredText(200, "Titel"),
  project_id: optionalId,
  source_url: optionalHttpUrl,
  tags: tagList,
  status: enumOf(RESEARCH_STATUS.values, "Status"),
  confidence: enumOf(CONFIDENCE.values, "Konfidenzwert"),
  summary: optionalText(8000),
});

export const decisionSchema = z.object({
  title: requiredText(200, "Titel"),
  project_id: optionalId,
  status: enumOf(DECISION_STATUS.values, "Status"),
  decided_at: requiredDate,
  context: optionalText(8000),
  decision: optionalText(8000),
  alternatives: optionalText(8000),
  rationale: optionalText(8000),
});

export const agentSchema = z.object({
  name: requiredText(120, "Name"),
  role: optionalText(160),
  skill_command: z.preprocess(
    (v) => {
      if (typeof v !== "string" || v.trim() === "") return null;
      const s = v.trim().toLowerCase();
      return s.startsWith("/") ? s : `/${s}`;
    },
    z
      .string()
      .regex(/^\/[a-z0-9][a-z0-9-]{0,63}$/, "Nur Kleinbuchstaben, Ziffern und Bindestriche, z. B. /deep-research.")
      .nullable(),
  ),
  department_id: optionalId,
  status: enumOf(AGENT_STATUS.values, "Status"),
  description: optionalText(4000),
});

export const weeklyReportSchema = z.object({
  summary: optionalText(8000),
  wins: optionalText(8000),
  blockers: optionalText(8000),
  next_steps: optionalText(8000),
});

export const profileSchema = z.object({
  full_name: optionalText(120),
  timezone: z
    .string()
    .trim()
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat("de-DE", { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, "Unbekannte Zeitzone."),
});

const email = z.string().trim().toLowerCase().pipe(z.email("Bitte eine gültige E-Mail-Adresse angeben.").max(254));
const newPassword = z
  .string()
  .min(10, "Mindestens 10 Zeichen.")
  .max(72, "Maximal 72 Zeichen.")
  .regex(/[A-Za-z]/, "Mindestens ein Buchstabe.")
  .regex(/[0-9]/, "Mindestens eine Ziffer.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Passwort ist erforderlich.").max(72),
});

export const signupSchema = z.object({
  full_name: optionalText(120),
  email,
  password: newPassword,
});

export const forgotPasswordSchema = z.object({ email });

export const passwordChangeSchema = z
  .object({
    // Required by the server action unless the session authenticated within the last 10 minutes.
    current_password: z.preprocess(
      (v) => (typeof v === "string" && v !== "" ? v : undefined),
      z.string().max(72, "Maximal 72 Zeichen.").optional(),
    ),
    password: newPassword,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwörter stimmen nicht überein." });

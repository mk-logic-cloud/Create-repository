import { z } from "zod";

const blankToNull = (v: unknown) => (v === undefined || v === null || (typeof v === "string" && v.trim() === "") ? null : v);

export const requiredText = (max: number, label = "Dieses Feld") =>
  z
    .string({ error: `${label} ist erforderlich.` })
    .trim()
    .min(1, `${label} ist erforderlich.`)
    .max(max, `Maximal ${max} Zeichen.`);

export const optionalText = (max: number) =>
  z.preprocess(blankToNull, z.string().trim().max(max, `Maximal ${max} Zeichen.`).nullable());

export const optionalId = z.preprocess(blankToNull, z.uuid("Ungültige Auswahl.").nullable());

export const optionalDate = z.preprocess(blankToNull, z.iso.date("Ungültiges Datum.").nullable());

export const requiredDate = z.iso.date("Bitte ein gültiges Datum wählen.");

export const optionalHttpUrl = z.preprocess(
  blankToNull,
  z
    .url({ protocol: /^https?$/, error: "Bitte eine gültige http(s)-Adresse angeben." })
    .max(2048, "Adresse ist zu lang.")
    .nullable(),
);

export const tagList = z.preprocess(
  (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v !== "string") return [];
    const tags = v
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    return [...new Set(tags)];
  },
  z
    .array(z.string().max(40, "Ein Tag darf maximal 40 Zeichen haben."))
    .max(20, "Maximal 20 Tags."),
);

export const enumOf = <T extends readonly [string, ...string[]]>(values: T, label = "Wert") =>
  z.enum(values, { error: `Ungültiger ${label}.` });

export const percent = z.coerce
  .number({ error: "Bitte eine Zahl angeben." })
  .int("Bitte eine ganze Zahl angeben.")
  .min(0, "Mindestens 0.")
  .max(100, "Höchstens 100.");

export const idSchema = z.uuid("Ungültige ID.");

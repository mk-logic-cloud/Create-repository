/** Escapes LIKE wildcards so user input is matched literally. */
export const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SP = Record<string, string | string[] | undefined>;

export function pickString(sp: SP, key: string, max = 100): string | undefined {
  const v = sp[key];
  if (typeof v !== "string") return undefined;
  const t = v.trim().slice(0, max);
  return t || undefined;
}

export function pickEnum<T extends string>(sp: SP, key: string, values: readonly T[]): T | undefined {
  const v = sp[key];
  return typeof v === "string" && (values as readonly string[]).includes(v) ? (v as T) : undefined;
}

export function pickUuid(sp: SP, key: string): string | undefined {
  const v = sp[key];
  return typeof v === "string" && UUID_RE.test(v) ? v : undefined;
}

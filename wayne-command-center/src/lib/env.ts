import "server-only";

export type SupabaseEnv = { url: string; key: string };

/**
 * Reads the Supabase connection settings. Only the *publishable/anon* key is accepted —
 * it is safe by design because every table is protected by Row Level Security.
 * A service-role/secret key is rejected so it can never be used by this app by mistake.
 * The values are only read on the server; nothing is exposed to the browser bundle.
 */
export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  if (!isValidUrl(url) || isPrivilegedKey(key)) return null;
  return { url, key };
}

export function getSupabaseEnvProblem(): string | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) return "SUPABASE_URL fehlt.";
  if (!isValidUrl(url)) return "SUPABASE_URL ist keine gültige https-Adresse.";
  if (!key) return "SUPABASE_PUBLISHABLE_KEY fehlt.";
  if (isPrivilegedKey(key)) return "Es wurde ein geheimer Service-Schlüssel hinterlegt. Bitte ausschließlich den Publishable/Anon-Key verwenden.";
  return null;
}

function isValidUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.hostname === "localhost" || u.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function isPrivilegedKey(key: string) {
  if (key.startsWith("sb_secret_")) return true;
  const parts = key.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as { role?: string };
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

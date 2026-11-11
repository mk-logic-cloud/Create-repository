import "server-only";
import { headers } from "next/headers";
import { getSiteUrl } from "@/lib/env";

/**
 * Absolute origin for auth e-mail links. SITE_URL wins and is mandatory in production
 * (enforced by getSupabaseEnv → /setup). The Host-header fallback is only used in development.
 */
export async function getOrigin(): Promise<string> {
  const configured = getSiteUrl();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SITE_URL ist nicht oder ungültig konfiguriert.");
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

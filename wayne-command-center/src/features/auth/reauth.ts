/**
 * Freshness of the current session's authentication, derived from the verified JWT claims.
 *
 * Supabase puts an `amr` (authentication methods reference) array into every access token, e.g.
 * `[{ method: "password", timestamp: 1731300000 }]` or `{ method: "otp" | "recovery", … }` after a
 * reset link. The timestamps (seconds) mark when the user actually authenticated; they are kept
 * across token refreshes. Missing or malformed data counts as "not fresh" (fail closed).
 */

/** A password may be changed without the current one only this soon after authenticating. */
export const REAUTH_WINDOW_SECONDS = 10 * 60;
/** Tolerated clock skew for timestamps slightly in the future. */
const CLOCK_SKEW_SECONDS = 60;

/** Latest `amr[].timestamp` in seconds, or null if there is none. */
export function lastAuthenticatedAt(claims: unknown): number | null {
  const amr = (claims as { amr?: unknown } | null | undefined)?.amr;
  if (!Array.isArray(amr)) return null;
  let latest: number | null = null;
  for (const entry of amr) {
    const ts = (entry as { timestamp?: unknown } | null)?.timestamp;
    if (typeof ts === "number" && Number.isFinite(ts) && (latest === null || ts > latest)) latest = ts;
  }
  return latest;
}

export function isRecentAuthentication(claims: unknown, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  const at = lastAuthenticatedAt(claims);
  if (at === null) return false;
  return at <= nowSeconds + CLOCK_SKEW_SECONDS && nowSeconds - at <= REAUTH_WINDOW_SECONDS;
}

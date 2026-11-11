import type { CookieOptionsWithName } from "@supabase/ssr";

/**
 * Central cookie attributes for every Supabase server client (server.ts and proxy.ts).
 * @supabase/ssr merges these over its defaults for setting, refreshing *and* deleting the
 * session cookies; Max-Age stays under the library's control (400 days, 0 on sign-out).
 *
 * - httpOnly: the browser never needs the session — all Supabase access is server-side and
 *   no client component reads it — so scripts must not be able to read the tokens either.
 * - secure: only sent over HTTPS in production (browsers also accept it on http://localhost).
 * - sameSite "lax" + path "/": unchanged library defaults, made explicit here.
 */
export function supabaseCookieOptions(env: { NODE_ENV?: string } = process.env): CookieOptionsWithName {
  return {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
  };
}

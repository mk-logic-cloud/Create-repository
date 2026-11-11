import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseCookieOptions } from "./cookie-options";

/**
 * Forwards the request with extra headers (e.g. CSP nonce). The request headers are copied
 * at call time, so cookies refreshed in `setAll` are included.
 */
export function nextWithHeaders(request: NextRequest, extraHeaders: Record<string, string> = {}) {
  const headers = new Headers(request.headers);
  for (const [name, value] of Object.entries(extraHeaders)) headers.set(name, value);
  return NextResponse.next({ request: { headers } });
}

/**
 * Redirect that keeps every cookie written by `updateSession` — refreshed tokens *and* deletions
 * (empty value, Max-Age 0) — including their attributes (httpOnly, secure, sameSite, path, maxAge).
 * A bare `NextResponse.redirect` would drop them: the browser keeps a consumed refresh token or a
 * stale session cookie and the next request fails or loops.
 */
export function redirectWithSession(url: URL | string, sessionResponse: NextResponse) {
  const redirect = NextResponse.redirect(url);
  for (const cookie of sessionResponse.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

/** Refreshes the auth session and returns the response plus whether a valid user is present. */
export async function updateSession(
  request: NextRequest,
  env: { url: string; key: string },
  extraRequestHeaders: Record<string, string> = {},
) {
  let response = nextWithHeaders(request, extraRequestHeaders);

  const supabase = createServerClient(env.url, env.key, {
    cookieOptions: supabaseCookieOptions(),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = nextWithHeaders(request, extraRequestHeaders);
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims() verifies the JWT signature (asymmetric keys) or falls back to the Auth server.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);

  return { response, isAuthenticated };
}

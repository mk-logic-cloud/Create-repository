import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/env";
import { buildContentSecurityPolicy, generateNonce } from "@/lib/csp";
import { nextWithHeaders, redirectWithSession, updateSession } from "@/lib/supabase/proxy";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/auth/confirm"];
const GUEST_ONLY = ["/login", "/signup", "/forgot-password"];

function matches(pathname: string, list: string[]) {
  return list.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isHttpsRequest(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (forwarded) return forwarded === "https";
  return request.nextUrl.protocol === "https:";
}

export async function proxy(request: NextRequest) {
  const nonce = generateNonce();
  const csp = buildContentSecurityPolicy({
    nonce,
    isDev: process.env.NODE_ENV === "development",
    isHttps: isHttpsRequest(request),
  });
  const cspRequestHeaders = { "x-nonce": nonce, "Content-Security-Policy": csp };
  const withCsp = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };

  const { pathname, search } = request.nextUrl;
  const env = getSupabaseEnv();

  // Not configured yet: route everything to the setup guide.
  if (!env) {
    if (pathname === "/setup") return withCsp(nextWithHeaders(request, cspRequestHeaders));
    return withCsp(NextResponse.redirect(new URL("/setup", request.url)));
  }
  if (pathname === "/setup") return withCsp(NextResponse.redirect(new URL("/", request.url)));

  const { response, isAuthenticated } = await updateSession(request, env, cspRequestHeaders);

  if (!isAuthenticated && !matches(pathname, PUBLIC_PATHS)) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
    return withCsp(redirectWithSession(url, response));
  }
  if (isAuthenticated && matches(pathname, GUEST_ONLY)) {
    return withCsp(redirectWithSession(new URL("/", request.url), response));
  }
  return withCsp(response);
}

// Only Next.js build assets and the favicon skip the proxy. Paths with file extensions are *not*
// excluded: public/ is empty, so every such path is a route that needs the auth check and the CSP.
export const config = {
  // Anchored so that look-alikes such as /favicon.icoX or /_next/staticfoo still pass the proxy.
  matcher: ["/((?!_next/static/|_next/image/|_next/image$|favicon\\.ico$).*)"],
};

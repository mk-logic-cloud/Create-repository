import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/env";
import { buildContentSecurityPolicy, generateNonce } from "@/lib/csp";
import { nextWithHeaders, updateSession } from "@/lib/supabase/proxy";

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
    return withCsp(NextResponse.redirect(url));
  }
  if (isAuthenticated && matches(pathname, GUEST_ONLY)) {
    return withCsp(NextResponse.redirect(new URL("/", request.url)));
  }
  return withCsp(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)"],
};

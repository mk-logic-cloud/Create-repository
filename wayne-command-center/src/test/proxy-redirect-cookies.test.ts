import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseCookieOptions } from "@/lib/supabase/cookie-options";
import { trustedNonce } from "@/lib/csp";
import { config, proxy } from "@/proxy";

/**
 * Runs the real proxy (src/proxy.ts) against a fake Supabase Auth server (globalThis.fetch is
 * replaced, no network) and inspects the Set-Cookie headers of the redirects it returns.
 */

const SUPABASE_URL = "https://testproject.supabase.co";
const SITE = "https://wayne.example";
const COOKIE = "sb-testproject-auth-token";
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const user = { id: "u1", aud: "authenticated", role: "authenticated", email: "test@example.test", app_metadata: {}, user_metadata: {} };

function jwt(expiresIn: number) {
  const now = Math.floor(Date.now() / 1000);
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "u1", role: "authenticated", aud: "authenticated", exp: now + expiresIn, iat: now })}.sig`;
}

function session(expiresIn: number, refreshToken: string) {
  return {
    access_token: jwt(expiresIn),
    refresh_token: refreshToken,
    token_type: "bearer",
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    user,
  };
}

const json = (status: number, body?: object) =>
  new Response(body ? JSON.stringify(body) : null, { status, headers: { "content-type": "application/json" } });

/** Fake Auth server: only refresh token "r-valid" can be exchanged (once) for a new session "r-new". */
let refreshCalls = 0;
const fakeAuth: typeof fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  const grant = url.searchParams.get("grant_type");
  if (url.pathname === "/auth/v1/token" && grant === "password") return json(200, session(-120, "r-valid"));
  if (url.pathname === "/auth/v1/token" && grant === "refresh_token") {
    refreshCalls++;
    const body = JSON.parse(String(init?.body ?? "{}")) as { refresh_token?: string };
    if (body.refresh_token === "r-valid") return json(200, session(3600, "r-new"));
    return json(400, { code: 400, error: "invalid_grant", error_code: "refresh_token_not_found", msg: "Invalid Refresh Token: Refresh Token Not Found" });
  }
  if (url.pathname === "/auth/v1/user") return json(200, user);
  return json(404, { message: "not mocked" });
};

/** Session cookies exactly as @supabase/ssr writes them, with an access token that is already expired. */
async function expiredSessionCookie(refreshToken: string) {
  const jar = new Map<string, string>();
  const client = createServerClient(SUPABASE_URL, "sb_publishable_test", {
    cookieOptions: supabaseCookieOptions({ NODE_ENV: "production" }),
    global: { fetch: fakeAuth },
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach((c) => (c.options.maxAge === 0 ? jar.delete(c.name) : jar.set(c.name, c.value))),
    },
  });
  const { error } = await client.auth.signInWithPassword({ email: "test@example.test", password: "x" });
  expect(error).toBeNull();
  const cookies = [...jar].filter(([name]) => name.startsWith(COOKIE));
  expect(cookies.length).toBeGreaterThan(0);
  // Swap the refresh token so tests can drive the valid and the revoked case from the same cookie.
  return cookies
    .map(([name, value]) => {
      const decoded = Buffer.from(value.replace(/^base64-/, ""), "base64url").toString("utf8").replace("r-valid", refreshToken);
      return `${name}=base64-${Buffer.from(decoded).toString("base64url")}`;
    })
    .join("; ");
}

function request(path: string, cookie?: string, extra: Record<string, string> = {}) {
  const headers = new Headers({ "x-forwarded-proto": "https", ...extra });
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(new URL(path, SITE), { headers });
}

/** Parsed Set-Cookie headers of the session cookie (name prefix COOKIE). */
function sessionSetCookies(res: Response) {
  return res.headers
    .getSetCookie()
    .filter((c) => c.startsWith(COOKIE))
    .map((raw) => {
      const [pair, ...attrs] = raw.split(";").map((s) => s.trim());
      const eq = pair.indexOf("=");
      const attributes = new Map(attrs.map((a) => {
        const i = a.indexOf("=");
        return i === -1 ? [a.toLowerCase(), ""] : [a.slice(0, i).toLowerCase(), a.slice(i + 1)];
      }));
      return { raw, name: pair.slice(0, eq), value: decodeURIComponent(pair.slice(eq + 1)), attributes };
    });
}

function expectHardened(c: ReturnType<typeof sessionSetCookies>[number]) {
  expect(c.attributes.has("httponly"), `${c.raw} HttpOnly`).toBe(true);
  expect(c.attributes.has("secure"), `${c.raw} Secure`).toBe(true);
  expect(c.attributes.get("samesite")?.toLowerCase(), `${c.raw} SameSite`).toBe("lax");
  expect(c.attributes.get("path"), `${c.raw} Path`).toBe("/");
}

beforeEach(() => {
  refreshCalls = 0;
  vi.stubEnv("SUPABASE_URL", SUPABASE_URL);
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  vi.stubEnv("SITE_URL", SITE);
  vi.stubEnv("NODE_ENV", "production");
  vi.stubGlobal("fetch", fakeAuth);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("proxy redirects keep the session cookies written by updateSession (H-1)", () => {
  it("(a) refreshed session on /login: redirect to / carries the new token cookie", async () => {
    const res = await proxy(request("/login", await expiredSessionCookie("r-valid")));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/");
    expect(refreshCalls).toBe(1);

    const set = sessionSetCookies(res).filter((c) => c.value !== "");
    expect(set.length).toBeGreaterThan(0);
    set.forEach(expectHardened);
    set.forEach((c) => expect(Number(c.attributes.get("max-age"))).toBeGreaterThan(0));
    const stored = set.map((c) => c.value).join("");
    const decoded = Buffer.from(stored.replace(/^base64-/, ""), "base64url").toString("utf8");
    expect(JSON.parse(decoded).refresh_token).toBe("r-new");
  });

  it("(b) revoked refresh token on a protected page: redirect to /login deletes the cookie", async () => {
    const res = await proxy(request("/tasks?x=1", await expiredSessionCookie("r-revoked")));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/tasks?x=1");
    expect(refreshCalls).toBe(1);

    const deleted = sessionSetCookies(res);
    expect(deleted.length).toBeGreaterThan(0);
    deleted.forEach((c) => {
      expect(c.value).toBe("");
      expect(c.attributes.get("max-age")).toBe("0");
      expectHardened(c);
    });
  });

  it("(c) without cookies: redirect to /login sets no session cookie", async () => {
    const res = await proxy(request("/projects"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
    expect(sessionSetCookies(res)).toEqual([]);
    expect(refreshCalls).toBe(0);
  });

  it("(d) every redirect carries the Content-Security-Policy header", async () => {
    const responses = [
      await proxy(request("/login", await expiredSessionCookie("r-valid"))),
      await proxy(request("/tasks", await expiredSessionCookie("r-revoked"))),
      await proxy(request("/projects")),
    ];
    for (const res of responses) {
      expect(res.status).toBe(307);
      expect(res.headers.get("content-security-policy")).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    }
  });
});

describe("proxy matcher and nonce handling (W-1)", () => {
  const matcher = new RegExp(`^${config.matcher[0]}$`);

  it("matcher only skips Next.js build assets and the favicon, not file extensions", () => {
    expect(config.matcher[0]).not.toMatch(/svg|png|jpe?g|gif|webp|txt/);
    for (const path of ["/x.txt", "/robots.txt", "/logo.png", "/tasks/a.svg", "/", "/login", "/favicon.icoX", "/favicon.ico/x", "/_next/staticfoo", "/_next/imagex"]) expect(matcher.test(path), path).toBe(true);
    for (const path of ["/_next/static/chunks/a.js", "/_next/image", "/favicon.ico"]) expect(matcher.test(path), path).toBe(false);
  });

  it("/x.txt without a session is redirected to /login with CSP", async () => {
    const res = await proxy(request("/x.txt"));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/x.txt");
    expect(res.headers.get("content-security-policy")).toContain("'nonce-");
  });

  it("a client-supplied x-nonce header is overwritten with the proxy's nonce", async () => {
    const res = await proxy(request("/login", undefined, { "x-nonce": "attacker", "content-security-policy": "script-src 'nonce-attacker'" }));
    expect(res.status).toBe(200);
    const forwardedNonce = res.headers.get("x-middleware-request-x-nonce");
    const forwardedCsp = res.headers.get("x-middleware-request-content-security-policy");
    expect(forwardedNonce).toBeTruthy();
    expect(forwardedNonce).not.toBe("attacker");
    expect(forwardedCsp).toContain(`'nonce-${forwardedNonce}'`);
    expect(res.headers.get("content-security-policy")).toContain(`'nonce-${forwardedNonce}'`);
  });
});

describe("trustedNonce (root layout)", () => {
  const h = (o: Record<string, string>) => new Headers(o);
  it("returns the nonce only if the request CSP carries it", () => {
    expect(trustedNonce(h({ "x-nonce": "abc123==", "content-security-policy": "script-src 'self' 'nonce-abc123=='" }))).toBe("abc123==");
    expect(trustedNonce(h({ "x-nonce": "abc123==" }))).toBeUndefined();
    expect(trustedNonce(h({ "x-nonce": "abc123==", "content-security-policy": "script-src 'self' 'nonce-other'" }))).toBeUndefined();
    expect(trustedNonce(h({ "x-nonce": "a' 'unsafe-inline", "content-security-policy": "script-src 'nonce-a' 'unsafe-inline'" }))).toBeUndefined();
    expect(trustedNonce(h({}))).toBeUndefined();
  });
});

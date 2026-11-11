import { afterEach, describe, expect, it } from "vitest";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseCookieOptions } from "@/lib/supabase/cookie-options";

/**
 * Drives the real @supabase/ssr client with our cookie options against a fake Supabase Auth
 * server (no network), and records every cookie the library asks us to write.
 */

const URL_ = "https://testproject.supabase.co";
const KEY = "sb_publishable_test";
const COOKIE = "sb-testproject-auth-token";
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");

function jwt(expiresIn: number) {
  const now = Math.floor(Date.now() / 1000);
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "u1", role: "authenticated", aud: "authenticated", exp: now + expiresIn, iat: now })}.sig`;
}

const user = { id: "u1", aud: "authenticated", role: "authenticated", email: "test@example.test", app_metadata: {}, user_metadata: {} };

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

type Written = { name: string; value: string; options: CookieOptions };

function setup(opts: { firstTokenTtl: number }) {
  const calls: string[] = [];
  let refreshCount = 0;
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    calls.push(`${init?.method ?? "GET"} ${url.pathname}?${url.searchParams.get("grant_type") ?? ""}`);
    const json = (status: number, body?: object) =>
      new Response(body ? JSON.stringify(body) : null, { status, headers: { "content-type": "application/json" } });
    if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "password") return json(200, session(opts.firstTokenTtl, "r0"));
    if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "refresh_token") {
      refreshCount++;
      return json(200, session(3600, `r${refreshCount}`));
    }
    if (url.pathname === "/auth/v1/user") return json(200, user);
    if (url.pathname === "/auth/v1/logout") return json(204);
    return json(404, { message: "not mocked" });
  };

  const jar = new Map<string, string>();
  const written: Written[] = [];
  const makeClient = () =>
    createServerClient(URL_, KEY, {
      cookieOptions: supabaseCookieOptions({ NODE_ENV: "production" }),
      global: { fetch: fakeFetch },
      cookies: {
        getAll: () => [...jar].map(([name, value]) => ({ name, value })),
        setAll(cookies) {
          for (const c of cookies) {
            written.push(c);
            if (c.options.maxAge === 0) jar.delete(c.name);
            else jar.set(c.name, c.value);
          }
        },
      },
    });
  return { makeClient, jar, written, calls, refreshes: () => refreshCount };
}

function expectHardened(c: Written, maxAge: number) {
  expect(c.options.httpOnly, `${c.name} httpOnly`).toBe(true);
  expect(c.options.secure, `${c.name} secure`).toBe(true);
  expect(c.options.sameSite, `${c.name} sameSite`).toBe("lax");
  expect(c.options.path, `${c.name} path`).toBe("/");
  expect(c.options.maxAge, `${c.name} maxAge`).toBe(maxAge);
}

const FOUR_HUNDRED_DAYS = 400 * 24 * 60 * 60;

describe("supabaseCookieOptions", () => {
  it("is httpOnly, lax, path / and secure only in production", () => {
    expect(supabaseCookieOptions({ NODE_ENV: "production" })).toEqual({ path: "/", sameSite: "lax", httpOnly: true, secure: true });
    expect(supabaseCookieOptions({ NODE_ENV: "development" }).secure).toBe(false);
    expect(supabaseCookieOptions({ NODE_ENV: "test" }).httpOnly).toBe(true);
  });
});

describe("session cookies written by @supabase/ssr with our options", () => {
  afterEach(() => undefined);

  it("login sets a hardened session cookie (400 days)", async () => {
    const t = setup({ firstTokenTtl: 3600 });
    const { error } = await t.makeClient().auth.signInWithPassword({ email: "test@example.test", password: "x" });
    expect(error).toBeNull();
    const set = t.written.filter((c) => c.name.startsWith(COOKIE) && c.options.maxAge !== 0);
    expect(set.length).toBeGreaterThan(0);
    set.forEach((c) => expectHardened(c, FOUR_HUNDRED_DAYS));
    expect([...t.jar.keys()].some((k) => k.startsWith(COOKIE))).toBe(true);
  });

  it("session restore in a new request reads the cookie and needs no new login", async () => {
    const t = setup({ firstTokenTtl: 3600 });
    await t.makeClient().auth.signInWithPassword({ email: "test@example.test", password: "x" });
    const { data } = await t.makeClient().auth.getSession(); // fresh client = next request
    expect(data.session?.user.id).toBe("u1");
    expect(t.calls.filter((c) => c.includes("grant_type=password") || c.endsWith("?password")).length).toBe(1);
  });

  it("token refresh rewrites the cookie with the same hardened attributes", async () => {
    const t = setup({ firstTokenTtl: 5 }); // expires almost immediately -> refresh on next use
    await t.makeClient().auth.signInWithPassword({ email: "test@example.test", password: "x" });
    const before = t.written.length;
    const { data } = await t.makeClient().auth.getSession();
    expect(t.refreshes()).toBe(1);
    expect(data.session?.refresh_token).toBe("r1");
    const rewritten = t.written.slice(before).filter((c) => c.name.startsWith(COOKIE) && c.options.maxAge !== 0);
    expect(rewritten.length).toBeGreaterThan(0);
    rewritten.forEach((c) => expectHardened(c, FOUR_HUNDRED_DAYS));
  });

  it("password change keeps the session and the cookie attributes", async () => {
    const t = setup({ firstTokenTtl: 3600 });
    await t.makeClient().auth.signInWithPassword({ email: "test@example.test", password: "x" });
    const client = t.makeClient();
    const { error } = await client.auth.updateUser({ password: "new-passw0rd!" });
    expect(error).toBeNull();
    expect(t.calls.some((c) => c.startsWith("PUT /auth/v1/user"))).toBe(true);
    expect((await t.makeClient().auth.getSession()).data.session?.user.id).toBe("u1");
    t.written.filter((c) => c.options.maxAge !== 0).forEach((c) => expectHardened(c, FOUR_HUNDRED_DAYS));
  });

  it("logout deletes the session cookie with Max-Age 0 and the same attributes", async () => {
    const t = setup({ firstTokenTtl: 3600 });
    await t.makeClient().auth.signInWithPassword({ email: "test@example.test", password: "x" });
    const before = t.written.length;
    const { error } = await t.makeClient().auth.signOut();
    expect(error).toBeNull();
    const deleted = t.written.slice(before).filter((c) => c.name.startsWith(COOKIE));
    expect(deleted.length).toBeGreaterThan(0);
    deleted.forEach((c) => {
      expect(c.value).toBe("");
      expectHardened(c, 0);
    });
    expect([...t.jar.keys()].some((k) => k.startsWith(COOKIE))).toBe(false);
  });
});

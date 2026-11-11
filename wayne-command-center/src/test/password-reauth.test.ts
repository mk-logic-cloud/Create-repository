import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * updatePassword (M-3): the current password is required unless the session authenticated within
 * the last 10 minutes (JWT `amr` timestamps). Supabase and the session guard are replaced by fakes.
 */

type AuthError = { code: string; message: string } | null;

const fake = vi.hoisted(() => ({
  claims: null as Record<string, unknown> | null,
  signInError: null as { code: string; message: string } | null,
  updateError: null as { code: string; message: string } | null,
  getClaims: vi.fn(),
  signInWithPassword: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getClaims: fake.getClaims,
      signInWithPassword: fake.signInWithPassword,
      updateUser: fake.updateUser,
      signOut: fake.signOut,
    },
  }),
}));

vi.mock("@/lib/auth", () => ({
  requireUser: async () => ({ id: "u1", email: "test@example.test" }),
}));

const { updatePassword } = await import("@/features/auth/actions");
const { isRecentAuthentication, lastAuthenticatedAt } = await import("@/features/auth/reauth");
const { initialActionState } = await import("@/lib/action-state");

const now = () => Math.floor(Date.now() / 1000);
const amrAgo = (seconds: number) => ({ sub: "u1", amr: [{ method: "password", timestamp: now() - seconds }] });
const NEW_PW = "neuesPasswort123";
const CURRENT_PW = "altesPasswort456";

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  fake.claims = null;
  fake.signInError = null;
  fake.updateError = null;
  fake.getClaims.mockReset().mockImplementation(async () => ({ data: fake.claims ? { claims: fake.claims } : null, error: null }));
  fake.signInWithPassword.mockReset().mockImplementation(async () => ({ data: {}, error: fake.signInError as AuthError }));
  fake.updateUser.mockReset().mockImplementation(async () => ({ data: {}, error: fake.updateError as AuthError }));
  fake.signOut.mockReset().mockImplementation(async () => ({ error: null }));
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

describe("updatePassword reauthentication", () => {
  it("rejects a wrong current password and never calls updateUser", async () => {
    fake.claims = amrAgo(3600);
    fake.signInError = { code: "invalid_credentials", message: "Invalid login credentials" };
    const res = await updatePassword(initialActionState, form({ current_password: "falsch", password: NEW_PW, confirm: NEW_PW }));
    expect(res.status).toBe("error");
    expect(res.message).toBe("Das aktuelle Passwort ist falsch.");
    expect(res.fieldErrors?.current_password?.[0]).toBe("Das aktuelle Passwort ist falsch.");
    expect(fake.signInWithPassword).toHaveBeenCalledWith({ email: "test@example.test", password: "falsch" });
    expect(fake.updateUser).not.toHaveBeenCalled();
    expect(fake.signOut).not.toHaveBeenCalled();
  });

  it("rejects a stale session (amr 1 h ago) without the current password", async () => {
    fake.claims = amrAgo(3600);
    const res = await updatePassword(initialActionState, form({ password: NEW_PW, confirm: NEW_PW }));
    expect(res.status).toBe("error");
    expect(res.fieldErrors?.current_password).toBeDefined();
    expect(fake.signInWithPassword).not.toHaveBeenCalled();
    expect(fake.updateUser).not.toHaveBeenCalled();
  });

  it("treats missing amr data as not fresh", async () => {
    fake.claims = { sub: "u1" };
    const res = await updatePassword(initialActionState, form({ password: NEW_PW, confirm: NEW_PW }));
    expect(res.status).toBe("error");
    expect(fake.updateUser).not.toHaveBeenCalled();

    fake.claims = null; // no claims at all
    const res2 = await updatePassword(initialActionState, form({ password: NEW_PW, confirm: NEW_PW }));
    expect(res2.status).toBe("error");
    expect(fake.updateUser).not.toHaveBeenCalled();
  });

  it("allows a fresh session (amr 2 min ago, e.g. reset link) without the current password", async () => {
    fake.claims = { sub: "u1", amr: [{ method: "password", timestamp: now() - 7200 }, { method: "otp", timestamp: now() - 120 }] };
    const res = await updatePassword(initialActionState, form({ password: NEW_PW, confirm: NEW_PW }));
    expect(res.status).toBe("success");
    expect(fake.signInWithPassword).not.toHaveBeenCalled();
    expect(fake.updateUser).toHaveBeenCalledWith({ password: NEW_PW });
  });

  it("with the correct current password: verifies it, updates and signs out other sessions", async () => {
    fake.claims = amrAgo(3600);
    const res = await updatePassword(initialActionState, form({ current_password: CURRENT_PW, password: NEW_PW, confirm: NEW_PW }));
    expect(res.status).toBe("success");
    expect(fake.signInWithPassword).toHaveBeenCalledWith({ email: "test@example.test", password: CURRENT_PW });
    expect(fake.updateUser).toHaveBeenCalledWith({ password: NEW_PW });
    expect(fake.signOut).toHaveBeenCalledWith({ scope: "others" });
    expect(fake.signInWithPassword.mock.invocationCallOrder[0]).toBeLessThan(fake.updateUser.mock.invocationCallOrder[0]);
    expect(fake.updateUser.mock.invocationCallOrder[0]).toBeLessThan(fake.signOut.mock.invocationCallOrder[0]);
  });

  it("maps reauthentication_needed / reauthentication_not_valid to a clear message", async () => {
    fake.claims = amrAgo(60);
    for (const code of ["reauthentication_needed", "reauthentication_not_valid"]) {
      fake.updateError = { code, message: code };
      const res = await updatePassword(initialActionState, form({ password: NEW_PW, confirm: NEW_PW }));
      expect(res.status).toBe("error");
      expect(res.message).toBe("Bitte melden Sie sich erneut an, um das Passwort zu ändern.");
    }
    expect(fake.signOut).not.toHaveBeenCalled();
  });

  it("keeps the existing messages for same_password and weak_password", async () => {
    fake.claims = amrAgo(60);
    fake.updateError = { code: "same_password", message: "x" };
    expect((await updatePassword(initialActionState, form({ password: NEW_PW, confirm: NEW_PW }))).message).toBe(
      "Das neue Passwort muss sich vom alten unterscheiden.",
    );
    fake.updateError = { code: "weak_password", message: "x" };
    expect((await updatePassword(initialActionState, form({ password: NEW_PW, confirm: NEW_PW }))).message).toBe("Das Passwort ist zu schwach.");
  });

  it("never echoes any password field back, on any failure path", async () => {
    fake.claims = amrAgo(3600);
    fake.signInError = { code: "invalid_credentials", message: "x" };
    const results = [
      await updatePassword(initialActionState, form({ current_password: CURRENT_PW, password: NEW_PW, confirm: NEW_PW })),
      await updatePassword(initialActionState, form({ current_password: CURRENT_PW, password: "kurz", confirm: "anders" })),
      await updatePassword(initialActionState, form({ password: NEW_PW, confirm: NEW_PW })),
    ];
    for (const res of results) {
      expect(res.status).toBe("error");
      const serialized = JSON.stringify(res);
      expect(serialized).not.toContain(CURRENT_PW);
      expect(serialized).not.toContain(NEW_PW);
      expect(res.values ?? {}).not.toHaveProperty("current_password");
    }
  });
});

describe("isRecentAuthentication", () => {
  const t = 1_800_000_000;
  it("uses the latest amr timestamp and a 10 minute window", () => {
    expect(lastAuthenticatedAt({ amr: [{ timestamp: t - 900 }, { timestamp: t - 30 }] })).toBe(t - 30);
    expect(isRecentAuthentication({ amr: [{ method: "password", timestamp: t - 600 }] }, t)).toBe(true);
    expect(isRecentAuthentication({ amr: [{ method: "password", timestamp: t - 601 }] }, t)).toBe(false);
  });
  it("fails closed on missing or malformed data", () => {
    for (const claims of [null, undefined, {}, { amr: "password" }, { amr: [] }, { amr: [{ method: "password" }] }, { amr: [{ timestamp: "1800000000" }] }]) {
      expect(isRecentAuthentication(claims, t)).toBe(false);
    }
    expect(isRecentAuthentication({ amr: [{ timestamp: t + 3600 }] }, t)).toBe(false); // far future
  });
});

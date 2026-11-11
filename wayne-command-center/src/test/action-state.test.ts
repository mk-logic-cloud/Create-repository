import { afterEach, describe, expect, it, vi } from "vitest";
import { echoValues, fail, initialActionState, ok } from "@/lib/action-state";

describe("echoValues", () => {
  it("echoes ordinary string fields", () => {
    const fd = new FormData();
    fd.set("title", "Angebot");
    fd.set("email", "a@example.com");
    expect(echoValues(fd)).toEqual({ title: "Angebot", email: "a@example.com" });
  });

  it("never echoes secret fields", () => {
    const fd = new FormData();
    fd.set("email", "a@example.com");
    fd.set("password", "hunter2-secret");
    fd.set("confirm", "hunter2-secret");
    fd.set("current_password", "old-hunter1-secret");
    const out = echoValues(fd);
    expect(out).toEqual({ email: "a@example.com" });
    expect(out).not.toHaveProperty("password");
    expect(out).not.toHaveProperty("confirm");
    expect(out).not.toHaveProperty("current_password");
    expect(JSON.stringify(out)).not.toContain("old-hunter1-secret");
    expect(JSON.stringify(out)).not.toContain("hunter2-secret");
  });

  it("excludes Next.js internal $ACTION fields", () => {
    const fd = new FormData();
    fd.set("$ACTION_ID_abc123", "");
    fd.set("$ACTION_REF_1", "x");
    fd.set("$ACTION_1:0", '{"id":"abc"}');
    fd.set("name", "Wayne");
    expect(echoValues(fd)).toEqual({ name: "Wayne" });
  });

  it("ignores file entries", () => {
    const fd = new FormData();
    fd.set("attachment", new Blob(["binary"], { type: "text/plain" }), "a.txt");
    fd.set("note", "hi");
    const out = echoValues(fd);
    expect(out).toEqual({ note: "hi" });
    expect(out).not.toHaveProperty("attachment");
  });

  it("truncates values to 10,000 characters", () => {
    const fd = new FormData();
    fd.set("long", "a".repeat(10_050));
    fd.set("exact", "b".repeat(10_000));
    const out = echoValues(fd);
    expect(out.long).toHaveLength(10_000);
    expect(out.exact).toHaveLength(10_000);
  });

  it("returns an empty object for empty form data", () => {
    expect(echoValues(new FormData())).toEqual({});
  });
});

describe("ok / fail", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("initial state is idle", () => {
    expect(initialActionState).toEqual({ status: "idle" });
  });

  it("ok builds a success state with timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-11T10:00:00Z"));
    expect(ok("Gespeichert")).toEqual({
      status: "success",
      message: "Gespeichert",
      at: Date.parse("2026-11-11T10:00:00Z"),
    });
  });

  it("fail builds an error state with field errors and values", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-11T10:00:00Z"));
    const state = fail("Ungültig", { title: ["Pflichtfeld"] }, { title: "" });
    expect(state).toEqual({
      status: "error",
      message: "Ungültig",
      fieldErrors: { title: ["Pflichtfeld"] },
      values: { title: "" },
      at: Date.parse("2026-11-11T10:00:00Z"),
    });
  });

  it("fail without optional arguments leaves them undefined", () => {
    const state = fail("Fehler");
    expect(state.status).toBe("error");
    expect(state.fieldErrors).toBeUndefined();
    expect(state.values).toBeUndefined();
    expect(typeof state.at).toBe("number");
  });

  it("repeated results get distinct timestamps", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const a = fail("x");
    vi.setSystemTime(2000);
    const b = fail("x");
    expect(a.at).not.toBe(b.at);
  });
});

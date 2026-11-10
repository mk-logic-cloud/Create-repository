import { describe, expect, it } from "vitest";
import { addDays, isoWeek, isMonday, startOfIsoWeek, todayInZone, weekRange, zonedMidnightUtc } from "@/lib/dates";
import { isPrivilegedKey } from "@/lib/env";
import { completionRate, projectHealth } from "@/lib/progress";
import { safeNextPath } from "@/lib/safe-redirect";
import { likePattern } from "@/lib/search";

describe("dates", () => {
  it("finds the ISO week start", () => {
    expect(startOfIsoWeek("2026-11-10")).toBe("2026-11-09"); // Tuesday → Monday
    expect(startOfIsoWeek("2026-11-15")).toBe("2026-11-09"); // Sunday → Monday
    expect(startOfIsoWeek("2026-11-09")).toBe("2026-11-09");
    expect(isMonday("2026-11-09")).toBe(true);
  });
  it("handles month/year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(startOfIsoWeek("2027-01-01")).toBe("2026-12-28");
  });
  it("computes local midnight across DST changes", () => {
    expect(zonedMidnightUtc("2026-07-01", "Europe/Berlin").toISOString()).toBe("2026-06-30T22:00:00.000Z");
    expect(zonedMidnightUtc("2026-01-15", "Europe/Berlin").toISOString()).toBe("2026-01-14T23:00:00.000Z");
    expect(zonedMidnightUtc("2026-10-25", "Europe/Berlin").toISOString()).toBe("2026-10-24T22:00:00.000Z");
    expect(zonedMidnightUtc("2026-03-10", "America/New_York").toISOString()).toBe("2026-03-10T04:00:00.000Z");
  });
  it("builds a 7-day week range", () => {
    const r = weekRange("2026-10-19", "Europe/Berlin");
    expect(r.weekEnd).toBe("2026-10-25");
    expect(r.fromUtc).toBe("2026-10-18T22:00:00.000Z");
    expect(r.toUtc).toBe("2026-10-25T23:00:00.000Z"); // DST ended on Oct 25
  });
  it("respects the time zone for today", () => {
    const instant = new Date("2026-11-10T23:30:00Z");
    expect(todayInZone("Europe/Berlin", instant)).toBe("2026-11-11");
    expect(todayInZone("America/Los_Angeles", instant)).toBe("2026-11-10");
  });
  it("computes ISO week numbers", () => {
    expect(isoWeek("2026-01-01")).toBe(1);
    expect(isoWeek("2026-11-09")).toBe(46);
    expect(isoWeek("2027-01-01")).toBe(53);
  });
});

describe("safeNextPath", () => {
  it("allows internal paths only", () => {
    expect(safeNextPath("/tasks?status=open")).toBe("/tasks?status=open");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
  });
});

describe("isPrivilegedKey", () => {
  const jwt = (role: string) => `x.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.y`;
  it("rejects service role and secret keys", () => {
    expect(isPrivilegedKey("sb_secret_abc")).toBe(true);
    expect(isPrivilegedKey(jwt("service_role"))).toBe(true);
  });
  it("accepts publishable and anon keys", () => {
    expect(isPrivilegedKey("sb_publishable_abc")).toBe(false);
    expect(isPrivilegedKey(jwt("anon"))).toBe(false);
  });
});

describe("likePattern", () => {
  it("escapes wildcards", () => {
    expect(likePattern("50%_off")).toBe("%50\\%\\_off%");
  });
});

describe("projectHealth", () => {
  const base = { status: "active" as const, progress: 50, due_date: "2026-12-31", tasks: { total: 4, done: 2, blocked: 0, overdue: 0 }, milestones: [] };
  const today = "2026-11-10";
  it("is on track without issues", () => expect(projectHealth(base, today).level).toBe("on_track"));
  it("is at risk with blocked tasks", () => {
    const h = projectHealth({ ...base, tasks: { ...base.tasks, blocked: 1 } }, today);
    expect(h.level).toBe("at_risk");
    expect(h.reasons[0]).toContain("blockierte");
  });
  it("is at risk close to deadline with low progress", () => {
    expect(projectHealth({ ...base, due_date: "2026-11-20", progress: 30 }, today).level).toBe("at_risk");
  });
  it("is off track when overdue", () => expect(projectHealth({ ...base, due_date: "2026-11-01" }, today).level).toBe("off_track"));
  it("is at risk with overdue milestones", () => {
    expect(projectHealth({ ...base, milestones: [{ due_date: "2026-11-01", completed_at: null }] }, today).level).toBe("at_risk");
  });
  it("handles completed and paused projects", () => {
    expect(projectHealth({ ...base, status: "completed", due_date: "2020-01-01" }, today).level).toBe("done");
    expect(projectHealth({ ...base, status: "on_hold" }, today).level).toBe("paused");
  });
  it("computes completion rate", () => {
    expect(completionRate(0, 0)).toBeNull();
    expect(completionRate(1, 3)).toBe(33);
  });
});

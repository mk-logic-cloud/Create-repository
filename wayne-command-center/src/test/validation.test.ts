import { describe, expect, it } from "vitest";
import {
  agentSchema, decisionSchema, loginSchema, passwordChangeSchema, profileSchema, projectSchema, researchSchema, signupSchema, taskSchema,
} from "@/lib/validation/schemas";

describe("taskSchema", () => {
  it("accepts a minimal task and normalises blanks to null", () => {
    const r = taskSchema.parse({ title: "  Bericht schreiben ", status: "todo", priority: "high", project_id: "", due_date: "", description: " " });
    expect(r).toEqual({ title: "Bericht schreiben", status: "todo", priority: "high", project_id: null, due_date: null, description: null });
  });
  it("rejects empty titles, unknown enums and bad ids", () => {
    const r = taskSchema.safeParse({ title: " ", status: "deleted", priority: "x", project_id: "1; drop table" });
    expect(r.success).toBe(false);
    const keys = Object.keys(r.error!.flatten().fieldErrors);
    expect(keys).toEqual(expect.arrayContaining(["title", "status", "priority", "project_id"]));
  });
  it("enforces length limits", () => {
    expect(taskSchema.safeParse({ title: "x".repeat(201), status: "todo", priority: "low" }).success).toBe(false);
  });
});

describe("projectSchema", () => {
  const base = { name: "Alpha", status: "active", priority: "medium", progress: "40" };
  it("coerces progress and validates range", () => {
    expect(projectSchema.parse(base).progress).toBe(40);
    expect(projectSchema.safeParse({ ...base, progress: "101" }).success).toBe(false);
    expect(projectSchema.safeParse({ ...base, progress: "4.5" }).success).toBe(false);
  });
  it("rejects due date before start date", () => {
    const r = projectSchema.safeParse({ ...base, start_date: "2026-05-10", due_date: "2026-05-01" });
    expect(r.success).toBe(false);
    expect(r.error!.flatten().fieldErrors.due_date).toBeDefined();
  });
});

describe("researchSchema", () => {
  const base = { title: "Markt", status: "draft", confidence: "high" };
  it("parses comma separated tags, deduplicated and lowercased", () => {
    expect(researchSchema.parse({ ...base, tags: "Markt, wettbewerb , markt,," }).tags).toEqual(["markt", "wettbewerb"]);
  });
  it("only allows http(s) URLs", () => {
    expect(researchSchema.safeParse({ ...base, source_url: "javascript:alert(1)" }).success).toBe(false);
    expect(researchSchema.safeParse({ ...base, source_url: "ftp://x.org" }).success).toBe(false);
    expect(researchSchema.parse({ ...base, source_url: "https://example.org/a" }).source_url).toBe("https://example.org/a");
  });
  it("limits tag count", () => {
    const tags = Array.from({ length: 21 }, (_, i) => `t${i}`).join(",");
    expect(researchSchema.safeParse({ ...base, tags }).success).toBe(false);
  });
});

describe("agentSchema", () => {
  it("normalises skill commands", () => {
    expect(agentSchema.parse({ name: "R", status: "active", skill_command: "Deep-Research" }).skill_command).toBe("/deep-research");
  });
  it("rejects shell-like commands", () => {
    expect(agentSchema.safeParse({ name: "R", status: "active", skill_command: "/rm -rf" }).success).toBe(false);
  });
});

describe("decisionSchema", () => {
  it("requires a valid date", () => {
    expect(decisionSchema.safeParse({ title: "A", status: "accepted", decided_at: "" }).success).toBe(false);
    expect(decisionSchema.safeParse({ title: "A", status: "accepted", decided_at: "2026-02-30" }).success).toBe(false);
    expect(decisionSchema.safeParse({ title: "A", status: "accepted", decided_at: "2026-02-28" }).success).toBe(true);
  });
});

describe("auth schemas", () => {
  it("normalises e-mail", () => {
    expect(loginSchema.parse({ email: " Bruce@Wayne.COM ", password: "x" }).email).toBe("bruce@wayne.com");
  });
  it("enforces password policy", () => {
    expect(signupSchema.safeParse({ email: "a@b.de", password: "short1" }).success).toBe(false);
    expect(signupSchema.safeParse({ email: "a@b.de", password: "onlyletters" }).success).toBe(false);
    expect(signupSchema.safeParse({ email: "a@b.de", password: "goodpassw0rd" }).success).toBe(true);
  });
  it("requires matching confirmation", () => {
    expect(passwordChangeSchema.safeParse({ password: "goodpassw0rd", confirm: "goodpassw0rD" }).success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("validates IANA time zones", () => {
    expect(profileSchema.safeParse({ timezone: "Europe/Berlin" }).success).toBe(true);
    expect(profileSchema.safeParse({ timezone: "Mars/Olympus" }).success).toBe(false);
  });
});

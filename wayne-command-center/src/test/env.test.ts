import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl, getSiteUrlProblem, getSupabaseEnv, getSupabaseEnvProblem } from "@/lib/env";

function configure(nodeEnv: "production" | "development", siteUrl?: string) {
  vi.stubEnv("NODE_ENV", nodeEnv);
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  vi.stubEnv("SITE_URL", siteUrl);
}

describe("SITE_URL configuration", () => {
  beforeEach(() => {
    for (const k of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]) {
      vi.stubEnv(k, undefined);
    }
  });
  afterEach(() => vi.unstubAllEnvs());

  it("fails closed in production when SITE_URL is missing", () => {
    configure("production");
    expect(getSiteUrlProblem()).toMatch(/SITE_URL fehlt/);
    expect(getSupabaseEnvProblem()).toMatch(/SITE_URL fehlt/);
    expect(getSupabaseEnv()).toBeNull();
    expect(getSiteUrl()).toBeNull();
  });

  it("rejects non-https or malformed SITE_URL in production", () => {
    for (const bad of ["http://app.example.com", "not a url", "javascript:alert(1)"]) {
      configure("production", bad);
      expect(getSupabaseEnvProblem()).toMatch(/SITE_URL ist keine gültige https-Adresse/);
      expect(getSupabaseEnv()).toBeNull();
    }
  });

  it("accepts an https SITE_URL in production and normalises it to the origin", () => {
    configure("production", "https://app.example.com/");
    expect(getSupabaseEnvProblem()).toBeNull();
    expect(getSupabaseEnv()).toEqual({ url: "https://example.supabase.co", key: "sb_publishable_test" });
    expect(getSiteUrl()).toBe("https://app.example.com");
  });

  it("allows a missing or http SITE_URL in development", () => {
    configure("development");
    expect(getSupabaseEnvProblem()).toBeNull();
    expect(getSupabaseEnv()).not.toBeNull();
    expect(getSiteUrl()).toBeNull(); // origin.ts falls back to the request headers

    configure("development", "http://localhost:3000");
    expect(getSupabaseEnvProblem()).toBeNull();
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("rejects a malformed SITE_URL in development too", () => {
    configure("development", "localhost:3000");
    expect(getSupabaseEnvProblem()).toMatch(/SITE_URL/);
    expect(getSupabaseEnv()).toBeNull();
  });
});

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { EMPTY_STYLE_HASH, SONNER_STYLE_HASH, buildContentSecurityPolicy, generateNonce } from "@/lib/csp";

function directives(policy: string) {
  return new Map(
    policy.split(";").map((d) => {
      const [name, ...values] = d.trim().split(/\s+/);
      return [name, values] as const;
    }),
  );
}

describe("buildContentSecurityPolicy", () => {
  const nonce = "abc123+/==";

  it("builds a strict production policy", () => {
    const policy = buildContentSecurityPolicy({ nonce, isDev: false, isHttps: false });
    const d = directives(policy);
    expect(d.get("default-src")).toEqual(["'self'"]);
    expect(d.get("script-src")).toEqual(["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"]);
    expect(d.get("style-src")).toEqual(["'self'", `'nonce-${nonce}'`, SONNER_STYLE_HASH, EMPTY_STYLE_HASH]);
    expect(d.get("style-src-elem")).toEqual(["'self'", `'nonce-${nonce}'`, SONNER_STYLE_HASH, EMPTY_STYLE_HASH]);
    expect(d.get("style-src-attr")).toEqual(["'unsafe-inline'"]);
    expect(d.get("img-src")).toEqual(["'self'", "data:", "blob:"]);
    expect(d.get("font-src")).toEqual(["'self'"]);
    expect(d.get("connect-src")).toEqual(["'self'"]);
    expect(d.get("object-src")).toEqual(["'none'"]);
    expect(d.get("base-uri")).toEqual(["'self'"]);
    expect(d.get("form-action")).toEqual(["'self'"]);
    expect(d.get("frame-ancestors")).toEqual(["'none'"]);
    expect(d.get("manifest-src")).toEqual(["'self'"]);
    expect(d.get("worker-src")).toEqual(["'self'"]);
    expect(d.has("upgrade-insecure-requests")).toBe(false);
    expect(policy).not.toContain("unsafe-eval");
    expect(d.get("script-src")).not.toContain("'unsafe-inline'");
    expect(d.get("style-src-elem")).not.toContain("'unsafe-inline'");
  });

  it("adds 'unsafe-eval' only in development", () => {
    const d = directives(buildContentSecurityPolicy({ nonce, isDev: true, isHttps: false }));
    expect(d.get("script-src")).toEqual(["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", "'unsafe-eval'"]);
  });

  it("adds upgrade-insecure-requests only over HTTPS", () => {
    const d = directives(buildContentSecurityPolicy({ nonce, isDev: false, isHttps: true }));
    expect(d.get("upgrade-insecure-requests")).toEqual([]);
  });
});

describe("generateNonce", () => {
  it("returns distinct base64 values with at least 128 bits", () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(Buffer.from(a, "base64").length).toBeGreaterThanOrEqual(16);
  });
});

describe("empty stylesheet hash", () => {
  it("is the SHA-256 of the empty string", () => {
    expect(EMPTY_STYLE_HASH).toBe(`'sha256-${createHash("sha256").update("", "utf8").digest("base64")}'`);
  });
});

describe("sonner stylesheet hash", () => {
  it("matches the CSS sonner injects via __insertCSS", () => {
    const file = fileURLToPath(new URL("../../node_modules/sonner/dist/index.mjs", import.meta.url));
    const source = readFileSync(file, "utf8");
    const match = source.match(/__insertCSS\(("(?:[^"\\]|\\.)*")\)/);
    expect(match, "__insertCSS call with a string literal not found in sonner").not.toBeNull();
    const css = JSON.parse(match![1]) as string;
    expect(css.length).toBeGreaterThan(0);
    const hash = `'sha256-${createHash("sha256").update(css, "utf8").digest("base64")}'`;
    expect(hash).toBe(SONNER_STYLE_HASH);
  });
});

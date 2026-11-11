/**
 * Content-Security-Policy for the Wayne Command Center.
 *
 * The browser only talks to this origin (Supabase is reached server-side), so every
 * fetch directive is locked to 'self'. Scripts run only with the per-request nonce
 * ('strict-dynamic' lets Next.js chunks load further chunks). Style elements need the
 * nonce too; the single exception is the stylesheet sonner injects at import time without
 * a nonce, which is allowed by its exact SHA-256 hash. Inline style *attributes* (React
 * `style={…}`, Radix positioning) cannot carry a nonce and are allowed via style-src-attr.
 */

/**
 * SHA-256 (base64) of the CSS string sonner passes to `__insertCSS` (sonner 2.0.8).
 * Guarded by src/test/csp.test.ts, which recomputes it from node_modules/sonner.
 */
export const SONNER_STYLE_HASH = "'sha256-StEaX+se6YS7pqjzrzMIA0KaX9zF/8zAhvQXZAe5epY='";

/**
 * SHA-256 of the empty string. sonner appends its <style> element to <head> *before* filling it,
 * so the browser first evaluates an empty inline stylesheet. Allowing exactly empty content is
 * harmless (it applies no CSS) and removes the CSP violation found in the browser test.
 */
export const EMPTY_STYLE_HASH = "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='";

export type CspOptions = {
  nonce: string;
  isDev: boolean;
  isHttps: boolean;
};

export function buildContentSecurityPolicy({ nonce, isDev, isHttps }: CspOptions): string {
  const n = `'nonce-${nonce}'`;
  const directives = [
    "default-src 'self'",
    `script-src 'self' ${n} 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' ${n} ${SONNER_STYLE_HASH} ${EMPTY_STYLE_HASH}`,
    `style-src-elem 'self' ${n} ${SONNER_STYLE_HASH} ${EMPTY_STYLE_HASH}`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "worker-src 'self'",
  ];
  if (isHttps) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

/** Cryptographically random nonce: 128 bits, base64-encoded. */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * Nonce for rendering, read from the request headers. The protection comes from the proxy: on every
 * path it handles (all pages; see the matcher in src/proxy.ts) it overwrites both `x-nonce` and the
 * request's Content-Security-Policy header. This helper is only a consistency check — it rejects a
 * malformed nonce or one that is not part of the CSP header. It cannot tell a proxy-set pair from a
 * client-sent pair, so it is not a security boundary on paths the proxy skips.
 */
export function trustedNonce(headers: Pick<Headers, "get">): string | undefined {
  const nonce = headers.get("x-nonce");
  const csp = headers.get("content-security-policy");
  if (!nonce || !csp || !/^[A-Za-z0-9+/]+={0,2}$/.test(nonce)) return undefined;
  return csp.includes(`'nonce-${nonce}'`) ? nonce : undefined;
}

"use client";

import { setNonce } from "get-nonce";

/**
 * Hands the per-request CSP nonce to `get-nonce`, which Radix (react-remove-scroll →
 * react-style-singleton) uses for the <style> element it injects when dialogs/sheets open.
 * Runs during render on the client, i.e. before any dialog effect can insert styles.
 * Skipped on the server, where `get-nonce` state would be shared across requests.
 */
export function StyleNonce({ nonce }: { nonce: string | undefined }) {
  if (typeof window !== "undefined" && nonce) setNonce(nonce);
  return null;
}

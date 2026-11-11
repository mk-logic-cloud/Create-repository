import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";
import { supabaseCookieOptions } from "./cookie-options";

/** Per-request Supabase client bound to the user's session cookies. */
export const createClient = cache(async () => {
  // Reading cookies first marks every caller as request-time rendering.
  const cookieStore = await cookies();
  const env = getSupabaseEnv();
  if (!env) throw new Error("Supabase ist nicht konfiguriert.");

  return createServerClient(env.url, env.key, {
    cookieOptions: supabaseCookieOptions(),
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are read-only there. proxy.ts refreshes the session.
        }
      },
    },
  });
});

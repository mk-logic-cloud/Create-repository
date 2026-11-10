import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Validates the session against Supabase Auth (not just the cookie). Cached per request. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

/** Data Access Layer guard — every query and server action goes through this. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name, timezone").eq("id", user.id).maybeSingle();
  return (data as Profile | null) ?? null;
});

/** Authenticated Supabase client for data access. */
export async function db() {
  await requireUser();
  return createClient();
}

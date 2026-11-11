"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { echoValues, fail, ok, type ActionState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { formToObject } from "@/lib/crud";
import { safeNextPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, loginSchema, passwordChangeSchema, signupSchema } from "@/lib/validation/schemas";
import { getOrigin } from "./origin";
import { isRecentAuthentication } from "./reauth";

const fieldErrors = (e: z.ZodError) => z.flattenError(e).fieldErrors as ActionState["fieldErrors"];

const REAUTH_MESSAGE = "Bitte melden Sie sich erneut an, um das Passwort zu ändern.";

function authMessage(code: string | undefined, fallback: string) {
  switch (code) {
    case "invalid_credentials": return "E-Mail oder Passwort ist falsch.";
    case "email_not_confirmed": return "Bitte bestätige zuerst deine E-Mail-Adresse.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit": return "Zu viele Versuche. Bitte warte einen Moment.";
    case "weak_password": return "Das Passwort ist zu schwach.";
    case "same_password": return "Das neue Passwort muss sich vom alten unterscheiden.";
    case "signup_disabled": return "Registrierungen sind derzeit deaktiviert.";
    case "reauthentication_needed":
    case "reauthentication_not_valid": return REAUTH_MESSAGE;
    default: return fallback;
  }
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fail("Bitte die Eingaben prüfen.", fieldErrors(parsed.error), echoValues(formData));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    console.warn("[auth] sign-in failed:", error.code);
    return fail(authMessage(error.code, "Anmeldung fehlgeschlagen."), undefined, echoValues(formData));
  }
  redirect(safeNextPath(formData.get("next")));
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fail("Bitte die Eingaben prüfen.", fieldErrors(parsed.error), echoValues(formData));

  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/`,
      data: { full_name: parsed.data.full_name ?? "" },
    },
  });
  if (error) {
    console.warn("[auth] sign-up failed:", error.code);
    return fail(authMessage(error.code, "Registrierung fehlgeschlagen."), undefined, echoValues(formData));
  }
  // E-mail confirmation disabled in Supabase → session exists immediately.
  if (data.session) redirect("/");
  return ok("Fast geschafft: Bitte bestätige deine E-Mail-Adresse über den Link in deinem Postfach.");
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fail("Bitte die Eingaben prüfen.", fieldErrors(parsed.error), echoValues(formData));

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });
  if (error) console.warn("[auth] reset request failed:", error.code);
  // Same answer either way — prevents account enumeration.
  return ok("Falls ein Konto existiert, wurde ein Link zum Zurücksetzen versendet.");
}

/**
 * Changes the password of the signed-in user. Without a fresh authentication (≤ 10 minutes, from the
 * JWT `amr` claims — this covers the reset-link flow) the current password is required and verified
 * against Supabase Auth first. Afterwards all other sessions are signed out.
 */
export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = passwordChangeSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fail("Bitte die Eingaben prüfen.", fieldErrors(parsed.error), echoValues(formData));

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const fresh = isRecentAuthentication(claimsData?.claims);
  const current = parsed.data.current_password;

  if (!fresh && !current) {
    return fail(
      "Bitte geben Sie Ihr aktuelles Passwort ein.",
      { current_password: ["Aktuelles Passwort ist erforderlich."] },
      echoValues(formData),
    );
  }
  if (current) {
    if (!user.email) return fail(REAUTH_MESSAGE);
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
    if (error) {
      console.warn("[auth] current password check failed:", error.code);
      if (error.code === "invalid_credentials") {
        return fail("Das aktuelle Passwort ist falsch.", { current_password: ["Das aktuelle Passwort ist falsch."] }, echoValues(formData));
      }
      return fail(authMessage(error.code, "Das aktuelle Passwort konnte nicht geprüft werden."), undefined, echoValues(formData));
    }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    console.warn("[auth] password update failed:", error.code);
    return fail(authMessage(error.code, "Passwort konnte nicht geändert werden."), undefined, echoValues(formData));
  }

  const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
  if (signOutError) {
    console.warn("[auth] sign-out of other sessions failed:", signOutError.code);
    return ok("Passwort aktualisiert. Andere Sitzungen konnten nicht abgemeldet werden.");
  }
  return ok("Passwort aktualisiert. Andere Sitzungen wurden abgemeldet; bereits geöffnete Sitzungen enden spätestens mit Ablauf ihres Zugriffstokens.");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { signOut, updatePassword } from "@/features/auth/actions";
import { AuthForm } from "@/features/auth/auth-form";
import { isRecentAuthentication } from "@/features/auth/reauth";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Neues Passwort" };

export default async function ResetPasswordPage() {
  await requireUser();
  // The reset link signs the user in; only within 10 minutes of that may the password be set
  // without the current one (updatePassword enforces the same rule server-side).
  const { data } = await (await createClient()).auth.getClaims();
  const fresh = isRecentAuthentication(data?.claims);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Neues Passwort festlegen</h1>
        <p className="text-sm text-muted-foreground">Mindestens 10 Zeichen, Buchstaben und Ziffern.</p>
      </div>
      {fresh ? (
        <AuthForm
          action={updatePassword}
          submitLabel="Passwort speichern"
          fields={[
            { name: "password", label: "Neues Passwort", type: "password", autoComplete: "new-password" },
            { name: "confirm", label: "Wiederholen", type: "password", autoComplete: "new-password" },
          ]}
        />
      ) : (
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Ihre Anmeldung liegt länger als 10 Minuten zurück. Bitte melden Sie sich erneut an, um das Passwort zu ändern,
              oder ändern Sie es in den Einstellungen mit Ihrem aktuellen Passwort.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2 sm:flex-row">
            <form action={signOut} className="sm:flex-1">
              <Button type="submit" className="w-full">Zur Anmeldung</Button>
            </form>
            <Button asChild variant="outline" className="sm:flex-1"><Link href="/settings">Zu den Einstellungen</Link></Button>
          </div>
        </div>
      )}
      <p className="text-center text-sm"><Link href="/" className="text-primary hover:underline">Weiter zum Dashboard</Link></p>
    </div>
  );
}

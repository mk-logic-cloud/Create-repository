import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signIn } from "@/features/auth/actions";
import { AuthForm } from "@/features/auth/auth-form";
import { safeNextPath } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Anmelden" };

const ERRORS: Record<string, string> = {
  link: "Der Bestätigungslink ist ungültig oder abgelaufen. Bitte erneut anfordern.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = safeNextPath(typeof sp.next === "string" ? sp.next : undefined);
  const error = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Willkommen zurück</h1>
        <p className="text-sm text-muted-foreground">Melden Sie sich an, um fortzufahren.</p>
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <AuthForm
        action={signIn}
        hidden={{ next }}
        submitLabel="Anmelden"
        fields={[
          { name: "email", label: "E-Mail", type: "email", autoComplete: "email" },
          { name: "password", label: "Passwort", type: "password", autoComplete: "current-password" },
        ]}
      />
      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">Passwort vergessen?</Link>
        <Link href="/signup" className="text-primary hover:underline">Konto erstellen</Link>
      </div>
    </div>
  );
}

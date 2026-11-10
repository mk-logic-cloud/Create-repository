import type { Metadata } from "next";
import Link from "next/link";
import { signUp } from "@/features/auth/actions";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = { title: "Registrieren" };

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Konto erstellen</h1>
        <p className="text-sm text-muted-foreground">Ihr persönlicher, abgeschotteter Datenraum.</p>
      </div>
      <AuthForm
        action={signUp}
        hideOnSuccess
        submitLabel="Registrieren"
        fields={[
          { name: "full_name", label: "Name (optional)", type: "text", autoComplete: "name", required: false },
          { name: "email", label: "E-Mail", type: "email", autoComplete: "email" },
          { name: "password", label: "Passwort", type: "password", autoComplete: "new-password", hint: "Mindestens 10 Zeichen, Buchstaben und Ziffern." },
        ]}
      />
      <p className="text-center text-sm text-muted-foreground">
        Bereits registriert? <Link href="/login" className="text-primary hover:underline">Anmelden</Link>
      </p>
    </div>
  );
}

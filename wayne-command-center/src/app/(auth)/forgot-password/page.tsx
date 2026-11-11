import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "@/features/auth/actions";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = { title: "Passwort vergessen" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Passwort zurücksetzen</h1>
        <p className="text-sm text-muted-foreground">Wir senden Ihnen einen sicheren Link.</p>
      </div>
      <AuthForm
        action={requestPasswordReset}
        hideOnSuccess
        submitLabel="Link senden"
        fields={[{ name: "email", label: "E-Mail", type: "email", autoComplete: "email" }]}
      />
      <p className="text-center text-sm"><Link href="/login" className="text-muted-foreground hover:text-foreground">Zurück zur Anmeldung</Link></p>
    </div>
  );
}

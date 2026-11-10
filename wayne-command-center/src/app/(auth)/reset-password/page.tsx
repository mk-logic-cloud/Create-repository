import type { Metadata } from "next";
import Link from "next/link";
import { updatePassword } from "@/features/auth/actions";
import { AuthForm } from "@/features/auth/auth-form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Neues Passwort" };

export default async function ResetPasswordPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Neues Passwort festlegen</h1>
        <p className="text-sm text-muted-foreground">Mindestens 10 Zeichen, Buchstaben und Ziffern.</p>
      </div>
      <AuthForm
        action={updatePassword}
        submitLabel="Passwort speichern"
        fields={[
          { name: "password", label: "Neues Passwort", type: "password", autoComplete: "new-password" },
          { name: "confirm", label: "Wiederholen", type: "password", autoComplete: "new-password" },
        ]}
      />
      <p className="text-center text-sm"><Link href="/" className="text-primary hover:underline">Weiter zum Dashboard</Link></p>
    </div>
  );
}

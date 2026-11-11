import type { Metadata } from "next";
import { LogOut, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfile, requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { signOut } from "@/features/auth/actions";
import { saveProfile } from "@/features/settings/actions";
import { InlineForm } from "@/features/settings/inline-form";
import { PasswordForm } from "@/features/settings/password-form";

export const metadata: Metadata = { title: "Einstellungen" };

const PREFERRED_ZONES = ["Europe/Berlin", "Europe/Vienna", "Europe/Zurich", "Europe/London", "America/New_York", "America/Los_Angeles", "Asia/Dubai", "Asia/Singapore", "UTC"];

export default async function SettingsPage() {
  const [user, profile] = await Promise.all([requireUser(), getProfile()]);
  const tz = profile?.timezone ?? "Europe/Berlin";
  const all = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : PREFERRED_ZONES;
  const zones = [...new Set([...PREFERRED_ZONES, tz, ...all])];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Konto" title="Einstellungen" description="Profil, Zeitzone und Sicherheit." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="space-y-1">
              <CardTitle>Profil</CardTitle>
              <CardDescription>Die Zeitzone bestimmt Fälligkeiten und Wochengrenzen.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <InlineForm
              action={saveProfile}
              submitLabel="Speichern"
              values={{ full_name: profile?.full_name ?? "", timezone: tz }}
              fields={[
                { name: "full_name", label: "Name", type: "text", maxLength: 120, full: true },
                { name: "timezone", label: "Zeitzone", type: "select", required: true, options: zones.map((z) => ({ value: z, label: z.replace(/_/g, " ") })), full: true },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="space-y-1">
              <CardTitle>Passwort</CardTitle>
              <CardDescription>Ändern Sie Ihr Anmeldepasswort.</CardDescription>
            </div>
          </CardHeader>
          <CardContent><PasswordForm /></CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Sitzung & Sicherheit</CardTitle>
              <CardDescription>Ihre Daten sind per Row Level Security ausschließlich Ihrem Konto zugänglich.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">E-Mail</dt><dd>{user.email}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Letzte Anmeldung</dt><dd>{formatDateTime(user.last_sign_in_at ?? null, tz)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Konto erstellt</dt><dd>{formatDateTime(user.created_at, tz)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">E-Mail bestätigt</dt><dd>{user.email_confirmed_at ? "Ja" : "Nein"}</dd></div>
            </dl>
            <form action={signOut}><Button variant="outline" type="submit"><LogOut /> Abmelden</Button></form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

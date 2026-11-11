# Manuelle Schritte (Supabase, SMTP, Vercel)

Diese Schritte brauchen Ihre Zugangsdaten und werden deshalb **nicht** automatisch ausgeführt.
Solange die Konfiguration unvollständig ist, leitet die App auf `/setup` um und nennt dort das Problem.
Bewertung und Prüfprotokoll: [`DEPLOYMENT_READINESS.md`](DEPLOYMENT_READINESS.md).

## 1. Supabase-Projekt

1. Auf supabase.com ein Projekt anlegen (Region **EU / Frankfurt** empfohlen) und ein starkes DB-Passwort im Passwortmanager sichern.
2. Im **SQL Editor** beide Migrationen **in dieser Reihenfolge** ausführen:
   1. `supabase/migrations/20261110000000_init.sql`
   2. `supabase/migrations/20261111000000_security_hardening.sql`

   Alternativ per CLI: `supabase link --project-ref <ref>` und danach `supabase db push`.
3. **Authentication → Providers → Email:** Email aktiviert lassen, „Confirm email“ **an**.
4. **Authentication → URL Configuration:**
   - Site URL: `https://<ihre-domain>`
   - Redirect URLs: **nur exakte Adressen**, keine Wildcards: `https://<ihre-domain>/auth/confirm`, für lokale Entwicklung zusätzlich `http://localhost:3000/auth/confirm`.
5. **Authentication → Passwörter und Sicherheit:**
   - Mindestlänge 10 (die App erzwingt das zusätzlich).
   - „Leaked password protection“ aktivieren (Pro-Plan).
   - **„Secure password change“ aktivieren.** Dann verlangt Supabase für einen Passwortwechsel eine kürzliche Anmeldung. Das schließt Befund A2 aus dem Security-Review.
6. **Administrator-Konto anlegen:** App öffnen, unter `/signup` registrieren, E-Mail bestätigen, anmelden.
7. **Danach Registrierung abschalten:** Authentication → Sign In / Providers → „Allow new users to sign up“ **aus**. Die App ist für einen einzelnen Nutzer gedacht; eine offene Registrierung erlaubt Fremden ein eigenes Konto. Fremde Daten wären durch RLS zwar nicht einsehbar, aber Speicher und E-Mail-Kontingent würden belastet.
8. **Project Settings → API:** Projekt-URL und den **Publishable Key** (`sb_publishable_…`, alternativ den Legacy-`anon`-Key) kopieren. Den **Secret- bzw. Service-Role-Key niemals** verwenden; die App lehnt ihn ab.
9. **Database → Advisors (Security):** Es dürfen keine Tabellen ohne RLS gemeldet werden.

## 2. SMTP (produktiver E-Mail-Versand)

Der eingebaute Versand von Supabase ist nur für Tests gedacht: Er hat ein niedriges Stundenlimit und stellt in der Regel nur an Team-Mitglieder zu.

1. Einen E-Mail-Dienst wählen, z. B. Postmark, Brevo, Amazon SES, Mailjet oder den eigenen Provider. Für den Datenschutz einen Anbieter mit EU-Rechenzentrum und AV-Vertrag bevorzugen.
2. Beim Anbieter die Absender-Domain verifizieren: SPF, DKIM und DMARC als DNS-Einträge.
3. In Supabase unter **Authentication → Emails → SMTP Settings** eintragen:
   - Host und Port: vom Anbieter, meist 587 mit STARTTLS.
   - Benutzername und Passwort bzw. API-Key: **nur in Supabase eintragen, nie ins Repository, nie in `.env`-Dateien der App.** Die App selbst braucht keine SMTP-Zugangsdaten.
   - Absender: z. B. `no-reply@<ihre-domain>`.
4. **Authentication → Rate Limits:** Das E-Mail-Limit an den Anbieter anpassen.
5. Testen: Passwort-Reset unter `/forgot-password` anfordern; die E-Mail muss mit Link auf `https://<ihre-domain>/auth/confirm…` ankommen.

## 3. Vercel

1. Repository in Vercel importieren. **Root Directory: `wayne-command-center`**. Framework: Next.js (wird erkannt).
2. Build-Einstellungen: Standard lassen.
   - Install: `npm ci`
   - Build: `npm run build`
   - Node.js 20.9 oder neuer (empfohlen 22)
   - Eine `vercel.json` ist nicht nötig.
3. **Environment Variables:**

   | Variable | Production | Preview | Inhalt |
   |---|---|---|---|
   | `SUPABASE_URL` | ✅ | ✅ | `https://<ref>.supabase.co` |
   | `SUPABASE_PUBLISHABLE_KEY` | ✅ | ✅ | Publishable/Anon-Key (öffentlich ungefährlich, RLS schützt) |
   | `SITE_URL` | ✅ | ✅ | `https://<ihre-domain>`. **Pflicht** und nur https: ohne diesen Wert zeigt die App in Produktion `/setup` |

   **Empfohlen sind die `SUPABASE_*`-Namen.** Sie werden erst zur Laufzeit gelesen; eine Änderung braucht keinen neuen Build. Die Namen der Vercel-Supabase-Integration (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) funktionieren auch. Next.js schreibt sie aber beim Build fest in die Server-Ausgabe, nicht ins Browser-Bundle (per Canary-Build geprüft).
4. Previews laufen ebenfalls im Produktionsmodus und brauchen daher `SITE_URL`. E-Mail-Links aus Previews führen dann auf die Produktions-Domain. Das ist sicherer als variable Preview-Adressen in der Redirect-Liste.
5. Deploy auslösen. Danach die Domain in Supabase eintragen (Schritt 1.4).
6. Empfohlen: **Deployment Protection** für Previews aktivieren.

## 4. Lokal starten

```bash
cd wayne-command-center
```

```bash
cp .env.example .env.local
```

```bash
npm install
```

```bash
npm run dev
```

Im Entwicklungsmodus darf `SITE_URL` fehlen. `next start` läuft im Produktionsmodus und verlangt `SITE_URL` mit https.

## 5. Qualitätsprüfungen

```bash
npm run check
```

```bash
npm run test:db
```

```bash
npm run build
```

`npm run check` umfasst Typecheck, Lint und Unit-Tests. `npm run test:db` spielt beide Migrationen in ein lokales PostgreSQL (ab Version 15) ein und führt die RLS-Tests aus.

## 6. Optional

- **Typen generieren:** `npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts`
- **Backups/PITR** im Supabase-Plan prüfen.

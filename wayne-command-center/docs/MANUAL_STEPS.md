# Manuelle Schritte (Supabase & Vercel)

Diese Schritte erfordern Ihre Zugangsdaten und wurden deshalb **nicht** automatisch ausgeführt.
Solange die Variablen fehlen, leitet die App auf `/setup` um.

## 1. Supabase-Projekt

1. Auf supabase.com ein Projekt anlegen (Region **EU / Frankfurt** empfohlen), starkes DB-Passwort sichern.
2. **SQL Editor** → Inhalt von `supabase/migrations/20261110000000_init.sql` ausführen.
   Alternativ mit CLI: `supabase link --project-ref <ref>` und `supabase db push`.
3. **Authentication → Providers → Email**: aktiviert lassen, „Confirm email“ **an**.
4. **Authentication → URL Configuration**
   - Site URL: `https://<ihre-domain>` (lokal: `http://localhost:3000`)
   - Redirect URLs: `https://<ihre-domain>/auth/confirm`, `http://localhost:3000/auth/confirm`
     (bei Vercel-Previews zusätzlich `https://*-<team>.vercel.app/auth/confirm`)
5. **Authentication → Policies/Passwords**: Mindestlänge 10 setzen (App erzwingt 10 zusätzlich), „Leaked password protection“ aktivieren (Pro-Plan).
6. Optional **Authentication → Sign In / Up**: Registrierung deaktivieren, sobald Ihr Konto existiert („Allow new users to sign up“ aus) — empfohlen für einen persönlichen Command Center.
7. **Project Settings → API**: Projekt-URL und den **Publishable Key** (`sb_publishable_…`, alternativ Legacy-`anon`) kopieren.
   Den **Secret/Service-Role-Key niemals** verwenden — die App verweigert ihn.
8. Kontrolle im **Database → Advisors (Security)**: Es dürfen keine Tabellen ohne RLS gemeldet werden.

## 2. Lokal starten

```bash
cd wayne-command-center
cp .env.example .env.local   # Werte eintragen
npm install
npm run dev
```

Registrieren unter `http://localhost:3000/signup`, E-Mail bestätigen, anmelden.

## 3. Vercel

1. Repository in Vercel importieren, **Root Directory** `wayne-command-center` wählen (Framework: Next.js).
2. **Environment Variables** (Production + Preview):
   `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SITE_URL=https://<ihre-domain>`
   Alternativ funktionieren die Namen der Vercel-Supabase-Integration (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Deploy auslösen, danach die Domain in Supabase (Schritt 1.4) eintragen.
4. Optional: Vercel **Deployment Protection** für Previews aktivieren.

## 4. Optional

- **Eigener SMTP-Versand** (Supabase → Auth → SMTP): Der eingebaute Versand ist stark limitiert.
- **Typen generieren**: `npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts`.
- **Backups/PITR** im Supabase-Plan prüfen.

## 5. Qualitätsprüfungen

```bash
npm run check     # Typecheck, Lint, Unit-Tests
npm run test:db   # Migration + RLS-Tests gegen lokales Postgres (benötigt PostgreSQL ≥ 15)
npm run build
```

## Testprotokoll (Stand der Übergabe)

| Prüfung | Ergebnis |
|---|---|
| TypeScript strict, ESLint | ✅ fehlerfrei |
| Unit-Tests (Validierung, Datum/Zeitzone, Ampel, Redirect-Schutz, Key-Prüfung) | ✅ 32/32 |
| Migration + RLS-Tests (Isolation zweier Nutzer, Fremd-FK, Spoofing, anon, Constraints) | ✅ bestanden auf PostgreSQL 16 |
| Produktions-Build | ✅ |
| Browser-Smoke-Test (Playwright, gegen lokalen Supabase-Mock): Setup-Umleitung, Login inkl. Fehlerfälle, alle 10 Module, Dialog-Validierung, Filter, Mobile-Navigation, kein horizontaler Überlauf auf iPhone-Größe, Abmelden | ✅ 28/28 |
| Ende-zu-Ende gegen echtes Supabase | ⏳ offen — benötigt Ihr Projekt (Schritte 1–2) |

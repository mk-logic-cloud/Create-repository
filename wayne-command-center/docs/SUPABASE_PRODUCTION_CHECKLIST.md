# Supabase-Produktions-Checkliste (manuell)

Die Schritte führt **nur der Inhaber** aus. Es wurden keine Änderungen an Supabase vorgenommen.
Ausführliche Erklärungen stehen in [`MANUAL_STEPS.md`](MANUAL_STEPS.md).

## A. Projekt und Schema
- [ ] Projekt in Region EU (Frankfurt), DB-Passwort im Passwortmanager
- [ ] SQL Editor: `supabase/migrations/20261110000000_init.sql` ausgeführt
- [ ] SQL Editor: `supabase/migrations/20261111000000_security_hardening.sql` ausgeführt (nach der ersten)

## B. RLS prüfen (SQL Editor, nur lesend)

```sql
-- 1) RLS auf allen Tabellen aktiv: erwartet 9 Zeilen, rls = true
select c.relname as tabelle, c.relrowsecurity as rls, c.relforcerowsecurity as force
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' order by 1;

-- 2) Policies: profiles 2, die anderen 8 Tabellen je 4 (select/insert/update/delete)
select tablename, count(*) as policies from pg_policies
where schemaname = 'public' group by 1 order by 1;

-- 3) anon hat keinen Zugriff: erwartet false
select has_table_privilege('anon', 'public.tasks', 'select') as anon_darf_lesen;

-- 4) Triggerfunktionen nicht per RPC aufrufbar: erwartet nur false
select p.proname, has_function_privilege('authenticated', p.oid, 'execute') as aufrufbar
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' order by 1;
```

- [ ] Ergebnisse wie erwartet
- [ ] **Database → Advisors → Security Advisor:** keine Fehler. Hinweise lesen und bewerten.

## C. Authentifizierung
- [ ] **Authentication → Sign In / Providers → Email:** aktiv, „Confirm email“ an
- [ ] **Secure password change:** an. Passwortwechsel nur nach kürzlicher Anmeldung (Befund A2)
- [ ] Mindestpasswortlänge 10, „Leaked password protection“ an (Pro-Plan)

## D. Produktions-URLs
- [ ] **Authentication → URL Configuration → Site URL:** `https://<ihre-domain>`
- [ ] **Redirect URLs:** nur exakt `https://<ihre-domain>/auth/confirm` (lokal zusätzlich `http://localhost:3000/auth/confirm`), **keine Wildcards**
- [ ] Vercel-Variable `SITE_URL` = dieselbe https-Domain (sonst zeigt die App `/setup`)

## E. SMTP
- [ ] Anbieter gewählt (EU-Rechenzentrum, AV-Vertrag), Absender-Domain mit SPF, DKIM und DMARC verifiziert
- [ ] **Authentication → Emails → SMTP Settings:** Host, Port 587, Zugangsdaten **nur hier**, nie im Repository
- [ ] **Authentication → Rate Limits:** E-Mail-Limit an den Anbieter angepasst
- [ ] Test: `/forgot-password` → E-Mail kommt an, Link zeigt auf `https://<ihre-domain>/auth/confirm…`

## F. Administrator-Konto und Registrierung
- [ ] Unter `https://<ihre-domain>/signup` das eigene Konto anlegen und die E-Mail bestätigen
- [ ] Anmelden, unter **Einstellungen** Name und Zeitzone setzen
- [ ] **Danach: Authentication → Sign In / Providers → „Allow new users to sign up“ AUS**
- [ ] Kontrolle: Eine erneute Registrierung unter `/signup` scheitert mit „Registrierungen sind derzeit deaktiviert.“

## G. Schlüssel
- [ ] In Vercel ausschließlich den **Publishable Key** (`sb_publishable_…`) hinterlegt
- [ ] Secret- bzw. Service-Role-Key nirgends hinterlegt (die App lehnt ihn ab)

## H. Abschluss-Rauchtest auf der Produktionsdomain
- [ ] Login, Aufgabe anlegen, Projekt anlegen, Wochenbericht erstellen, Abmelden
- [ ] Browser-Konsole: keine CSP-Verstöße („Refused to …“)

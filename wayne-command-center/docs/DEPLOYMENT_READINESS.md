# Deployment-Readiness: Wayne Command Center

**Stand:** 11.11.2026 · **Branch:** `claude/wayne-command-center`
**Bewertung: READY WITH LIMITATIONS.** Der Code ist geprüft und gehärtet. Der Betrieb setzt die
manuellen Schritte aus [`MANUAL_STEPS.md`](MANUAL_STEPS.md) voraus. Ein Test gegen ein echtes
Supabase-Projekt steht noch aus.

## 1. Geprüft und bestanden

| Prüfung | Ergebnis | Nachweis |
|---|---|---|
| TypeScript strict, ESLint | ✅ fehlerfrei | `npm run check` |
| Unit-Tests | ✅ 49/49 | Validierung, Datum/Zeitzone, Ampellogik, Redirect-Schutz, Key-Prüfung, `SITE_URL`, `echoValues` |
| Migrationen + RLS-Tests (PostgreSQL 16) | ✅ bestanden | `npm run test:db`; Gegenprobe ohne Härtungsmigration schlägt erwartungsgemäß fehl |
| Produktions-Build | ✅ | `npm run build` |
| Browser-Smoke-Test (Playwright, lokaler Supabase-Mock) | ✅ 28/28 | 11.11.2026, nach der Härtung: Setup-Umleitung, Login-Fehlerfälle, alle 10 Module, Dialog-Validierung, Filter, Mobile, Abmelden |
| Fail-closed ohne `SITE_URL` (Produktionsmodus) | ✅ | `/tasks` leitet mit 307 auf `/setup` um; dort steht „SITE_URL fehlt (in Produktion erforderlich).“ |
| Secrets im Client-Bundle | ✅ 0 Treffer | Canary-Build mit Testwerten, Suche in `.next/static` |
| Secrets in Git-Historie | ✅ 0 Treffer | Musterprüfung aller Branches |
| Security-Review (`red-team-auditor`) | ✅ Freigabe mit Auflagen; Auflagen umgesetzt bzw. hier dokumentiert | siehe Abschnitt 3 |

## 2. Supabase

| Thema | Umsetzung | Art |
|---|---|---|
| Authentifizierung | E-Mail und Passwort mit Bestätigung. `proxy.ts` prüft per `getClaims`, die Datenzugriffsschicht per `getUser` (vom Auth-Server validiert) | Code |
| Row Level Security | Auf allen 9 Tabellen. Zugriff nur auf eigene Zeilen (`owner_id = auth.uid()`); anon hat keinen Zugriff. Composite-FKs verhindern Verweise auf fremde Datensätze | **Datenbank (technisch erzwungen)** |
| Datenbankzugriffe | Nur serverseitig (Server Components und Actions), nur mit Publishable Key. IDs werden per Zod als UUID validiert, `owner_id` setzt die Datenbank | Code |
| Kein Secret im Frontend | Server-Module mit `server-only`; Service- und Secret-Keys werden abgelehnt | Code + Canary-Test |
| Registrierung abschalten | Nach Anlage des Administrator-Kontos in Supabase | **manuell**, `MANUAL_STEPS.md` 1.7 |
| Secure password change | Supabase-Einstellung (Befund A2) | **manuell**, `MANUAL_STEPS.md` 1.5 |
| Redirect-URLs | nur exakte Adressen, keine Wildcards | **manuell**, `MANUAL_STEPS.md` 1.4 |

## 3. Befunde aus dem Security-Review

| # | Befund | Status |
|---|---|---|
| A1 (mittel) | Host-Header als Ursprung für E-Mail-Links | ✅ behoben: `SITE_URL` ist in Produktion Pflicht (nur https), sonst `/setup` |
| A2 (mittel) | Passwortwechsel ohne erneute Anmeldung | ⚙️ durch die Supabase-Einstellung „Secure password change“ (manuell) |
| A3 (niedrig) | Triggerfunktionen für PUBLIC ausführbar | ✅ behoben: EXECUTE entzogen, Trigger getestet |
| A4 (niedrig) | ungültige Zeitzone legt eigene Seiten lahm | ✅ behoben: Prüfung in der Datenbank und Fallback im Code |
| A5 (niedrig) | `completed_at` direkt setzbar | ✅ behoben: Trigger leitet den Wert bei jedem Schreiben aus dem Status ab |
| A6 (niedrig) | keine Content-Security-Policy | ⏳ offen, siehe bekannte Einschränkungen |
| A7 (Info) | FORCE RLS auf `profiles`, Testlücken | ✅ Testlücken geschlossen. FORCE bewusst nicht gesetzt: Der Sign-up-Trigger (SECURITY DEFINER) könnte sonst auf Supabase blockiert werden |

## 4. Vercel

- Root Directory: `wayne-command-center`. Framework Next.js 16, Build `npm run build`, Install `npm ci`.
- Node.js ab 20.9 (Feld `engines` in `package.json`). Eine `vercel.json` ist nicht nötig.
- Umgebungsvariablen: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SITE_URL` (für Production und Preview).
- Der Build braucht keine Umgebungsvariablen. Alle Seiten werden zur Laufzeit gerendert.
- Sicherheits-Header: `X-Frame-Options DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS.

## 5. SMTP

Produktiver Versand nur über eigenes SMTP, eingetragen in Supabase (`MANUAL_STEPS.md` Abschnitt 2).
Die App selbst kennt keine SMTP-Zugangsdaten. Im Repository sind keine Zugangsdaten hinterlegt.

## 6. Bekannte Einschränkungen

1. **Kein Test gegen ein echtes Supabase-Projekt.** Registrierung, E-Mail-Links und der
   Sign-up-Trigger sind nur lokal (Postgres mit Auth-Stub) und per Mock getestet.
2. **Keine Content-Security-Policy (A6).** Es gibt bekannte XSS-Vektoren nicht (kein
   `dangerouslySetInnerHTML`, URLs nur http(s)). Eine nonce-basierte CSP ist eine sinnvolle Erweiterung.
3. **Kein Rate-Limit für Server Actions.** Für ein Einzelnutzer-System vertretbar. Die
   Anmeldelimits setzt Supabase.
4. `SECRET_FIELDS` (Felder, die nach fehlgeschlagenen Formularen nie zurückgegeben werden) ist eine
   feste Liste (`password`, `confirm`). Neue Passwortfelder müssen dort ergänzt werden.
5. Der Browser-Smoke-Test lief gegen einen lokalen Supabase-Mock. Ein Lauf auf einem
   Staging-Projekt mit echtem Supabase steht aus.

## 7. Go-Live-Checkliste (durch den Inhaber)

- [ ] Supabase-Projekt angelegt, beide Migrationen ausgeführt, Security Advisor ohne Befund
- [ ] Redirect-URLs exakt, „Confirm email“ an, „Secure password change“ an
- [ ] SMTP eingerichtet und getestet
- [ ] Vercel: Root Directory, drei Umgebungsvariablen, Deploy erfolgreich
- [ ] Administrator-Konto angelegt, danach Registrierung abgeschaltet
- [ ] Rauchtest auf der Produktionsdomain: Login, Aufgabe anlegen, Wochenbericht erstellen, Abmelden

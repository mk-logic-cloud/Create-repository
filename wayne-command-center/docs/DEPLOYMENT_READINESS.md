# Deployment-Readiness: Wayne Command Center

**Stand:** 11.11.2026 · **Branch:** `claude/wayne-command-center`
**Bewertung: READY WITH LIMITATIONS.** Der Code ist geprüft und gehärtet. Der Betrieb setzt die
manuellen Schritte aus [`MANUAL_STEPS.md`](MANUAL_STEPS.md) voraus. Ein Test gegen ein echtes
Supabase-Projekt steht noch aus.

## 1. Geprüft und bestanden

| Prüfung | Ergebnis | Nachweis |
|---|---|---|
| TypeScript strict, ESLint | ✅ fehlerfrei | `npm run check`; in CI als Check `app` (`.github/workflows/app-ci.yml`) |
| Unit-Tests | ✅ 79/79 | Validierung, Datum/Zeitzone, Ampellogik, Redirect-Schutz, Key-Prüfung, `SITE_URL`, `echoValues`, CSP inkl. Hash-Wächter für sonner |
| Migrationen + RLS-Tests (PostgreSQL 16) | ✅ bestanden | `npm run test:db`; Gegenprobe ohne Härtungsmigration schlägt erwartungsgemäß fehl |
| Produktions-Build | ✅ | `npm run build` |
| Browser-Smoke-Test (Playwright, lokaler Supabase-Mock) mit CSP | ✅ 34/34 | 11.11.2026: Setup-Umleitung, Login-Fehlerfälle, alle 10 Module, Dialog, Toast, Filter, Mobile-Navigation, Abmelden, **0 CSP-Verstöße im Browser**, alle 14 Script-Tags mit Request-Nonce, Nonce pro Request neu |
| CSP-Wirksamkeit (Negativtest) | ✅ | Eingeschleuste Event-Handler, `javascript:`-iframe und `<style>` werden blockiert. Kontrolllauf ohne CSP-Header: derselbe Angriff wird ausgeführt |
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
| Session-Cookies | `HttpOnly`, `Secure` (Produktion), `SameSite=Lax`, `Path=/`, zentral in `src/lib/supabase/cookie-options.ts`; Löschung beim Logout mit `Max-Age=0` und denselben Attributen. Getestet per Unit-Test mit der echten `@supabase/ssr`-Bibliothek und im Browser (`document.cookie` enthält keinen Token) | Code |
| Kein Secret im Frontend | Server-Module mit `server-only`; Service- und Secret-Keys werden abgelehnt | Code + Canary-Test |
| Registrierung abschalten | Nach Anlage des Administrator-Kontos in Supabase | **manuell**, `MANUAL_STEPS.md` 1.7 |
| Secure password change | Supabase-Einstellung (Befund A2) | **manuell**, `MANUAL_STEPS.md` 1.5 |
| Redirect-URLs | nur exakte Adressen, keine Wildcards | **manuell**, `MANUAL_STEPS.md` 1.4 |

## 2a. Content-Security-Policy

Gesetzt in `src/proxy.ts` für jede HTML-Antwort, Redirects und `/setup` eingeschlossen. Der Nonce ist pro Request
neu (128 Bit, Web Crypto). Policy (Produktion über HTTPS):

```
default-src 'self'; script-src 'self' 'nonce-…' 'strict-dynamic';
style-src 'self' 'nonce-…' <sonner-hash> <leer-hash>; style-src-elem 'self' 'nonce-…' <sonner-hash> <leer-hash>;
style-src-attr 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self';
object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
manifest-src 'self'; worker-src 'self'; upgrade-insecure-requests
```

| Entscheidung | Begründung |
|---|---|
| Skripte nur mit Nonce + `strict-dynamic`; **kein** `unsafe-inline`, in Produktion **kein** `unsafe-eval` | Next.js versieht alle eigenen Skripte mit dem Nonce |
| `connect-src 'self'` | Der Browser spricht nie direkt mit Supabase; alle Zugriffe laufen serverseitig |
| `<style>`-Elemente nur mit Nonce oder exaktem Hash | Radix erhält den Nonce über `get-nonce`. sonner fügt sein CSS ohne Nonce ein und ist über den SHA-256 des CSS erlaubt. Ein Unit-Test berechnet den Hash aus `node_modules/sonner` neu und schlägt bei Updates fehl |
| Hash des leeren Strings | sonner hängt das `<style>`-Element zuerst leer an. Das zeigte erst der Browser-Test. Leerer Inhalt wirkt nicht |
| `style-src-attr 'unsafe-inline'` | **Verbleibende Einschränkung:** React-`style`-Attribute (Fortschrittsbalken, Toasts, Radix-Positionierung) können keinen Nonce tragen. Risiko: CSS-Injection über Attribute bei einer HTML-Injection. Keine Skriptausführung |
| Alle Seiten dynamisch (`connection()` im Root-Layout) | Nonces erfordern Rendering pro Request. Die Seiten waren ohnehin nutzerspezifisch |
| `'unsafe-eval'` nur in `next dev` | React braucht das im Entwicklungsmodus für Fehler-Stacktraces |

## 3. Befunde aus dem Security-Review

| # | Befund | Status |
|---|---|---|
| A1 (mittel) | Host-Header als Ursprung für E-Mail-Links | ✅ behoben: `SITE_URL` ist in Produktion Pflicht (nur https), sonst `/setup` |
| A2 (mittel) | Passwortwechsel ohne erneute Anmeldung | ⚙️ durch die Supabase-Einstellung „Secure password change“ (manuell) |
| A3 (niedrig) | Triggerfunktionen für PUBLIC ausführbar | ✅ behoben: EXECUTE entzogen, Trigger getestet |
| A4 (niedrig) | ungültige Zeitzone legt eigene Seiten lahm | ✅ behoben: Prüfung in der Datenbank und Fallback im Code |
| A5 (niedrig) | `completed_at` direkt setzbar | ✅ behoben: Trigger leitet den Wert bei jedem Schreiben aus dem Status ab |
| A6 (niedrig) | keine Content-Security-Policy | ✅ behoben: Nonce-basierte CSP pro Request (siehe Abschnitt 2a), im Browser verifiziert |
| A7 (Info) | FORCE RLS auf `profiles`, Testlücken | ✅ Testlücken geschlossen. FORCE bewusst nicht gesetzt: Der Sign-up-Trigger (SECURITY DEFINER) könnte sonst auf Supabase blockiert werden |
| H-1 (hoch) | Redirects im Proxy verwerfen erneuerte bzw. gelöschte Session-Cookies | ✅ behoben: `redirectWithSession` (`src/lib/supabase/proxy.ts`) kopiert alle Cookies samt Attributen; Test `src/test/proxy-redirect-cookies.test.ts` |
| M-1 (mittel) | `authenticated` hat TRUNCATE/REFERENCES/TRIGGER und darf `owner_id`/`created_at` schreiben | ✅ behoben (Migration `20261112000000`): Rechte neu vergeben, INSERT/UPDATE nur auf fachliche Spalten, Default-Privileges ohne TRUNCATE/REFERENCES/TRIGGER; DB-Tests |
| M-2 (mittel) | keine DB-Grenzen für `metrics`, Tag-Länge, `milestones.completed_at` | ✅ behoben (Migration `20261112000000`): CHECKs (Objekt, ≤ 64 KB; Tags 1–40 Zeichen) und Trigger setzt `completed_at` serverseitig |
| M-3 / W-2 (mittel) | Passwortwechsel ohne erneute Authentifizierung | ✅ behoben im Code: aktuelles Passwort Pflicht, außer die Anmeldung ist ≤ 10 Min. alt (`amr`-Zeitstempel); danach Abmeldung aller anderen Sitzungen. Die Supabase-Einstellung „Secure password change“ (A2) bleibt empfohlen |
| W-1 (niedrig) | Proxy-Matcher lässt Pfade mit Dateiendungen ohne Auth-Check und CSP durch | ✅ behoben: Matcher schließt nur `_next/static`, `_next/image`, `favicon.ico` aus; Root-Layout nutzt den Nonce nur, wenn die Request-CSP ihn enthält |

## 4. Vercel

> **Wichtige Feststellung (11.11.2026):** Mit dem Repository ist bereits ein Vercel-Projekt `create-repository`
> verbunden. Vercel erstellt für **jeden Push auf einen PR-Branch automatisch eine Preview-Deployment**
> (Kommentare von `vercel[bot]` in PR #2 und PR #3). Das Projekt hat **kein Root Directory**
> (`rootDirectory: null`) und baut daher das Repository-Wurzelverzeichnis (die vorhandene `index.html`), nicht
> diese App. **Ein Merge auf `main` löst dort ein Production-Deployment aus.**
> Vor einem Merge entscheiden: Projekt auf Root Directory `wayne-command-center` umstellen (dann muss
> `SITE_URL` usw. gesetzt sein, sonst zeigt Produktion `/setup`), ein separates Projekt anlegen oder
> automatische Deployments vorübergehend deaktivieren (Project Settings → Git → „Ignored Build Step“).
>
> **Vorbereitet:** Die Repository-Wurzel erhält eine `vercel.json` mit `git.deploymentEnabled: false`. Damit
> deployt das bestehende Projekt nicht mehr aus Git. Für die App wird ein **eigenes** Vercel-Projekt empfohlen:
> Root Directory `wayne-command-center`, „Only build if there are changes“, „Auto-assign Custom Production
> Domains“ aus (Production nur per Promote), getrennte Staging- und Produktionsvariablen. Details:
> `docs/wayne-protocol/DEPLOYMENT_ISOLATION.md` im Wayne-Protocol-PR.


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
2. **CSP-Restpunkt:** `style-src-attr 'unsafe-inline'` bleibt nötig (siehe 2a). Es gibt keinen
   CSP-Report-Endpunkt; Verstöße sind nur in der Browser-Konsole sichtbar.
3. **Kein Rate-Limit für Server Actions.** Für ein Einzelnutzer-System vertretbar. Die
   Anmeldelimits setzt Supabase.
4. `SECRET_FIELDS` (Felder, die nach fehlgeschlagenen Formularen nie zurückgegeben werden) ist eine
   feste Liste (`password`, `confirm`, `current_password`). Neue Passwortfelder müssen dort ergänzt werden.
5. Der Browser-Smoke-Test lief gegen einen lokalen Supabase-Mock. Ein Lauf auf einem
   Staging-Projekt mit echtem Supabase steht aus.

## 7. Go-Live-Checkliste (durch den Inhaber)

- [ ] [`SUPABASE_PRODUCTION_CHECKLIST.md`](SUPABASE_PRODUCTION_CHECKLIST.md) vollständig abgehakt
- [ ] Supabase-Projekt angelegt, alle drei Migrationen ausgeführt, Security Advisor ohne Befund
- [ ] Redirect-URLs exakt, „Confirm email“ an, „Secure password change“ an
- [ ] SMTP eingerichtet und getestet
- [ ] Vercel: Root Directory, drei Umgebungsvariablen, Deploy erfolgreich
- [ ] Administrator-Konto angelegt, danach Registrierung abgeschaltet
- [ ] Vercel-Projekt: Root Directory `wayne-command-center` (bestehendes Projekt baut sonst die Wurzel)
- [ ] Rauchtest auf der Produktionsdomain: Login, Aufgabe anlegen, Wochenbericht erstellen, Abmelden; Konsole ohne CSP-Verstöße

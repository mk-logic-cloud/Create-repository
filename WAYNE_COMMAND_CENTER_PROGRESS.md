# WAYNE COMMAND CENTER – Fortschritt (zentrale Fortsetzungsdatei)

**Zweck:** Ein neuer Claude-Aufruf liest **nur diese Datei** und arbeitet ohne erneute Gesamtanalyse weiter. Nach jedem Arbeitspaket aktualisieren.

Stand: 12.11.2026 (nach P2/P3-Vorbereitung) · Branch `claude/nice-pascal-gknlav` (Basis `main` = `d0c4925`) · Produkt: privates Command Center für **einen** Eigentümer.

## 1. Aktueller Stand in einem Satz

Die App ist **lokal vollständig bedienbar** (alle 10 Module, Desktop und iPhone-Ansicht, Speichern im Arbeitsspeicher) über `npm run demo` mit synthetischen Daten. Es gibt **noch keine Cloud-Vorschau** und **keine Produktionsreife**.

## 2. Was funktioniert (belegt)

| Bereich | Stand | Nachweis (letzter erfolgreicher Lauf) |
|---|---|---|
| 10 Module: Dashboard, Aufgaben, Projekte, Abteilungen, Research, Entscheidungen, Agenten, Fortschritt, Wochenberichte, Einstellungen | vorhanden, mit Anlegen/Bearbeiten/Löschen per Server Actions | Browsertest P1, 12.11.2026: 27/27 |
| Login, geschützte Routen, Abmelden | vorhanden (Supabase Auth, `src/proxy.ts`) | P1: Umleitung auf Login, falsches Passwort abgewiesen |
| Responsive (iPhone 13) | kein horizontales Scrollen auf allen 10 Seiten | P1: 10/10, Überstand 0 px |
| Sicherheitsheader / CSP | Nonce-CSP, 0 Browserfehler im Produktionsmodus | P1 |
| Datenbank-Migrationen + RLS | 3 Migrationen, RLS „nur eigene Zeilen“ | `npm run test:db` am 12.11.2026 bestanden |
| Typprüfung, Lint, Unit-Tests | fehlerfrei; 79/79 | `npm run check` am 12.11.2026 (P1) |

## 3. Lokale Vorschau (für den Eigentümer)

Voraussetzung: Node.js 22, Git. **Nur dieser Rechner** (bindet an 127.0.0.1), synthetische Daten, nichts wird gespeichert.

```bash
cd wayne-command-center
```
```bash
npm ci
```
```bash
npm run demo:build
```
Danach öffnen: `http://localhost:3000` in **Chrome oder Firefox** · Anmeldung: `demo@wayne.local` / `demo-wayne-2026` · Beenden: Strg+C. Später reicht `npm run demo`.

- Die Demo nutzt eine **Attrappe** statt Supabase (`scripts/demo/mock-supabase.mjs`): keine echte Anmeldung, kein RLS, keine Mails, Registrierung und Passwort-Wiederherstellung absichtlich deaktiviert. **Kein Sicherheitsnachweis.** Wird nie deployt (liegt unter `scripts/`, nicht im Build).
- Safari: `Secure`-Cookies über `http://localhost` UNBESTÄTIGT → Chrome/Firefox verwenden.
- **Smartphone:** lokal nicht vorgesehen (die Demo ist absichtlich nur auf diesem Rechner erreichbar; Produktionsmodus braucht HTTPS für Cookies). Smartphone erst über die private Cloud-Vorschau S-0.

## 4. Was lokal und was nur in der Cloud geht (Kontingent)

| Aufgabe | Wo | Verbraucht Claude-Kontingent? |
|---|---|---|
| App lokal benutzen (`npm run demo`) | Rechner des Eigentümers | **nein** |
| `npm run check`, `npm run test:db`, `npm run build` | Rechner des Eigentümers oder Claude-Sitzung | nur, wenn Claude es ausführt |
| Code ändern, Tests auswerten, Dokumente schreiben | Claude-Sitzung | ja |
| Supabase-/Vercel-Projekte anlegen, Dashboard-Nachweise (D1, M2, P1–P8) | nur Eigentümer (Claude hat keinen Zugang) | nein |
| Unabhängige Audits (`red-team-auditor`) | Claude-Sitzung | ja, deutlich – nur bei Anlass |

Weitere Sparmöglichkeiten werden **nicht** behauptet, solange sie nicht belegt sind.

## 5. Was fehlt / blockiert

| Ziel | Blockiert durch | Wer |
|---|---|---|
| Private Cloud-Vorschau S-0 (iPhone + Laptop, HTTPS) | Checkliste P1–P8 (§8) (M2, D4, Kosten, Vercel-Schutz, „Auto Confirm User“) | **Eigentümer** |
| Speichern mit echtem Backend | separates Staging-Supabase-Projekt (nach P1–P8) | Eigentümer legt an, Claude begleitet |
| Produktivbetrieb mit echten Daten | Phase-1-Sicherheit (MFA/AAL2, Datenbremse, Hook) nicht umgesetzt; offene Befunde NF-29, NF-43, NF-55, NF-58, NF-73, NF-82, NF-83, NF-84; Audit v3.11 ausstehend | Implementierungsfreigabe des Eigentümers |

**Die Vorschau ist nie produktionsreif**, solange diese Nachweise fehlen.

## 6. Sicherheitsunterlagen

Vertrauliche Sicherheitsunterlagen (Pläne, Audits, Prüfnachweise) werden **ausschließlich offline beim Eigentümer** aufbewahrt (Entscheidung des Eigentümers vom 12.11.2026). Sie gehören nicht in dieses Repository, nicht in ein anderes Repository und nicht in einen Cloud-Speicher. Neue vertrauliche Berichte werden ebenso behandelt. Für eine Fortsetzung stellt der Eigentümer die benötigten Unterlagen bereit.

## 7. Arbeitspakete

| Paket | Ziel | Status | Checkpoint |
|---|---|---|---|
| **P1** | Lokale Vorschau mit einem Befehl, synthetische Daten, Speichern im Speicher; Fortschrittsdatei | **erledigt** | Commit „P1: lokale Demo …“ auf `claude/nice-pascal-gknlav` |
| P2 | UI-Feinschliff nach Rückmeldung des Eigentümers aus der lokalen Demo | offen – wartet auf Rückmeldung | – |
| P3a | Sicherung der Sicherheitsunterlagen | **erledigt**: offline beim Eigentümer (§6) | Commit „P3a/P3b …“ |
| P3b | S-0 vorbereiten: Checkliste P1–P8 und Vorschau-Plan (§8, §9) | **erledigt** (nur Dokumentation) | Commit „P3a/P3b …“ |
| P3c | S-0 umsetzen | **gesperrt** bis P1–P8 erfüllt **und** ausdrückliche Freigabe für Supabase/Vercel | – |
| P4 | Phase-1-Sicherheit umsetzen | gesperrt bis Audit v3.11 + Implementierungsfreigabe | – |

### P1 – Protokoll

1. **Ziel:** frühestmögliche lokale Nutzung ohne externe Infrastruktur.
2. **Dateien:** `wayne-command-center/scripts/demo/mock-supabase.mjs` (neu), `wayne-command-center/scripts/demo/preview.mjs` (neu), `wayne-command-center/package.json` (Skripte `demo`, `demo:build`), `WAYNE_COMMAND_CENTER_PROGRESS.md` (neu). **App-Code (`src/`) unverändert.**
3. **Änderungen:** Attrappe mit Lesen/Anlegen/Ändern/Löschen im Speicher, festen Demo-Zugangsdaten, nur 127.0.0.1; Startskript für Produktionsbuild mit Demo-Variablen (entfernt echte Supabase-Variablen aus der Umgebung).
4. **Tests:** `npm run check` (Typprüfung, Lint, 79/79 Unit-Tests) bestanden; Browsertest 27/27 (Login, falsches Passwort, 10 Module Desktop, Aufgabe anlegen und nach Neuladen sichtbar, 0 Browserfehler, 10 Module iPhone ohne Querscrollen).
5. **Ergebnis:** lokal vollständig bedienbar.
6. **Offen:** Rückmeldung des Eigentümers zur Oberfläche (P2); Checkliste P1–P8 (P3); Entscheidung über Übernahme der Sicherheitsunterlagen ins Repository.
7. **Checkpoint:** siehe Git-Log.
8. **Fortsetzung:** siehe §11.

## 8. S-0 – Checkliste P1–P8 (nur offene Voraussetzungen)

Status am 12.11.2026: **P1 erfüllt; P2–P8 offen.** Nachweise jeweils als Bildschirmfoto **ohne** Adressen, Schlüssel oder Passwörter. Aufwand = geschätzte Zeit des Eigentümers (Schätzung).

| # | Anforderung | Status | Nachweis | Entscheidung des Eigentümers | Aufwand |
|---|---|---|---|---|---|
| P1 | MFA aktiv auf Postfach, Supabase, GitHub, Vercel | **erfüllt** (Selbstauskunft des Eigentümers, 12.11.2026): Gmail = SMS-2FA **und** Passkey; Supabase = Passwort + TOTP (Authenticator-App); GitHub = MFA aktiv; Vercel = MFA aktiv | Selbstauskunft; keine Bildschirmfotos im Repository | Empfehlung: bei GitHub und Vercel ebenfalls App oder Passkey statt SMS, falls SMS genutzt wird | erledigt |
| P2 | Postfach ohne fremde Weiterleitungen, Filter, Delegationen, App-Passwörter, Wiederherstellungsadressen | offen | Bildschirmfoto | bei Fund: zuerst bereinigen | 10 min |
| P3 | Nur bekannte Mitglieder in Supabase und Vercel; bei GitHub keine unbekannten Tokens, SSH-Schlüssel oder OAuth-Apps | offen | Bildschirmfotos | – | 10 min |
| P4 | Weiteres Free-Projekt möglich (aktive Free-Projekte aller Owner/Admins der Ziel-Organisation) | offen | Zahl + Bildschirmfoto | sonst Pro-Projekt (≈ 10 USD/Monat, E17) oder Pausieren eines Projekts | 5 min |
| P5 | Vercel-Tarif bekannt; „Vercel Authentication“ als Deployment Protection verfügbar | offen | Bildschirmfoto (nur ansehen) | Hobby (laut Vercel nur nicht-kommerziell, UNBESTÄTIGT) oder Pro | 5 min |
| P6 | Kosten: 0 USD bestätigt oder Kosten freigegeben | offen | Ihre Zeile | Kostenfreigabe E17 | 2 min |
| P7 | Supabase-Dashboard bietet „Add user → Create new user“ mit „Auto Confirm User“ (sonst wäre eine offene Registrierung nötig) | offen | Bildschirmfoto des Dialogs (in einem bestehenden Projekt nur ansehen) | wenn nicht vorhanden: STOPP und Rückfrage | 5 min |
| P8 | Einmaliges Testpasswort und neues DB-Passwort im Passwortmanager | offen | „ja“ (nichts übermitteln) | – | 2 min |

Gesamt etwa 1 Stunde Ihrer Zeit, wenn alles vorhanden ist.

**Antwortvorlage** (einfach ausfüllen und zurückschicken, keine Bildschirmfotos mit Adressen oder Schlüsseln):
```
P1 MFA Postfach/Supabase/GitHub/Vercel: ja/nein
P2 Postfach sauber: ja/nein
P3 Mitglieder/Tokens geprüft: ja/nein
P4 weiteres Free-Projekt möglich: ja/nein (Anzahl aktiver Free-Projekte: _)
P5 Vercel-Tarif: Hobby/Pro; Vercel Authentication verfügbar: ja/nein
P6 Kosten: 0 USD / freigegeben bis _ USD pro Monat
P7 Supabase „Add user“ mit Auto Confirm vorhanden: ja/nein
P8 Passwörter bereit: ja
Freigabe S-0 (neues Supabase- und Vercel-Projekt): ja/nein
```

## 9. Kürzester sicherer Weg zu HTTPS auf Laptop und iPhone

| Weg | Was Sie bekommen | Sicherheit | Externe Änderungen | Bewertung |
|---|---|---|---|---|
| **A – S-0 App-Vorschau** (empfohlen) | vollständige App mit **echter** Anmeldung und **echtem** Speichern, HTTPS, Laptop und iPhone | eigenes Supabase-Staging (getrennt von allem anderen), eigenes Vercel-Projekt, Vercel-Schutz **vor** der App, keine Registrierung, nur synthetische Daten | neues Supabase-Projekt, neues Vercel-Projekt | **Hauptweg** |
| B – lokale Demo über ein privates Netz (z. B. Tailscale „serve“) | Demo-Oberfläche mit synthetischen Daten auf dem iPhone | keine öffentliche Adresse; **Attrappe statt echter Anmeldung** | Konto bei einem Drittanbieter, Software auf Laptop und iPhone | nur als Zwischenlösung; Funktionsweise UNBESTÄTIGT, nicht getestet |
| ~~C – Demo-Attrappe auf Vercel~~ | – | würde eine **Schein-Anmeldung** ins Netz stellen | – | **verworfen** (unsicherer Platzhalter) |

**Plan für Weg A (nach P1–P8 und Ihrer Freigabe):**

| Schritt | Wer | Inhalt | Dauer (Schätzung) |
|---|---|---|---|
| A1 | Sie | Supabase-Projekt `wayne-cc-s0-staging` anlegen (Free, EU/Frankfurt) | 5 min |
| A2 | Sie, nach meiner Vorlage | im SQL-Editor die 3 App-Migrationen aus `wayne-command-center/supabase/migrations/` ausführen (kein Phase-1-Hook) | 5 min |
| A3 | Sie | Auth-Einstellungen: Registrierung **aus**, „Confirm email“ an, „Secure email change“ an, Recovery-Mailvorlage Standard; Testkonto über „Add user“ mit Auto-Confirm | 10 min |
| A4 | Sie, ich begleite | lokale Probe mit echtem Backend: `.env.local` mit **Staging**-URL und Publishable Key, `npm run build && npm start`, anmelden, ein Datensatz je Modul | 15 min |
| A5 | Sie | eigenes Vercel-Projekt `wayne-cc-s0-preview` (Root Directory `wayne-command-center`), Variablen **nur** für Production; Previews ohne Variablen (zeigen `/setup`) | 10 min |
| A6 | Sie | Deployment Protection „Vercel Authentication“ für alle Deployments; erst dann deployen | 5 min |
| A7 | Sie | `SITE_URL` = Vercel-Adresse; in Supabase Site URL und Redirect-URL (exakt `…/auth/confirm`) eintragen | 5 min |
| A8 | Sie, Protokoll durch mich | Abnahme auf Laptop und iPhone: Vercel-Schutz greift im privaten Fenster, Login, Speichern, Abmelden | 15 min |

**Grenzen von S-0:**
- Heutiger Sicherheitsstand: Passwort allein, keine MFA. Deshalb **nur synthetische Daten**.
- **Nicht produktionsreif.** Die offenen Befunde der Phase 1 bleiben offen; S-0 belegt keinen davon.

## 10. Offene Entscheidungen des Eigentümers

| # | Entscheidung | Optionen | Empfehlung |
|---|---|---|---|
| A | Ablage der Sicherheitsunterlagen | **entschieden 12.11.2026: ausschließlich offline** | – |
| B | Checkliste P1–P8 (§8) zurückmelden | – | – |
| C | S-0 umsetzen (Weg A, §9) | freigeben / nicht freigeben | freigeben, sobald P1–P8 erfüllt sind |
| D | Kosten (E17) | Free (falls P4 erlaubt) / Pro-Projekt ≈ 10 USD/Monat | Free |
| E | Zwischenlösung Weg B (privates Netz) | ja / nein | nur, wenn das iPhone vor S-0 nötig ist |

## 11. Nächster konkreter Schritt (für den nächsten Claude-Aufruf)

1. Diese Datei lesen. **Keine** erneute Repository- oder Sicherheitsanalyse.
2. Hat der Eigentümer UI-Wünsche aus der Demo geschickt → Paket P2: Wünsche bündeln, umsetzen, `npm run check` + kurzer Browsertest, Checkpoint.
3. Hat der Eigentümer P1–P8 (§8) als erfüllt gemeldet **und** S-0 ausdrücklich freigegeben → Paket P3c nach §9, Weg A. Schritt für Schritt begleiten; Claude selbst ändert keine externen Systeme.
4. Vertrauliche Sicherheitsunterlagen und neue Auditberichte **nie** ins Repository oder in Cloud-Speicher; nur dem Eigentümer übergeben (§6).
5. Sonst: nichts tun und auf den Eigentümer warten.

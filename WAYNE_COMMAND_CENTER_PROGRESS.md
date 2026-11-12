# WAYNE COMMAND CENTER – Fortschritt (zentrale Fortsetzungsdatei)

**Zweck:** Ein neuer Claude-Aufruf liest **nur diese Datei** und arbeitet ohne erneute Gesamtanalyse weiter. Nach jedem Arbeitspaket aktualisieren.

Stand: 12.11.2026 · Branch `claude/nice-pascal-gknlav` (Basis `main` = `d0c4925`) · Produkt: privates Command Center für **einen** Eigentümer.

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
| Private Cloud-Vorschau S-0 (iPhone + Laptop, HTTPS) | Checkliste `ACCESS_READINESS_v1/S0_PREFLIGHT_CHECKLIST.md` P1–P8 (M2, D4, Kosten, Vercel-Schutz, „Auto Confirm User“) | **Eigentümer** |
| Speichern mit echtem Backend | separates Staging-Supabase-Projekt (nach P1–P8) | Eigentümer legt an, Claude begleitet |
| Produktivbetrieb mit echten Daten | Phase-1-Sicherheit (MFA/AAL2, Datenbremse, Hook) nicht umgesetzt; offene Befunde NF-29, NF-43, NF-55, NF-58, NF-73, NF-82, NF-83, NF-84; Audit v3.11 ausstehend | Implementierungsfreigabe des Eigentümers |

**Die Vorschau ist nie produktionsreif**, solange diese Nachweise fehlen.

## 6. Sicherheitsunterlagen (nicht neu analysieren – nur bei Bedarf lesen)

Im Claude-Scratchpad der Sitzung (nicht im Repository; flüchtig, siehe Hinweis):
- Plan v3.11, Testplan v7, Risiko v7 (Entwurf), E13 v3.11, Owner-Tasks v3.11, Befundmatrix v3.11, Audit v3.10, Konsistenzprüfung `audit24`.
- `ACCESS_READINESS_v1/` (Bestandsaufnahme, S-0-Konzept, Checkliste P1–P8).

**Hinweis:** Der Scratchpad überdauert die Cloud-Sitzung nicht. Sollen diese Unterlagen erhalten bleiben, müssen sie auf Anweisung des Eigentümers ins Repository übernommen werden (offene Entscheidung, siehe §8).

## 7. Arbeitspakete

| Paket | Ziel | Status | Checkpoint |
|---|---|---|---|
| **P1** | Lokale Vorschau mit einem Befehl, synthetische Daten, Speichern im Speicher; Fortschrittsdatei | **erledigt** | Commit „P1: lokale Demo …“ auf `claude/nice-pascal-gknlav` |
| P2 | UI-Feinschliff nach Rückmeldung des Eigentümers aus der lokalen Demo (konkrete Wünsche sammeln) | offen – wartet auf Rückmeldung | – |
| P3 | S-0 Cloud-Vorschau nach Checkliste P1–P8 (Supabase-Staging, eigenes Vercel-Projekt mit Deployment Protection) | gesperrt bis P1–P8 erfüllt | – |
| P4 | Phase-1-Sicherheit umsetzen | gesperrt bis Audit v3.11 + Implementierungsfreigabe | – |

### P1 – Protokoll

1. **Ziel:** frühestmögliche lokale Nutzung ohne externe Infrastruktur.
2. **Dateien:** `wayne-command-center/scripts/demo/mock-supabase.mjs` (neu), `wayne-command-center/scripts/demo/preview.mjs` (neu), `wayne-command-center/package.json` (Skripte `demo`, `demo:build`), `WAYNE_COMMAND_CENTER_PROGRESS.md` (neu). **App-Code (`src/`) unverändert.**
3. **Änderungen:** Attrappe mit Lesen/Anlegen/Ändern/Löschen im Speicher, festen Demo-Zugangsdaten, nur 127.0.0.1; Startskript für Produktionsbuild mit Demo-Variablen (entfernt echte Supabase-Variablen aus der Umgebung).
4. **Tests:** `npm run check` (Typprüfung, Lint, 79/79 Unit-Tests) bestanden; Browsertest 27/27 (Login, falsches Passwort, 10 Module Desktop, Aufgabe anlegen und nach Neuladen sichtbar, 0 Browserfehler, 10 Module iPhone ohne Querscrollen).
5. **Ergebnis:** lokal vollständig bedienbar.
6. **Offen:** Rückmeldung des Eigentümers zur Oberfläche (P2); Checkliste P1–P8 (P3); Entscheidung über Übernahme der Sicherheitsunterlagen ins Repository.
7. **Checkpoint:** siehe Git-Log.
8. **Fortsetzung:** siehe §8.

## 8. Nächster konkreter Schritt (für den nächsten Claude-Aufruf)

1. Diese Datei lesen. **Keine** erneute Repository- oder Sicherheitsanalyse.
2. Hat der Eigentümer UI-Wünsche aus der Demo geschickt → Paket P2: Wünsche bündeln, umsetzen, `npm run check` + kurzer Browsertest, Checkpoint.
3. Hat der Eigentümer P1–P8 als erfüllt gemeldet → Paket P3 nach `ACCESS_READINESS_v1/S0_STAGING_CONCEPT_FINAL.md` (Scratchpad; falls nicht mehr vorhanden: Konzept aus §5 dieser Datei und dem Wunsch des Eigentümers neu, knapp aufsetzen).
4. Sonst: nichts tun und auf den Eigentümer warten.

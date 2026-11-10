# Wayne Command Center — Technische Spezifikation

## 1. Ziel

Persönliche Steuerzentrale für Aufgaben, Projekte, Abteilungen, Research, Entscheidungen,
KI-Agenten, Fortschritt und Wochenberichte. Alle angezeigten Werte stammen aus der
Datenbank des angemeldeten Nutzers. Es gibt **keine** Demo- oder fingierten Live-Daten;
leere Bereiche zeigen einen leeren Zustand mit Handlungsaufforderung.

## 2. Annahmen

| # | Annahme | Konsequenz |
|---|---------|------------|
| A1 | Ein Konto = ein Datenraum (Single-Tenant pro Nutzer). | RLS-Regel `owner_id = auth.uid()` auf allen Tabellen. Teams wären eine spätere Erweiterung (Workspace-Tabelle). |
| A2 | Anmeldung per E-Mail + Passwort mit E-Mail-Bestätigung. | Supabase Auth, Bestätigungsroute `/auth/confirm`. |
| A3 | Agenten sind ein **Register** (Rolle, Skill, Status), kein Laufzeitsystem. | Status wird vom Nutzer gepflegt, nicht simuliert. |
| A4 | Wochenberichte frieren beim Erstellen echte Kennzahlen der Woche ein (Mo–So, Zeitzone des Profils). | Spalte `metrics jsonb`, Neuberechnung per Knopfdruck. |
| A5 | Hosting auf Vercel, Datenbank auf Supabase (EU-Region empfohlen). | Nur zwei öffentliche Umgebungsvariablen nötig. |

## 3. Technologie

| Ebene | Wahl |
|-------|------|
| Framework | Next.js 16 (App Router, Server Components, Server Actions, `proxy.ts`) |
| Sprache | TypeScript (strict) |
| Styling | Tailwind CSS v4, shadcn/ui (Radix-Primitives), `tw-animate-css` |
| Datenbank/Auth | Supabase (Postgres 15+, Auth, RLS) über `@supabase/ssr` |
| Validierung | Zod 4 — serverseitig in jeder Server Action |
| Tests | Vitest (Validierung, Datumslogik), SQL-RLS-Tests gegen Postgres |
| Typografie | Geist Sans / Geist Mono (lokal gebündelt, kein externer Font-Abruf) |

## 4. Sicherheitsmodell

1. **Nur öffentliche Schlüssel im Client:** `NEXT_PUBLIC_SUPABASE_URL` und
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon/publishable). Der Service-Role-Key wird
   **nirgends** verwendet.
2. **Alle Datenzugriffe serverseitig** (Server Components / Server Actions) mit dem
   Cookie-Session-Client; Module importieren `server-only`.
3. **Row Level Security** auf jeder Tabelle; `owner_id` hat Default `auth.uid()`.
   Zusammengesetzte Fremdschlüssel `(fk_id, owner_id)` verhindern Verweise auf fremde
   Datensätze — selbst bei manipulierten Requests.
4. **Doppelte Authentifizierungsprüfung:** `proxy.ts` (Session-Refresh + Umleitung) und
   `requireUser()` im Data Access Layer (`supabase.auth.getUser()` validiert das JWT beim
   Auth-Server).
5. **Validierung:** Jede Eingabe läuft durch ein Zod-Schema; DB-Constraints (CHECK, Länge,
   Enum) sind die zweite Linie.
6. **Fehlerbehandlung:** Server Actions liefern `{ ok, message, fieldErrors }`; technische
   Details werden nur serverseitig geloggt. `error.tsx`-Grenzen fangen Renderfehler ab.
7. **HTTP-Header:** `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`,
   `Permissions-Policy`, HSTS.
8. **Open-Redirect-Schutz:** `next`-Parameter wird nur als interner Pfad akzeptiert.

## 5. Datenmodell

```
profiles(id=auth.users.id, full_name, timezone, created_at, updated_at)
departments(id, owner_id, name, description, lead, ...)
projects(id, owner_id, department_id→departments, name, description, status,
         priority, progress 0–100, start_date, due_date, ...)
milestones(id, owner_id, project_id→projects, title, due_date, completed_at, ...)
tasks(id, owner_id, project_id→projects, title, description, status, priority,
      due_date, completed_at, ...)
research_entries(id, owner_id, project_id→projects, title, summary, source_url,
                 tags[], status, confidence, ...)
decisions(id, owner_id, project_id→projects, title, context, decision, alternatives,
          rationale, status, decided_at, ...)
agents(id, owner_id, department_id→departments, name, role, skill_command,
       description, status, ...)
weekly_reports(id, owner_id, week_start UNIQUE per owner, summary, wins, blockers,
               next_steps, metrics jsonb, ...)
```

Enums (als CHECK-Constraints):

- Projektstatus: `planned | active | on_hold | completed | archived`
- Aufgabenstatus: `todo | in_progress | blocked | done`
- Priorität: `low | medium | high | critical`
- Research: `draft | in_review | verified`; Konfidenz `low | medium | high`
- Entscheidung: `proposed | accepted | rejected | superseded`
- Agent: `active | paused | retired`

Trigger: `updated_at` automatisch; `tasks.completed_at` wird bei Status `done`
gesetzt/geleert; Profil wird bei Registrierung angelegt.

## 6. Module & Routen

| Route | Modul | Inhalt |
|-------|-------|--------|
| `/` | Dashboard | Kennzahlen, fällige Aufgaben, Projektfortschritt, letzte Entscheidungen |
| `/tasks` | Aufgaben | Filter nach Status/Priorität/Projekt, Anlegen, Bearbeiten, Schnellstatus |
| `/projects` | Projekte | Karten mit Status, Fortschritt, Abteilung, Fälligkeit |
| `/departments` | Abteilungen | Abteilungen mit Projekt- und Agentenanzahl |
| `/research` | Research | Verzeichnis mit Suche, Tags, Quelle, Konfidenz |
| `/decisions` | Entscheidungen | Protokoll (ADR-Stil) chronologisch |
| `/agents` | Agenten | Register mit Rolle, Skill-Befehl, Status |
| `/progress` | Fortschritt | Je Projekt: Aufgabenquote, Meilensteine, Überfälliges, Ampel |
| `/reports` | Wochenberichte | Erstellen (Kennzahlen eingefroren), Kommentieren |
| `/settings` | Einstellungen | Profil, Zeitzone, Passwort, Abmelden |
| `/login`, `/signup`, `/auth/confirm` | Auth | Anmeldung, Registrierung, E-Mail-Bestätigung |
| `/setup` | Einrichtung | Erscheint, solange Supabase-Variablen fehlen |

## 7. Architektur

```
src/
  proxy.ts                    Session-Refresh, Auth-Umleitung, Setup-Weiche
  app/(auth)/…                Öffentliche Auth-Seiten
  app/(app)/…                 Geschützte Module (gemeinsames Shell-Layout)
  components/ui/…             shadcn/ui-Komponenten
  components/layout/…         Sidebar, Mobile-Navigation, Seitenkopf
  components/entity/…         Generischer Formular-Dialog, Löschen, Leerzustand
  lib/supabase/…              Server-Client, Proxy-Client
  lib/auth.ts                 Data Access Layer (requireUser)
  lib/validation/…            Zod-Schemas je Entität
  lib/crud.ts                 Generische, typisierte Insert/Update/Delete-Helfer
  features/<modul>/…          Queries, Server Actions, Modul-Komponenten
supabase/migrations/…         Schema, RLS, Trigger
supabase/tests/…              RLS-Tests (SQL)
```

## 8. Design-System „Liquid Glass“

- Hintergrund: tiefes Schwarz mit zwei sehr dezenten Licht-Gradienten (Gold/Anthrazit).
- Flächen: `bg-white/[0.04]`, `backdrop-blur-xl`, 1px-Rand `white/8`, innere Glanzkante.
- Akzent: Gold `#C9A45C` sparsam — aktive Navigation, Primäraktion, Fortschritt.
- Typografie: Geist, enge Laufweite für Überschriften, Tabellenziffern für Zahlen.
- Ruhe: maximal eine Primäraktion pro Ansicht, Status als dezente Badges.
- Responsiv: Sidebar ab `lg`, darunter Kopfzeile mit Sheet-Navigation; Formulare im
  Vollbreiten-Dialog auf Smartphones.
- Barrierearm: sichtbare Fokusringe, `prefers-reduced-motion`, Kontrast ≥ 4.5:1.

# Entwicklungsplan

| Phase | Inhalt | Ergebnis | Status |
|-------|--------|----------|--------|
| 0 | Spezifikation, Plan | `docs/SPEC.md`, dieser Plan | ✅ |
| 1 | Fundament: Next.js 16, Tailwind 4, shadcn/ui, Design-Tokens, Sicherheits-Header | Lauffähiges Grundgerüst | ✅ |
| 2 | Datenbank: Migration mit Tabellen, Constraints, Triggern, RLS; SQL-Tests | `supabase/migrations`, `supabase/tests` | ✅ |
| 3 | Auth: Supabase SSR, `proxy.ts`, Login/Signup/Bestätigung, Data Access Layer, Setup-Seite | Geschützter Bereich | ✅ |
| 4 | App-Shell: Sidebar, Mobile-Navigation, Seitenkopf, Fehler-/Ladezustände | Navigation über alle Module | ✅ |
| 5 | Generische Bausteine: Zod-Schemas, CRUD-Helfer, Formular-Dialog, Löschen | Wiederverwendbare Module | ✅ |
| 6 | Module: Aufgaben, Projekte, Abteilungen, Research, Entscheidungen, Agenten | CRUD mit Validierung | ✅ |
| 7 | Auswertung: Dashboard, Fortschrittskontrolle, Meilensteine, Wochenberichte | Echte Kennzahlen | ✅ |
| 8 | Einstellungen: Profil, Zeitzone, Passwort, Abmelden | | ✅ |
| 9 | Qualität: Typecheck, Lint, Unit-Tests, RLS-Tests, Build, Browser-Smoke-Test | Testprotokoll | ✅ |
| 10 | Übergabe: manuelle Schritte für Supabase & Vercel | `docs/MANUAL_STEPS.md` | ✅ |

## Spätere Ausbaustufen (nicht umgesetzt)

1. Teams/Workspaces mit Rollen (RLS über Mitgliedschaftstabelle).
2. Generierte Supabase-Typen (`supabase gen types`) statt handgeschriebener Domänentypen.
3. Agenten-Ausführung über Claude-API (serverseitig, Schlüssel nur in Vercel-Env).
4. E2E-Tests gegen ein Supabase-Staging-Projekt.
5. Kontolöschung über eine abgesicherte Edge Function.

# Wayne Command Center

Persönliche Steuerzentrale: Dashboard, Aufgaben, Projekte, Abteilungen, Research,
Entscheidungsprotokoll, Agenten, Fortschrittskontrolle, Wochenberichte, Einstellungen.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS 4 · shadcn/ui · Supabase (Auth, Postgres, RLS) · Zod

- Spezifikation: [`docs/SPEC.md`](docs/SPEC.md)
- Entwicklungsplan: [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md)
- **Einrichtung & offene manuelle Schritte:** [`docs/MANUAL_STEPS.md`](docs/MANUAL_STEPS.md)

```bash
cp .env.example .env.local   # Supabase-URL + Publishable Key eintragen
npm install
npm run dev
```

| Skript | Zweck |
|---|---|
| `npm run check` | Typecheck, Lint, Unit-Tests |
| `npm run test:db` | Migration + RLS-Tests gegen lokales Postgres |
| `npm run build` | Produktions-Build |

Sicherheit in Kürze: alle Datenzugriffe serverseitig, RLS auf jeder Tabelle, zusammengesetzte
Fremdschlüssel gegen Fremdverweise, Zod-Validierung jeder Eingabe, kein Service-Role-Key.

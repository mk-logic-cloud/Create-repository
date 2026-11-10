---
name: build-app
description: Planung und Umsetzung einer Webanwendung oder eines Features nach dem Wayne-Standard (Next.js, TypeScript, Tailwind, shadcn/ui, Supabase mit RLS) — von Spezifikation über modulare Implementierung bis zu Tests und Übergabedokumentation. Verwenden für neue Apps, neue Module oder größere Features.
argument-hint: "<App oder Feature-Beschreibung>"
---

# Build App

## 1. Zweck
Lauffähige, sichere Software in überprüfbaren Teilschritten liefern — nicht nur Code, sondern
Spezifikation, Tests und eine ehrliche Liste offener Schritte.

## 2. Einsatz
- Neue Anwendung oder neues Modul (Referenz: `wayne-command-center/`).
- Größere Features mit Datenmodell-Änderung.
- Nicht für Einzeiler-Fixes.

## 3. Eingaben
- **Pflicht:** Ziel und Kernfunktionen (`$ARGUMENTS`).
- **Hilfreich:** Zielgruppe, Designvorgaben, Datenquellen, Hosting, Deadline, bestehendes Repo.
- Externe Zugangsdaten (Supabase, Vercel, APIs) **nie selbst anlegen** — an den betreffenden Stellen den Nutzer auffordern.

## 4. Ablauf
1. **Spezifikation:** `docs/SPEC.md` — Annahmen, Datenmodell, Routen, Sicherheitsmodell. Unklare Kernanforderungen vorher klären.
2. **Plan:** `docs/DEVELOPMENT_PLAN.md` mit Phasen; jede Phase endet lauffähig.
3. **Fundament:** Projekt-Setup, Design-Tokens, Sicherheits-Header; bei Next.js zuerst `node_modules/next/dist/docs` für Versionsänderungen lesen.
4. **Daten & Sicherheit:** Migration mit RLS auf jeder Tabelle, `owner_id default auth.uid()`, zusammengesetzte FKs gegen Fremdverweise; RLS-Tests (`npm run test:db`).
5. **Module:** Je Modul Zod-Schema → Server Action (Auth-Prüfung zuerst) → Queries über Data Access Layer → UI mit Leer-, Lade- und Fehlerzustand.
6. **Prüfen nach jeder Phase:** Typecheck, Lint, Unit-Tests, Build.
7. **Browser-Test:** Playwright-Smoke über alle Routen, Desktop + Smartphone, Fehlerfälle.
8. **Übergabe:** `docs/MANUAL_STEPS.md` mit allen Schritten, die Zugangsdaten erfordern; Testprotokoll.
9. **Abschluss:** `/final-audit` ausführen.

## 5. Spezialagenten
- `Plan` — Architektur und Phasenplan bei größeren Vorhaben.
- `Explore` — bestehende Codebasis kartieren, bevor geändert wird.
- `general-purpose` — unabhängiger Security-Review der Server Actions und RLS (Auftrag: „Finde Wege, fremde Daten zu lesen oder zu ändern“).

## 6. Qualitätskontrolle
- [ ] Keine geheimen Schlüssel im Client-Bundle oder Repo; nur Publishable Key.
- [ ] Jede Eingabe serverseitig validiert; jede Action prüft die Session.
- [ ] RLS-Tests decken Lesen, Schreiben, Spoofing und Fremd-FKs ab.
- [ ] Keine Demo- oder Fake-Daten in der App; Leerzustände statt Platzhalterzahlen.
- [ ] Typecheck, Lint, Tests, Build grün; Mobile ohne horizontalen Überlauf.
- [ ] Offene manuelle Schritte vollständig dokumentiert.

## 7. Ausgabeformat
Code im Repository plus Abschlussbericht:
```markdown
# Build-Bericht: <App/Feature>
## Umgesetzt (Module, Routen)
## Architektur- & Sicherheitsentscheidungen
## Testprotokoll (Befehl → Ergebnis)
## Offene manuelle Schritte
## Bekannte Grenzen & nächste Ausbaustufen
```

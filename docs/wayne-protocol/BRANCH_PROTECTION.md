# Branch-Schutz für `main`: Anleitung

**Status:** vorbereitet. Die GitHub-Einstellungen wurden **nicht** geändert; das erledigt der
Repository-Inhaber selbst.

## Voraussetzung: eine echte Prüfung

Eine Regel „mindestens eine erfolgreiche Prüfung“ wirkt nur, wenn es eine Prüfung gibt. Dafür liefert
PR #2 den Workflow `.github/workflows/wayne-ci.yml` mit zwei Jobs:

| Job (Check-Name) | Prüft | Läuft |
|---|---|---|
| `protocol` | `scripts/validate_protocol.py`: Frontmatter, Pflichtabschnitte, Werkzeugrechte (nur `software-engineer` darf schreiben, kein Agent startet Agenten), Querverweise, Links | bei jedem PR und Push auf `main`; ohne `.claude/agents` wird er erfolgreich übersprungen |
| `app` | `npm ci`, Typecheck, Lint, Unit-Tests, Migrationen und RLS-Tests (lokales PostgreSQL), Build | bei jedem PR und Push auf `main`; ohne `wayne-command-center/` wird er erfolgreich übersprungen |

Beide Jobs laufen bei **jedem** PR. Dadurch blockiert ein verpflichtender Check keinen PR, der das
jeweilige Projekt gar nicht berührt.

Der Validator wurde lokal mit absichtlich eingebauten Fehlern geprüft (Schreibrecht für einen
Nur-lese-Agenten, falscher Agentenname, fehlender Abschnitt, falscher Skill-Verweis). Alle vier
Fehler wurden erkannt. Der Workflow selbst läuft erst auf GitHub, nachdem PR #2 aktualisiert wurde.

## Empfohlene Einstellungen (Ruleset)

Weg: GitHub → Repository → **Settings → Rules → Rulesets → New ruleset → New branch ruleset**.

| Einstellung | Wert |
|---|---|
| Ruleset name | `protect-main` |
| Enforcement status | **Active** |
| Bypass list | leer (auch Administratoren unterliegen den Regeln) |
| Target branches | **Include default branch** (`main`) |
| **Restrict deletions** | ✅ an: Branch-Löschung verhindern |
| **Block force pushes** | ✅ an: Force Pushes verhindern |
| **Require a pull request before merging** | ✅ an: keine direkten Pushes |
| ↳ Required approvals | `1`, wenn es eine zweite Person gibt; als Alleininhaber `0` (GitHub erlaubt keine Freigabe des eigenen PRs) |
| ↳ Dismiss stale approvals when new commits are pushed | ✅ |
| ↳ Require conversation resolution before merging | ✅ |
| **Require status checks to pass** | ✅ an |
| ↳ Status checks | `protocol` und `app` hinzufügen (erscheinen nach dem ersten Workflow-Lauf in der Auswahl) |
| ↳ Require branches to be up to date before merging | ✅ |
| Require linear history | optional (empfohlen: an, Merge per „Squash“ oder „Rebase“) |
| Require signed commits | optional |

Speichern mit **Create**.

Alternative mit den klassischen Regeln: **Settings → Branches → Add branch protection rule** →
Pattern `main`, dann dieselben Häkchen setzen. Dazu „Do not allow bypassing the above settings“ an,
„Allow force pushes“ und „Allow deletions“ aus.

## Prüfen, ob es wirkt

1. Einen direkten Push auf `main` versuchen (z. B. eine leere Teständerung lokal): GitHub muss
   ablehnen. Lokal danach `git reset --hard origin/main`.
2. In einem PR muss der Merge-Button gesperrt sein, bis `protocol` und `app` grün sind.
3. **Settings → Rules → Rulesets → protect-main** zeigt „Active“.

## Hinweise

- Der Backup-Branch `backup/pr2-before-split-2026-11-11` ist von der Regel nicht betroffen und bleibt erhalten.
- Ohne zweite Person verhindert die Regel versehentliche Direkt-Pushes und Force Pushes. Die Review
  ersetzt sie nicht. Die Freigabe bleibt eine bewusste Entscheidung des Inhabers.

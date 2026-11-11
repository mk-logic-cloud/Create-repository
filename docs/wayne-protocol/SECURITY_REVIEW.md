# Security Review, Wayne Protocol 2.0 (11.11.2026)

Geltungsbereich: Agenten, Skills, `CLAUDE.md`, Git-Historie und Arbeitsweise. Die Sicherheit des
Wayne Command Center steht in dessen eigenem PR (`wayne-command-center/docs/DEPLOYMENT_READINESS.md`).

## 1. Technisch erzwungen oder nur Prompt-Anweisung?

| Schutzmaßnahme | Art | Beleg |
|---|---|---|
| Werkzeugliste je Agent (`tools:` im Frontmatter) | **technisch erzwungen** durch Claude Code | `business-analyst` konnte keine Datei anlegen (B1); nur `software-engineer` hat Edit/Write |
| Kein Agent kann Subagenten starten | **technisch erzwungen** (Subagenten haben kein Agent-Tool) | Frontmatter-Prüfung: kein Agent führt `Agent`/`Task` |
| Netzwerkzugriff von WebFetch | **technisch erzwungen** durch die Netzwerkrichtlinie der Umgebung | `ENOTFOUND` in R1 und G1 |
| Bestätigung von Bash- und Dateiänderungen | **technisch erzwungen**, abhängig vom Berechtigungsmodus der Sitzung | Einstellung des Nutzers |
| Was ein Agent *innerhalb* von Bash tun darf (nur rechnen, nur lesend prüfen, kein Commit, kein Netz) | **nur Prompt** | F1: Skript außerhalb des vorgegebenen Verzeichnisses geschrieben |
| Keine Vertragsinhalte in Websuchen | **nur Prompt** | L1: eingehalten |
| Quellenregeln Q1–Q8 | **nur Prompt** | R1 |
| Höchstens 4 parallele Agenten, nie zwei Schreiber | **nur Prompt** (Regel für Wayne Core) | `CLAUDE.md` §3 |
| Externe Aktionen nur mit Zustimmung | **nur Prompt** für Wayne Core; zusätzlich die Berechtigungsabfragen der Sitzung | `CLAUDE.md` §6 |
| Merge nur durch den Nutzer | **organisatorisch**; technisch nur mit Branch-Schutz auf GitHub erzwingbar | Empfehlung unten |

**Folgerung:** Die Rollen- und Werkzeuggrenzen sind belastbar. Alles, was ein Agent *mit* Bash
tut, hängt am Prompt und am Berechtigungsmodus der Sitzung.

## 2. Prüfpunkte

| Bereich | Ergebnis |
|---|---|
| Secrets und API-Keys | ✅ Musterprüfung über die gesamte Historie aller relevanten Branches: 0 Treffer |
| Environment-Dateien | ✅ Im Protokoll-PR keine. Im App-PR nur `.env.example` mit Platzhaltern |
| Berechtigungen der Agenten | ✅ 4 Agenten nur lesend. `financial-analyst` und `red-team-auditor` mit Bash, `software-engineer` mit Bash und Schreibrechten |
| Bash-Zugriff | ⚠️ 3 Agenten. Grenzen innerhalb von Bash nur als Prompt (siehe F1) |
| Prompt-Injection | ✅ in R1 und F1 ignoriert. ⚠️ Restrisiko bleibt, besonders nach einer Domainfreigabe |
| Externe Webinhalte | ✅ als Daten behandelt (Regel Q8, `CLAUDE.md` §6) |
| Unbeabsichtigte Dateiänderungen | ✅ Der Protokoll-PR enthält nur `.claude/`, `CLAUDE.md`, `WAYNE_PROTOCOL.md` und `docs/wayne-protocol/`. `index.html` ist unverändert |
| Git-Historie | ✅ PR-#2-Historie neu aufgebaut. Gesichert in `backup/pr2-before-split-2026-11-11` (Remote) und Tag `backup-pr2-before-split` (lokal). Autor aller neuen Commits: `Claude <noreply@anthropic.com>` |

## 3. Empfehlungen für den Inhaber

1. **Branch-Schutz für `main`:** Pull Request und mindestens eine Freigabe verlangen. Damit ist
   „Merge nur durch den Nutzer“ technisch erzwungen.
2. **Berechtigungsmodus:** Für Sitzungen mit `software-engineer` einen Modus mit Bestätigung für
   Bash wählen. Optional `git push` per Hook oder Permission-Regel sperren.
3. **Domainfreigaben** nur über die separate Umgebung `wayne-research`.
4. **Backup-Branch** nach dem Merge beider PRs löschen. Er enthält keine Secrets, dupliziert aber die Historie.

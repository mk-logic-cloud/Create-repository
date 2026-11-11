# Vercel-Audit und Deployment-Isolation

**Stand:** 11.11.2026 · **Status:** Analyse abgeschlossen. Die Repository-seitigen Änderungen sind lokal
vorbereitet. **An Vercel wurde nichts geändert. Nichts wurde gepusht oder gemergt.**

## 1. Audit: Was ist heute konfiguriert?

Quellen: Metadaten der `vercel[bot]`-Kommentare in PR #2 und PR #3 (base64-dekodiert),
GitHub-Commit-Status (`context: Vercel`), HTTP-Abrufe der Deployment-URLs (nur lesend) und die
offizielle Vercel-Dokumentation. Auf das Vercel-Dashboard bzw. die Vercel-API gab es **keinen**
Zugriff; dort sichtbare Einstellungen sind deshalb als „nicht einsehbar“ markiert.

| Frage | Befund | Beleg |
|---|---|---|
| Verbundenes Repository | `mk-logic-cloud/Create-repository` (Vercel for GitHub) | Kommentar `vercel[bot]`, `"type": "github"` |
| Vercel-Projekt | `create-repository` (`prj_pdwyiWivFxDVss7dpo9bBM8Cg6oW`), Team-Scope `mateuszkowalczyk530-4214s-projects` | Kommentar-Metadaten |
| Seit wann aktiv | spätestens 10.11.2026, 22:00 UTC (erster Kommentar in PR #2) | Zeitstempel |
| Automatisch deployende Branches | **alle** Branches mit Pushes: PR #2 (`claude/nice-pascal-gknlav`) und PR #3 (`claude/wayne-command-center`) erhielten je ein Deployment (Status „Deployment has completed“) | Commit-Status `Vercel` auf `0504037` und `c81aaf4` |
| Preview-Regel | jeder Push auf einen Nicht-Production-Branch wird ein Preview-Deployment | wie oben |
| Production-Regel | Production-Branch ist laut Vercel-Standard `main`. Ein Merge bzw. Push auf `main` erzeugt ein Production-Deployment | Vercel-Standard; Projekteinstellung **nicht einsehbar** |
| Schutz der Previews | **Vercel Authentication aktiv**: Preview-URLs und der Team-Alias leiten auf `vercel.com/sso-api` um (HTTP 302). Sie sind nicht öffentlich | `curl` auf beide Preview-URLs |
| Produktionsdomain | **nicht bestimmbar**. `create-repository.vercel.app` gehört einem fremden Projekt (andere Seite) | `curl` |
| Root Directory | **leer** (`"rootDirectory": null`), es wird also die Repository-Wurzel gebaut | Kommentar-Metadaten PR #2 |
| Build Command / Framework | nicht einsehbar. In der Wurzel gibt es keine `package.json`; Vercel behandelt sie daher sehr wahrscheinlich als statische Site ohne Build (Framework „Other“) | Repository-Struktur |
| Environment Variables | nicht einsehbar. Die Wurzel-`index.html` braucht keine | – |

### Risiken
1. **Unbeabsichtigte Deployments:** Jeder Push auf einen PR-Branch erzeugt ein Preview. Das ist bereits passiert (PR #2 seit 10.11., PR #3 am 11.11. um 09:05 UTC). Die Previews sind zwar SSO-geschützt, aber es sind Deployments.
2. **Merge = Production:** Ein Merge auf `main` löst ein Production-Deployment von `create-repository` aus.
3. **Statische Veröffentlichung von Repository-Dateien (sehr wahrscheinlich, nicht verifizierbar):** Bei leerem Root Directory und ohne Build liefert Vercel die Dateien der Wurzel statisch aus. Nach einem Merge könnten damit `CLAUDE.md`, `.claude/`, `docs/` und nach PR #3 auch der App-Quellcode unter der Produktionsdomain abrufbar sein. Secrets enthalten diese Dateien nicht. Interne Dokumentation und Quellcode wären aber öffentlich, falls die Produktionsdomain nicht geschützt ist.
4. **Die App wird von diesem Projekt nie korrekt gebaut**, denn Next.js liegt in `wayne-command-center/`.

## 2. Empfohlene Architektur

```
GitHub: mk-logic-cloud/Create-repository
│
├── Vercel-Projekt "create-repository"   (bestehend, Wurzel / index.html)
│     └── vercel.json (Wurzel): git.deploymentEnabled = false
│         → keine Deployments aus Git mehr, weder Preview noch Production
│         → Wayne Protocol (CLAUDE.md, .claude/, docs/) löst nie ein Deployment aus
│
└── Vercel-Projekt "wayne-command-center" (NEU, vom Inhaber anzulegen)
      Root Directory:            wayne-command-center
      Framework:                 Next.js (automatisch erkannt), Install npm ci, Build npm run build
      Include files outside root: aus
      Ignored Build Step:        "Only build if there are changes" (nur bei Änderungen unter wayne-command-center/)
      Production Branch:         main
      Auto-assign Custom Production Domains: AUS
          → Production-Builds bleiben "staged"; live erst per manuellem "Promote"
      Deployment Protection:     Vercel Authentication für Previews (Standard)
      Environment Variables:
          Production: SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY des PRODUKTIONS-Supabase, SITE_URL=https://<domain>
          Preview:    SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY eines getrennten STAGING-Supabase,
                      SITE_URL=https://<staging- oder Produktionsdomain>
```

| Ziel | Umsetzung | Art |
|---|---|---|
| Wayne Protocol löst keine App-Deployments aus | Wurzel-`vercel.json` mit `git.deploymentEnabled: false`. Das App-Projekt baut nur bei Änderungen unter `wayne-command-center/` (Ignored Build Step) | Repository-Datei (wirkt pro Commit) + Dashboard |
| Eigenes Projekt für die App | neues Vercel-Projekt mit Root Directory `wayne-command-center` | Dashboard (Inhaber) |
| Preview und Production getrennt | getrennte Supabase-Projekte und Variablen je Umgebung. Previews per SSO geschützt | Dashboard (Inhaber) |
| Production nur bewusst | „Auto-assign Custom Production Domains“ aus, dann Promote-Schritt. Zusätzlich Branch-Schutz auf `main` | Dashboard + GitHub-Ruleset |

**Warum `vercel.json` in der Wurzel?** Vercel liest `vercel.json` aus dem Root Directory des jeweiligen
Projekts und aus dem jeweiligen Commit. Die Wurzel-Datei steuert also nur das Projekt `create-repository`.
Das neue App-Projekt (Root `wayne-command-center`) ist davon nicht betroffen. Weil die Regel pro Commit gilt,
**erzeugt bereits der nächste Push eines Branches mit dieser Datei kein Deployment mehr**.
Belegt in der Vercel-Doku „Git Configuration → Turning off all automatic deployments“; nach dem ersten
Push zu verifizieren: kein neuer `Vercel`-Commit-Status.

**Auswirkung auf die bestehende `index.html`-Site:** Auch `main` wird danach nicht mehr automatisch deployt.
Die zuletzt veröffentlichte Version bleibt online. Ein neues Deployment der Wurzel ist nur noch
bewusst möglich (Dashboard „Redeploy“ bzw. CLI). Wenn das nicht gewünscht ist, gibt es eine Alternative:
`"deploymentEnabled": { "main": true, "*": false }` erlaubt nur `main`. Dann bleibt aber Risiko 3 bei einem Merge bestehen.

## 3. Vorbereitete Repository-Änderungen (lokal, nicht gepusht)

| Branch | Commit | Inhalt |
|---|---|---|
| PR #2 | über `603b14a` | Wurzel-`vercel.json` (Deployments aus), CI aufgeteilt (`wayne-ci.yml` nur noch Check `protocol`), diese Doku, Branch-Schutz-Doku aktualisiert |
| PR #3 | über `65f0d18` | identische Wurzel-`vercel.json` (konfliktfrei, gleicher Inhalt), eigener Workflow `.github/workflows/app-ci.yml` (Check `app`) |

## 4. Schritte des Inhabers (Reihenfolge)

1. **Push freigeben:** zuerst die lokalen Commits beider Branches. Die neuen Commits enthalten `vercel.json`. Erwartung: keine neuen Vercel-Deployments, die CI-Checks laufen.
2. **Prüfen:** In beiden PRs erscheint kein neuer `Vercel`-Status für den neuen Head-Commit. `protocol` (PR #2) und `app` (PR #3) sind grün.
3. **Vercel-Projekt für die App anlegen** (Dashboard, Werte aus Abschnitt 2). Staging- und Produktionsvariablen setzen. „Auto-assign Custom Production Domains“ ausschalten.
4. **Branch-Schutz** gemäß [`BRANCH_PROTECTION.md`](BRANCH_PROTECTION.md) aktivieren.
5. **Merge PR #2.** `create-repository` deployt nicht mehr. Die CI auf `main` läuft.
6. **PR #3 mit `main` aktualisieren, Checks abwarten, Merge.** Das App-Projekt baut einen staged Production-Build.
7. **Supabase-Checkliste** abarbeiten, dann den staged Build per **Promote** live schalten.

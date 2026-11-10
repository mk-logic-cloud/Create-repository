# Wayne Protocol 2.0: Skill-Übersicht

Die Skills liegen unter `.claude/skills/<name>/SKILL.md` und werden in Claude Code per Slash-Befehl
aufgerufen (z. B. `/deep-research Marktgröße KI-Assistenz DACH`). Claude kann sie auch selbst wählen,
wenn die Beschreibung zur Aufgabe passt. Neue oder geänderte Skills sind nach einem Neustart der
Sitzung verfügbar.

| Befehl | Zweck | Typische Eingabe | Bindet ein |
|---|---|---|---|
| `/deep-research` | Quellenbelegte Recherche mit Quellenbewertung | Frage, Tiefe | `general-purpose`, `Explore` |
| `/business-strategy` | Optionen, Bewertung, Empfehlung, Umsetzungsplan | Vorhaben, Ziel, Ressourcen | `general-purpose`, `Plan`, `/red-team` |
| `/financial-review` | Kennzahlen, Abweichungen, Liquidität, Maßnahmen | Finanzdaten, Zeitraum | `general-purpose` (Zweitberechnung), `/red-team` |
| `/contract-review` | Klauselprüfung mit Ampel und Änderungsvorschlägen | Vertrag, eigene Rolle | `general-purpose`, `/deep-research` |
| `/lead-generation` | Rechtskonforme, priorisierte B2B-Leadliste | Angebot, Zielkundenprofil | `general-purpose`, `/deep-research` |
| `/weekly-review` | Wochenrückblick und drei Prioritäten | Woche, Fokus | `Explore` |
| `/fitness-review` | Trainings- und Erholungstrends, Wochenplan | Datenexport, Ziel | (optional `general-purpose`) |
| `/build-app` | Spezifikation, Umsetzung, Tests, Übergabe | App- oder Feature-Beschreibung | `Plan`, `Explore`, `general-purpose`, `/final-audit` |
| `/red-team` | Gegenprüfung aus Angreifer- und Skeptikersicht | Plan, Dokument, System | `general-purpose` (Gegner-Rollen), `Explore` |
| `/final-audit` | Abschlussprüfung mit Anforderungsmatrix und Urteil | Ergebnis, Auftrag | `general-purpose`, `/red-team` |

**Spezialagenten:** `Explore`, `Plan` und `general-purpose` sind die eingebauten Agententypen von
Claude Code. Rollen wie „Gegner“ oder „Zweitprüfer“ entstehen allein durch den Auftrag an diese Agenten.

**Typische Ketten:**
- Entscheidung: `/deep-research` → `/business-strategy` → `/red-team`
- Software: `/build-app` → `/red-team` (Fokus Sicherheit) → `/final-audit`
- Wochenrhythmus: `/weekly-review` (Kennzahlen aus dem Wayne Command Center unter `/reports`)

**Verbindung zum Command Center:** Im Bereich *Agenten* lässt sich je Agent der passende
Skill-Befehl hinterlegen, z. B. `/deep-research`.

Alle Skills enthalten dieselben sieben Abschnitte: Zweck, Einsatz, Eingaben, Ablauf,
Spezialagenten, Qualitätskontrolle und Ausgabeformat.
